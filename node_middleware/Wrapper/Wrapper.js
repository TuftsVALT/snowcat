// import all methods
const helloLoop = require("./methods/helloLoop");
exports.helloLoop = helloLoop;

const endSearchSolutions = require("./methods/endSearchSolutions");
exports.endSearchSolutions = endSearchSolutions;

const listPrimitives = require("./methods/listPrimitives");
exports.listPrimitives = listPrimitives;

const searchSolutions = require("./methods/search/searchSolutions");
exports.searchSolutions = searchSolutions;

const fitSolutions = require("./methods/fit/fitSolutions");
exports.fitSolutions = fitSolutions;

const produceSolutions = require("./methods/produce/produceSolutions");
exports.produceSolutions = produceSolutions;

const scoreSolutions = require("./methods/score/scoreSolutions");
exports.scoreSolutions = scoreSolutions;

const describeSolutions = require("./methods/describe/describeSolutions");
exports.describeSolutions = describeSolutions;

const exportFittedSolutions = require("./methods/export/exportFittedSolutions");
exports.exportFittedSolutions = exportFittedSolutions;

// methods_other
const connect = require("./methods_other/connect");
exports.connect = connect;

const problemSetSerachSolutionRequest = require("./methods_other/problemSetSerachSolutionRequest");
exports.problemSetSerachSolutionRequest = problemSetSerachSolutionRequest;

const setEvaluationConfig = require("./methods_other/setEvaluationConfig");
exports.setEvaluationConfig = setEvaluationConfig;

const props = require("./props");
exports.sessionVar = props.sessionVar;

// future development
// const exportSolutions = require("./methods_molecule/exportSolutions");
// const getAllSolutions = require("./methods_molecule/getAllSolutions");
// const getDescriptions = require("./methods_molecule/getDescriptions");
// const getScores = require("./methods_molecule/getScores");
// const getFitSolutions = require("./methods_molecule/getFitSolutions");
// const getProduceSolutions = require("./methods_molecule/getProduceSolutions");

// exports.exportSolutions = exportSolutions;
// exports.getAllSolutions = getAllSolutions;
// exports.getDescriptions = getDescriptions;
// exports.getScores = getScores;
// exports.getFitSolutions = getFitSolutions;
// exports.getProduceSolutions = getProduceSolutions;
