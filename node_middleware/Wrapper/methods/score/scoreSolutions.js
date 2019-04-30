const fs = require("fs");

const props = require("../../props");
const scoreSolution = require("./scoreSolution.js");

function scoreSolutions(sessionVar) {
  // console.log("scoreSolutions called");
  let solutions = Array.from(props.sessionVar.solutions.values());
  let chain = Promise.resolve();
  solutions.forEach(solution => {
    chain = chain.then(() => {
      return scoreSolution(solution);
    });
  });
  
  if (props.isResponse) {
    // onetime response
    let pathPrefix = props.RESPONSES_PATH + "scoreSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.RESPONSES_PATH + "getScoreSolutionResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  if (props.isRequest) {
    // onetime response
    let pathPrefix = props.REQUESTS_PATH + "scoreSolutionRequests/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
    pathPrefix = props.REQUESTS_PATH + "getScoreSolutionResultsRequests/";
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
            props.sessionVar.solutions.delete(solution_id);
          }
        });
        _fulfill(sessionVar);
      })
      .catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
  });
  return promise;
}

module.exports = scoreSolutions;
