// const Dataset = require("../Session/Dataset.js");
// const Problem = require("../Session/Problem.js");
const appRootPath = require("app-root-path");
const Herald = require(appRootPath + "/Session/Herald.js");

// herald is characterized by a dataset and a problem,
// for now, both dataest and problem are given by seed dataset.

// Hard code solution files for some of the datasets:
let devSolutions = {
  "196_autoMpg": [
    "static/local_testing_data/196_autoMpg/196_autoMpg_solution/model_A.csv",
    "static/local_testing_data/196_autoMpg/196_autoMpg_solution/model_B.csv",
    "static/local_testing_data/196_autoMpg/196_autoMpg_solution/model_C.csv"
  ],
  "185_baseball": [
    "static/local_testing_data/185_baseball/185_baseball_solution/model_A.csv",
    "static/local_testing_data/185_baseball/185_baseball_solution/model_B.csv",
    "static/local_testing_data/185_baseball/185_baseball_solution/model_C.csv",
    "static/local_testing_data/185_baseball/185_baseball_solution/model_D.csv",
    "static/local_testing_data/185_baseball/185_baseball_solution/model_E.csv"
  ]
};

let getDevSolution = dataset => {
  Object.keys(devSolutions).forEach(datasetId => {
    let path = dataset.getDatasetPath();
    if (path.includes(datasetId)) {
      return devSolutions[datasetId];
    }
    return null;
  });
};

function createHerald(session) {
  // check for dataset path and problem path
  // if both are the same
  // herald should not be created?
  let heraldsMap = session.getHeraldsMap();
  let heraldId = Math.floor(Math.random() * 1000); // 0-999
  while (heraldsMap.has(heraldId)) {
    heraldId = Math.floor(Math.random() * 1000); // 0-999
  }

  let herald = null;
  if (session.devMode) {
    let devSol = devSolutions[session.getCurrentDataset().getDatasetName()];
    console.log("DEVSOL", devSol);
    herald = new Herald(heraldId, devSol);
  } else {
    herald = new Herald(heraldId);
  }
  
  session.setCurrentHeraldId(heraldId);
  let currentDataset = session.getCurrentDataset()
  let currentProblem = session.getCurrentProblem();
  herald.setDataset(currentDataset);
  herald.setProblem(currentProblem);
  herald.setPort(session.ta2_port)
  console.log(">>>>>>Dataset sent to ta2:",currentDataset.getDatasetPath())
  console.log("======Problem sent to ta2:",currentProblem.getProblemSchema())
  session.setCurrentHerald(herald);

  // console.log("HERALD created", herald, heraldId, session.getCurrentHerald());

  // herald.setId(heraldId);
  heraldsMap.set(heraldId, herald);

  // update id
  // session.heraldId = heraldId + 1;
  return heraldId;
  // socket.emit("createHerald", heraldId);
}


module.exports = createHerald;
