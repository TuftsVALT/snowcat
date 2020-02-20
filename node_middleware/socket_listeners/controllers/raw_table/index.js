// The tabular data folder handles preprocessing and routing for tabular data preprocessing
var _ = require("lodash");
// this is a semaphore with one entry at a time
const sema = require("semaphore")(1);
const fs = require("fs");
// const path = require("path");
const papa = require("papaparse");

module.exports.set = function(session, socket) {
  /***
  rawData and headers are both variable that have to be read from the main data table,
  but thay also contain state from the actual data table in the from end (order after sorting).
  So calls from the frontend actually write to those variable. The semaphore sema makes sure
  that only one thread at a time accesses them.
***/
  let rawData = null;
  let headers = [];

  session.registerDatasetUpdates(function(dataset) {
    rawData = null;
    headers = [];
    console.log("new dataset!!!");
    getData(dataset);
    socket.emit("tableUpdate");
  });

  function getData(dataset) {
    return new Promise(function(resolve, reject) {
      if (rawData) {
        resolve(rawData);
      } else if (dataset) {
        let filepath = dataset.getLearningDataFile();
        //console.log("filepath is ", filepath)
        let stream = fs.createReadStream(filepath);
        papa.parse(stream, {
          header: true,
          dynamicTyping: true,
          error: function(error, file) {
            console.log("error reading file", file);
            reject(err);
          },
          complete: function(results) {
            Object.keys(results.data[0]).forEach(each => {
              //FIXME: backend should probably not know about visual layout of table
              //columns, but we go with hacky for now
              headers.push({
                text: each,
                value: each,
                align: "center",
                sortable: true
              });
            });
            console.log("reading raw data: done");
            resolve((rawData = results.data));
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  function doStuff(pagination, search, fn) {
    let items = rawData.filter(function(item) {
      if (search) {
        let res = false;
        Object.values(item).forEach(function(each) {
          res = res || ("" + each).includes(search);
        });
        return res;
      }
      return true;
    });
    const total = items.length;
    if (pagination.sortBy) {
      items = items.sort((a, b) => {
        const sortA = a[pagination.sortBy];
        const sortB = b[pagination.sortBy];
        if (pagination.descending) {
          if (sortA < sortB) return 1;
          if (sortA > sortB) return -1;
          return 0;
        } else {
          if (sortA < sortB) return -1;
          if (sortA > sortB) return 1;
          return 0;
        }
      });
    }
    if (pagination.rowsPerPage > 0) {
      items = items.slice(
        (pagination.page - 1) * pagination.rowsPerPage,
        pagination.page * pagination.rowsPerPage
      );
    }
    fn({
      items: items,
      total: total,
      headers: headers
    });
  }

  socket.on("tableEndpoint", function(pagination, search, fn) {
    // take the semaphore when a new call comes in
    sema.take(function() {
      getData(session.getCurrentDataset()).then(data => {
        if (data) {
          doStuff(pagination, search, fn);
        } else {
          fn(null);
        }
        // one we're done here, we leave the semaphre again
        sema.leave();
      });
    });
  });
};
