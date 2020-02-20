const fs = require("fs");

// import variables
const proto = require("../proto");

function endSearchSolutions(herald) {
  let promise = new Promise((fulfill, reject) => {
    console.log("end search solutions for search", herald.search_id);
    let request = new proto.EndSearchSolutionsRequest();
    request.setSearchId(herald.search_id);
    let client = herald.getClient();
    client.endSearchSolutions(request, (err, response) => {
      if (err) {
        reject(err);
      } else {
        herald.searchEnded = true;
        fulfill(herald);
      }
    });
  });
  return promise;
}

module.exports = endSearchSolutions;
