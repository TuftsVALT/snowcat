const fs = require("fs");

const produceSolution = require("./produceSolution.js");

function produceSolutions(herald) {
  let solutions = herald.getSolutions();
  let solutions_array = Array.from(solutions.values());
  let chain = Promise.resolve();
  solutions_array.forEach(solution => {
    console.log("produceSolutions", solution);
    if (solution.fit) {
      chain = chain.then(() => {
        return produceSolution(herald, solution);
      });
    } else {
      console.log("No produce:", solution.solution_id);
    }
  });

  // Added by Alex, for the purpose of Pipeline Visulization
  if (herald.isResponse) {
    let pathPrefix = herald.RESPONSES_PATH + "produceSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.RESPONSES_PATH + "getProduceSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (herald.isRequest) {
    // onetime response
    let pathPrefix = herald.REQUESTS_PATH + "produceSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = herald.REQUESTS_PATH + "getProduceSolutionResultsRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    chain
      .then(res => {
        console.log("produce solutions RES", res);
        fulfill(herald);
      })
      .catch(err => {
        // console.log("produce solutions ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = produceSolutions;
