const fs = require("fs");

// import variables
const props = require("../../props");
const proto = props.proto;

function getFitSolutionResults(solution, request_id, fulfill, reject) {
  let solution_id = solution.solution_id;
  let _fulfill = fulfill;
  let _reject = reject;
  let request = new proto.GetFitSolutionResultsRequest();
  request.setRequestId(request_id);

  let promise = new Promise((fulfill, reject) => {
    let client = props.client;

    if (props.isRequest) {
      let pathPrefix =
        props.REQUESTS_PATH + "getFitSolutionResultsRequests/";
      let pathMid = request_id;
      let pathAffix = ".json";
      let path = pathPrefix + pathMid + pathAffix;
      let responseStr = JSON.stringify(request);
      fs.writeFileSync(path, responseStr);
    }
    
    let call = client.getFitSolutionResults(request);
    call.on("data", (response)=> {
      // console.log("getfitSolutionResultsResponse", getFitSolutionResultsResponse);
      // console.log("solution_id:", solution.solution_id);
      // console.log("state:", response.progress.state);
      let state = response.progress.state;
      if (state === "COMPLETED") {
        console.log("getFitSolutionResultsResponse", response);
        // fitting solution is finished
        let fit_id = response.fitted_solution_id;
        let exposedOutputs = response.exposed_outputs;
        console.log("FITTED SOLUTION COMPLETED", fit_id);
        console.log("EXPOSED OUTPUTS", exposedOutputs);
        solution.fit = {
          fit_id: fit_id,
          exposedOutputs: exposedOutputs
        };
        // solution.fit[fit_id] = fit_id;
        // solution.fit[exposedOutputs] = exposedOutputs;

        console.log("getFitSolutionResults cl", solution);

        // Added by Alex, for the purpose of Pipeline Visulization
        if (props.isResponse) {
          let pathPrefix =
            props.RESPONSES_PATH + "getFitSolutionResultsResponses/";
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }
      } else if (state === "ERRORED") {
        console.log(state);
        console.log(response);
      }
    });
    call.on("error", err => {
      console.log("Error!getFitSolutionResults", request_id);
      _reject(err);
    });
    call.on("end", err => {
      console.log("End of fitted solution results", request_id);
      if (err) console.log("err is ", err);
      _fulfill(request_id);
    });
  });
  return promise;
}

module.exports = getFitSolutionResults;
