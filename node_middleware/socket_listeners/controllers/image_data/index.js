// image_data folder is responsible for raw image data
const appRootPath = require("app-root-path");
const relay = require(appRootPath + "/relay");
const handleUrl = relay.handleUrl;

const symlinkDir = require("symlink-dir");
var fse = require("fs-extra");
var fs = require("fs");
var shell = require("shelljs"); ////
var path = require('path');

const rimraf = require("rimraf");

/*///////
THIS FUNCTION CREATE IMAGE THUMBNAILS FOR ALL IMAGES
AND THEN CREATE SYMBOLIC LINK IN THE STATIC DIRECOTRY
*/
function handleImageData(session, socket) {
  var path = path || require("path");
  //store all resources that are of type image
  var imageResources = [];
  let dataset = session.getCurrentDataset();
  let datasetSchema = dataset.getDatasetSchema();
  datasetSchema.dataResources.forEach(function(each) {
    if (each.resType === "image") {
      imageResources.push(each);
    }
  });

  let tmpdir = appRootPath + "/output/tmp";
  if (fs.existsSync(path.resolve(tmpdir))) {
    // console.log("remove",tmpdir)
    rimraf.sync(path.resolve(tmpdir));
  }
  fs.mkdirSync(path.resolve(tmpdir));
  var imagePaths = [];

  for (var i = 0; i < imageResources.length; i++) {
    var resource = imageResources[i];
    imagePaths.push({
      source: handleUrl(
        // evaluationConfig.training_data_root + "/" + resource.resPath
        dataset.getDatasetPath() + "/" + resource.resPath
      ),
      real: tmpdir + "/thumbnails_" + resource.resID,
      link: "./static/thumbnails_" + resource.resID
    });
  }

  for (var i = 0; i < imageResources.length; i++) {
    var resource = imageResources[i];
    var tmpi = i;
    if (!fs.existsSync(path.resolve(imagePaths[i].real))) {
      fs.mkdirSync(path.resolve(imagePaths[i].real));
      console.log("New Directory has been created for thumbnails");
    } else {
      fse.removeSync(path.resolve(imagePaths[i].real));
      fs.mkdirSync(path.resolve(imagePaths[i].real));
      console.log("Directory has been re-created for thumbnails");
    }

    var tmpReal = imagePaths[i].real;
    var tmpLink = imagePaths[i].link;
    var path = handleUrl(
      // evaluationConfig.training_data_root + "/" + resource.resPath
      dataset.getDatasetPath() + "/" + resource.resPath
    );
    var cmd =
      "mogrify -path " +
      imagePaths[i].real +
      " -resize 320x320 -quality 75 " +
      imagePaths[i].source +
      "*.png";
    shell.exec(cmd, function() {
      console.log("IMAGES READY!!");
      var thumbnailImages = walkSync(path.resolve(tmpReal), thumbnailImages);

      var thumbsSymbolicLink = tmpLink;
      var currentThumbnailsPath = tmpReal;

      if (fs.existsSync(path.resolve(thumbsSymbolicLink))) {
        fse.removeSync(path.resolve(thumbsSymbolicLink));
        console.log("Existing symbolic link directory has been deleted!");
      }

      // also going to symlink the learningData.csv
      symlinkDir(
        path.resolve(handleUrl(
          // evaluationConfig.training_data_root + "/tables/learningData.csv"
          dataset.getDatasetPath() + "/tables/learningData.csv"
        )),
        path.resolve("./static/learningData.csv")
      );
      symlinkDir(path.resolve(currentThumbnailsPath), path.resolve(thumbsSymbolicLink))
        .then(result => {
          console.log(result);
          //> { reused: false }
          return symlinkDir(path.resolve(currentThumbnailsPath), path.resolve(thumbsSymbolicLink));
        })
        .then(result => {
          console.log(result);
          //> { reused: true }
        })
        .catch(err => console.error(err));

      var imageFolders = {
        data: []
      };
      //var imagePaths;
      for (var i = 0; i < imagePaths.length; i++) {
        imageFolders.data.push(imagePaths[tmpi].link);
        //console.log("tempLink[i]"+imagePaths[tmpi].link);
      }
      //console.log("imageFolders.data:"+imageFolders.data);
      socket.emit("imagesthumbnailsready", imageFolders);
    });
  }

  //return imagePaths;//[0].link;
}

var walkSync = function(dir, filelist) {
  var path = path || require("path");
  var fs = fs || require("fs"),
    files = fs.readdirSync(path.resolve(dir));
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      filelist.push(file);
    }
  });
  return filelist;
};

module.exports.set = function(session, socket) {
  session.registerDatasetUpdates(dataset => {
    if (dataset) {
      handleImageData(session, socket);
    } else {
      //
    }
  });

  socket.on("handleImageData", function(fn) {
    handleImageData(session, socket);
  });
};
