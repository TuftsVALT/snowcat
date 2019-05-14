"use strict";
var path = require("path");
var express = require("express");
var logger = require("morgan");
var console = require("console");
var papa = require("papaparse");
var fs = require("fs");
var shell = require("shelljs");
var _ = require("lodash");
var appRoot = require("app-root-path");
var parseArgs = require("minimist");
var handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};

//rewrite config file if necessary
var tinyconf = require("./lib/js/vendor/tinyconf");
try {
  var configPaths = [require.resolve("./tufts_gt_wisc_configuration.json")];
  //avoid require to read in json to avoid complications with caching at this point
  tinyconf(
    process.argv,
    "static/local_testing_data/",
    JSON.parse(fs.readFileSync(configPaths[0], "utf8")),
    configPaths
  );
} catch (err) {
  console.log("no fallback config file found", err);
  tinyconf(process.argv, "static/local_testing_data/", {}, [
    "./tufts_gt_wisc_configuration.json"
  ]);
}

var app = express();
var server = require("http").createServer(app);
var child_process = require("child_process");

var evaluationConfig = require("./tufts_gt_wisc_configuration.json");
console.log("using following conf: ", evaluationConfig);

try {
  var problemSchema = require(handleUrl(evaluationConfig.problem_schema));
} catch (err) {
  console.log("warning: no problem schema file available");
  var problemSchema = {};
}
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var isDevMode = false;

evaluationConfig.user_problem_root =
  evaluationConfig.user_problem_root || "/output/problems";

// Load the grpc client wrapper
// var grpcConfig = require(appRoot + '/lib/js/grpc_client_wrapper.js');
// var grpcConfig = require(appRoot + '/lib/js/grpc_client_wrapper.js');
// var grpcClientWrapper = null;
const grpcClientWrapper = require("./Wrapper/Wrapper.js");
if (evaluationConfig.running_mode != "development") {
  console.log("connecting to ta2");
  let ta2ConnectionString = "localhost:50051"; // FL
  // let ta2ConnectionString = 'localhost:45042' // MOCK
  // let ta2ConnectionString = 'localhost:50052' // TAMU
  if ("TA2_PORT" in process.env) {
    // make port for ta2 configurable through env var
    ta2ConnectionString = "localhost:" + process.env["TA2_PORT"];
  }
  console.log("ta2 connection string: ", ta2ConnectionString);
  // console.log(grpcConfig);
  // grpcClientWrapper = grpcConfig.connect(ta2ConnectionString);
  grpcClientWrapper.connect(ta2ConnectionString);
  // for the old wrapper
  // grpcClientWrapper.runStartSession();
  // testing code for API
  function testApi(context) {
    return grpcClientWrapper
      .searchSolutions(context)
      .then(grpcClientWrapper.scoreSolutions)
      .then(grpcClientWrapper.describeSolutions)
      .then(grpcClientWrapper.fitSolutions)
      .then(grpcClientWrapper.produceSolutions)
      .then(grpcClientWrapper.endSearchSolutions)
      .catch(err => console.log("ERROR!", err));
  }

  function exit() {
    console.log("exiting...");
    process.exit();
  }

  if ("INTEGRATION_TEST" in process.env) {
    console.log("BACKEND STARTED IN INTEGRATION TEST MODE");
    grpcClientWrapper
      .helloLoop()
      .then(testApi)
      .then(function(context) {
        return new Promise(function(fulfill, reject) {
          console.log("FINAL RESULT", context);
          fulfill();
        });
      })
      // test api, then exit container
      .then(exit);
  } else {
    grpcClientWrapper.helloLoop();
  }
}

//Tabular data pre-processing fire
const COORD_FACTOR = 1e7;
const NUM_PIPELINES = 5;

//package for converting csv to json
const csv = require("csvtojson");

var initializers = require("./initializers");
initializers.set(app);

/***************************************************************************
 * END UTILITY FUNCTIONS
 * Here, we have utility functions for each of the socket connections
 ***************************************************************************/

// Controllers for each part connecting with frontend
var controllers = require("./controllers");
controllers.set(app, server, grpcClientWrapper);

server.listen(9090);

module.exports = app;
