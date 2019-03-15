<template>
  <div class="container" id="graphmatch">
    <div class="container" id="svgdiv"></div>
    <div id="graphtooltip" style="opacity: 0;">
    </div>
  </div>
</template>

<script>
var d3 = require('d3');//d3v5 by default
import store from '@/store';

export default {
  name: 'GraphViewMatch',
  props: ["predictions", "graph_data", "id_map", "isGoldData"],
  mounted: function () {
    this.changed_data();
  },
  beforeDestroy() {
    if (this.simulation) { this.simulation.stop(); }
  },
  data() {
    return {
      config: this.$store.state.socket.evaluationConfig,
      simulation: undefined
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
    numMatches() {
      return Object.keys(this.predictedMatches).length / 2;
    },
    predictedMatches () {
      if (_.isEmpty(this.graph_data) ||
          _.isEmpty(this.instances) ||
          _.isEmpty(this.predictions)) return {};

      let predictionTarget = this.graph_data.predictionTarget;
      let sourceCol = this.graph_data.sourceID;
      let sourceRes = this.graph_data.sourceRes;
      let targetCol = this.graph_data.targetID;
      let targetRes = this.graph_data.targetRes;

      // assume only two graphs here
      // nodes in the graph are simply matched to a d3mIndex
      let instances = this.instances;
      let predictions = this.predictions;

      var mappings = {};
      mappings[this.graph_keys[0]] = {};
      mappings[this.graph_keys[1]] = {};
      Object.values(instances).forEach(function (each) {
        let d3mIndex = each.data.d3mIndex;
        let sourceIndex = each.data[sourceCol];
        let targetIndex = each.data[targetCol];
        // let matches = +each.data[predictionTarget];
        let matches = predictions[d3mIndex];
        if (d3mIndex && sourceIndex && targetIndex) {
          mappings[sourceRes][sourceIndex] = { d3mIndex: d3mIndex, matches: (matches === 1 || matches === "1") };
          mappings[targetRes][targetIndex] = { d3mIndex: d3mIndex, matches: (matches === 1 || matches === "1") };
        }
      })
      return mappings;
    },
    graph_keys() {
      if (_.isEmpty(this.graph_data)) return null;
      var keys = Object.keys(this.graph_data.resources);
      keys.sort();
      return keys;
    },
    numNodes() {
      // assume two graphs
      if (_.isEmpty(this.graph_data)) return '?';
      var results = { };
      results[this.graph_keys[0]] = '?';
      results[this.graph_keys[1]] = '?';

      for (var key in results) {
        var graph = this.graph_data.resources[key];
        if (graph && graph.data) {
          results[key] = graph.data.nodes;
        }
      }
      return results;
    },
    numEdges() {
      // assume two graphs
      if (_.isEmpty(this.graph_data)) return '?';
      var results = { };
      results[this.graph_keys[0]] = '?';
      results[this.graph_keys[1]] = '?';

      for (var key in results) {
        var graph = this.graph_data.resources[key];
        if (graph && graph.data) {
          results[key] = graph.data.edges;
        }
      }
      return results;
    },
    instances() {
      return this.$store.state.socket.dataCollection;
    }
  },
  watch: {
    xLinkingHilite() {
      let selSet = this.xLinkingSelect.set;
      let hiSet = this.xLinkingHilite.set;
      d3.select("#graphmatch").selectAll(".d3mObject").each(function(d) {
        if (selSet.has(d.d3mIndex) || hiSet.has(d.d3mIndex)) {
          d3.select(this).style("stroke", "black");
          var node = d3.select(this).node();
          node.parentNode.appendChild(node);
        } else {
          d3.select(this).style("stroke", "none");
        }
      });
    },
    xLinkingSelect() {
      let selSet = this.xLinkingSelect.set;
      let hiSet = this.xLinkingHilite.set;
      d3.select("#graphmatch").selectAll(".d3mObject").each(function(d) {
        if (selSet.has(d.d3mIndex) || hiSet.has(d.d3mIndex)) {
          d3.select(this).style("stroke", "black");
          var node = d3.select(this).node();
          node.parentNode.appendChild(node);
        } else {
          d3.select(this).style("stroke", "none");
        }
      });
    },
    graph_data() {
      if (!_.isEmpty(this.graph_data) && !_.isEmpty(this.instances) && !_.isEmpty(this.predictions)) {
        this.changed_data();
      }
    },
    instances() {
      if (!_.isEmpty(this.graph_data) && !_.isEmpty(this.instances) && !_.isEmpty(this.predictions)) {
        this.changed_data();
      }
    },
    predictions() {
      if (!_.isEmpty(this.graph_data) && !_.isEmpty(this.instances) && !_.isEmpty(this.predictions)) {
        this.changed_data();
      }
    }
  },
  methods: {
    changed_data() {
      let num_graphs = 2;
      let keys = this.graph_keys;
      for (let i = 0; i < 2; i++) {
        var graph = this.graph_data.resources[keys[i]];
        if (graph.data.too_large) {
          this.handleTooLarge(graph.data.data, i, keys[i], 2);
          // one graph is too large, display none of them and shoe message
          return;
        }
      }
      for (let i = 0; i < 2; i++) {
        console.log("this.graph_data", this.graph_data, this.graph_keys);
        var graph = this.graph_data.resources[keys[i]];
        console.log("GRAPH", graph);
        if (!_.isEmpty(graph)) {
          this.renderGraph(graph.data.data, i, 2, this.predictedMatches[keys[i]]);
        }
      }
    },
    handleTooLarge(graph, index, key, num_graphs) {
      var rootel = d3.select(this.$el).select("#svgdiv");
      rootel.selectAll("svg").remove();
      rootel.append("p").html("Graph " + (index + 1) + " has " + this.numNodes[key] + " nodes and " + this.numEdges[key] + " edges, which is too large to display.");
    },
    renderGraph(graph, index, num_graphs, mapping) {
      var vueThis = this;
      var rootel = d3.select(vueThis.$el).select('#svgdiv');
      rootel.selectAll("#chart" + index).remove();
      var width = rootel.node().getBoundingClientRect().width / num_graphs;

      var rootsvg = rootel.append('svg').attr('id', 'chart' + index)
                              .attr('width', ( (100 / num_graphs) - (0.4 * num_graphs) ) + '%').attr('height', (100 - 0.4 * num_graphs) + '%');
      rootsvg.style("border-style", "solid");
      rootsvg.style("border-color", "gray");
      rootsvg.style("border-width", "1px");
      rootsvg.style("margin", "0.15%");
      var height = rootsvg.node().getBoundingClientRect().height;

      var tooltip = d3.select(vueThis.$el).select('#graphtooltip');

      var legend = rootsvg.append('g').attr('transform', 'translate(10, 10)');
      var nodesGroup = legend.append('g');
      nodesGroup.append('text').text(+this.numNodes[index] + ' nodes').attr('x', 13).attr('y', 9);
      var edgesGroup = legend.append('g').attr('transform', 'translate(0,20)');
      edgesGroup.append('text').text(+this.numEdges[index] + ' edges').attr('x', 13).attr('y', 9);
      var matchesGroup = legend.append('g').attr('transform', 'translate(0,40)');
      matchesGroup.append('text').text(+(Object.keys(vueThis.predictedMatches[vueThis.graph_keys[index]]).length) + ' matches').attr('x', 13).attr('y', 9);
      let colorGroup = legend.append("g").attr('transform', 'translate(0,70)');
      colorGroup.append("circle").attr("cx", 20).attr("cy", 5).attr("r", 7).style("fill", "lightblue");
      colorGroup.append("text").attr("x", 32).attr("y", 9).text("matched node");
      colorGroup.append("circle").attr("cx", 20).attr("cy", 25).attr("r", 7).style("fill", "#d95f02");
      colorGroup.append("text").attr("x", 32).attr("y", 29).text("unmatched node");

      var initialZoomLevel = 50 / ( this.numNodes[index] );
      var nodeRadius = 30;
      var edgeWidth = 15;

      var zoomgroup = rootsvg.append('g');
      rootsvg.style('cursor', 'move');
      zoomgroup.style('cursor', 'pointer');
      // make display zoom- and panable
      var zoom = d3.zoom();
      rootsvg.call(zoom.on('zoom', function () {
        zoomgroup.attr('transform', d3.event.transform);
        var zoomFactor = d3.event.transform.k;
        zoomgroup.selectAll('.nodes').selectAll('circle').attr('r', initialZoomLevel * (nodeRadius / zoomFactor));
        zoomgroup.selectAll('.nodes').selectAll('circle').attr('stroke-width', initialZoomLevel * (edgeWidth / zoomFactor));
        zoomgroup.selectAll('.links').selectAll('line').attr('stroke-width', initialZoomLevel * (edgeWidth / zoomFactor));
      }))
      // set initial zoom level
      zoom.scaleTo(rootsvg, initialZoomLevel);
      var svg = zoomgroup.append('g');

      var color = d3.scaleOrdinal(d3.schemeCategory20);

      vueThis.simulation = d3.forceSimulation()
          .force('link', d3.forceLink().id(function (d) { return d.id }))// .distance(100).strength(1))
          .force('charge', d3.forceManyBody())
          .force('center', d3.forceCenter(width / 2, height / 2));

      var link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter().append('line')
          .attr('stroke', '#00000011')
          .attr('stroke-width', edgeWidth)
          .each(function (d) {
            if (d.d3mIndex) {
              d3.select(this).attr('d3mIndex', d.d3mIndex)
            }
          });

      var node = svg.append('g')
          .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
          .attr('r', nodeRadius)
          .attr('stroke-width', edgeWidth)
          .attr('fill', '#d95f02')// "#8dd3c7")
          // .attr("fill", function(d) { return color(d.group); })
          .each(function (d) {
            if (d.d3mIndex) {
              d3.select(this).attr('d3mIndex', d.d3mIndex);
            }
            var inst = mapping[d.nodeID];
            if (inst) {
              d.d3mIndex = inst.d3mIndex;
              d3.select(this).attr('d3mIndex', d.d3mIndex)
                              .classed('d3mObject', true)
                              .classed("mapped", true)
                              .attr('fill', inst.matches ? 'lightblue' : '#d95f02');
            }
          })
          .call(d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));

      node.on('mouseover', function (d) {
        if (d.d3mIndex) {
          //vueThis.highlight(d3.select(this).attr('d3mIndex'))
          store.commit('updateXLinking', {
            xLinkIndexes: [parseInt(d.d3mIndex)],
            highlight: true,
            visValue: true,
            visType: "graph"
          });
        } else {
          d3.select(this).style('stroke', 'black');
        }
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 15;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 15;
        var text = "";
        var attributeArray = Object.keys(d)
        attributeArray = attributeArray.filter(function (each) {
          return each !== 'index' &&
                each !== 'x' &&
                each !== 'y' &&
                each !== 'vx' &&
                each !== 'vy';
        })
        attributeArray.forEach(function (each) {
          text += ('<br/>' + each + ': ' + d[each]);
        })
        tooltip.html(text);
        tooltip.style('left', (x) + 'px')
          .style('top', (y) + 'px');
      })
      node.on('mouseout', function (d) {
        if (d3.select(this).attr('d3mIndex')) {
          //vueThis.unhighlight(d3.select(this).attr('d3mIndex'))
          store.commit('updateXLinking', {
            xLinkIndexes: [],
            highlight: false,
            visValue: false,
            visType: "graph"
          });
        } else {
          d3.select(this).style('stroke', 'none');
        }
        tooltip.transition()
          .duration(200)
          .style('opacity', 0);
      })
      node.on("click", function(d) {
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

      link.on('mouseover', function (d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        var x = d3.event.clientX - rootsvg.node().getBoundingClientRect().x + (index * width) + 15;
        var y = d3.event.clientY - rootsvg.node().getBoundingClientRect().y + 15;
        var text = 'source id: ' + d.source.id +
                    '<br/>target id: ' + d.target.id;
        var attributeArray = Object.keys(d);
        attributeArray = attributeArray.filter(function (each) {
          return each !== 'source' &&
                each !== 'target' &&
                each !== 'index' &&
                each !== 'type';
        })
        attributeArray.forEach(function (each) {
          text += ('<br/>' + each + ': ' + d[each]);
        })
        tooltip.html(text);
        tooltip.style('left', (x) + 'px')
                .style('top', (y) + 'px');
        d3.select(this).style('stroke', 'black');
      })
      link.on('mouseout', function (d) {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
        d3.select(this).attr('style', null);
      })

      vueThis.simulation
          .nodes(graph.nodes)
          .on('tick', ticked);

      vueThis.simulation.force('link')
          .links(graph.links);

      var numRuns = 10;

      function ticked() {
        if (--numRuns === 0) {
          node
              .attr("cx", function(d) { return d.x = d.x;})//Math.min(width, d.x); })
              .attr("cy", function(d) { return d.y = d.y;});//Math.min(height, d.y); });
          link
              .attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });
          numRuns = 10;
        }
      }

      function dragstarted (d) {
        if (!d3.event.active) vueThis.simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged (d) {
        d.fx = d3.event.x
        d.fy = d3.event.y
      }

      function dragended (d) {
        if (!d3.event.active) vueThis.simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
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
  height: 600px;
  padding: 0px 0px 0px 0px;
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
