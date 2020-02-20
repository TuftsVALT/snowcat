// The tabular data folder handles preprocessing and routing for tabular data preprocessing
var _ = require("lodash");
// var fs = require("fs");
const csv = require("csvtojson");
// var appRoot = require("app-root-path");
//var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
//var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var tabular_data = require("./tabular_data_preprocessing.js");
// var path = require("path");
// var papa = require("papaparse");

var preprocessTabularData = function(
  tabularDataResource,
  datasetSchema,
  dataFile,
  fn
) {
  var dataDescFile = datasetSchema;
  var dataCSVFile = dataFile;
  var tabularMetaData = {
    trainVarNames: [],
    trainVarTypes: []
  };

  var idx = 0;
  for (var i = 0; i < dataDescFile.dataResources.length; i++) {
    if (dataDescFile.dataResources[i].hasOwnProperty("columns")) {
      for (var j = 0; j < dataDescFile.dataResources[i].columns.length; j++) {
        if (dataDescFile.dataResources[i].columns[j].colName == "d3mIndex") {
          idx = i;
        }
      }
    }
  }
  for (var i = 0; i < dataDescFile.dataResources[idx].columns.length; i++) {
    tabularMetaData.trainVarNames.push(
      dataDescFile.dataResources[idx].columns[i].colName
    );
    tabularMetaData.trainVarTypes.push(
      dataDescFile.dataResources[idx].columns[i].colType
    );
  }

  csv({ ignoreEmpty: false, noheader: true })
    .fromFile(dataCSVFile)
    .on("json", (jsonObj, rowIndex) => {})
    .on("end_parsed", jsonArrObj => {
      var tabular_preprocessed_data = tabular_data.tabularRawDataPreprocessing(
        jsonArrObj,
        tabularMetaData
      );
      fn(tabular_preprocessed_data);
      console.log("End of Tabular data preprocessing");
    })
    .on("done", error => {
      console.log("End of data cvs file reading");
      console.log(error);
    });
};

module.exports.set = function(session, socket) {
  let handleData = function() {
    let dataset = session.getCurrentDataset();
    let datasetSchema = dataset.getDatasetSchema();
    let dataFile = dataset.getLearningDataFile();
    // TODO: Handle if there are multiple tables.  Right now we assume one table
    for (var i = 0; i < datasetSchema.dataResources.length; i++) {
      var dataResource = datasetSchema.dataResources[i];
      if (dataResource.resType == "table") {
        // This is assuming we have a single resource of type table
        // We have tabular data, we have to preprocess and send it
        preprocessTabularData(dataResource, datasetSchema, dataFile, data => {
          socket.emit("tabularDataProcessed", data);
        });
      }
    }
  };

  session.registerDatasetUpdates(function(dataset) {
    if (dataset) {
      handleData();
    } else {
      socket.emit("tabularDataProcessed", []);
    }
  });

  socket.on("handleTabularData", function() {
    if (session.getCurrentDataset()) {
      handleData();
    } else {
      socket.emit("tabularDataProcessed", []);
    }
  });
};
