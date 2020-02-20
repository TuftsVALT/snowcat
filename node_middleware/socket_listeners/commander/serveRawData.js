const _ = require("lodash");
const path = require("path");
function serveRawData(socket, herald, datasetSchema) {
  let training_data_root = herald.getDataset().getDatasetPath();
  let filepath = path.join(training_data_root, "tables/learningData.csv");
  console.log("filepath is ", filepath);

  // TODO - We should be sending the raw data to the front end for all types of problems,
  // but experienced memory issues with large datasets in Vue.  We tried Object.freeze() on
  // those objects, but it didn't solve the issue.
  // For now, the only visualizations that are using the rawData collection are the graph visualizations

  if (
    _.some(datasetSchema.dataResources, function(each) {
      return each.resType === "graph";
    })
  ) {
    var stream = fs.createReadStream(filepath);
    papa.parse(stream, {
      header: true,
      complete: function(results) {
        var dataLookup = {};
        var row;
        for (var i = 0; i < results.data.length; i++) {
          row = results.data[i];
          dataLookup[row.d3mIndex] = {};
          dataLookup[row.d3mIndex].data = row;
        }
        socket.emit("rawDataFinished", dataLookup);
      }
    });
  }
}
module.exports = serveRawData;
