<template>
  <v-card v-if="experimentLoaded" :key="experimentKey">
    <v-card-title>
      <v-spacer></v-spacer>
      <!-- <div class="bottom_header" v-bind:style="styleHeader">
        <md-button class="rawbtn" :md-ripple="false" v-on:click="updateTable"
          >Raw Data</md-button
        >
        <md-button class="actorbtn" :md-ripple="false" v-on:click="updateTable"
          >Level1_Data</md-button
        >
        <md-button class="awardsbtn" :md-ripple="false" v-on:click="updateTable"
          >Level2_Data</md-button
        >
      </div>-->
      <v-text-field append-icon="search" label="Search" single-line hide-details v-model="search"></v-text-field>
      <div class="attrbtndiv">
        <button
          class="tablemovebtn tableViewItemButton ui basic icon button"
          title="prev columns"
          @click="tablePrevPage"
        >
          <i class="iconbtn angle left icon"></i>
        </button>
        <button
          class="tablemovebtn tableViewItemButton ui basic icon button"
          title="next columns"
          @click="tableNextPage"
        >
          <i class="iconbtn angle right icon"></i>
        </button>
      </div>
    </v-card-title>

    <v-data-table
      :headers="modHeaders"
      :items="items"
      :pagination.sync="pagination"
      :total-items="totalItems"
      :loading="loading"
      :rows-per-page-items="[5,10,25]"
      v-model="selected"
      item-key="d3mIndex"
      v-bind:key="'table'"
    >
      <template slot="items" slot-scope="props">
        <tr         
          v-bind:key="props.item.d3mIndex"
          :d3mIndex="props.item.d3mIndex"
          @mouseenter="rowMouseEnter(props.item)"
          @mouseleave="rowMouseLeave(props.item)" 
          @click="click(props.item)"
          class="tablerow"
        >
        <transition-group
          name="slide-fade"
          tag="div"
          class='table_transition'
        >
          <!-- <commented selectable check box below . -->
          <!-- <td v-bind:key="'selected_item'">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td> -->
          <td
            v-bind:key="props.item.d3mIndex+'_'+header.value"
            v-for="header in headers"
            class="text-xs-center"
            :title="getTooltipText(header,props.index)"
            :class="getClassForColumns(header)"
          >
          <span>{{ props.item[header.value] }}</span>
          </td>
          </transition-group>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
//using the suggested solution to watch vuex data from:
//https://stackoverflow.com/questions/43270159/vuejs-2-how-to-watch-store-values-from-vuex
import { mapGetters } from "vuex";
import store from "@/store";
import $ from "jquery";
import * as d3 from "d3";

export default {
  name: "RawDataTableView",
  mounted() {
    // console.log('on mounted store is ', this.dataAugTable, this.$store.state.socket, this.$store.state.socket.dataAugTable)
    this.updateTable();
  },
  data() {
    return {
      search: "",
      awaitReload: false,
      experimentKey: 0,
      selected: [],
      totalItems: 0,
      raw_items: [],
      fullcol_data: [],
      loading: true,
      headers: [],
      modHeaders: [],
      pagination: {},
      d3mIndexHovered: null,
      currentPage: 0,
      showColumns: 11,
      colLen: -1,
      itemCalled: 0,
      augColumns: [],
      removeColList:[],
      styleHeader: {
        display: "flex",
        "flex-direction": "row",
        padding: "5px"
      },      
      dataAugColDict: {},
      dataParentAugColDict:{}
    }
  },
  computed: {
    experimentLoaded(){
      return this.$store.state.meta.experimentLoaded;
    },
    items() {
      this.itemCalled += 1;
      // if(this.itemCalled<1) return ;
      let new_items = [];
      console.log("items called ", this.raw_items);
      for (let i = 0; i < this.raw_items.length; i++) {
        let data_object = this.raw_items[i];
        let new_object = {};
        let keys = Object.keys(data_object);
        for (let j = 0; j < keys.length; j++) {
          let key = keys[j];
          let value = data_object[key];
          if (typeof value === "string" && value.length > 20) {
            value = value.substring(0, 20) + "...";
          }
          new_object[key] = value;
        }
        new_items.push(new_object);
      }
      console.log('items returned ', new_items)
      return new_items;
    },
    xLinkingHilite() {
      if (this.$store.state.socket.xLinking.highlight) {
        var newStringArray = this.$store.state.socket.xLinking.xLinkIndexes.map(
          d => "" + d
        );
        return {
          array: newStringArray,
          set: new Set(newStringArray)
        };
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
      };
    },
    dataAugTable() {
      return this.$store.state.socket.dataAugTable;
    },
    materializeFinish() {
      return this.$store.state.socket.materializeFinished;
    },
    removeColName() {
      return this.$store.state.socket.removeColName;
    },
    addColName() {
      return this.$store.state.socket.addColName;
    },
    phase(){
      return this.$store.state.meta.currentPhase;
    }
  },
  watch: {
    phase(){
      this.resetTableData();
      this.$store.commit('resetRawTableData', {});
      console.log('SEEN PHASE CHANGE IN RAW TABLE , RESETTING RAW TABLE DATA', this.phase, this.augColumns, this.dataParentAugColDict, this.$store.state)
    },
    experimentLoaded(value) {
      if (!value) {
        this.experimentKey += 1;
        this.awaitReload = true;
      }
      if (value) {
        this.firstColumnData = {
          children: []
        };
        if (this.$store.state.socket.vast20expMode) {
          this.$store.commit('updateDataAugTable', {});
          this.augColumns = [];
          this.dataAugColDict = {};
          this.dataParentAugColDict = {};
          setTimeout(() => {
            console.log("this.headers is ", this.headers)
            this.updateTable();
            console.log("after update, this.headers is ", this.headers)
            this.awaitReload = false;
          },
          0);
        }
      }
    },
    addColName() {
      const vueThis = this;
      let index = this.removeColList.indexOf(this.addColName)
      if(index!= -1){
        this.removeColList.splice(index,1)
        store.commit('updateRemoveColList', this.removeColList);
      }
      console.log("in raw table view added col ", this.removeColName, this.removeColList);
      console.log("there, raw_items is initially ", this.raw_items);
      this.raw_items = this.checkRemovedCols(this.raw_items);
      console.log("after checkRemovedCols, raw_items is initially ", this.raw_items);
      this.raw_items = this.sortColumns(this.raw_items);
      console.log("after sortColumns, raw_items is initially ", this.raw_items);
      let headers = Object.keys(this.raw_items[0]);
      let headersArr = [];
      headers.forEach(function(d, i) {
          let obj = {
            text: d,
            value: d,
            align: "center",
            sortable: true
          };
          headersArr.push(obj);
        });
      this.headers = headersArr;
    },
    removeColName() {
      const vueThis = this;
      this.removeColList.push(this.removeColName)
      // console.log("in raw table view  removing col ", this.removeColName, this.removeColList);
      let headers = this.headers.slice(0);
      let headersArr = [];
      headers.forEach(function(d, i) {
        if (d.text !== vueThis.removeColName) {
          headersArr.push(d);
        }
      });
      store.commit('updateRemoveColList', this.removeColList);
      this.headers = headersArr;
    },
    materializeFinish(value){
      console.log("materializeFinish changed, it is ", value)
      if(value) {
        this.augColumns = [];
      }
      // console.log('in raw table materialize finishes ', this.materializeFinish, this.augColumns, this.raw_items)
    },
    dataAugTable() {
      console.log('data aug updated ... ', this.dataAugTable, this.fullcol_data, this.dataAugColDict, this.dataParentAugColDict, this.$store.state.socket)
      if(this.dataAugTable.hasOwnProperty('data') == false) return
      var vueThis = this;
      // console.log("this.dataAugTable is ", this.dataAugTable);
      let colNames = Object.keys(this.dataAugTable["data"][0]);
      let existColNames = Object.keys(this.raw_items[0]);
      let newAttrOrig = this.dataAugTable["augCol"]
      // console.log('through checking ', newAttrOrig)
      if(newAttrOrig.includes('through') == true) {
        // console.log('through found ',this.$store.state.socket )
        store.commit('updateDataAugTable', {}); // newDataset
        return
      }
      let newAttr = this.dataAugTable["augCol"].split(' - ')[1]
      // let newAttrSplit = newAttrOrig.split(' (')[0]; //newAttr
      let newAttrSplit = newAttrOrig

      // console.log('new cols ', newAttrOrig, newAttrSplit, newAttr)

      let parAttr = this.dataAugTable["parCol"];
      try {
        this.dataParentAugColDict[parAttr].push(newAttrOrig);
      } catch (e) {
        this.dataParentAugColDict[parAttr] = [newAttrOrig];
      }

      let datarep = this.dataAugTable["data"].slice(0);
      let indexKey = "d3mIndex";
      var datarep_dict = this.dataAugColDict;

      // console.log(' raw table new col name  ', datarep, newAttr, parAttr, newAttrSplit)
      datarep.forEach(function(d, i) {
        var val = d[newAttrSplit];
        if (typeof val == "undefined") val = "-";
        try {
          let obj = datarep_dict[d[indexKey]];
          obj[newAttrOrig] = val;
          datarep_dict[d[indexKey]] = obj;
        } catch (e) {
          let obj = {};
          obj[newAttrOrig] = val;
          datarep_dict[d[indexKey]] = obj;
        }
      });

      let dataTemp = this.raw_items.slice(0);
      dataTemp.forEach(function(d, i) {
        d[newAttrOrig] = datarep_dict[d[indexKey]][newAttrOrig];
      });
      this.raw_items = dataTemp.slice(0);
      this.raw_items = this.sortColumns(this.raw_items);

      let headers = Object.keys(this.raw_items[0]);
      let headersArr = [];
      headers.forEach(function(d, i) {
        let obj = {
          text: d,
          value: d,
          align: "center",
          sortable: true
        };
        headersArr.push(obj);
      });

      this.headers = headersArr;

      //update the full_coldata
      this.fullcol_data.forEach(function(d, i) {
        d[newAttrOrig] = datarep_dict[d[indexKey]][newAttrOrig];
      });
      this.fullcol_data = this.sortColumns(this.fullcol_data);
      this.colLen = Object.keys(this.fullcol_data[0]).length;
      // console.log("datarep ", datarep, this.headers, this.$store.state.socket);
      // console.log("data aug parent col dict  ", this.dataParentAugColDict);
    },

    totalItems() {
      // console.log("TOTAL ITEMS", this.totalItems);
    },
    raw_items() {
      // console.log("raw items updated ", this.raw_items);
    },
    headers() {
      this.calcHeaders();
    },
    xLinkingHilite() {
      let indexSet = this.xLinkingHilite.set;
      let tableRows = d3.select(this.$el).selectAll(".tablerow");
      tableRows.each(function() {
        let tableRow = d3.select(this);
        if (indexSet.has(tableRow.attr("d3mIndex"))) {
          tableRow.style("background-color", "#eeeeee");
        } else {
          tableRow.style("background-color", "");
        }
      });
    },
    xLinkingSelect() {
      //console.log("enter xLinkingSelect", this.xLinkingSelect.array);
      let newArray = this.xLinkingSelect.array.map(d3mIndex => {
        return { d3mIndex: d3mIndex };
      });
      this.selected = newArray;
      //console.log("exit xLinkingSelect", newArray);
    },
    search() {
      //console.log("search: ", this.search, this.totalItems);
      //console.log("pagination: ", this.pagination);
      //this is hacky: trigger actions for change in pagination object
      //search uses the same endpoint in the backend
      this.pagination.__ob__.dep.notify();
    },
    pagination: {
      handler() {
        this.getData().then(data => {
          if (!data) return;
          // console.log("pagination callled ", data, this.pagination);
          let dataInjest = data.items.map(d => {
            let obj = {}
            for (let item in d){
              if (item.includes('through') == false){
                obj[item] = d[item]
              }
            }
            return obj
          });

          dataInjest = this.sortColumns(dataInjest)

          this.raw_items = dataInjest //data.items;
          // update raw items with new keys from dataaug
          let indexKey = "d3mIndex";
          let datadict = this.dataAugColDict;
          if (
            Object.keys(datadict).length != 0 &&
            typeof datadict != "undefined"
          ) {
            let newKeys = Object.keys(datadict[Object.keys(datadict)[0]]);
            this.raw_items.forEach(function(d, i) {
              let key = d[indexKey];
              for (let j = 0; j < newKeys.length; j++) {
                d[newKeys[j]] = datadict[key][newKeys[j]];
              }
            });
          }

          //update the full_coldata
          this.fullcol_data = this.raw_items.slice(0);
          this.totalItems = data.total;
        });
      },
      deep: true
    }
  },
  methods: {
    resetTableData(){
          this.search = ""
          this.awaitReload= false
          this.experimentKey= 0
          this.selected = []
          this.totalItems= 0
          this.raw_items= []
          this.fullcol_data= []
          this.loading = true
          this.headers = []
          this.modHeaders = []
          this.pagination = {}
          this.d3mIndexHovered= null
          this.currentPage = 0
          this.showColumns = 11
          this.colLen = -1
          this.itemCalled = 0
          this.augColumns = []
          this.removeColList =[]
          this.styleHeader = {
            display: "flex",
            "flex-direction": "row",
            padding: "5px"
          }  

          this.dataAugColDict = {}
          this.dataParentAugColDict = {}
    },
    checkRemovedCols(dataGiven){
      let vueThis = this
      let keys = Object.keys(dataGiven[0]);
      // console.log(' given data in check remove ', dataGiven, this.removeColList, keys)
      let newData = []
      dataGiven.forEach(function(d,i){
        let obj={}
        for(let j=0;j<keys.length;j++){
          let findId = vueThis.removeColList.indexOf(keys[j])
          if(findId == -1){
            obj[keys[j]] = d[keys[j]]
          }
        }
        newData.push(obj);
      })
      // console.log(' new data in check remove ', newData)
      return newData;
    },
    updateTable() {
      console.log("updateTable() called")
      this.getData()
        .then(data => {
          if (!data) return;
          this.fullcol_data = data.items.slice(0);
          this.colLen = Object.keys(this.fullcol_data[0]).length;

          this.raw_items = this.calcColsToShow(data.items);
          this.totalItems = data.total;
          console.log("checking data ", this.raw_items, data, this.headers);
          // console.log('checking total items ', data.total)
          // console.log('checking headers ', data.headers)
        })
        .catch(console.log);

    },
    sortColumns(data) {
      let parAugObj = this.dataParentAugColDict;
      let keys = Object.keys(parAugObj);
      let indexKey = "d3mIndex";
      let augCols = [indexKey];
      for (let item in parAugObj) {
        let sortCol = parAugObj[item]; // keys[0] = parAttr
        augCols.push(item);
        for (let i = 0; i < sortCol.length; i++) {
          if (augCols.indexOf(sortCol[i]) == -1) augCols.push(sortCol[i]);
        }
      }
      this.augColumns = augCols.slice(0);

      let dataKeys = Object.keys(data[0]);
      for (let i = 0; i < dataKeys.length; i++) {
        let el = dataKeys[i];
        if (augCols.indexOf(el) == -1) {
          augCols.push(el);
        }
      }
      let newData = [];
      data.forEach(function(d, m) {
        let obj = {};
        for (let i = 0; i < augCols.length; i++) {
          obj[augCols[i]] = d[augCols[i]];
        }
        newData.push(obj);
      });
      // console.log('sorting aug cols ', augCols, this.dataParentAugColDict, newData)
      return newData;
    },
    calcHeaders() {
      // console.log("calc headers called ", this.headers);
      var headernew = [];
      let newHeaders = this.headers.map(d => d);

      newHeaders.forEach(function(d, i) {
        // added if loop to not included d3mIndex
        // if(d.text !== 'd3mIndex'){
        //   headernew.push(d)
        // }
        if(d['text'].includes('through') == false) {
          headernew.push(d)        
        }

        // if(keysAllowed.indexOf(d.text)!=-1){
        // headernew[i] = d
        // }
      });
      // commenting out header name selected 
      // headernew.unshift({
      //   align: "center",
      //   // it would be much cooler if rows could be sorted by selection
      //   // but because the backend does sorting and has no selection model
      //   // this is not possible at the moment
      //   sortable: false,
      //   text: "selected",
      //   value: "selected"
      // });
      // console.log("new headers looks like ", headernew);
      this.modHeaders = headernew;
    },

    tableNextPage(e) {
      let vm = this;
      if (vm.colLen - vm.currentPage * vm.showColumns > vm.showColumns) {
        vm.currentPage += 1;
      }
      vm.raw_items = vm.calcColsToShow(vm.fullcol_data.slice(0));
      // console.log("requesting next page .... ", vm.currentPage, vm.raw_items);
    },

    tablePrevPage(e) {
      let vm = this;
      if (vm.currentPage > 0) vm.currentPage -= 1;
      vm.raw_items = vm.calcColsToShow(vm.fullcol_data.slice(0));
      // console.log(
      //   "requesting prev page .... ",
      //   vm.currentPage,
      //   vm.fullcol_data
      // );
    },
    calcColsToShow(dataIn) {
      dataIn = this.checkRemovedCols(dataIn);

      let vm = this;
      let cp = vm.currentPage;
      let sp = vm.showColumns * cp;
      let ep = sp + vm.showColumns;
      let minus = ep - vm.colLen;
      // console.log('minus ', sp,ep,minus, vm.showColumns, cp, vm.colLen)
      if (minus > 0) sp = sp - minus;
      let newData = [];
      dataIn.forEach(function(d, i) {
        let obj = {};
        let itemlist = Object.keys(d);
        for (let j = 0; j < Object.keys(d).length; j++) {
          // if (j < sp) continue;
          // if (j > ep) continue;
          // We are just going to attach all the data to each row, and only show the columns that
          // are on the page, so that we don't run into issues augmenting columns that might be
          // on the second page
          obj[itemlist[j]] = d[itemlist[j]];
        }
        newData.push(obj);
      });
      //check for d3mindex key
      let indexKey = "d3mIndex";
      if (Object.keys(newData[0]).indexOf(indexKey) == -1) {
        dataIn.forEach(function(d, i) {
          newData[i][indexKey] = d[indexKey];
        });
      }
      // console.log(' before sorting in calc cols ', newData)
      // newData = this.sortColumns(newData);
      let headers = Object.keys(newData[0]);
      let headersArr = [];
      headers.forEach(function(d, i) {
        let obj = {
          text: d,
          value: d,
          align: "center",
          sortable: true
        };
        headersArr.push(obj);
      });
      this.headers = headersArr;

      return newData;
    },

    getTooltipText(header, index) {
      return this.raw_items[index][header.value];
    },

    getClassForColumns(header) {
      let augCols = this.augColumns;
      // console.log('col in classes ', header.text, augCols, this.materializeFinish)
      if(this.materializeFinish) return "cl_regCol";
      if (augCols.indexOf(header.text) == -1 || header.text == "d3mIndex") {
        return "cl_regCol";
      } else {
        return "cl_augCol";
      }
    },
    rowMouseLeave(data) {
      // console.log("ROW MOUSE LEAVE", data.d3mIndex);
      this.d3mIndexHovered = null;
      // console.log("NotOK");
      store.commit("updateXLinking", {
        xLinkIndexes: [],
        highlight: false,
        visValue: false,
        visType: "rawTable"
      });
    },
    rowMouseEnter(data) {
      // console.log("ROW MOUSE ENTER", data.d3mIndex);
      this.d3mIndexHovered = "" + data.d3mIndex;
      store.commit("updateXLinking", {
        xLinkIndexes: ["" + data.d3mIndex],
        highlight: true,
        visValue: true,
        visType: "rawTable"
      });
    },
    click(item) {
      let d3mIndex = "" + item.d3mIndex;
      // console.log('clicked row ', item)
      if (this.xLinkingSelect.set.has(d3mIndex)) {
        //deselect node
        store.commit("xLinkUnSelect", d3mIndex);
      } else {
        //select node
        store.commit("xLinkSelect", d3mIndex);
      }
      // console.log("click", d3mIndex);
      //this.selected.push({d3mIndex: 99});
    },
    getData() {
      this.loading = true;
      return new Promise((resolve, reject) => {
        const { sortBy, descending, page, rowsPerPage } = this.pagination;
        let vueThis = this;
        let intervalId = setInterval(function() {
          vueThis.$socket.emit(
            "tableEndpoint",
            vueThis.pagination,
            vueThis.search,
            function(data) {
              vueThis.loading = false;
              clearInterval(intervalId);
              resolve(data);
            }
          );
        }, 3000);
      });
    }
  },
  sockets: {
    resetRawDataTable(){
      this.resetTableData();
      console.log('RESET THE RAW DATA TABLE DATA .... ')
    },
    tableUpdate() {
      console.log("table update");
      this.getData()
        .then(data => {
          let dataInjest = data.items.map(d => {
            let obj = {}
            for (let item in d){
              if (item.includes('through') == false){
                obj[item] = d[item]
              }
            }
            return obj
          });
          console.log("RAW TABLE NEW DATA INJEST", data, dataInjest);
          if (data) {
            dataInjest = this.sortColumns(dataInjest)
            this.fullcol_data = dataInjest
            this.raw_items = this.calcColsToShow(this.raw_items);
            this.totalItems = data.total;
            // following is added to remove d3mindex to be shown in the table ==========
            // let newRawItems = []
            // this.raw_items.forEach(function(d){
            //   let obj = {}
            //   for (let item in d){
            //     if(item !== 'd3mIndex'){
            //       obj[item] = d[item]
            //     }
            //   }
            //   newRawItems.push(obj);
            // })
            // this.raw_items = newRawItems
            // above is added to remove d3mindex to be shown in the table ==========

            // console.log("BUT NOW, RAW ITEMS ARE", this.raw_items);

            // this.headers = data.headers;
          } else {
            this.raw_items = [];
            this.totalItems = 0;
            this.headers = [];
          }
        })
        .catch(console.log);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.attrbtndiv {
  margin-left: 10px;
  margin-top: 10px;
}
.v-card__title {
  display: flex;
  align-items: flex-start;
}

/* following for animation effects */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}

.cl_augCol {
  color: #00b5ad;
}

.table_transition{
  display: contents;
}
</style>