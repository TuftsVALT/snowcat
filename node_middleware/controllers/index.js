// The controllers folder is responsible for all business logic connecting with the frontend.
var _ = require("lodash");
var handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};
var shell = require("shelljs");
var papa = require("papaparse");
var fs = require("fs");
var appRoot = require("app-root-path");
var path = require("path");
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
try {
  var problemSchema = require(handleUrl(evaluationConfig.problem_schema));
} catch (err) {
  console.log("warning: no problem schema file available");
  var problemSchema = {};
}
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var jsonfile = require("jsonfile");

module.exports.set = function(app, server, grpcClientWrapper) {
  // copy your routes listed in your app.js directly into here
  var io = require("socket.io")(server, { origins: "*:*" });

  io.on("connection", function(socket) {
    // send evaluation config to front end
    console.log("CONNECTION!!!!");
    socket.emit("evalConfig", evaluationConfig);

    let datamart = require("./datamart");
    datamart.set(app, server, grpcClientWrapper, socket);

    let raw_table = require("./raw_table");
    raw_table.set(app, server, grpcClientWrapper, socket);

    let video_data = require("./video_data");
    video_data.set(app, server, grpcClientWrapper, socket);

    let audio_data = require("./audio_data");
    audio_data.set(app, server, grpcClientWrapper, socket);

    let tabular_data = require("./tabular_data");
    tabular_data.set(app, server, grpcClientWrapper, socket);

    let discovery_problem_set = require("./discovery_problem_set");
    discovery_problem_set.set(app, server, grpcClientWrapper, socket);

    let graph_data = require("./graph_data");
    graph_data.set(app, server, grpcClientWrapper, socket);

    let text_data = require("./text_data");
    text_data.set(app, server, grpcClientWrapper, socket);

    let image_data = require("./image_data");
    image_data.set(app, server, grpcClientWrapper, socket);

    let timeseries_data = require("./timeseries_data");
    timeseries_data.set(app, server, grpcClientWrapper, socket);

    let classify_problems = require("./classify_problems");
    classify_problems.set(app, server, grpcClientWrapper, socket);

    let regress_problems = require("./regress_problems");
    regress_problems.set(app, server, grpcClientWrapper, socket);

    let collaborative_filtering_problems = require("./collaborative_filtering_problems");
    collaborative_filtering_problems.set(
      app,
      server,
      grpcClientWrapper,
      socket
    );

    socket.on("exportSolution", function(selectedModel) {
      try {
        grpcClientWrapper.exportFittedSolution(
          grpcClientWrapper.sessionVar,
          selectedModel
        );
      } catch (err) {
        console.log("WARNING: solution export failed!", err);
      }
    });

    function sendPredictions(file, response) {
      console.log("sending prediction ", file, response);
      // For now, we assume fileuri is a CSV
      // TODO handle different file types
      // TODO correct interpretation of fileuri
      file = file.replace(/^(file:\/\/)/, "");
      var stream = fs.createReadStream(handleUrl(file));
      papa.parse(stream, {
        header: true,
        error: function(err) {
          console.log("sendPredictions parsing error for file", file);
          console.log("error is", file);
        },
        complete: function(results) {
          response.results = results.data;
          response.fileUri = file;
          socket.emit("modelFinished", response);
        }
      });
    }

    // Node connections for createPipelinesRequest
    socket.on("createPipelines", function() {
      console.log("received socket request for create pipelines");
      // If running mode is development, we just return, one at a time, the specified
      // model output files.  Otherwise, we call out to TA2s.
      console.log(
        "node_backend_appp",
        evaluationConfig.running_mode,
        evaluationConfig.model_output_prediction_files
      );
      if (evaluationConfig.running_mode == "development") {
        var i = 0;
        var performanceMetric =
          problemSchema.inputs &&
          problemSchema.inputs &&
          problemSchema.inputs.performanceMetrics &&
          problemSchema.inputs.performanceMetrics[0];
        var metricName = performanceMetric
          ? performanceMetric.metric
          : "Metric";
        let folder = path.dirname(__dirname);
        evaluationConfig.model_output_prediction_files.forEach(function(file) {
          // TODO: again, must only serve as much data as the frontend can load.
          // Also, may want to change csv into JSON
          let absFilePath = path.join(folder, file);
          var fakePipeline = { id: file, scores: {} };
          fakePipeline.scores[metricName] = Math.random();
          sendPredictions(absFilePath, fakePipeline);
        });
        socket.emit("backendFinished");
      } else {
        // do all the pipeline logic
        // TODO: clean up, improve, move to separate file, ...

        let localPrefix = appRoot;

        grpcClientWrapper
          .searchSolutions(grpcClientWrapper.sessionVar)
          .then(grpcClientWrapper.scoreSolutions)
          .then(grpcClientWrapper.describeSolutions)
          .then(grpcClientWrapper.fitSolutions)
          .then(grpcClientWrapper.produceSolutions)
          // .then(grpcClientWrapper.endSearchSolutions)
          // .then(console.log)
          .then(grpcClientWrapper.exportFittedSolutions)
          .then(function(sessionVar) {
            sessionVar.solutions.forEach(function(solution) {
              console.log(solution);
              console.log("--==========--");
              // console.log(grpcClientWrapper.sessionVar.solutions.get(solution_id))

              if (solution.fit) {
                let outputCsv = solution.fit.outputCsv;
                if (outputCsv) {
                  // console.log("OUTPUTCSV", solution.fit.outputCsv);
                  let pipeline = {};
                  pipeline.id = solution.solution_id;
                  pipeline.scores = solution.scores;
                  pipeline.results = [];
                  let firstElement = "/" + outputCsv.split("/")[1];
                  let outputPath = fs.existsSync(firstElement)
                    ? solution.fit.outputCsv
                    : localPrefix + solution.fit.outputCsv;
                  pipeline.fileUri = outputPath;
                  // socket.emit("modelFinished", pipeline);
                  sendPredictions(outputPath, pipeline);
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
        grpcClientWrapper.runCreatePipelines(evaluationConfig.dataset_schema, function (pipeline) {
          console.log("received results; sending to frontend");
          sendPredictions(pipeline.predict_result_uri, pipeline);
          //grpcClientWrapper.runExportPipeline(pipeline.id, function() {
            //console.log("received results; sending to frontend");
            //sendPredictions(pipeline.predict_result_uri, pipeline);
          //});
        }, function () {
          console.log("pipeline failed");
          socket.emit('pipelineFailed');
        });
        */
      }
    });

    function serveRawData() {
      var filepath = path.join(
        evaluationConfig.training_data_root,
        "tables/learningData.csv"
      );
      console.log("filepath is ", filepath);

      // TODO - We should be sending the raw data to the front end for all types of problems,
      // but experienced memory issues with large datasets in Vue.  We tried Object.freeze() on
      // those objects, but it didn't solve the issue.
      // For now, the only visualizations that are using the rawData collection are the graph visualizations
      if (
        _.some(datasetSchema.dataResources, function(each) {
          return each.resType === "graph";
        })
      ) {
        var stream = fs.createReadStream(filepath);
        papa.parse(stream, {
          header: true,
          complete: function(results) {
            var dataLookup = {};
            var row;
            for (var i = 0; i < results.data.length; i++) {
              row = results.data[i];
              dataLookup[row.d3mIndex] = {};
              dataLookup[row.d3mIndex].data = row;
            }
            socket.emit("rawDataFinished", dataLookup);
          }
        });
      }
    }

    socket.on("serveData", function() {
      var signalEmitted = false;
      console.log("IN SERVE DATA");
      if (evaluationConfig.running_mode == "development") {
        socket.emit("backendConnected");
        signalEmitted = true;
      } else {
        setInterval(function() {
          // console.log("grpcClientWrapper.sessionVar: ", grpcClientWrapper.sessionVar);
          if (
            !_.isEmpty(grpcClientWrapper.sessionVar) &&
            grpcClientWrapper.sessionVar.connected &&
            !signalEmitted
          ) {
            socket.emit("backendConnected");
            signalEmitted = true;
          }
        }, 5000);
      }
      // TODO - only serve as much data as the frontend can load.  Check for
      // file size above a MB or so?
      socket.emit("serveProblemFinished", problemSchema);
      socket.emit("dataDescFinished", datasetSchema);
      serveRawData();
    });

    socket.on("create-executable", function(pipelineId) {
      grpcClientWrapper.runExportPipeline(pipelineId);
    });
  });
};
