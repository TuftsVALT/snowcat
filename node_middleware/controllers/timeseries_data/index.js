// timeseries_data folder is responsible for raw timeseries data AND forecasting models
var _ = require('lodash');
var handleUrl = (url) => { if ( _.startsWith(url, "/") || _.startsWith(url, "./") ) { return url } else { return appRoot + "/" + url } }
var appRoot = require('app-root-path');
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess")
const symlinkDir = require('symlink-dir')
var fse = require('fs-extra');
var fs = require('fs');
var shell = require('shelljs');


function handleTimeseriesData(socket) {
  console.log("HANDLING TIME SERIES")
  // Two cases - one is timeseries forecasting, in which we only need the learning data file.
  symlinkDir(handleUrl(evaluationConfig.training_data_root + "/tables/learningData.csv"), "./static/learningData.csv")

  // The other case, classification or regression on a timeseries object, requires symlinking the timeseries folder
  // For that, we need to get all the timeseries resources first
  var timeseriesResources = [];
  datasetSchema.dataResources.forEach(function(each) {
    if (each.resType === "timeseries") {
      console.log("adding timeseries resource", each)
      timeseriesResources.push(each);
    }
  });

  var tmpdir = evaluationConfig.temp_storage_root;
  var timeseriesPaths = [];

  for (var i = 0; i < timeseriesResources.length; i++) {
    var resource = timeseriesResources[i];
    timeseriesPaths.push({
      source: handleUrl(evaluationConfig.training_data_root + '/' + resource.resPath),
      link: "./static/timeseries_" + resource.resID
    });
  }

  for (var i = 0; i < timeseriesResources.length; i++) {
    var resource = timeseriesResources[i];
    var tmpi = i;

    var tmpReal = timeseriesPaths[i].source;
    var tmpLink = timeseriesPaths[i].link;
    var path = handleUrl(evaluationConfig.training_data_root + "/" + resource.resPath);

    var timeseriesSymbolicLink = tmpLink;
    var currentThumbnailsPath = tmpReal;

    if (fs.existsSync(timeseriesSymbolicLink)){
      fse.removeSync(timeseriesSymbolicLink);
      console.log("Existing symbolic link directory has been deleted!");
    }

    symlinkDir(currentThumbnailsPath, timeseriesSymbolicLink)
      .then(result => {
        console.log(result)
        //> { reused: false }
        return symlinkDir(currentThumbnailsPath, timeseriesSymbolicLink)
      })
      .then(result => {
        console.log(result)
        //> { reused: true }
      })
      .catch(err => console.error(err));

      var timeseriesFolders = {
        data: []
      };
      //var imagePaths;
      for(var i = 0; i < timeseriesPaths.length; i++){
          timeseriesFolders.data.push(timeseriesPaths[tmpi].link);
          //console.log("tempLink[i]"+imagePaths[tmpi].link);
      }
      //console.log("imageFolders.data:"+imageFolders.data);
      socket.emit("timeseriesready", timeseriesFolders);
    }

}

module.exports.set = function(app, server, grpcClientWrapper, socket) {

  socket.on('handleTimeseriesData', function(fn) {
    handleTimeseriesData(socket)
  });
}
