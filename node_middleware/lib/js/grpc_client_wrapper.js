var appRoot = require('app-root-path');
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");
var grpc = require('grpc');
var jsonfile = require('jsonfile');
var PROTO_PATH = __dirname + '/protos/v2018.7.7/core.proto';

// var protoLoader = require('@grpc/proto-loader');
// Suggested options for similarity to existing grpc.load behavior
// var packageDefinition = protoLoader.loadSync(
//    PROTO_PATH,
//    { keepCase: true,
//      longs: String,
//      enums: String,
//      defaults: true,
//      oneofs: true
//    });
// var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// The protoDescriptor object has the full package hierarchy
// var routeguide = protoDescriptor.routeguide;
// console.log("protodescriptor", protoDescriptor.EvaluationMethod);

var proto = grpc.load(PROTO_PATH);
var shell = require('shelljs');
var _ = require('lodash');
var fs = require('fs');
var handleUrl = (url) => { if ( _.startsWith(url, '/') ||  _.startsWith(url, './') ) { return url } else { return "../../" + url } };
var mapToImageUrl = (url) => {
  if (url.startsWith("/input")) return url;
  let splitUrl = url.split("/");
  let i = splitUrl.indexOf("local_testing_data");
  let out_url = "/input/" + splitUrl.slice(i + 1, splitUrl.length).join("/");
  return out_url;
};
var handleImageUrl = (url) => mapToImageUrl(handleUrl(url));
try {
  var problemSchema = require(handleUrl(evaluationConfig.problem_schema));
} catch(err) {
  console.log("warning: no problem schema file available");
  var problemSchema = { };
}
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));

const userAgentTA3 = "TA3-TGW";
const grpcVersion = "2018.7.7";
const allowed_val_types = [1, 2, 3];

/* MAPPINGS */
const task_type_mappings = {
  "undefined": proto.TaskType.TASK_TYPE_UNDEFINED,
  "classification": proto.TaskType.CLASSIFICATION,
  "regression": proto.TaskType.REGRESSION,
  "clustering": proto.TaskType.CLUSTERING,
  "linkPrediction": proto.TaskType.LINK_PREDICTION,
  "vertexNomination": proto.TaskType.VERTEX_NOMINATION,
  "communityDetection": proto.TaskType.COMMUNITY_DETECTION,
  "graphClustering": proto.TaskType.GRAPH_CLUSTERING,
  "graphMatching": proto.TaskType.GRAPH_MATCHING,
  "timeSeriesForecasting": proto.TaskType.TIME_SERIES_FORECASTING,
  "collaborativeFiltering": proto.TaskType.COLLABORATIVE_FILTERING,
  "objectDectection" : proto.TaskType.OBJECT_DETECTION
}

const task_subtype_mappings = {
  "undefined": proto.TaskSubtype.TASK_SUBTYPE_UNDEFINED,
  "none": proto.TaskSubtype.NONE,
  "binary": proto.TaskSubtype.BINARY,
  "multiClass": proto.TaskSubtype.MULTICLASS,
  "multiLabel": proto.TaskSubtype.MULTILABEL,
  "univariate": proto.TaskSubtype.UNIVARIATE,
  "multivariate": proto.TaskSubtype.MULTIVARIATE,
  "overlapping": proto.TaskSubtype.OVERLAPPING,
  "nonoverlapping": proto.TaskSubtype.NONOVERLAPPING
}

const metric_mappings = {
  "undefined": proto.PerformanceMetric.METRIC_UNDEFINED,
  "accuracy": proto.PerformanceMetric.ACCURACY,
  "recall" : proto.PerformanceMetric.RECALL,
  "f1": proto.PerformanceMetric.F1,
  "f1Micro": proto.PerformanceMetric.F1_MICRO,
  "f1Macro": proto.PerformanceMetric.F1_MACRO,
  "rocAuc": proto.PerformanceMetric.ROC_AUC,
  "rocAucMicro": proto.PerformanceMetric.ROC_AUC_MICRO,
  "rocAucMacro": proto.PerformanceMetric.ROC_AUC_MACRO,
  "meanSquaredError": proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR, //TODO - double check if we are supposed to support both these or just one - our proto file has only RMSE, not MSE
  "rootMeanSquaredError": proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR,
  "rootMeanSquareErrorAvg": proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR_AVG,
  "meanAbsoluteError": proto.PerformanceMetric.MEAN_ABSOLUTE_ERROR,
  "rSquared": proto.PerformanceMetric.R_SQUARED,
  "normalizedMutualInformation": proto.PerformanceMetric.NORMALIZED_MUTUAL_INFORMATION,
  "jaccardSimilarityScore": proto.PerformanceMetric.JACCARD_SIMILARITY_SCORE,
  "precisionAtTopK": proto.PerformanceMetric.PRECISION_AT_TOP_K,
  "objectDetectionAveragePrecision" : proto.PerformanceMetric.OBJECT_DETECTION_AVERAGE_PRECISION,
  "loss" : proto.PerformanceMetric.LOSS
}

problemSetSerachSolutionRequest = function(problemSet, dirPath){

  var request = new proto.SearchSolutionsRequest();

  request.setUserAgent(userAgentTA3);
  request.setVersion(grpcVersion);
  request.setTimeBound(0.25);
  request.setAllowedValueTypes(allowed_val_types);

  var problem_desc = new proto.ProblemDescription();
  var problem = new proto.Problem();
  problem.setId(problemSet.about.problemID);
  problem.setVersion(problemSet.about.problemVersion);
  problem.setName(problemSet.about.problemName);
  problem.setDescription(problemSet.about.problemDescription);
  problem.setTaskType(getMappedType(task_type_mappings, problemSet.about.taskType));

  if (task_subtype_mappings[problemSet.about.taskSubType]) {
    problem.setTaskSubtype(getMappedType(task_subtype_mappings,problemSet.about.taskSubType));
  } else {
    problem.setTaskSubtype(task_subtype_mappings['none']);
  }

  var metrics = [];

  for ( var i=0; i<problemSet.inputs.performanceMetrics.length; i++ ) {
    metrics.push();
    metrics[i] = new proto.ProblemPerformanceMetric;
    metrics[i].setMetric(getMappedType(metric_mappings, problemSet.inputs.performanceMetrics[i].metric));
  }

  problem.setPerformanceMetrics(metrics);

  problem_desc.setProblem(problem);
  var inputs = [];

  for (var i=0; i<problemSet.inputs.data.length; i++) {
    var targets = [];
    var next_input = new proto.ProblemInput;
    var thisData = problemSet.inputs.data[i];
    next_input.setDatasetId(thisData.datasetID.toString());
    for (var j=0; j<thisData.targets.length; j++) {
      var next_target = new proto.ProblemTarget;
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

  var dataset_input = new proto.Value;
  dataset_input.setDatasetUri(handleImageUrl(evaluationConfig.dataset_schema));
  request.setInputs(dataset_input);
  request.setProblem(problem_desc);

  var filePath = dirPath +'/ssapi.json';
  //console.log("filePath:"+filePath);

  // to write the file for each SearchSolutionsRequest
  jsonfile.writeFileSync(filePath, request, function (err) {
      if(err){
        console.error(err);
      }
      else{
        console.log("SearchSolutionsRequest JSON File has been created at "+dirPath+" directory");
      }
  })
}

getMappedType = function(mapping, myType) {
  if (myType && mapping[myType]) {
    return mapping[myType]
  } else {
    return mapping['undefined']
  }
}

function connect(connectionString) {
  let obj = {};

  let sessionVar = {
    ta2Ident: null,
    connected: false,
    solutions: new Map(),
    //produceSolutionRequests: [],
    //solutionResults: [],
    // NIST eval plan: only ranks 1-20 are considered (lower is better)
    rankVar: 20,
  };
  obj.sessionVar = sessionVar;

  let client = new proto.Core(connectionString, grpc.credentials.createInsecure());
  // console.log("CLIENT WRAPPER", client);

  obj.helloLoop = function() {
    return new Promise(function(fulfill, reject) {
      let request = new proto.HelloRequest;
      let waiting = false;
      setInterval(function() {
        if (waiting || sessionVar.connected) return;
        waiting = true;
        client.Hello(request, function(err, response) {
          if (err) {
            console.log("Error!Hello", err);
            sessionVar.connected = false;
            waiting = false;
            // we do not reject here, because ta2 can becaome available at some point
            // reject(err);
          } else {
            sessionVar.connected = true;
            console.log("Success!Hello", response);
            sessionVar.ta2Ident = response;
            fulfill(sessionVar);
          }
        });
      }, 10000);
    });
  };

  obj.searchSolutions = function(sessionVar) {
    // remove old solutions
    sessionVar.solutions = new Map();
    return new Promise(function(fulfill, reject) {

      var request = new proto.SearchSolutionsRequest();

      request.setUserAgent(userAgentTA3);
      request.setVersion(grpcVersion);
      if (sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) {
        console.log("nyu ta2 detected; setting time bound for searching solutions to 10");
        request.setTimeBound(10);
      } else {
        console.log("non-nyu ta2 detected; setting time bound for searching solutions to 2");
        request.setTimeBound(2);
      }
      request.setAllowedValueTypes(allowed_val_types);

      var problem_desc = new proto.ProblemDescription();
      var problem = new proto.Problem();
      problem.setId(problemSchema.about.problemID);
      if (!problemSchema.about.problemVersion) {
        console.log("problem version not set, setting default value 1.0");
        problem.setVersion("1.0");
      } else {
        problem.setVersion(problemSchema.about.problemVersion);
      }
      problem.setName(problemSchema.about.problemName);
      problem.setDescription(problemSchema.about.problemDescription + "");
      problem.setTaskType(getMappedType(task_type_mappings, problemSchema.about.taskType));
      if (task_subtype_mappings[problemSchema.about.taskSubType]) {
        problem.setTaskSubtype(getMappedType(task_subtype_mappings,problemSchema.about.taskSubType));
      } else {
        problem.setTaskSubtype(task_subtype_mappings['none']);
      }

      var metrics = [];

      for ( var i=0; i<problemSchema.inputs.performanceMetrics.length; i++ ) {
      	metrics.push();
      	metrics[i] = new proto.ProblemPerformanceMetric;
        metrics[i].setMetric(getMappedType(metric_mappings, problemSchema.inputs.performanceMetrics[i].metric));
      }

      problem.setPerformanceMetrics(metrics);

      problem_desc.setProblem(problem);
      var inputs = [];
      // console.log("problem schema:", handleImageUrl(evaluationConfig.problem_schema));
      for (var i=0; i<problemSchema.inputs.data.length; i++) {
      	var targets = [];
      	var next_input = new proto.ProblemInput;
        var thisData = problemSchema.inputs.data[i];
      	next_input.setDatasetId(thisData.datasetID);
      	for (var j=0; j<thisData.targets.length; j++) {
      		var next_target = new proto.ProblemTarget;
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

      var dataset_input = new proto.Value;
      dataset_input.setDatasetUri("file://" + handleImageUrl(evaluationConfig.dataset_schema));
      request.setInputs(dataset_input);
      request.setProblem(problem_desc);

      console.log("REQUEST", JSON.stringify(request, null, 4));

      client.searchSolutions(request, function(err, searchSolutionsResponse) {
        if(err) {
          console.log("Error!searchSolutions");
          // console.log(err);
          // console.log(searchSolutionsResponse);
          reject(err);
        } else {
          sessionVar.searchID = searchSolutionsResponse.search_id;
          // setTimeout(() => getSearchSolutionResults(sessionVar, fulfill, reject), 180000);
          getSearchSolutionResults(sessionVar, fulfill, reject);
        }
      });
    });
	};

  function getSearchSolutionResults(sessionVar, fulfill, reject) {
    // this is needed so that fulfill or reject can be calle later
    let _fulfill = fulfill;
    let _reject = reject;
    let getSearchSolutionsResultsRequest = new proto.GetSearchSolutionsResultsRequest;
    getSearchSolutionsResultsRequest.setSearchId(sessionVar.searchID);

    return new Promise(function(fulfill, reject) {
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
      let call = client.getSearchSolutionsResults(getSearchSolutionsResultsRequest);
      call.on('data', function(getSearchSolutionsResultsResponse) {
        // console.log("searchSolutionResponse", getSearchSolutionsResultsResponse);
        // ta2s so not seem to send COMPLETED
        // if (getSearchSolutionsResultsResponse.progress.state === "COMPLETED") {
        console.log("DATA CALL", getSearchSolutionsResultsResponse);
        let solutionID = getSearchSolutionsResultsResponse.solution_id;
        // if ( (!sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) ||
              // ignore of internal_score is NaN or 0 for nyu
        //      (getSearchSolutionsResultsResponse.internal_score)) {
          if (solutionID) {
            let solution = { solutionID: solutionID };
            sessionVar.solutions.set(solution.solutionID, solution);
            console.log("new solution:", solution.solutionID);
          } else {
            console.log("ignoring empty solution id");
          }
        // } else {
        //   console.log("ignoring solution (nyu / 0 or NaN)", solutionID);
        // }
      });
      call.on('error', function(err) {
        console.log("Error!getSearchSolutionResults");
        _reject(err);
      });
      call.on('end', function(err) {
        console.log("End of result: getSearchSolutionResults");
        if (err) console.log("err is ", err);
        _fulfill(sessionVar);
      });
    });
  };

  obj.fitSolutions = function(sessionVar) {
    // console.log("fitSolutions called");
    let solutions = Array.from(sessionVar.solutions.values());

    let chain = Promise.resolve();
    for (let i = 0; i < solutions.length; i++) {
      let solution = solutions[i];
      chain = chain.then((solutionID) => {
        return fitSolution(solution, sessionVar);
      });
    }
    return new Promise(function(fulfill, reject) {
      chain.then(function(res) {
        // console.log("RES", res);
        fulfill(sessionVar);
      }).catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
    });
  };

  function fitSolution(solution, sessionVar) {// TODO: fix function
    let fitSolutionRequest = new proto.FitSolutionRequest;
    fitSolutionRequest.setSolutionId(solution.solutionID);
    var dataset_input = new proto.Value;
    dataset_input.setDatasetUri("file://" + handleImageUrl(evaluationConfig.dataset_schema));
    fitSolutionRequest.setInputs(dataset_input);
    fitSolutionRequest.setExposeOutputs(solution.finalOutput);
    fitSolutionRequest.setExposeValueTypes([proto.ValueType.CSV_URI]);
    // leave empty: repeated SolutionRunUser users = 5;
    return new Promise(function(fulfill, reject) {
      client.fitSolution(fitSolutionRequest, function(err, fitSolutionResponse) {
        if (err) {
          reject(err);
        } else {
          let fitSolutionResponseID = fitSolutionResponse.request_id;
          getFitSolutionResults(solution, fitSolutionResponseID, fulfill, reject);
        }
      });
    });
  }

  function getFitSolutionResults(solution, fitSolutionResponseID, fulfill, reject) {
    let _fulfill = fulfill;
    let _reject = reject;
    let getFitSolutionResultsRequest = new proto.GetFitSolutionResultsRequest;
    getFitSolutionResultsRequest.setRequestId(fitSolutionResponseID);

    return new Promise(function(fulfill, reject) {
      let call = client.getFitSolutionResults(getFitSolutionResultsRequest);
      call.on('data', function(getFitSolutionResultsResponse) {
        // console.log("getfitSolutionResultsResponse", getFitSolutionResultsResponse);
        if (getFitSolutionResultsResponse.progress.state === "COMPLETED") { // fitting solution is finished
          let fitID = getFitSolutionResultsResponse.fitted_solution_id;
          let exposedOutputs = getFitSolutionResultsResponse.exposed_outputs;
          // console.log("FITTED SOLUTION COMPLETED", fitID);
          // console.log("EXPOSED OUTPUTS", exposedOutputs);
          solution.fit = {
            fitID: fitID,
            exposedOutputs: exposedOutputs,
          };
        }
      });
      call.on('error', function(err) {
        console.log("Error!getFitSolutionResults", fitSolutionResponseID);
        _reject(err);
      });
      call.on('end', function(err) {
        console.log("End of fitted solution results", fitSolutionResponseID);
        if (err) console.log("err is ", err);
        _fulfill(fitSolutionResponseID);
      });
    });
  };

  obj.produceSolutions = function(sessionVar) {
    let solutions = Array.from(sessionVar.solutions.values());
    let chain = Promise.resolve();
    for (let i = 0; i < solutions.length; i++) {
      let solution = solutions[i];
      chain = chain.then((solutionID) => {
        return produceSolution(solution, sessionVar);
      });
    }
    return new Promise(function(fulfill, reject) {
      chain.then(function(res) {
        // console.log("produce solutions RES", res);
        fulfill(sessionVar);
      }).catch(function(err) {
        // console.log("produce solutions ERR", err);
        reject(err);
      });
    });
  };

  function produceSolution(solution, sessionVar) {
    // console.log("produce solution called");
    let produceSolutionRequest = new proto.ProduceSolutionRequest;
    produceSolutionRequest.setFittedSolutionId(solution.fit.fitID);
    let dataset_input = new proto.Value;
    dataset_input.setDatasetUri("file://" + handleImageUrl(evaluationConfig.dataset_schema));
    produceSolutionRequest.setInputs(dataset_input);
    /*
    if (sessionVar.ta2Ident.user_agent === "cmu_ta2") {
      produceSolutionRequest.setExposeOutputs("");
    }*/
    produceSolutionRequest.setExposeOutputs(solution.finalOutput);
    produceSolutionRequest.setExposeValueTypes([proto.ValueType.CSV_URI]);
    // leaving empty: repeated SolutionRunUser users = 5;

    return new Promise(function(fulfill, reject) {
      client.produceSolution(produceSolutionRequest, function(err, produceSolutionResponse) {
        if (err) {
          reject(err);
        } else {
          let produceSolutionRequestID = produceSolutionResponse.request_id;
          getProduceSolutionResults(solution, produceSolutionRequestID, fulfill, reject);
        }
      });
    });
  };

  function getProduceSolutionResults(solution, produceSolutionResponseID, fulfill, reject) {
    // console.log("get produce solution called");
    let _fulfill = fulfill;
    let _reject = reject;
    let getProduceSolutionResultsRequest = new proto.GetProduceSolutionResultsRequest;
    getProduceSolutionResultsRequest.setRequestId(produceSolutionResponseID);

    return new Promise(function(fulfill, reject) {
      let call = client.GetProduceSolutionResults(getProduceSolutionResultsRequest);
      call.on('data', function(getProduceSolutionResultsResponse) {
        console.log("getProduceSolutionResultsResponse", getProduceSolutionResultsResponse);
        if (getProduceSolutionResultsResponse.progress.state === "COMPLETED") { // fitting solution is finished
          let exposedOutputs = getProduceSolutionResultsResponse.exposed_outputs;
          // console.log("PRODUCE SOLUTION COMPLETED", produceSolutionResponseID);
          // console.log("EXPOSED OUTPUTS", exposedOutputs);
          let steps = Object.keys(exposedOutputs);
          if (steps.length !== 1) {
            console.log("EXPOSED OUTPUTS:", exposedOutputs);
            console.log("ONLY USING FIRST STEP OF", steps);
          }
          solution.fit.outputCsv = exposedOutputs[steps[0]]["csv_uri"].replace("file://", "");
          if (!solution.fit.outputCsv.trim()) {
            console.log("WARNING: solution " + solution.solutionID + " has not output file; removing from results set");
            sessionVar.solutions.delete(solution.solutionID);
          }
          // console.log("solution.fit.outputCsv", solution.fit.outputCsv);
        }
      });
      call.on('error', function(err) {
        console.log("Error!getProduceSolutionResults", produceSolutionResponseID);
        _reject(err);
      });
      call.on('end', function(err) {
        console.log("End of produce solution results", produceSolutionResponseID);
        if (err) console.log("err is ", err);
        _fulfill(produceSolutionResponseID);
      });
    });
  }

  obj.scoreSolutions = function(sessionVar) {
    // console.log("scoreSolutions called");
    let solutions = Array.from(sessionVar.solutions.values());

    let chain = Promise.resolve();
    for (let i = 0; i < solutions.length; i++) {
      let solution = solutions[i];
      chain = chain.then((solutionID) => {
        return scoreSolution(solution);
      });
    }
    return new Promise(function(fulfill, reject) {
      let _fulfill = fulfill;
      chain.then(function(res) {
        for (let i = 0; i < solutions.length; i++) {
          let solution = solutions[i];
          if (!solution.scores) {
            console.log("WARNING: solution " + solution.solutionID + " has no scores; removing from results set");
            sessionVar.solutions.delete(solution.solutionID);
          }
        }
        _fulfill(sessionVar);
      }).catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
    });
  };

  function scoreSolution(solution) {
    console.log("scoring solution with id", solution.solutionID);
    let scoreSolutionRequest = new proto.ScoreSolutionRequest;
    scoreSolutionRequest.setSolutionId(solution.solutionID);

    let dataset_input = new proto.Value;
    dataset_input.setDatasetUri("file://" + handleImageUrl(evaluationConfig.dataset_schema));
    scoreSolutionRequest.setInputs(dataset_input);

    let metrics = problemSchema.inputs.performanceMetrics.map(d => d.metric);
    let mapped_metrics = metrics.map(metric => getMappedType(metric_mappings, metric));
    let problemPerformanceMetrics = mapped_metrics.map(mapped_metric => {
      let newMetric = new proto.ProblemPerformanceMetric;
      newMetric.setMetric(mapped_metric);
      return newMetric;
    });
    scoreSolutionRequest.setPerformanceMetrics(problemPerformanceMetrics);

    // TODO: the user stuff is actually all optional
    // let solutionRunUser = new proto.SolutionRunUser;
    // solutionRunUser.setId("user1");
    // solutionRunUser.setChoosen(false);
    // solutionRunUser.setReason("none");
    // scoreSolutionRequest.setUsers(solutionRunUser);

    // TODO: scoringConfiguration lets us influence cross valuation
    // and many other evaluation parameters; ignore for now
    let scoringConfiguration = new proto.ScoringConfiguration;
    // TODO: we should do better here
    // scoringConfiguration.setMethod(proto.EvaluationMethod.TRAINING_DATA);
    // I think TRAINING_DATA is pretty much what we did last time, but it's unsupported so far
    // scoringConfiguration.setMethod(proto.EvaluationMethod.HOLDOUT);
    scoringConfiguration.setMethod(proto.EvaluationMethod.HOLDOUT);
    scoringConfiguration.setTrainTestRatio(0.8);
    // TODO: use holdout for now, but let users specify in the future
    // scoringConfiguration.setFolds(2);
    scoreSolutionRequest.setConfiguration(scoringConfiguration);

    return new Promise(function(fulfill, reject) {
      client.scoreSolution(scoreSolutionRequest, function(err, scoreSolutionResponse) {
        if (err) {
          reject(err);
        } else {
          let scoreRequestID = scoreSolutionResponse.request_id;
          getScoreSolutionResults(solution, scoreRequestID, fulfill, reject);
        }
      });
    });
  };

  function getScoreSolutionResults(solution, scoreRequestID, fulfill, reject) {
    let _fulfill = fulfill;
    let _reject = reject;
    let getScoreSolutionResultsRequest = new proto.GetScoreSolutionResultsRequest;
    getScoreSolutionResultsRequest.setRequestId(scoreRequestID);
    let call = client.getScoreSolutionResults(getScoreSolutionResultsRequest);
    call.on('data', function(getScoreSolutionResultsResponse) {
      if (getScoreSolutionResultsResponse.progress.state === 'COMPLETED') {
        console.log("scoreSolutionResultsResponse", getScoreSolutionResultsResponse);
        /*
        let targets = getScoreSolutionResultsResponse.scores.map(score => score.targets);
        */
        let value_keys = getScoreSolutionResultsResponse.scores.map(score => score.value.value);
        let metrics = getScoreSolutionResultsResponse.scores.map(score => score.metric);
        let values = value_keys.map((key,i) => getScoreSolutionResultsResponse.scores[i].value[key]);
        values = values.map((thing) => thing[thing.raw]);
        // console.log("METRICS", metrics);
        // console.log("VALUES", values);
        solution.scores = { };
        for (let i = 0; i < metrics.length; i++) {
          // solution.scores = { f1Macro: _.mean(values) };
          console.log("METRICS", metrics[i], values, "num values", values.length);
          solution.scores[metrics[i].metric] = _.mean(values);
        }
      } else {
        console.log("scoreSolutionResultsResponse INTERMEDIATE", getScoreSolutionResultsResponse);
      }
    });
    call.on('error', function(err) {
      console.log("Error!getScoreSolutionResults: ", scoreRequestID);
      _reject(err);
    });
    call.on('end', function(err) {
      console.log("End of score solution result: ", scoreRequestID);
      if (err) console.log("err is ", err);
      _fulfill(scoreRequestID);
    });
  };

  obj.exportFittedSolution = function(sessionVar, solutionID) {
    console.log("export fitted solution", solutionID);
    let rank = sessionVar.rankVar;
    sessionVar.rankVar = sessionVar.rankVar - 0.00000001;
    let solutionExportRequest = new proto.SolutionExportRequest;
    solutionExportRequest.setFittedSolutionId(sessionVar.solutions.get(solutionID).fit.fitID);
    solutionExportRequest.setRank(rank);
    client.solutionExport(solutionExportRequest, function(solutionExportResponse) {
      // no content specified for this message
      console.log("solution exported");
    });
  };

  obj.endSearchSolutions = function(sessionVar) {
    return new Promise(function(fulfill, reject) {
      console.log("end search solutions for search", sessionVar.searchID);
      let endSearchSolutionsRequest = new proto.EndSearchSolutionsRequest;
      endSearchSolutionsRequest.setSearchId(sessionVar.searchID);
      client.endSearchSolutions(endSearchSolutionsRequest, function(err, endSearchSolutionsResponse) {
        if (err) {
          reject(err);
        } else {
          sessionVar.searchEnded = true;
          fulfill(sessionVar);
        }
      });
    });
  };

  obj.describeSolutions = function(sessionVar) {
    console.log("describeSolutions called");
    let solutions = Array.from(sessionVar.solutions.values());

    let chain = Promise.resolve();
    for (let i = 0; i < solutions.length; i++) {
      let solution = solutions[i];
      chain = chain.then((solutionID) => {
        return describeSolution(solution);
      });
    }
    return new Promise(function(fulfill, reject) {
      let _fulfill = fulfill;
      let _reject = reject;
      chain.then(function(res) {
        _fulfill(sessionVar);
      }).catch(function(err) {
        _reject(err);
      });
    });
  };

  function describeSolution(solution) {
    // doing the shortcut now and see how far this takes us
    console.log("WARNING: TAKING THE DESCRIBE-SOLUTION SHORTCUT FOR NOW");
    return new Promise(function(fulfill, reject) {
      solution.finalOutput = "outputs.0";
      fulfill(solution);
    });
    // THIS DOES NOT GET EXECUTED FOR NOW
    console.log("request describe solution with id", solution.solutionID);
    let describeSolutionRequest = new proto.DescribeSolutionRequest;
    describeSolutionRequest.setSolutionId(solution.solutionID);

    return new Promise(function(fulfill, reject) {
      client.describeSolution(describeSolutionRequest, function(err, describeSolutionResponse) {
        if (err) {
          reject(err);
        } else {
          // this is a PipelineDescription message
          let pipeline = describeSolutionResponse.pipeline;
          // console.log(pipeline);
          let outputs = pipeline.outputs;
          console.log(outputs);
          let finalOutput = outputs[outputs.length - 1].data;
          console.log("selecting final output for ", solution.solutionID, finalOutput);
          solution.finalOutput = finalOutput;
          fulfill(solution);
        }
      });
    });
  };

  // obj.runStartSession;
  // here we return the object that is accessible to everyone through the app
  return obj;

}

exports.connect = connect;
exports.problemSetSerachSolutionRequest = problemSetSerachSolutionRequest;
