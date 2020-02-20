const fs = require("fs");
function getAllDatasetNames(datasetsPath) {
  // console.log("task0: getAllDatasetNames");
  let allDatasetNames = fs.readdirSync(datasetsPath);
  return allDatasetNames;
}
module.exports = getAllDatasetNames;
