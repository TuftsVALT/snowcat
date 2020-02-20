//  This function translate is used to deal tranlate problemObj into what compatible with problemDoc.json
//  One of differences is that problemObj doesn't have "about" files, while problemDoc.json does
//  This is neither a rule nor a fact, but just a provisional way to deal with the discrepancy between
//  problemObj sent from frontend and problemDoc.json given
const csv = require("csv-parser");
const fs = require("fs");

function translate(problemObj, dataset) {
  let problemSchema = null;
  if (problemObj.isDarpa) {
    // if there exist "about" field in "problmeObj", then assumemedly it is from problemDoc.json
    // in this case, just return it
    let problemPath = dataset.getProblemPath();
    problemSchema = require(problemPath + "/problemDoc.json");
  } else {
    problemSchema = setProblemSchema(problemObj, dataset);
    // console.log("use problemObj");
  }
  // console.log("problemSchema translated",problemSchema)
  return problemSchema;
}

function setProblemSchema(obj, dataset) {
  // let learningDataFile = dataset.getLearningDataFile();
  let targetFeature = obj.targetFeature;

  let colIndex = -1;
  let targetIndex = -1;

  let problemID = String(obj.problemID);
  let datasetID = dataset.getDatasetSchema().about.datasetID;

  let datasetSchema = dataset.getDatasetSchema();

  let columns = datasetSchema.dataResources[0].columns;

  columns.forEach(column => {
    let colName = column.colName;
    if (colName == "d3mIndex") {
      targetIndex = column.colIndex;
      console.log("colIndex",targetIndex)
    } else if (colName == targetFeature) {
      colIndex = column.colIndex;;
      console.log("targetIndex",colIndex)
    }
  });

  let problemSchema = {
    about: {
      problemID: problemID, //"", // "185_baseball_problem"
      taskType: obj.taskType, // "", // "classification"
      taskSubType: obj.taskSubType, //"", // "multiClass"
      problemVersion: "2.0",
      problemSchemaVersion: "3.2.0"
    },
    inputs: {
      data: [
        {
          datasetID: datasetID, // "185_baseball_dataset",
          targets: [
            {
              targetIndex: targetIndex, //0, // must change
              resID: "learningData", // must change
              colIndex: colIndex, //18, // must change
              colName: targetFeature //"Hall_of_Fame" // must change
            }
          ]
        }
      ],
      dataSplits: {
        method: "holdOut",
        testSize: 0.2,
        stratified: true,
        numRepeats: 0,
        randomSeed: 42,
        splitsFile: "dataSplits.csv"
      },
      performanceMetrics: [
        {
          metric: obj.metric //"f1Macro"
        }
      ]
    },
    expectedOutputs: {
      predictionsFile: "predictions.csv"
    }
  };

  // fs.createReadStream(learningDataFile)
  //   .pipe(csv())
  //   .on("headers", headers => {
  //     let nCol = headers.length;
  //     // console.log(nCol);
  //     // let index =0;
  //     for (let i = 0; i < nCol - 1; i++) {
  //       if (headers[i] == targetFeature) {
  //         colIndex = i;
  //         console.log("colIndex", colIndex);
  //       } else if (headers[i] == "d3mIndex") {
  //         targetIndex = i;
  //         console.log("targetIndex", targetIndex);
  //       }
  //     }
  //   }).on("end",()=>{
  //     problemSchema.about.inputs.data.targets.targetIndex = targetIndex;
  //     problemSchema.about.inputs.data.targets.colIndex = colIndex
  //     console.log("problemSchema colIndex",problemSchema.about.inputs.data.targets.colIndex)
  //   })

  // console.log("after translation, problemSchema", problemSchema);
  return problemSchema;
}

// function getProblemSchemaTemplate() {
//   let problemSchemaTemplate = {
//     about: {
//       problemID: "", // "185_baseball_problem"
//       problemName: "", //"baseball_problem",
//       taskType: "", // "classification"
//       taskSubType: "", // "multiClass"
//       problemVersion: "2.0",
//       problemSchemaVersion: "3.2.0"
//     },
//     inputs: {
//       data: [
//         {
//           datasetID: "", // "185_baseball_dataset",
//           targets: [
//             {
//               targetIndex: 0, // must change
//               resID: "learningData", // must change
//               colIndex: 18, // must change
//               colName: "Hall_of_Fame" // must change
//             }
//           ]
//         }
//       ],
//       dataSplits: {
//         method: "holdOut",
//         testSize: 0.2,
//         stratified: true,
//         numRepeats: 0,
//         randomSeed: 42,
//         splitsFile: "dataSplits.csv"
//       },
//       performanceMetrics: [
//         {
//           metric: "f1Macro"
//         }
//       ]
//     },
//     expectedOutputs: {
//       predictionsFile: "predictions.csv"
//     }
//   };
//   return problemSchemaTemplate;
// }
module.exports = translate;
