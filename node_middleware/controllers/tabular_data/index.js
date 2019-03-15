// The tabular data folder handles preprocessing and routing for tabular data preprocessing
var _ = require('lodash');
var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
var fs = require('fs');
const csv = require('csvtojson');
var appRoot = require('app-root-path');
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var tabular_data = require("./tabular_data_preprocessing.js");
var path = require('path');
var papa = require('papaparse');


var preprocessTabularData = function (tabularDataResource, fn) {
    var dataDescFile = datasetSchema;
    var dataCSVFile = evaluationConfig.training_data_root + '/tables/learningData.csv';
    var tabularMetaData = {
      trainVarNames: [],
      trainVarTypes: []
    };

    var idx = 0;
    for(var i = 0; i < dataDescFile.dataResources.length; i++){
      if(dataDescFile.dataResources[i].hasOwnProperty('columns')){
          for(var j = 0; j < dataDescFile.dataResources[i].columns.length; j++){
              if(dataDescFile.dataResources[i].columns[j].colName == "d3mIndex"){
                    idx = i;
              }
          }
      }
    }
    for(var i = 0; i < dataDescFile.dataResources[idx].columns.length; i++){
        tabularMetaData.trainVarNames.push(dataDescFile.dataResources[idx].columns[i].colName);
        tabularMetaData.trainVarTypes.push(dataDescFile.dataResources[idx].columns[i].colType);
    }


    csv({ignoreEmpty:false, noheader:true})
              .fromFile(dataCSVFile)
              .on('json', (jsonObj, rowIndex) =>{
              })
              .on('end_parsed', (jsonArrObj)=>{
                  var tabular_preprocessed_data = tabular_data.tabularRawDataPreprocessing(jsonArrObj, tabularMetaData);
                  fn(tabular_preprocessed_data);
                  console.log("End of Tabular data preprocessing");
              })
              .on('done', (error)=>{
                console.log("End of data cvs file reading");
                console.log(error);
              });

}

module.exports.set = function(app, server, grpcClientWrapper, socket) {

  socket.on('handleTabularData', function(fn) {

    // TODO: Handle if there are multiple tables.  Right now we assume one table
    for (var i=0; i<datasetSchema.dataResources.length; i++) {
      var dataResource = datasetSchema.dataResources[i];
      if ( dataResource.resType == "table" ) {
        // This is assuming we have a single resource of type table
        // We have tabular data, we have to preprocess and send it
        preprocessTabularData( dataResource, (data) => { socket.emit("tabularDataProcessed", data); } );
      }
    }
  });

}
