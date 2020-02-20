const fs = require("fs");
const _ = require("lodash");

const proto = require("../../proto.js");

function getScoreSolutionResults(
  herald,
  solution,
  scoreRequest_id,
  fulfill,
  reject
) {
  let _fulfill = fulfill;
  let _reject = reject;
  let request = new proto.GetScoreSolutionResultsRequest();
  request.setRequestId(scoreRequest_id);
  let client = herald.getClient();

  if (herald.isRequest) {
    let pathPrefix = herald.REQUESTS_PATH + "getScoreSolutionResultsRequests/";
    let pathMid = scoreRequest_id;
    let pathAffix = ".json";
    let path = pathPrefix + pathMid + pathAffix;
    let responseStr = JSON.stringify(request);
    fs.writeFileSync(path, responseStr);
  }

  let call = client.getScoreSolutionResults(request);
  call.on("data", response => {
    if (response.progress.state === "COMPLETED") {
      // let targets = getScoreSolutionResultsResponse.scores.map(score => score.targets);

      let value_keys = response.scores.map(score => score.value.value);
      let metrics = response.scores.map(score => score.metric);
      let values = value_keys.map((key, i) => response.scores[i].value[key]);
      values = values.map(thing => thing[thing.raw]);
      for (let i = 0; i < values.length; i++) {
        if (isNaN(values[i])) {
          console.log("----");
          console.log("Set NaN value" + values[i] + " to -1");
          console.log("----");
          values[i] = -1;
        }
      }
      // console.log("METRICS", metrics);
      // console.log("VALUES", values);
      solution.scores = {};

      for (let i = 0; i < metrics.length; i++) {
        // solution.scores = { f1Macro: _.mean(values) };
        solution.scores[metrics[i].metric] = _.mean(values);
        // if (!values[i]) {
        //   console.log("Typeof values is: ", typeof values);
        //   console.log(values[i])
        //   values[i] = -1;
        // }
        console.log("METRICS", metrics[i], values, "num values", values.length);
      }
    } else {
      console.log("scoreSolutionResultsResponse INTERMEDIATE", response);
    }

    // Added by Alex, for the purpose of Pipeline Visulization
    if (herald.isResponse) {
      let pathPrefix =
        herald.RESPONSES_PATH + "getScoreSolutionResultsResponses/";
      let pathMid = scoreRequest_id;
      let pathAffix = ".json";
      let path = pathPrefix + pathMid + pathAffix;
      let responseStr = JSON.stringify(response);
      fs.writeFileSync(path, responseStr);
    }
  });
  call.on("error", err => {
    console.log("Error!getScoreSolutionResults: ", scoreRequest_id);
    _reject(err);
  });
  call.on("end", err => {
    console.log("End of score solution result: ", scoreRequest_id);
    if (err) console.log("err is ", err);
    _fulfill(scoreRequest_id);
  });
}
module.exports = getScoreSolutionResults;
