const fs = require("fs");
const fse = require("fs-extra");

// import variables
const props = require("../props");
const proto = props.proto;
const sessionVar = props.sessionVar;

function helloLoop() {
  console.log("helloLoop begin");

  if (props.isRequest) {
    let pathPrefix = props.REQUESTS_PATH;
    if (fs.existsSync(pathPrefix)) {
      console.log("Remove old request folder!");
      fse.removeSync(pathPrefix);
    }
    console.log("Create new request folder!!");
    fs.mkdirSync(pathPrefix);
  }

  if (props.isResponse) {
    let pathPrefix = props.RESPONSES_PATH;
    if (fs.existsSync(pathPrefix)) {
      console.log("Remove old responses folder!");
      fse.removeSync(pathPrefix);
    }
    console.log("Create new responses folder!!");
    fs.mkdirSync(pathPrefix);
  }

  let promise = new Promise((fulfill, reject) => {
    let request = new proto.HelloRequest();
    let waiting = false;
    setInterval(() => {
      if (waiting || sessionVar.connected) {
        return;
      }
      waiting = true;
      let client = props.client;
      client.Hello(request, (err, response) => {
        if (err) {
          console.log("Error!Hello", err);
          sessionVar.connected = false;
          waiting = false;
          // we do not reject here, because ta2 can becaome available at some point
          // reject(err);
        } else {
          console.log("Success!Hello");          
          sessionVar.connected = true;
          sessionVar.ta2Ident = response;
          // props.allowed_val_types = response.allowed_value_types; 
          fulfill(sessionVar);

          // Added by Alex, for the purpose of Pipeline Visulization
          if (props.isResponse) {
            let pathPrefix = props.RESPONSES_PATH;
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
  return promise;
}

module.exports = helloLoop;
