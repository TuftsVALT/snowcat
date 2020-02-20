<template>
  <svg ref="distributionChartSVG" />
</template>

<script>
import store from "@/store";
import * as d3 from "d3";

export default {
  name: "DistributionChartSVG",

  components: {
    //
  },

  props: {
    selectedAttributeText: {
      type: String,
      default: () => ""
    },

    allAttributeData: {
      type: Array,
      default: () => []
    },

    svgWidth: {
      type: Number,
      default: 150
    },

    svgHeight: {
      type: Number,
      default: 100
    }
  },

  data() {
    return {
      svg: undefined,
      chartG: undefined,
      xAxisG: undefined,
      yAxisG: undefined,
      padding: { t: 10, r: 10, b: 30, l: 40 },
      chartWidth: undefined,
      chartHeight: undefined,
      clickedSinglePublication: false
    };
  },

  computed: {
  	//
  },

  mounted: function() {
    let vm = this;

    this.svg = d3
      .select(this.$refs.distributionChartSVG)
      .attr("class", "distributionChartSVGs");

    this.chartG = this.svg.append("g");

    this.xAxisG = this.chartG
      .append("g")
      .attr("class", "x axis");

    this.yAxisG = this.chartG
      .append("g")
      .attr("class", "y axis");

    this.updateChart();
  },

  watch: {
    selectedAttributeText: function(value) {
      this.updateChart();
    },

    svgWidth: function(value) {
    	this.updateChart();
    },

    svgHeight: function(value) {
    	this.updateChart();
    }
  },

  methods: {
    updateChart() {
      let vm = this;
      let attribute = this.selectedAttributeText;
      let data = this.allAttributeData;

			if(isNaN(data[0][attribute])) {
      	this.padding = { 
      		t: this.svgHeight * 0.1,
      		r: this.svgWidth * 0.1,
      		b: this.svgHeight * 0.2,
      		l: this.svgWidth * 0.15,
      	};
      } else {
      	this.padding = { 
      		t: this.svgHeight * 0.1,
      		r: this.svgWidth * 0.1,
      		b: this.svgHeight * 0.2,
      		l: this.svgWidth * 0.15,
      	};
      }

	    this.chartWidth = this.svgWidth - this.padding.l - this.padding.r;
	    this.chartHeight = this.svgHeight - this.padding.t - this.padding.b;

	    this.svg
	      .attr("width", this.svgWidth)
	      .attr("height", this.svgHeight);

	    this.chartG.attr(
	    	"transform",
	    	"translate(" +[this.padding.l, this.padding.t] + ")"
	    );

	    this.xAxisG.attr(
	    	"transform",
	    	"translate(0, " + this.chartHeight + ")"
	    );

	    this.yAxisG.attr("transform", "translate(0, 0)");

      if(isNaN(data[0][attribute])) {
      	this.drawBarChart();
      } else {
      	this.drawHistogram();
      }
	  },

	  drawBarChart() {
      let vm = this;
      let attribute = this.selectedAttributeText;
      let data = this.allAttributeData;

      let structuredData = d3
        .nest()
        .key(d => d[attribute])
				.rollup(function(leaves) { return leaves.length; })
        .entries(data);

      let xDomain = structuredData.map(d => d.key);

      let xScale = d3
        .scaleBand()
        .domain(xDomain)
        .range([0, this.chartWidth])
        .padding(0.05);

      let yDomain = [0, d3.max(structuredData, d => d.value)];

      let yScale = d3
        .scaleLinear()
        .domain(yDomain)
        .nice()
        .range([this.chartHeight, 0]);

      let distributionBars = this.chartG
      	.selectAll(".singleDistributionBar")
      	.data(structuredData, d => d.key);

      let distributionBarsEnter = distributionBars
      	.enter()
      	.append("rect")
      	.attr("class", "singleDistributionBar");

      distributionBarsEnter
      	.merge(distributionBars)
        .attr("x", d => xScale(d.key))
      	.attr("y", d => yScale(d.value))
      	.attr("width", d => xScale.bandwidth())
      	.attr("height", d => this.chartHeight - yScale(d.value))
      	.attr("fill", "steelblue");

      distributionBars.exit().remove();

      let xAxis = d3.axisBottom(xScale);
      let yAxis = d3.axisLeft(yScale);

      this.xAxisG
        .call(xAxis)
        .selectAll("text")
        .attr("x", -5)
        .attr("y", 5)
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      let yTicks = 5;
			if (yScale.domain()[1] <= 5) {
				yTicks = yScale.domain()[1];
			}

      this.yAxisG
        .call(yAxis.ticks(yTicks));
    },

	  drawHistogram() {
      let vm = this;
      let attribute = this.selectedAttributeText;
      let data = this.allAttributeData;

      let xDomain = d3.extent(data, d => d[attribute]);

      let xScale = d3
        .scaleLinear()
        .domain(xDomain)
        .nice()
        .range([0, this.chartWidth]);

      let histogram = d3.histogram()
    		.domain(xScale.domain())
    		.thresholds(xScale.ticks(10));

      let bins = histogram(data.map(d => d[attribute]));

      let yScale = d3
        .scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([this.chartHeight, 0]);

      let distributionBars = this.chartG
      	.selectAll(".singleDistributionBar")
      	.data(bins, d => d.x0);

      let distributionBarsEnter = distributionBars
      	.enter()
      	.append("rect")
      	.attr("class", "singleDistributionBar");

      distributionBarsEnter
      	.merge(distributionBars)
      	.attr("x", d => xScale(d.x0) + 1)
      	.attr("y", d => yScale(d.length))
      	.attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      	.attr("height", d => yScale(0) - yScale(d.length))
      	.attr("fill", "steelblue");

      distributionBars.exit().remove();

      let xAxis = d3.axisBottom(xScale);
      let yAxis = d3.axisLeft(yScale);

      this.xAxisG
        .call(xAxis.ticks(5))
        .selectAll("text")
        .attr("x", -5)
        .attr("y", 5)
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      this.yAxisG
        .call(yAxis.ticks(5));
    }
  }
};
</script>

<style>
.x.axis line,
.x.axis path,
.y.axis line,
.y.axis path {
  display: none;
}

.hline {
  stroke: #eee;
  stroke-width: 2px;
}
</style>
