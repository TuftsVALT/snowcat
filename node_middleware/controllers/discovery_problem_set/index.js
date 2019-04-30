// The tabular data folder handles preprocessing and routing for tabular data preprocessing
var _ = require("lodash");
var handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};
var fs = require("fs");
var fse = require("fs-extra");
var appRoot = require("app-root-path");
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
// var serachSolutionRequest = require(appRoot + "/lib/js/grpc_client_wrapper.js");
var serachSolutionRequest = require(appRoot + "/Wrapper/Wrapper.js");
var path = require("path");
var papa = require("papaparse");
var jsonfile = require("jsonfile");
var mkdirp = require("mkdirp");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

var metricMappings = {
  classification: [
    "accuracy",
    "f1Micro",
    "f1Macro",
    "rocAucMicro",
    "rocAucMacro"
  ], //, 'precisionAtTopK'],
  regression: [
    "meanSquaredError",
    "rootMeanSquaredError",
    "rootMeanSquaredErrorAvg",
    "meanAbsoluteError",
    "rSquared"
  ],
  clustering: ["normalizedMutualInformation"],
  linkPrediction: [
    "accuracy",
    "f1Micro",
    "f1Macro",
    "rocAucMicro",
    "rocAucMacro"
  ],
  vertexNomination: [
    "accuracy",
    "f1Micro",
    "f1Macro",
    "rocAucMicro",
    "rocAucMacro"
  ],
  communityDetection: [
    "accuracy",
    "f1Micro",
    "f1Macro",
    "rocAucMicro",
    "rocAucMacro"
  ],
  graphMatching: [
    "accuracy",
    "f1Micro",
    "f1Macro",
    "rocAucMicro",
    "rocAucMacro"
  ],
  timeSeriesForecasting: [
    "meanSquaredError",
    "rootMeanSquaredError",
    "rootMeanSquaredErrorAvg",
    "meanAbsoluteError",
    "rSquared"
  ],
  collaborativeFiltering: [
    "meanSquaredError",
    "rootMeanSquaredError",
    "rootMeanSquaredErrorAvg",
    "meanAbsoluteError",
    "rSquared"
  ],
  graphClustering: ["normalizedMutualInformation"],
  objectDetection: ["accuracy", "f1Micro", "f1Macro", "objectDetectionAP"] //'precisionAtTopK',
};

/*
    // these are all task sub types in the problem schema v3.1.1 (used for summar August 2018 evaluation)
      "binary",
			"multiClass",
			"multiLabel",
			"univariate",
			"multivariate",
			"overlapping",
			"nonOverlapping"
*/
var subTaskMappings = {
  classification: ["binary", "multiClass"],
  regression: ["univariate", "multivariate"],
  clustering: ["binary", "multiClass"],
  linkPrediction: ["none"],
  vertexNomination: ["none"],
  communityDetection: ["overlapping", "nonOverlapping"],
  graphMatching: ["none"],
  timeSeriesForecasting: ["none"],
  collaborativeFiltering: ["none"],
  graphClustering: ["none"],
  objectDetection: ["binary", "multiLabel"] //not sure about this
};

var tablularTaskMappings = {
  integer: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ],
  real: [
    "regression",
    "collaborativeFiltering"
  ] /*['classification', 'regression', 'clustering', 'collaborativeFiltering'],*/,
  categorical: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ],
  dateTime: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ],

  string: ["classification", "clustering", "collaborativeFiltering"],
  boolean: ["classification", "clustering", "collaborativeFiltering"],

  // we dont know these are correct or not
  realVector: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ],
  json: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ],
  geojson: [
    "classification",
    "regression",
    "clustering",
    "collaborativeFiltering"
  ]
};

var graphTaskMappings = {
  integer: [
    "classification",
    "regression",
    "clustering",
    "linkPrediction",
    "vertexNomination",
    "communityDetection",
    "graphClustering",
    "collaborativeFiltering"
  ],
  //graphMatching
  //"real": ['classification', 'regression', 'clustering', 'linkPrediction', 'vertexNomination', 'communityDetection', 'graphClustering','collaborativeFiltering'],
  real: [
    "regression",
    "linkPrediction",
    "vertexNomination",
    "communityDetection",
    "graphClustering",
    "collaborativeFiltering"
  ],

  categorical: [
    "classification",
    "regression",
    "clustering",
    "linkPrediction",
    "vertexNomination",
    "communityDetection",
    "graphClustering",
    "collaborativeFiltering"
  ],

  string: [
    "classification",
    "regression",
    "clustering",
    "linkPrediction",
    "vertexNomination",
    "communityDetection",
    "graphClustering",
    "collaborativeFiltering"
  ],
  boolean: [
    "classification",
    "regression",
    "clustering",
    "linkPrediction",
    "vertexNomination",
    "communityDetection",
    "graphClustering",
    "collaborativeFiltering"
  ]
};

var preprocessProblemDesc = function() {
  var dataDescMetadata = {
    resourceType: {
      id: [],
      type: []
    },
    columnType: {
      id: [],
      name: [],
      type: [],
      resObject: []
    }
  };

  //Each singleProblem will have this object: They will be pushed in problemSets and can be access by problemSets[i].problemID and so on
  /*singleProblem = {
    problemID: '', //number
    targetFeature: '',
    //predictFeatures is an array of target features
    predictFeatures: [],
    taskType: '',
    metric: '',
    priority: '', //'default' has higher priority and 'null' without any
    creationType: '', //'auto', 'user', or 'mixed'
    meaningfull: 'yes', 'no' or 'undefined',
    description: ''
  };
  */
  var singleProblem,
    problemSets = [];

  var returnSet = {
    dataDescMetadata: {},
    problemSets: []
  };

  var dataDescFile = datasetSchema;

  dataDescFile.dataResources.forEach(drs => {
    dataDescMetadata.resourceType.id.push(drs["resID"]);
    //console.log("drs:"+drs["resID"]);
    dataDescMetadata.resourceType.type.push(drs["resType"]);
    if (drs["resType"] == "table") {
      drs["columns"].forEach(drc => {
        if (drc["colName"] != "d3mIndex") {
          dataDescMetadata.columnType.id.push(drc["colIndex"]);
          dataDescMetadata.columnType.name.push(drc["colName"]);
          dataDescMetadata.columnType.type.push(drc["colType"]);
          //console.log("drc[colType]:"+drc["colType"]);
          if (drc["refersTo"]) {
            dataDescMetadata.columnType.resObject.push(
              drc["refersTo"]["resObject"]
            );
          } else {
            dataDescMetadata.columnType.resObject.push("null");
          }
        }
      });
    }
  });

  /*
    //This code has been replaced by the above refactored code. This is just to keep for the August 2018 evaluation for the reference point if some error occurs

    for(var i = 0; i < dataDescFile.dataResources.length; i++){
      dataDescMetadata.resourceType.id.push(dataDescFile.dataResources[i].resID);
      dataDescMetadata.resourceType.type.push(dataDescFile.dataResources[i].resType);
      if(dataDescFile.dataResources[i].hasOwnProperty('columns')){
        for(var j = 0; j < dataDescFile.dataResources[i].columns.length; j++){
          if(dataDescFile.dataResources[i].columns[j].colName != "d3mIndex"){
            dataDescMetadata.columnType.id.push(dataDescFile.dataResources[i].columns[j].colIndex);
            dataDescMetadata.columnType.name.push(dataDescFile.dataResources[i].columns[j].colName);
            dataDescMetadata.columnType.type.push(dataDescFile.dataResources[i].columns[j].colType);
            if(dataDescFile.dataResources[i].columns[j].hasOwnProperty('refersTo')){
                dataDescMetadata.columnType.resObject.push(dataDescFile.dataResources[i].columns[j].refersTo.resObject);
            }
            else{
                dataDescMetadata.columnType.resObject.push("null");
            }
          }
        }
      }

    }


  console.log("dataDescMetadata:"+dataDescMetadata.resourceType.id);
  console.log(dataDescMetadata.resourceType.type);
  console.log("id:"+dataDescMetadata.columnType.id);
  console.log(dataDescMetadata.columnType.name);
  console.log(dataDescMetadata.columnType.type);
  console.log(dataDescMetadata.columnType.resObject);
*/

  if (_.includes(dataDescMetadata.resourceType.type, "graph")) {
    //console.log("Data has graph");
    var count = 0;

    for (var i = 0; i < dataDescMetadata.columnType.id.length; i++) {
      if (
        dataDescMetadata.columnType.type[i] == "integer" ||
        dataDescMetadata.columnType.type[i] == "real" ||
        dataDescMetadata.columnType.type[i] == "categorical" ||
        dataDescMetadata.columnType.type[i] == "string" ||
        dataDescMetadata.columnType.type[i] == "boolean"
      ) {
        console.log(dataDescMetadata.columnType.type[i]);
        if (dataDescMetadata.columnType.resObject[i] == "null") {
          for (var k = 0; k < graphTaskMappings.integer.length; k++) {
            if (graphTaskMappings.integer[k] == "classification") {
              for (var l = 0; l < metricMappings.classification.length; l++) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];

                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }

                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.classification[l];
                singleProblem.priority = "null";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with classification task";
                problemSets.push(singleProblem);
              }
            } // end of if for classification
            else if (graphTaskMappings.integer[k] == "regression") {
              for (var l = 0; l < metricMappings.regression.length; l++) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.regression[l];
                singleProblem.priority = "null";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with regression task";
                problemSets.push(singleProblem);
              }
            } // end of if for regression
            else if (graphTaskMappings.integer[k] == "clustering") {
              for (var l = 0; l < metricMappings.clustering.length; l++) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.clustering[l];
                singleProblem.priority = "null";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with clustering task";
                problemSets.push(singleProblem);
              }
            } //end of if for clustering
            else if (graphTaskMappings.integer[k] == "linkPrediction") {
              for (var l = 0; l < metricMappings.linkPrediction.length; l++) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.linkPrediction[l];
                singleProblem.priority = "default";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with link-prediction task";
                problemSets.push(singleProblem);
              }
            } //end of if for link prediction
            else if (graphTaskMappings.integer[k] == "vertexNomination") {
              for (var l = 0; l < metricMappings.vertexNomination.length; l++) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.vertexNomination[l];
                singleProblem.priority = "default";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with vertex-nomination task";
                problemSets.push(singleProblem);
              }
            } //end of if for communityDetection
            else if (graphTaskMappings.integer[k] == "communityDetection") {
              for (
                var l = 0;
                l < metricMappings.communityDetection.length;
                l++
              ) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.communityDetection[l];
                singleProblem.priority = "default";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with community-detection task";
                problemSets.push(singleProblem);
              }
            } //end of if for communityDetection
            else if (graphTaskMappings.integer[k] == "graphClustering") {
              for (var l = 0; l < metricMappings.graphClustering.length; l++) {
                singleProblem;
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.graphClustering[l];
                singleProblem.priority = "default";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with grtaph-clustering task";
                problemSets.push(singleProblem);
              }
            } //end of if for graphClustering
            else if (graphTaskMappings.integer[k] == "collaborativeFiltering") {
              for (
                var l = 0;
                l < metricMappings.collaborativeFiltering.length;
                l++
              ) {
                singleProblem = {};
                count++;
                singleProblem.problemID = count;

                singleProblem.targetFeature =
                  dataDescMetadata.columnType.name[i];
                var targets = [];
                for (
                  var j = 0;
                  j < dataDescMetadata.columnType.id.length;
                  j++
                ) {
                  if (
                    j != i &&
                    dataDescMetadata.columnType.resObject[j] != "null"
                  ) {
                    targets.push(dataDescMetadata.columnType.name[j]);
                  }
                }
                singleProblem.predictFeatures = targets;
                singleProblem.taskType = graphTaskMappings.integer[k];
                singleProblem.metric = metricMappings.collaborativeFiltering[l];
                singleProblem.priority = "null";
                singleProblem.creationType = "auto";
                singleProblem.meaningful = "undefined";
                singleProblem.description =
                  "This is a graph problem with collaborative-filtering task";
                problemSets.push(singleProblem);
              }
            } //end of if for graphClustering
          } //end of for statment
        } //end of if statement for null
      } //end of if statement, integer, real and etc.
    } //end of main for for graph

    // adding graph matching if there are two or more graphTaskMappings
    var totalGraphs = 0;
    for (var i = 0; i < dataDescMetadata.resourceType.id.length; i++) {
      if (dataDescMetadata.resourceType.type[i] == "graph") {
        totalGraphs++;
      }
    }
    //console.log('totalGraphs:'+totalGraphs);
    // if there are more than one graph, then we also need to do graph matching
    if (totalGraphs > 1) {
      // console.log("There are more than one graph");
      for (var i = 0; i < metricMappings.graphMatching.length; i++) {
        singleProblem = {};
        count++;
        singleProblem.problemID = count;

        singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
        var targets = [];
        for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
          if (j != i && dataDescMetadata.columnType.resObject[j] != "null") {
            targets.push(dataDescMetadata.columnType.name[j]);
          }
        }
        singleProblem.predictFeatures = targets;
        singleProblem.taskType = "graphMatching";
        singleProblem.metric = metricMappings.graphMatching[i];
        singleProblem.priority = "default";
        singleProblem.creationType = "auto";
        singleProblem.meaningful = "undefined";
        singleProblem.description =
          "This is a graph problem with more than one graphs and with graph-matching task";
        problemSets.push(singleProblem);
      }
    } // end of totalGraphs > 1
  } //end of main if statement for graph
  else if (
    _.includes(dataDescMetadata.resourceType.type, "table") ||
    _.includes(dataDescMetadata.resourceType.type, "text") ||
    _.includes(dataDescMetadata.resourceType.type, "image") ||
    _.includes(dataDescMetadata.resourceType.type, "audio") ||
    _.includes(dataDescMetadata.resourceType.type, "video") ||
    _.includes(dataDescMetadata.resourceType.type, "speech") ||
    _.includes(dataDescMetadata.resourceType.type, "timeseries")
  ) {
    console.log("Data has table and text");
    var count = 0;

    for (var i = 0; i < dataDescMetadata.columnType.id.length; i++) {
      //to see if the current fiild is associated to any raw data type
      var resObject = "";
      if (dataDescMetadata.columnType.resObject[i] == "null") {
        resObject = "table";
      } else if (_.includes(dataDescMetadata.resourceType.type, "text")) {
        resObject = "text";
      } else if (
        _.includes(dataDescMetadata.resourceType.type, "audio") &&
        dataDescMetadata.columnType.resObject[i] == "item"
      ) {
        resObject = "audio";
      } else if (
        _.includes(dataDescMetadata.resourceType.type, "video") &&
        dataDescMetadata.columnType.resObject[i] == "item"
      ) {
        resObject = "video";
      } else if (
        _.includes(dataDescMetadata.resourceType.type, "speech") &&
        dataDescMetadata.columnType.resObject[i] == "item"
      ) {
        resObject = "speech";
      } else if (
        _.includes(dataDescMetadata.resourceType.type, "image") &&
        dataDescMetadata.columnType.resObject[i] == "item"
      ) {
        resObject = "image";
      } else if (
        _.includes(dataDescMetadata.resourceType.type, "timeseries") &&
        dataDescMetadata.columnType.resObject[i] == "item"
      ) {
        resObject = "timeseries";
      }

      //////////new
      if (dataDescMetadata.columnType.type[i] == "real") {
        for (var k = 0; k < tablularTaskMappings.real.length; k++) {
          if (tablularTaskMappings.real[k] == "regression") {
            for (var l = 0; l < metricMappings.regression.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = "regression";
              singleProblem.metric = metricMappings.regression[l];
              singleProblem.priority = "null";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with regression task');
              singleProblem.description =
                "This is a regressions task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.real[k] == "collaborativeFiltering") {
            for (
              var l = 0;
              l < metricMappings.collaborativeFiltering.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = "collaborativeFiltering";
              singleProblem.metric = metricMappings.collaborativeFiltering[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "null";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with collaborative-filtering task');
              singleProblem.description =
                "This is a collaborative-filtering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          }
        }
      }

      /////////
      //if(_.includes(dataDescMetadata.columnType.type[i], 'categorical' || 'integer')){
      if (
        dataDescMetadata.columnType.type[i] == "categorical" ||
        dataDescMetadata.columnType.type[i] == "integer"
      ) {
        //} || dataDescMetadata.columnType.type[i] == 'real'){

        // then we can do: classification, regression, clustering and collaborativeFiltering
        for (var k = 0; k < tablularTaskMappings.categorical.length; k++) {
          if (tablularTaskMappings.integer[k] == "classification") {
            for (var l = 0; l < metricMappings.classification.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.categorical[k];
              singleProblem.metric = metricMappings.classification[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "default";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              singleProblem.description =
                "This is a classification task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.integer[k] == "regression") {
            for (var l = 0; l < metricMappings.regression.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.integer[k];
              singleProblem.metric = metricMappings.regression[l];
              singleProblem.priority = "null";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with regression task');
              singleProblem.description =
                "This is a regressions task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.integer[k] == "clustering") {
            for (var l = 0; l < metricMappings.clustering.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.integer[k];
              singleProblem.metric = metricMappings.clustering[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "null";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with clustering task');
              singleProblem.description =
                "This is a clustering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (
            tablularTaskMappings.integer[k] == "collaborativeFiltering"
          ) {
            for (
              var l = 0;
              l < metricMappings.collaborativeFiltering.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.integer[k];
              singleProblem.metric = metricMappings.collaborativeFiltering[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "null";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with collaborative-filtering task');
              singleProblem.description =
                "This is a collaborative-filtering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } //else if

          // In the case if one of the target features has dateTime feature
          if (
            _.includes(dataDescMetadata.columnType.type, "dateTime") &&
            dataDescMetadata.columnType.type[i] != "dateTime"
          ) {
            for (
              var l = 0;
              l < metricMappings.timeSeriesForecasting.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = "timeSeriesForecasting";
              singleProblem.metric = metricMappings.timeSeriesForecasting[l];
              singleProblem.priority = "default";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              singleProblem.description =
                "This is a time-series forcasting task where the time-series is one of the target field(s)";
              problemSets.push(singleProblem);
            }
          }
        } //end of for (var k = 0; k < tablularTaskMappings.categorical.length; k++)

        //For image, audio, video, and speech data, we also need object detection
        if (
          (_.includes(dataDescMetadata.resourceType.type, "image") ||
            _.includes(dataDescMetadata.resourceType.type, "audio") ||
            _.includes(dataDescMetadata.resourceType.type, "video") ||
            _.includes(dataDescMetadata.resourceType.type, "speech")) &&
          dataDescMetadata.columnType.resObject[i] != "item"
        ) {
          for (var l = 0; l < metricMappings.objectDetection.length; l++) {
            singleProblem = {};
            count++;
            singleProblem.problemID = count;

            singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
            var targets = [];
            for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
              if (j != i) {
                targets.push(dataDescMetadata.columnType.name[j]);
              }
            }
            singleProblem.predictFeatures = targets;
            singleProblem.taskType = "objectDetection";
            singleProblem.metric = metricMappings.objectDetection[l];
            singleProblem.priority = "default";
            singleProblem.creationType = "auto";
            singleProblem.meaningful = "undefined";
            singleProblem.description =
              "This is an object Detection task with image/audio/video/speech field as one of the target field(s)";
            problemSets.push(singleProblem);
          }
        }

        if (
          _.includes(dataDescMetadata.resourceType.type, "timeseries") &&
          dataDescMetadata.columnType.resObject[i] != "item"
        ) {
          for (
            var l = 0;
            l < metricMappings.timeSeriesForecasting.length;
            l++
          ) {
            singleProblem = {};
            count++;
            singleProblem.problemID = count;

            singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
            var targets = [];
            for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
              if (j != i) {
                targets.push(dataDescMetadata.columnType.name[j]);
              }
            }
            singleProblem.predictFeatures = targets;
            singleProblem.taskType = "timeSeriesForecasting";
            singleProblem.metric = metricMappings.timeSeriesForecasting[l];
            singleProblem.priority = "default";
            singleProblem.creationType = "auto";
            singleProblem.meaningful = "undefined";
            singleProblem.description =
              "This is a time-series forcasting task where the time-series is one of the target field(s)";
            problemSets.push(singleProblem);
          }
        }
      } // end of if(dataDescMetadata.columnType.type[i] == 'categorical' || dataDescMetadata.columnType.type[i] == 'integer' || dataDescMetadata.columnType.type[i] == 'real')
      else if (
        dataDescMetadata.columnType.type[i] == "string" ||
        dataDescMetadata.columnType.type[i] == "boolean"
      ) {
        // then we can do: classification, clustering and collaborativeFiltering

        for (var k = 0; k < tablularTaskMappings.categorical.length; k++) {
          if (tablularTaskMappings.string[k] == "classification") {
            for (var l = 0; l < metricMappings.classification.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.string[k];
              singleProblem.metric = metricMappings.classification[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "default";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with classification task');
              singleProblem.description =
                "This is a classification task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.string[k] == "clustering") {
            for (var l = 0; l < metricMappings.clustering.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.string[k];
              singleProblem.metric = metricMappings.clustering[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "null";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //  singleProblem.description = 'This is a tabular data set with clustering task');
              singleProblem.description =
                "This is a clustering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (
            tablularTaskMappings.string[k] == "collaborativeFiltering"
          ) {
            for (
              var l = 0;
              l < metricMappings.collaborativeFiltering.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.string[k];
              singleProblem.metric = metricMappings.collaborativeFiltering[l];
              if (
                _.includes(dataDescMetadata.resourceType.type, "text") &&
                dataDescMetadata.columnType.resObject[i] == "item"
              ) {
                singleProblem.priority = "default";
              } else {
                singleProblem.priority = "null";
              }
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with collaborative-filtering task');
              singleProblem.description =
                "This is a collaborative-filtering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } //else if

          // In the case if one of the target features has dateTime feature
          if (
            _.includes(dataDescMetadata.columnType.type, "dateTime") &&
            dataDescMetadata.columnType.type[i] != "dateTime"
          ) {
            for (
              var l = 0;
              l < metricMappings.timeSeriesForecasting.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = "timeSeriesForecasting";
              singleProblem.metric = metricMappings.timeSeriesForecasting[l];
              singleProblem.priority = "default";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              singleProblem.description =
                "This is a time-series forcasting task where the time-series is one of the target field(s)";
              problemSets.push(singleProblem);
            }
          }
        } //for (var k = 0; k < tablularTaskMappings.categorical.length; k++)

        //For image, audio, video, and speech data, we also need object detection
        if (
          (_.includes(dataDescMetadata.resourceType.type, "image") ||
            _.includes(dataDescMetadata.resourceType.type, "audio") ||
            _.includes(dataDescMetadata.resourceType.type, "video") ||
            _.includes(dataDescMetadata.resourceType.type, "speech")) &&
          dataDescMetadata.columnType.resObject[i] != "item"
        ) {
          for (var l = 0; l < metricMappings.objectDetection.length; l++) {
            singleProblem = {};
            count++;
            singleProblem.problemID = count;

            singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
            var targets = [];
            for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
              if (j != i) {
                targets.push(dataDescMetadata.columnType.name[j]);
              }
            }
            singleProblem.predictFeatures = targets;
            singleProblem.taskType = "objectDetection";
            singleProblem.metric = metricMappings.objectDetection[l];
            singleProblem.priority = "default";
            singleProblem.creationType = "auto";
            singleProblem.meaningful = "undefined";
            singleProblem.description =
              "This is an object Detection task with image/audio/video/speech field as one ofn the target field(s)";
            problemSets.push(singleProblem);
          }
        } // end of if for images/audio/speech/image

        if (
          _.includes(dataDescMetadata.resourceType.type, "timeseries") &&
          dataDescMetadata.columnType.resObject[i] != "item"
        ) {
          for (
            var l = 0;
            l < metricMappings.timeSeriesForecasting.length;
            l++
          ) {
            singleProblem = {};
            count++;
            singleProblem.problemID = count;

            singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
            var targets = [];
            for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
              if (j != i) {
                targets.push(dataDescMetadata.columnType.name[j]);
              }
            }
            singleProblem.predictFeatures = targets;
            singleProblem.taskType = "timeSeriesForecasting";
            singleProblem.metric = metricMappings.timeSeriesForecasting[l];
            singleProblem.priority = "default";
            singleProblem.creationType = "auto";
            singleProblem.meaningful = "undefined";
            singleProblem.description =
              "This is a time-series forcasting task where the time-series is one of the target field(s)";
            problemSets.push(singleProblem);
          }
        }
      } //end of if(dataDescMetadata.columnType.type[i] == 'string' || dataDescMetadata.columnType.type[i] == 'boolean')
      else if (dataDescMetadata.columnType.type[i] == "dateTime") {
        for (var k = 0; k < tablularTaskMappings.dateTime.length; k++) {
          if (tablularTaskMappings.dateTime[k] == "classification") {
            for (var l = 0; l < metricMappings.classification.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.dateTime[k];
              singleProblem.metric = metricMappings.classification[l];
              singleProblem.priority = "default";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              singleProblem.description =
                "This is a classification task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.dateTime[k] == "regression") {
            for (var l = 0; l < metricMappings.regression.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.dateTime[k];
              singleProblem.metric = metricMappings.regression[l];
              singleProblem.priority = "default";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with regression task');
              singleProblem.description =
                "This is a regressions task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (tablularTaskMappings.dateTime[k] == "clustering") {
            for (var l = 0; l < metricMappings.clustering.length; l++) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.dateTime[k];
              singleProblem.metric = metricMappings.clustering[l];
              singleProblem.priority = "default";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with clustering task');
              singleProblem.description =
                "This is a clustering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } else if (
            tablularTaskMappings.dateTime[k] == "collaborativeFiltering"
          ) {
            for (
              var l = 0;
              l < metricMappings.collaborativeFiltering.length;
              l++
            ) {
              singleProblem = {};
              count++;
              singleProblem.problemID = count;

              singleProblem.targetFeature = dataDescMetadata.columnType.name[i];
              var targets = [];
              for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
                if (j != i) {
                  targets.push(dataDescMetadata.columnType.name[j]);
                }
              }
              singleProblem.predictFeatures = targets;
              singleProblem.taskType = tablularTaskMappings.dateTime[k];
              singleProblem.metric = metricMappings.collaborativeFiltering[l];
              singleProblem.priority = "null";
              singleProblem.creationType = "auto";
              singleProblem.meaningful = "undefined";
              //singleProblem.description = 'This is a tabular data set with collaborative-filtering task');
              singleProblem.description =
                "This is a collaborative-filtering task with " +
                resObject +
                " field as prediction field";
              problemSets.push(singleProblem);
            }
          } //else if
        } //end of for (var k = 0; k < tablularTaskMappings.dateTime.length; k++)
      } //end of else if(dataDescMetadata.columnType.type[i] == 'timeDate')
    }
  } // end of main if for "table"

  console.log("Initial problem sets have been created!");
  /*
  for(var i = 0; i < problemSets.length; i++){
      console.log("Problem ID:" + problemSets[i].problemID + " || Target Feature:" + problemSets[i].targetFeature +"  ||  Predict Features:" + problemSets[i].predictFeatures + " || Task Type:" + problemSets[i].taskType + " || Metric:" + problemSets[i].metric + " || Priority:" + problemSets[i].priority + " || Creation Type:" + problemSets[i].creationType + " || Meaningful:" + problemSets[i].meaningful + " || Problem Desc:" + problemSets[i].description);
  }
*/

  returnSet.dataDescMetadata = dataDescMetadata;
  returnSet.problemSets = problemSets;
  /*for(var i = 0; i < problemSets.length ; i++){
    console.log("problemSets:"+i + " " + problemSets[i].targetFeature + " "+problemSets[i].predictFeatures + " "+problemSets[i].taskType + " "+ problemSets[i].metric);
}*/

  return returnSet;
};

/*singleProblem = {
  problemID: '', //number
  targetFeature: '',
  //predictFeatures is an array of target features
  predictFeatures: [],
  taskType: '',
  metric: '',
  priority: '', //'default' has higher priority and 'null' without any
  creationType: '', //'auto', 'user', or 'interactive'
  meaningfull: false,
  description: ''
};
*/

var probleSetsGeneration = function(finalProblemSets, dataDescMetadata) {
  var dataDescFile = datasetSchema;

  var problemLabels = [];
  //var user_problems_root = '';
  var user_problems_root; //evaluationConfig.temp_storage_root + '/output/problems';;

  if (evaluationConfig.hasOwnProperty("user_problem_root")) {
    user_problems_root = evaluationConfig.user_problem_root;
  } else {
    // user_problems_root = evaluationConfig.temp_storage_root + '/output/problems';
    user_problems_root = "/output/problem_desc";
  }

  // check if we are running in a container
  if (!fs.existsSync("/output/")) {
    user_problems_root = appRoot + "/output/problems";
  }

  console.log("user_problems_root:" + user_problems_root);

  for (var i = 0; i < finalProblemSets.length; i++) {
    // meta-data for creating problem description json
    var problemSetFile = {
      about: {
        problemID:
          dataDescFile.about.datasetName +
          "_Problem_" +
          finalProblemSets[i].problemID,
        problemName: dataDescFile.about.datasetName + "_Problem",
        problemDescription: finalProblemSets[i].description,
        taskType: finalProblemSets[i].taskType,
        //taskSubType: 'undefined',
        problemSchemaVersion: dataDescFile.about.datasetSchemaVersion,
        problemVersion: "1.0"
      },
      inputs: {
        data: [],
        dataSplits: {
          method: "holdOut",
          testSize: 0.2,
          numFolds: 0,
          stratified: true,
          numRepeats: 0,
          randomSeed: 42,
          splitsFile: "dataSplits.csv"
        },
        performanceMetrics: []
      },
      expectedOutputs: {
        predictionsFile: "predictions.csv",
        scoresFile: "scores.csv"
      }
    };

    //object to be part of problemSetFile.data
    var dataArray = {
      datasetID: dataDescFile.about.datasetID,
      targets: []
    };

    //object to be part of dataArray.targets
    var predictionsArray = {
      targetIndex: 0,
      resID: "",
      colIndex: 0,
      colName: finalProblemSets[i].targetFeature
      // numClusters: null //not required, so can be ignored
    };

    //setting problemVersion. If there is not datasetversion then it becomes default '1.0' version
    if (dataDescFile.about.hasOwnProperty("datasetVersion")) {
      problemSetFile.about.problemVersion = dataDescFile.about.datasetVersion;
    }

    // this is to assign predictionsArray resID and column index
    for (var j = 0; j < dataDescMetadata.columnType.id.length; j++) {
      if (
        finalProblemSets[i].targetFeature == dataDescMetadata.columnType.name[j]
      ) {
        predictionsArray.colIndex = Number(dataDescMetadata.columnType.id[j]);

        for (var k = 0; k < dataDescMetadata.resourceType.id.length; k++) {
          if (
            dataDescMetadata.columnType.resObject[j] == "null" &&
            dataDescMetadata.resourceType.type[k] == "table"
          ) {
            predictionsArray.resID = dataDescMetadata.resourceType.id[
              k
            ].toString();
          } else if (
            dataDescMetadata.columnType.resObject[j] != "null" &&
            dataDescMetadata.resourceType.type[k] != "table"
          ) {
            predictionsArray.resID = dataDescMetadata.resourceType.id[
              k
            ].toString();
          }
        } //end of inner for loop
      } //end of if loop
    } //end of for loop

    dataArray.targets.push(predictionsArray);
    problemSetFile.inputs.data.push(dataArray);

    var perFormanceMetricsArray = {
      metric: finalProblemSets[i].metric
    };

    problemSetFile.inputs.performanceMetrics.push(perFormanceMetricsArray);

    //console.log("Problem Set "+i+" json has been created!");

    //only for the first time to create new directory if it does not exits, or re-create the previous one
    if (i == 0) {
      if (!fs.existsSync(user_problems_root)) {
        console.log("create folder at", user_problems_root);
        fs.mkdirSync(user_problems_root);
        console.log(
          "New Directory -- " +
            user_problems_root +
            " -- has been created for problem set"
        );
      } else {
        console.log("re-creating folder at", user_problems_root);
        fse.removeSync(user_problems_root);
        fs.mkdirSync(user_problems_root);
        console.log(
          "Directory -- " +
            user_problems_root +
            " -- has been re-created for problem set"
        );
      }
    }

    //generating problem direcotry and file
    let noSpacesId = problemSetFile.about.problemID.split(" ").join("_");
    // var problemDir = user_problems_root + '/' + problemSetFile.about.problemID;
    var problemDir = user_problems_root + "/" + noSpacesId;

    if (!fs.existsSync(problemDir)) {
      console.log("create folder at", problemDir);
      fs.mkdirSync(problemDir);
    } else {
      console.log("re-creating folder at", problemDir);
      fse.removeSync(problemDir);
      fs.mkdirSync(problemDir);
    }

    var filePath = problemDir + "/schema.json";

    jsonfile.writeFileSync(filePath, problemSetFile, function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log(
          "Problem Description JSON File has been created at " +
            problemDir +
            " directory"
        );
      }
    });

    //creating a row for label.csv and storing it in the problemLabels array
    var label = {};
    label.problem_id = problemSetFile.about.problemID;
    label.system = finalProblemSets[i].creationType;
    if (
      finalProblemSets[i].meaningful == "yes" ||
      finalProblemSets[i].meaningful == "no"
    ) {
      label.meaningful = finalProblemSets[i].meaningful;
    } else {
      label.meaningful = "not_asked";
    }
    problemLabels.push(label);

    //console.log("problemSetFile:"+problemSetFile);
    serachSolutionRequest.problemSetSerachSolutionRequest(
      problemSetFile,
      problemDir
    );
  } //end iof main for (var i = 0; i < finalProblemSets.length; i++)

  //writing labels.scv file for all problems
  const csvWriter = createCsvWriter({
    path: user_problems_root + "/labels.csv",
    header: [
      { id: "problem_id", title: "problem_id" },
      { id: "system", title: "system" },
      { id: "meaningful", title: "meaningful" }
    ]
  });

  csvWriter
    .writeRecords(problemLabels) // returns a promise
    .then(() => {
      console.log("labels.csv file has been created!");
    });

  console.log(
    "Probel Set JSON files and the corresponding SearchSolutionsRequest JSON files have been created sucessfully.!!!"
  );
};

module.exports.set = function(app, server, grpcClientWrapper, socket) {
  var returnSet;

  socket.on("handleProblemSetCreation", function() {
    returnSet = preprocessProblemDesc();
    //probleSetsGeneration();
    socket.emit("problemSetProcessed", returnSet.problemSets);
  });

  socket.on("problemDiscoveryJSONCreation", function(data) {
    probleSetsGeneration(data, returnSet.dataDescMetadata);
  });
};
