<template>
          <div :id = 'regressModelCard' ref="modelCard">
            <h6>Regression: Residual Bar Chart. Please select models in the card "Scores of the Models".</h6>
          <!-- <v-progress-circular v-if="spinner" indeterminate v-bind:size="50" color="primary"></v-progress-circular> -->
          </div>
</template>

<script>
import * as d3 from "d3v3";
import _ from 'lodash';
import store from '@/store';

//inside cards
export default {
  name: 'RegressionModelOutput',
  props: [
    ],
  data: function () {
    return {
      spinner: true,
      regressModelCard : "svg_regress_div_",
      modelOutputData : {},
      // allModels : [0,1,2],
      allModels : [],
      id : 0,
      // models: this.$store.state.socket.models,
    }
  },
  sockets : {
    'model_return_regres': function(dataReturn){
      this.spinner = false;
      console.log("data return after regression task run ", dataReturn);
      var dataFormatted = this.formatIncomingData(dataReturn["outData"], dataReturn['indices']);
      var id = dataReturn["id"];

      this.allModels.push(id);
      this.allModels = _.uniq(this.allModels)
      // var arrCopy = this.modelOutputData.slice();
      // arrCopy[id] = dataFormatted;
      // this.modelOutputData = arrCopy.slice();
      this.modelOutputData[id] = dataFormatted
      console.log("this.modelOutputData is ", this.modelOutputData)
      // this.drawD3BarCharts_residuals(arrCopy[id],id);
      this.drawD3BarCharts_residuals(this.modelOutputData[id],id);
    }

  },
  created: function () {
    //"templatedId:{{model-id}}"
  },
  updated:function(){
      // console.log("regression component just got updated ", this.modelOutputData)
      // this.drawD3BarCharts_residuals(this.modelOutputData, this.id);
  },
  mounted : function(){
    // console.log("regress model output creates");
    // this.$store.dispatch('loadRegressData', {numModel : this.allModels.length, predicted : true});
    this.handleModelPredictions(this.models);
  },
  computed: {
    models() {
      return this.$store.state.socket.selectedModels;
    },
    getSelectedModel : {
      get(){
        return this.$store.state.socket.selectedModel;
      },
      set(value){
          // this.$store.commit('setSelectedModel', value)
      }
    },
  },

  watch:{
    // selectedModels() {
    //   // d3.select(this.$refs.modelCard).selectAll("div").remove();
    //   this.handleModelPredictions(this.selectedModels);
    // },
    modelOutputData : function(params) {
      // console.log("model output data has changed");
      // this.drawD3BarCharts_residuals(this.modelOutputData, this.id);
    },
    models: function(mods) {
      d3.select(this.$refs.modelCard).selectAll("div").remove();
      this.handleModelPredictions(mods);
    },

    getSelectedModel: function(par){
         var id = this.$store.state.socket.selectedModel
          d3.selectAll('.modelContainer').style('border', '');
          d3.select('[data-id="modelContainer_'+this.regressModelCard+"_"+id+'"]').style('border', '2px solid gray');
    }
  },

  methods: {
    stringToDomId(str) {
      return str.replace(/^[^a-z]+|[^\w:.-]+/gi, "");
    },
    handleModelPredictions: function (mods) {
      var mod;
      for ( var i=0; i<mods.length; i++) {
        mod = mods[i]
        this.$store.dispatch('loadRegressData',
          { fileUri : mod.fileUri,
            predicted : true,
            modelId : mod.modelId });
      }
    },
    arrAddition: function(arrGiven) {
      var arrNew = [];
      for (var i = 0; i < arrGiven.length; i++) {
        arrNew.push(parseFloat(arrGiven[i]) + Math.random() * 10 + 0.1);
      }
      return arrNew;
    },
    formatIncomingData: function(dataGiven, indexList) {
      // dataGiven = this.arrAddition(dataGiven);
      var dataNew = [];
      var maxRows;
      if ( dataGiven.length > 300) { maxRows = 300 } else { maxRows = dataGiven.length }
      for (var i = 0; i < indexList.length; i++) {
        indexList[i] = parseInt(indexList[i]);
      }
      console.log(' found indexList ', indexList);
      for (var i = 0; i < maxRows; i++) {
        var row = dataGiven[i];
        var obj = {
          // item: "M_" + i,
          item:  i,
          residualChange: parseFloat(row),
          index: indexList[i]
        };
        dataNew.push(obj);
      }
      return dataNew;
    },
    addAvgResidualLineChart : function(svg, data, width, height){
      // console.log("adding the line chart ", this.regressModelCard);
      var avgResidual = 0;
      var widN = 30, ht = 30;
      var moveX = 300, moveY = -30;
      // var errorExtent = 3;

      //  var widN = 200, ht = 200;
      // var moveX = 50, moveY = -175;
      for(var i=0;i<data.length;i++){
        // console.log("data ", data[i].residualChange)
        avgResidual += data[i].residualChange;
      }
      avgResidual = avgResidual/data.length;
      avgResidual = Math.abs(Number(avgResidual).toFixed(3));

      var errorExtent = avgResidual*3;

      var xNew = d3.scale.linear().range([0, widN]);
      var yNew = d3.scale.linear().range([ht, 0]);

      xNew.domain([0,errorExtent]);
      yNew.domain([0, data.length]);
      var xAxisAvg = d3.svg.axis()
        .scale(xNew)
        .orient("bottom")
        .ticks(2)
        .tickSize(0,0);

      var yAxisAvg = d3.svg.axis()
        .scale(yNew)
        .orient("left")
        .tickSize(0,0);

      // Define the line
      var	valueline = d3.svg.line()
          .x(function(d) {
            return xNew(avgResidual);
            // console.log("residual change  ", d.residualChange)
            return xNew(d.residualChange);
            })
          .y(function(d,i) {
            // console.log("in line data ", i)
            return yNew(i);
            })


      var g = svg.append("g")
          .attr("transform", "translate(" + moveX + "," + moveY + ")")
          .attr('class', 'lineChartClassResidualsAvg');

      // x axis grp
      g.append("g")
            .attr("class", "avg_axis axis--x")
            .attr("data-id", "avg_x_axis_"+this.regressModelCard)
            .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px'})
            .attr("transform", "translate(0," + ht + ")")
            .call(xAxisAvg)
            .append("text")
            .attr("x", -12)
            .attr("y", 8)
            .attr("dy", "0.71em")
            .attr("text-anchor", "start")
            .text("Avg Error : " + avgResidual)
            .style({  'stroke': 'none','fill': 'gray', 'font-size' : '0.75em'})

      //   // y axis grp
        g.append("g")
            .attr("class", "avg_axis axis--y")
            .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px'})
            .call(yAxisAvg)
            // .append("text")
            // .attr("transform", "rotate(-90)")
            // .attr("x", -10)
            // .attr("y", -15)
            // .attr("dy", "0.71em")
            // .attr("text-anchor", "end")
            // .text("Residual Error")
            // .style({  'stroke': 'none','fill': 'gray', 'font-size' : '0.75em'})


             // Add the valueline path.sss
          g.append("g")
            .attr('class', 'g_line')
            // .attr("transform", "translate(-10,-10)")
            .append("path")
            .attr("class", "line_new")
            .attr("d", valueline(data))
            .style("stroke", "orange")
            .style("stroke-weight", "1");
            return  avgResidual;

    },

    drawD3BarCharts_residuals : function(data,id){
      var vueThis = this;
      // console.log("d3 data check in resid ", data, this.regressModelCard, this.titleName);
      try{
        //  d3.selectAll("#svg_node_"+this.regressModelCard).remove();
      }catch(err){
        //err
      }

      var xLinking = {
        xLinkIndexes: [],
        highlight: false,
        visType: 'residualChartModel',
        visValue: false
      }

      var stateSocket = this.$store.state.socket;
      var storevar = this.$store;

      d3
        .select("#" + this.regressModelCard)
        .append("div")
        .attr('class', 'modelContainer')
        .attr('data-id', 'modelContainer_'+this.regressModelCard+"_"+vueThis.stringToDomId(id))
        .style('width', '400')
        .on("mouseover", function(){
          d3.select(this).style('background', '#F7F7F7');
        })
        .on("mouseout", function(){
          d3.select(this).style('background', 'transparent');
        })
        .on("click",function(){
          // stateSocket.selectedModel = id;
          // storevar.dispatch('updateSelectedModel', stateSocket.models[id].modelId)
          // storevar.dispatch('updateSelectedModel', id)
          // d3.selectAll('.modelContainer').style('border', '');
          // d3.select(this).style('border', '2px solid gray');
          // console.log("state of socket ", stateSocket);
        })



      var allModelsArr = this.allModels
      // console.log("in resid, ", allModelsArr, this.allModels)
      var modelIdAr = this.regressModelCard;
      // var wid = d3.select('[data-id="'+this.regressModelCard+'"]')[0][0].offsetWidth*0.85;
      var wid = 500
      var margin = {top: 50, right: 20, bottom: 80, left: 40},
           width = wid - margin.left - margin.right, //960
           height = 250 - margin.top - margin.bottom;//430



      d3.select('[data-id="modelMetrics_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]').remove();
       d3
        .select('[data-id="modelContainer_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]')
        .append("div")
        .attr('class', 'modelMetrics')
        .attr('data-id', 'modelMetrics_'+this.regressModelCard+"_"+vueThis.stringToDomId(id));

        // console.log("metric model builds")
        // var modelMetric =  this.$store.state.socket.models[this.id].modelMetrics[0];
        // var htmlStr = "<div> Model  : " + this.id + " </div>";
        // htmlStr += "<div class = 'metrics' > Model metric : " + modelMetric + " </div>"
        // $('#modelMetrics_'+this.regressModelCard+"_"+this.id).html(htmlStr);
        // var myModel = this.$store.state.socket.models[this.id]
        var myModel = _.find(this.$store.state.socket.models, (mod) => { return mod.modelId == id } )
        var modelMetric =  myModel.modelMetrics;
        // console.log("this.id", this.id)
        // console.log("modelMetric", modelMetric)
        var htmlStr = "<div> Model  : " + myModel.modelName + " </div>";
        var key = Object.keys(modelMetric) && Object.keys(modelMetric)[0]
        var val = modelMetric[key]
        if (!val){
          val=-1
        }
        htmlStr += "<div class = 'metrics' > " + key + " : " + val.toFixed(3) + " </div>"
        $('[data-id="modelMetrics_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]').html(htmlStr);


        $(".modelMetrics").css("width", "100%");
        $(".modelMetrics").css("display", "flex");
        $(".modelMetrics").css("flex-direction", "column");
        $(".modelMetrics").css("align-items", "start");
        $(".modelMetrics").css("padding", "3px");
        $(".modelMetrics").css("border-top", "0.1px solid lightgray");
        $(".metrics").css("font-size", "0.90em");
        $(".metrics").css("color", "gray");


        var htmlStr =  "<div class = 'sort_div' id = 'sortDiv_"+this.regressModelCard+"_"+vueThis.stringToDomId(id)+"' >Sort By Data :   ";
        htmlStr +="<label><input class ='sortCheckBox' data-toggle='toggle' data-size='small' type='checkbox' data-id = 'sortInput_"+this.regressModelCard+"_"+vueThis.stringToDomId(id)+"' ></label></div>";
        $('[data-id="modelContainer_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]').append(htmlStr);

        d3.selectAll('.sort_div').style('width','100%');
        d3.selectAll('.sort_div').style('padding','2px');
        d3.selectAll('.sortCheckBox').style('padding','2px');
        d3.selectAll('.sort_div').style('text-align','left');
        d3.selectAll('.sort_div').style('font-size','0.90em');
        d3.selectAll('.sort_div').style('color','gray');

        $('[data-id="svg_node_'+this.regressModelCard +"_"+vueThis.stringToDomId(id)+'"]').remove()
        var svg = d3
          // .select("#"+this.regressModelCard)
          .select('[data-id="modelContainer_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]')
          .append("svg")
          .attr("data-id", "svg_node_"+this.regressModelCard +"_"+vueThis.stringToDomId(id))
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // var svgCopy = svg;
      var avgResidualError = this.addAvgResidualLineChart(svg, data, width, height);

      // return
      var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
      // console.log("x scale is ", x)
      var y = d3.scale.linear().range([height, 0]);
      var g = svg.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);

      var formatPercent = d3.format(".0%");

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        // .ticks(10);
        // .tickFormat(formatPercent);

        x.domain(data.map(function(d) { return d.item; }));
        y.domain([0, d3.max(data, function(d) { return d.residualChange; })]);

        //horiz label
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("id", "x_axis_"+this.regressModelCard)
             .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px'})
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("x", 6)
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "start")
            .text("Instances")
            .style({  'stroke': 'none','fill': 'gray', 'font-size' : '0.80em'})



        //vertical label
        g.append("g")
            .attr("class", "axis axis--y")
            .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px'})
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", 50)
            .attr("y", -18)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Residual Error ( Avg : " + avgResidualError + " )")
            .style({  'stroke': 'none','fill': 'gray', 'font-size' : '0.80em'})


        d3.selectAll(".tick").style("opacity", "0");

        // some itemsssss
        var tooltip = d3.select("body").append("div").attr("data-id", "toolTip_"+this.regressModelCard+"_"+vueThis.stringToDomId(id));
         var bar = g.selectAll(".bar")
          .data(data)
          .enter().append("rect")
            .attr("class", function(d,i){
              return "bar barId_svg_regres_" + vueThis.stringToDomId(id) + "_"+i;
            })
            .attr("id", function(d,i){
              return "bar_"+id+"_"+i;
            })
            .attr("x", function(d) { return x(d.item); })
            .attr("y", function(d) { return y(d.residualChange); })
            .attr("width", x.rangeBand() )
            .attr("height", function(d) { return height - y(d.residualChange); })
            .style("fill", "steelblue")

            .on("mouseover", function(d,i){
              d3.select(this).style("fill", "red");

              // for(var k=0;k<allModelsArr.length;k++){
              //   var selector = ".barId_svg_regres_"+allModelsArr[k] + "_"+i;
              //   // console.log("found class selecteor n regress ", selector)
              //   d3.select(selector).style("fill", "red");
              // }
              // console.log("hoverings ", d, id, i)
              //this sends the data for cross linking
              // console.log("hovered: ", d.index);
              xLinking.xLinkIndexes = [d.index];
              xLinking.highlight = true;
              xLinking.visValue = true;
              store.commit('updateXLinking', xLinking);
              d3.selectAll("#bar_"+i).style("fill", "red");
              var htmlStr = "Data Instance : " + " " + i + " <br>"
              htmlStr +="Residual Error : " + " " + (Number(d.residualChange).toFixed(4))
              tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .style("position", "absolute")
                .style("min-width", "80px")
                .style("height", "auto")
                .style("background", "none repeat scroll 0 0 #ffffff")
                .style("border", "1px solid #6F257F")
                .style("padding", "3px")
                .style("text-align", "center")
                .html(htmlStr);
              })
              .on("mouseout", function(d){
                //this sends the data for cross linking
                xLinking.xLinkIndexes = [];
                xLinking.highlight = false;
                xLinking.visValue = false;
                store.commit('updateXLinking', xLinking);

                tooltip.style("display", "none");
                d3.selectAll(".bar").style("fill", "steelblue");
              });

         d3.select('[data-id="toolTip_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]')
          .style("position", "absolute")
          .style("display", "none")
          .style("min-width", "80px")
          .style("height", "auto")
          .style("background", "none repeat scroll 0 0 #ffffff")
          .style("border", "1px solid #6F257F")
          .style("padding", "3px")
          .style("text-align", "center")

        // d3.selectAll("path").style("stroke-width", "1px")
        // d3.selectAll("path").style("fill", "steelblue");

      //adds interaction to checkbox buttons
         $('[data-id="sortInput_'+this.regressModelCard+"_"+vueThis.stringToDomId(id)+'"]').change(function() {
      //  d3.select("#sortInput_"+this.regressModelCard).on("change", function(){
          // console.log("changing again ", this, data)
          data = data.slice();
          var x0 = x.domain(data.sort(this.checked
              ? function(a, b) { return +b.residualChange - +a.residualChange; }
              : function(a, b) { return d3.ascending(parseInt(a.item), parseInt(b.item)); })
              .map(function(d) { return d.item; }))
              .copy();

          svg.selectAll(".bar")
              .sort(function(a, b) { return x0(a.item) - x0(b.item); });

          var transition = svg.transition().duration(150),
              delay = function(d, i) { return i * 10; };

          transition.selectAll(".bar")
              .delay(delay)
              .attr("x", function(d) { return x0(d.item); });

          transition.select(".x.axis")
              .call(xAxis)
            .selectAll("g")
              .delay(delay);

       });
    },

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#svg_regress_div_{
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  border: 1px solid lightgray;
  padding: 3px;
}
h6 {
  padding: 4px;
  width: 100%;
  text-align: left;
}
.sort_div {
  /* border : 1px solid lightgrey; */
  padding: 2px;
  text-align: left;
  width: 100%;
}

</style>
