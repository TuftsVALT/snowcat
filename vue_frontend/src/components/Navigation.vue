<template>
  <v-navigation-drawer
    absolute
    permanent
    fixed
    light
    :mini-variant="mini"
    mini-variant-width="74"
    width="360"
    app
    class="the-drawer"
  >
    <v-toolbar flat class="nav-toolbar">
      <v-spacer></v-spacer>
      <v-btn icon pt-0 @click.native.stop="mini = !mini" class="expand-collapse">
        <v-icon>{{mini ? 'chevron_right' : 'chevron_left'}}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-spacer></v-spacer>
    <v-container class="tasks-prompt" v-if="hasTasksPrompt">
      {{tasksPrompt}}
    </v-container>
    <v-stepper
      flat
      v-model="currentPhase"
      vertical
      non-linear
      @click.stop="mini = false"
      class="nav-content"
    >
      <template v-for="(phase, index) in phases">
        <v-stepper-step
          flat
          :v-model="currentPhase"
          :key="'step-title-' + index"
          :step="index + 1"
          :complete="currentPhase > index"
          :class="{ 'phase-visited': index + 1 <= highestPhase }"
          :editable="editable(phase)"
        >
          <span v-show="!mini">{{phase.name}}</span>
          <!-- <small
            v-if="index + 1 === 3"
            v-show="!mini"
          >{{highestPhase <= 3 ? 'Default' : 'Selected' }}: {{selectedMetric}}</small>
          <small
            v-if="index + 1 === 4"
            v-show="!mini"
          >{{highestPhase <= 4 ? 'Default' : 'Selected' }}: {{ models[selectedModel] ? models[selectedModel].name : 'none' }}</small> -->
        </v-stepper-step>
        <v-stepper-content :key="'step-content-' + index" :step="index + 1" v-show="!mini">
          <template v-if="phase.markdownText">
            <p class="tasks_markdowntext" v-html="translateMarkdown(phase.markdownText)"></p>
          </template>
          <template v-else>
            <p>{{phase.text}}</p>
          </template>
          <!-- <v-tooltip bottom v-if="index === 1">
            <template v-slot:activator="{ on }">
              <p v-on="on">selected problem: {{ problemText }}</p>
            </template>
            <span>Select a problem to run with the switch in the "Build Model" column of the Problem Set View.</span>
          </v-tooltip> -->
          <!-- <v-btn
            v-if="!problemDiscoveryTask && index + 1 === 1 && backendProgress === 0"
            color="primary"
            :disabled="!ta2Available && !problemDiscoveryTask"
            @click.stop="startBackends"
          >
            <v-progress-circular
              v-if="!ta2Available && !problemDiscoveryTask"
              indeterminate
              v-bind:size="15"
              color="primary"
            ></v-progress-circular>
            <span v-if="!ta2Available && !problemDiscoveryTask">&nbsp; &nbsp;</span>
            {{phaseTransitionText(index, backendProgress) }}
          </v-btn> -->
          <v-progress-linear
            :indeterminate="true"
            v-if="index + 1 === 3 && backendProgress < 100 && !problemDiscoveryTask"
            v-model="backendProgress"
          ></v-progress-linear>
          <div v-if="index + 1 === 4">
            <!-- <v-select
              v-bind:items="models"
              v-model="getSelectedModel"
              item-text="name"
              item-value="value"
              label="Select Model"
              single-line
              bottombottom
              class="model-select"
            ></v-select>
            <v-btn
              color="primary"
              @click.stop="nextPhase"
              :disabled="getSelectedModel<0"
            >Select Model</v-btn> -->
          </div>
          <!-- <v-btn
            v-if="index + 1 === 5"
            color="primary"
            @click.stop="createExecutable"
          >Create Executable</v-btn> -->
          <!-- <v-btn
            color="primary"
            @click.stop="nextPhase()"
            v-if="index <= 2"
            :disabled="buttonLogic"
          >
            continue
          </v-btn>
          <v-btn
            v-if="problemDiscoveryTask && index + 1 === 2"
            color="primary"
            @click.stop="submitDiscoveredProblems"
          >Submit Discovered Problems</v-btn> -->
          <v-btn
            color="primary"
            @click.stop="nextPhase()"
            v-if="index <= 2"
            :disabled="buttonLogic"
          >
            complete task
          </v-btn>
        </v-stepper-content>
      </template>
    </v-stepper>

    <v-spacer />
    <v-spacer />



    <v-list subheader style="margin-top:1cm;">
      <h2>Sessions
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon color="primary" v-on="on">help</v-icon>
          </template>
          <p>This list contains all sessions (combinations of data set with a problem definition) for which models have been generated. The currently active session (<v-icon>play_circle_outline</v-icon>) can be changed by either activating an inactive one (<v-icon>pause_circle_outline</v-icon>) through clicking on it, or by switching out dataset of proboem configuration and generating a new session with new models.</p>
        </v-tooltip>
      </h2>

      <v-list-tile
        v-for="herald in heralds"
        :key="herald.heraldIdSelected"
        @click="activateHerald(herald.heraldIdSelected)"
      >
        <v-list-tile-avatar>
          <span>{{ herald.heraldIdSelected }}</span>
        </v-list-tile-avatar>

        <v-tooltip bottom color="rgba(200, 200, 200, 1.)">
          <template v-slot:activator="{ on }">
            <v-list-tile-content>
              <v-list-tile-title v-html="herald.datasetSelected + ' | ' + problemName(herald.problemSelected)" v-on="on"></v-list-tile-title>
            </v-list-tile-content>
          </template>
          <span>
            <tr>
            <td>
              <span>{{ problemName(herald.problemSelected) }}</span>
            </td>
            <td>
              <column-chip :item="herald.problemTargetFeature" />
            </td>
            <td class="text-xs">
              <type-chip :item="herald.problemTaskType" />
            </td>
            <td class="text-xs">
              <type-chip :item="herald.problemMetric" />
            </td>
          </tr></span>
        </v-tooltip>

        <v-list-tile-action>
          <v-icon v-if="herald.heraldIdSelected === latestHeraldRead" color="teal">play_circle_outline</v-icon>
          <v-icon v-else color="gray">pause_circle_outline</v-icon> 
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
    <!-- <v-dialog v-model="voderDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary" fixed>
          <v-btn icon dark @click.native="close()" @click.stop="mini = !mini">
            <v-icon>close</v-icon>
          </v-btn>
          <v-toolbar-title>Voder Data Facts</v-toolbar-title>
        </v-toolbar>
        <voder v-if="voderDialog" />
      </v-card>
    </v-dialog> -->
  </v-navigation-drawer>
</template>

<script>
import columnChip from '@/components/ColumnChip';
import typeChip from '@/components/TypeChip';
// import Voder from "@/components/Voder";
import _ from "lodash";
import marked from 'marked'

export default {
  name: "navigation",
  components: {
    // Voder, columnChip, typeChip
    columnChip, typeChip
  },
  beforeDestroy() {
    // clearInterval(this.interval)
  },
  mounted(){
    d3.selectAll(".tasks_markdowntext li").insert("div",":first-child") 
    let seldiv = d3.selectAll(".tasks_markdowntext li div")
    seldiv.html("<input type='checkbox' />")
    // seldiv.attr('class', 'ui checkbox')
    // let selcheck = d3.selectAll(".tasks_markdowntext li div input")
    // selcheck.attr('class', 'form-check-input')
  },
  sockets: {
    backendFinished: function() {
      this.backendProgress = 100;
    }
  },
  methods: {
    translateMarkdown(s) {
      return marked(s);
    },
    problemName(b) {
      if (typeof(b) === "number") {
        return "auto_" + b;
      }
      return b;
    },
    activateHerald(id) {
      this.$store.dispatch("readHerald", id);
    },
    editable(phase) {
      if (phase.workspace === 0) return true;
      if (phase.workspace === 1 && !_.isEmpty(this.$store.state.socket.rawDataDesc)) return true;
      return false;
    },
    close() {
      this.voderDialog = false;
      this.$store.commit("setUserVariable", "");
    },
    reset() {
      this.highestPhase = 1;
      this.mini = false;
      this.invites = [];
      this.backendProgress = 0;
      this.metrics = ["accuracy", "sensitivity", "specificity", "matthews"];
      this.selectedMetric = "accuracy";
    },
    phaseTransitionText(index, backendProgress) {
      return "confirm";
      /*
      if ( this.$store.state.meta.task_number == 1) {
        if ( index + 1 === 1) {
          return "Next Step"
        }
      } else {
        if ( index + 1 === 1 && backendProgress === 0 ) {
          if (this.ta2Available) {
            return "Start Backends"
          } else {
            return "Loading Backends ..."
          }
        } else if ( index + 1 === 1 && backendProgress === 100 ) {
          return "Restart Backends"
        }
      }*/
    },
    startBackends() {
      this.backendProgress = 0;
      if (this.$store.state.meta.task_number != 1) {
        this.$store.dispatch("createHerald");
        this.$socket.emit("createPipelines");
      };
    },
    restartBackends() {
      this.highestPhase = 1;
      this.backendProgress = 1;
      this.startBackends();
    },
    createExecutable() {
      // send signal to write out pipelines and exit
      let modelID = this.$store.state.socket.selectedModel.toString();
      // console.log("create executable", modelID);
      this.$socket.emit("exportSolution", modelID);
      if (this.$store.state.socket.vast20expMode) {
        this.$store.commit(
          "updateInfoMessage",
          "You have successfully completed the experiment.  Thank you for your participation!"
        );

      } else {
        this.$store.commit(
          "updateInfoMessage",
          "You you have successfully exported model '" +
            this.modelIdToName[modelID] +
            ". You can select another model if you are not satisfied with previous decision OR close the browser!'"
        );

      }
    },
    widenDrawer() {
      // console.log("hey");
      this.mini = false;
    },
    nextPhase() {
      // console.log("NEXT PHASE");
      if (this.currentPhase === this.phases.length) {
        this.createExecutable();
      } else {
        this.$store.commit("INCREMENT_CURRENT_PHASE");
      }
    },
    highlightCards(phaseIndex, stepIndex) {
      this.$store.commit(
        "SET_HIGHLIGHTED_CARDS",
        this.phases[phaseIndex].steps[stepIndex].components
      );
    },
    dehighlightCards() {
      this.$store.commit("DEHIGHLIGHT_CARDS");
    },
    addCardsByName(phaseIndex, stepIndex) {
      this.$store.commit("ADD_CARDS_BY_NAME", {
        workspace: this.phases[phaseIndex].workspace,
        cardNames: this.phases[phaseIndex].steps[stepIndex].components
      });
    },
    submitDiscoveredProblems() {
      this.$store.dispatch(
        "sendDiscoveredProblems",
        this.$store.state.socket.rawDataDesc
      );
      // console.log("navigation: task 1 finished");
      this.$emit("finished");
      this.reset();
      //this.$store.commit("updateInfoMessage", "Thank you. You have successfully completed the problem discovery task.");
    },
    getHeralds() {
      let heraldsList = [ ];
      this.$store.state.socket.heraldMap.forEach((herald) => {
        heraldsList.push(herald);
      });
      return heraldsList;
    }
  },
  computed: {
    latestHeraldRead() {
      return this.$store.state.socket.latestHeraldRead;
    },
    heralds() {
      if (this.$store.state.socket.heraldsChanged) {
        return this.getHeralds();
      } else {
        return this.getHeralds();
      }
    },
    problemText() {
      if (!this.runProblem || _.isEmpty(this.runProblem)) {
        return "none";
      }
      return this.runProblem.creationType === "auto" ? "auto_" + this.runProblem.problemID : this.runProblem.problemID;
    },
    buttonLogic() {
      if (this.$store.state.socket.vast20expMode) {
        if (this.currentPhase === 1) {
          // during add attributes
          // If they've added any attributes
          return false;
        }
        if (this.currentPhase === 2) {
          // during add attributes
          // If they've added any attributes
          return false;
        }
        if (this.currentPhase === 3) {
          // during build model
          // If they've built a model
          return false;
        }
        return false;

      } else {
        if (this.currentPhase === 1) {
          // during dataset selection step
          return _.isEmpty(this.$store.state.socket.rawDataDesc);
        }
        if (this.currentPhase === 2) {
          if (this.problemDiscoveryTask) return true;
          // during problem selection step
          return _.isEmpty(this.runProblem);
        }
        if (this.currentPhase === 3) {
          // during problem selection step
          return _.isEmpty(this.$store.state.socket.models);
        }
        return false;
      }
    },
    voderSelectedVariable() {
      return this.$store.state.socket.voderSelectedVariable;
    },
    runProblem() {
      return this.$store.state.socket.runProblem;
    },
    ta2Available() {
      return this.$store.state.socket.ta2Available;
    },
    problemDiscoveryTask() {
      return this.$store.state.meta.task_number == 1;
    },
    getSelectedModel: {
      get() {
        // console.log("updated return ", this.$store.state.socket.selectedModel);
        try {
          if (this.$store.state.socket.selectedModel) {
            return this.$store.state.socket.selectedModel;
          } else {
            return "Select Model";
          }
        } catch (err) {
          return "Select Model";
        }
      },
      set(value) {
        //this.$store.commit('setSelectedModel', +value.replace( /^\D+/g, ''))
        this.$store.commit("setSelectedModel", value);
      }
    },
    models() {
      // return [{name: 'Model 1', value: 0}, {name: 'Model 2', value: 2}]
      // console.log(
      //   "there are ",
      //   this.$store.state.socket.models.length,
      //   this.$store.state.socket.models,
      //   " models"
      // );
      var modelOptions = _.map(this.$store.state.socket.filteredModels, function(mod) {
        return { name: mod.modelName, value: mod.modelId };
      });
      // console.log("got models ", modelOptions)
      return modelOptions;
      // the above is dummy models for the sake of backend-free demo
      // return _.map(this.$store.state.socket.models, (d, i) => ({ name: d.data.config.url.replace('http://0.0.0.0:8080/static/dev_data/example_model_outputs/', ''), value: i }))
    },
    modelIdToName() {
      let map = {};
      for (let i = 0; i < this.models.length; i++) {
        map[this.models[i].value] = this.models[i].name;
      }
      return map;
    },
    phases() {
      return this.$store.state.meta.phases;
    },
    tasksPrompt() {
      return this.$store.state.meta.style.tasksPrompt;
    },
    hasTasksPrompt() {
      return !this.mini && !!(this.$store.state.meta.style.tasksPrompt);
    },
    selectedModel: {
      get() {
        this.$store.state.socket.selectedModel;
      },
      set(value) {
        this.$store.commit("setSelectedModel", value);
      }
    },
    currentPhase: {
      get() {
        return this.$store.state.meta.currentPhase;
      },
      set(value) {
        // console.log("SET CURRENT PHASE -- -- -- OLD, NEW -- -- --", this.$store.state.meta.currentPhase, value);
        this.$store.commit("SET_CURRENT_PHASE", value);
      }
    }
  },
  updated: function() {
    // console.log('navigation updated ', this)
    // console.log('update ',  this.$store.state.socket.selectedModel)
  },
  watch: {
    voderDialog() {
      if (!this.voderDialog) {
        setTimeout(() => {
          this.mini = !this.mini;
        }, 500);
      }
    },
    voderSelectedVariable() {
      if (this.voderSelectedVariable !== "") {
        this.voderDialog = true;
      }
    },
    runProblem() {
      console.log("RUN PROBLEM CHANGED", this.runProblem);
      // this.$emit("finished");
    },
    ta2Available() {
      console.log("BACKEND IS CONNECTED: ", this.ta2Available);
    },
    highestPhase() {
      console.log("highest phase: ", this.highestPhase);
    },
    currentPhase(newPhase, oldPhase) {
      if (newPhase > this.highestPhase) {
        this.highestPhase = newPhase;
      }
      if (newPhase === 3) {
        this.startBackends();
      }
      if (newPhase < 3) {
        this.backendFinished = false;
        this.backendProgress = 0;
      }
    }
  },
  data() {
    return {
      dataset_field:
        "/Users/florian/code/d3mapp/node_middleware/static/local_testing_data/185_baseball",
      highestPhase: 1,
      mini: false,
      invites: [],
      backendProgress: 0,
      metrics: ["accuracy", "sensitivity", "specificity", "matthews"],
      selectedMetric: "accuracy",
      voderDialog: false
    };
  }
};
</script>

<style lang="scss">
.the-drawer {
  position: fixed;
  .nav-toolbar .toolbar__content {
    .spacer {
      margin-left: 0 !important;
    }
    padding-right: 10px;
  }
  .expand-collapse {
  }
  .nav-content {
    // margin-top: 48px;
    text-align: left;
  }
  .phase-visited > span {
    background-color: #1976d2 !important;
    border-color: #1976d2 !important;
  }
  .stepper,
  .stepper__header {
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }
  .stepper--vertical {
    padding-bottom: 0;
  }
  .navigation-drawer {
    padding-bottom: 0;
  }
  .substeps .list__tile {
    padding: 0;
    margin-left: -20px;
  }
  .stepper__step--active > span {
    background-color: #ff9800 !important;
    border-color: #ff9800 !important;
  }
  .stepper--vertical .stepper__content {
    padding-left: 0px;
    .list {
      .avatar &.list__tile__avatar {
        // width: 20px !important;
        padding-left: 0px;
      }
      .list__tile__avatar {
        padding-left: 20px;
      }
      // z-index: 100;
      // position: relative;
      // left: -12px;
    }
  }
  .list__tile .avatar,
  .list__tile__action {
    min-width: 0;
  }
  .btn {
    padding: 0px;
    margin-left: -40px;
    margin-right: 0px;
  }
  .metric-select {
    padding-top: 0;
  }
  .tasks-prompt {
    text-align: left;
  }
}
</style>
