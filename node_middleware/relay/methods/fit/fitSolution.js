const fs = require("fs");

// import functions
// const handleImageUrl = require("../../functions/legacy/handleImageUrl.js/index.js");

const getFitSolutionResults = require("./getFitSolutionResults.js");

const proto = require("../../proto.js");

function fitSolution(herald, solution) {
  let solution_id = solution.solution_id;
  // TODO: fix function
  let request = new proto.FitSolutionRequest();
  request.setSolutionId(solution_id);
  let dataset_input = new proto.Value();
  // let dataset = herald.getDataset();
  let datasetUri = herald.getDatasetUri();
  dataset_input.setDatasetUri(
    datasetUri
    // "file:///" + handleImageUrl(dataset.getDatasetPath() + "/datasetDoc.json")
  );
  request.setInputs(dataset_input);
  request.setExposeOutputs(solution.finalOutput);
  request.setExposeValueTypes([proto.ValueType.CSV_URI]);
  // leave empty: repeated SolutionRunUser users = 5;

  // store request
  if (herald.isRequest) {
    let requestStr = JSON.stringify(request);
    let path =
      herald.REQUESTS_PATH + "fitSolutionRequests/" + solution_id + ".json";
    fs.writeFileSync(path, requestStr);
  }

  function fun(fulfill, reject) {
    let client = herald.getClient();
    // console.log("fitSolutionRequest:")
    // console.log(request);
    client.fitSolution(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        let request_id = response.request_id;
        getFitSolutionResults(herald, solution, request_id, fulfill, reject);
        // getFitSolutionResults(solution, request_id, fulfill, reject);

        // Added by Alex, for the purpose of Pipeline Visulization
        if (herald.isResponse) {
          let pathPrefix = herald.RESPONSES_PATH + "fitSolutionResponses/";
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }
      }
    });
  }
  return new Promise(fun);
}
module.exports = fitSolution;
