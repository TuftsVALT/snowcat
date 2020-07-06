const Logger = require("./logger")
const appRoot = require('app-root-path');

// All paths relative to appRoot
const config = {
    'task1': {
        'datasetPath': "../shared/static/local_testing_data/DA_poverty_estimation",
    },
    'task2': {
        'datasetPath': "../shared/static/local_testing_data/movie_model",
    },
    'task3': {
        'datasetPath': "../shared/static/local_testing_data/employmentrate_model"
    }
}

class Vast20expConfig {
    constructor(participantId) {
        this.participantId = participantId
        this.logger = new Logger(participantId);
        this.task1 = config.task1;
        this.task2 = config.task2;
        this.task3 = config.task3;
    }
};
   
module.exports = Vast20expConfig;
   