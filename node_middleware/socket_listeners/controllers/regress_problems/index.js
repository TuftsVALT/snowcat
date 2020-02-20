// classify_problems folder is responsible for classification problem type
var fs = require("fs");
var papa = require("papaparse");

function readCsvValues(valueColName, file) {
  return new Promise(function(resolve, reject) {
    let stream = fs.createReadStream(file);
    papa.parse(stream, {
      header: true,
      error: function(err) {
        reject(err);
      },
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
      let residual = Math.abs(predicted.get(d3mIndex) - gold.get(d3mIndex));
      residualMap.set(d3mIndex, residual);
    } else {
      console.log(
        "WARNING: d3mIndex " +
          d3mIndex +
          " in results data, but not in gold data; ignoring."
      );
    }
  }
  return residualMap;
}

module.exports.set = function(session, socket) {
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
          if (!reading) {
            // are wer still reading?
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
        let dataset = session.getCurrentDataset();
        let datasetPath = dataset.getDatasetPath();
        let groundTruthFile = datasetPath + "/tables/learningData.csv";

        // if (evaluationConfig.training_data_root.endsWith("/")) {
        //   groundTruthFile = evaluationConfig.training_data_root + "tables/learningData.csv"
        // } else {
        //   groundTruthFile = evaluationConfig.training_data_root + "/tables/learningData.csv"
        // }
        readCsvValues(valueColName, groundTruthFile).then(valueMap => {
          console.log("regression: gold answers loaded");
          resolve((goldData = valueMap));
          reading = false;
        });
      }
    });
  }

  function doResiduals(data) {
    let predictionsFile = data.fileUri;
    readCsvValues(valueColName, predictionsFile).then(results => {
      let residuals = getResiduals(results, goldData);
      let d3mIndices = Array.from(residuals.keys());
      let residualArray = [];
      d3mIndices.forEach(index => residualArray.push(residuals.get(index)));
      socket.emit("model_return_regres", {
        status: "success",
        outData: residualArray,
        id: data.index,
        indices: d3mIndices
      });
    });
  }

  function handleRequest(data) {
    let problem = session.getCurrentProblem();
    let problemSchema = problem.getProblemSchema();
    valueColName = problemSchema.inputs.data[0].targets[0].colName;
    getGoldData().then(res => {
      doResiduals(data);
    });
  }

  socket.on("load-regress-data", handleRequest);
};
