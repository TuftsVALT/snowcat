<template>
  <svg 
    ref="previewJoinGraph" 
    :width="svgWidth"
    :height="numRows * cellHeight"
    class="preview-join-graph"
  >
    <!-- Give it a white background -->
    <rect
      width="100%"
      height="100%"
      fill="white"
    ></rect>

    <g
      class="join-graph-legend"
    >
      <rect
        x=10
        y=3
        width=180
        height=51
        class="legend legend-container"
      >
      </rect>
      <rect
        :x="entityX(0.15)"
        :y="10"
        :width="entityWidth() * 0.5"
        :height="entityHeight() * 0.5"
        rx=7
        class="example-rect legend"
      />
      <rect
        :x="aggregateFunctionX(0.15)"
        :y="15 + (entityHeight() * 0.5)"
        :width="aggregateFunctionWidth() * 0.5"
        :height="aggregateFunctionHeight() * 0.5"
        class="through-row-aggregation legend"
      />

      <text
        :x="aggValueTextX(0.04)"
        :y="10 + entityHeight() + (aggregateFunctionHeight())"
        class='through-row-label through-row-agg-value legend'
      >
        * Approximate Data
      </text>

      <text
        :x="entityX(0.15) + (entityWidth() * 0.55)"
        :y="17"
        class='legend'
      >
        - Datum
      </text>

      <text
        :x="aggregateFunctionX(0.15) + (aggregateFunctionWidth() * 0.55)"
        :y="33"
        class='legend'
      >
        - Aggregation
      </text>

      <!-- <text
        :x="aggregateFunctionX(0.15) + (aggregateFunctionWidth() * 0.55)"
        :y="70"
        class='legend'
      >
        - Passed Value
      </text> -->
<!-- 
      <text
        :x="entityX(0.25)"
        :y="90"
        class='legend legend-title'
      >
        Legend
      </text> -->


    </g>

    <g
      class="aggregation-links"
      v-for="(throughRow, i) in throughRows"
    >
      <!-- Links have to be down first so they are under the nodes -->

      <!-- Other Examples -->
      <!-- Main Example -->
      <!-- Left arrow -->
      <path
        v-if="i > 0 && throughRow.examples && throughRow.examples[1]"
        class="aggregation-link"
        :d="linkGenerator({'source': [entityXCenter(0.15), entityYBottom(i)], 'target': [aggregateFunctionX() + (aggregateFunctionWidth() * 0.5), aggregateFunctionY(i) + aggregateFunctionHeight()]})"
      />

      <!-- Middle arrow -->
      <path
        v-if="i > 0"
        class="aggregation-link"
        :d="linkGenerator({'source': [entityXCenter(0.5), entityYBottom(i)], 'target': [aggregateFunctionX() + (aggregateFunctionWidth() * 0.5), aggregateFunctionY(i) + aggregateFunctionHeight()]})"
      />

      <!-- Right arrow -->
      <path
        v-if="i > 0 && throughRow.examples && throughRow.examples[2]"
        class="aggregation-link"
        :d="linkGenerator({'source': [entityXCenter(0.85), entityYBottom(i)], 'target': [aggregateFunctionX() + (aggregateFunctionWidth() * 0.5), aggregateFunctionY(i) + aggregateFunctionHeight()]})"
      />

      <!-- Aggregation Arrow -->

      <path
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][1] "
        class="aggregation-link through-other-example"
        :d="linkGenerator({'source': [entityXCenter(0.15), aggregateFunctionY(i)], 'target': [entityXCenter(0.15), entityYBottom(i-1)]})"
      />

      <path
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][1]"
        class="aggregation-arrow through-other-example"
        :d="triangleGenerator()"
        :transform="'translate(' + entityXCenter(0.15) + ',' + (entityYBottom(i-1) + 5) + ')'"
      />

      <path
        v-if="i > 0"
        class="aggregation-link"
        :d="linkGenerator({'source': [aggregateFunctionX() + (aggregateFunctionWidth() * 0.5), aggregateFunctionY(i) + 10], 'target': [entityXCenter(0.5), entityYBottom(i-1)]})"
      />

      <path
        v-if="i > 0"
        class="aggregation-arrow"
        :d="triangleGenerator()"
        :transform="'translate(' + entityXCenter(0.5) + ',' + (entityYBottom(i-1) + 5) + ')'"
      />

      <path
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][2]"
        class="aggregation-link through-other-example"
        :d="linkGenerator({'source': [entityXCenter(0.85), aggregateFunctionY(i)], 'target': [entityXCenter(0.85), entityYBottom(i-1)]})"
      />

      <path
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][2]"
        class="aggregation-arrow through-other-example"
        :d="triangleGenerator()"
        :transform="'translate(' + entityXCenter(0.85) + ',' + (entityYBottom(i-1) + 5) + ')'"
      />

    </g>

    <g
      class="entity-and-results"
      v-for="(throughRow, i) in throughRows"
    >

      <!-- Left Example -->
      <rect
        v-if="i > 0 && throughRow.examples && throughRow.examples[1]"
        :x="entityX(0.15)"
        :y="entityY(i)"
        :width="entityWidth()"
        :height="entityHeight()"
        rx=7
        class="example-rect"
      />

      <!-- Middle Example -->
      <rect
        :x="entityX(0.5)"
        :y="entityY(i)"
        :width="entityWidth()"
        :height="entityHeight()"
        rx=7
        class="example-rect"
      />
      <!-- Right Example -->
      <rect
        v-if="i > 0 && throughRow.examples && throughRow.examples[2]"
        :x="entityX(0.85)"
        :y="entityY(i)"
        :width="entityWidth()"
        :height="entityHeight()"
        rx=7
        class="example-rect"
      />


      <!-- Aggregation Functions -->
      <rect
        v-if="i > 0"
        :x="aggregateFunctionX(0.5)"
        :y="aggregateFunctionY(i)"
        :width="aggregateFunctionWidth()"
        :height="aggregateFunctionHeight()"
        class="through-row-aggregation"
      />

      <text
        v-if="i > 0"
        :x="aggFunctionTextX()"
        :y="aggFunctionTextY(i)"
        class='through-row-agg-text'
      >
        {{throughRow.aggregationOp || '-'}}
      </text>
<!--       
      <text
        :x="aggValueTextX(0.15)"
        :y="aggValueTextY(i)"
        class='through-row-agg-text through-row-agg-value'
      >
        {{"i is " + i + " and throughRowResults[i] " + throughRowResults[i-1]}}
      </text> -->

      <text
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][1]"
        :x="aggValueTextX(0.15)"
        :y="aggValueTextY(i)"
        class='through-row-agg-text through-row-agg-value'
      >
        {{formatExample(throughRowResults[i-1][1])}}
      </text>

      <text
        v-if="i > 0 && throughRowResults[i-1] && throughRowResults[i-1][0]"
        :x="aggValueTextX(0.5)"
        :y="aggValueTextY(i)"
        class='through-row-agg-text through-row-agg-value'
      >
        {{formatExample(throughRowResults[i-1][0])}}
      </text>

      <text
        v-if="i > 1 && throughRowResults[i-1] && throughRowResults[i-1][2]"
        :x="aggValueTextX(0.85)"
        :y="aggValueTextY(i)"
        class='through-row-agg-text through-row-agg-value'
      >
        {{formatExample(throughRowResults[i-1][2])}}
      </text>

    </g>

    <!-- Text labels -->
    <g
      class='entity-text-labels'
      v-for="(throughRow, i) in throughRows"
    >
      <!-- <text
        :x="labelX()"
        :y="labelY(i)"
        class='through-row-label'
      >
        {{throughRow.name}}
      </text>
 -->
      <text
        v-if="i > 0 && throughRow.examples && throughRow.examples[1]"
        :x="entityXCenter(0.15)"
        :y="entityYCenter(i)"
        class='through-row-label'
      >
        {{formatExample(throughRow.examples[1])}}
      </text>

      <text
        v-if="i > 0 && throughRow.examples && throughRow.examples[0]"
        :x="entityXCenter(0.5)"
        :y="entityYCenter(i)"
        class='through-row-label'
      >
        {{formatExample(throughRow.examples[0])}}
      </text>

      <text
        v-if="i > 0 && throughRow.examples && throughRow.examples[2]"
        :x="entityXCenter(0.85)"
        :y="entityYCenter(i)"
        class='through-row-label'
      >
        {{formatExample(throughRow.examples[2])}}
      </text>

      <text
        v-if="i == 0"
        :x="entityXCenter(0.5)"
        :y="entityYCenter(i)"
        class='through-row-label'
      >
        {{formatExample(rootExample)}}
      </text>


    </g>

    <g
      class='table-row-dividers'
      v-for="(throughRow, i) in throughRows"
    >
      <polyline class='top-divider'
        :points="'0,' + ((i+1)*cellHeight) + ' ' + svgWidth + ',' + ((i+1)*cellHeight)"
        stroke="black"
        :opacity="(i == (numRows-1)) ? 0.8 : 0.1"
      >
      </polyline>

      <polyline class='right-divider'
        :points="svgWidth + ',' + ((i)*cellHeight) + ' ' + svgWidth + ',' + ((i+1)*cellHeight)"
        stroke="black"
        opacity=0.1
      >
      </polyline>

      <!-- <polyline class='top-divider'
        :points="'0,' + (i * cellHeight) + ' ' + svgWidth + ',' + (i*cellHeight)"
        stroke="lightgray"
        opacity=0.4
      >
      </polyline> -->
    </g>
  </svg>
</template>

<script>
import store from "@/store";
import * as d3 from "d3";
import * as numeral from "numeral";
import millify from "millify";
// import { chrono } from "chrono";
// const chrono = require("chrono");
import * as chrono from "chrono-node"
import * as moment from "moment";

import { sum, mean, median, mode, variance, max, min } from 'mathjs'; 

export default {
  name: "PreviewJoinGraph",

  components: {
    //
  },

  props: {

    svgWidth: {
      type: Number,
      default: 500
    },

    cellHeight: {
      type: Number,
      default: 100
    },

    throughRows: {
      type: Array,
      default: []
    },

    rootExample: {
      type: String,
      default: "Parent"
    }
  },

  data() {
    return {
      padding: { t: 10, r: 10, b: 30, l: 40 },
      debugColorScheme: d3.schemeCategory10,
      linkGenerator: d3.linkVertical()
    };
  },

  computed: {
    //
    numRows: function() {
      return this.throughRows.length;
    },

    throughRowResults: function() {
      let results = new Array(this.throughRows.length);
      let aggResult, fullResults;
      let vueThis = this;
      for ( let i = this.throughRows.length - 1; i >= 0; i--) {
      // for ( let i = 0; i < this.throughRows.length; i++) {
        let exampleValuesToDisplay = vueThis.throughRows[i]['prevAggregationResults'] || vueThis.throughRows[i]['examples'];
        if (vueThis.throughRows[i]['aggregationOp'] && exampleValuesToDisplay) {
          // console.log("vueThis.throughRows[i] is ", vueThis.throughRows[i], " and exampleValuesToDisplay are ", exampleValuesToDisplay);
          aggResult = vueThis.aggregate(vueThis.throughRows[i]['aggregationOp'], exampleValuesToDisplay, vueThis.throughRows[i]['datatype'])
          const numExamplesNextRow = vueThis.throughRows[i-1] ? vueThis.throughRows[i-1]['examples'].length : 1;
          // This assumes that the result of an aggregation will always be a number.  If we add "any" as aggregation metric, 
          // or even "value", we break things.
          // fullResults = new Array(numExamplesNextRow);
          // for (let j = 0; j < numExamplesNextRow; j++) {
          //   // This is some hacky code to get example values in there
          //   console.log("aggResult is ", aggResult, " and should be ", Math.round(aggResult * (1 + j) * 0.5))
          //   fullResults[j] = Math.round(aggResult * (1 + j) * 0.5);
          // };
          // // but we actually want the true aggResult to be in the 0th slot, so we switch them out
          // if (fullResults[1]) {
          //   fullResults[1] = fullResults[0];
          // }
          // fullResults[0] = aggResult
          // console.log("rather than ", [Math.round(aggResult * 0.5), aggResult, Math.round(aggResult * 1.5)])
          if (['value', 'any'].includes(vueThis.throughRows[i]['aggregationOp'])) {
            console.log(" returning string or date")
            fullResults = [aggResult, aggResult, aggResult];
          } else {
            console.log(" returning num")
            fullResults = [aggResult, Math.round(aggResult * 0.5), Math.round(aggResult * 1.5)];
          }
          if (vueThis.throughRows[i-1]) {
            console.log("setting prevAggregationResults")
            vueThis.throughRows[i-1]['prevAggregationResults'] = fullResults;
            console.log("set prevAggregationResults")
          }
        } else {
        }
        console.log("setting results", i, " on line 425 to be ", JSON.stringify(vueThis.throughRows[i]['prevAggregationResults']))

        results[i] = vueThis.throughRows[i]['prevAggregationResults'];
      }
      console.log("returning results, they are ", JSON.stringify(results))
      return results;
    }
    
  },

  mounted: function() {
    // let vm = this;

    // this.svg = d3
    //   .select(this.$refs.distributionChartSVG)
    //   .attr("class", "distributionChartSVGs");

    // this.chartG = this.svg.append("g");

    // this.xAxisG = this.chartG
    //   .append("g")
    //   .attr("class", "x axis");

    // this.yAxisG = this.chartG
    //   .append("g")
    //   .attr("class", "y axis");

    // this.updateChart();
  },

  watch: {
    throughRows: function(rows) {
      console.log("through join rows changed in throughJoinRows, ", rows);
    }

    // selectedAttributeText: function(value) {
    //   this.updateChart();
    // },

    // svgWidth: function(value) {
    // 	this.updateChart();
    // },

    // svgHeight: function(value) {
    // 	this.updateChart();
    // }
  },

  methods: {
    mapToDate: function(example) {
      return chrono.strict.parseDate(example);
    },
    dateToString: function(dateObj) {
      console.log("dateObj.toString() is ", dateObj.toString());
      return moment(dateObj.toString()).format("MMM D YYYY");
    },
    formatExample: function(example) {
      // console.log("formatting example", example);
      // if it's a number, we round it to two decimals or approximate it
      if (numeral(example).value()) {
        // console.log("trying millify");
        // return millify(example)
        return example
      // } else if (chrono.parseDate(example)) {
      // // } else if (chrono.parseDate(example)) {
      //   // console.log("trying chrono and moment");
      //   // if it's a datestring, we parse it and print it to a value Jun 5 1985
      //   let parsedDateObj = this.mapToDate(example);
      //   return this.dateToString(parsedDateObj)
      } else {
        // console.log("just treating as string");
        // if it's a string, we ellipsize it if over 15 characters
        if (example.length > 13) {
          return example.substring(0, 10) + '...';
        } else {
          return example;
        }
      }
    },
    getDebugColor: function(i) {
      return this.debugColorScheme[i];
    },
    entityX: function(pctX) {
      return this.entityXCenter(pctX) - (this.entityWidth() / 2.0);
    },
    entityXCenter: function(pctX) {
      return (this.svgWidth * pctX);
    },
    entityY: function(i) {
      return this.cellHeight * (i + 0.55);
    },
    entityYCenter: function(i) {
      return this.entityY(i) + (0.6 * this.entityHeight());
    },
    entityYBottom: function(i) {
      return this.entityY(i) + this.entityHeight();
    },
    entityWidth: function() {
      return this.aggregateFunctionWidth();
    },
    entityHeight: function() {
      return this.aggregateFunctionHeight();
    },
    labelX: function() {
      return this.svgWidth * 0.3;
    },
    labelY: function(i) {
      return this.cellHeight * (i + 0.15);
    },
    aggregateFunctionX: function(pctX=0.5) {
      return (this.svgWidth * pctX) - (this.aggregateFunctionWidth() * 0.5);
    },
    aggregateFunctionY: function(i) {
      return this.cellHeight * (i + 0.15);
    },
    aggregateFunctionWidth: function() {
      return 100;
    },
    aggregateFunctionHeight: function() {
      return 20;
    },
    aggValueTextX: function(pctX) {
      return (this.svgWidth * pctX) + 5;
    },
    aggValueTextY: function(i) {
      return (this.cellHeight * i) - 4;
    },
    aggFunctionTextX: function() {
      return this.aggregateFunctionX(0.5) + (this.aggregateFunctionWidth() * 0.5);
    },
    aggFunctionTextY: function(i) {
      return this.aggregateFunctionY(i) + (this.aggregateFunctionHeight() * 0.65);
    },
    triangleGenerator() {
      return d3.symbol().type(d3.symbolTriangle).size(50)(); // lol nice job mbos;
    },

    aggregate: function(funcType, values, datatype=null) {
      let result;
      if (values.length == 0) { return 0 };
      switch (funcType) {
        case 'sum':
          result = sum(values);
          break;
        case 'mean':
          result = mean(values).toFixed(2);
          break;
        case 'median':
          result = median(values);
          break;
        case 'mode':
          result = mode(values);
          break;
        case 'variance':
          result = variance(values);
          break;
        case 'max':
          if (datatype && datatype === 'datetime') {
            result = values.sort()[0];
          } else {
            // console.log("getting max of ", values, " and it is ", max(values))
            result = max(values);
          }
          break;
        case 'min':
          if (datatype && datatype === 'datetime') {
            result = values.sort().reverse()[0];
          } else {
            // console.log("getting max of ", values, " and it is ", max(values))
            result = min(values);
          }
          break;
        case 'count':
          result = values.length;
          break;
        case 'value':
          result = values[0];
          break;
        case 'any':
          result = values[0];
          break;
        default:
          result = values.length;
          break;
      }
      console.log("valuse was ", values[0], " result was ", result, " and funcType is ", funcType)

      // if (datatype && datatype === 'datetime') {
      //   console.log("result was ", result, " and datetostring is ", this.dateToString(result), " and funcType is ", funcType)
      //   result = this.dateToString(result);
      // }

      return result;
    }


        // case 'sum':
        //     return '(SUM(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        // case 'mean':
        //     return '(AVG(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        //     // return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        // case 'median':
        //     return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        // case 'mode':
        //     return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        // case 'through':
        //     return '(GROUP_CONCAT(DISTINCT ?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        // case 'variance':
        //     return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        // case 'max':
        //     return '(MAX(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        // case 'min':
        //     return '(MIN(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        // default:
        //     return '(COUNT(DISTINCT ?' + labelString + ') as ?' + resultString + 'LabelAgg)';



  }
};
</script>

<style>
  .preview-join-graph circle {
    stroke: black;
    stroke-width: 3;
    fill: white;
  }

  path.aggregation-link {
    fill: none;
    stroke: black;
    stroke-width: 2;
  }

  rect.through-row-aggregation {
    stroke-width: 2;
    stroke: black;
    fill: white;
  }

  circle.through-other-example {
    stroke-width: 2;
    stroke: gray;
    fill: lightgray;
  }

  path.through-other-example {
    stroke-width: 1;
    stroke: gray;
    stroke-dasharray: 4;
  }

  path.through-other-example.aggregation-arrow {
    stroke-dasharray: 0;
    fill:gray;
  }

  text.through-row-label {
    text-anchor: middle;
    font: bold 12px sans-serif;
    fill: darkblue;
  }

  text.through-row-agg-text {
    text-anchor: middle;
    font: bold 14px sans-serif;
    fill: green;
  }

  text.through-row-agg-value {
    text-anchor: start !important;
  }

  rect.example-rect {
    fill: lightgray;
    stroke: black;
  }

  text.legend {
    font: 12px sans-serif;
  }

  text.legend-title {
    font: bold 14px sans-serif !important;
  }

  rect.legend-container {
    fill: white;
    stroke: black;
  }

</style>
