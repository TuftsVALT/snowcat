<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
  // import evaluationConfig from '../tufts_gt_wisc_configuration.json'

  var local_context = this;

  export default {
    name: 'app',
    data: function () {
      return {
        // evaluationConfig: evaluationConfig
      }
    },
    beforeCreate: function () {
      // Load data and such according to the evaluation config
      // this.$store.dispatch('processConfig', evaluationConfig)
    },
    components: {}
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

body, html, .container-fluid, #app {
     height: 100%;
}
</style>
