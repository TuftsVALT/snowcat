const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

const handleUrl = require("./handleUrl");

function getProblemSchema() {
  var problemSchema = {};
  try {
    console.log(evaluationConfig.problem_schema)
    problemSchema = require(handleUrl(evaluationConfig.problem_schema));
  } catch (err) {
    console.log("warning: no problem schema file available");    
  }
  return problemSchema;
};

module.exports = getProblemSchema;
