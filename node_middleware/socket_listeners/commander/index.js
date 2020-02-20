const createPipelines = require("./createPipelines.js");

//const exportSolution = require("./exportSolution.js");
//const serveData = require("./serveData.js");

module.exports.set = function(session, socket) {
  let evaluationConfig = session.config; // legacy
  socket.emit("evalConfig", evaluationConfig);

  // Node connections for createPipelinesRequest
  socket.on("createPipelines", () => {
    console.log("CREATE PIPELINES");
    createPipelines(session, socket);
  });
/*
  socket.on("exportSolution", () => {
    exportSolution(session);
  });

  socket.on("serveData", () => {
    serveData(socket, session);
  });
*/
  //   socket.on("create-executable", function(pipelineId) {
  //     session.runExportPipeline(pipelineId);
  //   });
};
