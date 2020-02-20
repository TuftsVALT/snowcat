const appRootPath = require("app-root-path");
const sema = require("semaphore")(1);
const { getRawData, getRelatedAttributes } = require("./attributeLogic.js");
const { materializeJoin } = require("./joinLogic.js");
const { getHeaderTypes } = require("./qidServices.js");

module.exports.set = async function(session, socket) {
  let headers = [];
  // console.log("DATASET IS ", dataset, " and session is ", session)
  // let rawData = await getRawData(dataset);
  let dataset = session.getCurrentDataset();
  let rawData = await getRawData(dataset);
  // let rawData = null;
  let receivedJoinInstructions = [];

  // session.registerDatasetUpdates(async function(dataset) {
  //   rawData = null;
  //   headers = [];
  //   // console.log("new dataset!!!");
  //   rawData = await getRawData(dataset);
  // });

  // Receives search input and calls datamart function
  socket.on("dataaugWikidataGetRelatedAttributes", async function(columnName, fn) {
    let dataset = session.getCurrentDataset();
    // console.log(" RECEIVED REQUEST for related attributes for ", columnName)
    if (dataset) {
      // console.log("we have a dataset, getting related attributes now.")
      rawData = await getRawData(dataset, rawData);
      getRelatedAttributes(columnName, rawData).then(attrs => {
        // console.log("attrs sent back are", attrs)
        fn(attrs);
      });
    } else {
      // console.log("we didn't have a dataset")
      return [];
    }
  });

  socket.on("dataaugWikidataMaterializeJoin", async function(joinInstructions, fn) {
    // NOTE: the current dataset call here could be replaced by getting the dataset specified
    // by the joinInstructions.
    let dataset = session.getCurrentDataset();
    if (dataset) {
      receivedJoinInstructions.push(joinInstructions)

      rawData = await getRawData(dataset, rawData);
      // We want to cache the QIDs so that we don't call them twice.
      materializeJoin(joinInstructions, rawData).then(joinedData => {
        // console.log("creating new darpa dataset at ", papa.unparse(joinedData));
        // console.log("dataset", dataset);
        console.log("first joinedDataset val is ", joinedData[0])
        // let newDataset = dataset.updateDatasetAfterJoin(papa.unparse(joinedData));
        // session.setCurrentDataset(newDataset);
        fn(joinedData);
      });
    } else {
      return [];
    }
  });

  socket.on("dataaugMaterializeD3MDataset", async function(attributesInCurrentDataTable, fn) {
    // let joinedData = dataAugTable.data;

    // Here, we go through each of the joins we've been sent, in order, and do the joins, serially.
    // Eventually, we could build a single join query to go much faster.  But for now, we do it the stupid way.
    console.log("at the beginning, rawData length is ", rawData.length)
    dataset = session.getCurrentDataset();
    rawData = await getRawData(dataset, rawData);
    var currentJoin = Promise.resolve(rawData);

    console.log("there are this many join instructions: ", receivedJoinInstructions.length)
    receivedJoinInstructions.forEach(instruction => {
      console.log("working on the current instruction: ", instruction)
      currentJoin = currentJoin.then((partiallyJoinedData) => {
        console.log("joining ", instruction, " for -1 rows")
        rawData = partiallyJoinedData;
        return materializeJoin(instruction, rawData, -1)
      })
    });

    currentJoin.then((partiallyJoinedData) => {
      // console.log("all of the joins should have been done at this point.  partiallyJoinedData.shape is ", [partiallyJoinedData.length, partiallyJoinedData[0].length])
      rawData = partiallyJoinedData;
      const headerTypes = getHeaderTypes(attributesInCurrentDataTable); // asks join object to return any header types it knows about
      let dataset = session.getCurrentDataset();
      // console.log("about to update dataset after join")
      let newDataset = dataset.updateDatasetAfterJoin(rawData, headerTypes);
      // console.log("finished updating.  About to set session current dataset")
      session.setCurrentDataset(newDataset);
      // console.log("now, setting timeout");
      setTimeout(fn, 2000);
    })

  });

  // socket.on("dataaugInit", function() {
  //   // take the semaphore when a new call comes in
  //   sema.take(function() {
  //     getRawData(dataset).then(data => {
  //       // We probably want to start getting related attributes while the system is running, think of it as filling a cache

  //       // one we're done here, we leave the semaphre again
  //       sema.leave();
  //     });
  //   });
  // });
};
