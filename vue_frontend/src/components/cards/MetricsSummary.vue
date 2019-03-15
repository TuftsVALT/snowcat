<template>
  <div id="data-definition-card">
    <v-data-table
      v-bind:headers="modelMetricHeaders"
      :items="modelMetrics"
      class="elevation-0"
    >
      <template slot="items" slot-scope="props" >
        <tr :style="getStyle(props.item.modelId)">
          <td class="metric-value-text text-xs-left" :title="props.item.modelName">{{ shorten(props.item.modelName) }}</td>
          <td class="text-xs-center">{{ props.item.score }}</td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// TODOS - add information on number of rows?
import _ from 'lodash';
export default {
  name: 'metrics-summary',
  data: function () {
    return {

    }
  },
  computed: {
    modelMetricHeaders () {
      if ( !this.$store.state.socket.rawProblemDesc.about ) {
        return [
          { text: 'Model ID', align: 'left', value: 'modelName', sortable: true },
          { text: 'Metric Value', value: 'score', align: 'center', sortable: true }
        ]
      } else {
        return [
          { text: 'Model ID', align: 'left', value: 'modelName', sortable: true },
          { text: this.$store.state.socket.rawProblemDesc.inputs.performanceMetrics[0].metric, value: 'score', align: 'center', sortable: true }
        ]
      }
    },
    modelMetrics () {
      return _.map(this.$store.state.socket.models, (mod) => {
        var val = Object.values(mod.modelMetrics)[0]
        return {
          modelId: mod.modelId,
          modelName: mod.modelName,
          score: val.toFixed(3)
        }
      })
    },
    selectedModel () {
      return this.$store.state.socket.selectedModel;
    }
  },
  methods: {
    shorten(modelName) {
      if (modelName.length > 25) {
        return "..." + modelName.slice(-25);
      } else {
        return modelName;
      }
    },
    getStyle(modelId) {
      let bkg = "";
      if (modelId === this.selectedModel) {
        bkg = "gray";
      }
      return { background: bkg };
    }
  }
}
</script>

<style>
  #data-definition-card .list--three-line .list__tile {
    min-height: 88px !important;
    height: fit-content;
  }

  #data-definition-card .list__tile__sub-title {
    overflow: visible;
  }

  #data-definition-card .list--three-line .list__tile__sub-title {
    -webkit-line-clamp: inherit;
  }

  #data-definition-card .tooltip {
    opacity: inherit;
  }

  #data-definition-card {
    width: 100%;
  }

  .rowContainer{
    display: inline-flex;
    width: 100%;
  }

</style>
