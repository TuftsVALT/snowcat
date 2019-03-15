<template>
  <div class="container" id="graphlinks">
    <span class="input">show: </span>
    <div class="input">
      <input type="checkbox" id="nodesbox" checked disabled/>
      <label id="nodesboxlabel" for="nodesbox">nodes ({{numNodes}})</label>
    </div>
    <div class="input">
      <input class="input" type="checkbox" id="basebox" v-model="showBaseEdges" checked/>
      <label id="baseboxlabel" for="basebox">base edges ({{numEdges}})</label>
    </div>
    <div class="input">
      <input class="input" type="checkbox" id="trainigbox" v-model="showPredictedEdges" checked/>
      <label id="trainingboxlabel" for="trainingbox">{{ isGoldData ? "expected predictions" : "predicted" }} ({{ numPredictedEdges }})</label>
    </div>
    <div class="container" id="svgdiv"></div>
    <div id="graphtooltip" style="opacity: 0;">
    </div>
  </div>
</template>

<script>
var d3 = require("d3");//d3v5 by default
import { mapGetters } from 'vuex';
import store from '@/store';

export default {
  name: 'GraphViewLinks',
  props: ["predictions", "graph_data", "id_map", "isGoldData"],
  mounted() {
    this.changed_data();
  },
  data() {
    return {
      config: this.$store.state.socket.evaluationConfig,
      showBaseEdges: true,
      showPredictedEdges: true
    }
  },
  computed: {
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
    predictedEdges() {
      if (_.isEmpty(this.graph_data) ||
          _.isEmpty(this.predictions) ||
          _.isEmpty(this.instances)) return [];

      var predictionTarget = this.graph_data.predictionTarget;
      var sourceCol = this.graph_data.sourceID;
      var targetCol = this.graph_data.targetID;
      //console.log(this.graph_data);
      //assume only one graph here
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      var instances = this.instances;
      let predictions = this.predictions;

      var edgeList = [];
      Object.values(instances).forEach(function(each) {
        let d3mIndex = "" + each.data.d3mIndex;
        let sourceIndex = +each.data[sourceCol];
        let targetIndex = +each.data[targetCol];
        let predictionExists = predictions[d3mIndex] === "1" ? true : false;

        if (predictionExists) {
          edgeList.push({ d3mIndex: d3mIndex,
                          source: graph.data.data.nodes[sourceIndex],
                          target: graph.data.data.nodes[targetIndex],
                          type: "predicted" });
        }
      });
      return edgeList;
    },
    numPredictedEdges() {
      if (this.predictedEdges.length >= 0) {
        return this.predictedEdges.length;
      } else {
        return null;
      }
    },
    numNodes() {
      //assume one graph
      if (_.isEmpty(this.graph_data)) return null;
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph && graph.data) {
        return graph.data.nodes;
      } else {
        return null;
      }
    },
    numEdges() {
      //assume one graph
      if (!this.graph_data.resources) return null;
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph && graph.data) {
        return graph.data.edges;
      } else {
        return null;
      }
    },
    instances() {
      return this.$store.state.socket.dataCollection;
    }
  },
  watch: {
    xLinkingHilite() {
      let hiSet = this.xLinkingHilite.set;
      let selSet = this.xLinkingSelect.set;
      d3.select("#graphlinks").select(".links").selectAll("line").each(function(d) {
        if (d.d3mIndex && (hiSet.has(d.d3mIndex) || selSet.has(d.d3mIndex)) ) {
          d3.select(this).style("stroke", "black");
        } else {
          d3.select(this).attr("style", null);
        }
      });
    },
    xLinkingSelect() {
      let hiSet = this.xLinkingHilite.set;
      let selSet = this.xLinkingSelect.set;
      d3.select("#graphlinks").select(".links").selectAll("line").each(function(d) {
        if (d.d3mIndex && (hiSet.has(d.d3mIndex) || selSet.has(d.d3mIndex)) ) {
          d3.select(this).style("stroke", "black");
        } else {
          d3.select(this).attr("style", null);
        }
      });
    },
    graph_data() {
      if (!_.isEmpty(this.graph_data) && !_.isEmpty(this.predictions)) {
        this.changed_data();
      }
    },
    predictions() {

        console.log("PREDICTIONS", this.predictions);
      if (!_.isEmpty(this.graph_data) && !_.isEmpty(this.predictions)) {
        console.log("IN HERE");
        this.changed_data();
      }
    },
    showBaseEdges() {
      //console.log(this.showBaseEdges);
      var sel = d3.select(this.$el).select('.links').selectAll('.base')
          .style("visibility", this.showBaseEdges ? "visible" : "hidden");
    },
    showPredictedEdges() {
      var sel = d3.select(this.$el).select('.links').selectAll('.predicted')
          .style("visibility", this.showPredictedEdges ? "visible" : "hidden");
    }
  },
  methods: {
    filter() {
      d3.select("svg").selectAll("");
    },
    changed_data() {
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph.data.too_large) {
        this.handleTooLarge(graph.data.data, 0, 1, []);
      } else {
        this.renderGraph(graph.data.data, 0, 1, this.predictedEdges);
      }
    },
    handleTooLarge(graph, index, num_graphs) {
      var rootel = d3.select(this.$el).select("#svgdiv");
      rootel.select("#chart" + index).remove();
      rootel.append("p").html("The graph has " + this.numNodes + " nodes and " + this.numEdges + " edges, which is too large to display.");
    },
    renderGraph(graph, index, num_graphs, predictedEdges) {
      var vueThis = this;
      var rootel = d3.select(vueThis.$el).select("#svgdiv");
      rootel.selectAll("svg").remove();
      var width = rootel.node().getBoundingClientRect().width / num_graphs;

      var rootsvg = rootel.append("svg").attr("id", "#chart" + index)
                              .attr("width", (100 / num_graphs) + "%").attr("height", "100%");
      var height = rootsvg.node().getBoundingClientRect().height;

      var tooltip = d3.select(vueThis.$el).select("#graphtooltip");

      var nodeRadius = 5;
      var edgeWidth = 2;

      var svg = rootsvg.append("g");
      rootsvg.style("cursor", "move");
      svg.style("cursor", "pointer");
      //make display zoom- and panable
      rootsvg.call(d3.zoom().on("zoom", function() {
        svg.attr("transform", d3.event.transform);
        var zoomFactor = d3.event.transform.k;
        svg.selectAll(".nodes").selectAll("circle").attr("r", nodeRadius / zoomFactor);
        svg.selectAll(".nodes").selectAll("circle").attr("stroke-width", edgeWidth / zoomFactor);
        svg.selectAll(".links").selectAll("line").attr("stroke-width", edgeWidth / zoomFactor);
      }));
      svg = svg.append("g");

      var color = d3.scaleOrdinal(d3.schemeCategory20);

      var simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))//.distance(100).strength(1))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(width / 2, height / 2));

      var link_array = [];
      graph.links.forEach(d => link_array.push(d));
      predictedEdges.forEach(d => link_array.push(d));

      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(link_array)
        .enter().append("line")
          .attr("stroke", d => d.type === "predicted" ? "#1b9e7711" : "#7570b311")
          .attr("stroke-width", edgeWidth)
          .classed("predicted", d => d.type === "predicted")
          .classed("base", d => !(d.type === "predicted"))
          .each(function(d) {
            if (d.d3mIndex) {
              d3.select(this).attr("d3mIndex", d.d3mIndex);
            }
          });

      var node = svg.append("g")
          .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
          .attr("r", nodeRadius)
          .attr("stroke-width", edgeWidth)
          .attr("fill", "#d95f02")//"#8dd3c7")
          //.attr("fill", function(d) { return color(d.group); })
          .each(function(d) {
            if (d.d3mIndex) {
              d3.select(this).attr("d3mIndex", d.d3mIndex);
            }
          })
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      node.on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 3;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 3;
        var text = "node id: " + d.id;
        var attributeArray = Object.keys(d);
        attributeArray = attributeArray.filter(function(each) {
          return each !== 'index' &&
                each !== 'x' &&
                each !== 'y' &&
                each !== 'vx' &&
                each !== 'vy' &&
                each !== 'id';
        });
        attributeArray.forEach(function(each) {
          if (d[each]) {
            text += ('<br/>' + each + ': ' + d[each]);
          }
        });
        tooltip.html(text);
        tooltip.style("left", (x) + "px")
          .style("top", (y) + "px");
        d3.select(this).style("stroke", "black");
      });
      node.on("mouseout", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0);
        d3.select(this).style("stroke", "none");
      });

      link.on("click", function(d) {
        if (d.d3mIndex) {
          if (vueThis.xLinkingSelect.set.has(d.d3mIndex)) {
            //deselect node
            store.commit("xLinkUnSelect", d.d3mIndex);
          } else {
            //select node
            store.commit("xLinkSelect", d.d3mIndex);
          }
        }
      });
      link.on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 10;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 10;
        var text = "source id: " + d.source.id +
                    "<br/>target id: " + d.target.id +
                      "<br/>d3mIndex: " + d.d3mIndex;
        var attributeArray = Object.keys(d);
        attributeArray = attributeArray.filter(function(each) {
          return each !== 'd3mIndex' &&
                each !== 'source' &&
                each !== 'target' &&
                each !== 'index' &&
                each !== 'type';
        });
        attributeArray.forEach(function(each) {
          text += ('<br/>' + each + ': ' + d[each]);
        });
        tooltip.html(text);
        tooltip.style("left", (x) + "px")
                .style("top", (y) + "px");
        if (d.d3mIndex) {
          store.commit('updateXLinking', {
            xLinkIndexes: [parseInt(d.d3mIndex)],
            highlight: true,
            visValue: true,
            visType: "graph"
          });
        } else {
          d3.select(this).style("stroke", "black");
        }
      });
      link.on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        if (d.d3mIndex) {
          store.commit('updateXLinking', {
            xLinkIndexes: [],
            highlight: false,
            visValue: false,
            visType: "graph"
          });
        } else {
          d3.select(this).attr("style", null);
        }
      });

      simulation
          .nodes(graph.nodes)
          .on("tick", ticked);

      simulation.force("link")
          //.links(graph.links);
          .links(link_array);

      var numRuns = 10;

      function ticked() {
        if (--numRuns === 0) {
          node
              .attr("cx", function(d) { return d.x = Math.min(width, d.x); })
              .attr("cy", function(d) { return d.y = Math.min(height, d.y); });
          link
              .attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });
          numRuns = 10;
        }
      }

      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.input {
  display:inline-block;
  padding-right: 10px;
  padding-left: 10px;
}

#nodesboxlabel {
  color: #d95f02;
}
#baseboxlabel {
  color: #7570b3;
}
#trainingboxlabel {
  color: #1b9e77;
}
.container {
  position: relative;
  width: 100%;
  //height: 100%;
  height: 400px;
  padding: 5px 5px 5px 5px;
}
#graphtooltip {
  position: absolute;
  text-align: center;
//  width: 60px;
//  height: 28px;
  padding: 2px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
}
</style>
