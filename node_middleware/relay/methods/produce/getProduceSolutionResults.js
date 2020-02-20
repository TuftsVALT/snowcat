const fs = require("fs");

const proto = require("../../proto.js");

function getProduceSolutionResults(
  herald,
  solution,
  request_id,
  fulfill,
  reject
) {
  // console.log("get produce solution called");
  let solution_id = solution.solution_id;
  let _fulfill = fulfill;
  let _reject = reject;
  let request = new proto.GetProduceSolutionResultsRequest();
  request.setRequestId(request_id);

  if (herald.isRequest) {
    let pathPrefix =
      herald.REQUESTS_PATH + "getProduceSolutionResultsRequests/";
    let pathMid = request_id;
    let pathAffix = ".json";
    let path = pathPrefix + pathMid + pathAffix;
    let responseStr = JSON.stringify(request);
    fs.writeFileSync(path, responseStr);
  }

  let promise = new Promise((fulfill, reject) => {
    let client = herald.getClient();
    // console.log("GetProduceSolutionResultsRequest", request);
    let call = client.GetProduceSolutionResults(request);
    call.on("data", response => {
      // console.log("getProduceSolutionResultsResponse", response);
      let state = response.progress.state;
      if (state === "COMPLETED") {
        // fitting solution is finished
        let exposedOutputs = response.exposed_outputs;
        // console.log("PRODUCE SOLUTION COMPLETED", produceSolutionResponseID);
        // console.log("EXPOSED OUTPUTS", exposedOutputs);
        let steps = Object.keys(exposedOutputs);
        if (steps.length !== 1) {
          console.log("EXPOSED OUTPUTS:", exposedOutputs);
          console.log("ONLY USING FIRST STEP OF", steps);
        }
        solution.fit.outputCsv = exposedOutputs[steps[0]]["csv_uri"].replace(
          "file://",
          ""
        );
        console.log("getProduceSolutionResults: ");
        console.log(solution);
        console.log("==========");

        if (!solution.fit.outputCsv.trim()) {
          console.log(
            "WARNING: solution " +
              solution_id +
              " has not output file; removing from results set"
          );
          herald.getSolutions.delete(solution_id);
        }
        // console.log("solution.fit.outputCsv", solution.fit.outputCsv);
      }

      // Added by Alex, for the purpose of Pipeline Visulization
      if (herald.isResponse) {
        let pathPrefix =
          herald.RESPONSES_PATH + "getProduceSolutionResultsResponses/";
        let pathMid = request_id;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(response);
        fs.writeFileSync(path, responseStr);
      }
    });
    call.on("error", err => {
      console.log("Error!getProduceSolutionResults", request_id);
      _reject(err);
    });
    call.on("end", err => {
      console.log("End of produce solution results", request_id);
      if (err) console.log("err is ", err);
      _fulfill(request_id);
    });
  });
  return promise;
}
module.exports = getProduceSolutionResults;
