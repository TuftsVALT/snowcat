<style scoped>

#raw-data {
    background: gray;
}

#tabulartooltip {
    position: absolute;
    text-align: center;
    //width: 60px;
    //height: 28px;
    padding: 6px;
    font: 12px sans-serif;
    color: white;
    background: grey;
    border: 2px;
    border-radius: 4px;
    pointer-events: none;
}

.histogram-card {
  padding: 6px !important;
}

.histogram-container {
  overflow: hidden;
}

.hidden-chart {
  height: 5px;
}

.shown-chart {
  height: 100%;
}

</style>

<template>

<div>
    <div>
        <!-- <v-progress-circular v-if="show_spinner" indeterminate v-bind:size="50" color="primary"></v-progress-circular> -->
        <p v-if="show_spinner">No data available</p>
    </div>
    <div id="tabulartooltip" style="opacity: 0;">
    </div>
  <draggable @start="drag=true" @end="drag=false" :options="{ 'handle': '.drag-handle' }" class="drag-container layout row wrap">
         <v-flex
          v-for="index in participatingFieldsMetaDataRange"
          :key="'card-'+index"
          class="histogram-card"
        >
            <v-toolbar height='40px' flat>
              <v-toolbar-title dense center>{{tabular_data[participatingFieldsMetaData[index][0]][0]}}</v-toolbar-title>

              <v-layout flex align-center>
              </v-layout>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>

              <v-layout flex pr-0 justify-end>
                <v-btn title="Hold to drag card" bottom class="drag-handle" icon>
                  <v-icon class="drag-handle">reorder</v-icon>
                </v-btn>
                <template v-if="hiddenCharts[index]">
                  <v-btn title="Show plot" bottom @click.native='revealChart(index)' class="show" icon>
                    <v-icon class="minimizer">maximize</v-icon>
                  </v-btn>
                </template>
                <template v-else>
                  <v-btn title="Minimize plot" bottom @click.native='hideChart(index)' class="minimize" icon>
                    <v-icon class="minimizer">minimize</v-icon>
                  </v-btn>
                </template>
              </v-layout>


            </v-toolbar>
                <div :class="{'hidden-chart': hiddenCharts[index],  'shown-chart': !hiddenCharts[index], 'histogram-container': true}" :ref="'histogram' + index"></div>
          </v-card>
        </v-flex>
    </draggable>
</div>

</template>

<script>

var d3 = require("d3v3");
import draggable from 'vuedraggable';
import store from '@/store';
import _ from 'lodash';
//var d3 = require("d3v4");
export default {
    name: 'TabularDataView',
    components: { draggable },
    mounted: function() {
        if (!_.isEmpty(this.tabular_data)) {
            this.rawDataHistogramVisualization(this.$store.state.socket.tabularProcessedData.participatingFieldsMetaData, this.$store.state.socket.tabularProcessedData.histogramMetaDataArray, this.$store.state.socket.tabularProcessedData.histogramBarCountsArray, this.$store.state.socket.tabularProcessedData.histogramBarNamesArray, this.$store.state.socket.tabularProcessedData.histogramCountsArray, this.$store.state.socket.tabularProcessedData.barRelationsArray, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
        }
    },
    data: function() {
        return {
          totalWidth: 410,
          totalHeight: 210,
          top: 40,
          right: 30,
          bottom: 30,
          left: 50,
          hiddenCharts: {}
        };
    },
    computed: {
        participatingFieldsMetaData() {
          return this.$store.state.socket.tabularProcessedData.participatingFieldsMetaData;
        },
        participatingFieldsMetaDataRange() {
          if (this.participatingFieldsMetaData) {
            return _.range(this.participatingFieldsMetaData.length);
          } else {
            []
          }
        },
        show_spinner() {
                return _.isEmpty(this.tabular_data);
        },
        tabular_data() {
                return this.$store.state.socket.tabularProcessedData.histogramMetaDataArray;
        },
        xlink_data(){
                return this.$store.state.socket.xLinking.highlight;
        },
        xlink_graph_data(){
                return this.$store.state.socket.xLinking.visType.graph;
        },
        xlink_collaborative_filtering_model_data(){
                return this.$store.state.socket.xLinking.visType.collaborativeFiltering;
        },
        xlink_confusion_matrix_model_data(){
                return this.$store.state.socket.xLinking.visType.confusionMatrixModel;
        },
        xlink_text_data(){
                return this.$store.state.socket.xLinking.visType.text;
        },
        xlink_raw_table_data(){
                return this.$store.state.socket.xLinking.visType.rawTable;
        },
        xlink_raw_table_data_for_row_to_row(){
                return this.$store.state.socket.xLinking.xLinkIndexes;
        },
        xlink_residualChartModel_model_data(){
                return this.$store.state.socket.xLinking.visType.residualChartModel;
        },
        xlink_audio_data(){
                return this.$store.state.socket.xLinking.visType.audio;
        },
        xlink_video_data(){
                return this.$store.state.socket.xLinking.visType.video;
        }
    },
    watch: {
        tabular_data: function() {
            this.$nextTick(() => {
              Object.keys(this.$refs).forEach((name) => {
                if (name.startsWith("histogram")) {
                  d3.select(this.$refs[name][0]).selectAll("*").remove();
                }
              });
              if (!_.isEmpty(this.tabular_data)) {
                  //console.log("OK");
                  this.rawDataHistogramVisualization(this.$store.state.socket.tabularProcessedData.participatingFieldsMetaData, this.$store.state.socket.tabularProcessedData.histogramMetaDataArray, this.$store.state.socket.tabularProcessedData.histogramBarCountsArray, this.$store.state.socket.tabularProcessedData.histogramBarNamesArray, this.$store.state.socket.tabularProcessedData.histogramCountsArray, this.$store.state.socket.tabularProcessedData.barRelationsArray, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
              }
            });
        },
        xlink_data: function(){

              this.printXlink(this.$store.state.socket.xLinking);//highlight)
      },
      xlink_graph_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      },
      xlink_text_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      },
      xlink_raw_table_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      },
      xlink_raw_table_data_for_row_to_row: function(){
            if(this.$store.state.socket.xLinking.visType.rawTable || this.$store.state.socket.xLinking.visType.audio || this.$store.state.socket.xLinking.visType.video){
                this.xlinkSingleBarHandlingRowtoRowInRawDataTable(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
            }
      },
      xlink_residualChartModel_model_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      },
      xlink_confusion_matrix_model_data: function(){
              this.xlinkMultiDataHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray, this.$store.state.socket.tabularProcessedData.participatingFieldsMetaData);
      },
      xlink_collaborative_filtering_model_data: function(){
            this.xlinkMultiDataHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray, this.$store.state.socket.tabularProcessedData.participatingFieldsMetaData);
      },
      xlink_audio_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      },
      xlink_video_data: function(){

            this.xlinkSingleBarHandling(this.$store.state.socket.xLinking, this.$store.state.socket.tabularProcessedData.histogramD3MIndexArray);
      }


    },
    methods: {
        chartStyle(index) {
          if (this.hiddenCharts[index]) {
            return {
              height: '5px'
            }
          } else {
            return {
              height: '100%'
            }
          }
        },
        isChartHidden(index){
                return this.hiddenCharts[index];
        },
        hideChart: function(index) {
          this.$set(this.hiddenCharts, index, true);
        },
        revealChart: function(index) {
          this.$set(this.hiddenCharts, index, false);
        },
        xlinkSingleBarHandling: function(xLinking, histogramD3MIndexArray){
            console.log("Single Bar Selection Handling");

            if(xLinking.visType.graph || xLinking.visType.text || xLinking.visType.rawTable || xLinking.visType.residualChartModel || xLinking.visType.audio || xLinking.visType.video){

                var svgArr = d3.selectAll("svg").each(function(){
                    var chartID = d3.select(this).attr("histogramID");

                    d3.select(this).selectAll(".barMain").each(function(){
                          var barID = d3.select(this).attr("id");
                          var nodeD3MIndex = xLinking.xLinkIndexes[0];
                          if(histogramD3MIndexArray[chartID][barID].includes(nodeD3MIndex.toString())){
                            d3.select(this)
                            .style("fill", "#123452");
                          }

                     });
                });
            }
            else{
              var svgArr = d3.selectAll("svg").each(function(){
                   d3.select(this).selectAll(".barMain").each(function(){
                          d3.select(this)
                          .style("fill", "#468FCE");
                   });
              });

            }

        },

        xlinkSingleBarHandlingRowtoRowInRawDataTable: function(xLinking, histogramD3MIndexArray){
            //console.log("Single Bar Selection Handling 2");
            //This function is for handling rwo to row in raw data table is

            // first it makes all empty
            var svgArr = d3.selectAll("svg").each(function(){
                 d3.select(this).selectAll(".barMain").each(function(){
                        d3.select(this)
                        .style("fill", "#468FCE");
                 });
            });

            // to make them highlight
            var svgArr = d3.selectAll("svg").each(function(){
                var chartID = d3.select(this).attr("histogramID");

                d3.select(this).selectAll(".barMain").each(function(){
                      var barID = d3.select(this).attr("id");
                      var nodeD3MIndex = xLinking.xLinkIndexes[0];
                      if(histogramD3MIndexArray[chartID][barID].includes(nodeD3MIndex.toString())){
                        d3.select(this)
                        .style("fill", "#123452");
                      }

                 });
            });

        },

        xlinkMultiDataHandling: function(xLinking, histogramD3MIndexArray, participatingFieldsMetaData){
            console.log("Any Multidata Handling:");

            var totalWidth = this.totalWidth;
            var totalHeight = this.totalHeight;
            var margin = {
                    top: this.top,
                    right: this.right,
                    bottom: this.bottom,
                    left: this.left
                }

          var height = totalHeight - margin.top - margin.bottom;

            if(xLinking.visType.collaborativeFiltering || xLinking.visType.confusionMatrixModel){

                var svgArr = d3.selectAll("svg").each(function(){
                    var chartID = d3.select(this).attr("histogramID");

                    d3.select(this).selectAll(".barSelect").each(function(){
                          var barID = d3.select(this).attr("id");

                          var count = 0;
                        /*  for(var i = 0; i < xLinking.xLinkIndexes.length; i++){
                            var nodeD3MIndex = xLinking.xLinkIndexes[i];
                            if(histogramD3MIndexArray[chartID][barID].includes(nodeD3MIndex.toString())){
                            count++;
                            }
                          }
                          */
                          var bar3DMIndexArray = histogramD3MIndexArray[chartID][barID].concat().sort();
                          var xLinkArray = xLinking.xLinkIndexes.concat().sort();

                          var i = 0;
                          var j = 0;
                          while(i < bar3DMIndexArray.length && j < xLinkArray.length){
                              if(bar3DMIndexArray[i] === xLinkArray[j]){
                                count++;
                                i++;
                                j++;
                              }
                              else if(bar3DMIndexArray[i] < xLinkArray[j]){
                                  i++;
                              }
                              else{
                                j++;
                              }
                          }
                          //console.log("count:"+count);
                          var yUpperBound = Number(participatingFieldsMetaData[chartID][2]);
                          var y = d3.scale.linear()
                                .domain([0, yUpperBound])
                                .range([height, 0]);

                          d3.select(this)
                              .attr("y", function() {
                                  return y(count);
                              })
                              .attr("height", function() {
                                  return Number(height) - y(count);
                              });

                     });
                });
            }
            else{

              var svgArr = d3.selectAll("svg").each(function(){
                  var chartID = d3.select(this).attr("histogramID");

                   d3.select(this).selectAll(".barSelect").each(function(){
                        var barID = d3.select(this).attr("id");
                        var yUpperBound = Number(participatingFieldsMetaData[chartID][2]);
                        var y = d3.scale.linear()
                              .domain([0, yUpperBound])
                              .range([height, 0]);

                        d3.select(this)
                            .attr("y", function() {
                                return y(0);
                            })
                            .attr("height", function() {
                                return Number(height) - y(0);
                            });

                   });
              });


            }
              //console.log("Any Multidata Handling: done!");
        },

        printXlink: function(data){
          console.log("getting xlink data:");//+this.$store.state.socket.xLinking.xLinkIndexes);//+data.xLinkIndexes);//+data.xLinkIndexes[0]+" "+data.visType.residualChartModel+" "+ typeof data.xLinkIndexes[0]);

        },
        rawDataHistogramVisualization: function(participatingFieldsMetaData, histogramMetaDataArray, histogramBarCountsArray, histogramBarNamesArray, histogramCountsArray, barRelationsArray, histogramD3MIndexArray) {

            var participatingFields = participatingFieldsMetaData.length;

            for (var currentCol = 0; currentCol < participatingFields; currentCol++) {

                var currentData = [];
                for (var i = 0; i < participatingFieldsMetaData[currentCol][1]; i++) {
                    currentData.push({
                        "x": i + 1,
                        "y": histogramBarCountsArray[currentCol][i]
                    });
                }

                var indexToMainMetaDataTable = participatingFieldsMetaData[currentCol][0];
                this.createHistogram(currentCol, indexToMainMetaDataTable, currentData, participatingFieldsMetaData, histogramMetaDataArray, histogramBarCountsArray, histogramBarNamesArray, histogramCountsArray, barRelationsArray, histogramD3MIndexArray);

            }

        },
        createHistogram: function(histogramID, indexMetaData, currentData, participatingFieldsMetaData, histogramMetaDataArray, histogramBarCountsArray, histogramBarNamesArray, histogramCountsArray, barRelationsArray, histogramD3MIndexArray) {
            let vueThis = this;

            var currentMainCountsArrayID = Number(indexMetaData);
            var yUpperBound = Number(participatingFieldsMetaData[histogramID][2]);
            var formatCount = d3.format(",.0f");
            var totalWidth = this.totalWidth;
            var totalHeight = this.totalHeight;

            var name = 0;
            var type = 1;
            var min = 2;
            var max = 3;
            var diff = 4;
            var intvl = 5;
            var barRel = 6;

            var margin = {
                    top: this.top,
                    right: this.right,
                    bottom: this.bottom,
                    left: this.left
                },
                width = totalWidth - margin.left - margin.right,
                height = totalHeight - margin.top - margin.bottom;

            var currentHistogramID = Number(histogramID);
            var currentBars = Number(participatingFieldsMetaData[currentHistogramID][1]);
            var xDomainMax = Number(currentBars + 1);

            var xLinking = {
                xLinkIndexes: [],
                highlight: false,
                visType: 'tabular',
                visValue: false
            }

            var x = d3.scale.linear()
                .domain([1, xDomainMax])
                .range([0, width]);

            var binWidth = parseFloat(width / (currentBars)) - 1;

            var y = d3.scale.linear()
                .domain([0, yUpperBound])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickValues(currentBars);

            var yAxis = d3.svg.axis()
                .scale(y)
                .ticks(5)
                .orient("left");

            // var svg = d3.select(this.$el).append("svg")
            var svg = d3.select(this.$refs['histogram' + histogramID][0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id", "the_SVG_ID")
                .attr("histogramID", histogramID)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var tooltip = d3.select(this.$el).select('#tabulartooltip');

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);


            svg.append("g")
                .attr("class", "y axis")
                .style("font-size", "10px")
                .call(yAxis);

            // Add Y-axis main label, i.e., "counts"
            svg.append("text")
                .attr("class", "y label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .attr("font-weight", "bold")
                .text("Counts");


      // This is to add title to each histogram
      svg.append("text")
                //.attr("class", "title")
                .attr("id", "the_TEXT_ID")
                .attr("transform", "translate(" + (width / 2) + " ," + (-20) + ")")
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .style("font-size", "14px")
                .text(function(d) {
                    if (histogramMetaDataArray[currentMainCountsArrayID][9] != 0) {
                        if (histogramMetaDataArray[currentMainCountsArrayID][0].length < 19) {
                            return histogramMetaDataArray[currentMainCountsArrayID][0] + " (Mean: " + histogramMetaDataArray[currentMainCountsArrayID][9].toFixed(3) + ")"; //.toFixed(3)+")";
                        } else {
                            return histogramMetaDataArray[currentMainCountsArrayID][0].substring(0, 18) + "... (Mean: " + histogramMetaDataArray[currentMainCountsArrayID][9].toFixed(3) + ")"; //.toFixed(3)+")";
                        }
                    } else {
                        if (histogramMetaDataArray[currentMainCountsArrayID][0].length < 19) {
                            return histogramMetaDataArray[currentMainCountsArrayID][0];
                        } else {
                            return histogramMetaDataArray[currentMainCountsArrayID][0].substring(0, 18) + "...";
                        }
                    }
                })
                // .on("mousemove", function(d) {

                //     tooltip.transition()
                //         .duration(200)
                //         .style('opacity', 1)

                //     var x1 = svg.node().parentNode.getBoundingClientRect().left - width + 30;
                //     var y1 = svg.node().getBoundingClientRect().top;

                //     var y_parent = svg.node().parentNode.parentNode.getBoundingClientRect().top;

                //     var x = x1;
                //     var y = y1 - y_parent + 130;

                //     var text = "Click on  " + histogramMetaDataArray[currentMainCountsArrayID][0] + " for data exploration";

                //     tooltip.html(text)
                //     tooltip.style('left', x + "px")
                //         .style('top', y + "px")

                //     d3.select(this).style("fill", "blue");
                //     d3.select(this).style("text-decoration", "underline");
                //     d3.select(this).style("cursor", "pointer");
                // })
                // .on("mouseout", function(d) {
                //     tooltip.transition()
                //         .duration(200)
                //         .style('opacity', 0);
                //     d3.select(this).style("fill", null);
                //     d3.select(this).style("text-decoration", null);
                //     d3.select(this).style("cursor", "default");
                // })
                // .on("click", function(d) {
                //   let varName = histogramMetaDataArray[currentMainCountsArrayID][0];
                //   console.log("run VODER for", varName);
                //   store.commit('setUserVariable', varName);
                //   // vueThis.$store.state.socket.voderSelectedVariable = varName;
                // });

            //Starting x-axis label
            svg.append("text")
                //.attr("class", "x-start label")
                .attr("y", function(d, i) {
                    return (height + 7);
                })
                .attr("x", 0)
                .attr("dy", "1em")
                .attr("text-anchor", "middle")
                .style("font-size", "8px")
                .text(function(d) {
                    if (histogramMetaDataArray[currentMainCountsArrayID][type] == "integer") {
                        return Number(histogramMetaDataArray[currentMainCountsArrayID][min]);
                    } else if (histogramMetaDataArray[currentMainCountsArrayID][type] == "float" || histogramMetaDataArray[currentMainCountsArrayID][type] == "real") {
                        var val = Number(histogramMetaDataArray[currentMainCountsArrayID][min]);
                        return val.toFixed(2);
                    } else {
                        return " ";
                    }
                });

            var barGroup = svg.selectAll(".barMain")
                .data(currentData)
                .enter()
                .append("g");

            //each bar top range value
            barGroup.append("text")
                .attr("class", "bartext")
                .attr("text-anchor", "middle")
                .attr("x", function(d) {
                    return x(d.x) + (binWidth / 2);
                })
                .attr("y", function(d, i) {
                    return y(d.y) - 5;
                })
                .attr("font-family", "sans-serif")
                .style("font-size", "8px")
                //.style("font-weight", "italic")
                .attr("fill", "black")
                .text(function(d) {
                    return (d.y);
                });

            //x-axis range values
            barGroup.append("text")
                //.attr("class", "x label")
                .attr("text-anchor", "middle")
                //.attr("transform", "rotate(-90)")
                .attr("y", function(d, i) {
                    return (height + margin.bottom - 15);
                })
                .attr("font-family", "sans-serif")
                .style("font-size", "8px")
                //.style("font-weight", "italic")
                .style("font-stretch", "ultra-condensed")
                //.attr("font-weight", "bold")
                .attr("fill", "black")
                .text(function(d) {
                    if (histogramMetaDataArray[currentMainCountsArrayID][type] == "integer") {
                        d3.select(this).attr("x", function(d) {
                            return x(d.x) + binWidth - 3;
                        });
                        return Number(histogramMetaDataArray[currentMainCountsArrayID][min]) + Number((d.x) * histogramMetaDataArray[currentMainCountsArrayID][intvl]);
                    } else if (histogramMetaDataArray[currentMainCountsArrayID][type] == "float" || histogramMetaDataArray[currentMainCountsArrayID][type] == "real") {
                        d3.select(this).attr("x", function(d) {
                            return x(d.x) + binWidth - 3;
                        });
                        var val = Number(histogramMetaDataArray[currentMainCountsArrayID][min]) + Number((d.x) * histogramMetaDataArray[currentMainCountsArrayID][intvl]);
                        return val.toFixed(2);
                    } else {
                        d3.select(this)
                            .attr("x", function(d) {
                                return x(d.x) + (binWidth / 2);
                            });
                        //attr("font-size", "5px");
                        var currentInd = d.x;
                        if(histogramBarNamesArray[currentHistogramID][currentInd - 1].length < 9){
                            return histogramBarNamesArray[currentHistogramID][currentInd - 1];
                        }
                        else{
                          return histogramBarNamesArray[currentHistogramID][currentInd - 1].substring(0, 7) + "..";
                        }

                    }
                });
                /*
                // TODO: to make the tooltip for categorical labels
                .on("mousemove", function(d) {

                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1)

                    var x1 = svg.node().parentNode.getBoundingClientRect().left - width + 30;
                    var y1 = svg.node().getBoundingClientRect().top;

                    var y_parent = svg.node().parentNode.parentNode.getBoundingClientRect().top;

                    var x = x1;
                    var y = y1 - y_parent + 80;

                    var text = histogramBarNamesArray[currentHistogramID][currentInd - 1];

                    tooltip.html(text)
                    tooltip.style('left', x + "px")
                        .style('top', y + "px")
                })
                .on("mouseout", function(d) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0)
                });
                */

            barGroup.append("rect")
                .attr("id", function(d, i) {
                    return i;
                }) //'the_BAR_ID')
                .attr("class", "barMain")
                .attr("barType", "bar")
                //.style("fill", "steelblue")
                .style("fill", "#468FCE")
                .attr("x", function(d) {
                    return x(d.x);
                })
                .attr("width", binWidth)
                .attr("y", function(d) {
                    return parseFloat(y(d.y))
                })
                .attr("height", function(d) {
                    return parseFloat(height - y(d.y));
                })
                //.attr("stroke", "#800")
                .on("mouseover", function(d, i) {

                    //d3.select(this).style("fill", "#CCC000");
                    d3.select(this).style("fill", "#30638E");

                    var matrixColID = 0;
                    for (var count = 0; count < histogramID; count++) {
                        matrixColID = Number(matrixColID + participatingFieldsMetaData[count][1]);
                    }
                    matrixColID = matrixColID + i;

                    //this sends the data for cross linking
                    xLinking.xLinkIndexes = histogramD3MIndexArray[histogramID][i];
                    xLinking.highlight = true;
                    xLinking.visValue = true;
                    store.commit('updateXLinking', xLinking);
                    // end of cross linking

                    var svgArr = d3.selectAll("svg").each(function() {
                        var chartID = d3.select(this).attr("histogramID");
                        //console.log("chartID", chartID);
                        d3.select(this).selectAll(".barSelect").each(function() {
                            var barID = d3.select(this).attr("id");
                            var index = 0;
                            for (var indexCount = 0; indexCount < chartID; indexCount++) {
                                index = Number(index + participatingFieldsMetaData[indexCount][1]);
                            }
                            index = index + Number(barID);
                            var currentMaxID = Number(chartID);
                            yUpperBound = Number(participatingFieldsMetaData[currentMaxID][2]);

                            //console.log("index:"+index+" "+currentMaxID+" "+yUpperBound+" "+matrixColID);
                            var y = d3.scale.linear()
                                .domain([0, yUpperBound])
                                .range([height, 0]);

                            if (chartID != histogramID) {
                                var val = Number(barRelationsArray[index][matrixColID]);
                                //this.style["fill"] = "#00FF00";
                                d3.select(this)
                                    .attr("y", function() {
                                        return y(val);
                                    })
                                    .attr("height", function() {
                                        return Number(height) - y(val);
                                    });
                            } else {
                                d3.select(this)
                                    .attr("y", function() {
                                        return y(0);
                                    })
                                    .attr("height", function() {
                                        return height - y(0);
                                    });
                            }
                        });

                    });

                })
                .on("mouseout", function() {

                  //this sends the data for cross linking
                  xLinking.xLinkIndexes = [];
                  xLinking.highlight = false;
                  xLinking.visValue = false;
                  store.commit('updateXLinking', xLinking);
                  // end of cross linking

                    d3.select(this).style("fill", "#468FCE");
                    //  d3.select('#tooltip').remove();
                    d3.selectAll("#the_BAR_ID")
                        .style("visibility", "hidden");
                    //  d3.selectAll(".barMain").style('opacity', 1);
                    var svgArr = d3.selectAll(".barSelect").each(function() {
                        d3.select(this)
                            .attr("y", function() {
                                return y(0);
                            })
                            .attr("height", function() {
                                return height - y(0);
                            });
                    });

                });

            barGroup.append("rect")
                .attr("id", function(d, i) {
                    return i;
                })
                .attr("class", "barSelect")
                .attr("x", function(d) {
                    return x(d.x);
                })
                .attr("width", binWidth)
                .attr("y", function() {
                    return y(0);
                })
                .attr("height", function() {
                    return Number(height) - y(0);
                })
                .style("visibility", "visible")
                .style("fill", "#123452"); //.style("fill", "FF0000");

            barGroup.append("text")
                .attr("class", "bartext")
                .attr("id", "the_BAR_ID")
                //.attr("text-anchor", "middle")
                .attr("x", function(d) {
                    return x(d.x) + 15;
                })
                .attr("y", function() {
                    return y(0) - 5;
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "7px")
                .attr("fill", "white")
                .text(function(d) {
                    return (d.y);
                })
                .style("visibility", "hidden");

            console.log("svg: " + svg);
            return svg; //the_SVG_ID;//svg;

        }
    }
};

</script>
