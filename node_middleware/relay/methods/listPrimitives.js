// import variables
const proto = require("../proto.js");

function listPrimitives() {
  console.log("listPrimitives.js");
  let promise = new Promise((fulfill, reject) => {
    let client = herald.getClient();
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
