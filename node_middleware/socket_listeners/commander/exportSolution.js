const appRootPath = require("app-root-path");
const relay = require(appRootPath + "/relay");
function exportSolution(session, selectedModel) {
  try {
    let herald = session.getHerald();
    relay.exportFittedSolution(herald, selectedModel);
  } catch (err) {
    console.log("WARNING: solution export failed!", err);
  }
}

module.exports = exportSolution;
