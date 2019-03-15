<template>
  <div id="collab_filtering_vis">
    <div id="collab_filtering">
      <v-container fluid v-bind="{ [`grid-list-xl`]: true }">
        <v-layout row wrap>
          <v-progress-linear v-if="weHaveNoModels" indeterminate v-bind:size="30" color="primary"></v-progress-linear>
          <v-flex
            v-else
            xs6
            v-for="n in modelIds"
            v-bind:id="'modelcard_' + n"
            :key="n"
          >
            <v-card tile>
              <v-card-media>
                <v-progress-linear v-if="waitingForModel(n)" indeterminate v-bind:size="10" color="primary"></v-progress-linear>
                <div class="model_slot">
                </div>
              </v-card-media>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
//var d3 = require("d3");
import * as d3 from "d3";
import _ from 'lodash';
import d3Tip from 'd3-tip';
import store from '@/store';

  /*
   * initialize the web page
   */
export default {
  name: "CollaborativeFiltering",
  data: function () {
    return {
      hovered: null,
      dataField: [ ],
      modelsHandled: [ ],
      modelsReturned: [ ],
      numModels: 0,
      scales: new Map(),
      barHeights: new Map(),
      tips: new Map()
    }
  },
  computed: {
    weHaveNoModels() {
      return _.isEmpty(this.modelIds);
    },
    models() {
      return this.$store.state.socket.models;
    },
    xLinkingHilite() {
      if (this.$store.state.socket.xLinking.highlight) {
        var newStringArray = this.$store.state.socket.xLinking.xLinkIndexes.map(d => "" + d);
        return {
          array: newStringArray,
          set: new Set(newStringArray)
        }
      } else {
        return {
          array: [],
          set: new Set()
        };
      }
    },
    xLinkingSelect() {
      return {
        array: this.$store.state.socket.xLinkingSelect,
        set: this.$store.state.socket.xLinkingSelect_Set
      }
    },
    modelIdToNumber() {
      let map = new Map();
      let models = this.$store.state.socket.models;
      if (!_.isEmpty(models)) {
        for (let i = 0; i < models.length; i++) {
          let model = models[i];
          map.set(model.modelId, i);
        }
      }
      return map;
    },
    modelIdToName() {
      let map = new Map();
      let models = this.$store.state.socket.models;
      if (!_.isEmpty(models)) {
        for (let i = 0; i < models.length; i++) {
          let model = models[i];
          map.set(model.modelId, model.modelName);
        }
      }
      return map;
    },
    modelIds: function() {
      //console.log("model ids", this.$store.state.socket.dataCollection);
      var i = 0;
      if ( this.$store.state.socket.evaluationConfig.running_mode == 'development' ) {
        return _.map(this.$store.state.socket.evaluationConfig.model_output_prediction_files, (file) => {
          return i++;
        })
      } else {
        return _.map(this.$store.state.socket.models, (file) => {
          return i++;
        })
      }
    }
  },
  mounted: function () {
    this.getData(this.$store.state.socket.models, this.$socket);
  },
  watch: {
    xLinkingHilite() {
      let linkSet = this.xLinkingHilite.set;
      let vueThis = this;
      d3.select("#collab_filtering").selectAll(".bar").each(function(d) {
        let split = d3.select(this).attr("id").split("_");
        let key = split[1];
        let modelID = split[3];
        // prevent infinite loop when hovering stuff
        if (vueThis.hovered === modelID + "_" + key) {
          //console.log("prevent loop", modelID + "_" + key);
          return;
        }
        //retrieve stored values
        let height = vueThis.barHeights[modelID][key];
        let x = vueThis.scales[modelID][key].x;
        let y = vueThis.scales[modelID][key].y;
        let num_hilites_in_bin = 0;
        d.forEach(el => {
          if (linkSet.has("" + el.d3mIndex))
            num_hilites_in_bin++;
        });
        d3.select(this).selectAll(".overlay").remove();
        if (num_hilites_in_bin > 0) {
          d3.select(this).append("rect")
            .classed("overlay", true)
            .attr("x", 1)
            //.attr("y", d => height - y(d.length))
            .attr("y", height - y(num_hilites_in_bin) )
            .attr("width", d => Math.max(1.0, x(d.x1) - x(d.x0) - 1) )
            .attr("height", d => y(num_hilites_in_bin) )
            .on('mouseenter', function(d) {
              /*
                console.log("overlay");
                d3.event.stopPropagation();
                vueThis.tips[modelID][key].hide(this);
                vueThis.tips[modelID][key].show(d.y - 10, this);*/
             })
            .on('mouseout', /*vueThis.tips[modelID][key].hide*/ function(){})
            .on('click', function(d) {
              //d3.event.stopPropagation();
              console.log("overlay");
            });
          }
        });
    },
    models: function (mods) {
      this.getData(mods, this.$socket)
    },
  },
  methods: {
    waitingForModel(i) {
      let modelId = this.models[i].modelId;
      let returned = this.modelsReturned.includes(modelId);
      let waiting = !returned;
      return waiting;
    },
    // TODO - change getData to use datastore
    // Change histogram call to go through websocket to call python process
    getData(models, socket) {
      $("#Vis").height((9.5/10)*$(window ).height()).width($( window ).width());

      if ( models && models.length > 0 ) {
        for (let i = 0; i < models.length; i++) {
          let model = models[i];
          if (!this.modelsHandled.includes(model.modelId)) {
            this.numModels += 1;
            this.modelsHandled.push(model.modelId);
            socket.emit("processCollaborativeFiltering",
              { fileUri: model.fileUri, modelId: model.modelId}
            );
          }
        }
      }
    },
    loadVis(data, modelNumber) {
      $('<div class="modelHeader">' + data.modelName + '</div>').appendTo("#modelcard_" + modelNumber + " .model_slot");
      if (!this.scales.has(modelNumber)){
        this.scales[modelNumber] = new Map();
      }
      if (!this.barHeights.has(modelNumber)){
        this.barHeights[modelNumber] = new Map();
      }
      if (!this.tips.has(modelNumber)){
        this.tips[modelNumber] = new Map();
      }
      this.visualizeHistogram(data.predictionsData, "pred", modelNumber, "Frequency of items per predicted rating");
      this.visualizeHistogram(data.predictionsData, "delta", modelNumber, "Frequency of items for (actual rating - predicted rating)");
    },
    visualizeHistogram(data, key, modelID, text) {
      let vueThis = this;
      var accessor = function(d) { return d[key] };
      var formatCount = d3.format(",.0f");
      var margin = { top: 40, right: 20, bottom: 50, left: 15 };
      var width = 350 - margin.right - margin.left,
          height = 230 - margin.right - margin.left;

      var svg = d3.select("#modelcard_" + modelID + " .model_slot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var tip = d3Tip()
          // BUG: setting root element does not work, tooltip divs
          // are attached to document.body
          //.rootElement(d3.select("#collab_filtering").node())
          .attr('class', 'collab_filtering d3-tip')
          .offset([-10, 0])
          .html(function(d) {
            return "<strong>Frequency:</strong> <span style='color:red'>" + d.length + "</span>";
      });
      svg.call(tip);
      vueThis.tips[modelID][key] = tip;

      var x0 = Math.max(Math.abs(d3.min(data, accessor)), d3.max(data, accessor));
      // make sure x0 is at least 1
      x0 = Math.max(1, x0);

      var x = d3.scaleLinear()
        .domain([-x0, x0])
        .range([0, width])
        .nice();
      // Generate a histogram using twenty uniformly-spaced bins.
      var bins = d3.histogram()
        .value(accessor)
        .thresholds(x.ticks(20).slice(0, -1))
        (data);

      if (bins.length === 1) {
        // this is a bad model that apparently predicts only one value
        // make sure that the resulting bar charts do not have 0 width
        let onlyVal = bins[0].x0;
        bins[0].x0 = onlyVal - 0.1;
        bins[0].x1 = onlyVal + 0.1;
      }

      var y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([0, height]);

      this.scales[modelID][key] = { 'x': x, 'y': y };
      this.barHeights[modelID][key] = height;

      var xAxis = d3.axisBottom().scale(x);

      var bar = svg.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar")
        .attr("id", function(d) { return "bar_" + key + "_" + d.x0 + "_" + modelID; })
        .attr("transform", function(d) {return "translate(" + x(d.x0) + ",0)"; });

      bar.append("rect")
        .attr("x", 1)
        .attr("y", d => height - y(d.length) )
        .attr("width", d => Math.max(1.0, x(d.x1) - x(d.x0) - 1) )
        .attr("height", d => y(d.length) )
        // .each(d => console.log(d))
        .on('mouseover', function(d) {
          tip.show(d, this);
          let array = d.map(datum => "" + datum.d3mIndex);
          // console.log("real thing", array);
          vueThis.hovered = modelID + "_" + key;
          store.commit('updateXLinking', {
            xLinkIndexes: array,
            highlight: true,
            visValue: true,
            visType: "collaborativeFiltering",
          });
        })
        .on('mouseout', function(d) {
          tip.hide();
          vueThis.hovered = null;
          store.commit('updateXLinking', {
            xLinkIndexes: [],
            highlight: false,
            visValue: false,
            visType: "collaborativeFiltering"
          });
        })
        .on("click", function(d) {
          console.log("base");
          // console.log("click on d3mIndices", d);
          var id = d3.select(this).attr("id");
          d3.selectAll(".bar").style("fill", "steelblue");
          d3.selectAll("#" + id).style("fill", "orangered");
          tip.hide(this);
          tip.show(d, this);
        });

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("x", 0)
        .attr("y",40)
        .text(text);
    },
  },
  sockets: {
    processCollaborativeFinished(data) {
      data.modelName = this.modelIdToName.get(data.modelId);
      if (!data.modelName) {
        data.modelName = data.modelId;
      }
      console.log("collab filtering data", data);
      this.modelsReturned.push(data.modelId);
      let modelNumber = this.modelIdToNumber.get(data.modelId);
      this.loadVis(data, modelNumber);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

  #collab_filtering .modelHeader {
    font-size: 1.1em;
    font-weight: 700;
  }

  #collab_filtering #headBar{
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: lightgray;
    width: 100%;
    height: 5   0px;
    font-size: 0.5em;
  }

  #collab_filtering #Vis{
    background-color: #fff;
    width: 100%;
    height: 97%;
  }

  #collab_filtering .line-separator {
    height: 2px;
    background: #dddddd;
    border-bottom: 1px solid #dddddd;
  }

  #collab_filtering .models{
    font: 12px sans-serif;
    border:1px solid black;
    vertical-align: middle;
    float:left;
    border-radius: 3px;
    margin: 4px;
    padding-left: 5px;
    padding-top: 2px;
    font-size: 11px;
    background-color: rgba(237,237,237,.8);
  }

  #collab_filtering .modelHeader{
    font: 14px sans-serif;
    padding:10px;
    margin:2px;
    width:98%;
  /*  border: 1px solid #b0aead;*/
    font-weight: bold;
  }

  #collab_filtering .bar {
    fill: steelblue;
    shape-rendering: crispEdges;
  }

  #collab_filtering .bar text {
    fill: #fff;
  }
/*
  #collab_filtering .bar:hover {
    fill: orangered ;
  }
*/
  .collab_filtering.d3-tip {
    line-height: 1;
    font-weight: bold;
    padding: 12px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    border-radius: 2px;
  }

  /* Creates a small triangle extender for the tooltip */
  .collab_filtering.d3-tip:after {
    box-sizing: border-box;
    display: inline;
    font-size: 10px;
    width: 100%;
    line-height: 1;
    color: rgba(0, 0, 0, 0.8);
    content: "\25BC";
    position: absolute;
    text-align: center;
  }

  /* Style northward tooltips differently */
  .collab_filtering.d3-tip.n:after {
    margin: -1px 0 0 0;
    top: 100%;
    left: 0;
  }

  #collab_filtering .axis path, .axis line {
    fill: none;
    stroke: #000;
    shape-rendering: crispEdges;
  }

  #collab_filtering .overlay {
    fill: orangered;
  }

</style>
