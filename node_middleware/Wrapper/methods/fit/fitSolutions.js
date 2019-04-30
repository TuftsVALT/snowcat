const fs = require("fs");

const props = require("../../props");
const fitSolution = require("./fitSolution.js");

function fitSolutions(sessionVar) {
  console.log("fitSolutions called");
  let solutions = Array.from(props.sessionVar.solutions.values());

  let chain = Promise.resolve();
  solutions.forEach(solution => {
    chain = chain.then(() => {
      return fitSolution(solution);
    });
  });

  // Added by Alex, for the purpose of Pipeline Visulization
  if (props.isResponse) {
    let pathPrefix = props.RESPONSES_PATH + "fitSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.RESPONSES_PATH + "getFitSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (props.isRequest) {
    // onetime response
    let pathPrefix = props.REQUESTS_PATH + "fitSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.REQUESTS_PATH + "getFitSolutionResultsRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    chain
      .then(() => {
        // console.log("RES", res);
        fulfill(sessionVar);
      })
      .catch(err => {
        // console.log("ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = fitSolutions;
