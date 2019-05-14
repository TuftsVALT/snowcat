const fs = require("fs");
const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

// import variables
const props = require("../../props");
const proto = props.proto;

// import functions
const handleImageUrl = require("../../functions/handleImageUrl.js");

const getProduceSolutionResults = require("./getProduceSolutionResults.js");

function produceSolution(solution) {
  let solution_id = solution.solution_id;
  // console.log("produce solution called");
  let request = new proto.ProduceSolutionRequest();
  request.setFittedSolutionId(solution.fit.fit_id);
  let dataset_input = new proto.Value();
  dataset_input.setDatasetUri(
    "file://" + handleImageUrl(evaluationConfig.dataset_schema)
  );
  request.setInputs(dataset_input);
  /*
      if (sessionVar.ta2Ident.user_agent === "cmu_ta2") {
        produceSolutionRequest.setExposeOutputs("");
      }*/
  request.setExposeOutputs(solution.finalOutput);
  request.setExposeValueTypes([proto.ValueType.CSV_URI]);
  // leaving empty: repeated SolutionRunUser users = 5;

  // store request
  if (props.isRequest) {
    let requestStr = JSON.stringify(request);
    let path = props.REQUESTS_PATH +"produceSolutionRequests/"+ solution_id+".json";
    fs.writeFileSync(path, requestStr);
  }
  //

  let promise = new Promise((fulfill, reject) => {
    let client = props.client;
    // console.log("produceSolutionRequest", request);
    client.produceSolution(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        let request_id = response.request_id;
        getProduceSolutionResults(solution, request_id, fulfill, reject);

        // Added by Alex, for the purpose of Pipeline Visulization
        if (props.isResponse) {
          let pathPrefix = props.RESPONSES_PATH + "produceSolutionResponses/";
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
