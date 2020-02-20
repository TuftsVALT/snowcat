<template>
  <div class="bottom_rack" id="bottom_rackid">
    <div class="bottom_header" v-bind:style="styleHeader">
      <h1 class="bottom_title">Data</h1>
      <md-button class="rawbtn" :md-ripple="false" v-on:click="updateTable"
        >Raw Data</md-button
      >
      <md-button class="actorbtn" :md-ripple="false" v-on:click="updateTable"
        >Level1_Data</md-button
      >
      <md-button class="awardsbtn" :md-ripple="false" v-on:click="updateTable"
        >Level2_Data</md-button
      >
      <!-- <md-button class="nextBtn md-icon-button" :md-ripple="false" v-on:click="updateTable"></md-button> -->
      <div class="attrbtndiv">
        <md-field class="searchfield">
          <label>Search Atributes....</label>
          <md-input v-model="initial"></md-input>
        </md-field>
        <button
          class="tablemovebtn tableViewItemButton ui basic icon button"
          title="next columns"
          @click="tableNextPage"
        >
          <i class=" iconbtn angle double right icon"></i>
        </button>
        <button
          class="tablemovebtn tableViewItemButton ui basic icon button"
          title="prev columns"
          @click="tablePrevPage"
        >
          <i class="iconbtn angle double left icon"></i>
        </button>
      </div>
    </div>
    <div class="br_body" v-bind:style="styleObject">
      <TableBase :base-data="renderData"></TableBase>
    </div>
    <div class="tablebaselowbar">
      <button
        class="tablemovebtn tableViewItemButton ui basic icon button"
        title="next rows"
        @click="tableUpPage"
      >
        <i class="iconbtn angle double up icon"></i>
      </button>
      <button
        class="tablemovebtn  tableViewItemButton ui basic icon button"
        title="prev rows"
        @click="tableDownPage"
      >
        <i class="iconbtn angle double down icon"></i>
      </button>
    </div>
  </div>
</template>

<script>
import store from "@/store";
import Vue from "vue";
import TableBase from "@/components/cards/DataAugmentationComponents/TableBase.vue";
import {
  MdButton,
  MdContent,
  MdTabs,
  MdField
} from "vue-material/dist/components";
import "vue-material/dist/vue-material.min.css";
import "vue-material/dist/theme/default.css";
import * as d3 from "d3";
import * as d3v3 from "d3v3"

Vue.use(MdButton);
Vue.use(MdField);

export default {
  name: "BottomRack",

  components: {
    TableBase
  },

  props: {
    dataView: {
      default: ""
    }
  },

  data: () => ({
    initial: "",
    currentPage: 0,
    currentRowPage: 0,
    showColumns: 5,
    showRows: 10,
    rowLen: 100,
    colLen: -1,
    baseData: [],
    renderData: [],
    rawData: [],
    castMemberData: [],
    castMemberDataJson: {},

    styleObject: {
      width: "100%",
      height: "100%",
      "max-height": "300px",
      overflow: "auto"
    },

    styleHeader: {
      display: "flex",
      "flex-direction": "row",
      padding: "5px"
    }
  }),

  mounted: function() {
    console.log('BOTTOM RACK MOUNTED ')
    let vm = this;

    d3v3.csv('./shared/static/local_testing_data/movieWikiData/data/ethiopian_data_1.csv', function(error,data){
      console.log(' loading error ', error);
      console.log(' data is ', data);
    })
    // Promise.all([d3.csv("/data/imdb_10.csv"), d3.json("/data/P161.json")]).then(
    Promise.all([
      d3.csv("/static/local_testing_data/movieWikiData/data/ethiopian_data_1.csv"),
      d3.json("/static/local_testing_data/movieWikiData/data/P161.json")
    ]).then(function(dataOut) {
      vm.baseData = dataOut[0];
      vm.baseData = vm.addId(vm.baseData);
      console.log('checking if base data ', vm.baseData)
      // vm.baseData = vm.makeHighDim(vm.baseData);
      // vm.baseData = vm.makeHighRowCount(vm.baseData);
      vm.colLen = Object.keys(vm.baseData).length;
      //prepare the render data
      let dataInterm = vm.calcColsToShow(vm.baseData.slice(0));
      vm.renderData = vm.calcRowsToShow(dataInterm.slice(0));
      // vm.renderData = vm.calcRowsToShow(vm.baseData.slice(0))
      console.log("checking default render data ", vm.renderData);
      // vm.renderData = vm.baseData.slice()
      vm.rawData = dataOut[0].slice(0);
      vm.castMemberDataJson = dataOut[1];
      vm.createActorsData();
      console.log("base and render data ", vm.baseData, vm.renderData);
      // console.log("base json ", vm.castMemberDataJson);
    });
  },

  watch: {
    dataView: function(value) {
      if (value != "") {
        this.updateTable(value);
      }
    }
  },

  methods: {


    addId(dataIn) {
      let leng = dataIn.length;
      dataIn.forEach(function(d, i) {
        d["_id"] = leng - i;
      });
      dataIn.sort(function(a, b) {
        return b["_id"] - a["_id"];
      });
      return dataIn;
    },

    tableUpPage(e) {
      let vm = this;
      if (vm.rowLen - vm.currentRowPage * vm.showRows > vm.showRows) {
        vm.currentRowPage += 1;
      }
      let dataInterm = vm.calcColsToShow(vm.baseData.slice(0));
      vm.renderData = vm.calcRowsToShow(dataInterm.slice(0));
      console.log(
        "requesting up page .... ",
        vm.currentRowPage,
        vm.baseData,
        vm.renderData
      );
    },

    tableDownPage(e) {
      let vm = this;
      if (vm.currentRowPage > 0) vm.currentRowPage -= 1;
      let dataInterm = vm.calcColsToShow(vm.baseData.slice(0));
      vm.renderData = vm.calcRowsToShow(dataInterm.slice(0));
      console.log(
        "requesting down page .... ",
        vm.currentRowPage,
        vm.baseData,
        vm.renderData
      );
    },

    tableNextPage(e) {
      let vm = this;
      if (vm.colLen - vm.currentPage * vm.showColumns > vm.showColumns * 2.5) {
        vm.currentPage += 1;
      }
      let dataInterm = vm.calcColsToShow(vm.baseData.slice(0));
      vm.renderData = vm.calcRowsToShow(dataInterm.slice(0));
      console.log("requesting next page .... ", vm.currentPage);
    },

    tablePrevPage(e) {
      let vm = this;
      if (vm.currentPage > 0) vm.currentPage -= 1;
      let dataInterm = vm.calcColsToShow(vm.baseData.slice(0));
      vm.renderData = vm.calcRowsToShow(dataInterm.slice(0));
      console.log("requesting next page .... ", vm.currentPage);
    },

    calcRowsToShow(dataIn) {
      let vm = this;
      let cp = vm.currentRowPage;
      let sp = vm.showRows * cp;
      // let ep = sp + vm.showRows;
      return dataIn.splice(sp, vm.showRows);
    },

    calcColsToShow(dataIn) {
      let vm = this;
      let cp = vm.currentPage;
      let sp = vm.showColumns * cp;
      let ep = sp + vm.showColumns - 1; // for id
      let newData = [];
      dataIn.forEach(function(d, i) {
        let obj = {};
        let itemlist = Object.keys(d);
        for (let j = 0; j < Object.keys(d).length; j++) {
          if (j < sp) continue;
          if (j > ep) continue;
          obj[itemlist[j]] = d[itemlist[j]];
        }
        let id = "_id";
        obj[id] = d[id];
        newData.push(obj);
      });
      // console.log('render data for table ', newData);
      return newData;
    },

    makeHighDim(dataIn) {
      dataIn.forEach(function(d, i) {
        for (let i = 0; i < 20; i++) {
          d["col_" + i] = parseFloat(Math.floor(Math.random() * 500) + 1);
        }
      });
      console.log("make high dim worked ", dataIn);
      return dataIn;
    },

    makeHighRowCount(dataIn) {
      let vm = this;
      let newData = [];
      let rowNum = vm.rowLen;
      let ind = -1;
      let id = 0;
      for (let i = 0; i < rowNum; i++) {
        if (ind < dataIn.length) ind += 1;
        else ind = 0;
        // console.log('ind tracking ', i, ind, id);
        let obj = Object.assign({}, dataIn[ind]);
        if (typeof obj != "undefined") {
          obj["_id"] = id;
          id += 1;
          newData.push(obj);
        }
      }
      console.log("make high rows worked ", newData);
      return newData;
    },
    createActorsData() {
      let vm = this;
      let actorObj = vm.castMemberDataJson;
      let dataActor = [];
      let ind = 0;
      for (let item in actorObj) {
        let obj = {};
        let actO = actorObj[item];
        for (let el in actO) {
          if (el == "claims") continue;
          obj[el] = actO[el];
        }
        dataActor.push(obj);
        ind += 1;
        if (ind > 20) break;
      }
      vm.castMemberData = dataActor.slice();
      console.log("lets check the data actors ", dataActor);
    },

    updateTable(e) {
      let vm = this;
      let btnText = e;
      if (btnText == "RAW DATA") {
        vm.baseData = vm.rawData.slice();
        vm.baseData.forEach(function(d, i) {
          delete d["awards"];
        });
      } else if (btnText == "ACTORS DATA") {
        // console.log('UPDATE DATA ', btnText, this.baseData)
        vm.baseData = vm.castMemberData.slice();
      } else if (btnText == "AWARDS DATA") {
        let dataTemp = vm.rawData.slice();
        vm.baseData = [];
        dataTemp.forEach(function(d, i) {
          d["awards"] = parseInt(Math.floor(Math.random() * 100) + 1);
        });
        vm.baseData = dataTemp.slice();
        console.log("UPDATE DATA ", btnText, vm.baseData);
      }
      vm.renderData = vm.baseData;
    }
  }
};
</script>

<style scoped>
.bottom_rack{
  padding : 10px;
  /*margin: 5px;*/
  border-top: 1px solid gray;
  width : 100%;
  height : 100%;
  font : caption;
}

.bottom_header{
  border-bottom : 1px solid lightgray;
  align-items: center;
}

.bottom_title{
  display: contents;
}

#main-body{
  width: 100%;
  height: 100%;
}

.searchfield{
  width: 200px;
}

.iconbtn{
  width: 100px;
  height: 100px;
  margin: 0px;
}

.tableViewItem {
  padding: 1px !important;
}

.tableViewItemButton {
  padding: 6px !important;
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
