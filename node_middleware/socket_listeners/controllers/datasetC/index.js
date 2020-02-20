const appRootPath = require("app-root-path");
const Dataset = require(appRootPath + "/Session/Dataset.js");
const Problem = require(appRootPath + "/Session/Problem.js");

const translate = require("./translate.js");

module.exports.set = function(session, socket) {
  socket.on("newdataset", function(path) {
    console.log("NEWDATASET CALLED!!");

    // // "/home/cong/d3mapp/node_middleware/static/local_testing_data/185_baseball",
    // let tempStrArr = path.split("/");
    // let len = tempStrArr.length;
    // let datasetName = tempStrArr[len - 1];
    // let datasetPath = path + "/" + datasetName + "_dataset";

    console.log("datasetRootPath:", path);
    // console.log("datasetName:", datasetName);

    const dataset = new Dataset(path);
    session.setCurrentDataset(dataset);

    let problemPath = dataset.getProblemPath();
    if (problemPath) {
      let isProblemPath = true;
      let problem = new Problem(problemPath, isProblemPath);
      session.setCurrentProblem(problem);
    } else {
      session.setCurrentProblem(null);
      console.log("No problemDoc.json exists; not loading any problem.");
    }

    // try {
    //   let problem = new Problem(dataset.getProblemPath() + "/problemDoc.json");
    //   session.setCurrentProblem(problem);
    // } catch(e) {
    //   session.setCurrentProblem(null);
    //   console.log("No problemDoc.json exists; not loading any problem.", e);
    // }

    // By Alex. Tell frontend that current dataset has been updated
    let dataRoot = dataset.getDatasetPath();
    socket.emit("updateCurrentDatasetRootPath", dataRoot);
    console.log("updateCurrentDatasetRootPath emitted!!", dataRoot);
  });

  socket.on("setproblem", function(problemObj) {
    console.log("SETPROBLEM CALLED!!");
    console.log(">>>>====");
    console.log("problemObj is", problemObj);
    console.log("====<<<<");
    let problemSchema = translate(problemObj, session.getCurrentDataset());
    let isProblemPath = false;
    session.setCurrentProblem(new Problem(problemSchema, isProblemPath));
  });
};
