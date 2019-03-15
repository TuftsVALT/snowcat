import axios from 'axios'
import Vue from 'vue'

var socket = require("./socket.js")

// initial state
const state = {
  userProblemID: 1,
  generatedProblems: [],
  initialTaskTypes: [
    'Classification',
    'Regression',
    'Clustering',
    'Link Prediction',
    'Vertex Nomination',
    'Community Detection',
    'Graph Clustering',
    'Graph Matching',
    'Time Series Forecasting',
     'Collaborative Filtering'
  ],
  // initialTaskSubTypes: [
  //   'binary',
  //   'multiClass',
  //   'multiLabel',
  //   'univariate',
  //   'multivariate',
  //   'overlapping',
  //   'nonOverlapping'
  // ],
  initialMetricTypes: [
    'Accuracy',
    'F1',
    'F1Micro',
    'F1Macro',
    'RocAuc',
    'RocAucMicro',
    'RocAucMacro',
    'MeanSquaredError',
    'RootMeanSquaredErrorAvg',
    'MeanAbsoluteErro',
    'RSquare',
    'NormalizedMutualInformation',
    'JaccardSimilarityScore',
    'PrecisionAtTopK'
  ]
}
// "classification",
// "regression",
// "clustering",
// "linkPrediction",
// "vertexNomination",
// "communityDetection",
// "graphClustering",
// "graphMatching",
// "timeSeriesForecasting",
// "collaborativeFiltering"
// getters
const getters = {
  taskTypes: state => (featureType, datasetDoc) =>  {
    console.log('featureType is ', featureType)
    var taskTypeList = []

    // classification
    if ( _.includes(['boolean', 'integer', 'categorical'], featureType) ) { taskTypeList.push('classification') }

    // regression
    if ( _.includes(['integer', 'real'], featureType) ) { taskTypeList.push('regression') }

    // Let's skip clustering

    // communityDetection
    // if feature is categorical or binary, and if the same table as the provided feature has at least one node feature
    if ( _.includes(['binary', 'categorical'], featureType)) {
      var dataTableOfFeature = _.find(datasetDoc.dataResources, (res) => { return res.resType == 'table' })
      if ( dataTableOfFeature ) {
        var graphFeatures = _.filter(dataTableOfFeature.columns, (col) => {
          return col.refersTo && col.refersTo.resObject == 'node'
        })
        if ( graphFeatures.length > 0 ) { taskTypeList.push('linkPrediction') }
      }
    }

    // linkPrediction
    // if feature is categorical or binary, and if the same table as the provided feature has two features that refer to nodes WITH THE SAME resID
    if ( _.includes(['binary', 'categorical'], featureType)) {
      var dataTableOfFeature = _.find(datasetDoc.dataResources, (res) => { return res.resType == 'table' })
      if ( dataTableOfFeature ) {
        var graphFeatures = _.filter(dataTableOfFeature.columns, (col) => {
          return col.refersTo && col.refersTo.resObject == 'node'
        })
        var graphIdCounts = _.countBy(graphFeatures, (feature) => { return feature.refersTo.resID } )
        var maxCount = _.max(_.values(graphIdCounts))
        if ( graphFeatures.length > 1 && maxCount > 1 ) { taskTypeList.push('linkPrediction') }
      }
    }

    // vertexNomination
    // I don't think we have a dataset for this, so I don't know the rules.

    // graphMatching
    // if feature is categorical or binary, and if the same table as the provided feature has two features that refer to nodes WITH DIFFERENT resID
    if ( _.includes(['binary', 'categorical'], featureType)) {
      var dataTableOfFeature = _.find(datasetDoc.dataResources, (res) => { return res.resType == 'table' })
      if ( dataTableOfFeature ) {
        var graphFeatures = _.filter(dataTableOfFeature.columns, (col) => {
          return col.refersTo && col.refersTo.resObject == 'node'
        })
        console.log("graphFeatures are ", graphFeatures)
        var uniqueReferencedGraphIds = _.uniqBy(graphFeatures, (feature) => { console.log("in uniqBy, feature is ", feature); return feature.refersTo.resID } )
        console.log("uniqueReferencedGraphIds is ", uniqueReferencedGraphIds)
        if ( graphFeatures.length > 1 && uniqueReferencedGraphIds.length > 1 ) { taskTypeList.push('graphMatching') }
      }
    }

    // timeSeriesForecasting
    // feature is real (or integer, I guess), and there is a column with role "timeIndicator"
    if ( _.includes(['real', 'integer'], featureType)) {
      var dataTableOfFeature = _.find(datasetDoc.dataResources, (res) => { return res.resType == 'table' })
      if ( dataTableOfFeature ) {
        var timeFeatures = _.filter(dataTableOfFeature.columns, (col) => {
          return col.role && _.includes(col.role, 'timeIndicator')
        })
        if ( timeFeatures.length > 0 ) { taskTypeList.push('timeSeriesForecasting') }
      }
    }

    // collaborativeFiltering
    // feature is real or integer, and... really nothing else.  This is a less well-defined data schema
    if ( _.includes(['real', 'integer'], featureType)) { taskTypeList.push('collaborativeFiltering') }

    if ( featureType ) {
      return taskTypeList
    } else {
      return []
    }
  },
  taskSubTypes: state => (taskType) =>  {
    // This can be a straight up hash, no logic involved.
    // 'classification': ['binary', 'multiClass']
    // 'regression': ['univariate', 'multivariate'],

    // Actually, some of these aren't valid - binary or multiClass are determined by the number of values of a
    // column...  Let's just force the subtype for now.
    // Eventually, we need to handle this more intelligently.
    // subTypeMappings = {
    //   'clustering': [],
    //   'communityDetection': []
    // }
    // return state.initialTaskSubTypes
  },
  metricTypes: state => (taskType) =>  {
    var metricMappings = {
      "classification": ['accuracy', 'f1Micro', 'f1Macro', 'rocAucMicro', 'rocAucMacro', 'precisionAtTopK'],
      "regression": ['meanSquaredError', 'rootMeanSquaredError', 'rootMeanSquaredErrorAvg', 'meanAbsoluteError', 'rSquared'],
      "clustering": ['normalizedMutualInformation'],
      "linkPrediction": ['accuracy', 'f1Micro', 'f1Macro', 'rocAucMicro', 'rocAucMacro'],
      "vertexNomination": ['accuracy', 'f1Micro', 'f1Macro', 'rocAucMicro', 'rocAucMacro'],
      "communityDetection": ['accuracy', 'f1Micro', 'f1Macro', 'rocAucMicro', 'rocAucMacro'],
      "graphMatching": ['accuracy', 'f1Micro', 'f1Macro', 'rocAucMicro', 'rocAucMacro'],
      "timeSeriesForecasting": ['meanSquaredError', 'rootMeanSquaredError', 'rootMeanSquaredErrorAvg', 'meanAbsoluteError', 'rSquared'],
      "collaborativeFiltering": ['meanSquaredError', 'rootMeanSquaredError', 'rootMeanSquaredErrorAvg', 'meanAbsoluteError', 'rSquared']
    }
    if (taskType) {
      return metricMappings[taskType] || []
    }
    return []
  }
}

// actions
const actions = {
  sendDiscoveredProblems (context, datasetDoc) {
    console.log("we are in sendDiscoveredProblems");
    /*
    console.log("context.generatedProblems is ", context.state.generatedProblems)
    var mapFeature = function(colName) {
      var dataTableOfFeature = _.find(datasetDoc.dataResources, (res) => { return res.resType == 'table' })
      return {  'resource_id': dataTableOfFeature.resID,
                'feature_name': colName }
    }

    var builtProblem, toSend = []
    _.each(context.state.generatedProblems, (prob) => {
      builtProblem = {}
      builtProblem.metric = prob.metric
      builtProblem.problemDescription = prob.problemDescription
      builtProblem.taskSubType = prob.taskSubType
      builtProblem.taskType = prob.taskType

      // deal with features, have to convert from just names to resIds as awell
      builtProblem.targetFeature = mapFeature(prob.targetFeature)
      builtProblem.predictFeatures = _.map(prob.predictFeatures, mapFeature)

      toSend.push(builtProblem)
    })
    */
    var v = new Vue();
    v.$socket.emit('problemDiscoveryJSONCreation', state.generatedProblems);
  },
  'socket_problemSetProcessed': (context, data) => {
    context.commit('ADD_AUTO_GENERATED_PROBLEMS', data);
  },
}

// mutations
const mutations = {

  INCREMENT_USER_PROBLEM_ID(state) {
    state.userProblemID++;
  },
  UPDATE_PROBLEM(state, problem) {
    let problemID = problem.problemID;
    let index = -1;
    for (let i = 0; i < state.generatedProblems.length; i++) {
      if (state.generatedProblems[i].problemID === problemID) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      Vue.set(state.generatedProblems, index, problem);
    } else {
      console.log("ERROR UPDATING PROBLEM: not found", problemID, problem);
    }
  },
  ADD_AUTO_GENERATED_PROBLEMS(state, data) {
    state.generatedProblems = data;
    state.generatedProblems.forEach(d => d.meaningful = 'not sure');
    /*
    console.log("addProblemSetProcessedData")
    for(var i = 0; i < state.problemSets.length; i++){
      console.log("Problem ID:" + state.problemSets[i].problemID + " || Predict Feature:" + state.problemSets[i].predictFeature +"  ||  targetFeatures:" + state.problemSets[i].targetFeatures + " || Task Type:" + state.problemSets[i].taskType + " || Metric:" + state.problemSets[i].metric + " || Priority:" + state.problemSets[i].priority + " || Creation Type:" + state.problemSets[i].creationType + " || Problem Description:" + state.problemSets[i].description);
    }
    */
  },
  ADD_GENERATED_PROBLEM (state, generatedProblem) {
    state.generatedProblems.unshift(generatedProblem);
  },
  REMOVE_GENERATED_PROBLEM: function (state, index) {
    state.generatedProblems.splice(index, 1);
  },
  CHANGE_PROBLEM_DESCRIPTION(state, data) {
    console.log("SETTING NEW DESCRIPTION FOR PROBLEM", data.index, data.description);
    state.generatedProblems[data.index].description = data.description;
  }

}

export default {
  state,
  getters,
  actions,
  mutations
}
