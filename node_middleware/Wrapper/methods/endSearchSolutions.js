const fs = require("fs");

// import variables
const props = require("../props");
const proto = props.proto;

function endSearchSolutions(sessionVar) {
  let promise = new Promise((fulfill, reject) => {
    console.log("end search solutions for search", sessionVar.searchID);
    let request = new proto.EndSearchSolutionsRequest();
    request.setSearchId(sessionVar.searchID);
    let client = props.client;
    client.endSearchSolutions(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        sessionVar.searchEnded = true;
        fulfill(sessionVar);
      }
    });
  });
  return promise;
}

module.exports = endSearchSolutions;
