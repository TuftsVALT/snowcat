const props = require("../../props");
const describeSolution = require("./describeSolution.js");

function describeSolutions(sessionVar) {
  console.log("describeSolutions called");
  let solutions = Array.from(props.sessionVar.solutions.values());
  // let solution_ids = Array.from(solutions.keys());

  let chain = Promise.resolve();
  solutions.forEach(solution => {
    chain = chain.then(() => {
      return describeSolution(solution);
    });
  });

  let promise = new Promise((fulfill, reject) => {
    let _fulfill = fulfill;
    let _reject = reject;
    chain
      .then(() => {
        _fulfill(sessionVar);
      })
      .catch(err => {
        _reject(err);
      });
  });
  return promise;
}

module.exports = describeSolutions;
