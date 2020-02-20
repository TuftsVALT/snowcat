const _ = require("lodash");
const serveRawData = require("./serveRawData.js");

function serveData(socket, session) {
  let herald = session.getHerald();
  let signalEmitted = false;
  console.log("IN SERVE DATA");
  if (herald.running_mode == "development") {
    socket.emit("backendConnected");
    signalEmitted = true;
  } else {
    setInterval(function() {
      // console.log("session.sessionVar: ", session.sessionVar);
      if (
        !_.isEmpty(herald.search_id) &&
        herald.isConnected &&
        !signalEmitted
      ) {
        socket.emit("backendConnected");
        signalEmitted = true;
      }
    }, 5000);
  }
  // TODO - only serve as much data as the frontend can load.  Check for
  // file size above a MB or so?
  let problemSchema = herald.getProblem().getProblemSchema();
  let datasetSchema = herald.getDataset().getDatasetSchema();
  // is the problem the original problem from the dataset? yes if it comes from a file.
  let orig = herald.getProblem().getProblemPath() ? true : false;
  socket.emit("serveProblemFinished", { problemSchema, orig });
  socket.emit("dataDescFinished", datasetSchema);
  serveRawData(socket, herald, datasetSchema);
}
module.exports = serveData;
