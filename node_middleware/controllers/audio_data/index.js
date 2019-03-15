const _ = require("lodash");
const fs = require("fs");
const csv = require("csvtojson");
const appRoot = require("app-root-path");
const symlinkDir = require("symlink-dir");
var fse = require("fs-extra");

const handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};

const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
const datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));

const staticPath = evaluationConfig.training_data_root + "/";
// "static/local_testing_data/31_urbansound/31_urbansound_dataset"

//// TODO: this is the module. problem is that it is creating multiple times those links. we need to handle as per our logic
/*
var createSymbolicLinks = function(audios, audioNames, audiosFolderPath){

  var audioSymPath = "./static/audio";

  if (!fs.existsSync(audioSymPath)){
    fs.mkdirSync(audioSymPath);
    console.log("New Directory has been created for audio symbolic links");
  }
  else{
    fse.removeSync(audioSymPath);
    fs.mkdirSync(audioSymPath);
    console.log("Directory has been re-created for audio symbolic links");
  }

  var audioSymLinks = [];

  for(var i = 0; i < audios.length; i++){
    var singleLink = {
      d3mIndex: audios[i].link,
      link : audioSymPath + "/" + audioNames[i]
    };

    audioSymLinks.push(singleLink);

    fs.symlink(audios[i].link, singleLink.link, function (err) {
        console.log(err || "Done.");
    });

}
console.log("audioSymLinks:"+audioSymLinks);
return audioSymLinks;

};
*/

function requestAudios(socket) {
  var audios = []; // data to be sent to frontend

  // dictionary/map storing those whose "resType" is "audio". key is "resID", value is object of dataResources element
  var audioResIDs = {};

  var tables = []; // dataResources element whose "resType" is table

  // dataResources element whose "resType" is table AND one column of which "refersTo" to an element of "resType" audio
  // audioTables must be subset of tables
  // tables whose entry store informatin for audio file
  var audioTables = [];

  const drs = datasetSchema.dataResources;
  // first loop, pick up resType of "audio", and "table".
  drs.forEach(dr => {
    if (dr["resType"] === "audio") {
      // key is "resID", value is dataResources element itself
      audioResIDs[dr["resID"]] = dr;
    } else if (dr["resType"] === "table") {
      tables.push(dr);
    }
  });

  // seconde loop, among "tables", pick up those which has a column "refersTo" an element of "audioResIDs"
  // tables can be omitted later, but now it exists for better understanding
  tables.forEach(table => {
    const columns = table["columns"];
    // check every column in current table
    for (var i = 0; i < columns.length; i++) {
      const column = columns[i];
      // if current column has "refersTo", AND its "refersTo" has "resID" in "audioResIDs", store this table!
      // if ( columns["refersTo"] && column["refersTo"]["resID"] in audioResIDs ) {...}
      if (column["refersTo"]) {
        const resID = column["refersTo"]["resID"];
        if (resID in audioResIDs) {
          audioTables.push(table);
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
  const numOfTables = audioTables.length;

  // deal with audioTables
  audioTables.forEach(table => {
    const columns = table["columns"];
    const csvFilePath = staticPath + table["resPath"];
    var audiosFolderPath = ""; // path to audio folder
    var index_d3mIndex = -1; // column index of column has a name of "d3mIndex". For now "d3mIndex" is fixed
    var index_filename = -1; // column index of column whose name is "filename" or something else (not fixed)

    columns.forEach(column => {
      if (column["colName"] === "d3mIndex") {
        index_d3mIndex = column["colIndex"];
      } else if (column["refersTo"]) {
        index_filename = column["colIndex"];

        const resID = column["refersTo"]["resID"];
        if (resID in audioResIDs) {
          // audioResIDs[resID]["resPath"] is a part of prefix of path to an audio file
          audiosFolderPath = staticPath + audioResIDs[resID]["resPath"];
        }
      }
    });

    // No need to remove the old link. It will be replaced

    // FROM
    // audiosFolderPath
    // "static/local_testing_data/31_urbansound/31_urbansound_dataset/media"

    // TO
    // symbolicLinkForAudiosFolder
    // "static/audio_1/"
    var symbolicLinkForAudiosFolder = `static/audio_${count + 1}/`;
    symlinkDir(audiosFolderPath, symbolicLinkForAudiosFolder)
      .then(result => {
        // console.log(result); //> { reused: false }
        return symlinkDir(audiosFolderPath, symbolicLinkForAudiosFolder);
      })
      .then(result => {
        // console.log(result); //> { reused: true }
      })
      .catch(err => console.error(err));

    csv({ noheader: false })
      .fromFile(csvFilePath)
      .on("csv", row => {
        const audio = {
          d3mIndex: row[index_d3mIndex] + "", //make sue d3mIndex is always string
          // link: audiosFolderPath + row[index_filename]
          link: symbolicLinkForAudiosFolder + row[index_filename]
        };
        audios.push(audio);
        // audioNames.push(row[index_filename]);
      })
      .on("done", error => {
        count++;
        // only after all table/csv is done, will socket emit
        if (count === numOfTables) {
          // console.log(audios.length);
          //// TODO: this funciton can be used to create symbi links. However, we need to make it as per our logic
          /*
          var audioSymLinks = createSymbolicLinks(audios, audioNames, audiosFolderPath);
          */
          socket.emit("responseAudios", audios);
        }
      });
  });
}

module.exports.set = function(app, server, grpcClientWrapper, socket) {
  socket.on("requestAudios", function(fn) {
    requestAudios(socket);
  });
};
