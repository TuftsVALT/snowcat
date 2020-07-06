<template>
  <div id="data-definition-card" v-if="readyToLoad">
    <v-card-title primary-title>
      <div class="headline">{{datasetName}}</div>
      <div class="dataset-description" v-html="datasetDescription"></div>
    </v-card-title>
    <v-subheader>
      <h5>Data types in this dataset</h5>
    </v-subheader>
    <v-expansion-panel expand class="elevation-0">
      <v-expansion-panel-content v-for="(dataResource, i) in dataResources" :key="'datatype-'+i" :hide-actions="!dataResourcePanels[i]">
        <div slot="header">
          <span><type-chip :item="dataResource.resType"/> {{dataResource.resPath}}</span>
        </div>
        <v-data-table
          v-bind:headers="colsInfoHeaders"
          :items="colsInfo"
          hide-actions
          v-if="dataResourcePanels[i] === 'table'"
        >
          <template slot="items" slot-scope="props">
            <td class="text-xs-right"><column-chip :item="props.item.colName" /></td>
            <td class="text-xs-left">
              <type-chip :item="props.item.colType"></type-chip>
            </td>
            <td class="text-xs-right">{{ props.item.rangeString }}</td>
          </template>
        </v-data-table>
        <v-container v-else-if="dataResourcePanels[i] === 'graph'">
          <p>{{dataResource.data.data.directed ? 'A' : 'An'}} <strong>{{dataResource.data.data.directed ? 'directed' : 'undirected'}}</strong> graph with <strong>{{dataResource.data.nodes}} nodes</strong> and <strong>{{dataResource.data.edges}} edges</strong>.</p>
        </v-container>
        <v-container v-else-if="dataResourcePanels[i] === 'timeseries'">
          <p>Times series data ranging from <strong>{{getDateString(dataResource.domain[0])}}</strong> to <strong>{{getDateString(dataResource.domain[1])}}</strong></p>
        </v-container>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </div>
</template>

<script>
// TODOS - add information on number of rows?
import _ from 'lodash'
import marked from 'marked'
import moment from 'moment'
import typeStyles from '@/store/settings/typeStyles'
import typeChip from '@/components/TypeChip'
import columnChip from '@/components/ColumnChip'

export default {
  name: 'data-definition',
  components: { typeChip, columnChip },
  data: function () {
    return {
      typeStyles,
      colsInfoHeaders: [
        {
          text: 'Feature',
          align: 'left',
          value: 'colName'
        },
        { text: 'Data Type', value: 'colType' },
        { text: 'Range of Values', value: 'colType', sortable: false }
      ]
    }
  },
  computed: {
    readyToLoad() {
      return !!(this.$store.state.socket.rawDataDesc && this.$store.state.socket.rawDataDesc.about)
    },
    dataResourcePanels () {
      return _.map(this.dataResources, (resource) => {
        if (resource.resType === 'table') {
          return 'table'
        } else if (resource.resType === 'graph' && resource.data && resource.data.data) {
          return 'graph'
        } else if (resource.resType === 'timeseries' && resource.domain) {
          return 'timeseries'
        }
        return null
      })
    },
    datasetName () {
      return this.$store.state.socket.rawDataDesc.about.datasetName
    },
    datasetDescription () {
      if (this.$store.state.socket.rawDataDesc.about.description) {
        return marked(this.$store.state.socket.rawDataDesc.about.description)
      } else {
        return " ";
      }
    },
    dataTypes () {
      return _.map(this.$store.state.socket.rawDataDesc.dataResources, (res) => res.resType)
    },
    dataResources () { return this.$store.state.socket.rawDataDesc.dataResources },
    data_items () {
      if (this.$store.state.socket.rawDataDesc.about) {
        // Can choose different icons at
        // https://material.io/icons/
        return [
          { icon: 'label', iconClass: 'grey lighten-1 white--text', title: 'dataTypes', subtitle: this.dataTypesString(this.$store.state.socket.rawDataDesc.dataResources), tooltip: "These are the data types that exist in this dataset.  Possible values include 'table', 'graph', 'image', 'video', 'audio', and 'timeseries'" }
        ]
      } else {
        return []
      }
    },
    colsInfo () {
      if (this.rawDataTypes) {
        return _.map(this.rawDataTypes, (colType, colName) => {
          if (this.$store.state.socket.tabularProcessedData.histogramMetaDataArray.length > 0) {
            // Hack - we want this to reload when the tabular data is ready
            // Not sure how else to do this.
            return {
              colName: colName,
              colType: colType,
              rangeString: this.valuesRange(colName, colType)
            }
          } else {
            return {
              colName: colName,
              colType: colType,
              rangeString: ''
            }
          }
        })
      }
    },
    rawDataTypes () {
      return this.$store.state.socket.rawDataTypes
    }
  },
  methods: {
    getDateString: (ms) => {
      return moment(ms).format('MM/DD/YYYY')
    },
    dataTypesString: (dataResources) => {
      return _.map(dataResources, (res) => res.resType)
    },
    valuesRange (colName, colType) {
      if (colType == 'categorical') {
        return _.join(this.$store.getters.categoricalValues(colName), ', ')
      } else if (_.includes(['real', 'integer', 'float'], colType)) {
        return '(' + this.$store.getters.minValue(colName) + ', ' + this.$store.getters.maxValue(colName) + ')'
      }
    }
  }
}
</script>

<style lang="scss">
#data-definition-card {
  .headline {
    overflow: auto;
  }
  width: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  .list--three-line .list__tile {
  }
  .tooltip {
    opacity: inherit;
  }
  .dataset-description {
    text-align: left;
    ul, ol, dl {
      margin-left: 16px;
    }
    p:last-child {
      margin-bottom: 0;
    }
  }
  .datatable {
    td {
      vertical-align: middle;
    }
  }
  .expansion-panel__body {
  }
  .expansion-panel__header {
    padding: 12px;
  }
  .expansion-panel__container {
    max-width: 100%;
  }
}
</style>
