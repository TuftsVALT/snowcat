<template>
  <v-app>
    <navigation id="navDrawer" />
    <v-content>
      <grid id="theGrid"/>
    </v-content>
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
    error_message() {
      return this.$store.state.socket.errorMessage;
    },
    info_message() {
      return this.$store.state.socket.infoMessage;
    }
  },
  watch: {
    error_message () {
      this.snackbar = true;
    },
    info_message () {
      this.infobar = true;
    }
  },
  methods: {

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
