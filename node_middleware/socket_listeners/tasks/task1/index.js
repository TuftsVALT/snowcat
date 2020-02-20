const appRootPath = require("app-root-path");

const getPreExistedProblemPath = require("./getPreExistedProblemPath");

const setProblem = require("./setProblem");

// const createHerald = require(appRootPath + "/crudHerald/createHerald.js");

function task1_set(session, socket) {
  // setProblem(session, socket, problemSelected);

  socket.on("getPreExistedProblemPathRequest", () => {
    let preExistedProblemPath = getPreExistedProblemPath(session);
    console.log("preExistedProblemPath", preExistedProblemPath);
    socket.emit("getPreExistedProblemPathResponse", preExistedProblemPath);
  });

  socket.on("generateProblemsRequest", () => {});

  socket.on("getGeneratedProblemsRequest", () => {});

  socket.on("setProblemRequest", problemPathSelected => {
    console.log("setProblemRequest received");
    setProblem(session, problemPathSelected);
    // createHerald(session, socket);
    socket.emit("setProblemResponse");
  });
}

module.exports.set = task1_set;
