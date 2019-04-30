const fs = require("fs");

// import variables
const props = require("../../props");
const proto = props.proto;

function getSearchSolutionsResults(sessionVar, fulfill, reject) {
  // this is needed so that fulfill or reject can be calle later
  let _fulfill = fulfill;
  let _reject = reject;
  let request = new proto.GetSearchSolutionsResultsRequest();
  request.setSearchId(sessionVar.search_id);

  // store request
  if (props.isRequest) {
    let requestStr = JSON.stringify(request);
    let path = props.REQUESTS_PATH + "GetSearchSolutionsResultsRequest.json";
    fs.writeFileSync(path, requestStr);
  }
  //

  // Added by Alex, for the purpose of Pipeline Visulization
  if (props.isResponse) {
    let pathPrefix =
      props.RESPONSES_PATH + "getSearchSolutionsResultsResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  let promise = new Promise((fulfill, reject) => {
    console.log("starting get search solution results call");
    // if (sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) {
    //   let timeBoundInMinutes = 1;
    //   console.log("NYU detected; making sure they stop sending solutions after a " + timeBoundInMinutes + "min time bound");
    /*
        setTimeout(function() {
          console.log("That's enough nyu! Calling endSearchSolutions");
          obj.endSearchSolutions(sessionVar);
        }, timeBoundInMinutes * 60 * 1000 * 5);
        */
    // setTimeout needs time in ms
    // }
    let client = props.client;
    let call = client.getSearchSolutionsResults(request);
    call.on("data", response => {
      // console.log("searchSolutionResponse", getSearchSolutionsResultsResponse);
      // ta2s so not seem to send COMPLETED
      // if (getSearchSolutionsResultsResponse.progress.state === "COMPLETED") {

      // console.log("DATA CALL", getSearchSolutionsResultsResponse);
      
      let state = response.progress.state;
      let status = response.progress.status;
      let solution_id = response.solution_id;

      console.log("state:",state);
      console.log("status:",status)
      console.log("solution_id:",solution_id)
      // if ( (!sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) ||
      // ignore of internal_score is NaN or 0 for nyu
      //      (getSearchSolutionsResultsResponse.internal_score)) {
      if (solution_id) {
        // let solution = { solution_id: solution_id, scores: {} };
        let solution = { solution_id: solution_id, finalOutput: "outputs.0" };
        sessionVar.solutions.set(solution_id, solution);

        // console.log(sessionVar.solutions)

        // Added by Alex, for the purpose of Pipeline Visulization
        if (props.isResponse) {
          let pathPrefix =
            props.RESPONSES_PATH + "getSearchSolutionsResultsResponses/";
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }

        // let index = Array.from(sessionVar.solutions.values()).length;
        // console.log("new solution:", index, solution_id);
        // );
      } else {
        console.log("ignoring empty solution id");
      }
      // } else {
      //   console.log("ignoring solution (nyu / 0 or NaN)", solution_id);
      // }
    });
    call.on("error", err => {
      console.log("Error!getSearchSolutionsResults");
      _reject(err);
    });
    call.on("end", err => {
      console.log("End of result: getSearchSolutionsResults");
      if (err) console.log("err is ", err);
      _fulfill(sessionVar);
    });
  });
  return promise;
}

module.exports = getSearchSolutionsResults;
