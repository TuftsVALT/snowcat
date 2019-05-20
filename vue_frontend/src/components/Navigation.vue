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
        <v-icon >{{mini ? 'chevron_right' : 'chevron_left'}}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-stepper v-model="currentPhase" vertical non-linear @click.stop="mini = false" class="nav-content">
      <template v-for="(phase, index) in phases">
        <v-stepper-step
          :key="'step-title-' + index"
          :step="index + 1"
          :complete="currentPhase > index"
          :editable="phases[highestPhase - 1].editable[index] || (index + 1 <= highestPhase)"
          :class="{ 'phase-visited': index + 1 <= highestPhase }"
          edit-icon="done"
        >
          <span v-show="!mini">{{phase.name}}</span>
          <small v-if="index + 1 === 3" v-show="!mini">{{highestPhase <= 3 ? 'Default' : 'Selected' }}: {{selectedMetric}}</small>
          <small v-if="index + 1 === 4" v-show="!mini">{{highestPhase <= 4 ? 'Default' : 'Selected' }}: {{ models[selectedModel] ? models[selectedModel].name : 'none' }}</small>

        </v-stepper-step>
        <v-stepper-content
          :key="'step-content-' + index"
          :step="index + 1"
          v-show="!mini"
        >
          <v-list subheader dense class="substeps">
            <v-list-tile avatar v-for="(step, i) in phase.steps" v-bind:name="step.name" @click="addCardsByName(index, i)" @mouseover.stop="highlightCards(index, i)" @mouseout.stop="dehighlightCards" :key="'substeps-'+i">
              <v-list-tile-avatar style="width: 40px; height: 40px;">
                <v-icon>check</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{step.name}}</v-list-tile-title>
                <v-list-tile-sub-title v-if="step.subtitle">{{ step.subtitle }}</v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
          <v-btn v-if="!problemDiscoveryTask && index + 1 === 1 && backendProgress === 0" color="primary" :disabled="!ta2Available && !problemDiscoveryTask" @click.stop="startBackends"><v-progress-circular v-if="!ta2Available && !problemDiscoveryTask" indeterminate v-bind:size="15" color="primary"></v-progress-circular> <span v-if="!ta2Available && !problemDiscoveryTask">&nbsp; &nbsp;</span> {{phaseTransitionText(index, backendProgress) }}</v-btn>

          <v-btn v-if="index + 1 === 1 && backendProgress === 100" color="error" @click.stop="restartBackends">{{phaseTransitionText(index, backendProgress) }}</v-btn>
          <v-progress-linear :indeterminate="true" v-if="index + 1 === 2 && backendProgress < 100 && !problemDiscoveryTask" v-model="backendProgress"></v-progress-linear>
          <v-btn v-if="!problemDiscoveryTask && index + 1 === 2 && backendProgress === 100" color="primary" @click.stop="nextPhase">View Models</v-btn>
          <v-btn v-if="problemDiscoveryTask && index + 1 === 1" color="primary" @click.stop="submitDiscoveredProblems">Submit Discovered Problems</v-btn>
          <div v-if="index + 1 === 3">
            <v-select
              v-bind:items="models"
              v-model ="getSelectedModel"
              item-text ="name"
              item-value ="value"
              label="Select Model"
              single-line
              bottombottom
              class="model-select"
            ></v-select>
            <v-btn color="primary" @click.stop="nextPhase" :disabled="getSelectedModel<0">Select Model</v-btn>
          </div>
          <v-btn v-if="index + 1 === 5" color="primary" @click.stop="createExecutable">Create Executable</v-btn>
        </v-stepper-content>
      </template>
    </v-stepper>
    <v-dialog v-model="voderDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary" fixed>
          <v-btn icon dark @click.native="close()" @click.stop="mini = !mini">
            <v-icon>close</v-icon>
          </v-btn>
          <v-toolbar-title>Voder Data Facts</v-toolbar-title>
        </v-toolbar>
        <voder v-if="voderDialog" />
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script>
import Voder from '@/components/Voder'
export default {
  name: 'navigation',
  components: {
    Voder
  },
  beforeDestroy () {
    // clearInterval(this.interval)
  },
  sockets: {
    backendFinished: function() {
      this.backendProgress = 100;
    }
  },
  methods: {
    close () {
      this.voderDialog = false;
      this.$store.commit("setUserVariable", "");
    },
    reset () {
      this.highestPhase = 1;
      this.mini = false;
      this.invites = [];
      this.backendProgress = 0;
      this.metrics = ['accuracy', 'sensitivity', 'specificity', 'matthews'];
      this.selectedMetric = 'accuracy';
    },
    phaseTransitionText(index, backendProgress) {
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
      }
    },
    createPipelines() {
      // Unclear to me if we still want this progress bar
      /*
      this.interval = setInterval(() => {
        if (this.backendProgress === 100) {
          clearInterval(this.interval)
        } else {
          this.backendProgress += 1
        }
      }, 100);
      */
      this.backendProgress = 0;
      if ( this.$store.state.meta.task_number != 1) {
        this.$socket.emit('createPipelines');
      }
    },
    startBackends () {
      // Here, I'm going to call out to TA2s.  But should this go in Navigation.vue?  I'm
      // confused about the separation of concerns here.
      this.nextPhase()
      this.createPipelines()
    },
    restartBackends () {
      this.highestPhase = 1
      this.backendProgress = 1
      this.startBackends()
    },
    createExecutable () {
      // send signal to write out pipelines and exit
      let modelID = this.$store.state.socket.selectedModel.toString();
      console.log("create executable", modelID);
      this.$socket.emit('exportSolution', modelID);
      this.$store.commit("updateInfoMessage", "You you have successfully exported model '" + this.modelIdToName[modelID] + ". You can select another model if you are not satisfied with previous decision OR close the browser!'");
    },
    widenDrawer () {
      console.log('hey')
      this.mini = false
    },
    nextPhase () {
      if (this.currentPhase === this.phases.length) {
        this.createExecutable();
      } else {
        this.$store.commit('INCREMENT_CURRENT_PHASE')
      }
    },
    highlightCards (phaseIndex, stepIndex) {
      this.$store.commit('SET_HIGHLIGHTED_CARDS', this.phases[phaseIndex].steps[stepIndex].components)
    },
    dehighlightCards () {
      this.$store.commit('DEHIGHLIGHT_CARDS')
    },
    addCardsByName (phaseIndex, stepIndex) {
      this.$store.commit('ADD_CARDS_BY_NAME', { workspace: this.phases[phaseIndex].workspace, cardNames: this.phases[phaseIndex].steps[stepIndex].components })
    },
    submitDiscoveredProblems () {
      this.$store.dispatch('sendDiscoveredProblems', this.$store.state.socket.rawDataDesc);
      console.log("navigation: task 1 finished");
      this.$emit("finished");
      this.reset();
      //this.$store.commit("updateInfoMessage", "Thank you. You have successfully completed the problem discovery task.");
    }
  },
  computed: {
    voderSelectedVariable() {
      return this.$store.state.socket.voderSelectedVariable;
    },
    runProblem() {
      return this.$store.state.socket.runProblem;
    },
    ta2Available() {
      return this.$store.state.socket.ta2Available;
    },
    problemDiscoveryTask () {
      return this.$store.state.meta.task_number == 1
    },
    getSelectedModel : {
      get(){
        console.log('updated return ', this.$store.state.socket.selectedModel)
        try {
          if (this.$store.state.socket.selectedModel) {
            return this.$store.state.socket.selectedModel
          } else {
            return "Select Model";
          }
        } catch(err) {
          return "Select Model";
        }
      },
      set(value){
          //this.$store.commit('setSelectedModel', +value.replace( /^\D+/g, ''))
          this.$store.commit('setSelectedModel', value)
      }
    },
    models () {
      // return [{name: 'Model 1', value: 0}, {name: 'Model 2', value: 2}]
      console.log("there are ", this.$store.state.socket.models.length,this.$store.state.socket.models, " models");
      var modelOptions = _.map(this.$store.state.socket.models, function(mod) {
        return { 'name': mod.modelName, 'value': mod.modelId };
      })
      // console.log("got models ", modelOptions)
      return modelOptions;
      // the above is dummy models for the sake of backend-free demo
      // return _.map(this.$store.state.socket.models, (d, i) => ({ name: d.data.config.url.replace('http://0.0.0.0:8080/static/dev_data/example_model_outputs/', ''), value: i }))
    },
    modelIdToName() {
      let map = { };
      for (let i = 0; i < this.models.length; i++) {
        map[this.models[i].value] = this.models[i].name;
      }
      return map;
    },
    phases () {
      return this.$store.state.meta.phases;
    },
    selectedModel : {
      get(){
         this.$store.state.socket.selectedModel;
      },
      set (value) {
         this.$store.commit('setSelectedModel', value);
      }
    },
    currentPhase: {
      get () {
        return this.$store.state.meta.currentPhase
      },
      set (value) {
        this.$store.commit('SET_CURRENT_PHASE', value)
      }
    }
  },
  updated : function(){
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
      if(this.voderSelectedVariable !== "") {  
        this.voderDialog = true;
      }
    },
    runProblem() {
      console.log("RUN PROBLEM CHANGED", this.runProblem);
      this.$emit("finished");
    },
    ta2Available() {
      console.log("BACKEND IS CONNECTED: ", this.ta2Available);
    },
    highestPhase() {
      console.log("highest phase: ", this.highestPhase);
    },
    currentPhase (newPhase, oldPhase) {
      if (newPhase > this.highestPhase) {
        this.highestPhase = newPhase
      }
    },

  },
  data () {
    return {
      highestPhase: 1,
      mini: false,
      invites: [],
      backendProgress: 0,
      metrics: ['accuracy', 'sensitivity', 'specificity', 'matthews'],
      selectedMetric: 'accuracy',
      voderDialog: false,
    }
  }
}
</script>

<style lang="scss">
.the-drawer {
  position:fixed;
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
  }
  .phase-visited > span {
    background-color: #1976D2 !important;
    border-color: #1976D2 !important;
  }
  .stepper, .stepper__header {
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
    background-color: #ff9800!important;
    border-color: #ff9800!important;
  }
  .stepper--vertical .stepper__content {
     padding-left: 0px;
    .list {
      .avatar &.list__tile__avatar {
        // width: 20px !important;
        padding-left: 0px
      }
      .list__tile__avatar {
          padding-left: 20px;
      }
       // z-index: 100;
       // position: relative;
       // left: -12px;
    }
  }
  .list__tile .avatar, .list__tile__action {
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
}
</style>