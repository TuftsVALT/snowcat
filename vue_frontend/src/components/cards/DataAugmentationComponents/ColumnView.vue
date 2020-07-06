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
              derivedAttributeSegment: firstColumnData.children[i].derived,
              checkedClass: checkMouseOverModelCols(firstColumnData.children[i].key),
              noncheckedClass: !checkMouseOverModelCols(firstColumnData.children[i].key),
            }"
            :id="{
              noncheckedClass: true //checkMouseOverModelColsOther(firstColumnData.children[i].key)              
              }"
            @click="logClickedColumn(firstColumnData.children[i])"
          >
          <!-- <new added> -->
          <div class = "wrapitemcolview">
            <v-menu
              light
              open-on-click
              :nudge-right="5"
              offset-x
              min-width="450"
              max-width="450"
            >
              <template v-slot:activator="{ on }">
                <div
                  class="ui borderless menu"
                  style="margin: 0px; box-shadow: none; border: none; border-radius: 0px;"
                  v-on="on"
                >
                  <div
                    class="item borderlessMenuTextItem"
                    style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.6);"
                  >
                    <div 
                      class="ui label attributeTypeLabel"
                      :class="attributeTypeCheck(firstColumnData.children[i]).style"
                    >
                      <i :class="attributeTypeCheck(firstColumnData.children[i]).icon"></i>
                      {{ attributeTypeString(firstColumnData.children[i]) }}
                    </div>
                    <h4 
                      class="special-comic-text"
                      :class="{
                        selectedAttributeHeader: selectedAttributeInFirstColumn == property
                      }"
                    >
                      {{ attributeNameLengthCheck(property) }}
                    </h4>
                  </div>
                  <div class="item right mini menu borderlessMenuItemForFirstColumn">
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
                        class="ui"
                        title="through join"
                        v-if="isThroughJoin(firstColumnData.children[i])"
                      >
                      </div>
                      <div 
                        class="ui fitted toggle checkbox toggleSwitch"
                        title="add or remove the attribute"
                        v-else
                      >
                        <input type="checkbox" name="toggleAttribute" :value="i">
                      </div>
                    </div>
                    <div class="item ColumnViewItem">
                      <button
                        class="ui icon button ColumnViewItemButton"
                        :class="{
                          selectedAttributeButton: selectedAttributeInFirstColumn == property,
                          disabled: (firstColumnData.children[i].dataType != 'string' && firstColumnData.children[i].dataType != 'through')
                        }"
                        @click.stop.prevent="getRelatedAttributesForFirstColumn(i)"
                        title="show related attributes"
                      >
                        <i class="list icon"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <v-card>
                <div class="ui grid tooltipPanel">
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Name: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span class="font-weight-light" v-text="property"></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Data Type: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span class="font-weight-light" v-text="firstColumnData.children[i].dataType"></span>
                  </div>
                  <div
                    v-if="firstColumnData.children[i].description"
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Description: </span>
                  </div>
                  <div
                    v-if="firstColumnData.children[i].description"
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span class="font-weight-light" v-text="firstColumnData.children[i].description"></span>
                  </div>
                  <div class="sixteen wide column distributionChart">
                    <DistributionChartSVG
                      :selected-attribute-text="property"
                      :all-attribute-data="allAttributeData"
                      :selected-attribute="firstColumnData.children[i]"
                      :svg-width="440"
                    ></DistributionChartSVG>
                  </div>
                </div>
              </v-card>
            </v-menu>
          </div>
          <!-- <new added> -->

          </div> 
        </transition-group>
      </div>
    </div>
    <div
      class="singleList"
      :class="secondColumnClass"
      v-if="secondColumnShow"
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
        <div
          class="text-center"
          v-if="secondColumnLoading"
        >
          <v-progress-circular
            :size="70"
            :width="7"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>
        <div
          class="ui segments segmentList"
          v-if="secondColumnData.children.length != 0 && !secondColumnLoading"
        >
          <div
            class="ui segment singleSegment"
            v-for="(property, i) in secondColumnData.children.map(d => d.key)"
            :key="property"
            style="padding: 5px;"
            @click="logClickedColumn(secondColumnData.children[i])"
          >
            <v-menu
              light
              open-on-click
              :nudge-right="5"
              offset-x
              min-width="450"
              max-width="450"
            >
              <template v-slot:activator="{ on }">
                <div
                  class="ui borderless menu"
                  style="margin: 0px; box-shadow: none; border: none; border-radius: 0px;"
                  v-on="on"
                >
                  <div
                    class="item borderlessMenuTextItem"
                    style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.6);"
                  >
                    <div 
                      class="ui label attributeTypeLabel"
                      :class="attributeTypeCheck(secondColumnData.children[i]).style"
                    >
                      <i :class="attributeTypeCheck(secondColumnData.children[i]).icon"></i>
                      {{ attributeTypeString(secondColumnData.children[i]) }}
                    </div>
                    <h4 class="special-comic-text">{{ attributeNameLengthCheck(property) }}</h4>
                  </div>
                  <div class="right mini menu borderlessMenuItemForSecondColumn">
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
                    <div v-if="hasTemporalData(secondColumnData.children[i])" class="item ColumnViewItem">
                      <div
                        :class="temporalSelectionClass(secondColumnData.children[i])"
                        title="Temporal Filters Available"
                        @click.stop.prevent = "openTemporalFilter(i)"
                      >
                      <!-- <div class="text-center joinPercentageText"> -->
                        <i 
                        class="clock outline icon"
                        ></i>
                      </div>
                    </div>
                    <div class="item ColumnViewItem">
                      <div class="text-center joinPercentageText">
                        <v-progress-circular
                          :rotate="-90"
                          :size="25"
                          :width="2"
                          :value="Math.round(secondColumnData.children[i].value.percentJoinable * 100)"
                          :color="joinableColorCheck(secondColumnData.children[i].value.percentJoinable)"
                        >
                          {{ Math.round(secondColumnData.children[i].value.percentJoinable * 100) }}
                        </v-progress-circular>
                      </div>
                    </div>
                    <div class="item ColumnViewItem">
                      <div
                        class="ui basic top right pointing dropdown icon button ColumnViewItemButton"
                        title="add"
                        @click.stop.prevent
                      >
                        <i class="plus icon"></i>
                        <div class="menu">
                          <!-- Here, only disable if it's been done for the current temporal filter -->
                          <div
                            class="item"
                            :class="{
                              disabled: false && secondColumnData.children[i].augmented.has(aggregationOp)
                            }"
                            v-for="aggregationOp in getAggregationOpsByAttributeValueType(secondColumnData.children[i].value.valueType, secondColumnData.children[i].value.dataType, temporalSelectionReduced(secondColumnData.children[i]))"
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
              </template>
              <v-card>
                <div class="ui grid tooltipPanel">
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Name: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span class="font-weight-light" v-text="property"></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                    v-if="secondColumnData.children[i].value.dataType != undefined"
                  >
                    <span class="font-weight-bold">Data Type: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                    v-if="secondColumnData.children[i].value.dataType != undefined"
                  >
                    <span 
                      class="font-weight-light"
                      v-text="secondColumnData.children[i].value.dataType"
                    ></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                    v-if="secondColumnData.children[i].value.units != undefined"
                  >
                    <span class="font-weight-bold">Units: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                    v-if="secondColumnData.children[i].value.units != undefined"
                  >
                    <span 
                      class="font-weight-light"
                      v-text="secondColumnData.children[i].value.units"
                    ></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                    v-if="secondColumnData.children[i].value.percentJoinable != undefined"
                  >
                    <span class="font-weight-bold">% of Join: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                    v-if="secondColumnData.children[i].value.percentJoinable != undefined"
                  >
                    <span 
                      class="font-weight-light"
                      v-text="Math.round(secondColumnData.children[i].value.percentJoinable * 100) + '%'"
                    ></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">URI: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <a
                      title="wikidata website"
                      v-text="secondColumnData.children[i].value.uri"
                      @click="openInNewTab(secondColumnData.children[i].value.uri)"
                    ></a>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Description: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span
                      class="font-weight-light"
                      v-text="secondColumnData.children[i].value.description"
                    ></span>
                  </div>
                  <div
                    class="tableTitle"
                    :class="tooltipTableTitleClass"
                  >
                    <span class="font-weight-bold">Examples: </span>
                  </div>
                  <div
                    class="tableContent"
                    :class="tooltipTableContentClass"
                  >
                    <span
                      class="font-weight-light"
                      v-text="secondColumnData.children[i].value.examples"
                    ></span>
                  </div>
                  <div class="sixteen wide column distributionChart">
                    <DistributionChartSVG
                      :selected-attribute-text="property"
                      :selected-attribute="secondColumnData.children[i]"
                      :svg-width="440"
                    ></DistributionChartSVG>
                  </div>
                </div>
              </v-card>
            </v-menu>
          </div>
        </div>
      </div>
    </div>
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
import DistributionChartSVG from "@/components/cards/DataAugmentationComponents/DistributionChartSVG.vue";
import typeChip from '@/components/TypeChip';
import columnChip from '@/components/ColumnChip';
import * as d3 from "d3";
import Vue from "vue";
// import $ from "jquery";

export default {
  name: "ColumnView",

  components: {
    DistributionChartList,
    DistributionChartForDetail,
    DistributionChartSVG,
    typeChip,
    columnChip
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
    },

    throughJoinResults: {
      type: Object,
      default: () => {}
    },

    temporalFilters: {
      type: Object,
      default: () => {}
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
    actionText: 'Column Added',
    tooltipTableTitleClass: "four wide column",
    tooltipTableContentClass: "twelve wide column",
    tempJoinInstructions: {},
    secondColumnShow: false,
    secondColumnLoading: true,
    mostRecentClickedKey: ''
  }),

  mounted: function() {
    //
  },

  computed: {
    findMouseOverModelCols(){
      // console.log('in find mouse over model cols')
      return this.$store.state.socket.mouseOverModelCols;;
    }
  },

  watch: {
    temporalFilters: {
      handler(newFilters) {
        // For some reason, the classes aren't being recalculated when this changes.  So we force update.
        console.log("forcing update")
        this.$forceUpdate();
      },
      deep: true
    },
    throughJoinResults: function(joinResults) {
      if (joinResults && joinResults['aggregationOps'] && joinResults['aggregationOps'].length > 0) {
        console.log("we've learned something.  joinResults are ", joinResults);
        // Now, we have to update our joinInstructions, changing the "through" parts to have these
        // resulting methods.
        // Note, we actually have to reverse the joinResults, because we want them going in from low to high
        let fixedJoinInstructions = this.recursivelyUpdateThroughJoin(this.tempJoinInstructions, joinResults['aggregationOps'].reverse())

        // Then, we send the actual join back to the backend.
          // 'operation': colValueType,
          // 'aggregationOp': aggregationOp,
          // 'column': parentCol,
          // 'relationship': colName,
          // 'name': colName,
          // 'relationshipUri': uri,

        let colName = joinResults['name'];
        let newColName = null;
        let colDataType = 'number'; // I think this has to be a number if they're doing one of these aggregate joins
                                    // Otherwise, we probably get this from the dialog
        let colValue = {}; // I don't think we actually need this to do the join
        let parentCol = joinResults['parentCol'];
        this.executeJoinInstructions(fixedJoinInstructions, colDataType, colValue, fixedJoinInstructions['aggregationOp'], colName, newColName, parentCol)
      }
    },

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
        // We want to let the other parts of data augmentation know about the 
        // current set of attributes.
        
        const firstAttributeList = vueThis.firstColumnData.children.map(d => d.key);
        vueThis.$emit("updateAttributeList", firstAttributeList);

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
      // console.log('first col data updated ', vueThis, value, this)
    }
  },

  methods: {
    logClickedColumn(columnObj) {
      const anyTooltipsOpen = $('.v-menu__content').map((l, i) => i.style.display).filter((l, j) => j.length == 0).length > 0;
      if (!anyTooltipsOpen || (columnObj.key !== this.mostRecentClickedKey)) {
        this.$store.commit('SEND_VAST20_LOG_MESSAGE', {
          'logType': 'clickedColumn',
          'columnName': columnObj.key,
          'timestamp': new Date()
        });
      }
      this.mostRecentClickedKey = columnObj.key;
    },

    logGetRelatedAttributes(colName) {
      this.$store.commit('SEND_VAST20_LOG_MESSAGE', {
        'logType': 'getRelatedAttributes',
        'columnName': colName,
        'timestamp': new Date()
      });
    },

    logColumnAdded(columnObj) {
      this.$store.commit('SEND_VAST20_LOG_MESSAGE', {
        'logType': 'columnAdded',
        'columnName': columnObj.key,
        'parentName': columnObj.parent,
        'parentEntityExampleUri': columnObj.parentEntityExampleUri,
        'aggregationOp': columnObj.aggregationOp,
        'dataType': columnObj.dataType,
        'pctJoinable': columnObj.value && columnObj.value.pctJoinable,
        'timestamp': new Date()
      });
    },
    
    checkMouseOverModelColsOther(key){
      let check = false
      let arr = this.findMouseOverModelCols;
      if(arr.includes(key)) check = false;
      else check = true

      if(key == 'd3mIndex') check = true
      if(arr.length ==0) check = false

      // console.log(' checked mouse over cols ', arr, key, check)
      return check
    },
    checkMouseOverModelCols(key){
      let check = false
      let arr = this.findMouseOverModelCols;
      if(arr.includes(key)) check = true;
      else check = false

      if(arr.length ==0) check = false
      if(key == 'd3mIndex') check = false
      // console.log(' checked mouse over cols ', arr, key, check)
      return check
    },

    recursivelyUpdateThroughJoin(joinInstructions, joinResults) {
      const nextOp = joinResults.pop();
      joinInstructions['aggregationOp'] = nextOp;
      if (joinInstructions['parentJoin']) {
        joinInstructions['parentJoin'] = this.recursivelyUpdateThroughJoin(joinInstructions['parentJoin'], joinResults)
      }

      return joinInstructions;
    },

    isThroughJoin: function(attribute) {
      let attributeValueType = attribute.valueType;
      let attributeDataType = attribute.value && attribute.value.dataType || attributeValueType;
      return (attributeDataType === "through");
    },

    attributeNameLengthCheck: function(attributeName) {
      if(attributeName.length <= 100) {
        return attributeName;
      } else {
        return attributeName.slice(0, 95) + " ...";
      }
    },

    attributeNameCheck: function(attributeName) {
      let dataAttributesOfCurrentDataTable = this.firstColumnData.children.map(d => d.key);
      return new Set(dataAttributesOfCurrentDataTable).has(attributeName);
    },

    attributeTypeString: function(attribute) {
      let attributeValueType = attribute.valueType;
      let attributeDataType = attribute.dataType || attribute.value && attribute.value.dataType;
      let isCollection = attributeValueType && attributeValueType.split('-')[1] === 'collection'
      if (attributeDataType === "through") {
        return '';
      } else {
        return attributeDataType + (isCollection ? 's' : '');
      }
    },

    attributeTypeCheck: function(attribute) {
      let attributeValueType = attribute.valueType;
      let attributeDataType = attribute.dataType || attribute.value && attribute.value.dataType;
      let isCollection = attributeValueType && attributeValueType.split('-')[1] === 'collection'
      let attributeName = attribute.key;
      let returnValue = {};
      if (isCollection) {
        switch (attributeDataType) {
          case "number":
            returnValue = {
              icon: "list icon",
              style: "basic teal"
            };
            break;
          case "datetime":
            returnValue = {
              icon: "list icon",
              style: "basic violet"
            };
            break;
          default:
            returnValue = {
              icon: "list icon",
              style: "basic olive"
            };
        }
      } else {
        switch (attributeDataType) {
          case "string":
            returnValue = {
              icon: "font icon",
              style: "basic olive"
            };
            break;
          case "number":
            returnValue = {
              icon: "hashtag icon",
              style: "basic teal"
            };
            break;
          case "datetime":
            returnValue = {
              icon: "clock icon",
              style: "basic violet"
            };
            break;
          case "through":
            returnValue = {
              icon: "angle double right icon",
              style: "basic gray"
            };
            break;
          default:
            returnValue = {
              icon: "font icon",
              style: "basic olive"
            };
            break;
        }
      }
      // corner case when the attribute is selected
      if (attributeName == this.selectedAttributeInFirstColumn) {
        returnValue.style = "orange";
      }
      return returnValue;
    },

    temporalSelectionMade: function(attribute) {
      return !!this.temporalSelectionInstructions(attribute);
    },

    temporalSelectionInstructions: function(attribute) {
      const attrName = attribute.key;
      // console.log("temporalSelectionInstructions for ", attrName, " are ", this.temporalFilters[attrName])
      return this.temporalFilters[attrName];
    },

    temporalSelectionReduced: function(attribute) {
      const instructions = this.temporalSelectionInstructions(attribute);
      return instructions && instructions.temporalFilterChoice && instructions.temporalFilterChoice != 'no_change';
    },

    hasTemporalData: function(attribute) {
      const attrValue = attribute.value;
      return attrValue && attrValue.sortedTemporalVals && attrValue.sortedTemporalVals.length > 0;
    },

    temporalSelectionClass(attribute) {
      const needsUserSelection = this.hasTemporalData(attribute) && attribute && !this.temporalSelectionMade(attribute);
      return {
        'ui': true, 'basic': true, 'top': true, 'right': true, 'pointing': true, 'dropdown': true, 'icon': true, 'button': true, 'ColumnViewItemButton': true,
        'needs-user-selection': needsUserSelection,
        'finished-user-selection': !needsUserSelection
      }
    },

    getRelatedAttributesForFirstColumn: function(index) {
      const colName = this.firstColumnData.children[index].key;
      const vueThis = this;
      const firstColumnDerivedAttributes = this.firstColumnData.children.filter(d=>d.derived);
      this.selectedAttributeInFirstColumn = colName;
      this.logGetRelatedAttributes(colName);
      if (colName) {
        this.firstColumnClass = "six wide column";
        this.distributionColumnClass = "five wide column";
        this.secondColumnShow = true;
        this.secondColumnLoading = true;
        console.log("before call, Date.now is ", new Date);
        // this.$emit('loadingOn');  // tell parent card to turn on loading indicator
        this.$socket.emit('dataaugWikidataGetRelatedAttributes', colName, function(relatedAttrs) {
          // vueThis.$emit('loadingOff');  // tell parent card to turn off loading indicator
          console.log("after call, Date.now is ", new Date);
          console.log("dataaug came back with related attributes: ", relatedAttrs, this.firstColumnData);
          vueThis.secondColumnData.children = relatedAttrs.map(returnedAttr => {
            let augmentedAggregationOps = new Set();
            firstColumnDerivedAttributes.forEach(eachDerivedAttribute => {
              if (eachDerivedAttribute.name == returnedAttr.name
                && eachDerivedAttribute.parent == colName) {
                augmentedAggregationOps.add(eachDerivedAttribute.aggregationOp);
              }
            });
            return {
              key: returnedAttr.name,
              valueType: returnedAttr.valueType,
              value: returnedAttr,
              children: [],
              augmented: augmentedAggregationOps,
              fromThroughJoin: vueThis.isThroughJoin(vueThis.firstColumnData.children[index]),
              parent: vueThis.firstColumnData.children[index],
              parentEntityExample: vueThis.firstColumnData.children[index].parentEntityExample || returnedAttr.parentEntityExample,
              parentEntityExampleUri: vueThis.firstColumnData.children[index].parentEntityExampleUri || returnedAttr.parentEntityExampleUri,
              parentEntityColumn: vueThis.firstColumnData.children[index].parentEntityColumn || vueThis.firstColumnData.children[index].key,
            };
          });
          // console.log("vueThis.secondColumnData is ", vueThis.secondColumnData);
          vueThis.secondColumnLoading = false;
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
        if(derived) {
          let ind = vueThis.listActions.indexOf(colName);
          if(ind == -1) {
            vueThis.listActions.push(colName);
          }
        }  
        setTimeout(function(d){
            let colArr = vueThis.firstColumnData.children.slice(0)
            let newArr = vueThis.calcAttribInCol(colArr);         
            // console.log('seen in add col', colName, colArr, newArr)
            // console.log('seen accessing store after adding col  ', vueThis.$store.state.socket);
            store.commit('updateAttributesInCurrentDataTable', newArr);
        }, 500)        
      }
    },

    removeColumn: function(index){
      const vueThis = this;
      const col = this.firstColumnData.children[index];
      const colName = col.key;
      col.includeInData = false;
      if(colName){
        store.commit('updateRemoveColName', colName);
        // console.log('accessing store after removing col ', vueThis.$store.state.socket);
        let ind = vueThis.listActions.indexOf(colName);
        if(ind != -1) {
          vueThis.listActions.splice(ind, 1);
        }
      }
    },

    openTemporalFilter: function(index) {
      let colValue = this.secondColumnData.children[index].value;
      this.$emit('showTemporalDialog', colValue);
    },

    joinSecondaryColumn: function(index, aggregationOp) {
      const colName = this.secondColumnData.children[index].key;
      let colValue = this.secondColumnData.children[index].value;
      const parentCol = this.selectedAttributeInFirstColumn;
      const uri = colValue['uri'];
      const colValueType = colValue['valueType'];
      let colDataType = colValue['dataType'];
      let examples = colValue['examples'];
      // let parentEntityExample = colValue['parentEntityExample'];
      // let parentEntityExampleUri = colValue['parentEntityExampleUri'];
      let parentEntityExample = this.secondColumnData.children[index]['parentEntityExample'];
      let parentEntityColumn = this.secondColumnData.children[index]['parentEntityColumn'];
      let parentEntityExampleUri = this.secondColumnData.children[index]['parentEntityExampleUri'];
      const vueThis = this;
      const fromThroughJoin = this.secondColumnData.children[index].fromThroughJoin;
      const parentObject = this.secondColumnData.children[index].parent;
      const temporalSelectionInstructions = this.temporalFilters[colName];
      const temporalFilterChoice = temporalSelectionInstructions && temporalSelectionInstructions.temporalFilterChoice;
      const closestToDate = temporalSelectionInstructions && temporalSelectionInstructions.closestToDate;
      const inferDateAttribute = temporalSelectionInstructions && temporalSelectionInstructions.inferDateAttribute;

              // fromThroughJoin: vueThis.isThroughJoin(this.firstColumnData.children[index]),
              // parent: this.firstColumnData.children[index]
      // if (parentObject['parentEntityExample'] && parentObject['joinInstructions'] && !parentObject['joinInstructions']['parentEntityExample']) {
      //   parentObject['joinInstructions']['parentEntityExample'] = parentObject['parentEntityExample'];
      //   parentObject['joinInstructions']['parentEntityExampleUri'] = parentObject['parentEntityExampleUri'];
      // }
      console.log("parentObject is ", parentObject)

      if (fromThroughJoin && aggregationOp !== 'through') {
        let throughJoinInstructions = {
          'dataset': '185',
          'operation': colValueType,
          'datatype': colDataType,
          'aggregationOp': aggregationOp,
          'column': parentCol,
          'relationship': colName,
          'name': colName,
          'relationshipUri': uri,
          'examples': examples,
          'parentJoin': parentObject['joinInstructions'],
          'parentEntityExample': parentEntityExample,
          'parentEntityExampleUri': parentEntityExampleUri,
          'parentEntityColumn': parentEntityColumn
        }

        this.tempJoinInstructions = throughJoinInstructions;
        console.log("through Join Instructions are ", throughJoinInstructions);
        this.$emit('showThroughJoinDialog', throughJoinInstructions);

        return null;
      }

      this.secondColumnData.children[index].augmented.add(aggregationOp);

      let joinInstructions = {};
      let tempColValue;
      switch(aggregationOp) {
        case "value":
          joinInstructions = {
            'dataset': '185',
            'operation': colValueType,
            'column': parentCol,
            'relationship': colName,
            'relationshipUri': uri,
            'temporalSelectionInstructions': this.temporalFilters[colName]
          };
          break;
        case "through":
          joinInstructions = {
            'dataset': '185',
            'operation': colValueType,
            'aggregationOp': aggregationOp,
            'column': parentCol,
            'relationship': colName,
            'relationshipUri': uri,
            'examples': examples
          };
          if (parentObject['joinInstructions']) {
            joinInstructions['parentJoin'] = parentObject['joinInstructions']
          }
          colDataType = 'through';
          // We're changing the value type to call it a "through" join, so we need to duplicate the value descriptor
          tempColValue = {};
          Object.assign(tempColValue, colValue)
          tempColValue.dataType = 'through';
          colValue = tempColValue;
          // colValue.dataType = 'through';
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

          // Probably need to also make exception for datetime.
          console.log("aggregationOp is ", aggregationOp, " and colDataType is ", colDataType)
          if (aggregationOp !== 'any' && colDataType !== "datetime") {
            colDataType = 'number';
          }
          // We're changing the value type to call it a "through" join, so we need to duplicate the value descriptor
          tempColValue = {};
          Object.assign(tempColValue, colValue);
          // tempColValue.dataType = 'number';
          colValue = tempColValue;
          break;
      }

      let newColName;
      if(aggregationOp == "value") {
        newColName = parentCol + " - " + colName;
      } else {
        newColName = parentCol + " - " + colName + " (" + aggregationOp + ")";
      }


      if (temporalFilterChoice === 'most_recent') {
          newColName = 'most_recent-' + newColName;
      } else if (temporalFilterChoice === 'closest_to_date') {
          newColName = 'closest_to_' + closestToDate + '-' + newColName;
      } else if (temporalFilterChoice === 'other_column') {
          newColName = 'inferred_' + inferDateAttribute + '-' + newColName;
      }


      this.executeJoinInstructions(joinInstructions, colDataType, colValue, aggregationOp, colName, newColName, parentCol, parentEntityExample, parentEntityExampleUri, parentEntityColumn)
    },

    calcAttribInCol : function(colArr){
      // let colArr = this.$store.state.socket.attributesInCurrentDataTable, 
      let newArr = []
      let removecollist = this.$store.state.socket.removeColList;
      // console.log('col arr seen  in materialize', colArr, removecollist, this.$store.state.socket)
      for(let i = 0; i<colArr.length;i++){
        let ind = removecollist.indexOf(colArr[i]['key'])
        if(ind == -1) {
          newArr.push(colArr[i])
        }
      } 
      return newArr
    },

    executeJoinInstructions: function(joinInstructions, colDataType, colValue, aggregationOp, colName, newColName, parentCol, parentEntityExample=null, parentEntityExampleUri=null, parentEntityColumn=null) { 


      let colArr = this.$store.state.socket.attributesInCurrentDataTable
      joinInstructions['headerTypes'] = this.calcAttribInCol(colArr + [newColName])//Attrithis.firstColumnData.children.slice(0)
      console.log("before call, Date.now is ", new Date);
      console.log("joinInstructions is ", joinInstructions);
      let vueThis = this;
      this.$socket.emit('dataaugWikidataMaterializeJoin', joinInstructions, function(receivedData) {
        let newDataset = receivedData.newDataset;
        console.log("after call, Date.now is ", new Date);
        // console.log("materializeJoin came back with data: ", newDataset);
        vueThis.$emit("update-all-attribute-data", newDataset);
        let receivedColName = receivedData.newColName;
        newColName = newColName || receivedColName;
        if(newDataset){
          let datapacket = {'data' : newDataset};
          let obj = {
            'data': newDataset,
            'augCol': newColName, // augmented column
            'parCol': parentCol // parent column
          };
          store.commit('updateDataAugTable', obj); // newDataset
          // console.log('accessing store ', vueThis.$store.state.socket);
          if(vueThis.listActions.indexOf(newColName) == -1 && aggregationOp !== 'through') {
            vueThis.listActions.push(newColName);
          }
        }
        const firstAttributeList = vueThis.firstColumnData.children.map(d => d.key);
        let index = firstAttributeList.indexOf(vueThis.selectedAttributeInFirstColumn) + 1;
        while (index != firstAttributeList.length &&
          vueThis.firstColumnData.children[index].derived) {
          index++;
        }
        // let valueType = isNaN(newDataset[0][colName]) ? "string" : "number";
        console.log("for newColName", newColName, " the valueType is ", colDataType, " and aggregationOp is ", aggregationOp)
        Vue.nextTick()
          .then(function () {
            let dataType = colDataType;
            switch(aggregationOp) {
              case "value":
              case "through":
              case "any":
                break;
              default:
                if (dataType !== 'datetime') {
                  dataType = "number";
                }
                break;
            }
            // console.log("number");
            let addedColumnData = {
              key: newColName,
              value: colValue,
              dataType: dataType,
              name: colName,
              aggregationOp: aggregationOp,
              description: colValue.description,
              parent: parentCol,
              children: [],
              derived: true,
              includeInData: colDataType !== 'through',
              joinInstructions: joinInstructions,
              parentEntityExample: parentEntityExample,
              parentEntityExampleUri: parentEntityExampleUri,
              parentEntityColumn: parentEntityColumn
            }
            vueThis.firstColumnData.children.splice(
              index,
              0,
              addedColumnData
            );
            vueThis.logColumnAdded(addedColumnData);
            //update attrs in table
              let colArr = vueThis.firstColumnData.children.slice(0), newArr = []
              let removecollist = vueThis.$store.state.socket.removeColList;
              // console.log('col arr seen  in colview', colArr, removecollist, vueThis.$store.state.socket)
              for(let i = 0; i<colArr.length;i++){
                let ind = removecollist.indexOf(colArr[i]['key'])
                if(ind == -1) {
                  newArr.push(colArr[i])
                  // console.log(' pushing seen ', colArr[i]['key'])
                }
              }              
              // console.log('col arr seen after splicing col view', newArr)
              store.commit('updateAttributesInCurrentDataTable', newArr);
          });
      });
    },

    singleListMouseenter: function(refID) {
      let childNodes = this.$refs[refID].childNodes;
      let targetNode;
      childNodes.forEach(d => {
        if (d.classList != undefined) {
          targetNode = d;
        }
      });
      let childNodeHeight = targetNode.offsetHeight;
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

    getAggregationOpsByAttributeValueType: function(valueType, dataType, temporalSelectionReduced=false) {
      if (temporalSelectionReduced) {
        // date field has been tied to a given year or column
        return ["value"];
      }

      switch(valueType) {
        case "join-string":
        case "join-number":
          return ["value"];
        case "join-collection-string":
          if (this.selectedAttributeInFirstColumn.indexOf("through") === -1) {
            return ["count", "through", "any"];
          } else {
            return ["count", "any"];
          }
          // return ["count", "through"];
        case "join-collection-number":
          // return [
          //   "count",
          //   "sum",
          //   "mean",
          //   "median",
          //   "mode",
          //   "max",
          //   "min",
          //   "variance"
          // ];
          if (dataType === 'datetime') {
            return [
              "count",
              // "mode",
              "max",
              "min",
              "any"
            ];
          } else {
            return [
              "count",
              "sum",
              "mean",
              "median",
              // "mode",
              "max",
              "min",
              "variance",
              "any"
            ];
          }
        default:
          return ["value"];
      }
    },

    openInNewTab(url) {
      let win = window.open(url, "_blank");
      win.focus();
    },

    joinableColorCheck(joinableValue) {
      if (joinableValue >= 0.8) {
        return "green";
      } else if (joinableValue >= 0.5) {
        return "orange";
      } else {
        return "red";
      }
    }
  }
};
</script>

<style scoped>
#ColumnView {
  margin: 0px;
}

.needs-user-selection {
  border: 2px dashed yellow !important;
}

.finished-user-selection {
  /* border: 1px solid yellow; */
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
  color: #f2711c;
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

.checkedClass{
  background : black;
  /* border: 1px solid black; */
}

  .noncheckedClass{
  /* color:lightgray;
  background:red; */
}

#noncheckedClass{
  color:white;
  /* background: red; */
}


.selectedAttributeHeader {
  color: #f2711c;
}

.selectedAttributeButton {
  background-color: #f2711c !important;
  color: #fff !important;
}

.selectedAttributeButton:focus,
.selectedAttributeButton:hover {
  background-color: #e55b00 !important;
}

.borderlessMenuTextItem {
  padding-left: 0px !important;
  padding-right: 0px !important;
  padding-top: 10.4px !important;
  padding-bottom: 10.4px !important;
  word-wrap: break-word;
  flex: inherit;
  text-align: left;
  max-width: 300px;
}

.borderlessMenuItemForFirstColumn {
  padding-left: 0px !important;
  padding-right: 0px !important;
  padding-top: 9.5px !important;
  padding-bottom: 9.5px !important;
}

.borderlessMenuItemForSecondColumn {
  padding-left: 0px !important;
  padding-right: 0px !important;
  padding-top: 7.5px !important;
  padding-bottom: 7.5px !important;
}

.attributeTypeLabel {
  margin-left: 3px !important;
  margin-right: 5px !important;
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

.joinPercentageText {
  margin-right: 5px;
  font-size: 0.8em;
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

/* styling for tooltip here */
.tooltipPanel {
  margin: 0px;
  padding: 5px;
}

.tableTitle {
  color: #aaa;
  text-align: right;
}

.tableContent {
  text-align: left;
}

.tableTitle,
.tableContent {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

.distributionChart {
  padding: 0px !important;
}

.wrapitemcolview{
  padding: 2px;
}
</style>