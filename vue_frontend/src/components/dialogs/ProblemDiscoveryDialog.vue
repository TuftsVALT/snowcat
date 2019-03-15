<template>
  <v-dialog v-model="value.active" max-width="90%">
    <v-card id="problem-discovery-dialog">
      <v-card-title v-if="value.problemID" class="headline">Edit problem {{value.problemID}}:</v-card-title>
      <v-card-title v-else class="headline">Create new problem:</v-card-title>
      <v-form class="generator mx-4">
        <span class="prompt">I want to predict</span>
        <v-select
          v-bind:items="featuresList"
          v-model="targetFeature"
          label="Target Feature"
          single-line
          bottom
          required
          :rules="[v => !!v || 'Target Field is required']"
        >
          <template slot="item" slot-scope="data">
            <column-chip :item="data.item" />
          </template>
          <template slot="selection" slot-scope="data">
            <column-chip :item="data.item" />
          </template>
        </v-select>
        <span class="prompt">from the following feature(s):</span>
        <v-autocomplete
          clearable
          deletable-chips:true
          label="Prediction Feature(s)"
          v-bind:items="predictFeaturesList"
          v-model="predictFeatures"
          multiple
          chips
          content-class="problem-discovery-features-list"
        >
          <template slot="selection" slot-scope="data">
             <v-chip
              :selected="data.selected"
              close
              small
              text-color="white"
              color="blue"
              @input="data.parent.selectItem(data.item)"
            >
              {{ data.item }}
            </v-chip>
          </template>
        </v-autocomplete>
        <span class="prompt">using a</span>
        <v-select
          v-bind:items="taskTypes"
          v-model="taskType"
          label="Model"
          single-line
          bottom
          required
          :rules="[v => !!v || 'Prediction Type is required']"
        >
          <template slot="item" slot-scope="data">
            <type-chip :item="data.item" :tooltip="false" />
          </template>
          <template slot="selection" slot-scope="data">
            <type-chip :item="data.item" />
          </template>
        </v-select>

        <span class="prompt">model with the best</span>

        <v-select
          v-bind:items="metricTypes"
          v-model="metric"
          label="Metric"
          single-line
          bottom
          required
          :rules="[v => !!v || 'Target Metric is required']"
        >
          <template slot="item" slot-scope="data">
            <type-chip :item="data.item" :tooltip="false" />
          </template>
          <template slot="selection" slot-scope="data">
            <type-chip :item="data.item" />
          </template>
        </v-select>

        <div class="prompt">metric.<br/><br/></div>
        <div class="prompt">The problem can be described as follows:</div>

        <v-textarea
          outline
          v-model="description"
        >
          <div slot="label">
            Problem description <small>(optional but recommended; can be changed later)</small>
          </div>
        </v-textarea>

        <v-btn v-if="value.problemID" @click="updateProblem(); cancel();" :disabled="!valid" color="primary">Update Problem</v-btn>
        <v-btn v-else @click="generateProblem(); cancel();" :disabled="!valid" color="primary">Save Problem</v-btn>
        <v-btn color="red darken-1" flat="flat" @click.native="cancel()">Cancel</v-btn>

      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import _ from 'lodash'
import columnChip from '@/components/ColumnChip'
import typeChip from '@/components/TypeChip'
export default {
  name: 'problem-discovery-dialog',
  components: {typeChip, columnChip},
  props: {
    value: Object,
    // expected values:
    // value.active: Boolean; dialog is visible
    // value.problemID: String; 'null': create new problem; not 'null' modify problem
  },
  data() {
    return {
      headers: [
        {
          text: 'Target Feature',
          align: 'left',
          value: 'TargetFeature',
          sortable: false
        },
        { text: 'TaskType', value: 'TaskType', sortable: false },
        // { text: 'TaskSubType', value: 'taskSubType', sortable: false },
        { text: 'Metric', value: 'Metric', sortable: false },
        { text: 'Predict_Features', value: 'Predict_Featues', sortable: false }
      ],
      taskType: null,
      // taskSubType: null,
      metric: null,
      targetFeature: null,
      predictFeatures: [],
      description: '',
    }
  },
  computed: {
    userProblemID() {
      return this.$store.state.problemDiscovery.userProblemID;
    },
    hasDialog: {
      get: function () {
        return this.dialog !== 0;
      },
      set: function (newValue) {
        this.dialog = 0;
      }
    },
    valid() {
      return this.taskType && this.metric && this.targetFeature && this.predictFeatures.length > 0;
    },
    taskTypes() {
      var types = []
      // Need to get the feature type
      var dataResource = _.find(this.$store.state.socket.rawDataDesc.dataResources, (res) => { return res.resType === 'table' })
      var column = _.find(dataResource.columns, (col) => { return col.colName === this.targetFeature })
      if (column) {
        types = this.$store.getters.taskTypes(column.colType, this.$store.state.socket.rawDataDesc);
      }
      // If only one task type, let's automatically select it
      if (types.length === 1) {
        this.taskType = types[0];
      }
      return types;
    },
    metricTypes() {
      var metrics = this.$store.getters.metricTypes(this.taskType);
      // If only one metric available, let's automatically select it
      if (metrics.length === 1) {
        this.metricType = metrics[0];
      }
      return metrics;
    },
    selected() {
      return this.$store.state.problemDiscovery.selected;
    },
    generatedProblems() {
      return this.$store.state.problemDiscovery.generatedProblems;
    },
    featuresList() {
      var nameList = []
      if (this.$store.state.socket.tabularProcessedData.histogramMetaDataArray.length > 0) {
        for (var i = 0; i < this.$store.state.socket.tabularProcessedData.histogramMetaDataArray.length; i++) {
          if (!(this.$store.state.socket.tabularProcessedData.histogramMetaDataArray[i][0] === 'd3mIndex' ||
                this.$store.state.socket.tabularProcessedData.histogramMetaDataArray[i][1] === 'string')) {
            nameList[i] = this.$store.state.socket.tabularProcessedData.histogramMetaDataArray[i][0]
          }
        }
      }
      //BUG: filter is necessary, becauce nameList can contain null values that crash vuetify
      return nameList.filter(d => d);
    },
    predictFeaturesList() {
      return _.reject(this.featuresList, (feature) => { return (!feature || feature === this.targetFeature); });
    }
  },
  methods: {
    updateProblem() {
      let problemID = this.value.problemID;
      console.log("update problem", problemID);
      let newProblem = this.copyProblem(problemID);
      newProblem.taskType = this.taskType;
      newProblem.metric = this.metric;
      newProblem.targetFeature = this.targetFeature;
      newProblem.predictFeatures = this.predictFeatures;
      newProblem.description = this.description;
      if (newProblem.creationType === "auto") {
        newProblem.creationType = "mixed";
      }
      this.$store.commit('UPDATE_PROBLEM', newProblem);
    },
    readInProblem(problemID) {
      console.log("reading in problem", problemID);
      let problem = this.findProblemById(problemID);
      this.taskType = problem.taskType;
      this.metric = problem.metric;
      this.targetFeature = problem.targetFeature;
      this.predictFeatures = problem.predictFeatures;
      this.description = problem.description;
    },
    findProblemById(problemID) {
      let id = problemID;
      if (!(""+problemID).startsWith("user_")) {
        id = parseInt(problemID);
      }
      for (let i = 0; i < this.generatedProblems.length; i++) {
        if (this.generatedProblems[i].problemID === id) {
          return this.generatedProblems[i];
        }
      }
      // we did not find anything
      return null;
    },
    copyProblem(problemID) {
      let problem = this.findProblemById(problemID);
      let newProblem = Object.assign({ }, problem);
      return newProblem;
    },
    cancel() {
      this.$emit("input", { active: false, problemID: null });
    },
    renderConfirmation: function (index) {
      this.dialog = index + 1
    },
    readableFeatures: function (features) {
      return _.join(features, ', ')
    },
    removeGeneratedProblem: function (index) {
      this.$store.commit('REMOVE_GENERATED_PROBLEM', index)
    },
    generateProblem: function () {
      this.$store.commit('ADD_GENERATED_PROBLEM',
        {
          taskType: this.taskType,
          taskSubType: this.taskSubType,
          metric: this.metric,
          targetFeature: this.targetFeature,
          predictFeatures: this.predictFeatures,
          description: this.description,
          meaningful: 'yes',
          creationType: 'user',
          problemID: 'user_' + (this.userProblemID),
        }
      );
      this.$store.commit("INCREMENT_USER_PROBLEM_ID");
      // this.$store.commit("updateInfoMessage", "Thanks, you have successfully generated your first problem!");
      // this.taskType = null
      this.taskSubType = null
      // this.metric = null
      // this.targetFeature = null
      this.predictFeatures = []
    }
  },
  watch: {
    value: {
      handler: function() {
        if (!this.value.active) return;
        console.log("VALUE", this.value);
        if (this.value.problemID) {
          let stringProblemID = "" + this.value.problemID;
          console.log("EDIT PROBLEM");
          this.readInProblem(stringProblemID);
        } else {
          this.taskType = null;
          this.metric = null;
          this.targetFeature = null;
          this.predictFeatures = [];
          this.description = '';
        }
      },
      deep: true,
    },
    targetFeature: function (newFeature) {
      if (newFeature) {
        this.predictFeatures = this.predictFeaturesList
      }
    },
    taskType: function (type) {
      // Need to guess at the taskSubtype here:
      var subtypeMappings = {
        'classification': 'multiClass',
        'regression': 'univariate',
        'clustering': 'nonOverlapping',
        'communityDetection': 'nonOverlapping'
      }
      this.taskSubType = subtypeMappings[type]
    }
  }
}
</script>

<style lang="scss">
#problem-discovery-dialog {
  .problem-discovery-features-list {
    max-height: 800px;
  }
  td {
    vertical-align: middle;
    padding: 0 6px;
  }
  th {
    text-align: center;
  }
  .generator {
    text-align: left;
    .prompt {
      font-size: 1.5em;
      font-weight: bold;
    }
  }
}
.menu__content {
  .list__tile .avatar {
    min-width: 0;
  }
}
.elevation{
  border: 1px solid #c5cddb;
  margin-top:10px;
}
table.table tbody td{
  font-size:16px
}
.chip, .chip .chip_content {
  font-size:13px
}
table.table thead th {
  font-size:13px
}
.title{
  margin-bottom:0;
  font-weight:bold;
  font-size:15px
}
</style>
