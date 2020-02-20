var papa = require('papaparse');
var fs = require('fs')
// var appRoot = require("app-root-path");

var loadDataAndSend = function(folderPath, trainDataPath, fn) {
  // console.log("starting text load data and send ", folderPath);
  // console.log("starting text load data and send ", trainDataPath);

  // var path = (appRoot.path + trainDataPath).replace("/", /\\/g);
  // var path = appRoot.path + trainDataPath
  // path = path.replace(/\//g, "\\");

  // We shouldn't be loading from our web server, since this is all happening
  // server side.
  // TODO - look through app for other URL loads like this
  // d3.csv("http://localhost:8080/" + trainDataPath, function(dataMain) {
  // Changed from d3 parse to papaparse for better server performance
  var new_file = trainDataPath.replace(/^(file:\/\/)/,"");
  var stream = fs.createReadStream(new_file);
  papa.parse(stream, {
    header: true,
    error: function(errors) {
      if ( errors ) { console.log("errors are ", errors)}
    },
    complete: function(results) {
      var dataMain = results.data;
      var fileNameList = [];
      var filePathFull = [];
      var val;
      if(dataMain.length > 120){
        val = 80;
      }else{
        val = 0;
      }
      for (var i = 0; i < dataMain.length - val; i++) {
        fileNameList.push(dataMain[i]["raw_text_file"]);
        filePathFull.push(folderPath + dataMain[i]["raw_text_file"]);
        // var dataSend = { fileName: folderPath + dataMain[i]["raw_text_file"], index: dataMain[i]["raw_text_file"] };
        var dataSend = { fileName: folderPath + dataMain[i]["raw_text_file"], index: dataMain[i]["raw_text_file"], id : i };
        //  obj.$socket.emit("getTextContent", dataSend);
        fn(dataSend);
      }
    }
  });
};

exports.loadDataAndSendText = loadDataAndSend;
