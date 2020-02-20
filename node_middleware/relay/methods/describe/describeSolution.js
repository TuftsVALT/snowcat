const fs = require("fs");

// import variables
const proto = require("../../proto.js");

function describeSolution(herald, solution) {
  // doing the shortcut now and see how far this takes us
  console.log("WARNING: TAKING THE DESCRIBE-SOLUTION SHORTCUT FOR NOW");
  return new Promise(function(fulfill, reject) {
    solution.finalOutput = "outputs.0";
    fulfill(solution);
  });
  // THIS DOES NOT GET EXECUTED FOR NOW
  let solution_id = solution.solution_id;
  console.log("request describe solution with id", solution_id);
  let request = new proto.DescribeSolutionRequest();
  request.setSolutionId(solution_id);

  // Added by Alex, for the purpose of Pipeline Visulization
  if (herald.isResponse) {
    let pathPrefix = herald.RESPONSES_PATH + "describeSolutionResponses/";
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  }

  function fun(fulfill, reject) {
    let client = herald.getClient();
    client.describeSolution(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        // this is a PipelineDescription message

        // let pipeline = response.pipeline;
        // // console.log(pipeline);
        // let outputs = pipeline.outputs;
        // console.log(outputs);
        // let finalOutput = outputs[outputs.length - 1].data;
        // console.log("selecting final output for ", solution_id, finalOutput);

        // if (finalOutput) {
        //   solution.finalOutput = finalOutput;
        // }

        fulfill(herald, solution);

        // Added by Alex, for the purpose of Pipeline Visulization
        if (herald.isResponse) {
          let pathPrefix = herald.RESPONSES_PATH + "describeSolutionResponses/";
          let pathMid = solution_id;
          let pathAffix = ".json";
          let path = pathPrefix + pathMid + pathAffix;
          let responseStr = JSON.stringify(response);
          fs.writeFileSync(path, responseStr);
        }
      }
    });
  }

  let promise = new Promise(fun);
  return promise;
}

module.exports = describeSolution;
