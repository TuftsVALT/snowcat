<template>
  <div id="problem-set-card">
    <problem-discovery-dialog v-model="discoveryDialogConfig" />

    <v-dialog v-model="hasDeleteDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Delete problem?</v-card-title>
        <v-card-text>Are you sure you want to remove this problem?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat="flat" @click.native="removeGeneratedProblem(deleteDialog); deleteDialog = -1">Yes</v-btn>
          <v-btn color="green darken-1" flat="flat" @click.native="deleteDialog = -1">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card>
      <v-toolbar flat color="white">
        <v-btn @click="showDiscoveryDialog()" color="primary" dark class="mb-2">Add New Problem</v-btn>
        <v-spacer />
        <v-text-field
          append-icon="search"
          label="Search"
          single-line
          hide-details
          v-model="search"
        ></v-text-field>
      </v-toolbar>

      <v-data-table
        :headers="headers"
        :items="generatedProblems"
        :rows-per-page-items="paginationSteps"
        :pagination.sync="pagination"
        class="elevation-1"
        disable-initial-sort
      >
        <template slot="headers" slot-scope="props">
          <th class="table-header">Actions</th>
          <th class="table-header" v-for="header in props.headers" :key="header.text">{{ header.text }}</th>
        </template>
        <template slot="items" slot-scope="props">
          <tr v-bind:class="{ user: !notUserCreated(props.item), darpa: props.item.isDarpa }">
            <td>
              <div class="justify-center layout px-0">
                <v-tooltip bottom>
                  <v-btn
                    slot="activator"
                    :disabled="notUserCreated(props.item)"
                    icon flat fab small color="red"
                    @click="deleteDialog = props.index"
                  >
                    <v-icon>delete</v-icon>
                  </v-btn>
                  <span v-if="props.item.creationType === 'user'">Delete problem.</span>
                  <span v-else>Auto-generated problems cannot be deleted.</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <v-btn
                    slot="activator"
                    icon flat fab small color="primary"
                    @click="copyProblem(props.item.problemID)"
                  >
                    <v-icon>file_copy</v-icon>
                  </v-btn>
                  <span>Copy problem and add to beginning of list.</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <v-btn
                    slot="activator"
                    icon flat fab small color="primary"
                    @click="discoveryDialogConfig.problemID = props.item.problemID; discoveryDialogConfig.active=true;"
                  >
                    <v-icon>edit</v-icon>
                  </v-btn>
                  <span v-if="props.item.creationType === 'user'">Edit problem.</span>
                  <span v-else>Add a copy of this problem as a user-generated one. Then open dialog to edit it.</span>
                </v-tooltip>
              </div>
            </td>
            <td>
              <span>{{ notUserCreated(props.item) ? "auto_" + props.item.problemID : props.item.problemID }}</span>
            </td>
            <td>
              <column-chip :item="props.item.targetFeature" />
            </td>
            <td class="text-xs">
              <type-chip :item="props.item.taskType" />
            </td>
            <td class="text-xs">
              <type-chip :item="props.item.metric" />
            </td>
            <td class="text-xs">
              {{ featureStrings[props.index] }}
            </td>
            <td>
              <!-- <v-btn :disabled="!runable" small @click="open_phase2(props.item)" color="primary" dark class="mb-2">run</v-btn> -->
              <v-switch
                v-model="runProblem"
                label="run"
                :value="notUserCreated(props.item) ? 'auto_' + props.item.problemID : props.item.problemID"
                :disabled="!runable"
                small
                color="primary"
              ></v-switch>
            </td>
            <td class="text-xs">
              <v-tooltip bottom>
                <v-icon slot="activator" :color="has_description(props.item) ? 'primary' : 'gray'">note</v-icon>
                <span v-if="has_description(props.item)">Problem description:<br/>{{props.item.description}}</span>
                <span v-else>Edit problem to add a description.</span>
              </v-tooltip>
            </td>
            <td @click="problemInteraction(props.index)" class="text-xs">
              <v-select
                :items="meaningful_items"
                v-model="props.item.meaningful"
              >
                <template slot="item" slot-scope="data">
                  <span>{{data.item}}</span>
                </template>
                <template slot="selection" slot-scope="data">
                  <v-chip small v-if="data.item==='no'" color="red lighten-1">{{data.item}}</v-chip>
                  <v-chip small v-else-if="data.item==='yes'" color="green lighten-1">{{data.item}}</v-chip>
                  <v-chip small v-else color="yellow darken-1">{{data.item}}</v-chip>
                </template>
              </v-select>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import _ from 'lodash'
import columnChip from '@/components/ColumnChip'
import typeChip from '@/components/TypeChip'
import problemDiscoveryDialog from '@/components/dialogs/ProblemDiscoveryDialog'
import editDialog from '@/components/dialogs/EditDialog'
export default {
  name: 'problem-set-view',
  components: { typeChip, columnChip, editDialog, problemDiscoveryDialog },
  data() {
    return {
      headers: [
        { text: 'ID', value: 'problemID', sortable: true },
        {
          text: 'Target Feature',
          align: 'left',
          value: 'TargetFeature',
          sortable: true
        },
        { text: 'Task Type', value: 'TaskType', sortable: true },
        // { text: 'TaskSubType', value: 'taskSubType', sortable: false },
        { text: 'Metric', value: 'Metric', sortable: true },
        { text: 'Features for Prediction', value: 'Predict_Featues', sortable: false },
        { text: "Build Model", sortable: false },
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Meaningful', value: 'meaningful', sortable: false }
      ],
      search: "",
      pagination: {
        sortBy: "",
      },
      valid: true,
      taskType: null,
      taskSubType: null,
      metric: null,
      targetFeature: null,
      predictFeatures: [],
      deleteDialog: -1,
      describeDialog: -1,
      discoveryDialogConfig: {
        active: false,
        problemID: null,
      },
      runProblem: null,
      modDescription: '',
      paginationSteps: [10, 15, 20],
      meaningful_items: ['yes', 'no', 'not sure'],
    }
  },
  computed: {
    darpaProblem() {
      let p = this.$store.state.socket.rawProblemDesc_orig;
      console.log("DARPA PROBLEM", p);
      if (_.isEmpty(p)) return null;
      let p_new = {
        problemID: p.about.problemID,
        taskType: p.about.taskType,
        subTaskType: p.about.subTaskType,
        targetFeature: p.inputs.data[0].targets[0].colName,
        metric: p.inputs.performanceMetrics[0].metric,
        priority: "default",
        meaningful: "not sure",
        creationType: "auto",
        description: "none",
        predictFeatures: this.allFeatures,
        isDarpa: true,
      };
      console.log("NEW DARPA PROBLEM", p_new);
      // select by default
      this.runProblem = this.notUserCreated(p_new) ? "auto_" + p_new.problemID : p_new.problemID;
      return p_new;
    },
    runable() {
      // are the problems runable; they are not if we are in task 1
      return this.$store.state.meta.task_number !== 1;
    },
    userProblemID() {
      return this.$store.state.problemDiscovery.userProblemID;
    },
    hasDeleteDialog: {
      get: function () {
        return this.deleteDialog >= 0;
      },
      set: function (newValue) {
        this.deleteDialog = -1;
      }
    },
    hasDescribeDialog: {
      get: function () {
        return this.describeDialog >= 0;
      },
      set: function (newValue) {
        this.describeDialog = -1;
      }
    },
    allFeatures() {
      let generatedProblems = this.$store.state.problemDiscovery.generatedProblems;
      let allFeats = new Set();
      for (let i = 0; i < generatedProblems.length; i++) {
        let problem = generatedProblems[i];
        for (let j = 0; j < problem.predictFeatures.length; j++) {
          allFeats.add(problem.predictFeatures[j]);
        }
      }
      return Array.from(allFeats);
    },
    featureStrings() {
      let featureStrings = [];
      for (let i = 0; i < this.generatedProblems.length; i++) {
        let problem = this.generatedProblems[i];
        let featureString = '';
        for (let j = 0; j < problem.predictFeatures.length; j++) {
          let feature = problem.predictFeatures[j];
          featureString += feature;
          if (j < (problem.predictFeatures.length - 1)) {
            featureString += ", ";
          }
        }
        featureStrings.push(featureString);
      }
      return featureStrings;
    },
    generatedProblems() {
      let vueThis = this;
      console.log("problems", this.$store.state.problemDiscovery.generatedProblems);
      let list = this.$store.state.problemDiscovery.generatedProblems.filter(problem => {
        let include = false;
        include = include || problem.targetFeature.toLowerCase().includes(vueThis.search.toLowerCase());
        include = include || problem.taskType.toLowerCase().includes(vueThis.search.toLowerCase());
        include = include || problem.metric.toLowerCase().includes(vueThis.search.toLowerCase());
        return include;
      });
      if (this.darpaProblem && this.$store.state.meta.task_number !== 1) {
        list.unshift(this.darpaProblem);
      }
      return list;
    },
  },
  methods: {
    /*
    open_phase2(problemObject) {
      console.log("problem selected", problemObject);
      console.log("FIXME: write out json for problem");
      this.$store.commit("runProblem", problemObject);
      this.$socket.emit("setproblem", problemObject);
      // window.open("phase2", "_blank");
    },*/
    notUserCreated(problem) {
      if (problem.creationType === "auto") {
        return true;
      } else {
        if (typeof(problem.problemID) === 'number') {
          return true;
        } else {
          return false;
        }
      }
    },
    getProblemId(prob) {
      return this.notUserCreated(prob) ? "auto_" + prob.problemID : prob.problemID;
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
      if (newProblem.creationType === "auto") {
        newProblem.creationType = "mixed";
      }
      newProblem.problemID = "user_" + this.userProblemID;
      this.$store.commit("INCREMENT_USER_PROBLEM_ID");
      this.$store.commit('ADD_GENERATED_PROBLEM', newProblem);
    },
    showDiscoveryDialog(editProblem) {
      if (editProblem) {
        this.discoveryDialogConfig.problemID = editProblem;
      } else {
        this.discoveryDialogConfig.problemID = null;
      }
      this.discoveryDialogConfig.active = true;
    },
    problemInteraction(index) {
      let problem = this.generatedProblems[index];
      let cType = problem.creationType;
      if (cType !== 'user') {
        problem.creationType = 'mixed';
      }
    },
    has_description(problem) {
      let description = problem.description;
      if (!description) {
        return false;
      } else {
        description = description.trim();
        return description !== '';
      }
    },
    removeGeneratedProblem(index) {
      this.$store.commit('REMOVE_GENERATED_PROBLEM', index);
    },
    changeProblemDescription(index, newText) {
      console.log("changeProblemDescription called", index, newText);
      this.$store.commit('CHANGE_PROBLEM_DESCRIPTION', { index: index, description: newText });
    }
  },
  watch: {
    runProblem() {
      console.log("RUN PROBLEM", this.runProblem);
      let vueThis = this;
      let problemObject = null;
      this.generatedProblems.forEach(p => {
        let displayId = this.getProblemId(p);
        if (displayId === vueThis.runProblem) {
          problemObject = p;
        }
      });
      console.log("PROBLEM RUN OBJECT", problemObject);
      if (problemObject) {
        this.$store.commit("runProblem", problemObject);
        this.$socket.emit("setproblem", problemObject);
      }
    },
    pagination() {
      console.log("PAGINATION CHANGED", this.pagination, this.runProblem);
      let runProblem = this.runProblem;
      this.runProblem = null;
      this.$nextTick(() => this.runProblem = runProblem);
    },
    hasDescribeDialog() {
      console.log("hasDescribeDialog", this.hasDescribeDialog);
    },
    describeDialog() {
      if (this.describeDialog < 0) {
        this.modDescription = '';
      } else {
        this.modDescription = this.generatedProblems[this.describeDialog].description;
        console.log("MOD DESCRIPTION", this.modDescription);
      }
    }
  }
}
</script>

<style lang="scss">
#problem-set-card {
  .table-header {
    font-weight: bold;
  }
  tr.user {
    background: #E0F2F1;
  }
  tr.darpa {
    background: #b7e69e;
  }
}
</style>
