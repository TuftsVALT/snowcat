<template>
  <v-card>
    <v-card-title>
      <v-spacer></v-spacer>
      <v-select
        :items="items"
        item-text="name"
        item-value="value"
        v-model="selected"
        label="Select Training Data or Model Output"
      ></v-select>
    </v-card-title>
    <graph-view-links :isGoldData="isGoldData" :predictions="predictions" :graph_data="graph_data" :id_map="d3mMap" v-if="type === 'linkPrediction'"/>
    <graph-view-match :isGoldData="isGoldData" :predictions="predictions" :graph_data="graph_data" :id_map="d3mMap" v-else-if="type === 'graphMatching'"/>
    <graph-view-vertex :isGoldData="isGoldData" :predictions="predictions" :graph_data="graph_data" :id_map="d3mMap" v-else-if="type === 'vertexNominationOrClustering'"/>
    <v-progress-circular v-else indeterminate v-bind:size="50" color="primary"></v-progress-circular>
  </v-card>
</template>

<script>
  import GraphViewLinks from '@/components/cards/GraphViewLinks.vue'
  import GraphViewMatch from '@/components/cards/GraphViewMatch.vue'
  import GraphViewVertex from '@/components/cards/GraphViewVertex.vue'
  // import GraphViewCluster from '@/components/cards/GraphViewCluster.vue'

  export default {
    name: 'GraphView',
    mounted() {
      // console.log(this.goldPredictions);
    },
    data: function () {
      return {
        selected: "training",
      }
    },
    computed: {
      graph_data() {
        return this.$store.state.socket.networkData;
      },
      isGoldData() {
        return this.selected === "training";
      },
      predictions() {
        console.log("NEW SELECTION", this.selected);
        if (this.selected === "training") {
          // send training data
          return this.goldPredictions;
        } else {
          // get predictions from model
          let modelId = this.selected;
          let selectedModel = null;
          this.models.forEach(model => {
            if (model.modelId === modelId){
              selectedModel = model;
            }
          });
          // console.log("SELECTED MODEL", selectedModel);
          if (selectedModel) {
            let modelPreds = selectedModel.predictions;
            let modelPredictions = { };
            for (let i = 0; i < modelPreds.length; i++) {
              let pred = modelPreds[i];
              modelPredictions[pred.d3mIndex] = pred[this.predictionTarget];
            }
            return modelPredictions;
          } else {
            console.log("WARNING: cannot find modelId", modelId);
            return { };
          }
        }
      },
      goldPredictions() {
        // no prediction target and predictions available yet
        if (!this.predictionTarget) return { };
        // predictions and target available
        let dataCol = this.$store.state.socket.dataCollection;
        let goldLabelsMap = { };
        Object.keys(dataCol).forEach(d3mIndex => goldLabelsMap[d3mIndex] = dataCol[d3mIndex]["data"][this.predictionTarget]);
        return goldLabelsMap;
      },
      models() {
        return this.$store.state.socket.models;
      },
      modelPredictions() {
        let preds = [this.trainingLabels];
        for (let i = 0; i < this.models.length; i++) {
          // TODO: do stuff for each model...
        }
        return preds;
      },
      predictionTarget() {
        //column name of the prediction target in the data table
        if (_.isEmpty(this.graph_data)) return null;
        return this.graph_data.predictionTarget;
      },
      items() {
        let models = Array.map(this.models, d => { return {
          name: d.modelName,
          value: d.modelId
        }});
        models.unshift({ name: "Training Data", value: "training" });
        return models;
      },
      graph_data() {
        return this.$store.state.socket.networkData;
      },
      type() {
        return this.$store.state.socket.networkData.type;
      },
      problemType() {
        return this.$store.state.socket.rawProblemDesc.about.taskType;
      },
      d3mMap() {
        //mapping node_ids in the grah structure to d3mIndices from the training data
        if (_.isEmpty(this.graph_data)) return { };
        let training = this.$store.state.socket.dataCollection;
        var d3mMap = {};
        var nodeIdColName = this.graph_data.nodeIdColumn;
        var d3mKeys = Object.keys(training);
        for (var i = 0; i < d3mKeys.length; i++) {
          var key = d3mKeys[i];
          var each = training[key].data;
          d3mMap[each[nodeIdColName]] = key;
        }
        // console.log("d3mMap", d3mMap);
        return d3mMap;
      },
    },
    // components: {GraphViewMatch, GraphViewLinks, GraphViewVertex, GraphViewCluster}
    components: { GraphViewMatch, GraphViewLinks, GraphViewVertex }
  }
</script>

<style language="scss">

</style>
