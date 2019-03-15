<template>
  <b-card sub-title="Graph Matching"
          tag="article"
          style="max-width: 20rem;"
          class="mb-2">
    <svg id="chart1" width="100%" height="50%"></svg>
    <svg id="chart2" width="100%" height="50%"></svg>
  </b-card>
</template>


<script>
var d3 = require('d3v4');
var papa = require("papaparse");
export default {
  name: 'GraphMatchingModelOutput',
  props: ['modelOutputData', 'modelOutputUri'],
  data: function () {
    return {
    }
  },
  created: function () {
    console.log("graph model out created")
    //load graph data
    var files = this.$store.state.evaluationConfig.graph_files;
    for (var i = 0; i < files.length; i++) {
      this.$store.dispatch('loadGraphData', files[i]);
    }
  },
  computed: {
    graph_data() {
      return this.$store.state.networkData;
    },
    predictions() {
      //How do I know which model I am?
      return this.$store.state.models[0].data.data;
    }
  },
  watch: {
    graph_data: function() {
      if (this.graph_data[0] && this.graph_data[1]) {
        this.renderGraph("#chart1", this.graph_data[0].data, this.predictions.data);
        this.renderGraph("#chart2", this.graph_data[1].data, this.predictions.data);
      }
    },
    predictions: function() {
      if (this.graph_data[0] && this.graph_data[1]) {
        this.renderGraph("#chart1", this.graph_data[0], this.predictions);
        this.renderGraph("#chart2", this.graph_data[1], this.predictions);
      }
    }
  },
  methods: {
    renderGraph: function(target, graph, predictions) {
      var svg = d3.select(this.$el).select(target);
      var width = svg.node().getBoundingClientRect().width;
      var height = svg.node().getBoundingClientRect().height;

      //svg = svg.append("g");
      //make display zoom- and panable
      svg.call(d3.zoom().on("zoom", function() {
        svg.attr("transform", d3.event.transform);
      }));
      svg = svg.append("g");

      var color = d3.scaleOrdinal(d3.schemeCategory20);

      var simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))//.distance(100).strength(1))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(width / 2, height / 2));

      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
          .attr("stroke", d => d.predicted ? "#1b9e7711" : "#7570b311")
          .attr("stroke-width", d => d.predicted ? 2 : 2)
          .classed("predicted", d => d.predicted)
          .classed("regular", d => !d.predicted);

      var node = svg.append("g")
          .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
          .attr("r", 5)
          .attr("fill", "#d95f02")//"#8dd3c7")
          //.attr("fill", function(d) { return color(d.group); })
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      node.append("title")
          .text(function(d) { return d.id; });

      simulation
          .nodes(graph.nodes)
          .on("tick", ticked);

      simulation.force("link")
          .links(graph.links);

      function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
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
</style>
