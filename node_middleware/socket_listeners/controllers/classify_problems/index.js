// classify_problems folder is responsible for classification problem type

var fs = require("fs");
var papa = require("papaparse");

function readCsvLabels(labelColName, file) {
  return new Promise(function(resolve, reject) {
    let stream = fs.createReadStream(file);
    papa.parse(stream, {
      header: true,
      error: function(err) {
        reject(err);
      },
      complete: function(results) {
        let labelSet = new Set();
        let labelMap = new Map();
        for (let i = 0; i < results.data.length; i++) {
          let label = results.data[i][labelColName];
          label = label.toLowerCase();
          let d3mIndex = results.data[i]["d3mIndex"];
          labelSet.add(label);
          labelMap.set(d3mIndex, label);
        }
        let labelList = Array.from(labelSet);
        labelList.sort();
        resolve({ labels: labelList, labelMap: labelMap });
      }
    });
  });
}

function createSetMatrix(numDims) {
  let matrix = [];
  for (let i = 0; i < numDims; i++) {
    let row = [];
    for (let j = 0; j < numDims; j++) {
      row.push([]);
    }
    matrix.push(row);
  }
  return matrix;
}

module.exports.set = function(session, socket) {
  // the name of the variable (column) to predict
  let labelColName = null;
  // gold labels are stored in here
  let goldData = null;
  let labelList = null;
  let labelToIndex = null;
  // semaphore for reading in the file
  let reading = false;

  function getGoldData() {
    let dataset = session.getCurrentDataset();
    let datasetPath = dataset.getDatasetPath(); // end with "_dataset"
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
        let groundTruthFile = datasetPath + "/tables/learningData.csv";
        // if (evaluationConfig.training_data_root.endsWith("/")) {
        //   groundTruthFile = evaluationConfig.training_data_root + "tables/learningData.csv"
        // } else {
        //   groundTruthFile = evaluationConfig.training_data_root + "/tables/learningData.csv"
        // }

        readCsvLabels(labelColName, groundTruthFile).then(result => {
          labelList = result.labels;
          labelToIndex = new Map();
          labelList.forEach((label, index) =>
            labelToIndex.set(label.toLowerCase(), index)
          );
          console.log(
            "classification: gold answers loaded; # labels: ",
            labelList.length
          );
          resolve((goldData = result.labelMap));
          reading = false;
        });
      }
    });
  }

  function doConfusionMatrixData(data) {
    let predictionFile = data.predictionFile;
    let modelId = data.modelId;
    readCsvLabels(labelColName, predictionFile).then(results => {
      // predicted: first index (rows); gold label: second index (columns)
      let matrix = createSetMatrix(labelList.length);
      for (let d3mIndex of results.labelMap.keys()) {
        try {
          let predicted_label = results.labelMap.get(d3mIndex);
          predicted_label = predicted_label.toLowerCase();
          let predicted_index = labelToIndex.get(predicted_label);
          let gold_label = goldData.get(d3mIndex);
          let gold_index = labelToIndex.get(gold_label);
          matrix[predicted_index][gold_index].push(d3mIndex);
        } catch (err) {
          console.log("problem reading results file: ", predictionFile);
          console.log(
            "label for instance " +
              d3mIndex +
              " is " +
              results.labelMap.get(d3mIndex) +
              ", but expected either of ",
            labelList
          );
        }
      }
      // console.log("FINAL MATRIX", matrix);
      socket.emit("returnConfusionMatrixData", {
        modelId: modelId,
        matrix: matrix,
        labels: labelList
      });
      console.log("returnConfusionMatrixData emitted!");
    });
  }

  function handleRequest(data) {
    let problem = session.getCurrentProblem();
    let problemSchema = problem.getProblemSchema();
    // problemSchema might be empty, so we have to run this here (to make sure we're in task 2)
    try {
      // old problem schema
      labelColName = problemSchema.inputs.data[0].targets[0].colName;
    } catch(err) {
      // new problem schema
      labelColName = problemSchema.targetFeature;
    }
    console.log(problemSchema, labelColName);
    getGoldData().then(res => {
      doConfusionMatrixData(data);
    });
  }

  socket.on("confusionMatrixData", handleRequest);
};
