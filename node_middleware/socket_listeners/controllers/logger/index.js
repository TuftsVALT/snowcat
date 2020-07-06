// const appRootPath = require("app-root-path");
// const sema = require("semaphore")(1);
// const { getRawData, getRelatedAttributes, recursiveGetExamples } = require("./attributeLogic.js");
// const { materializeJoin } = require("./joinLogic.js");
// const { getHeaderTypes } = require("./qidServices.js");
// const appRoot = require('app-root-path');
// const spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
// const config = require("./config.js");
// let getRelatedAttributesCache = {};

module.exports.set = async function(session, socket) {
    //   let headers = [];
    //   // console.log("DATASET IS ", dataset, " and session is ", session)
    //   // let rawData = await getRawData(dataset);
    //   let dataset = session.getCurrentDataset();
    //   let rawData = await getRawData(dataset);
    //   // let rawData = null;
    //   let receivedJoinInstructions = [];
    let logger = session.vast20expConfig.logger;

    let logVast20Exp = function(logPackage) {
        // console.log("**************************************************")
        // console.log("**************************************************")
        // console.log("RECEIVED LOGGING:")
        // console.log(logPackage)
        // console.log("**************************************************")
        // console.log("**************************************************")
        switch (logPackage.logType) {
            case 'clickedColumn':
                logger.addAttributeClick(logPackage);
                break;
            case 'getRelatedAttributes':
                logger.addGetRelatedAttributesRequest(logPackage);
                break;
            case 'columnAdded':
                logger.addColumnAdded(logPackage);
                break;
            case 'modelMetrics':
                logger.addModelMetrics(logPackage);
                logger.writeToFile();
                break;
        }
    }

    socket.on("logVast20Exp", logVast20Exp);
};
    