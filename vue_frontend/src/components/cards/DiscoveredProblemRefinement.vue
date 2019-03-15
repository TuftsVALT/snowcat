<template>
  <div id="data-definition-card">
    <v-dialog v-model="hasDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Delete problem?</v-card-title>
        <v-card-text>Are you sure you want to remove this problem?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat="flat" @click.native="removeGeneratedProblem(dialog - 1); dialog = 0">Yes</v-btn>
          <v-btn color="green darken-1" flat="flat" @click.native="dialog = 0">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-container fluid v-bind="{ [`grid-list-xl`]: true }" v-for="(generatedProblem, index) in generatedProblems"
          :key="index">

         <v-card flat tile>
            <v-card-text>
              <v-list subheader>

                <v-list-tile class="wtf">
                  <v-list-tile-content >
                    <v-list-tile-title>Target Field</v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <column-chip :item="generatedProblem.targetFeature" />
                  </v-list-tile-action>
                </v-list-tile>

                <v-list-tile class="wth">

                  <v-list-tile-title>Prediction Feature(s)
                  </v-list-tile-title>

                  <td align="right" >
                    <column-chip v-for="predictFeature in generatedProblem.predictFeatures" :item="predictFeature" :key="'predict-'+predictFeature" />
                  </td>

                </v-list-tile>

                <v-list-tile class="wtf">
                  <v-list-tile-content>
                    <v-list-tile-title>Prediction Type</v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <type-chip :item="generatedProblem.taskType" />
                  </v-list-tile-action>
                </v-list-tile>

                <v-list-tile >
                  <v-list-tile-content>
                    <v-list-tile-title>Target Metric</v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <type-chip :item="generatedProblem.metric" />
                  </v-list-tile-action>
                </v-list-tile>

                <v-text-field
                  name="problemDescription"
                  v-model="generatedProblem.problemDescription"
                  label="Problem Description"
                  textarea
                  required />
                  <v-btn color="info"
                  :loading="loading"
                  :disabled="loading"
                  @click.native="loader = 'loading'">
                    Save
                  </v-btn>
                  <v-btn color="error" dark @click.stop="renderConfirmation(index)">
                    Delete This Problem
                  </v-btn>
              </v-list>
            </v-card-text>
          </v-card>
    </v-container>
  </div>
</template>

<script>
// TODO - Need to add validation that badly formed problems aren't sent.
// TODO - Need to add logic for which task subtypes load, which metrics load, stuff like that.
// TODO - Add confirmation dialog before deleting problem from this card
import _ from 'lodash'
import typeChip from '@/components/TypeChip'
import columnChip from '@/components/ColumnChip'
export default {
  name: 'discovered-problem-refinement',
  components: { columnChip, typeChip },
  data: function () {
    return {
      taskTypes: this.$store.state.problemDiscovery.taskTypes,
      taskSubTypes: this.$store.state.problemDiscovery.taskSubTypes,
      metricTypes: this.$store.state.problemDiscovery.metricTypes,
      selected: this.$store.state.problemDiscovery.selected,
      dialog: 0
    }
  },
  computed: {
    hasDialog: {
      get: function () {
        return this.dialog != 0
      },
      set: function (newValue) {
        this.dialog = 0
      }
    },
    generatedProblems: function () {
      return this.$store.state.problemDiscovery.generatedProblems
    },
    featuresList: function () {
      var nameList = []
      if (this.$store.state.socket.tabularProcessedData.histogramMetaDataArray.length > 0) {
        for (var i = 0; i < this.$store.state.socket.tabularProcessedData.histogramMetaDataArray.length; i++) {
          if (!(this.$store.state.socket.tabularProcessedData.histogramMetaDataArray[i][0] == 'd3mIndex')) {
            nameList[i] = this.$store.state.socket.tabularProcessedData.histogramMetaDataArray[i][0]
          }
        }
      }
      return nameList
    },
    predictFeaturesList: function () {
      return _.reject(this.featuresList, (feature) => { return (!feature || feature == this.targetFeature) })
    }

  },
  methods: {
    renderConfirmation: function (index) {
      this.dialog = index + 1
    },
    removeGeneratedProblem: function (index) {
      this.$store.commit('REMOVE_GENERATED_PROBLEM', index)
    }

  },
  watch: {
  }
}
</script>

<style lang="scss">
.wtf{

padding-bottom:20px;

  border-bottom:1px solid grey;

}
.wth{
border-bottom:1px solid green;
height:100px;

margin-top:50px;
padding-bottom:120px;
}




</style>
