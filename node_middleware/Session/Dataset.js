const fs = require("fs");
const path = require("path");
const papa = require("papaparse");

class Dataset {
  // FIXME: constructor should take a path instead of the old schema
  constructor(datasetRootPath, datasetName = null) {
    // let tempStr = datasetRootPath.endsWith("/")
    //   ? datasetRootPath.substring(0, datasetRootPath.length - 1)
    //   : datasetRootPath;
    // this.datasetRootPath = tempStr;
    // console.log("Create dataset from:", this.datasetRootPath);
    // this.datasetName = datasetName;
    // if (!this.datasetName) {
    //   // "/home/cong/d3mapp/node_middleware/static/local_testing_data/185_baseball",
    //   let tempStrArr = tempStr.split("/");
    //   let len = tempStrArr.length;
    //   this.datasetName = tempStrArr[len - 1];
    // }
    fs.readdirSync(path.resolve(datasetRootPath)).forEach(dirName => {
      // console.log(file);
      if (dirName.includes("_dataset")) {
        this.datasetName = dirName.replace("_dataset", "");
        this.datasetPath = datasetRootPath + "/" + dirName;
      } else if (dirName.includes("_problem"))
        this.problemPath = datasetRootPath + "/" + dirName;
    });

    this.datasetSchema = require(path.resolve(
      this.getDatasetPath() + "/datasetDoc.json"
    ));

    this.learningDataFile = this.getDatasetPath() + "/tables/learningData.csv";

    // all problems are only generated once
    this.isAllProblemsGenerated = false;
    this.allGeneratedProblemPaths = [];
    //
  }

  getDatasetName() {
    return this.datasetName;
  }
  getDatasetPath() {
    return this.datasetPath;
  }
  getProblemPath() {
    return this.problemPath;
  }
  getDatasetSchema() {
    return this.datasetSchema;
  }
  getLearningDataFile() {
    return this.learningDataFile;
  }

  setAllGeneratedProblemPaths(allGeneratedProblemPaths) {
    if (this.isAllProblemsGenerated) {
      // notify
    } else {
      this.allGeneratedProblemPaths = allGeneratedProblemPaths;
    }
  }

  updateDatasetAfterJoin(updatedTable, headerTypes = []) {
    let schema = this.getDatasetSchema();
    let cont = true;
    let existingHeaders = [];
    (() => {
      let table = null;
      schema.dataResources.forEach(res => {
        if (res.resType === "table") {
          if (table) {
            cont = false;
          } else {
            table = res;
          }
        }
      });
      table.columns.forEach(col => existingHeaders.push(col.colName));
    })();
    // take only cols that are presente in headertypes
    let cols = [];
    for(let i=0;i<headerTypes.length;i++){
      cols.push(headerTypes[i]['key'])
    }
    let newTable = []
    if(cols.length > 0){
      for(let i=0;i<updatedTable.length;i++){
        let obj = updatedTable[i]
        let nobj = {}
        for(let d in obj){
          if(cols.indexOf(d) != -1){
            nobj[d] = obj[d]
          }
        }
      newTable.push(nobj)
    }
    }else{
      newTable = updatedTable
    }
    const headerList = Object.keys(newTable[0]);
    // console.log('checking header list ', headerList)
    // console.log('checking header types ', headerTypes)

    if (!cont) {
      console.log(
        "The dataset has more than one data table: augmenting dataset not supported!"
      );
      return null;
    }

    try {
      let newDatasetName = "ds" + (Math.random() + "").substr(2, 8); // 8 digits, could be more. - By Cong
      let tempname = newDatasetName;
      let tmpDatasetDir = path.resolve("input/dataset");
      if (!fs.existsSync(tmpDatasetDir)) {
        fs.mkdirSync(tmpDatasetDir);
      }
      let dir = path.resolve("input/dataset/" + newDatasetName);
      fs.mkdirSync(dir);
      let problemDir = dir + "/" + newDatasetName + "_problem";
      fs.mkdirSync(problemDir);
      fs.copyFileSync(
        this.getProblemPath() + "/problemDoc.json",
        problemDir + "/problemDoc.json"
      );
      let datasetDir = dir + "/" + newDatasetName + "_dataset";
      fs.mkdirSync(datasetDir);
      fs.mkdirSync(datasetDir + "/tables");
      let csvPath = datasetDir + "/tables/learningData.csv";
      this.csvPath = csvPath;
      this.datasetDir = tempname + "/" + newDatasetName + "_dataset" + "/tables/learningData.csv";

      fs.writeFileSync(
        csvPath,
        papa.unparse(newTable, {
          quotes: false, //or array of booleans
          quoteChar: '"',
          escapeChar: '"',
          delimiter: ",",
          header: true,
          newline: "\r\n",
          skipEmptyLines: false, //or 'greedy',
          columns: headerList
        })
      );
      // now update dataset description
      let schema = JSON.parse(JSON.stringify(this.getDatasetSchema()));
      schema.about.datasetID = newDatasetName;
      schema.about.datasetName = newDatasetName;

      // We have to filter out any columns that are not actually in the data.  They shouldn't be here in the first place but
      // we have a crappy, immutable data structure for this schema.
      // So we basically just rewrite the columns.
      schema.dataResources[0].columns = [];
      // for (let i = 0; i < headerList.length; i++) {
      //   let header = headerList[i];
      //   const colType = headerTypes[header] || "categorical";
      //   //console.log(updatedTable);
      //   schema.dataResources[0].columns.push({
      //     colIndex: i,
      //     colName: header,
      //     colType: colType,
      //     role: ["attribute"]
      //   });
      // }
      for (let i = 0; i < headerList.length; i++) {
        let header = headerList[i];
        let colType = "categorical", val = ""
        for (let j =0;j<headerTypes.length;j++){
            if(header == headerTypes[j]['key']){
              val = headerTypes[j]['dataType']
              break
            }
        }
        if(val == 'number') colType = "integer"
        schema.dataResources[0].columns.push({
          colIndex: i,
          colName: header,
          colType: colType,
          role: ["attribute"]
        });
      }
      console.log(' new schema written ',  schema.dataResources[0].columns)
      fs.writeFileSync(datasetDir + "/datasetDoc.json", JSON.stringify(schema));
      console.log("new dataset written", dir);
      return new Dataset(dir);
    } catch (e) {
      // make sure we see what went wrong
      console.log("Problem writing new dataset", e);
    }
  }
}

module.exports = Dataset;
//
// from seed OR datamart?
//

// now get schema from datasetPath
// let files = fs
//   .readdirSync(datasetPath)
//   .filter(filename => filename.toLowerCase().endsWith("_dataset"));
// if (files.length != 1) {
//   console.log(
//     "None or more than one folder that ends in '_dataset'; can't find schema!"
//   );
//   // this.schema = null;
// } else {
//   let datasetPath = datasetPath;
//   if (!datasetPath.endsWith("/")) {
//     datasetPath = datasetPath + "/";
//   }
//   datasetPath = datasetPath + files[0];
//   this.datasetSchema = require(datasetPath + "/datasetDoc.json");
//   this.learningDataFile = datasetPath + "/tables/learningData.csv";
// }
