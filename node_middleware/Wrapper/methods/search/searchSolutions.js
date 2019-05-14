const fs = require("fs");
const getSearchSolutionsResults = require("./getSearchSolutionsResults.js");

// import variables
const props = require("../../props");
const proto = props.proto;

// import functions
const getMappedType = require("../../functions/getMappedType");
const getProblemSchema = require("../../functions/getProblemSchema");
const handleImageUrl = require("../../functions/handleImageUrl");

// import mappings
const metric_mappings = require("../../mappings/metric_mappings");
const task_subtype_mappings = require("../../mappings/task_subtype_mappings");
const task_type_mappings = require("../../mappings/task_type_mappings");

const evaluationConfig = require(props.CONFIG_PATH);

function searchSolutions(sessionVar) {
  let userAgentTA3 = props.userAgentTA3;
  let grpcVersion = props.grpcVersion;
  let allowed_val_types = props.allowed_val_types;
  // remove old solutions
  // sessionVar.solutions = new Map();
  let problemSchema = getProblemSchema();
  console.log(problemSchema.about.problemID);

  let request = new proto.SearchSolutionsRequest();
  request.setUserAgent(userAgentTA3);
  request.setVersion(grpcVersion);

  let timeBound = 0;
  let msg = "";
  if (sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) {
    timeBound = 10;
    msg = "nyu ta2 detected; timeBound for searching to " + timeBound;
  } else {
    timeBound = 2;
    msg = "non-nyu ta2 detected; timeBound for searching to " + timeBound;
  }
  console.log(msg);
  request.setTimeBoundSearch(timeBound);
  request.setAllowedValueTypes(allowed_val_types);

  var problem_desc = new proto.ProblemDescription();
  var problem = new proto.Problem();
  // problem.setId(problemSchema.about.problemID);
  // if (!problemSchema.about.problemVersion) {
  //   console.log("problem version not set, setting default value 1.0");
  //   problem.setVersion("1.0");
  // } else {
  //   problem.setVersion(problemSchema.about.problemVersion);
  // }
  // problem.setName(problemSchema.about.problemName);
  // problem.setDescription(problemSchema.about.problemDescription + "");
  problem.setTaskType(
    getMappedType(task_type_mappings, problemSchema.about.taskType)
  );
  if (task_subtype_mappings[problemSchema.about.taskSubType]) {
    problem.setTaskSubtype(
      getMappedType(task_subtype_mappings, problemSchema.about.taskSubType)
    );
  } else {
    problem.setTaskSubtype(task_subtype_mappings["none"]);
  }

  // set problemPerformanceMetrics
  let problemPerformanceMetrics = [];
  let performanceMetrics = problemSchema.inputs.performanceMetrics
  for (let i = 0; i < performanceMetrics.length; i++) {
    problemPerformanceMetrics.push();
    problemPerformanceMetrics[i] = new proto.ProblemPerformanceMetric();
    problemPerformanceMetrics[i].setMetric(getMappedType(metric_mappings, performanceMetrics[i].metric));
    if (performanceMetrics[i].posLabel) {
      problemPerformanceMetrics[i].setPosLabel(performanceMetrics[i].posLabel);
    }
    // if (performanceMetrics[i].k) {
    //   metrics[i].setK(performanceMetrics[i].k);
    // }
    // console.log(metrics[i]);
  }
  problem.setPerformanceMetrics(problemPerformanceMetrics);

  problem_desc.setProblem(problem);
  var inputs = [];
  // console.log("problem schema:", handleImageUrl(evaluationConfig.problem_schema));
  for (var i = 0; i < problemSchema.inputs.data.length; i++) {
    var targets = [];
    var next_input = new proto.ProblemInput();
    var thisData = problemSchema.inputs.data[i];
    next_input.setDatasetId(thisData.datasetID);
    for (var j = 0; j < thisData.targets.length; j++) {
      var next_target = new proto.ProblemTarget();
      var thisTarget = thisData.targets[j];
      next_target.setTargetIndex(thisTarget.targetIndex);
      next_target.setResourceId(thisTarget.resID);
      next_target.setColumnIndex(thisTarget.colIndex);
      next_target.setColumnName(thisTarget.colName);
      // next_target.setClustersNumber(clusters_num);
      targets.push(next_target);
    }
    next_input.setTargets(targets);
    inputs.push(next_input);
  }

  problem_desc.setInputs(inputs);

  var dataset_input = new proto.Value();
  dataset_input.setDatasetUri(
    "file://" + handleImageUrl(evaluationConfig.dataset_schema)
  );
  request.setInputs(dataset_input);
  request.setProblem(problem_desc);

  // store request
  if (props.isRequest) {
    let requestStr = JSON.stringify(request);
    let path = props.REQUESTS_PATH + "SearchSolutionsRequest.json";
    fs.writeFileSync(path, requestStr);
  }
  //

  // console.log("REQUEST", JSON.stringify(request, null, 4));
  let promise = new Promise((fulfill, reject) => {
    console.log("searchSolutions begin");
    let client = props.client;

    client.searchSolutions(request, (err, response) => {
      if (err) {
        console.log("Error!searchSolutions");
        reject(err);
      } else {
        // store response
        if (props.isResponse) {
          let responseStr = JSON.stringify(response);
          let path = props.RESPONSES_PATH + "searchSolutionsResponse.json";
          fs.writeFileSync(path, responseStr);
        }
        //

        sessionVar.search_id = response.search_id;
        // setTimeout(() => getSearchSolutionsResults(sessionVar, fulfill, reject), 180000);
        getSearchSolutionsResults(sessionVar, fulfill, reject);
      }
    });
    console.log("searchSolutions end");
  });
  return promise;
}

module.exports = searchSolutions;
