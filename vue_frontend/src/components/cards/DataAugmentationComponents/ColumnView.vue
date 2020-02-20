<template>
  <div class="ui grid" id="ColumnView">
    <div
      class="singleList"
      :class="firstColumnClass"
      v-if="firstColumnData.children.length != 0"
    >
      <div class="ui segment columnHeader">
        <h3 class="ui header">
          Attributes of the Current Data Table
        </h3>
      </div>
      <div class="listContainer"
        ref="firstAttributeList"
        @mouseenter="singleListMouseenter('firstAttributeList')"
        @mouseleave="singlelistMouseleave('firstAttributeList')"
      >
        <transition-group
          name="list"
          tag="div"
          class="ui segments segmentList"
          @enter="enter"
        >
          <div
            class="ui segment singleSegment list-item"
            v-for="(property, i) in firstColumnData.children.map(d => d.key)"
            :key="property"
            style="padding: 5px;"
            :class="{
              derivedAttributeSegment: firstColumnData.children[i].derived
            }"
          >
            <div
              class="ui borderless menu"
              style="margin: 0px; box-shadow: none; border: none; border-radius: 0px;"
            >
              <div
                class="item borderlessMenuTextItem"
                style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.6);"
              >
                <h4 
                  class="special-comic-text"
                  :class="{
                    selectedAttributeHeader: selectedAttributeInFirstColumn == property
                  }"
                  :title="property"
                >
                  {{ attributeNameLengthCheck(property) }}
                </h4>
              </div>
              <div class="item right mini menu borderlessMenuItem">
                <!-- <div class="item ColumnViewItem">
                  <button
                    class="ui basic icon button ColumnViewItemButton"
                    :class="{ teal: selectedAttributeInFirstColumn == property }"
                    @click="showAttributeDistribution(property)"
                    title="view distribution"
                  >
                    <i class="chart line icon"></i>
                  </button>
                </div> -->
                <div class="item ColumnViewItem">
                  <div 
                    class="ui fitted toggle checkbox toggleSwitch"
                    title="add or remove the attribute"
                  >
                    <input type="checkbox" name="toggleAttribute" :value="i">
                  </div>
                </div>
                <div class="item ColumnViewItem">
                  <button
                    class="ui icon button ColumnViewItemButton"
                    :class="{
                      teal: selectedAttributeInFirstColumn == property,
                      disabled: firstColumnData.children[i].valueType != 'string'
                    }"
                    @click="getRelatedAttributesForFirstColumn(i)"
                    title="show related attributes"
                  >
                    <i class="list icon"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
    <div
      class="singleList"
      :class="secondColumnClass"
      v-if="secondColumnData.children.length != 0"
    >
      <div class="ui segment columnHeader">
        <h3 class="ui header secondColumnHeaderText">
          Related Attributes of "{{ selectedAttributeInFirstColumn }}"
        </h3>
      </div>
      <div class="listContainer"
        ref="secondAttributeList"
        @mouseenter="singleListMouseenter('secondAttributeList')"
        @mouseleave="singlelistMouseleave('secondAttributeList')"
      >
        <div class="ui segments segmentList">
          <div
            class="ui segment singleSegment"
            v-for="(property, i) in secondColumnData.children.map(d => d.key)"
            :key="property"
            style="padding: 5px;"
          >
            <div
              class="ui borderless menu"
              style="margin: 0px; box-shadow: none; border: none; border-radius: 0px;"
            >
              <div
                class="item borderlessMenuTextItem"
                style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.6);"
              >
                <h4 class="special-comic-text" :title="property">{{ attributeNameLengthCheck(property) }}</h4>
              </div>
              <div class="right mini menu borderlessMenuItem">
                <!-- <div class="item ColumnViewItem">
                  <button
                    class="ui basic icon button ColumnViewItemButton"
                    @click="showAttributeDistribution(property)"
                    title="view distribution"
                  >
                    <i class="chart line icon"></i>
                  </button>
                </div> -->
                <!-- <div class="item ColumnViewItem">
                  <button
                    class="ui basic icon button ColumnViewItemButton"
                    :class="{
                      disabled: attributeNameCheck(property)
                    }"
                    title="add"
                    @click="joinSecondaryColumn(i)"
                  >
                    <i class="plus icon"></i>
                  </button>
                </div> -->
                <div class="item ColumnViewItem">
                  <div
                    class="ui basic top right pointing dropdown icon button ColumnViewItemButton"
                    title="add"
                  >
                    <i class="plus icon"></i>
                    <div class="menu">
                      <div
                        class="item"
                        :class="{
                          disabled: secondColumnData.children[i].augmented
                        }"
                        v-for="aggregationOp in getAggregationOpsByAttributeValueType(secondColumnData.children[i].value.valueType)"
                        :key="aggregationOp"
                      >
                        <div
                          class="ui primary empty circular label"
                          :index="i"
                          :value="aggregationOp"
                        ></div>
                        {{ aggregationOp }}
                      </div>
                    </div>
                  </div>
                </div>
                <!-- <div class="item ColumnViewItem">
                  <button
                    class="ui basic icon button ColumnViewItemButton"
                    :class="{
                      disabled: !attributeNameCheck(property)
                    }"
                    title="remove"
                  >
                    <i class="minus icon"></i>
                  </button>
                </div>
                <div class="item ColumnViewItem">
                  <button
                    class="ui icon button ColumnViewItemButton"
                    v-on:click="thirdColumnData = secondColumnData.children[i]"
                    title="show related attributes"
                  >
                    <i class="list icon"></i>
                  </button>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <div
      class="singleList"
      :class="thirdColumnClass"
      ref="thirdSingleList"
      @mouseenter="singleListMouseenter('thirdSingleList')"
      @mouseleave="singlelistMouseleave('thirdSingleList')"
      v-if="thirdColumnData.children.length != 0"
    >
      <div class="ui segments segmentList">
        <div
          class="ui segment singleSegment"
          v-for="(property, i) in thirdColumnData.children.map(d => d.key)"
          :key="property"
          style="padding: 5px;"
        >
          <div
            class="ui borderless menu"
            style="margin: 0px; box-shadow: none; border: none; border-radius: 0px;"
          >
            <div
              class="item borderlessMenuTextItem"
              style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.6);"
            >
              <h4 class="special-comic-text" :title="property">{{ attributeNameLengthCheck(property) }}</h4>
            </div>
            <div class="right mini menu borderlessMenuItem">
              <div class="item ColumnViewItem">
                <button
                  class="ui basic icon button ColumnViewItemButton"
                  @click="showAttributeDistribution(property)"
                  title="view distribution"
                >
                  <i class="chart line icon"></i>
                </button>
              </div>
              <div class="item ColumnViewItem">
                <button
                  class="ui basic icon button ColumnViewItemButton"
                  :class="{
                    disabled: attributeNameCheck(property)
                  }"
                  title="add"
                >
                  <i class="plus icon"></i>
                </button>
              </div>
              <div class="item ColumnViewItem">
                <button
                  class="ui basic icon button ColumnViewItemButton"
                  title="remove"
                >
                  <i class="minus icon"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> -->
    <!-- <div
      class="singleList"
      :class="distributionColumnClass"
      v-if="selectedAttributes.length != 0"
    >
      <div class="ui segment columnHeader">
        <h3 class="ui header">
          Distribution Charts
        </h3>
      </div>
      <div class="listContainer"
        ref="distributionChart"
        @mouseenter="singleListMouseenter('distributionChart')"
        @mouseleave="singlelistMouseleave('distributionChart')"
      >
        <div>
          <DistributionChartList
            v-for="item in selectedAttributes"
            :key="item"
            :selected-attribute-text="item"
            :all-attribute-data="allAttributeData"
            @showAttributeDetail="showAttributeDetail"
            @deleteWindow="deleteWindow"
          ></DistributionChartList>
        </div>
      </div>
    </div>
    <DistributionChartForDetail
      :selected-attribute-text="selectedAttributeTextForDetail"
      :all-attribute-data="allAttributeData"
      @unselect-attribute-text="unselectAttributeText"
    ></DistributionChartForDetail> -->
    <!-- adding the list of actions component here  -->

    <div
      class="singleList" 
      :class="actionListColumnClass"
      v-if="listActions.length != 0"
    >
      <div class="ui segment columnHeader">
        <h3 class="ui header">
          List of Added Attributes
        </h3>
      </div>
      <div class="listContainer actionList"
        ref="actionList"
        @mouseenter="singleListMouseenter('actionList')"
        @mouseleave="singlelistMouseleave('actionList')"
      >
        <transition-group
          name="list"
          tag="div"
          class="trans_listaction"
          @enter="enter"
        >
          <div
                class="ui segment singleSegment list-item listActionRow"
                v-for="(property, i) in listActions"
                :key="property"
                style="padding: 5px;"
                :class="{i}"
              > 
              <div class = "listactioncontent">
              <div class = "listactionhead"> {{actionText}} : </div>
              <div class = "listactionprop">{{property}}</div>
              </div>
          </div>
        </transition-group>
      </div>
    </div>
    <!-- list of actions finishes here -->
  </div>
</template>

<script>
import store from "@/store";
import DistributionChartList from "@/components/cards/DataAugmentationComponents/DistributionChartList.vue";
import DistributionChartForDetail from "@/components/cards/DataAugmentationComponents/DistributionChartForDetail.vue";
import * as d3 from "d3";
import Vue from "vue";

export default {
  name: "ColumnView",

  components: {
    DistributionChartList,
    DistributionChartForDetail
  },

  props: {
    firstColumnData: {
      type: Object,
      default: () => ({
        children: []
      })
    },

    allAttributeData: {
      type: Array,
      default: () => []
    }
  },

  data: () => ({
    secondColumnData: {
      children: []
    },
    thirdColumnData: {
      children: []
    },
    selectedAttributes: [],
    selectedAttributeTextForDetail: "",
    selectedAttributeInFirstColumn: "",
    firstColumnClass: "eight wide column",
    secondColumnClass: "five wide column",
    thirdColumnClass: "four wide column",
    distributionColumnClass: "eight wide column",
    actionListColumnClass: "five wide column",
    listActions: [],
    actionText: 'Column Added'
  }),

  mounted: function() {
    //
  },

  watch: {
    firstColumnData: function(value) {
      const vueThis = this;
      if (value.children.length == 0) {
        this.secondColumnData = {
          children: []
        };
        this.listActions = [];
        this.selectedAttributeInFirstColumn = "";
        this.firstColumnClass = "eight wide column";
      } else {
        Vue.nextTick()
          .then(function () {
            $(".ui.toggle.checkbox")
              .checkbox("set checked")
              .checkbox({
                onChecked: function() {
                  vueThis.addColumn(this.getAttribute("value"));
                },

                onUnchecked: function() {
                  vueThis.removeColumn(this.getAttribute("value"));
                }
              });
          });
      }
    },

    secondColumnData: function(value) {
      if (value.children.length == 0) {
        this.thirdColumnData = {
          children: []
        };
      }
    }
  },

  methods: {
    attributeNameLengthCheck: function(attributeName) {
      if(attributeName.length <= 60) {
        return attributeName;
      } else {
        return attributeName.slice(0, 55) + " ...";
      }
    },

    attributeNameCheck: function(attributeName) {
      let dataAttributesOfCurrentDataTable = this.firstColumnData.children.map(d => d.key);
      return new Set(dataAttributesOfCurrentDataTable).has(attributeName);
    },

    getRelatedAttributesForFirstColumn: function(index) {
      const colName = this.firstColumnData.children[index].key;
      const vueThis = this;
      this.selectedAttributeInFirstColumn = colName;
      if (colName) {
        console.log("before call, Date.now is ", new Date);
        this.$socket.emit('dataaugWikidataGetRelatedAttributes', colName, function(relatedAttrs) {
          console.log("after call, Date.now is ", new Date);
          console.log("dataaug came back with related attributes: ", relatedAttrs);
          vueThis.secondColumnData.children = relatedAttrs.map(returnedAttr => {
            return {
              key: returnedAttr.name,
              value: returnedAttr,
              children: [],
              augmented: false
            };
          });
          vueThis.firstColumnClass = "six wide column";
          vueThis.distributionColumnClass = "five wide column";
          Vue.nextTick()
            .then(function () {
              $('.ui.dropdown')
                .dropdown({
                  onChange: function(value, text, $choice) {
                    let index = $choice[0].children[0].getAttribute("index");
                    let aggregationOp = $choice[0].children[0].getAttribute("value");
                    vueThis.joinSecondaryColumn(index, aggregationOp);
                  }
                })
              ;
            });
        });
      }
    },

    addColumn: function(index){
      const vueThis = this;
      const col = this.firstColumnData.children[index];
      const colName = col.key;
      const derived = col.derived;
      col.includeInData = true;
      if(colName){
        store.commit('updateAddColName', colName);
        console.log('accessing store after adding col  ', vueThis.$store.state.socket);
        if(derived) {
          let ind = vueThis.listActions.indexOf(colName);
          if(ind == -1) {
            vueThis.listActions.push(colName);
          }
        }
      }
    },

    removeColumn: function(index){
      const vueThis = this;
      const col = this.firstColumnData.children[index];
      const colName = col.key;
      col.includeInData = false;
      if(colName){
        store.commit('updateRemoveColName', colName);
        console.log('accessing store after removing col ', vueThis.$store.state.socket);
        let ind = vueThis.listActions.indexOf(colName);
        if(ind != -1) {
          vueThis.listActions.splice(ind, 1);
        }
      }
    },

    joinSecondaryColumn: function(index, aggregationOp) {
      const colName = this.secondColumnData.children[index].key;
      const colValue = this.secondColumnData.children[index].value;
      const parentCol = this.selectedAttributeInFirstColumn;
      const uri = colValue['uri'];
      const colValueType = colValue['valueType'];
      const vueThis = this;

      this.secondColumnData.children[index].augmented = true;

      let joinInstructions = {};
      switch(aggregationOp) {
        case "value":
          joinInstructions = {
            'dataset': '185',
            'operation': colValueType,
            'column': parentCol,
            'relationship': colName,
            'relationshipUri': uri
          };
          break;
        case "through":
          break;
        default: // count, entropy, mode, mean, median, max, min, variance
          joinInstructions = {
            'dataset': '185',
            'operation': colValueType,
            'aggregationOp': aggregationOp,
            'column': parentCol,
            'relationship': colName,
            'relationshipUri': uri
          };
          break;
      }
      console.log("before call, Date.now is ", new Date);
      console.log("joinInstructions is ", joinInstructions);
      this.$socket.emit('dataaugWikidataMaterializeJoin', joinInstructions, function(newDataset) {
        console.log("after call, Date.now is ", new Date);
        console.log("materializeJoin came back with data: ", newDataset);
        let newColName;
        if(aggregationOp == "value") {
          newColName = parentCol + " - " + colName;
        } else {
          newColName = parentCol + " - " + colName + " (" + aggregationOp + ")";
        }
        if(newDataset){
          let datapacket = {'data' : newDataset};
          let obj = {
            'data': newDataset,
            'augCol': newColName, // augmented column
            'parCol': parentCol // parent column
          };
          store.commit('updateDataAugTable', obj); // newDataset
          console.log('accessing store ', vueThis.$store.state.socket);
          if(vueThis.listActions.indexOf(newColName) == -1) vueThis.listActions.push(newColName);
        }
        const firstAttributeList = vueThis.firstColumnData.children.map(d => d.key);
        const index = firstAttributeList.indexOf(vueThis.selectedAttributeInFirstColumn) + 1;
        let valueType = isNaN(newDataset[0][colName]) ? "string" : "number";
        vueThis.firstColumnData.children.splice(
          index,
          0,
          {
            key: newColName,
            value: colValue,
            valueType: valueType,
            children: [],
            derived: true,
            includeInData: true
          }
        );
      });
    },

    singleListMouseenter: function(refID) {
      let childNodeHeight = this.$refs[refID].childNodes[0].offsetHeight;
      let parentNodeHeight = this.$refs[refID].offsetHeight;
      if(childNodeHeight > parentNodeHeight) {
        this.$refs[refID].style.setProperty("padding-right", "0px");
      }
    },

    singlelistMouseleave: function(refID) {
      this.$refs[refID].style.setProperty("padding-right", "10px");
    },

    showAttributeDistribution: function(attribute) {
      console.log("showAttributeDistribution: " + attribute);
      let selectedAttributeText = attribute;
      let index = this.selectedAttributes.indexOf(selectedAttributeText);
      let el = this.$refs["distributionChart"];
      if (index < 0) {
        this.selectedAttributes.push(selectedAttributeText);
      }
      this.selectedAttributes.splice(index, 1);
      this.selectedAttributes.unshift(selectedAttributeText);
      if(el != undefined) {
        el.scrollTop = 0;
      }
    },

    showAttributeDetail: function(value) {
      console.log("show attribute detail");
      this.selectedAttributeTextForDetail = value;
    },

    deleteWindow: function(value) {
      let index = this.selectedAttributes.indexOf(value);
      if (index >= 0) {
        this.selectedAttributes.splice(index, 1);
      } else {
        console.log("cannot find attribute data in selectedAttributes");
      }
    },

    unselectAttributeText: function(value) {
      this.selectedAttributeTextForDetail = "";
    },

    enter: function(el) {
      let vueThis = this;
      $(el).find(".ui.toggle.checkbox")
        .checkbox("set checked")
        .checkbox({
          onChecked: function() {
            vueThis.addColumn(this.getAttribute("value"));
          },

          onUnchecked: function() {
            vueThis.removeColumn(this.getAttribute("value"));
          }
        });
    },

    getAggregationOpsByAttributeValueType: function(valueType) {
      switch(valueType) {
        case "join-string":
        case "join-number":
          return ["value"];
        case "join-collection-string":
          return ["count"];
        case "join-collection-number":
          return [
            "value",
            "count",
            "entropy",
            "mean",
            "median",
            "mode",
            "max",
            "min",
            "variance"
          ];
        default:
          return ["value"];
      }
    }
  }
};
</script>

<style scoped>
#ColumnView {
  margin: 0px;
}

.singleList {
  height: 505px;
  padding: 0px !important;
}

.columnHeader {
  margin: 10px !important;
  padding: 10px;
  background-color: #f2f2f2;
  border-radius: 0px;
}

.secondColumnHeaderText {
  color: #00b5ad;
  overflow: auto;
}

.listContainer {
  height: 432px;
  overflow: auto;
  padding-left: 10px;
  padding-right: 10px;
}

.listContainer::-webkit-scrollbar {
  display: none;
}

.listContainer:hover::-webkit-scrollbar {
  display: block;
}

.segmentList {
  margin: 0px;
  border-radius: 0px;
}

.singleSegment {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  border-radius: 0px;
}

.derivedAttributeSegment {
  font-style: italic;
  border-top: 2px solid rgba(34,36,38,.15) !important;
  border-left: 10px solid rgba(34,36,38,.15) !important;
}

.selectedAttributeHeader {
  color: #00b5ad;
}

.borderlessMenuTextItem {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.borderlessMenuItem {
  padding-left: 0px !important;
  padding-right: 0px !important;
  padding-top: 9.5px !important;
  padding-bottom: 9.5px !important;
}

.toggleSwitch {
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 2px;
  margin-right: 4px;
}

.ColumnViewItem {
  padding: 1px !important;
}

.ColumnViewItemButton {
  padding: 6px !important;
}

.special-comic-text {
  font-size: 1em;
}

/*  */
.list-item {}

.list-enter-active, .list-leave-active {
  transition: all 1s;
}

.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* styling for list of actions here */
.actionList {
  border: 1px solid rgba(34,36,38,.15);
  margin-left: 10px;
  margin-right: 10px;
  padding: 10px;
  height: 432px;
  background-color: #f2f2f2;
}

.listActionRow{
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  height: 60px;
  border-radius: 5px;
}

.listactionprop{
  font-weight: bold;
  display: flex;
  justify-content: flex-start;
  padding: 10px;
}

.listactioncontent{
  display: flex;
  padding: 5px;
  justify-content: flex-start;
  align-items: center;
}

.listactionhead{
  max-width: 90px;
  display: flex;
  justify-content: flex-start;
}
</style>