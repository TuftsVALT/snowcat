// import variables
const props = require("../../props");

const exportFittedSolution = require("./exportFittedSolution.js");

function exportFittedSolutions(sessionVar) {
  // console.log("scoreSolutions called");
  let solutions = Array.from(props.sessionVar.solutions.values());
  console.log("solutions.length is:", solutions.length);

  let chain = Promise.resolve();
  solutions.forEach(solution => {
    if (solution.fit) {
      chain = chain.then(() => {
        // console.log("solutionID is", solution.solutionID);
        return exportFittedSolution(solution);
      });
    }
  });

  let promise = new Promise((fulfill, reject) => {
    chain
      .then(() => {
        fulfill(sessionVar);
      })
      .catch(err => {
        // console.log("ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = exportFittedSolutions;
