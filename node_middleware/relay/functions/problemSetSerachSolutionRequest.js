const jsonfile = require("jsonfile");

const proto = require("../proto.js");
const config = require("../config.js");

// import mappings
const metric_mappings = require("../mappings/metric_mappings");
const task_keyword_mappings = require("../mappings/task_keyword_mappings");
// const task_subtype_mappings = require("../mappings/task_subtype_mappings");
// const task_type_mappings = require("../mappings/task_type_mappings");

// import functions
const getMappedType = require("./getMappedType");
// const handleImageUrl = require("./handleImageUrl");

function problemSetSerachSolutionRequest(session, problemSet, dirPath) {
  var request = new proto.SearchSolutionsRequest();

  request.setUserAgent(config.userAgentTA3);
  request.setVersion(config.grpcVersion);
  request.setTimeBoundSearch(0.25);
  request.setPriority(0);
  request.setAllowedValueTypes(config.allowed_val_types);

  var problem_desc = new proto.ProblemDescription();
  var problem = new proto.Problem();
  // problem.setId(problemSet.about.problemID);
  // problem.setVersion(problemSet.about.problemVersion);
  // problem.setName(problemSet.about.problemName);
  // problem.setDescription(problemSet.about.problemDescription);
  let taskKeywords = [];

  let problemSchema_about_taskKeywords = problemSchema.about.taskKeywords;
  problemSchema_about_taskKeywords.forEach(taskKeyword => {
    taskKeywords.push(getMappedType(task_keyword_mappings, taskKeyword));
  });
  problem.setTaskKeywords(taskKeywords);

  // problem.setTaskType(
  //   getMappedType(task_type_mappings, problemSet.about.taskType)
  // );

  // if (task_subtype_mappings[problemSet.about.taskSubType]) {
  //   problem.setTaskSubtype(
  //     getMappedType(task_subtype_mappings, problemSet.about.taskSubType)
  //   );
  // } else {
  //   problem.setTaskSubtype(task_subtype_mappings["none"]);
  // }

  var metrics = [];

  for (var i = 0; i < problemSet.inputs.performanceMetrics.length; i++) {
    metrics.push();
    metrics[i] = new proto.ProblemPerformanceMetric();
    metrics[i].setMetric(
      getMappedType(
        metric_mappings,
        problemSet.inputs.performanceMetrics[i].metric
      )
    );
  }

  problem.setPerformanceMetrics(metrics);

  problem_desc.setProblem(problem);
  var inputs = [];

  for (var i = 0; i < problemSet.inputs.data.length; i++) {
    var targets = [];
    var next_input = new proto.ProblemInput();
    var thisData = problemSet.inputs.data[i];
    next_input.setDatasetId(thisData.datasetID.toString());
    for (var j = 0; j < thisData.targets.length; j++) {
      var next_target = new proto.ProblemTarget();
      var thisTarget = thisData.targets[j];
      next_target.setTargetIndex(thisTarget.targetIndex);
      next_target.setResourceId(thisTarget.resID);
      next_target.setColumnIndex(thisTarget.colIndex);
      next_target.setColumnName(thisTarget.colName);
      targets.push(next_target);
    }
    next_input.setTargets(targets);
    inputs.push(next_input);
  }

  problem_desc.setInputs(inputs);

  problem_desc.setId(problemSet.about.problemID);
  problem_desc.setVersion(problemSet.about.problemVersion);
  problem_desc.setName(problemSet.about.problemName);
  problem_desc.setDescription(problemSet.about.problemDescription);
  var dataset_input = new proto.Value();
  // dataset_input.setDatasetUri(handleImageUrl(evaluationConfig.dataset_schema));

  let dataset = session.getCurrentDataset();
  let datasetUri = handleDatasetUri(
    dataset.getDatasetPath() + "/datasetDoc.json"
  );
  dataset_input.setDatasetUri(datasetUri);

  request.setInputs(dataset_input);
  request.setProblem(problem_desc);

  var filePath = dirPath + "/ssapi.json";
  //console.log("filePath:"+filePath);

  // to write the file for each SearchSolutionsRequest
  jsonfile.writeFileSync(filePath, request, function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(
        "SearchSolutionsRequest JSON File has been created at " +
          dirPath +
          " directory"
      );
    }
  });
}

module.exports = problemSetSerachSolutionRequest;
