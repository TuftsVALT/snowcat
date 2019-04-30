const fs = require("fs");

const props = require("../../props");
const produceSolution = require("./produceSolution.js");

function produceSolutions(sessionVar) {
  let solutions = Array.from(props.sessionVar.solutions.values());
  let chain = Promise.resolve();
  solutions.forEach(solution => {
    console.log("produceSolutions", solution);
    if (solution.fit) {
      chain = chain.then(() => {
        return produceSolution(solution);
      });
    } else {
      console.log("No produce:", solution.solution_id);
    }
  });

  // Added by Alex, for the purpose of Pipeline Visulization
  if (props.isResponse) {
    let pathPrefix = props.RESPONSES_PATH + "produceSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.RESPONSES_PATH + "getProduceSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (props.isRequest) {
    // onetime response
    let pathPrefix = props.REQUESTS_PATH + "produceSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.REQUESTS_PATH + "getProduceSolutionResultsRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    chain
      .then(res => {
        console.log("produce solutions RES", res);
        fulfill(sessionVar);
      })
      .catch(err => {
        // console.log("produce solutions ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = produceSolutions;
