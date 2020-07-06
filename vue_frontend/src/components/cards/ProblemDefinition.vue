<template>
  <div id="problem-defintion-card" v-if="readyToLoad">
    <v-card-title primary-title>
      <div class="headline">{{problemName}}</div>
      <div class="problem-subtitle" v-html="problemSubtitle"></div>
    </v-card-title>

    <v-list subheader>
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title>Task Type</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <type-chip :item="taskType"></type-chip>
        </v-list-tile-action>
      </v-list-tile>
      <v-list-tile v-if="taskSubtype">
        <v-list-tile-content>
          <v-list-tile-title>Task Subtype</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <type-chip :item="taskSubtype"></type-chip>
        </v-list-tile-action>
      </v-list-tile>
      <v-divider />
      <div v-for="targetColumn in targetColumns" v-if="targetColumns && targetColumns.length !== 0">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>Target Variable</v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <column-chip :item="targetColumn"></column-chip>
          </v-list-tile-action>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>Target Type</v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <type-chip :item="getColType(targetColumn)"></type-chip>
          </v-list-tile-action>
        </v-list-tile>
      </div>
      <v-divider />
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title>Performance Metric</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <type-chip :item="performanceMetric"></type-chip>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script>
import _ from 'lodash'
import marked from 'marked'
import typeChip from '@/components/TypeChip'
import columnChip from '@/components/ColumnChip'
export default {
  name: 'problem-definition',
  components: { typeChip, columnChip },
  data: function () {
    return {
    }
  },
  computed: {
    readyToLoad() {
      return !!(this.$store.state.socket.rawProblemDesc && this.$store.state.socket.rawProblemDesc.about)
    },
    problemName () {
      return this.$store.state.socket.rawProblemDesc.about.problemName
    },
    problemSubtitle () {
      if (this.$store.state.socket.rawProblemDesc.about.problemDescription) {
        return marked(this.$store.state.socket.rawProblemDesc.about.problemDescription, { breaks: true, anchorTargetBlank: true })
      } else {
        return " ";
      }
    },
    taskType () {
      return this.$store.state.socket.rawProblemDesc.about.taskKeywords && this.$store.state.socket.rawProblemDesc.about.taskKeywords[0]
    },
    taskSubtype () {
      return this.$store.state.socket.rawProblemDesc.about.taskKeywords && this.$store.state.socket.rawProblemDesc.about.taskKeywords[1]
    },
    targetColumns () {
      return this.$store.state.socket.targetColumns
    },
    targetVariable () {
      if (this.targetColsInformation(this.$store.state.socket.targetColumns)) {
        return marked(this.targetColsInformation(this.$store.state.socket.targetColumns), { breaks: true, anchorTargetBlank: true });
      } else {
        return " ";
      }
    },
    performanceMetric () {
      return this.performanceMetricsInformation(this.$store.state.socket.performanceMetrics)
    },
    problem_items () {
      if (this.$store.state.socket.rawProblemDesc.about) {
        // Can choose different icons at
        // https://material.io/icons/
        return [
          { icon: 'label', iconClass: 'grey lighten-1 white--text', title: 'Task Type', subtitle: this.$store.state.socket.rawProblemDesc.about.taskType, tooltip: this.taskTypeHelp(this.$store.state.socket.rawProblemDesc.about.taskType) },
          { icon: 'label', iconClass: 'grey lighten-1 white--text', title: 'Task Subtype', subtitle: this.$store.state.socket.rawProblemDesc.about.taskSubType, tooltip: this.taskSubTypeHelp(this.$store.state.socket.rawProblemDesc.about.taskSubType) },
          { icon: 'label', iconClass: 'grey lighten-1 white--text', title: 'Target Variable', subtitle: marked(this.targetColsInformation(this.$store.state.socket.targetColumns) ? this.targetColsInformation(this.$store.state.socket.targetColumns) : " ", { breaks: true, anchorTargetBlank: true }) },
          { icon: 'label', iconClass: 'grey lighten-1 white--text', title: 'Performance Metric', subtitle: this.performanceMetricsInformation(this.$store.state.socket.performanceMetrics), tooltip: this.performanceMetricsHelp(this.$store.state.socket.performanceMetrics) }
        ]
      } else {
        return []
      }
    }
  },
  methods: {
    getColType (colName) {
      return this.$store.state.socket.rawDataTypes[colName]
    },
    targetColsInformation: function (colNames) {
      // TODO - get line breaks
      var colString, colType
      return _.join(_.map(colNames, (colName) => {
        colString = '**' + colName + '**\n'
        colType = this.$store.state.socket.rawDataTypes[colName]
        colString += 'Target Type: ' + colType
        // add more information depending on column type
        if (colType == 'categorical') {
          colString += '\nPossible values: '
          colString += this.$store.getters.categoricalValues(colName)
        } else if (colType == 'integer' || colType == 'real') {
          colString += '\nRange of values: '
          colString += '(' + this.$store.getters.minValue(colName) + ', ' + this.$store.getters.maxValue(colName) + ')'
        }
        return colString
      }), '\n')
    },
    performanceMetricsInformation: function (metrics) {
      return _.join(metrics, ', ')
    },
    performanceMetricsHelp: function (metrics) {
      return _.join(_.map(metrics, (metric) => {
        return this.metricHelp(metric)
      }), '  ')
    },
    taskTypeHelp: function (taskType) {
      // At some future point, we may want a more intelligent construction of help text
      // For now, we just read from a hash
      const taskTypeHelpHash = {
        'classification': 'For a classification task, your goal is to find a model that predicts the class, or category, of the target column, listed below, using all other columns in the dataset.',
        'regression': 'For a regression task, your goal is to find a model that predicts a numerical value for the target column, listed below, using all other columns in the dataset.',
        'clustering': 'For a clustering task, your goal is to find a model that groups the data in some way into clusters.  This task is not supported by any visualizations in this system.',
        'linkPrediction': 'For a linkPrediction task, your goal is to find a model that predicts whether an unseen link, or edge, between two nodes in a graph exists or not.',
        'vertexNomination': "For a vertexNomination task, your goal is to find a model that predicts a particular vertex within a graph that is deemed to be 'interesting' in the context of the dataset.  This task may not be supported by any visualizations in this system.",
        'communityDetection': 'For a communityDetection task, your goal is to find a model that detects communities within a network of entities.  This task may not be supported by any visualizations in this system.',
        'graphMatching': 'For a graphMatching task, your goal is to find a model that determines if two vertices in similar graphs refer to the same entity.  One use might be to determine if two accounts on different social media platforms refer to the same person.',
        'timeSeriesForecasting': 'For a timeSeriesForecasting task, your goal is to find a model that predicts future values for a variable that varies with time, such as temperature or a stock price.  ',
        'collaborativeFiltering': "For a collaborativeFiltering task, your goal is to find a model that is able to predict ratings for particular items given other users' ratings of those items."
      }

      return taskTypeHelpHash[taskType]
    },
    metricHelp: function (metric) {
      const metricHelpHash = {
        'Accuracy': 'Accuracy is a number between 0 and 1 that describes what portion of the given labeled training examples were predicted to be the correct value by the model.',
        'F1': 'f1 is a measure of the accuracy of a model solving binary classification.  It weighs both the precision and recall of a model by balancing between false positives and false negatives.  ',
        'F1Micro': 'f1 is a measure of the accuracy of a model solving binary classification.  It weighs both the precision and recall of a model by balancing between false positives and false negatives.  f1Micro is an adaptation of f1 score to multiple classes, and weighs any misclassification as a false positive.  It values global performance of a model, but may sacrifice performance on classes with few examples.',
        'F1Macro': 'f1 is a measure of the accuracy of a model solving binary classification.  It weighs both the precision and recall of a model by balancing between false positives and false negatives.  f1Macro is an adaptation of f1 score to multiple classes, and averages the metrics for each individual class.  It attempts to measure accuracy in all classes, regardless of class imbalance.',
        'RocAuc': 'rocAuc, or Receiver Operating Characteristic Area Under the Curve, is a measure of the accuracy of a model solving binary classification.  It weights both the precision and recall of a model by balancing between false positives and false negatives, and attempts to measure performance at all possible values of false positives against false negatives.',
        'RocAucMicro': 'rocAuc, or Receiver Operating Characteristic Area Under the Curve, is a measure of the accuracy of a model solving binary classification.  It weights both the precision and recall of a model by balancing between false positives and false negatives, and attempts to measure performance at all possible values of false positives against false negatives.  rocAucMicro is an adaptation of rocAuc to multiple classes, and weighs any misclassification as a false positive.  It values global performance of a model, but may sacrifice performance on classes with few examples.',
        'RocAucMacro': 'rocAuc, or Receiver Operating Characteristic Area Under the Curve, is a measure of the accuracy of a model solving binary classification.  It weights both the precision and recall of a model by balancing between false positives and false negatives, and attempts to measure performance at all possible values of false positives against false negatives.  rocAucMacro is an adaptation of rocAuc score to multiple classes, and averages the metrics for each individual class.  It attempts to measure accuracy in all classes, regardless of class imbalance.',
        'meanSquaredError': 'A frequently used measure of the differences between values predicted by a model and the values actually observed.  The average of the square of the difference between the true value and the value predicted by regression.',
        'rootMeanSquaredError': 'A frequently used measure of the differences between values predicted by a model and the values actually observed.  The square root of the average of the square of the difference between the true value and the value predicted by regression.',
        'rootMeanSquaredErrorAvg': 'rootMeanSquaredError (RMSE) is a frequently used measure of the differences between values predicted by a model and the values actually observed.  rootMeanSquaredErrorAvg is the average of RMSE across multiple target variables.',
        'meanAbsoluteError': 'A frequently used measure of the differences between values predicted by a model and the values actually observed.  An average of the differences across each data point in the training data set.',
        'rSquared': 'A statistical measure of how close the data are to a fitted regression curve.',
        'normalizedMutualInformation': 'A frequently used measure of unsupervised learning models such as clustering or community detection.  Measures the similarity between the clustering found by the model and the true clustering.',
        'jaccardSimilarityScore': 'A statistical measure of the differences between sets predicted by a model and the actual sets observed in ground truth.  Measures intersection between predicted sets and ground truth sets.',
        'precisionAtTopK': 'precisionAtTopK is a measure of the performance of a multi-label classification model.  It examines the first K entries of the ground truth and the predicted labels and determines how many values are shared between them.'
      }

      return metricHelpHash[metric]
    },
    taskSubTypeHelp: function (taskSubType) {
      // At some future point, we may want a more intelligent construction of help text
      // For now, we just read from a hash
      const taskSubTypeHelpHash = {
        'multiClass': 'The target column has more than 2 possible classes.',
        'binary': 'The target column has exactly 2 possible values.',
        'multiLabel': 'The target column can be assigned multiple values for a single row of the dataset, such as tags for a youtube video.',
        'univariate': 'There is one target variable for the regression to fit.',
        'multivariate': 'There are multiple target variables for the regression to fit.',
        'overlapping': 'Items are allowed to belong to 2 or more clusters.',
        'nonOverlapping': 'Items are required to belong to exactly one cluster.'
      }

      return taskSubTypeHelpHash[taskSubType]
    }
  }
}
</script>

<style lang="scss">
#problem-defintion-card {
  .headline {
    overflow: auto;
  }
  .list--three-line .list__tile {
    min-height: 100px;
  }
  .list__tile__sub-title {
    overflow: visible;
  }
  .list__tile__action {
    .avatar, .icon {
      min-width: 0;
      justify-content: center;
    }
  }
  .list--three-line .list__tile__sub-title {
    -webkit-line-clamp: inherit;
  }

  .tooltip {
    opacity: inherit;
  }
  .problem-subtitle {
    text-align: left;
    ul, ol, dl {
      margin-left: 16px;
    }
    p:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
