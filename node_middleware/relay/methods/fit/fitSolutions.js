const fs = require("fs");

const fitSolution = require("./fitSolution.js");

function fitSolutions(herald) {
  console.log("fitSolutions called");
  let solutions = herald.getSolutions();
  let solutions_array = Array.from(solutions.values());

  // Added by Alex, for the purpose of Pipeline Visulization
  if (herald.isResponse) {
    let pathPrefix = herald.RESPONSES_PATH + "fitSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.RESPONSES_PATH + "getFitSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (herald.isRequest) {
    // onetime response
    let pathPrefix = herald.REQUESTS_PATH + "fitSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.REQUESTS_PATH + "getFitSolutionResultsRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }
  let chain = Promise.resolve();
  solutions_array.forEach(solution => {
    chain = chain.then(() => {
      return fitSolution(herald, solution);
    });
  });

  function fun(fulfill, reject) {
    chain
      .then(() => {
        // console.log("RES", res);
        fulfill(herald);
      })
      .catch(err => {
        // console.log("ERR", err);
        reject(err);
      });
  }

  let promise = new Promise(fun);
  return promise;
}

module.exports = fitSolutions;
