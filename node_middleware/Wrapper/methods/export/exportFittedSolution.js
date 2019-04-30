const fs = require("fs");

// import variables
const props = require("../../props");
const proto = props.proto;

function exportFittedSolution(solution) {
  let solution_id = solution.solution_id;
  let sessionVar = props.sessionVar;
  console.log("export fitted solution", solution_id);
  let rank = sessionVar.rankVar;
  sessionVar.rankVar = sessionVar.rankVar - 0.00000001;
  let request = new proto.SolutionExportRequest();
  request.setSolutionId(solution.fit.fit_id);
  request.setRank(rank);
  let client = props.client;
  client.solutionExport(request, response => {
    // no content specified for this message
    console.log("solution exported");
  });
}

module.exports = exportFittedSolution;
