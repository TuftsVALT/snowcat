const fs = require("fs");
const path = require("path");
const appRootPath = require("app-root-path");
const relay = require(appRootPath + "/relay");
const sendPredictions = require("./sendPredictions");

function createPipelines(session, socket) {
  console.log("received socket request for create pipelines");
  // If running mode is development, we just return, one at a time, the specified
  // model output files.  Otherwise, we call out to TA2s.
  let herald = session.getCurrentHerald();
  let problemSchema = herald.getProblem().getProblemSchema();
  // console.log("node_backend_appp", model_output_prediction_files);
  if (session.devMode) {
    var i = 0;
    var performanceMetric =
      problemSchema.inputs &&
      problemSchema.inputs &&
      problemSchema.inputs.performanceMetrics &&
      problemSchema.inputs.performanceMetrics[0];
    var metricName = performanceMetric ? performanceMetric.metric : "Metric";
    let folder = path.dirname(__dirname);
    herald.devSolutions.forEach(function(file) {
      // TODO: again, must only serve as much data as the frontend can load.
      // Also, may want to change csv into JSON
      let absFilePath = path.join(appRootPath.toString(), file);
      var fakePipeline = { id: file, scores: {} };
      fakePipeline.scores[metricName] = Math.random();
      sendPredictions(socket, absFilePath, fakePipeline, herald);
    });
    socket.emit("backendFinished");
  } else {
    // do all the pipeline logic
    // TODO: clean up, improve, move to separate file, ...
    // let localPrefix = appRootPath;
    let herald = session.getCurrentHerald();
    relay.connect(herald);

    relay
      .helloLoop(herald)
      .then(relay.searchSolutions)
      .then(relay.scoreSolutions)
      .then(relay.describeSolutions)
      .then(relay.fitSolutions)
      .then(relay.produceSolutions)
      // .then(relay.endSearchSolutions)
      // .then(console.log)
      .then(relay.exportFittedSolutions)
      .then(function() {
        herald.getSolutions().forEach(function(solution) {
          console.log(solution);
          console.log("--==========--");
          // console.log(session.sessionVar.solutions.get(solution_id))

          if (solution.fit) {
            let outputCsv = solution.fit.outputCsv;
            if (outputCsv) {
              // console.log("OUTPUTCSV", solution.fit.outputCsv);
              let pipeline = {};
              pipeline.id = solution.solution_id;
              pipeline.scores = solution.scores;
              pipeline.results = [];

              // let firstElement = "/" + outputCsv.split("/")[1];
              // let outputPath = fs.existsSync(firstElement)
              //   ? solution.fit.outputCsv
              //   : process.env["D3MOUTPUTDIR"] +"/.." +solution.fit.outputCsv;
              let outputPath = appRootPath + outputCsv; // I need to discuss this -Cong

              pipeline.fileUri = outputPath;
              // socket.emit("modelFinished", pipeline);
              sendPredictions(socket, outputPath, pipeline, herald);
            }
          }
        });
        socket.emit("backendFinished");
      })
      .catch(err => {
        console.log("PIPELINE FAILED!", err);
        socket.emit("pipelineFailed");
      });

    /*
        session.runCreatePipelines(evaluationConfig.dataset_schema, function (pipeline) {
          console.log("received results; sending to frontend");
          sendPredictions(pipeline.predict_result_uri, pipeline);
          //session.runExportPipeline(pipeline.id, function() {
            //console.log("received results; sending to frontend");
            //sendPredictions(pipeline.predict_result_uri, pipeline);
          //});
        }, function () {
          console.log("pipeline failed");
          socket.emit('pipelineFailed');
        });
        */
  }
}

module.exports = createPipelines;
