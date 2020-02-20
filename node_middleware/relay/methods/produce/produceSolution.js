const fs = require("fs");

const proto = require("../../proto.js");

// import functions
// const handleImageUrl = require("../../functions/legacy/handleImageUrl.js/index.js");

const getProduceSolutionResults = require("./getProduceSolutionResults.js");

function produceSolution(herald, solution) {
  let solution_id = solution.solution_id;
  // console.log("produce solution called");
  let request = new proto.ProduceSolutionRequest();
  request.setFittedSolutionId(solution.fit.fit_id);
  let dataset_input = new proto.Value();

  // let dataset = herald.getDataset();
  let datasetUri = herald.getDatasetUri();
  dataset_input.setDatasetUri(
    datasetUri
    // "file:///" + handleImageUrl(dataset.getDatasetPath() + "/datasetDoc.json")
  );
  request.setInputs(dataset_input);
  /*
      if (.ta2Ident.user_agent === "cmu_ta2") {
        produceSolutionRequest.setExposeOutputs("");
      }*/
  request.setExposeOutputs(solution.finalOutput);
  request.setExposeValueTypes([proto.ValueType.CSV_URI]);
  // leaving empty: repeated SolutionRunUser users = 5;

  // store request
  if (herald.isRequest) {
    let requestStr = JSON.stringify(request);
    let path =
      herald.REQUESTS_PATH + "produceSolutionRequests/" + solution_id + ".json";
    fs.writeFileSync(path, requestStr);
  }
  //

  let promise = new Promise((fulfill, reject) => {
    let client = herald.getClient();
    // console.log("produceSolutionRequest", request);
    client.produceSolution(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        let request_id = response.request_id;
        getProduceSolutionResults(
          herald,
          solution,
          request_id,
          fulfill,
          reject
        );

        // Added by Alex, for the purpose of Pipeline Visulization
        if (herald.isResponse) {
          let pathPrefix = herald.RESPONSES_PATH + "produceSolutionResponses/";
          // let pathMid = produceSolutionRequestID;
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }
      }
    });
  });
  return promise;
}

module.exports = produceSolution;
