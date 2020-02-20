<template>
  <div id="data-definition-card">
    <v-checkbox
      v-model="filterOff"
      label="Show all comparable models from any Session"
    ></v-checkbox>
    <v-data-table
      v-bind:headers="modelMetricHeaders"
      :items="models"
      v-model="selectedModels"
      item-key="modelId"
      class="elevation-0"
    >
      <template v-slot:items="props" >
        <tr :active="props.selected" @click="props.selected = !props.selected" :style="getStyle(props.item.modelId)">
          <td>
            <v-checkbox
              :input-value="props.selected"
              primary
              hide-details
            ></v-checkbox>
          </td>
          <td class="metric-value-text text-xs-left" :title="props.item.modelName">{{ shorten(props.item.modelName) }}</td>
          <td v-for="m in modelMetrics" class="text-xs-center">{{ props.item.modelMetrics[m] ? props.item.modelMetrics[m].toFixed(3) : "--" }}</td>
          <td class="text-xs-center">{{ props.item.heraldId }}</td>
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
  data() {
    return {
      filterOff: false,
    }
  },
  mounted() {
    this.$store.commit("SET_FILTERED_MODELS", this.models);
    this.selectedModels = [ ];
  },
  computed: {
    selectedModels: {
      get() {
        return this.$store.state.socket.selectedModels;
      },
      set(val) {
        this.$store.commit("SET_SELECTED_MODELS", val);
      }
    },
    modelMetricHeaders () {
      let headers = [ ];
      headers.push({ text: 'Compare', align: 'left', sortable: false });
      headers.push({ text: 'Model ID', align: 'left', value: 'modelName', sortable: true });
      this.modelMetrics.forEach((metric) => {
        headers.push({ text: metric, value: 'modelMetrics.'+metric, align: 'center', sortable: true });
      });
      headers.push({ text: 'Session ID', value: 'heraldId', align: 'center', sortable: true });
      console.log("headers", headers);
      return headers;
    },
    modelMetrics () {
      let metrics = new Set();
      this.$store.state.socket.models.forEach((model) => {
        Object.keys(model.modelMetrics).forEach((metric) => metrics.add(metric));
      });
      let metricsArray = Array.from(metrics);
      metricsArray.sort();
      return metricsArray;
    },
    models() {
      return this.$store.state.socket.models.filter((model) => {
        return this.filter(model);
      });
    },
    selectedModel () {
      return this.$store.state.socket.selectedModel;
    }
  },
  methods: {
    clicked(p) {
      console.log("PROPS", p);
    },
    filter(model) {
      if (this.filterOff) {
        let hMap = this.$store.state.socket.heraldMap;
        let selectedHerald = hMap.get(this.$store.state.socket.latestHeraldRead);
        let rowHerald = hMap.get(model.heraldId);
        if (selectedHerald.problemTargetFeature === rowHerald.problemTargetFeature &&
            selectedHerald.problemTaskType === rowHerald.problemTaskType) {
          return true;
        }
        return false;
      }
      if (this.$store.state.socket.latestHeraldRead === model.heraldId) {
        return true;
      }
      return false;
    },
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
  },
  watch: {
    selectedModels() {
      console.log("selected models", this.selectedModels);
    },
    models() {
      this.$store.commit("SET_FILTERED_MODELS", this.models);
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
