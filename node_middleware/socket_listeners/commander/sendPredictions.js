const appRootPath = require("app-root-path");
const relay = require(appRootPath + "/relay");
const papa = require("papaparse");
const fs = require("fs");

function sendPredictions(socket, filePath, pipeline, herald) {
  console.log("sending prediction ", filePath, pipeline);
  // For now, we assume filePathuri is a CSV
  // TODO handle different filePath types
  // TODO correct interpretation of filePathuri
  filePath = filePath.replace(/^(filePath:\/\/)/, "");
  var stream = fs.createReadStream(relay.handleUrl(filePath));
  papa.parse(stream, {
    header: true,
    error: function(err) {
      console.log("sendPredictions parsing error for filePath", filePath);
      console.log("error is", filePath);
    },
    complete: function(results) {
      pipeline.results = results.data;
      pipeline.fileUri = filePath;
      pipeline.heraldId = herald.getId();
      socket.emit("modelFinished", pipeline);
    }
  });
}

module.exports = sendPredictions;
