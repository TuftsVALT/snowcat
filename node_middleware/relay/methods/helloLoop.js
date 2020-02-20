const proto = require("../proto.js");

const fs = require("fs");
const fse = require("fs-extra");

const appRootPath = require("app-root-path");

function helloLoop(herald) {
  console.log("helloLoop begin");
  if (herald.isRequest || herald.isResponse) {
    let heraldPath = appRootPath + "/output/herald_" + herald.getId();
    if (fs.existsSync(heraldPath)) {
      console.log("Remove old request folder!");
      fse.removeSync(heraldPath);
    }
    fs.mkdirSync(heraldPath);

    if (herald.isRequest) {
      let REQUESTS_PATH = heraldPath + "/requests/";
      console.log("REQUESTS_PATH", REQUESTS_PATH);
      herald.REQUESTS_PATH = REQUESTS_PATH;
      console.log("Create new request folder!!");
      fs.mkdirSync(REQUESTS_PATH);
    }

    if (herald.isResponse) {
      let RESPONSES_PATH = heraldPath + "/responses/";
      console.log("RESPONSES_PATH", RESPONSES_PATH);
      herald.RESPONSES_PATH = RESPONSES_PATH;
      if (fs.existsSync(RESPONSES_PATH)) {
        console.log("Remove old responses folder!");
        fse.removeSync(RESPONSES_PATH);
      }
      console.log("Create new responses folder!!");
      fs.mkdirSync(RESPONSES_PATH);
    }
  }
  let request = new proto.HelloRequest(); // HelloRequest is nothing but {}
  let waiting = false;
  let promise = new Promise((fulfill, reject) => {
    setInterval(() => {
      if (waiting || herald.isConnected) {
        return;
      }
      waiting = true;
      let client = herald.getClient();
      client.Hello(request, (err, response) => {
        if (err) {
          console.log("Error!Hello", err);
          herald.isConnected = false;
          waiting = false;
          // we do not reject here, because ta2 can becaome available at some point
          // reject(err);
        } else {
          console.log("Success!Hello");
          herald.isConnected = true;
          herald.ta2Ident = response;
          console.log("response");
          fulfill(herald);

          // Added by Alex, for the purpose of Pipeline Visulization
          if (herald.isResponse) {
            let pathPrefix = herald.RESPONSES_PATH;
            let pathMid = "helloResponse";
            let pathAffix = ".json";
            let path = pathPrefix + pathMid + pathAffix;
            let responseStr = JSON.stringify(response);
            fs.writeFileSync(path, responseStr);
          }
        }
      });
    }, 10000);
  });
  // let promise = new Promise(fun);
  return promise;
}

module.exports = helloLoop;
