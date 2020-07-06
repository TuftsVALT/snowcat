const appRootPath = require("app-root-path");
const sema = require("semaphore")(1);
const { getRawData, getRelatedAttributes, recursiveGetExamples } = require("./attributeLogic.js");
const { materializeJoin } = require("./joinLogic.js");
const { getHeaderTypes } = require("./qidServices.js");
const appRoot = require('app-root-path');
const spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
const spawn = require("child_process").spawn; 
const config = require("./config.js");
const { spliceExpAttrs } = require("./vast20expInjectAttrs")
const fs = require("fs");
const path = require("path");
const papa = require("papaparse");
let getRelatedAttributesCache = {};




module.exports.set = async function(session, socket) {
  let headers = [];
  // console.log("DATASET IS ", dataset, " and session is ", session)
  // let rawData = await getRawData(dataset);
  let dataset = session.getCurrentDataset();
  let rawData = await getRawData(dataset);
  // let rawData = null;
  let receivedJoinInstructions = [];

  // Try actually putting rawData into the function?
  let onGetRelatedAttributes = async function(columnName, fn) {
    let dataset = session.getCurrentDataset();
    console.log(" RECEIVED REQUEST for related attributes for ", columnName)
    if (dataset) {
      // console.log("we have a dataset, getting related attributes now.")
      rawData = await getRawData(dataset, rawData);
      // console.log("in get related attributes, columnName is ", columnName, " and rawData[0] is ", rawData[0])
      let attributesPromise = Promise.resolve([]);
      if (getRelatedAttributesCache[columnName]) {
        console.log("cache hit for columnName ", columnName);
        attributesPromise = Promise.resolve(getRelatedAttributesCache[columnName]);
      } else {
        console.log("no cache hit for columnName ", columnName);
        // console.log("Object.keys(getRelatedAttributesCache) is ", Object.keys(getRelatedAttributesCache))
        attributesPromise = getRelatedAttributes(columnName, rawData, config.numRelatedAttributes, config.numSamples, config.numSamples)
      }
      attributesPromise.then(attrs => {
        // Here, we hijack the related attributes for the sake of experiment 1.
        if (session.vast20expMode && session.vast20expConfig) {
          attrs = spliceExpAttrs(attrs, session.vast20expConfig.logger.currentTaskNum, columnName)
        }

        // console.log("attrs sent back are", attrs)
        getRelatedAttributesCache[columnName] = attrs;
        fn(attrs);
      }, err => {
        console.log("getRelatedAttributes error with columnName", columnName, " : ", err)
      });
    } else {
      // console.log("we didn't have a dataset")
      return [];
    }
  }

  let onMaterializeJoin = async function(joinInstructions, fn) {
    // NOTE: the current dataset call here could be replaced by getting the dataset specified
    // by the joinInstructions.
    console.log("materializeJoin called")
    let dataset = session.getCurrentDataset();
    if (dataset) {
      receivedJoinInstructions.push(joinInstructions)

      rawData = await getRawData(dataset, rawData);
      // We want to cache the QIDs so that we don't call them twice.
      materializeJoin(joinInstructions, rawData, config.numSamples).then(joinedData => {
        let dataset = session.getCurrentDataset();
        // The changes made here were breaking everything, it wasn't added the newly added column
        // console.log("about to update dataset after join")
        // console.log("joinedData[0] is ", joinedData[0])
        // let headerTypes = joinInstructions['headerTypes']
        // let newDataset = dataset.updateDatasetAfterJoin(joinedData,headerTypes);
        let newDataset = dataset.updateDatasetAfterJoin(joinedData);
        // console.log("finished updating.  About to set session current dataset")
        // console.log('headertypes on materialize join .......  ', headerTypes)
        session.setCurrentDataset(newDataset);

        let newCols = joinedData && Object.keys(joinedData[0]);
        let newColName = joinedData && newCols[newCols.length - 1];
        // console.log("after joining, joinedData[0] is ", joinedData[0], " and rawData[0] is ", rawData[0]);
        fn({
          'newColName': newColName,
          'newDataset': joinedData
        });
      }, err => {
        console.log("materializeJoin error with joinInstructions", joinInstructions, " : ", err)
      });
    } else {
      return {
        'newColName': 'na',
        'newDataset': []
      };
    }
  }


  let onDownloadingData = async function(attributesInCurrentDataTable){
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('DOWNLOADING DATA ... ', attributesInCurrentDataTable, receivedJoinInstructions)
    const csvPath = './userdownloadedcontent/datadownloadedauger.csv'

    var currentJoin = Promise.resolve(rawData);
    attributesInCurrentDataTable = attributesInCurrentDataTable.filter((a) => a['includeInData']);

    if(receivedJoinInstructions.length == 0){
      console.log('NO JOIN INSTRUCTIONS ', rawData)
      // console.log("IN DOWLOAD DATA, CREATED new data set ", newDataset.learningDataFile)
      // const headerList = Object.keys(rawData[0])
      // fs.writeFileSync(
      //   csvPath,
      //   papa.unparse(rawData, {
      //     quotes: false, //or array of booleans
      //     quoteChar: '"',
      //     escapeChar: '"',
      //     delimiter: ",",
      //     header: true,
      //     newline: "\r\n",
      //     skipEmptyLines: false, //or 'greedy',
      //     columns: headerList
      //   })
      // );
      // console.log('data written successfully  ', rawData.length)
      return 
    }

    // console.log("there are this many join instructions: ", receivedJoinInstructions.length)
    receivedJoinInstructions.forEach(instruction => {
      if (instruction['aggregationOp'] === 'through' && !instruction['joinAction']) {
        return null;
      }
      console.log("IN DOWNLOAD DATA : working on the current instruction: ", instruction)
      currentJoin = currentJoin.then((partiallyJoinedData) => {
        rawData = partiallyJoinedData;
        return materializeJoin(instruction, rawData, -1)
      }, err => {
        console.log("error during joinInstructions instruction", instruction, " : ", err)
      })
    });

    currentJoin.then((partiallyJoinedData) => {
      rawData = partiallyJoinedData;
      socket.emit("downloaddataonclient", rawData)
      // let dataset = session.getCurrentDataset();
      // let newDataset = dataset.updateDatasetAfterJoin(rawData, attributesInCurrentDataTable);
      // console.log("IN DOWLOAD DATA, CREATED new data set ", newDataset.learningDataFile)
      const headerList = Object.keys(rawData[0])
      fs.writeFileSync(
        csvPath,
        papa.unparse(rawData, {
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

      console.log('data written successfully  ', rawData.length)

      }, err => {
      console.log("error on last join: ", err)
    })

  }

  let onMaterializeDataset = async function(attributesInCurrentDataTable, fn) {
    // let joinedData = dataAugTable.data;

    // Here, we go through each of the joins we've been sent, in order, and do the joins, serially.
    // Eventually, we could build a single join query to go much faster.  But for now, we do it the stupid way.
    console.log("at the beginning, rawData row and col length is ", rawData.length, Object.keys(rawData[0]).length)
    //COMMENTED GETTING THE ORIGINAL DATASET FOR VAST20EXP
    // dataset = session.getOriginalDataset();
    // rawData = await getRawData(dataset, rawData);
    // rawData = rawData.slice(0,50)
    console.log("at the end, rawData row and col length is ", rawData.length, Object.keys(rawData[0]).length)

    var currentJoin = Promise.resolve(rawData);

    // Filter out the attributes that have been disabled.
    attributesInCurrentDataTable = attributesInCurrentDataTable.filter((a) => a['includeInData']);
    // console.log(' begin materialize attrbs are ', attributesInCurrentDataTable)

    // console.log("there are this many join instructions: ", receivedJoinInstructions.length)
    receivedJoinInstructions.forEach(instruction => {
      // console.log("INSTRUCTION IS ", instruction, " and operation is ", instruction['operation'], " and joinAction is ", instruction['joinAction'])
      if (instruction['aggregationOp'] === 'through' && !instruction['joinAction']) {
        return null;
      }
      // console.log("and we got here")
      // console.log("working on the current instruction: ", instruction)
      currentJoin = currentJoin.then((partiallyJoinedData) => {
        // console.log("joining ", instruction, " for -1 rows")
        // console.log("currentJoin[0] is ", currentJoin[0])
        rawData = partiallyJoinedData;
        return materializeJoin(instruction, rawData, -1)
      }, err => {
        console.log("error during joinInstructions instruction", instruction, " : ", err)
      })
    });

    currentJoin.then((partiallyJoinedData) => {
      // console.log("all of the joins should have been done at this point.  partiallyJoinedData.shape is ", [partiallyJoinedData.length, partiallyJoinedData[0].length])
      // console.log("lastly, joining ", instruction, " for -1 rows")
      // console.log("currentJoin[0] is ", currentJoin[0])
      rawData = partiallyJoinedData;
      // console.log("after all materialized joins, rawData[0] is ", rawData[0]);
      // console.log("attributesInCurrentDataTable is ", attributesInCurrentDataTable)
      // const headerTypes = getHeaderTypes(attributesInCurrentDataTable); // asks join object to return any header types it knows about
      // console.log("headerTypes is ", headerTypes)
      let dataset = session.getCurrentDataset();
      // console.log("about to update dataset after join")
      let newDataset = dataset.updateDatasetAfterJoin(rawData, attributesInCurrentDataTable);
      // console.log("finished updating.  About to set session current dataset")
      session.setCurrentDataset(newDataset);
      session.setOriginalDataset(newDataset);
      console.log("now, setting timeout ", appRoot, dataset.datasetDir);
      runBaseModel(socket, dataset)
      setTimeout(fn, 3000);
      }, err => {
      console.log("error on last join: ", err)
    })

  }

  function runBaseModel(socket, dataset){
    // run base model
    let results = []
    let modelpyfile = appRoot + "/models/m_modeller.py"
    let obj = {}
    let baseMod = 0

    var process = spawn("python3", [modelpyfile, dataset.datasetDir, baseMod])
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

  let onGetExamplesThroughJoin = async function(throughJoinInstructions, fn) {
    console.log("called on get examples through join, throughJoinInstructions are ", throughJoinInstructions);
    recursiveGetExamples(throughJoinInstructions, {'uri': throughJoinInstructions['parentEntityExampleUri'], 'label': throughJoinInstructions['parentEntityExample']}).then((examples) => {
      console.log("called on get examples through join and examples came back ", examples)
      fn(examples);
    })
  }

  let onIncrementTask = async function() {
    // Need to reinitialize join instructions if this is the experiment
    if (session.vast20expMode) {
      receivedJoinInstructions = [];
    }
  }

  // Receives search input and calls datamart function
  socket.on("dataaugWikidataGetRelatedAttributes", onGetRelatedAttributes);

  socket.on("dataaugWikidataMaterializeJoin", onMaterializeJoin);

  socket.on("dataaugMaterializeD3MDataset", onMaterializeDataset);

  socket.on("downloadDataTrigger", onDownloadingData);

  socket.on("dataaugGetExamplesThroughJoin", onGetExamplesThroughJoin);

  socket.on("dataaugIncrementTask", onIncrementTask);
};
