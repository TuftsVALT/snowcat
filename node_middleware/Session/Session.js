// import Dataset from "./Dataset.js";
// import Problem from "./Problem.js";

class Session {
  constructor(devMode = false, vast20expMode = false, vast20expConfig = null) {
    // are we running in development mode (without a ta2)
    this.devMode = devMode;
    // are we running our vast2020 experiment (two tasks, two datasets)
    this.vast20expMode = vast20expMode;
    this.vast20expConfig = vast20expConfig;
    this.currentTask = 1;
    // console.log("this is session constructor", this.devMode);
    // * callbacks:
    this.datasetCallbacks = [];
    this.problemCallbacks = [];

    // configPath looks like "shared/static/config_files/dev_mode/example_dev_regression_config.json"
    // legacy, compatible for old version
    this.config = null;

    // * state objects
    // use getters and setters whenever possible
    // current dataset
    this.currentDataset = null;

    // We keep track of the original dataset for the sake of data augmentation.
    this.originalDataset = null;

    // current problem
    this.currentProblem = null;
    // current herald
    this.currentHerald = null;
    this.currentHeraldId = 0; // random number

    this.heraldsMap = new Map(); // new Map()

    this.ta2_port = null;
  }

  incrementTask() {
    this.currentTask += 1;
  }
  /**
  all the methods for registering and handling callbacks (observer pattern)
  **/
  registerDatasetUpdates(f) {
    this.datasetCallbacks.push(f);
    if (this.currentDataset) {
      process.nextTick(() => f(this.currentDataset));
    }
  }

  handleDatasetChange() {
    this.datasetCallbacks.forEach(f =>
      process.nextTick(() => f(this.currentDataset))
    );
  }

  registerProblemUpdates(f) {
    this.problemCallbacks.push(f);
    if (this.currentProblem) {
      process.nextTick(() => f(this.currentProblem));
    }
  }

  handleProblemChange() {
    this.problemCallbacks.forEach(f =>
      process.nextTick(() => f(this.currentProblem))
    );
  }

  handleDatasetChange() {
    this.datasetCallbacks.forEach(f =>
      process.nextTick(() => f(this.currentDataset))
    );
  }

  // getters and setters
  getCurrentDataset() {
    return this.currentDataset;
  }
  setCurrentDataset(currentDataset) {
    // this.currentDataset = currentDataset;
    try {
      this.currentDataset = currentDataset;
      this.handleDatasetChange();
      this.originalDataset = this.originalDataset || currentDataset;
    } catch (err) {
      console.log(err);
      console.log("WARNING: setting dataset to 'null'");
      if (this.currentDataset) {
        this.currentDataset = null;
        this.handleDatasetChange();
      }
    }
  }

  getOriginalDataset() {
    return this.originalDataset;
  }
  setOriginalDataset(originalDataset) {
    this.originalDataset = originalDataset;
  }

  getCurrentProblem() {
    return this.currentProblem;
  }
  setCurrentProblem(currentProblem) {
    this.currentProblem = currentProblem;
    this.handleProblemChange();
  }

  getCurrentHerald() {
    return this.currentHerald;
  }
  setCurrentHerald(currentHerald) {
    this.currentHerald = currentHerald;
  }

  getCurrentHeraldId() {
    return this.currentHeraldId;
  }
  setCurrentHeraldId(id) {
    this.currentHeraldId = id;
  }

  getHeraldsMap() {
    return this.heraldsMap;
  }
  // setHeralds() {}

  // setters
  // setDataset(dataset) {
  //   // try {
  //   this.dataset = dataset;
  //   // this.handleDatasetChange();
  //   // } catch {
  //   //   console.log("WARNING: setting dataset to 'null'");
  //   //   if (this.dataset) {
  //   //     this.dataset = null;
  //   //     this.handleDatasetChange();
  //   //   }
  //   // }
  // }
}

module.exports = Session;
