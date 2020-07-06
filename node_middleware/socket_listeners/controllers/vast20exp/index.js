const appRoot = require("app-root-path");
const relay = require(appRoot + "/relay");
let Dataset = require(appRoot + "/Session/Dataset.js");
let Problem = require(appRoot + "/Session/Problem.js");
const path = require("path");
const spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
const spawn = require("child_process").spawn; 

// const sema = require("semaphore")(1);
// const { getRawData, getRelatedAttributes, recursiveGetExamples } = require("./attributeLogic.js");
// const { materializeJoin } = require("./joinLogic.js");
// const { getHeaderTypes } = require("./qidServices.js");
// const appRoot = require('app-root-path');
// const spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
// const config = require("./config.js");
// let getRelatedAttributesCache = {};

function runBaseModel(socket){
    // run base model
    let results = []
    let modelpyfile = appRoot + "/models/m_modeller.py"
    let obj = {}
    let baseMod = 1

    var process = spawn("python3", [modelpyfile, "-", baseMod])
    process.stdout.on('data', (data) => { 
        console.log('python results came back ', data.toString())
        results.push(data.toString()); 
    })
    process.stderr.on('data', (data) => {
        console.log(`python result error:${data}`);
    });
    process.stderr.on('close', () => {
        obj = JSON.parse(results[0])
        obj['col_names'] = obj['col_names'].split(",")
        obj['id'] = 'modelid_' + Math.random()*10000
        socket.emit("modelmetricsMultiIter", obj)
        console.log('emitted model metrics ', obj)
        console.log("python call done !!!! ");
    });
}
  

module.exports.set = async function(session, socket) {
//   let headers = [];
//   // console.log("DATASET IS ", dataset, " and session is ", session)
//   // let rawData = await getRawData(dataset);
//   let dataset = session.getCurrentDataset();
//   let rawData = await getRawData(dataset);
//   // let rawData = null;
//   let receivedJoinInstructions = [];

    let onVast20ExpNextTask = function() {
        if (session.vast20expMode) {
            session.incrementTask();
            const nextTask = "task" + session.currentTask;
            console.log(' next task asked is ', nextTask)
            let datasetPath = session.vast20expConfig[nextTask].datasetPath;
            session.vast20expConfig.logger.incrementTask();
            session.vast20expConfig.logger.writeToFile();
            // should be changing the dataset over
            datasetPath = path.resolve(relay.handleUrl(datasetPath));
            let newDataset = new Dataset(datasetPath);
            console.log("setting current dataset")
            session.setCurrentDataset(newDataset);
            let problemPath = newDataset.getProblemPath();
            let isProblemPath = true;
            let problem = new Problem(problemPath, isProblemPath);
            session.setCurrentProblem(problem);
            if(nextTask == "task3") {
                setTimeout(() => {
                    runBaseModel(socket);
                }, 1000)
            }
            console.log("finished setting current dataset")
            console.log("emitting message that its ready")
            socket.emit("experimentLoaded");
            console.log("==================================")
            console.log("==================================")

        }
    }
    socket.on("vast20ExpNextTask", onVast20ExpNextTask);
};
