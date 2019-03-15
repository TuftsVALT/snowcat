// collaborative_filtering_problem folder is responsible for colalborative filtering problem type
var _ = require('lodash');
const fs = require("fs");
const papa = require("papaparse");
var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
var appRoot = require('app-root-path');
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
try {
  var problemSchema = require(handleUrl(evaluationConfig.problem_schema));
} catch(err) {
  console.log("warning: no problem schema file available");
  var problemSchema = { };
}
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));

function readCsvValues(valueColName, file) {
  return new Promise(function(resolve, reject) {
    let stream = fs.createReadStream(file);
    papa.parse(stream, {
      header: true,
      error: function(err) { reject(err); },
      complete: function(results) {
        let valueMap = new Map();
        for (let i = 0; i < results.data.length; i++) {
          let value = Number(results.data[i][valueColName]);
          let d3mIndex = results.data[i]["d3mIndex"];
          valueMap.set(d3mIndex, value);
        }
        resolve(valueMap);
      }
    });
  });
}

function getResiduals(predicted, gold) {
  let residualMap = new Map();
  for (let d3mIndex of predicted.keys()) {
    if (gold.has(d3mIndex)) {
      let residual = predicted.get(d3mIndex) - gold.get(d3mIndex);
      residualMap.set(d3mIndex, residual);
    } else {
      console.log("WARNING: d3mIndex " + d3mIndex + " in results data, but not in gold data; ignoring.");
    }
  }
  return residualMap;
}

module.exports.set = function(app, server, grpcClientWrapper, socket) {

  // the name of the variable (column) to predict
  let valueColName = null;
  // gold labels are stored in here
  let goldData = null;
  // semaphore for reading in the file
  let reading = false;

  function getGoldData() {
    return new Promise(function(resolve, reject) {
      if (reading) {
        let interval = setInterval(function() {
          if (!reading) { // are wer still reading?
            clearInterval(interval);
            console.log("AFTER WAIT: DON'T READ");
            resolve(goldData);
          }
        }, 1000);
      } else if (goldData) {
        // console.log("DON'T READ");
        resolve(goldData);
      } else {
        // console.log("READ");
        reading = true;
        let groundTruthFile;
        if (evaluationConfig.training_data_root.endsWith("/")) {
          groundTruthFile = evaluationConfig.training_data_root + "tables/learningData.csv"
        } else {
          groundTruthFile = evaluationConfig.training_data_root + "/tables/learningData.csv"
        }
        readCsvValues(valueColName, groundTruthFile)
          .then(valueMap => {
            console.log("collaborative filtering: gold answers loaded, # of rows: ", valueMap.size);
            resolve(goldData = valueMap);
            reading = false;
          });
      }
    });
  }

  function doResiduals(data) {
    let predictionsFile = data.fileUri;
    let modelId = data.modelId;
    readCsvValues(valueColName, predictionsFile)
      .then(results => {
        console.log("collaborative filtering: predictions file", predictionsFile, "loaded, # of rows: ", results.size);
        let residuals = getResiduals(results, goldData);
        let d3mIndices = Array.from(residuals.keys());
        let resultsArray = [];
        d3mIndices.forEach(index => {
          resultsArray.push({
            d3mIndex: index,
            pred: results.get(index),
            delta: residuals.get(index),
          });
        });
        console.log("return model ", data.modelId);
        socket.emit("processCollaborativeFinished", {
          predictionsData: resultsArray,
          modelId: modelId
        });
      });
  }

  function handleRequest(data) {
    valueColName = problemSchema.inputs.data[0].targets[0].colName;
    console.log("HANDLE REQUEST CALLED", data);
    getGoldData().then(res => {
      doResiduals(data);
    });
  }

  //Node connection for pre-processing collaborative filtering predictions for visualization
  socket.on("processCollaborativeFiltering", handleRequest);

}
