<template>
  <v-card v-if="experimentLoaded" :key="experimentKey">
    <div>
      <v-progress-linear
        indeterminate
        color="primary"
        class="mb-0"
        v-if="loading"
        height="2"
      ></v-progress-linear>
      <ColumnView
        :first-column-data="firstColumnData"
        :all-attribute-data="allAttributeData"
        @loadingOn="toggleLoadingTrue"
        @loadingOff="toggleLoadingFalse"
        @showThroughJoinDialog="showThroughJoinDialog"
        @showTemporalDialog="showTemporalDialog"
        @updateAttributeList="updateAttributeList"
        :through-join-results="throughJoinResults"
        @update-all-attribute-data="updateAllAttributeData"
        :temporal-filters="temporalFilters"
      ></ColumnView>
      <ConfirmAndLoading
        :confirm-and-loading-dialog="confirmAndLoadingDialog"
        @hide-confirm-and-loading-dialog="hideConfirmAndLoadingDialog"
      ></ConfirmAndLoading>
      <ThroughJoin
        :through-join-dialog="throughJoinDialog"
        :through-join-instructions="throughJoinInstructions"
        @hide-through-join-dialog="hideThroughJoinDialog"
      ></ThroughJoin>
      <TemporalFilterDialog
        :temporal-dialog="temporalDialog"
        :temporal-dialog-val="temporalDialogVal"
        :current-attribute-list="currentAttributeList"
        :temporal-filters="temporalFilters"
        @acceptFilter="acceptTemporalFilter"
        @cancelFilter="hideTemporalDialog"
      ></TemporalFilterDialog>
    </div>
    <v-card-actions style="overflow-x:auto; display:flex;">
      <v-spacer></v-spacer>
      <div class="modelmetricwrapdiv">
        <!-- ui segment singleSegment -->
      <div
        :class="{
             'modelMetricsRow': true,              
            }" 
        v-for="(prop, i) in metricsObj"
        :key="prop.id" 
      >  
         <div  
            :class="{
              'ui segment singleSegment modelmetricsdiv': true,
               modelMetricsCheckedClass: checkMouseOverModelCols(i),
            }" 
            id = "modelmetricsdivId"
            @mouseenter="mouseEnterModelMetrics(prop,i)"
            @mouseleave="mouseLeaveModelMetrics(prop)"
          >
            <div > 
              Train | Test {{prop.metric}}: <span class = "metricVal" > &nbsp {{(prop.acc_train*1).toFixed(3)}}</span> &nbsp | &nbsp <span class = "metricVal" >{{(prop.acc_test*1).toFixed(3)}}</span>
            </div>
            <!-- custom tooltip for model metrics using v-if ------------------------------------>
            <v-card v-show = "testTooltip(i)" 
             :class="{
              'ui segment singleSegment tooltipModelMetrics': true,
                }" 
            >
             <div>Top 5 features</div>
                  <div
                    :class="{
                        'featurelist': true,              
                        }" 
                    v-for="(prop, j) in metricsObj[i]['feature_wts'].slice(0, 5)"
                    :key="'tooltipmetric_'+j" 
                    >
                  <div class = 'featurewtrow'> {{prop[0].substring(0,35)}}: {{prop[1]}}</div>  
                  </div>
            </v-card>
            <!-- custom tooltip for model metrics using v-if ------------------------------------>
          </div>
     
          </div>
          </div>
      <v-btn 
        color="primary"
        v-if="buildModelButtonActive"
        :disabled="!active"
        @click="showConfirmAndLoadingDialog"
      >
        <!-- Materialize Data -->
        Build Model
      </v-btn>

        <v-btn 
        color="secondary"
        class = 'downloaddata'
        @click="downloadData"
      >
        <!-- Materialize Data -->
        Download Data
      </v-btn>

      
    </v-card-actions>
  </v-card>
</template>

<script>
import store from "@/store";
import _ from "lodash";
import ColumnView from "@/components/cards/DataAugmentationComponents/ColumnView.vue";
import ConfirmAndLoading from "@/components/cards/DataAugmentationComponents/ConfirmAndLoading.vue";
import ThroughJoin from "@/components/cards/DataAugmentationComponents/ThroughJoin.vue";
import TemporalFilterDialog from "@/components/cards/DataAugmentationComponents/TemporalFilterDialog.vue";
import * as d3 from "d3";



export default {
  name: "DataAugmentation",

  components: {
    ColumnView,
    ConfirmAndLoading,
    ThroughJoin,
    TemporalFilterDialog
  },

  data () {
    return {
      metricsObj: this.$store.state.socket.modelMetricsMultiIter,
      config: this.$store.state.socket.evaluationConfig,
      searchTerms: '',
      loader: null,
      loading: true,
      searching: false,
      headers: [],
      pagination: {},
      items: [],
      selectedIndex: 0,
      augmentIteration: 0,
      outputPath: '',
      selected: [],
      firstColumnData: {
        children: []
      },
      allAttributeData: [],
      confirmAndLoadingDialog: false,
      experimentKey: 0,
      currentAttributeList: [],
      temporalFilters: {},
      // throughJoinDialog: true,
      // throughJoinInstructions: 
      //   {
      //     "dataset": "185",
      //     "operation": "join-collection-string",
      //     "aggregationOp": "count",
      //     "column": "State - shares border with (through)",
      //     "relationship": "shares border with",
      //     "name": "shares border with",
      //     "parentEntityExampleUri": "http://www.wikidata.org/entity/Q1428",
      //     "parentEntityExample": "Georgia",
      //     "relationshipUri": "http://www.wikidata.org/prop/direct/P47",
      //     "examples": [
      //       "New York",
      //       "New Jersey",
      //       "Maine"
      //     ],
      //     "parentJoin": {
      //       "dataset": "185",
      //       "operation": "join-collection-string",
      //       "aggregationOp": "through",
      //       "column": "State",
      //       "relationship": "shares border with",
      //       "relationshipUri": "http://www.wikidata.org/prop/direct/P47",
      //       "examples": [
      //         "Maine",
      //         "Arizona",
      //         "North Dakota"
      //       ]
      //     }
      //   },
      throughJoinDialog: false,
      throughJoinInstructions: {},
      throughJoinResults: {},
      temporalDialog: false,
      temporalDialogVal: {},
      // temporalDialog: true,
      // temporalDialogVal: {
      //   "entity":{
      //       "type":"uri",
      //       "value":"http://www.wikidata.org/entity/Q796"
      //   },
      //   "entityLabel":{
      //       "xml:lang":"en",
      //       "type":"literal",
      //       "value":"Iraq"
      //   },
      //   "wdt":{
      //       "type":"uri",
      //       "value":"http://www.wikidata.org/prop/direct/P1279"
      //   },
      //   "wdLabel":{
      //       "xml:lang":"en",
      //       "type":"literal",
      //       "value":"inflation rate"
      //   },
      //   "wdDescription":{
      //       "xml:lang":"en",
      //       "type":"literal",
      //       "value":"percent change in the consumer price index (CPI)"
      //   },
      //   "count":17,
      //   "exampleLit":{
      //       "datatype":"http://www.w3.org/2001/XMLSchema#decimal",
      //       "type":"literal",
      //       "value":"-1"
      //   },
      //   "valsInTime":[
      //       "16.4",
      //       "31.6",
      //       "2.3",
      //       "-4.4",
      //       "64.8",
      //       "6.8",
      //       "6",
      //       "19.3",
      //       "5",
      //       "35.8",
      //       "3.3",
      //       "1.6",
      //       "4.7",
      //       "3.6",
      //       "-1",
      //       "3.1",
      //       "31.7"
      //   ],
      //   "pointsInTime":[
      //       "2001-01-01T00:00:00Z",
      //       "2005-01-01T00:00:00Z",
      //       "2015-01-01T00:00:00Z",
      //       "2009-01-01T00:00:00Z",
      //       "2006-01-01T00:00:00Z",
      //       "2008-01-01T00:00:00Z",
      //       "2011-01-01T00:00:00Z",
      //       "2002-01-01T00:00:00Z",
      //       "2000-01-01T00:00:00Z",
      //       "2003-01-01T00:00:00Z",
      //       "2010-01-01T00:00:00Z",
      //       "2014-01-01T00:00:00Z",
      //       "2007-01-01T00:00:00Z",
      //       "2012-01-01T00:00:00Z",
      //       "2016-01-01T00:00:00Z",
      //       "2013-01-01T00:00:00Z",
      //       "2004-01-01T00:00:00Z"
      //   ],
      //   "unitLabel":{
      //       "xml:lang":"en",
      //       "type":"literal",
      //       "value":"percent"
      //   },
      //   "valType":{
      //       "type":"uri",
      //       "value":"http://www.w3.org/2001/XMLSchema#decimal"
      //   },
      //   "dataType":"number",
      //   "valueType":"join-collection-number",
      //   "uri":"http://www.wikidata.org/prop/direct/P1279",
      //   "name":"inflation rate",
      //   "description":"percent change in the consumer price index (CPI)",
      //   "units":"percent",
      //   "examples":[
      //       "-1",
      //       "3.1",
      //       "6.3"
      //   ],
      //   "sortedTemporalVals":[
      //       {
      //         "time":"2000-01-01T00:00:00Z",
      //         "val":"5"
      //       },
      //       {
      //         "time":"2001-01-01T00:00:00Z",
      //         "val":"16.4"
      //       },
      //       {
      //         "time":"2002-01-01T00:00:00Z",
      //         "val":"19.3"
      //       },
      //       {
      //         "time":"2003-01-01T00:00:00Z",
      //         "val":"35.8"
      //       },
      //       {
      //         "time":"2004-01-01T00:00:00Z",
      //         "val":"31.7"
      //       },
      //       {
      //         "time":"2005-01-01T00:00:00Z",
      //         "val":"31.6"
      //       },
      //       {
      //         "time":"2006-01-01T00:00:00Z",
      //         "val":"64.8"
      //       },
      //       {
      //         "time":"2007-01-01T00:00:00Z",
      //         "val":"4.7"
      //       },
      //       {
      //         "time":"2008-01-01T00:00:00Z",
      //         "val":"6.8"
      //       },
      //       {
      //         "time":"2009-01-01T00:00:00Z",
      //         "val":"-4.4"
      //       },
      //       {
      //         "time":"2010-01-01T00:00:00Z",
      //         "val":"3.3"
      //       },
      //       {
      //         "time":"2011-01-01T00:00:00Z",
      //         "val":"6"
      //       },
      //       {
      //         "time":"2012-01-01T00:00:00Z",
      //         "val":"3.6"
      //       },
      //       {
      //         "time":"2013-01-01T00:00:00Z",
      //         "val":"3.1"
      //       },
      //       {
      //         "time":"2014-01-01T00:00:00Z",
      //         "val":"1.6"
      //       },
      //       {
      //         "time":"2015-01-01T00:00:00Z",
      //         "val":"2.3"
      //       },
      //       {
      //         "time":"2016-01-01T00:00:00Z",
      //         "val":"-1"
      //       }
      //   ],
      //   "parentEntityExample":"Iraq",
      //   "parentEntityExampleUri":"http://www.wikidata.org/entity/Q796",
      //   "percentJoinable":1,
      //   "summaryStats":{
      //       "max":22,
      //       "min":-1,
      //       "mean":8.945,
      //       "mode":6.3,
      //       "firstQuartileEnd":2.7,
      //       "median":6.3,
      //       "thirdQuartileEnd":16.25,
      //       "variance":63.749475
      //   },
      //   "histogramBins":[
      //       {
      //         "min":-1,
      //         "max":1.3,
      //         "count":2
      //       },
      //       {
      //         "min":1.3,
      //         "max":3.6,
      //         "count":4
      //       },
      //       {
      //         "min":3.6,
      //         "max":5.9,
      //         "count":0
      //       },
      //       {
      //         "min":5.9,
      //         "max":8.2,
      //         "count":8
      //       },
      //       {
      //         "min":8.2,
      //         "max":10.5,
      //         "count":0
      //       },
      //       {
      //         "min":10.5,
      //         "max":12.8,
      //         "count":1
      //       },
      //       {
      //         "min":12.8,
      //         "max":15.1,
      //         "count":0
      //       },
      //       {
      //         "min":15.1,
      //         "max":17.4,
      //         "count":0
      //       },
      //       {
      //         "min":17.4,
      //         "max":19.7,
      //         "count":0
      //       },
      //       {
      //         "min":19.7,
      //         "max":22,
      //         "count":5
      //       }
      //   ],
      //   "sampleData":[
      //       -1,
      //       -1,
      //       6.3,
      //       3.1,
      //       6.3,
      //       6.3,
      //       2.3,
      //       10.5,
      //       22,
      //       22,
      //       6.3,
      //       2.3,
      //       22,
      //       6.3,
      //       6.3,
      //       2.3,
      //       22,
      //       6.3,
      //       22,
      //       6.3
      //   ]
      // },


      awaitReload: false,
      tooltipModel: false
    }
  },

  sockets:{

    downloaddataonclient(data){
      console.log('ON CLIENT DOWNLOAD DATA RECIEVED ', data)

      let csvContent = "data:text/csv;charset=utf-8,";
        var keys = Object.keys(data[0]);
        csvContent += keys.join(',') + "\r\n";
        data.forEach(function (rowArray) {
            var row = []
            for (let item in rowArray) {
                row.push(rowArray[item]);
            }
            csvContent += row.join(',') + "\r\n";
        });
        this.writeCSV(csvContent, "datadownloadedauger.csv");
    },


    modelmetricsMultiIter(d){
      if(Object.keys(this.metricsObj).length == 0){
        //base model
        this.metricsObj = {1:d}
      }else{
        var keys = Object.keys(this.metricsObj)
        var v = +keys[keys.length-1]+1
        this.metricsObj[v] = d;
      }

      //adding to cut content
      let num =5, obj = {}
      if(Object.keys(this.metricsObj).length > num){
        let keyarr = Object.keys(this.metricsObj).sort()
         keyarr=keyarr.reverse().slice(0,num-1);
         keyarr.forEach((el,i) =>{
           obj[el] = this.metricsObj[el]
         })
         //keep the orig model
         obj[1] = this.metricsObj[1]
         this.metricsObj = obj;
      }

      this.$forceUpdate(); 
      console.log('model metrics multiple iters updation ', this.$store.state.socket, d, this.metricsObj);
      store.commit('setModelIter', 1);  
      store.commit('setModelMultiIter', d);
      this.logModelMetrics(d)
    }
    //
  },

  mounted: function() {
    this.updateDataTable();
  },

  computed: {
    findMouseOverModelCols(){
      // console.log('in find mouse over model cols')
      return this.$store.state.socket.mouseOverModelCols;;
    },
    active() {
      return !_.isEmpty(this.$store.state.socket.dataAugTable);
    },
    materializeFinish() {
      return this.$store.state.socket.materializeFinished;
    },
    modelIteration(){
      return this.$store.state.socket.modelIteration;
    },
    experimentLoaded(){
      return this.$store.state.meta.experimentLoaded;
    },
    buildModelButtonActive() {
      // return this.$store.state.socket.vast20expMode && this.$store.state.meta.currentPhase > 2;
      return true;
    }

  },

  watch: {
    experimentLoaded(value) {
      if (!value) {
        this.experimentKey += 1;
        this.awaitReload = true;
      }
      if (value) {
        this.firstColumnData = {
          children: []
        };
        this.updateDataTable();
        this.awaitReload = false;
      }
    },
    materializeFinish(value) {
      if(value) {
        this.firstColumnData = {
          children: []
        };
        this.updateDataTable();
      }
    },
    metricsObj(v){
      console.log(' metrics obj updates ', this, v)
    }
  },

  methods: {

      writeCSV(csvContent, fileName = "datadownloadedauger.csv") {
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        link.innerHTML = "Click Here to download";
        document.body.appendChild(link);
        link.click();
    },



    // method to trigger dowload csv data
    downloadData () {
      let vueThis = this;
      console.log("starting download data");
      let colArr = this.$store.state.socket.attributesInCurrentDataTable, newArr = []
      let removecollist = this.$store.state.socket.removeColList;
      console.log('col arr seen  in materialize', colArr, removecollist, this.$store.state.socket)
      for(let i = 0; i<colArr.length;i++){
        let ind = removecollist.indexOf(colArr[i]['key'])
        if(ind == -1) {
          newArr.push(colArr[i])
        }
      }   

      this.$socket.emit("downloadDataTrigger",newArr);
    },

    testTooltip(index){
      let check = false
      // console.log('lets check index in model tooltip ', index, this.index)
      if(this.index == index) check = this.tooltipModel
      return check
    }, 

    logModelMetrics(modelMetricsData) {
      if (modelMetricsData) {
        this.$store.commit('SEND_VAST20_LOG_MESSAGE', {
          'logType': 'modelMetrics',
          'modelMetrics': modelMetricsData,
          'timestamp': new Date()
        });
      }
    },
     checkMouseOverModelCols(index){
      let check = false
      let arr = this.findMouseOverModelCols;
      if(arr.length > 0 && index == this.index) check = true;
      else check = false
      return check
    },
      mouseEnterModelMetrics(obj, index) {
        this.index = index
        let modelobj = this.metricsObj;
        let colsthis = obj['col_names']
        let colorig = modelobj[1]['col_names']
        let newcols = colsthis.filter(value => !colorig.includes(value)); // gives a list
        newcols = colsthis
        // console.log(' col comparisons ', colsthis, colorig, newcols)
        this.tooltipModel = true
        store.commit('updateMouseOverModelCols',newcols);   
    },
    mouseLeaveModelMetrics(obj) {
        setTimeout(()=> {
          this.tooltipModel = false
        }, 0)
        store.commit('updateMouseOverModelCols',[]);
    },

    getData () {
      // console.log("trying to get data darn it")
      this.loading = true;
      return new Promise((resolve, reject) => {
        const { sortBy, descending, page, rowsPerPage } = this.pagination;
        let vueThis = this;
        let intervalId = setInterval(function() {
          vueThis.$socket.emit("tableEndpoint", vueThis.pagination, vueThis.searchTerms, function(data) {
            // console.log("our data is ", data.items[0])
            vueThis.loading = false;
            clearInterval(intervalId);
            resolve(data);
          });
        }, 3000);
      });
    },

    updateDataTable () {
      let vm = this;
      this.getData()
        .then(data => {
          if (!data) return;
          vm.allAttributeData = data.items;
          let firstColumnData = {
            key: "baseball",
            value: "",
            children: []
          };
          data.headers.forEach(datum => {
            let columnMetadata = this.$store.state.socket.rawDataDesc.dataResources[0].columns.filter((c) => c.colName === datum.value)[0];
            
            [0].colDescription
            let dataType = isNaN(vm.allAttributeData[0][datum.value]) ? "string" : "number";
            firstColumnData.children.push({
              key: datum.value,
              value: "",
              dataType: dataType,
              description: columnMetadata.colDescription,
              parent: "",
              children: [],
              derived: false,
              includeInData: true
            });
          });
          vm.firstColumnData = firstColumnData;
          store.commit('updateAttributesInCurrentDataTable', vm.firstColumnData.children);
        }).catch(console.log);
    },

    showConfirmAndLoadingDialog () {
      this.confirmAndLoadingDialog = true;
    },

    hideConfirmAndLoadingDialog () {
      this.confirmAndLoadingDialog = false;
    },

    showTemporalDialog (colVal) {
      // console.log("received showTemporalDialog in data augmentation")
      this.temporalDialog = true;
      this.temporalDialogVal = colVal;
    },

    hideTemporalDialog () {
      this.temporalDialog = false;
    },

    showThroughJoinDialog (throughJoinInstructions) {
      this.throughJoinDialog = true;
      this.throughJoinInstructions = throughJoinInstructions;
    },

    hideThroughJoinDialog (throughJoinResults) {
      this.throughJoinDialog = false;
      this.throughJoinResults = throughJoinResults;
    },

    acceptTemporalFilter (filterResults) {
      // console.log("acceptTemporalFilter called with filter results", filterResults)
      const filteredAttribute = filterResults && filterResults.filteredAttribute;
      if (filteredAttribute) {
        this.$set(this.temporalFilters, filteredAttribute, filterResults)
      }
      this.hideTemporalDialog();
    },

    updateAttributeList (attributeList) {
      this.currentAttributeList = attributeList;
    },

    toggleLoadingTrue () {
      this.loading = true;
    },

    toggleLoadingFalse () {
      this.loading = false;
    },

    updateAllAttributeData (newAllAttributeData) {
      this.allAttributeData = newAllAttributeData;
      // console.log(newAllAttributeData);
    }
}
};
</script>

<style scoped>
#modelmetricsdivId{
  height : 35px;
  display: flex;
  align-items: center;
  /* margin: 10px; */
  border: 1px solid gray;
  font-size:0.9em;
  position: absolute;
}

.modelMetricsCheckedClass{
  background: lightgray;
}

.modelmetricwrapdiv{
  display:flex;
  overflow-x:auto;
  width:auto;
}

.metricVal{
  font-weight: 700;
  font-size: 1.1em;
}

.modelMetricsRow{
  /* margin : 1px; */
  cursor: default;
  min-width: 250px;
  /* font-size: 0.5em; */
  display:flex;
  align-items: center;
  justify-content:center;
}


.tooltipModelMetrics{
  display: flex;
  flex-direction: column;
  position: absolute;
  top: -220px;
  left: -50px;
  z-index:10;
  background: #414040;
  color: white;
  border-radius: 10px;
  max-height: 300px;
  width:330px;
  overflow-Y: auto;
  paddding: 5px;
}

.featurewtrow{
  display: flex;
  border-bottom: 1px solid lightgray;
  align-items: flex-start;
  padding: 2px;
}
</style>
