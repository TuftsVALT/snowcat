// import variables
const props = require("../props");
const proto = props.proto;

function listPrimitives() {
  console.log("listPrimitives.js");
  let promise = new Promise((fulfill, reject) => {
    let client = props.client;
    let request = new proto.ListPrimitivesRequest();
    client.listPrimitives(request, (err, response) => {
      if (err) {
        console.log("Error!listPrimitives");
      } else {
        console.log(response);
      }
    });
  });
  return promise;
}

module.exports = listPrimitives;
