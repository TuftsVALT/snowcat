<template>
  <div class="tableBase" id="tableBaseId" v-bind:style="styleObject"></div>
</template>

<script>
import store from "@/store";
import * as d3v3 from "d3v3";
import * as d3 from "d3";
import $ from "jquery";

export default {
  name: "TableBase",

  props: {
    baseData: Array
  },

  data: () => ({
    styleObject: {
      display: "flex",
      // fontSize: "25px",
      padding: "10px",
      width: "100%",
      height: "100%"
    }
  }),

  mounted: function() {
    let vm = this;
    console.log(" table base checkout ", this.baseData);
  },

  watch: {
    baseData: function(value) {
      console.log("checking base data in table base ", value);
      this.makeTable(value, "tableBaseId");
    }
  },

  methods: {
    makeTable(data, containerId = "tableBaseId") {
      // console.log("calling make table ", containerId, data, d3v3);
      $("#" + containerId).empty();
      var color_scale = d3v3.scale
        .linear()
        .domain([0, 1])
        .range(["red", "blue"]);

      var vc = 15;

      var sortAscending = true;
      var table = d3v3
        .select("#" + containerId)
        .insert("table", ":first-child")
        .attr("id", "dataViewAppTable_" + containerId)
        // .attr("class", "dataViewAppTable mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp")
        .attr("class", "dataViewAppTablep")
        .attr("width", "100%");
      // .attr("height", "100%")
      // .attr("margin-top", "10px")

      var titles = d3v3.keys(data[0]);
      //get back id
      // var index = titles.indexOf('id')
      // titles.splice(index, 1)
      titles.sort();
      // console.log("titiles is ", titles);
      var headers = table
        .append("thead")
        .append("tr")
        .selectAll("th")
        .data(titles)
        .enter()
        .append("th")
        .attr("class", "fixedHeader")
        .attr("id", function(d, i) {
          return "fixHead_" + d;
        })
        // .attr('class', 'mdl-data-table__cell--non-numeric')
        .text(function(d) {
          return d;
        })
        .style("color", "black")
        .style("background", "white");

      var rows = table
        .append("tbody")
        .attr("class", "scrollContent")
        .selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("class", function(d, i) {
          return "trTable " + containerId + "_trCl_" + i;
        })
        .attr("id", function(d) {
          // return containerId + '_tr_' + d.id;
          return "tr_" + d.id;
        })
        // .style('background', function(d) {
        //     return 'white'
        // })
        .style("height", "40px");

      rows
        .selectAll("td")
        .data(function(d) {
          return titles.map(function(k) {
            return {
              value: d[k],
              name: k,
              id: d["id"]
            };
          });
        })
        .enter()
        .append("td")
        .attr("data-th", function(d) {
          return d.name;
        })
        .attr("data-id", function(d) {
          return d.id;
        })
        .attr("parent", function(d) {
          return d.value;
        })
        .attr("class", function(d) {
          // return 'td_' + d.value + ' td_' + d.name + ' td_' + d.name + '_' + d.value;
        })
        .text(function(d) {
          return d.value;
        });
    }
  }
};
</script>

<style scoped>
body{
  overflow: hidden;
}

tr{
  max-height: 50px;
  /*height: 5px;*/
}

tr:nth-of-type(odd) {
  /* background: #eee; */
    background: white;
}

tr:nth-of-type(even) {
    background: #F8F8F8;
    /*height: 10px;*/
}

th {
    background: #333;
    color: white;
    /* color: black; */
    font-weight: bold;
    /* cursor: s-resize; */
    cursor: grab;
    background-repeat: no-repeat;
    background-position: 3% center;
}

td,
th {
    padding: 6px;
    border-bottom: 1px solid #ccc;
    text-align: left;
    /*font-size: 1em;*/
    max-height: 10px;
}

th.des:after {
    content: "\21E9";
}

th.aes:after {
    content: "\21E7";
}

tr:hover{
    /* background: #00BCD4; */
    /* background: white; */
    /* color: blue; */
}

.tableBase{
  overflow: auto;
  max-height: 500px;
}

.tablebaselowbar{
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
  height: 50px;
  padding: 5px;
  border-top: 1px solid lightgray;
  /* background: yellow; */
}

.tablemovebtn
{
  width: 30px;
  height: 30px;
  display: flex;
}

.attrbtndiv{
  display: flex;
  flex-direction: row-reverse;
  width: 70%;
  height: 50px;
  padding: 5px;
  border-left: 1px solid lightgray;
  /* background: yellow; */
  align-items: center;
}
</style>
