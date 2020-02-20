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

const app = express();
const server = http.createServer(app);
const serverSocket = socketIO(server, { origins: "*:*" });

let datasetPath = process.argv[2];
if (datasetPath !== "dev") {
  if (process.env["D3MINPUTDIR"]) {
    datasetPath = process.env["D3MINPUTDIR"];
  } else {
    const relay = require("./relay");
    datasetPath = path.resolve(relay.handleUrl(datasetPath));
  }
} else {
  datasetPath = null;
  console.log("No path to dataset; starting with empty dataset!");
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
  const session = new Session(devMode);
  session.ta2_port = ta2_port;
  console.log("ta2_port", ta2_port);
  socket.emit("newSession");
  controllers.set(session, socket);
  crudHerald.set(session, socket);

  // WARNING: This has to be the last call in the function!!
  // Otherwise views don't update correctly in the frontend.
  if (datasetPath) {
    let Dataset = require("./Session/Dataset.js");
    let Problem = require("./Session/Problem.js");
    let newDataset = new Dataset(datasetPath);
    session.setCurrentDataset(newDataset);
    let problemPath = newDataset.getProblemPath();
    let isProblemPath = true;
    let problem = new Problem(problemPath, isProblemPath);
    session.setCurrentProblem(problem);
  }
});

console.log("Server listening 9090");
server.listen(9090);

module.exports = app;
