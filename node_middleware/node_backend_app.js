"use strict";
// Transpile all code following this line with babel and use '@babel/preset-env' (aka ES6) preset.
require("@babel/register")({
  presets: ["@babel/preset-env"],
  plugins: ["@babel/plugin-proposal-class-properties"]
});
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const path = require("path");
const appRoot = require('app-root-path');
const spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
const spawn = require("child_process").spawn; 

const app = express();
const server = http.createServer(app);
const serverSocket = socketIO(server, { origins: "*:*" });
const Vast20expConfig = require(appRoot + "/vast20exp/config");

let datasetPath = process.argv[2];

console.log(' datasetPath is ', datasetPath)

let vast20expMode = datasetPath === "vast20exp";
let vast20expConfig = null;
if (vast20expMode) {
  const participantId = process.argv[process.argv.length - 1]
  vast20expConfig = new Vast20expConfig(participantId);
}

if (datasetPath === "vast20exp") {
  datasetPath = vast20expConfig.task1.datasetPath;
  const relay = require("./relay");
  datasetPath = path.resolve(relay.handleUrl(datasetPath));
} else if (datasetPath === "dev") {
  datasetPath = null;
  console.log("No path to dataset; starting with empty dataset!");
} else {
  if (process.env["D3MINPUTDIR"]) {
    datasetPath = process.env["D3MINPUTDIR"];
  } else {
    const relay = require("./relay");
    datasetPath = path.resolve(relay.handleUrl(datasetPath));
  }
}

let devMode = process.argv[process.argv.length - 1] === "dev";

const initializers = require("./initializers");
initializers.set(app);
/***************************************************************************
 * END UTILITY FUNCTIONS
 * Here, we have utility functions for each of the socket connections
 ***************************************************************************/
const Session = require("./Session/Session.js");

const controllers = require("./socket_listeners/controllers");
const crudHerald = require("./socket_listeners/crudHerald");

let ta2_port = "localhost:50054";
if ("TA2_PORT" in process.env) {
  // make port for ta2 configurable through env var
  ta2_port = "localhost:" + process.env["TA2_PORT"];
}

serverSocket.on("connection", socket => {
  console.log("Server: connected!");
  const session = new Session(devMode, vast20expMode, vast20expConfig);
  session.ta2_port = ta2_port;
  console.log("ta2_port", ta2_port);
  socket.emit("newSession", { 'devMode': devMode, 'vast20expMode': vast20expMode});
  controllers.set(session, socket);
  crudHerald.set(session, socket);

  // WARNING: This has to be the last call in the function!!
  // Otherwise views don't update correctly in the frontend.
  if (datasetPath) {
    let Dataset = require("./Session/Dataset.js");
    let Problem = require("./Session/Problem.js");
    console.log("datasetPath is ", datasetPath);
    let newDataset = new Dataset(datasetPath);
    session.setCurrentDataset(newDataset);
    let problemPath = newDataset.getProblemPath();
    let isProblemPath = true;
    let problem = new Problem(problemPath, isProblemPath);
    session.setCurrentProblem(problem);
    //COMMENTED THE FOLLOWING HERE, AS FOR EXPERIMENTS RUNNING IN vast20exp/index.js
    if(datasetPath != "vast20exp") runBaseModel(socket);
  }
});

console.log("Server listening 9090");
server.listen(9090);

function runBaseModel(socket){
  // run base model
  let results = []
  let modelpyfile = appRoot + "/models/m_modeller.py"
  let obj = {}
  let baseMod = 1
  console.log(' CHECKING APPROOT ', appRoot, modelpyfile)
  var process = spawn("python3", [modelpyfile, "-", baseMod])
    process.stdout.on('data', (data) => { 
      console.log('python results came back ', data.toString())
      results.push(data.toString()); 
    })
    process.stderr.on('data', (data) => {
      console.log(`python results error:${data}`);
  });
    process.stderr.on('close', () => {
      obj = JSON.parse(results[0])
      obj['col_names'] = obj['col_names'].split(",")
      obj['id'] = 'modelid_' + Math.random()*10000
      socket.emit("modelmetricsMultiIter", obj)
      console.log('emitted model metrics ', obj)
      console.log("python call done !!!! ");

    });
}

module.exports = app;