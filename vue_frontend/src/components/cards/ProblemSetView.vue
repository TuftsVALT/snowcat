<template>
  <div id="problem-set-card">
    <problem-discovery-dialog v-model="discoveryDialogConfig" />
<!--
    <edit-dialog v-model="hasDescribeDialog">
    </edit-dialog>
-->
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
<!--
    <v-dialog v-model="hasDescribeDialog" max-width="70%">
      <v-card>
        <v-card-title class="headline">Modify problem description:</v-card-title>
        <v-textarea
          outline
          v-model="modDescription"
        >
          <div slot="label">
            Problem description
          </div>
        </v-textarea>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat="flat" @click.native="changeProblemDescription(describeDialog, modDescription); describeDialog = -1">OK</v-btn>
          <v-btn color="red darken-1" flat="flat" @click.native="describeDialog = -1">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
-->
    <v-card>
      <v-toolbar flat color="white">
        <v-btn @click="showDiscoveryDialog()" color="primary" dark class="mb-2">Add New Problem</v-btn>
      </v-toolbar>

      <v-data-table
        :headers="headers"
        :items="generatedProblems"
        :rows-per-page-items="[3,5,10,15,20]"
        class="elevation-1"
        disable-initial-sort
      >
        <template slot="headers" slot-scope="props">
          <th class="table-header">Actions</th>
          <th class="table-header" v-for="header in props.headers" :key="header.text">{{ header.text }}</th>
        </template>
        <template slot="items" slot-scope="props">
          <tr v-bind:class="{user: !notUserCreated(props.item)}">
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
            <td class="text-xs">
              <v-tooltip bottom>
                <!--
                <v-btn
                  slot="activator"
                  flat fab dark small
                  color="primary"
                  disable="true"
                  @click="problemInteraction(props.index); describeDialog = props.index">
                -->
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
        { text: 'ID', value: 'problemID', sortable: false },
        {
          text: 'Target Feature',
          align: 'left',
          value: 'TargetFeature',
          sortable: false
        },
        { text: 'Task Type', value: 'TaskType', sortable: false },
        // { text: 'TaskSubType', value: 'taskSubType', sortable: false },
        { text: 'Metric', value: 'Metric', sortable: false },
        { text: 'Features for Prediction', value: 'Predict_Featues', sortable: false },
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Meaningful', value: 'meaningful', sortable: false }
      ],
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
      modDescription: '',
      paginationSteps: [5, 10, 20],
      meaningful_items: ['yes', 'no', 'not sure'],
    }
  },
  computed: {
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
      return this.$store.state.problemDiscovery.generatedProblems;
    }
  },
  methods: {
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
}
</style>
