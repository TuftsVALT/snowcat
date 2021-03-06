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
var datamartSearch = appRoot + "/controllers/datamart/search.py";
const sema = require("semaphore")(1);
const path = require("path");

module.exports.set = function(app, server, grpcClientWrapper, socket) {

  let rawData = null;
  let headers = [];

  // Parses through csv file 
  function getData() {
    return new Promise(function(resolve, reject) {
      let filepath = appRoot + "/output/outputDatamart.csv";
      // console.log("filepath is ", filepath)
      let stream = fs.createReadStream(filepath);
      papa.parse(stream, {
        // header: true,
        // dynamicTyping: true,
        error: function(error, file) {
          console.log("error reading file", file);
          console.log("error was ", error);
        },
        complete: function(results) {
          headers = results.data;
          resolve(headers);
        }
      });
    });
  }

  // Calls search python script, then passes output to getData function, and finally emits output of function to vue frontend
  function datamart(search, fn, sema) {
    let results = "";
    spawnChildProcess(
        "python3",
        [datamartSearch, search],
        data => results += data.toString(),
        function() {
          getData().then( (headers) => {
            socket.emit("datamartFrontend", headers);
            fn(headers);
            temp = search;
            sema.leave();
          });
        }
    );
  }
  
  // Receives search input and calls datamart function
  socket.on('datamartEndpoint', function(pagination, search, fn) {
    // take the semaphore when a new call comes in;
    sema.take(function() {
        datamart(search, fn, sema);
    })
  });
}
