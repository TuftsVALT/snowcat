const fs = require("fs");

const scoreSolution = require("./scoreSolution.js");

function scoreSolutions(herald) {
  // console.log("scoreSolutions called");
  let solutions = herald.getSolutions();
  let solutions_array = Array.from(solutions.values());

  // must be commented if want to test all searched solutions
  // let truncated_solutions = new Map();
  // let number_of_solutions = 2;
  // for (let i = 0; i < number_of_solutions; i++) {
  //   let solution = solutions_array[i];
  //   let solution_id = solution.solution_id;
  //   truncated_solutions.set(solution_id, solution);
  // }
  // herald.setSolutions(truncated_solutions);
  // solutions = herald.getSolutions();
  // solutions_array = Array.from(solutions.values());
  // console.log("number of truncated_solutions", solutions_array.length);
  // solutions_array = Array.from(solutions.values());
  // console.log("number of solutions found:", solutions_array.length);
  //

  let chain = Promise.resolve();
  solutions_array.forEach(solution => {
    chain = chain.then(() => {
      return scoreSolution(herald, solution);
    });
  });

  if (herald.isResponse) {
    // onetime response
    let pathPrefix = herald.RESPONSES_PATH + "scoreSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.RESPONSES_PATH + "getScoreSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (herald.isRequest) {
    // onetime response
    let pathPrefix = herald.REQUESTS_PATH + "scoreSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.REQUESTS_PATH + "getScoreSolutionResultsRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    let _fulfill = fulfill;
    chain
      .then(() => {
        solutions.forEach(solution => {
          let solution_id = solution.solution_id;
          if (!solution.scores) {
            console.log(
              "WARNING: solution " +
                solution_id +
                " has no scores; removing from results set"
            );
            herald.getSolutions().delete(solution_id);
          }
        });
        _fulfill(herald);
      })
      .catch(err => {
        // console.log("ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = scoreSolutions;
