const describeSolution = require("./describeSolution.js");

function describeSolutions(herald) {
  console.log("describeSolutions called");
  let solutions = herald.getSolutions();
  let solutions_array = Array.from(solutions.values());

  // let solution_ids = Array.from(solutions.keys());

  let chain = Promise.resolve();
  solutions_array.forEach(solution => {
    chain = chain.then(() => {
      return describeSolution(herald, solution);
    });
  });

  function fun(fulfill, reject) {
    let _fulfill = fulfill;
    let _reject = reject;
    chain
      .then(() => {
        _fulfill(herald);
      })
      .catch(err => {
        _reject(err);
      });
  }

  let promise = new Promise(fun);
  return promise;
}

module.exports = describeSolutions;
