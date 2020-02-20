// Relay.js is a singleton wrapper for functions dealing with ta3-ta2 api call
// each one of these function will have a input "herald" who contains "dataset", "problem" and anything else necessary for api call
exports.handleUrl = require("./functions/handleUrl.js"); // DO NOT modify this!!! Many js use this

exports.connect = require("./functions/connect.js");

exports.helloLoop = require("./methods/helloLoop.js");

exports.searchSolutions = require("./methods/search/searchSolutions.js");

exports.scoreSolutions = require("./methods/score/scoreSolutions.js");

exports.describeSolutions = require("./methods/describe/describeSolutions.js");

exports.fitSolutions = require("./methods/fit/fitSolutions.js");

exports.produceSolutions = require("./methods/produce/produceSolutions.js");

exports.exportFittedSolutions = require("./methods/export/exportFittedSolutions.js");
