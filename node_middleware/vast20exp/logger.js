const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const TASK1_TARGET_ATTRS = [
    'County - area',
    'State - population (any)',
    'County - shares border with (min) - inception (value)'
];
const TASK2_TARGET_ATTRS = [
    'director_name - country of citizenship',
    'director_name - award received (count)',
    'movie_title - cast member (count)',
    'movie_title - producer (sum) - award received (count)'
];
class Logger {
    constructor(participantId, verbose=false) {
        this.startTime = new Date();
        this.logPath = "./vast20exp/participant_data/" + this.startTime.getMilliseconds() + '_' + participantId + ".json";
        this.logPath = path.resolve(this.logPath);
        this.taskLogs = {
            'task1': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task2': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task3': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task4': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task5': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task6': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
            'task7': {
                'results': {},
                'attributeClicks': [],
                'getRelatedAttributesRequests': [],
                'columnsAdded': [],
                'modelMetrics': []
            },
        }
        this.currentTaskNum = 1;
        this.currentTask = "task1";
    }

    writeToFile() {
        console.log("writing log out to ", this.logPath)
        this.calculatePerformanceVast20Exp();
        console.log("performance on task1: ", this.taskLogs.task1['performance'])
        console.log("performance on task2: ", this.taskLogs.task2['performance'])
        console.log("performance on task3: ", this.taskLogs.task3['performance'])
        fs.writeFileSync(this.logPath, JSON.stringify(this.taskLogs));
    }

    incrementTask() {
        this.currentTaskNum += 1;
        this.currentTask = "task" + this.currentTaskNum;
    }

    addAttributeClick(attributeClick) {
        this.taskLogs[this.currentTask]['attributeClicks'].push(attributeClick);
    }

    addGetRelatedAttributesRequest(getRelatedAttributesRequest) {
        this.taskLogs[this.currentTask]['getRelatedAttributesRequests'].push(getRelatedAttributesRequest);
    }

    addColumnAdded(columnAdded) {
        this.taskLogs[this.currentTask]['columnsAdded'].push(columnAdded);
    }

    addModelMetrics(modelMetric) {
        console.log('lets check current tasks id ', this.currentTask)
        this.taskLogs[this.currentTask]['modelMetrics'].push(modelMetric);
    }

    calculatePerformanceVast20Exp() {
        // task0
        this.calculateTask1Performance();

        // task1
        this.calculateTask2Performance();

        // task2
        this.calculateTask3Performance();
    }

    calculateTask1Performance() {
        let performance = {};
        performance['numAttributeClicks'] = this.taskLogs.task1.attributeClicks.length;
        performance['numColumnsAdded'] = this.taskLogs.task1.columnsAdded.length;
        performance['numGetRelatedAttributesRequests'] = this.taskLogs.task1.getRelatedAttributesRequests.length;

        const numColumnsAdded = this.taskLogs.task1.columnsAdded.length;
        const numRequiredColumns = TASK1_TARGET_ATTRS.length;
        let numCorrectColumns = 0;
        TASK1_TARGET_ATTRS.forEach((a) => {
            if (this.taskLogs.task1.columnsAdded.map((a) => a.columnName).indexOf(a) != -1) {
                numCorrectColumns += 1;
            }
        })
        performance['accuracy'] = numCorrectColumns / numRequiredColumns;
        performance['precision'] = numCorrectColumns / numColumnsAdded;
        this.taskLogs.task1['performance'] = performance;
    }

    calculateTask2Performance() {
        let performance = {};
        performance['numAttributeClicks'] = this.taskLogs.task2.attributeClicks.length;
        performance['numColumnsAdded'] = this.taskLogs.task2.columnsAdded.length;
        performance['numGetRelatedAttributesRequests'] = this.taskLogs.task2.getRelatedAttributesRequests.length;

        const numColumnsAdded = this.taskLogs.task2.columnsAdded.length;
        const numRequiredColumns = TASK2_TARGET_ATTRS.length;
        let numCorrectColumns = 0;
        TASK2_TARGET_ATTRS.forEach((a) => {
            if (this.taskLogs.task2.columnsAdded.map((a) => a.columnName).indexOf(a) != -1) {
                numCorrectColumns += 1;
            }
        })

        performance['accuracy'] = numCorrectColumns / numRequiredColumns;
        performance['precision'] = numCorrectColumns / numColumnsAdded;
        this.taskLogs.task2['performance'] = performance;        
    }

    calculateTask3Performance() {
        let performance = {};
        performance['numAttributeClicks'] = this.taskLogs.task3.attributeClicks.length;
        performance['numColumnsAdded'] = this.taskLogs.task3.columnsAdded.length;
        performance['numGetRelatedAttributesRequests'] = this.taskLogs.task3.getRelatedAttributesRequests.length;
        performance['numModels'] = this.taskLogs.task3.modelMetrics.length;
        performance['initialModelScore'] = this.taskLogs.task3.modelMetrics[0] && this.taskLogs.task3.modelMetrics[0].modelMetrics.acc_test;
        console.log("max of ", this.taskLogs.task3.modelMetrics.map((m) => (m && m.modelMetrics && m.modelMetrics.acc_test) || 0.0));
        let bestModel = _.maxBy(this.taskLogs.task3.modelMetrics, (m) => (parseFloat(m && m.modelMetrics && m.modelMetrics.acc_test)) || 0.0);
        console.log("bestModel is ", bestModel)
        performance['bestModelScore'] = bestModel && bestModel.modelMetrics && bestModel.modelMetrics.acc_test;
        this.taskLogs.task3['performance'] = performance;
    }

}

module.exports = Logger;

// - Participant ID
// - Participant Start
// - within each Task document
//     - LoggedEvents
//         - Clicks on attributes
//         - Related attributes calls
//         - Column Added
// - Task 1
//     - Columns added
//         - Parent col
//         - col name
//         - Pct Joinable
//         - Timestamp
//         - Time elapsed
//     - Trial Results
//         - Accuracy
//         - Precision
//         - Recall
//         - Time to complete all tasks
//         - Tasks
//             - Completed
//             - Time completed
// - Task 2
//     - Columns added
//         - Parent col
//         - col name
//         - Pct Joinable
//         - Timestamp
//         - Time elapsed
//     - Models run
//         - Metrics
//         - Timestamp when clicked
//         - Time it took to run model
//         - Attribute Weights
//         - File path for current dataset
//     - Trial Results
//         - Final list of attributes
//         - Final attribute weights
//         - R2
//         - Time to complete
//         - Models
//             - R2
//             - Time completed
