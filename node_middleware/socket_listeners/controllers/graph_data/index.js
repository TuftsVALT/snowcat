// graph_data folder is responsible for graph raw data, and graph task types
var _ = require("lodash");
// var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
// var child_process = require('child_process');
// var shell = require('shelljs');
// var papa = require('papaparse');
// var fs = require('fs');
// const csv = require('csvtojson');
const appRootPath = require("app-root-path");
const relay = require(appRootPath + "/relay");
const handleUrl = relay.handleUrl;
var spawnChildProcess = require(appRootPath + "/lib/js/spawnChildProcess");

module.exports.set = function(session, socket) {
  // session.registerDatasetUpdates(dataset => {
  //   if (dataset) {
  //     handleImageData(session, socket);
  //   } else {
  //     //
  //   }
  // });
  socket.on("handleGraphData", function(fn) {
    let dataset = session.getCurrentDataset();
    let datasetSchema = dataset.getDatasetSchema();
    //store all resources that are of type graph
    var graphResources = {};
    datasetSchema.dataResources.forEach(function(each) {
      if (each.resType === "graph") {
        graphResources[each.resID] = each;
      }
    });

    function readGraph(resource, callback) {
      var file = handleUrl(dataset.getDatasetPath() + "/" + resource.resPath);
      // var file = handleUrl(evaluationConfig.training_data_root + '/' + resource.resPath);
      console.log("loading graph: " + file);
      console.log(
        "running command",
        appRootPath + "/lib/python/convert_gml.py"
      );
      let results = "";
      spawnChildProcess(
        "python3",
        [appRootPath + "/lib/python/convert_gml.py", file],
        data => (results += data.toString()),
        function() {
          resource.data = JSON.parse(results);
          callback(resource);
        }
      );
    }

    function readGraphs(graphResources, callback) {
      var graphs = {};
      var count = 0;
      //collect all callbacks and then do final callback
      function dec() {
        if (--count <= 0) {
          callback(graphs);
        }
      }
      for (var resID in graphResources) {
        count++;
        readGraph(graphResources[resID], function(results) {
          graphs[results.resID] = results;
          dec();
        });
      }
    }

    //find the columns in the training data that refer to objects in the graph
    //for now we only handle tabular data for that restricted to one table TODO: extend?
    function getGraphColumns(res) {
      var retCols = [];
      res.forEach(function(each) {
        if (each.refersTo) {
          if (each.refersTo.resID in graphResources) {
            retCols.push(each);
          }
        }
      });
      return retCols;
    }
    function getTargetColumn(res) {
      var retCol = null;
      res.forEach(function(each) {
        if (each.role.indexOf("suggestedTarget") >= 0) {
          retCol = each;
        }
      });
      return retCol;
    }
    function getNodeColumn(res) {
      var retCol = null;
      res.forEach(function(each) {
        if (each.refersTo && each.refersTo.resObject == "node") {
          retCol = each;
        }
      });
      return retCol;
    }

    var graphColumns = null;
    var tableResource = null;
    //Array.some to get only one table that references graph objects
    datasetSchema.dataResources.some(function(each) {
      if (each.resType == "table") {
        var refGraph = getGraphColumns(each.columns);
        if (refGraph.length > 0) {
          graphColumns = refGraph;
          tableResource = each;
          return true;
        }
      }
      return false;
    });

    //What are the things in the dataset? TODO: this is hacky.
    //Also: we only support 1 or 2 graphs for comDet, graphMatch, and linkPred
    if (Object.keys(graphResources).length == 1) {
      if (graphColumns.length == 1) {
        //vertex nomination or clustering
        readGraphs(graphResources, function(results) {
          fn({
            type: "vertexNominationOrClustering",
            nodeIdColumn: getNodeColumn(tableResource.columns).colName,
            predictionTarget: getTargetColumn(tableResource.columns).colName,
            resources: results
          });
        });
      }
      if (graphColumns.length == 2) {
        if (graphColumns[0].refersTo.resID === graphColumns[1].refersTo.resID) {
          //link prediction
          console.log("link prediction");
          readGraphs(graphResources, function(results) {
            fn({
              type: "linkPrediction",
              predictionTarget: getTargetColumn(tableResource.columns).colName,
              sourceID: graphColumns[0].colName,
              targetID: graphColumns[1].colName,
              resources: results
            });
          });
        }
      }
    }
    if (Object.keys(graphResources).length == 2) {
      if (graphColumns.length == 2) {
        if (graphColumns[0].refersTo.resID !== graphColumns[1].refersTo.resID) {
          //graph matching
          console.log("graph matching");
          readGraphs(graphResources, function(results) {
            fn({
              type: "graphMatching",
              predictionTarget: getTargetColumn(tableResource.columns).colName,
              sourceID: graphColumns[0].colName,
              targetID: graphColumns[1].colName,
              sourceRes: graphColumns[0].refersTo.resID,
              targetRes: graphColumns[1].refersTo.resID,
              resources: results
            });
          });
        }
      }
    }
  });
};
