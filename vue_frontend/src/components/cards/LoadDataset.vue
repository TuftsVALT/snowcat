<template>
  <div id="load-dataset-card">
    <v-text-field v-model="dataset_field" label="dataset path"></v-text-field>
    <v-btn @click="$socket.emit('newdataset', dataset_field)">load dataset</v-btn>
  </div>
</template>

<script>
// TODOS - add information on number of rows?
import _ from 'lodash'
import marked from 'marked'
import moment from 'moment'
import typeStyles from '@/store/settings/typeStyles'

export default {
  name: 'load-dataset',
  data: function () {
    return {
      dataset_field: "/Users/florian/code/d3mapp/node_middleware/static/local_testing_data/185_baseball",
    }
  },
  computed: {

  },
  methods: {

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
