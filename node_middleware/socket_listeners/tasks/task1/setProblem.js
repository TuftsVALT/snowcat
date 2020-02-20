const appRootPath = require("app-root-path");
const Problem = require(appRootPath + "/Session/Problem.js");

// const datasetsPath = appRootPath + "/static/local_testing_data/";

function setProblem(session, problemPathSelected) {
  // let problemPath = datasetsPath + problemPathSelected;
  let problem = new Problem(problemPathSelected);
  session.setProblem(problem);
}

module.exports = setProblem;
