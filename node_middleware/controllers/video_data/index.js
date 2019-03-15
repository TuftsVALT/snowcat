const _ = require("lodash");
const fs = require("fs");
const csv = require("csvtojson");
const appRoot = require("app-root-path");
const symlinkDir = require("symlink-dir");

const handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};

const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
const datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));

const rootPath = evaluationConfig.training_data_root + "/";

function requestVideos(socket) {
  var videos = []; // data to be sent to frontend

  // dictionary/map storing those whose "resType" is "video". key is "resID", value is object of dataResources element
  var videoResIDs = {};

  var tables = []; // dataResources element whose "resType" is table

  // dataResources element whose "resType" is table AND one column of which "refersTo" to an element of "resType" video
  // videoTables must be subset of tables
  // tables whose entry store informatin for video file
  var videoTables = [];

  const drs = datasetSchema.dataResources;
  // first loop, pick up resType of "video", and "table".
  drs.forEach(dr => {
    if (dr["resType"] === "video") {
      // key is "resID", value is dataResources element itself
      videoResIDs[dr["resID"]] = dr;
    } else if (dr["resType"] === "table") {
      tables.push(dr);
    }
  });

  // seconde loop, among "tables", pick up those which has a column "refersTo" an element of "videoResIDs"
  // tables can be omitted later, but now it exists for better understanding
  tables.forEach(table => {
    const columns = table["columns"];
    // check every column in current table
    for (var i = 0; i < columns.length; i++) {
      const column = columns[i];
      // if current column has "refersTo", AND its "refersTo" has "resID" in "videoResIDs", store this table!
      // if ( columns["refersTo"] && column["refersTo"]["resID"] in videoResIDs ) {...}
      if (column["refersTo"]) {
        const resID = column["refersTo"]["resID"];
        if (resID in videoResIDs) {
          videoTables.push(table);
          break; // to "break" earlier, avoid using forEach
        }
      }
    }
  });

  // There might be more than one csv file, although currently only one csv file in development stage.
  // "csvtojson@1.1.9", the version which I has to work with, seems to only work asynchronously,
  // which means the socket.emit() run before last table/csv is done,
  // thus a sentinel count is wanted. It will guarantee that only after the last table/csv is done, will the socket emit
  var count = 0;
  const numOfTables = videoTables.length;

  // deal with videoTables
  videoTables.forEach(table => {
    const columns = table["columns"];
    const csvFilePath = rootPath + table["resPath"];
    var videosFolderPath = ""; // path to video folder
    var index_d3mIndex = -1; // column index of column has a name of "d3mIndex". For now "d3mIndex" is fixed
    var index_filename = -1; // column index of column whose name is "filename" or something else (not fixed)

    columns.forEach(column => {
      if (column["colName"] === "d3mIndex") {
        index_d3mIndex = column["colIndex"];
      } else if (column["refersTo"]) {
        index_filename = column["colIndex"];

        const resID = column["refersTo"]["resID"];
        if (resID in videoResIDs) {
          // videoResIDs[resID]["resPath"] is a part of prefix of path to an video file
          videosFolderPath = rootPath + videoResIDs[resID]["resPath"];
        }
      }
    });

    var symbolicLinkForVideosFolder = `static/video_${count + 1}/`;
    symlinkDir(videosFolderPath, symbolicLinkForVideosFolder)
      .then(result => {
        // console.log(result); //> { reused: false }
        return symlinkDir(videosFolderPath, symbolicLinkForVideosFolder);
      })
      .then(result => {
        // console.log(result); //> { reused: true }
      })
      .catch(err => console.error(err));

    csv({ noheader: false })
      .fromFile(csvFilePath)
      .on("csv", row => {
        const video = {
          d3mIndex: row[index_d3mIndex] + "", //make sue d3mIndex is always string
          link: symbolicLinkForVideosFolder + row[index_filename]
        };
        videos.push(video);
      })
      .on("done", error => {
        count++;
        // only after all table/csv is done, will socket emit
        if (count === numOfTables) {
          // console.log(videos.length);
          socket.emit("responseVideos", videos);
        }
      });
  });
}

module.exports.set = function(app, server, grpcClientWrapper, socket) {
  socket.on("requestVideos", function(fn) {
    requestVideos(socket);
  });
};
