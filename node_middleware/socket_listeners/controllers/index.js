const commander = require("../commander");

module.exports.set = function(session, socket) {
  commander.set(session, socket);

  session.registerDatasetUpdates(dataset => {
    if (dataset) {
      // console.log("dataDescFinished emit", dataset.getDatasetSchema());
      socket.emit("dataDescFinished", dataset.getDatasetSchema());
    } else {
      console.log("dataDescFinished emit null");
      socket.emit("dataDescFinished", null);
    }
  });

  session.registerProblemUpdates(problem => {
    // is the problem the original problem from the dataset? yes if it comes from a file.
    try {
      let orig = problem.getProblemPath() ? true : false;
      let problemSchema = problem.getProblemSchema();
      socket.emit("serveProblemFinished", { problemSchema, orig } );
    } catch(err){
      console.log("problemSchema is null")
      socket.emit("serveProblemFinished", { problemSchema:null, orig:false } );
    }
  });

  // copy your routes listed in your app.js directly into here
  // let io = require("socket.io")(server, { origins: "*:*" });
  // let ta2Wrapper = null;
  // if (!devMode) {
  //   ta2Wrapper = new WrapperWrapper();
  //   ta2Wrapper.init();
  // }

  let datasetC = require("./datasetC");
  datasetC.set(session, socket);

  let datamart = require("./datamart_nyu");
  datamart.set(session, socket);

  let dataaug_wikidata = require("./dataaug_wikidata");
  dataaug_wikidata.set(session, socket);

  // let datamartISI = require("./datamart_isi");
  // datamartISI.set(session, socket);

  let raw_table = require("./raw_table");
  raw_table.set(session, socket);

  // let video_data = require("./video_data");
  // video_data.set(session, socket);

  let audio_data = require("./audio_data");
  audio_data.set(session, socket);

  let tabular_data = require("./tabular_data");
  tabular_data.set(session, socket);

  let discovery_problem_set = require("./discovery_problem_set");
  discovery_problem_set.set(session, socket);

  let graph_data = require("./graph_data");
  graph_data.set(session, socket);

  // let text_data = require("./text_data");
  // text_data.set(session,socket);

  let image_data = require("./image_data");
  image_data.set(session, socket);

  // let timeseries_data = require("./timeseries_data");
  // timeseries_data.set(session,socket);

  let classify_problems = require("./classify_problems");
  classify_problems.set(session, socket);

  let regress_problems = require("./regress_problems");
  regress_problems.set(session, socket);

  // let collaborative_filtering_problems = require("./collaborative_filtering_problems");
  // collaborative_filtering_problems.set(
  //   app,
  //   server,
  //   socket
  // );
  /*
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
*/
  // function sendPredictions(file, response) {
  //   console.log("sending prediction ", file, response);
  //   // For now, we assume fileuri is a CSV
  //   // TODO handle different file types
  //   // TODO correct interpretation of fileuri
  //   file = file.replace(/^(file:\/\/)/, "");
  //   var stream = fs.createReadStream(handleUrl(file));
  //   papa.parse(stream, {
  //     header: true,
  //     error: function(err) {
  //       console.log("sendPredictions parsing error for file", file);
  //       console.log("error is", file);
  //     },
  //     complete: function(results) {
  //       response.results = results.data;
  //       response.fileUri = file;
  //       socket.emit("modelFinished", response);
  //     }
  //   });
  // }

  // Node connections for createPipelinesRequest
  // socket.on("createPipelines", () => {
  //   if (devMode) {
  //     let i = 0;
  //     let performanceMetric =
  //       problemSchema.inputs &&
  //       problemSchema.inputs &&
  //       problemSchema.inputs.performanceMetrics &&
  //       problemSchema.inputs.performanceMetrics[0];
  //     let metricName = performanceMetric
  //       ? performanceMetric.metric
  //       : "Metric";
  //     let folder = path.dirname(__dirname);
  //     session
  //       .getDataSet()
  //       .get_model_output_prediction_files()
  //       .forEach(function(file) {
  //         // TODO: again, must only serve as much data as the frontend can load.
  //         // Also, may want to change csv into JSON
  //         let absFilePath = path.join(folder, file);
  //         let fakePipeline = { id: file, scores: {} };
  //         fakePipeline.scores[metricName] = Math.random();
  //         sendPredictions(absFilePath, fakePipeline);
  //       });
  //     socket.emit("backendFinished");
  //   } else {
  //     ta2Wrapper.createPipelines();
  //   }
  // });

  /*
    function serveRawData() {
      let filepath = session.getCurrentDataset().getLearningDataFile();
      console.log("filepath is ", filepath);

      // TODO - We should be sending the raw data to the front end for all types of problems,
      // but experienced memory issues with large datasets in Vue.  We tried Object.freeze() on
      // those objects, but it didn't solve the issue.
      // For now, the only visualizations that are using the rawData collection are the graph visualizations
      if (
        _.some(session.getCurrentDataset().getSchema().dataResources, function(each) {
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
    }*/
};
