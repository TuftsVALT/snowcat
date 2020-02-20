const fs = require("fs");

// import variables

const proto = require("../../proto.js");

function exportFittedSolution(herald, solution) {
  let solution_id = solution.solution_id;

  console.log("export fitted solution", solution_id);
  let rank = herald.rankVar;
  herald.rankVar = herald.rankVar - 0.00000001;
  let request = new proto.SolutionExportRequest();
  // request.setSolutionId(solution.fit.fit_id);
  request.setSolutionId(solution_id);
  request.setRank(rank);
  let client = herald.getClient();
  client.solutionExport(request, response => {
    // no content specified for this message
    // console.log(response);
    console.log("solution exported");
  });
}

module.exports = exportFittedSolution;
