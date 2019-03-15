const fs = require("fs");
const console = require("console");

module.exports = function(process_argv, datasetPath, defaultConf, confFiles) {

  if (fs.existsSync("/input/")) {
    datasetPath = "/input/";
    console.log("tinyconf: running in container, searching for datasets in", datasetPath);
  } else {
    console.log("tinyconf: running locally, search for datasets in", datasetPath);
  }

  let conf = getConf(datasetPath);
  let prettyConfString = JSON.stringify(conf, null, 4);
  // console.log("write to files", prettyConfString);
  confFiles.forEach((file) => {
    console.log("write file", file);
    fs.writeFileSync(file, prettyConfString, (err) => {
      if (err) {
        console.log("tinyconf: error writing config file", err);
      } else {
        console.log("tinyconf: configuration written to file");
      }
    });
  });

  function getConf(datasetPath) {
    var dataset_ident = null;
    process.argv.forEach(function(el) {
      if (el.startsWith("dataset:")) {
        dataset_ident = el.substring(8);
      }
    });
    if (dataset_ident === null) {
      return defaultConf;
    } else if (dataset_ident === "__direct__") {
      console.log("\x1b[34m%s\x1b[0m", "dataset folder mounted directly at /input/");
      files = fs.readdirSync(datasetPath)
                .filter(filename => filename.toLowerCase().endsWith("_dataset"));
      if (files.length === 1) {
        let basename = files[0].replace("_dataset", "");
        console.log("\x1b[34m%s\x1b[0m", "basename found:", basename);
        return createConfEval(datasetPath, basename, true);
      } else {
        console.log("\x1b[34m%s\x1b[0m", "no basename found; assuming config file");
        return createConfEval(datasetPath, "", true);
      }
    } else {
      let dev_mode = false;
      if (dataset_ident.startsWith("dev:")) {
        dev_mode = true;
        dataset_ident = dataset_ident.substring(4);
        console.log("tinyconf: switching to dev mode with dataset ident:", dataset_ident);
      }
      files = fs.readdirSync(datasetPath)
                .filter(filename => filename.toLowerCase().includes(dataset_ident.toLowerCase()));
      if (files.length === 0) {
        console.log("\x1b[34m%s\x1b[0m", "no dataset found, using default config");
        return defaultConf;
      } else {
        if (files.length > 1)  {
          console.log("\x1b[34m%s\x1b[0m", "alternatives:");
          files.forEach(function(file) {
            console.log("\x1b[34m%s\x1b[0m", file);
          });
        }
        console.log("\x1b[34m%s\x1b[0m", "using dataset: " + files[0]);
        return dev_mode ? createConf(datasetPath, files[0]) : createConfEval(datasetPath, files[0], false);
      }
    }

    function createConf(datasetPath, basename) {
      if (!datasetPath.endsWith("/")) {
        datasetPath = datasetPath + "/";
      }
      var prob = basename + "/" + basename + "_problem";
      var dset = basename + "/" + basename + "_dataset";
      var sol = basename + "/" + basename + "_solution";

      return {
        "problem_schema": datasetPath + prob + "/problemDoc.json",
        "problem_root": datasetPath + prob,
        "dataset_schema": datasetPath + dset + "/datasetDoc.json",
        "training_data_root": datasetPath + dset,
        "pipeline_logs_root": "/outputs/logs",
        "executables_root": "/outputs/executables",
        "temp_storage_root": "/temp",
        "results_root": "/temp",
        "results_path": "/temp",
        "timeout": 60,
        "cpus"  : "32",
        "ram"   : "16Gi",
        "running_mode": "development",
        "raw_data_file": "/tables/learningData.csv",
        "model_output_prediction_files": [
          "/static/local_testing_data/" + sol + "/predictions.csv"
        ]
      }
    }// end createConf(...)

    function createConfEval(datasetPath, basename, directMount) {
      if (!datasetPath.endsWith("/")) {
        datasetPath = datasetPath + "/";
      }
      if (directMount) {
        var prob = basename + "_problem";
        var dset = basename + "_dataset";
        var sol = basename + "_solution";
      } else {
        var prob = basename + "/" + basename + "_problem";
        var dset = basename + "/" + basename + "_dataset";
        var sol = basename + "/" + basename + "_solution";
      }

      // only care about existing conf file if there is no basename (_dataset folder does not exist)
      if (basename.length === 0) {
        let existingConfig = null;
        if (directMount) {
          existingConfig = checkExistsConfig(datasetPath);
        } else {
          existingConfig = checkExistsConfig(datasetPath + basename);
          console.log("existing conf -- converting", existingConfig);
          let keys = Object.keys(existingConfig);
          for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = existingConfig[key];
            if (value.startsWith("/input/")) {
              let splitValue = value.split("/");
              splitValue[0] = "input";
              splitValue[1] = basename;
              existingConfig[key] = "/" + splitValue.join("/");
            }
          }
        }
        if (existingConfig) {
          console.log("existing search_config.json found", existingConfig);
          let problem_schema = existingConfig.problem_schema ? existingConfig.problem_schema : datasetPath + prob + "/problemDoc.json"
          let ret = {
            "problem_schema": problem_schema,
            "problem_root": existingConfig.problem_root,
            "dataset_schema": existingConfig.dataset_schema,
            "training_data_root": existingConfig.training_data_root,
            "pipeline_logs_root": "/output/logs",
            "executables_root": "/output/executables",
            "temp_storage_root": existingConfig.temp_storage_root,
            "user_problems_root": "/output/problems",
            "timeout": 60,
            "cpus"  : "32",
            "ram"   : "16Gi",
          };
          return ret;
        }
      }
      return {
        "problem_schema": datasetPath + prob + "/problemDoc.json",
        "problem_root": datasetPath + prob,
        "dataset_schema": datasetPath + dset + "/datasetDoc.json",
        "training_data_root": datasetPath + dset,
        "pipeline_logs_root": "/output/logs",
        "executables_root": "/output/executables",
        "temp_storage_root": "/output",
        "user_problems_root": "/output/problems",
        "timeout": 60,
        "cpus"  : "32",
        "ram"   : "16Gi"
      };
    }// end createConfEval(...)

    function checkExistsConfig(path) {
      if (!path.endsWith("/")) {
        path = path + "/";
      }
      try {
        return require(path + "search_config.json");
      } catch(err) {
        return null;
      }
    }

  }// end defConf(...)
};
