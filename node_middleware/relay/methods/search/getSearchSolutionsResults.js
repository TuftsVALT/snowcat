const fs = require("fs");

const proto = require("../../proto.js");

function getSearchSolutionsResults(herald, fulfill, reject) {
  console.log("getSearchSolutionsResults begin");
  // this is needed so that fulfill or reject can be calle later
  let _fulfill = fulfill;
  let _reject = reject;
  let request = new proto.GetSearchSolutionsResultsRequest();
  request.setSearchId(herald.search_id);

  // store request
  if (herald.isRequest) {
    let requestStr = JSON.stringify(request);
    let path = herald.REQUESTS_PATH + "GetSearchSolutionsResultsRequest.json";
    fs.writeFileSync(path, requestStr);
  }

  // Added by Alex, for the purpose of Pipeline Visulization
  if (herald.isResponse) {
    let pathPrefix =
      herald.RESPONSES_PATH + "getSearchSolutionsResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    console.log("getSearchSolutionsResults Promise");
    // if (.ta2Ident.user_agent.startsWith("nyu_ta2")) {
    //   let timeBoundInMinutes = 1;
    //   console.log("NYU detected; making sure they stop sending solutions after a " + timeBoundInMinutes + "min time bound");
    /*
        setTimeout(function() {
          console.log("That's enough nyu! Calling endSearchSolutions");
          obj.endSearchSolutions();
        }, timeBoundInMinutes * 60 * 1000 * 5);
        */
    // setTimeout needs time in ms
    // }
    let client = herald.getClient();
    let call = client.getSearchSolutionsResults(request);
    call.on("data", response => {
      console.log("getSearchSolutionsResults call");
      // ta2s so not seem to send COMPLETED
      // if (getSearchSolutionsResultsResponse.progress.state === "COMPLETED") {

      // console.log("DATA CALL", getSearchSolutionsResultsResponse);

      // console.log(">===>");
      // console.log("getSearchSolutionsResultsResponse");
      // console.log(response);
      // console.log("<===<");

      // let state = response.progress.state;
      // console.log("state:",state);

      // let status = response.progress.status;
      // console.log("status:",status)

      let solution_id = response.solution_id;
      // console.log("solution_id:",solution_id)

      // if ( (!.ta2Ident.user_agent.startsWith("nyu_ta2")) ||
      // ignore of internal_score is NaN or 0 for nyu
      //      (getSearchSolutionsResultsResponse.internal_score)) {
      if (solution_id) {
        // let solution = { solution_id: solution_id, scores: {} };
        let solution = { solution_id: solution_id, finalOutput: "outputs.0" };
        // herald.setSolutions(new Map());
        let solutions = herald.getSolutions();
        solutions.set(solution_id, solution);

        // console.log(.solutions)

        // Added by Alex, for the purpose of Pipeline Visulization
        if (herald.isResponse) {
          let pathPrefix =
            herald.RESPONSES_PATH + "getSearchSolutionsResultsResponses/";
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }

        // console.log("new solution:", index, solution_id);
        // );
      } else {
        console.log("ignoring empty solution id");
        //   console.log("ignoring solution (nyu / 0 or NaN)", solution_id);
      }
    });
    call.on("error", err => {
      console.log("Error!getSearchSolutionsResults");
      _reject(err);
      // reject(err);
    });
    call.on("end", err => {
      console.log("End of result: getSearchSolutionsResults");
      if (err) console.log("err is ", err);
      _fulfill(herald);
      // fulfill(herald);
    });
  });
  return promise;
}

module.exports = getSearchSolutionsResults;
