<template>
  <v-dialog v-model="throughJoinDialog" persistent max-width="1200px">
    <v-card class="through-join-container" v-if="throughJoinDialog">
      <v-card-text>
        <p>
            The attribute you are trying to join, <span class="highlighted-attribute">{{joinDependencyLeaf}}</span>, goes through {{hasMultipleDependentIntermediaries() ? "intermediate attributes" : "an intermediate attribute, "}}<span class="highlighted-attribute">{{joinDependencyIntermediaries.join(', ')}}</span>.
        </p>
        <p>
            Please specify how the data should be aggregated.
        </p>

        <v-container class="grey lighten-5">
            <v-layout>
                <v-flex
                    xs6
                >
                  <v-data-table
                    :items="joinSelections"
                    class="elevation-1 through-join-table"
                    hide-actions
                    hide-headers
                    show-expand
                  >
                    <template v-slot:items="props">
                      <td :class="calculateAttributeClass(props.item.originalIndex)">
                        <v-select
                          :items="props.item.aggregationOpChoices"
                          :value="props.item.aggregationOp"
                          :disabled="agChoiceDisabled(props.item.originalIndex)"
                          v-if="agChoiceVisible(props.item.originalIndex)"
                          label="Join Method"
                          :id="'ag-select-' + props.item.originalIndex"
                          :append-outer-icon="calculateIsLater(props.item.originalIndex) ? 'space_bar' : 'merge_type'"
                          :ref="'ag-select-' + props.item.originalIndex"
                          @input="handleAgSelect('ag-select-' + props.item.originalIndex, props.item.originalIndex)"
                        ></v-select>
                      </td>
                      <td :class="calculateAttributeClass(props.item.originalIndex)">{{ props.item.name }}</td>
                    </template>
                  </v-data-table>
                </v-flex>
                <v-flex
                    xs6
                >
                  <preview-join-graph
                    v-if="joinDependencyExamplesLoaded"
                    :rootExample="joinDependencyRootExample"
                    :throughRows="throughRows"
                    :cellHeight="cellHeight"
                  />
                </v-flex>
            </v-layout>
        </v-container>
      </v-card-text>
      <v-card-actions v-if="!loading">
        <v-spacer></v-spacer>
        <v-btn
          flat
          text
          color="green darken-1"
          @click="cancelJoin"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="primary"
          :disabled="!isJoinValid"
          @click="acceptJoin"
        >
          Join Attribute
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import store from "@/store";
import * as d3 from "d3";
import PreviewJoinGraph from "@/components/cards/DataAugmentationComponents/PreviewJoinGraph.vue";

export default {
  name: "ThroughJoin",

  components: {
    PreviewJoinGraph
  },

  props: {
    throughJoinDialog: {
      type: Boolean,
      default: () => false
    },
    throughJoinInstructions: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      loading: false,
      joinDependencyLeaf: '',
      joinDependencyRoot: '',
      joinDependencyRootExample: '',
      joinDependencyIntermediaries: [],
      joinDependencyList: [], // sorted in order of lowest to highest
      joinDependencyAggregationOpList: [],
      joinDependencyAggregationOpChosen: [],
      joinDependencyResultingTypes: [],
      joinDependencyExampleTree: [],  // Has 3 examples at each level of hierarchy, with parent relationships
      joinDependencyDataTypes: [],
      cellHeight: 100,
      joinDependencyExamplesLoaded: false,
    };
  },

  mounted () {
  },

  computed: {
    throughRows: {
      get: function() {
        const numAttrs = this.joinSelections.length;
        let resultingRows = [];
        for (let i=0; i< numAttrs; i++) {
          if (i == 0) {
            resultingRows.push({
              'name': this.joinSelections[i]['name'],
              'examples': ['placeholder1', 'placeholder2', 'placeholder3'],
              // 'datatype': this.joinDependencyResultingTypes[i]
            })
          } else {
            const correctedIndex = this.joinDependencyAggregationOpChosen.length - i
            resultingRows.push({
              'name': this.joinSelections[i]['name'],
              'examples': this.joinDependencyExampleTree[correctedIndex],
              'datatype': this.joinDependencyResultingTypes[i-1],
              'aggregationOp': this.joinDependencyAggregationOpChosen[correctedIndex] && this.joinDependencyAggregationOpList[correctedIndex]
            })
          }
        }
        return resultingRows;
      }
    },

    joinSelections: {

      get: function () {
        // console.log("in joinSelections, this.joinDependencyList is ", this.joinDependencyList);
        let dependencies = this.joinDependencyList.map((d, i) => {
          return {
            'aggregationOp': this.joinDependencyAggregationOpList[i],
            'aggregationOpChoices': this.getAggregationOpsByAttributeValueType(this.joinDependencyResultingTypes[i-1] || this.joinDependencyDataTypes[i]),
            'name': d,
            'originalIndex': i,
            'data-table-expand': true
          }
        })
        const numDependencies = dependencies.length;
        let selections = [...[{
            'aggregationOp': null,
            'aggregationOpChoices': this.getAggregationOpsByAttributeValueType(this.joinDependencyResultingTypes[numDependencies - 1]),
            'name': this.joinDependencyRoot,
            'originalIndex': -1
          }], ...dependencies.reverse()];
        return selections;
      },
      set: function(newJoinSelection) {
        console.log("setting joinSelection with value ", newJoinSelection)
      }
    },
  },

  watch: {
    throughJoinDialog: function(value) {
    },
    throughJoinInstructions: function(joinInstructions) {
      console.log("WATCH WEHNT OFF FOR JOIN INSTRUCTIONS, THEY ARE ", joinInstructions)
      this.reinitializeThroughJoin();
    }
  },

  methods: {

    reinitializeThroughJoin() {
      this.joinDependencyLeaf = '';
      this.joinDependencyRoot = '';
      this.joinDependencyRootExample = '';
      this.joinDependencyIntermediaries = [];
      this.joinDependencyList = []; // sorted in order of lowest to highest
      this.joinDependencyAggregationOpList = [];
      this.joinDependencyAggregationOpChosen = [];
      this.joinDependencyResultingTypes = [];
      this.joinDependencyExampleTree = [];  // Has 3 examples at each level of hierarchy; with parent relationships
      this.joinDependencyDataTypes = [];
      this.joinDependencyExamplesLoaded = false;

      this.prepareJoinValues();
    },

    prepareJoinValues() {
      this.recurseJoinInstructions(this.throughJoinInstructions);
      let vueThis = this;
      this.joinDependencyExamplesLoaded = false;
      if (this.throughJoinInstructions['parentEntityExample']) {
        console.log("calling to dataaugGetExamplesThroughJoin")
        this.$socket.emit('dataaugGetExamplesThroughJoin', this.throughJoinInstructions, function(receivedData) {
          console.log("receivedData for throughJoin, it is ", JSON.stringify(receivedData));
          vueThis.joinDependencyExamplesLoaded = true;
          console.log("should be adding to dependencyExampleTree...")
          for (let i=receivedData.length-1; i>=0; i--) {
            // Need to flip flop the order here
            console.log("i is ", i);
            console.log("receivedData.length is", receivedData.length, "splicing in ", vueThis.joinDependencyExampleTree, " at location ", receivedData.length - i - 1)
            vueThis.joinDependencyExampleTree.splice(receivedData.length - i - 1, 1, receivedData[i] && receivedData[i].map((d) => d['label']));
          }
        });
      }
    },

    cancelJoin() {
      this.$emit('hide-through-join-dialog', {})
    },

    acceptJoin() {
      const results = {
        'aggregationOps': this.joinDependencyAggregationOpList,
        'parentCol': this.joinDependencyRoot,
        'name': this.joinDependencyLeaf
      }
      this.$emit('hide-through-join-dialog', results)
    },

    handleAgSelect(selectedRef, index) {
      const component = this.$refs[selectedRef];
      this.$nextTick(() => {
        const newValue = component.selectedItems[0];
        this.joinDependencyAggregationOpList.splice(index, 1, newValue)
        this.joinDependencyAggregationOpChosen.splice(index, 1, true)
      });
    },

    mapVuetifySelectList(options) {
      return options.map((o, i) => {
        return {
          'value': o,
          'text': o,
          'index': i
        }
      })
    },

    calculateIsPrevious(index) {
      const totalChosen = this.joinDependencyAggregationOpChosen.length;
      const numChosen = this.joinDependencyAggregationOpChosen.filter((x) => x).length;
      const numToChoose = this.joinDependencyAggregationOpChosen.filter((x) => !x).length;
      return index == 0 || index > numToChoose;
    },

    calculateIsCurrent(index) {
      const numChosen = this.joinDependencyAggregationOpChosen.filter((x) => x).length;
      const numToChoose = this.joinDependencyAggregationOpChosen.filter((x) => !x).length;
      return index == numToChoose;
    },

    calculateIsLater(index) {
      return !(this.calculateIsPrevious(index) || this.calculateIsCurrent(index))
    },

    calculateAttributeClass(index) {
      if (this.calculateIsPrevious(index)) {
        return {
          'previous-attribute-row': true
        }
      } else if (this.calculateIsCurrent(index)) {
        return {
          'current-attribute-row': true
        }
      } else {
        return {
          'later-attribute-row': true
        }

      }
    },

    agChoiceDisabled(index) {
      // console.log("index is ", index, " and ")
      return (index > 0) && !this.joinDependencyAggregationOpChosen[index - 1]
    },

    agChoiceVisible(index) {
      return (index >= 0);
    },

    recurseJoinInstructions(joinInstructions) {
      // Here, we want to parse through the joinInstructions, and build our dependency list, op list, and resulting types.
      this.joinDependencyLeaf = joinInstructions['relationship'];
      this.parseJoinInstructions(joinInstructions);
    },

    hasMultipleDependentIntermediaries() {
      this.joinDependencyIntermediaries.count > 1;
    },

    // A recursive method for going through the joinInstructions
    parseJoinInstructions(joinInstructions, isParent=false) {
      // console.log("calling parseJoinInstructions with joinInstructions ", joinInstructions, " and isParent ", isParent)
      this.joinDependencyList.push(joinInstructions['relationship']);
      if (!isParent) {
        this.joinDependencyAggregationOpList.push(joinInstructions['aggregationOp']);
      } else {
        this.joinDependencyAggregationOpList.push(null);
      }
      if (joinInstructions['aggregationOp'] !== 'through') {
        this.joinDependencyAggregationOpChosen.push(true);
      } else {
        this.joinDependencyAggregationOpChosen.push(false);
      }
      this.joinDependencyResultingTypes.push(this.getResultingTypeByAggregationOp(joinInstructions['aggregationOp'], joinInstructions['operation'], joinInstructions['datatype']));
      this.joinDependencyDataTypes.push(joinInstructions['operation']);
      // this.joinDependencyExampleTree.push(joinInstructions['examples']);
      // Note: this is actually set by a call on mount, look in mounted()
      if (isParent) {
        // This means we have a parent and we also are a parent, so we are an intermediary
        this.joinDependencyIntermediaries.push(joinInstructions['relationship']);
      }

      if (joinInstructions['parentJoin']) {
        this.parseJoinInstructions(joinInstructions['parentJoin'], true);
      } else {
        this.joinDependencyRoot = joinInstructions['column']
      }

      if (joinInstructions['parentEntityExample']) {
        this.joinDependencyRootExample = joinInstructions['parentEntityExample'];
      }
    },

    isJoinValid () {
      // To be valid, we have to have picked aggregation operations for each required aggregation
      return joinDependencyAggregationOpList.length > 0 && joinDependencyAggregationOpList.filter((op) => !op).length > 0;
    },

    getAggregationOpsByAttributeValueType: function(valueType) {
      switch(valueType) {
        case "join-string":
        case "join-number":
          return ["value"];
        case "join-collection-string":
          return ["count", "any"];
        case 'datetime':
          return [
              "count",
              // "mode",
              "max",
              "min",
              "any"
          ];
        case "join-collection-number":
          return [
            "count",
            "sum",
            "mean",
            "median",
            // "mode",
            "max",
            "min",
            "variance",
            "any"
          ];
        default:
          return ["value"];
      }
    },

    getResultingTypeByAggregationOp: function(aggregationOp, operation='join-collection-number', opDatatype=null) {
      // Shouldn't we have some other possible value than number?
      // What if we are joining to just a single string?
      // The state capital, for example
      switch(aggregationOp) {
        case "count":
        case "sum":
        case "max":
        case "min":
        case "mean":
        case "median":
        case "mode":
        case "variance":
          return 'join-collection-number';
        case "value":
        case "any":
          if (opDatatype) {
            return 'datetime'
          } else if (operation === 'join-string') {
            return 'join-collection-string';
          } else {
            return 'join-collection-number';
          }
          // Need to branch to see if the value is a string or a number...

        default:
          return null;
      }
    },

  }
};
</script>

<style scoped>
  .through-join-container {
    font-size: 1.7em;
    padding: 50px;
    text-align: left;
  }

  .v-text-field {
    padding-top: 0px;
  }

  .highlighted-attribute {
    color: red;
    font-weight: 700;
  }

  .current-attribute-row {
    color: red;
    font-weight: 700;
  }

  .previous-attribute-row {
    color: black;
  }

  .later-attribute-row {
    color: gray;
    font-style: italic;
  }
</style>

<style>
  .through-join-table tr {
    height: 100px;
  }
</style>