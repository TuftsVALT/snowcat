var papa = require("papaparse");
var fs = require("fs");
var appRootPath = require("app-root-path");
var spawnChildProcess = require(appRootPath + "/lib/js/spawnChildProcess");
var datamartSearch = appRootPath + "/socket_listeners/controllers/datamart_nyu/search.py";
const sema = require("semaphore")(1);

let datamart_url = 'https://datamart.d3m.vida-nyu.org';
if ("DATAMART_URL_NYU" in process.env) {
  datamart_url = process.env["DATAMART_URL_NYU"];
}
let output_dir = appRootPath + "/output/";
if ("D3MOUTPUTDIR" in process.env) {
  output_dir = process.env["D3MOUTPUTDIR"];
}
module.exports.set = function(session, socket) {
  let headers = [];
  // Parses through csv file 
  function getData() {
    return new Promise(function(resolve, reject) {
      let filepath = appRootPath + "/output/outputDatamart.csv";
      if (process.env["D3MOUTPUTDIR"]){
        filepath = process.env["D3MOUTPUTDIR"] + "/outputDatamart.csv";
      }
      if (!fs.existsSync(filepath)) {
        fs.closeSync(fs.openSync(filepath, 'w'));
      }
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
  function datamart(
    search,
    augment,
    index,
    iter,
    fn,
    sema,
    dataset_file,
    datamart_url,
    output_dir
  ) {
    let results = "";
    console.log("search term is", search);
    console.log("augment select is", augment);
    console.log("selected index is", index);
    console.log("augment iteration is", iter);
    console.log("dataset file is", dataset_file);
    console.log("datamart url is", datamart_url);
    console.log("output dir is", output_dir);
    spawnChildProcess(
      "python3",
      [datamartSearch, search, augment, index, iter, dataset_file, datamart_url, output_dir],
      data => (results += data.toString()),
      function() {
        getData().then(headers => {
          socket.emit("datamartFrontend", headers);
          fn(headers);
          // Sends new path if there was a valid augmentation
          if(augment == true) {
            let outputPath = appRootPath + "/output/augment_data/augment" + iter;
            if (process.env["D3MOUTPUTDIR"]){
              outputPath = process.env["D3MOUTPUTDIR"] + "/augment_data/augment" + iter;
            }
            if(fs.existsSync(outputPath)) {
              socket.emit("newDataset", outputPath)    
            }
            console.log("newDataset emitted. outputPath:",outputPath)
          }
          sema.leave();
        });
      }
    );
  }

  // Receives search input and calls datamart function
  socket.on("datamartEndpoint", function(
    pagination,
    search,
    augment,
    index,
    iter,
    fn
  ) {
    // take the semaphore when a new call comes in;
    let dataset = session.getCurrentDataset();
    if (dataset) {
      let datasetPath = dataset.getDatasetPath();
      let dataset_file = datasetPath + "/datasetDoc.json";
      sema.take(function() {
        datamart(search, augment, index, iter, fn, sema, dataset_file, datamart_url, output_dir);
      });
    } else {
      console.log("dataset is NULL!!");
    }
  });
};
