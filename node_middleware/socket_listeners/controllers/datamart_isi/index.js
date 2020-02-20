var papa = require('papaparse');
var fs = require('fs');
var appRootPath = require('app-root-path');
var spawnChildProcess = require(appRootPath + "/lib/js/spawnChildProcess");
var datamartSearchISI = appRootPath + "/socket_listeners/controllers/datamart_isi/search.py";
const sema = require("semaphore")(1);

module.exports.set = function(session, socket) {
  let headers = [];
  // Parses through csv file 
  function getDataISI() {
    return new Promise(function(resolve, reject) {
      let filepath = appRootPath + "/output/outputDatamartISI.csv";
      let stream = fs.createReadStream(filepath);
      papa.parse(stream, {
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
  function datamartISI(search, augment, index, iter, fn, sema, dataset_file) {
    let results = "";
    console.log("search term is", search);
    console.log("augment is", augment);
    console.log("selected index", index);
    console.log("augment iteration", iter);
    console.log("dataset file", dataset_file);
    spawnChildProcess(
        "python3",
        [datamartSearchISI, search, augment, index, iter, dataset_file],
        data => results += data.toString(),
        function() {
          getDataISI().then( (headers) => {
            socket.emit("datamartFrontendISI", headers);
            fn(headers);
            sema.leave();
          });
        }
    );
  }
  
  // Receives search input and calls datamart function
  socket.on('datamartEndpointISI', function(pagination, search, augment, index, iter, fn) {
    // take the semaphore when a new call comes in;
    let dataset = session.getCurrentDataset();
    if (dataset) {
      let datasetPath = dataset.getDatasetPath();
      let dataset_file = datasetPath + "/datasetDoc.json";
      sema.take(function() {
        datamartISI(search, augment, index, iter, fn, sema, dataset_file);
      });
    } else {
      console.log("dataset is NULL!!");
    }
  });
};