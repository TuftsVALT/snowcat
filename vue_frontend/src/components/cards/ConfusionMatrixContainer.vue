<template>
  <div class="confusionMatrixContainer">
    <h6>Classification: Confusion Matrix. Please select models in the card "Scores of the Models".</h6>
    <confusion-matrix v-if="models" v-for="(model, index) in selectedModels" :key="model.modelId" :model="model" :index="index"></confusion-matrix>
    <v-progress-circular v-else indeterminate v-bind:size="50" color="primary"></v-progress-circular>
  </div>
</template>

<script>
import * as d3 from "d3v3";
import _ from 'lodash';
import store from '@/store';
import ConfusionMatrix from '@/components/cards/ConfusionMatrix.vue';

//inside cards
export default {
  name: "ConfusionMatrixContainer",
  components: { ConfusionMatrix },
  props: [],
  data: function() {
    return {
      models: this.$store.state.socket.models,
    };
  },
  computed: {
    selectedModels() {
      return this.$store.state.socket.selectedModels;
    }
  }
};
</script>
<style scoped>
  .confusionMatrixContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 1px solid lightgray;
    padding: 3px;
  }

  h6 {
    padding: 4px;
    width: 100%;
    text-align: left;
  }
</style>
