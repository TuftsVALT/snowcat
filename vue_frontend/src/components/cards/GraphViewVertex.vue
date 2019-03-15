<template>
  <div class="container">
    <div class="container vertexnominationgraph" id="svgdiv"></div>
    <div id="graphtooltip" style="opacity: 0;">
    </div>
  </div>
</template>

<script>
var d3 = require("d3");//d3v5 by default
import store from '@/store';

export default {
  name: 'GraphViewVertex',
  // predictions: object: d3mIndex -> label
  // graph_data: graph data from the backend
  // id_map: nodeID (for vert. nom.) -> d3mIndex
  props: ["predictions", "graph_data", "id_map", "isGoldData"],
  mounted: function() {
    this.changed_data();
  },
  data: function () {
    return {
      config: this.$store.state.socket.evaluationConfig,
      showBaseEdges: true,
      showTrainingEdges: true,
      nodeRadius: 5,
      nodeRadiusMarked: 20,
      edgeRadius: 2,
      zoomFactor: 1.0
    }
  },
  computed: {
    taskType() {
      return this.$store.state.socket.rawProblemDesc.about.taskType;
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
    show_alt_text() {
      return false;
    },
    numNodes() {
      //assume one graph
      if (_.isEmpty(this.graph_data)) return '?';
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph && graph.data) {
        return graph.data.nodes;
      } else {
        return '?';
      }
    },
    numEdges() {
      //assume one graph
      if (!this.graph_data.resources) return '?';
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph && graph.data) {
        return graph.data.edges;
      } else {
        return '?';
      }
    },
    labels() {
      if (!_.isEmpty(this.predictions)) {
        var labelSet = new Set(Object.values(this.predictions));
        return Array.from(labelSet).sort();
      }
      return [];
    },
    label_colors() {
      var colors = { };
      this.labels.forEach(function(label, i) {
        colors[label] = d3.schemeCategory10[i];
      });
      return colors;
    },
  },
  watch: {
    zoomFactor() {
      this.zoomFunction();
    },
    xLinkingHilite() {
      // console.log("graph: hilite received: ", this.xLinkingHilite);
      var hiliteSet = this.xLinkingHilite.set;
      var vueThis = this;
      var nodes = d3.selectAll(".node").each(function(d) {
        var thisNode = d3.select(this);
        var d3mIndex = vueThis.d3mIndexFromNode(d);
        if (hiliteSet.has(d3mIndex)) {
          //is this node in the selection set?
          if (!thisNode.classed("hilited")) {
            //is this node already selected?
            thisNode.classed("hilited", true);
          }
          var node = d3.select(this).node();
          node.parentNode.appendChild(node);
        } else {
          if (thisNode.classed("hilited")) {
            //unselect
            thisNode.classed("hilited", false);
          }
        }
        vueThis.zoomFunction();
      });
    },
    xLinkingSelect() {
      var selectionSet = this.xLinkingSelect.set;
      var vueThis = this;
      var nodes = d3.selectAll(".node").each(function(d) {
        var thisNode = d3.select(this);
        var d3mIndex = vueThis.d3mIndexFromNode(d);
        if (selectionSet.has(d3mIndex)) {
          //is this node in the selection set?
          if (!thisNode.classed("selected")) {
            //is this node already selected?
            thisNode.classed("selected", true);
          }
          var node = d3.select(this).node();
          node.parentNode.appendChild(node);
        } else {
          if (thisNode.classed("selected")) {
            //unselect
            thisNode.classed("selected", false);
          }
        }
        vueThis.zoomFunction();
      });
    },
    graph_data: function() {
      if (!_.isEmpty(this.graph_data)) {
        this.changed_data();
      }
    },
    predictions: function() {
      if (!_.isEmpty(this.graph_data)) {
        this.changed_data();
      }
    },
  },
  methods: {
    handleLegend() {
      let vueThis = this;
      let rootel = d3.select(this.$el).select("svg");
      var legend = rootel.append("g").attr("transform", "translate(10, 10)");
      var nodesGroup = legend.append("g");
      nodesGroup.append("text").text(+this.numNodes + " nodes").attr("x", 0).attr("y", 9);
      var edgesGroup = legend.append("g").attr("transform", "translate(0, 20)");
      edgesGroup.append("text").text(+this.numEdges + " edges").attr("x", 0).attr("y", 9);
      var labelsGroup = legend.append("g").attr("transform", "translate(0, 30)");
      let labels = this.labels.map(d => d);
      labels.unshift("none");

      let thingsToPredict = "classes:";
      if (this.taskType === "communityDetection") thingsToPredict = "communities:";
      if (this.taskType === "graphClustering") thingsToPredict = "clusters:";

      labelsGroup.append("text").attr("x", 0).attr("y", 28).text(thingsToPredict);
      labels.forEach(function(d, i) {
        labelsGroup.append("rect").attr("x", 1).attr("y", 20 * i + 40)
                  .attr("width", 8).attr("height", 8).style("fill", vueThis.label_colors[d]);
        labelsGroup.append("text").attr("x", 22).attr("y", 20 * i + 48).text(d);
      });
    },
    handleVertexNominations() {
      let vueThis = this;
      d3.select(this.$el).selectAll(".node")
        .attr("fill", function(d) {
          let label = vueThis.labelFromNode(d);
          return vueThis.label_colors[label];
        })
    },
    zoomFunction() {
      var svg = d3.select("#zoomgroup");
      svg.selectAll(".nodes").selectAll("circle").attr("r", this.nodeRadius / this.zoomFactor);
      //svg.selectAll(".nodes").selectAll("circle").attr("stroke-width", this.edgeWidth / this.zoomFactor);
      svg.selectAll(".links").selectAll("line").attr("stroke-width", this.edgeWidth / this.zoomFactor);
      //handle hilited and selected nodes
      svg.selectAll(".nodes").selectAll(".selected").attr("r", this.nodeRadiusMarked / this.zoomFactor);
      svg.selectAll(".nodes").selectAll(".hilited").attr("r", this.nodeRadiusMarked / this.zoomFactor);
    },
    labelFromNode(graphNode) {
      var d3mIndex = this.d3mIndexFromNode(graphNode);
      return this.getLabel(d3mIndex);
    },
    getNodeId(graphNode) {
      if (graphNode.nodeID !== undefined) {
        return "" + graphNode.nodeID;
      } else if (graphNode.label !== undefined) {
        return "" + graphNode.label;
      } else if (graphNode[this.graph_data.nodeIdColumn] !== undefined) {
        return "" + graphNode[this.graph_data.nodeIdColumn];
      } else {
        console.log("no id found for node", graphNode);
        throw "node has neither nodeID nor label nor " + this.graph_data.nodeIdColumn + " attribute";
      }
    },
    d3mIndexFromNode(graphNode) {
      // console.log("GRAPH NODE", graphNode, this.getNodeId(graphNode), this.id_map);
      let d3mIndex = this.id_map[this.getNodeId(graphNode)];
      if (!d3mIndex) {
        // hacky: fix DARPA's off-by-one bug
        try {
          d3mIndex = this.id_map[""+(parseInt(this.getNodeId(graphNode))+1)];
        } catch(error) {
          // do nothing, off-by-one is not the problem, so just fail
        }
      }
      if (d3mIndex) {
        return d3mIndex;
      } else {
        throw "no d3mIndex for node " + this.getNodeId(graphNode);
      }
    },
    getLabel: function(d3mIndex) {
      let preds = this.predictions;
      var index = "" + d3mIndex;
      let label = this.predictions[index];
      if (!label) {
        console.log("WARNING: label for ", d3mIndex, label);
      }
      return label;
    },
    filter: function() {
      d3.select("svg").selectAll("");
    },
    changed_data: function() {
      // console.log("GRAPH_DATA in changed_data", this.graph_data);
      var graph = this.graph_data.resources[Object.keys(this.graph_data.resources)[0]];
      if (graph.data.too_large) {
        this.handleTooLarge(graph.data.data, 0, 1);
      } else {
        this.renderGraph(graph.data.data, 0, 1);
        this.handleLegend();
        this.handleVertexNominations();
      }
    },
    handleTooLarge: function(graph, index) {
      var rootel = d3.select(this.$el).select("#svgdiv");
      rootel.select("#chart" + index).remove();
      rootel.append("p").html("The graph has " + this.numNodes + " nodes and " + this.numEdges + " edges, which is too large to display.");
    },
    renderGraph: function(graph, index, num_graphs) {
      var d3mMap = this.id_map; //to avoid this confusion
      var vueThis = this;
      var rootel = d3.select(vueThis.$el).select("#svgdiv");
      rootel.selectAll("svg").remove();
      var width = rootel.node().getBoundingClientRect().width / num_graphs;

      var rootsvg = rootel.append("svg").attr("id", "#chart" + index)
                              .attr("width", (100 / num_graphs) + "%").attr("height", "100%");
      var height = rootsvg.node().getBoundingClientRect().height;

      var tooltip = d3.select(vueThis.$el).select("#graphtooltip");

      var svg = rootsvg.append("g").attr("id", "zoomgroup");
      rootsvg.style("cursor", "move");
      svg.style("cursor", "pointer");
      //make display zoom- and panable
      rootsvg.call(d3.zoom().on("zoom", () => {
        vueThis.zoomFactor = d3.event.transform.k;
        svg.attr("transform", d3.event.transform);
      }));
      svg = svg.append("g");

      var color = d3.scaleOrdinal(d3.schemeCategory20);

      var simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.nodeID; }))//.distance(100).strength(1))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(width / 2, height / 2));

      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
          .attr("stroke", "#BBBBBB55")
          .attr("stroke-width", vueThis.edgeWidth);

      var node = svg.append("g")
          .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
          .classed("node", true)
          .attr("r", vueThis.nodeRadius)
          .attr("stroke-width", vueThis.edgeWidth)
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      node.on("click", function(d) {
        var d3mIndex = vueThis.d3mIndexFromNode(d)
        if (vueThis.xLinkingSelect.set.has(d3mIndex)) {
          //deselect node
          store.commit("xLinkUnSelect", d3mIndex);
        } else {
          //select node
          store.commit("xLinkSelect", d3mIndex);
        }
      })

      node.on("mouseover", function(d) {
        tooltip.transition().duration(200).style("opacity", .9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 10;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 10;
        var d3mIndex = d.d3mIndex ? d.d3mIndex : d3mMap[""+d.nodeID];
        var text = "node id: " + d.nodeID + "<br/>d3mIndex: " + d3mIndex;
        var attributeArray = Object.keys(d);
        attributeArray = attributeArray.filter(function(each) {
          return each !== 'd3mIndex' &&
                each !== 'index' &&
                each !== 'x' &&
                each !== 'y' &&
                each !== 'vx' &&
                each !== 'vy' &&
                each !== 'id';
        });
        attributeArray.forEach(function(each) {
          text += ('<br/>' + each + ': ' + d[each]);
        });
        tooltip.html(text);
        tooltip.style("left", (x) + "px")
          .style("top", (y) + "px");
        //d3.select(this).classed("hilited", true);
        store.commit('updateXLinking', {
          xLinkIndexes: [parseInt(d3mIndex)],
          highlight: true,
          visValue: true,
          visType: "graph"
        });
        //vueThis.zoomFunction();
      });
      node.on("mouseout", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0);
        //d3.select(this).classed("hilited", false);
        store.commit('updateXLinking', {
          xLinkIndexes: [],
          highlight: false,
          visValue: false,
          visType: "graph"
        });
        //vueThis.zoomFunction();
      });

      link.on("mouseover", function(d) {
        tooltip.transition().duration(200).style("opacity", .9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 3;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 3;
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
        d3.select(this).classed("hilited", true);
        vueThis.zoomFunction();
      });
      link.on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this).classed("hilited", false);
        vueThis.zoomFunction();
      });

      simulation.nodes(graph.nodes).on("tick", ticked);
      simulation.force("link").links(graph.links);

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
<style>
  .vertexnominationgraph .selected {
    stroke: black;
  }
</style>
