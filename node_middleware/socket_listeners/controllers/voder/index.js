// voder is responisble for voder related data facts
var _ = require('lodash');
var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
var child_process = require('child_process');
var shell = require('shelljs');
var papa = require('papaparse');
var fs = require('fs');
const csv = require('csvtojson');
var appRoot = require('app-root-path');
var spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var initDataFileGenerator = appRoot + "/controllers/voder/dataGenerator/initDataFileGenerator.py"
var mainDataFileGenerator =  appRoot + "/controllers/voder/dataGenerator/mainDataFileGenerator.py"
var dataOutputDir = appRoot + "/static/local_testing_data/voder/";

function initProcessVoderData(dataCSVfile) {
    let results = "";
    spawnChildProcess(
        "python3",
        [initDataFileGenerator, dataCSVfile, dataOutputDir],
        data => results += data.toString(),
        function() {
          console.log("initialized Voder data", results);
        }
    );
}

function processVoderData(dataCSVfile, dataTypeMaps) {
    let results = "";
    spawnChildProcess(
        "python3",
        [mainDataFileGenerator, dataCSVfile, dataTypeMaps, dataOutputDir],
        data => results += data.toString(),
        function() {
          console.log("processed Voder data", results);
        }
    );
}

module.exports.set = function(app, server, socket) {

  socket.on('handleVoderDataFacts', function(fn) {
    var dataCSVfile = evaluationConfig.training_data_root + "/tables/learningData.csv"
    // var dataCSVfile = appRoot + "/static/local_testing_data/LL0_acled/LL0_acled_dataset/tables/learningData.csv"
    // initProcessVoderData(dataCSVfile)
    // var processedDataCSVfile = dataOutputDir + "cars.csv"
    var dataTypeMaps = dataOutputDir + "cars.json"
    processVoderData(dataCSVfile, dataTypeMaps);
  });
}
