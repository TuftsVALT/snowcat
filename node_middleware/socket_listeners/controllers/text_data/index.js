// text_data folder is responsible for raw text data
var _ = require('lodash');
var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
var appRoot = require('app-root-path');
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
const fs = require("fs");
//Text data pre-processing
var text_data = require("./text_data_process.js");

var textContentRetrieve = function(fileName, index, id, completeCallback) {

  fs.readFile(fileName, "utf8", function(err, data) {
    if (err) {
      console.log("error reading file", fileName, err);
      completeCallback("error reading file " + fileName, index);
    } else {
      completeCallback(data, index);
    }
  });

};

module.exports.set = function(app, server, socket) {
  socket.on("load-text-data", function() {
    console.log("loading text data");

    // Find text resource
    // TODO - do we want to do _.filter here in case there are multiple text resources?
    // If so, we would need to update the frontend to keep track of the resource IDs
    var textDataResource = _.find(datasetSchema.dataResources, (res) => { return res.resType == "text"; } );

    if ( textDataResource ) {
      var func = function(dataSend) {
        var fileName = dataSend["fileName"];
        var jsdataIndex = dataSend["index"];
        var jsId = dataSend["id"];
        textContentRetrieve(fileName, jsdataIndex, jsId, function(dataFinal,jsdataIndex
        ) {
          socket.emit("text_content_return", {
            results: dataFinal,
            index: jsdataIndex,
            id: jsId
          });
        });

      };
      var dataText = text_data.loadDataAndSendText(evaluationConfig.training_data_root + "/" + textDataResource.resPath, evaluationConfig.training_data_root + "/tables/learningData.csv", func);
    }
  });

}
