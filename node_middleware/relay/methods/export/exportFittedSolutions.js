// import variables

const exportFittedSolution = require("./exportFittedSolution.js");

function exportFittedSolutions(herald) {
  // console.log("scoreSolutions called");
  let solutions = herald.getSolutions();
  let solutions_array = Array.from(solutions.values());

  console.log("solutions_array.length is:", solutions_array.length);

  let chain = Promise.resolve();
  solutions_array.forEach(solution => {
    if (solution.fit) {
      chain = chain.then(() => {
        // console.log("solutionID is", solution.solutionID);
        return exportFittedSolution(herald, solution);
      });
    }
  });

  let promise = new Promise((fulfill, reject) => {
    chain
      .then(() => {
        fulfill(herald);
      })
      .catch(err => {
        // console.log("ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = exportFittedSolutions;
