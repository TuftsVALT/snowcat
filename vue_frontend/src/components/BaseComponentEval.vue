<template>
  <v-app>
    <v-dialog v-model="selectTask" persistent max-width="490" content-class="task_selection_modal">
      <v-card v-if="task === 0">
        <v-card-title class="headline">Welcome to SNOWCAT</v-card-title>
        <v-card-text>
          <p>Snowcat helps you to define machine learning problems and create, analyze, and curate models for them.</p>
          <p>I you have been assigned to TASK 1, please click <i>continue</i>.</p>
          <p>Your task will then be to explore and augment the data and define a meaningful problem for it.</p>
          <p>If you have been assigned to TASK 2, please click <i>skip</i>.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click.native="task = 1; selectTask = false">Continue</v-btn>
          
          <v-btn color="red" flat @click.native="task = 2; selectTask = true">skip</v-btn>
          
        </v-card-actions>
      </v-card>
      <v-card v-else>
        <v-card-title class="headline">Create Models</v-card-title>
        <v-card-text>
          <p>After defining and selecting a machine learning problem, Snowcat will now help you to create and compare models for it.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click.native="task = 2; selectTask = false">Continue</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <template v-if="!selectTask">
      <navigation @finished="task1Finished" id="navDrawer" />
      <v-content>
        <grid id="theGrid"/>
      </v-content>
    </template>
    <v-snackbar
    :timeout="timeout"
    :color="color"
    :multi-line="mode === 'multi-line'"
    :vertical="mode === 'vertical'"
    v-model="snackbar"
    >
      {{ error_message }}
      <v-btn dark flat @click.native="snackbar = false">OK</v-btn>
    </v-snackbar>
    <v-snackbar
     :timeout="timeout"
     color="success"
     :multi-line="mode === 'multi-line'"
     v-model="infobar"
    >
      {{ info_message }}
      <v-btn dark flat @click.native="infobar = false">OK</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import Navigation from '@/components/Navigation'

import Grid from '@/components/Grid'

export default {
  name: 'base-component',
  components: { Navigation, Grid},
  data: function() {
    return {
      // selectTask: true,
      // task: 0,
      selectTask: false,
      task: 1,
      //snackbar
      snackbar: false,
      color: 'error',
      //color: '',
      mode: 'multi-line',
      timeout: 30000,
      infobar: false
    }
  },
  computed: {
    modelCorrectness () {
    // return this.models.map(model => model.predictions.map((key, prediction) => prediction === this.rawData[key][this.truePredsCol]))
      return []
    },
    model_type () {
      return this.$store.state.socket.evaluationConfig.model_comparison_type
    },
    first_task () {
      return this.task == 1
    },
    error_message() {
      return this.$store.state.socket.errorMessage;
    },
    info_message() {
      return this.$store.state.socket.infoMessage;
    }
  },
  watch: {
    task (new_task_num) {
      this.$store.commit("SET_TASK_NUMBER", new_task_num)
    },
    error_message () {
      this.snackbar = true;
    },
    info_message () {
      this.infobar = true;
    }
  },
  methods: {
    task1Finished() {
      console.log("TASK 1 FINISHED");
      this.selectTask = true;
      this.task = 2;
      this.$store.commit("SET_TASK_NUMBER", 2);
      console.log("task number: ", this.$store.state.meta.task_number);
    }
  }
}
</script>

<style lang="scss">
#navDrawer, #theGrid {
  height: 100%;
}
</style>

<style>
  .task_selection_modal {
    text-align: left;
  }
</style>
