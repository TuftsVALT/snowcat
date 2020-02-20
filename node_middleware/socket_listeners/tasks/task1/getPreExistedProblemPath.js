function getPreExistedProblemPath(session) {
  // let herald = session.getHerald();
  // let dataset = herald.getDataset();
  let dataset = session.getCurrentDataset();
  let datasetPath = dataset.getDatasetPath();

  // remove last part of "/38_sick_dataset"
  let index = datasetPath.lastIndexOf("/");
  let str1 = datasetPath.substring(0, index);

  let index1 = str1.lastIndexOf("/");
  let str2 = str1.substring(index1, str1.length);
  let preExistedProblemPath = str1 + str2 + "_problem";

  return preExistedProblemPath;
}

module.exports = getPreExistedProblemPath;
