// !!! BUGs exist !!!
// create symbolic for thumbnail, path, not only jpg but also png so on

// image_data folder is responsible for raw image data
var _ = require("lodash");
var handleUrl = url => {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    return appRoot + "/" + url;
  }
};
var appRoot = require("app-root-path");
var evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration");
var datasetSchema = require(handleUrl(evaluationConfig.dataset_schema));
var spawnChildProcess = require(appRoot + "/lib/js/spawnChildProcess");
const symlinkDir = require("symlink-dir");
var fse = require("fs-extra");
var fs = require("fs");
var shell = require("shelljs"); ////

/*///////
THIS FUNCTION CREATE IMAGE THUMBNAILS FOR ALL IMAGES
AND THEN CREATE SYMBOLIC LINK IN THE STATIC DIRECOTRY
*/ function handleImageData(
  socket
) {
  //store all resources that are of type image
  var imageResources = [];
  datasetSchema.dataResources.forEach(function(each) {
    if (each.resType === "image") {
      imageResources.push(each);
    }
  });

  var tmpdir = evaluationConfig.temp_storage_root;
  var imagePaths = [];

  for (var i = 0; i < imageResources.length; i++) {
    var resource = imageResources[i];
    imagePaths.push({
      source: handleUrl(
        evaluationConfig.training_data_root + "/" + resource.resPath
      ),
      real: tmpdir + "/thumbnails_" + resource.resID,
      link: "./static/thumbnails_" + resource.resID
    });
  }

  for (var i = 0; i < imageResources.length; i++) {
    var resource = imageResources[i];
    var tmpi = i;
    if (!fs.existsSync(imagePaths[i].real)) {
      fs.mkdirSync(imagePaths[i].real);
      console.log("New Directory has been created for thumbnails");
    } else {
      fse.removeSync(imagePaths[i].real);
      fs.mkdirSync(imagePaths[i].real);
      console.log("Directory has been re-created for thumbnails");
    }

    var tmpReal = imagePaths[i].real;
    var tmpLink = imagePaths[i].link;
    var path = handleUrl(
      evaluationConfig.training_data_root + "/" + resource.resPath
    );
    var cmd =
      "mogrify -path " +
      imagePaths[i].real +
      " -resize 320x320 -quality 75 " +
      imagePaths[i].source +
      "*.jpg";
    shell.exec(cmd, function() {
      console.log("IMAGES READY!!");
      var thumbnailImages = walkSync(tmpReal, thumbnailImages);

      var thumbsSymbolicLink = tmpLink;
      var currentThumbnailsPath = tmpReal;

      if (fs.existsSync(thumbsSymbolicLink)) {
        fse.removeSync(thumbsSymbolicLink);
        console.log("Existing symbolic link directory has been deleted!");
      }

      // also going to symlink the learningData.csv
      symlinkDir(
        handleUrl(
          evaluationConfig.training_data_root + "/tables/learningData.csv"
        ),
        "./static/learningData.csv"
      );
      symlinkDir(currentThumbnailsPath, thumbsSymbolicLink)
        .then(result => {
          console.log(result);
          //> { reused: false }
          return symlinkDir(currentThumbnailsPath, thumbsSymbolicLink);
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
    files = fs.readdirSync(dir);
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

module.exports.set = function(app, server, grpcClientWrapper, socket) {
  socket.on("handleImageData", function(fn) {
    handleImageData(socket);
  });
};
