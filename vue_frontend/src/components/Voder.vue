<template>
  <div id='voder-wrapper'>
    <link href='https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons' rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/vuetify/dist/vuetify.min.css" rel="stylesheet">
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui"> -->

    <!-- <link rel="stylesheet" type="text/css" href="css/annotations.css"> -->
    <!-- <link rel="stylesheet" href="css/jquery-ui.css"> -->
    <!-- <link rel="stylesheet" href="css/bootstrap.min.css"> -->
    <!-- <link rel="stylesheet" href="css/font-awesome.min.css"> -->
    <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> -->
<!--     <v-toolbar
      color="grey darken-1"
      dark
      fixed
      app
      clipped-right
    >
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title>Voder</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-side-icon><span class="bookmarksSpan"><v-icon>collections</v-icon></span></v-toolbar-side-icon>
      <v-toolbar-side-icon @click.stop="drawerRight = !drawerRight"><v-icon>search</v-icon></v-toolbar-side-icon>
    </v-toolbar>
 -->
  <v-navigation-drawer
      v-model="drawer"
      app
      style="top: 65px"
    >
      <v-list>
        <v-list-tile>
          X:&emsp;
          <v-btn flat block outline>
            <select id="xAttrDropdown" class="specificationDropdown"></select>
          </v-btn>
        </v-list-tile>
        <v-list-tile>
          Y:&emsp;
          <v-btn flat block outline>
            <select id="yAttrDropdown" class="specificationDropdown"></select>
          </v-btn>
            &nbsp;
          <v-btn flat block outline>
            <select id="yTransformDropdown" class="specificationDropdown">
              <option value=""></option>
              <option value="COUNT">COUNT</option>
              <option value="AVG">AVG</option>
              <option value="SUM">SUM</option>
              <option value="BIN">BIN</option>
            </select>
          </v-btn>
        </v-list-tile>
        <v-list-tile>
          Color:&emsp;
          <v-btn flat block outline>
            <select id="colorAttrDropdown" class="specificationDropdown"></select>
          </v-btn>
        </v-list-tile>
        <v-list-tile>
          Size:&emsp;
          <v-btn flat block outline>
            <select id="sizeAttrDropdown" class="specificationDropdown"></select>
          </v-btn>
          &nbsp;
          <v-btn flat block outline>
            <select id="sizeTransformDropdown" class="specificationDropdown">
              <option value=""></option>
              <option value="COUNT">COUNT</option>
              <option value="AVG">AVG</option>
              <option value="SUM">SUM</option>
              <option value="BIN">BIN</option>
            </select>
          </v-btn>
        </v-list-tile>
        <v-list-tile>
          Mark:&emsp;
          <v-btn flat block outline>
            <select id="markTypeDropdown" class="specificationDropdown">
              <option value=""></option>
              <option value="arc">Arc</option>
              <option value="bar">Bar</option>
              <option value="point">Point</option>
              <option value="tick">Tick</option>
              <option value="box">Box</option>
            </select>
          </v-btn>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile>
          <v-list-tile-content>
            <button id="showMeButton" class="btn btn-default" style="margin-top: 5%;">Show Possible Visualizations</button>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          Data fact tier:&emsp;
          <v-btn flat outline>
            <select id="dataFactTierSelector">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </v-btn>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container fluid fill-height>
        <table style="width:50%;height:85%;table-layout: fixed;">
          <th>Generated Visualizations</th>
          <tr style="height:100%;">
            <td style="width:50%;">
              <div id="acceptedDataFactsDiv" style="width: 100%;height: 90%;overflow: auto; padding-left: 20%;"></div>
              <!-- <div id="manualFactEntryDiv" style="width: 100%;height: 7%;overflow: auto;margin:1%;">
                <input type="text" style="width: 85%;" id="manualFactInputBox">
                <button class="btn btn-default" id="manualFactSubmitButton"><i class="fa fa-plus"></i></button>
              </div> -->
            </td>
          </tr>
        </table>
        <table style="width:50%;height:85%;table-layout: fixed;">
          <th>Selected Visualization</th>
          <tr style="height:50%;">
            <td style="width:50%;" align="center">
              <div id="activeVisDiv" style="overflow: auto;width: 100%;height: 100%;"></div>
            </td>
            <!-- <td style="width:50%;">
              <div id="acceptedDataFactsDiv" style="width: 100%;height: 90%;overflow: auto;"></div>
              <div id="manualFactEntryDiv" style="width: 100%;height: 7%;overflow: auto;margin:1%;">
                <input type="text" style="width: 85%;" id="manualFactInputBox">
                <button class="btn btn-default" id="manualFactSubmitButton"><i class="fa fa-plus"></i></button>
              </div>
            </td> -->
          </tr>
          <th>Data Facts</th>
          <tr style="height:50%;">
            <td style="width:50%;">
              <div id="activeVisRelatedDataFactsDiv" style="width: 100%;height: 100%;overflow: auto;"></div>
            </td>
            <!-- <td style="width: 50%;">
              <div id="activeAttributesRelatedDataFactsDiv" style="width: 100%;height: 100%;overflow: auto;"></div>
            </td> -->
          </tr>
        </table>
      </v-container>
    </v-content>
    <v-navigation-drawer
      v-model="drawerRight"
      right
      app
      style="top: 65px"
      >
      <v-list>
        <v-list-tile>
          <input id="factQueryBox" type="text" class="form-control input-md" placeholder="Search dataset for facts">
        </v-list-tile>
        <div id="searchResultsDiv"></div>
      </v-list>
    </v-navigation-drawer>

     <!-- Modal for supported visualization specifications -->
   <!--  <div class="modal fade" id="supportedVisualizationsModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Currently supported visualizations for listed attributes (<span id="partialSpecAttributes"></span>)</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body" id="supportedVisualizationsModalBody"></div>
        </div>
      </div>
    </div> -->

  </div>
</template>

<script>
import typeStyles from '@/store/settings/typeStyles'
import voder from '@/voder'
import store from "@/store";
// import * as Popper from "@/voder/vendor/popper.min.js";
// import * as d3 from 'd3';
// import * as jquery from 'jquery';

export default {
  name: 'type-chip',
  props: {
    source: String
  },
  computed: {
    userClickedVariableName() {
      return this.$store.state.socket.voderSelectedVariable;
    }
  },
  mounted: function() {
    let vueThis = this;
    require("@/voder/vendor/jquery-3.2.1.min.js")
    require("@/voder/vendor/jquery-ui.min.js")
    // $.noConflict();

    // require("@/voder/vendor/popper.min.js")
    // require("@/voder/vendor/bootstrap.min.js")
    // let old$ = $;
    // let $ = jQuery;
    require("@/voder/vendor/bootstrap.bundle.js");
    // $ = old$;
    require("@/voder/vendor/underscore-min.js")
    require("@/voder/vendor/math.min.js")
    require("@/voder/vendor/box.js")

    require("@/voder/globalVars.js")
    require("@/voder/utils.js")
    require("@/voder/VisDataShaper.js")
    require("@/voder/VisRenderer.js")
    require("@/voder/VisAnnotator.js")
    require("@/voder/DashboardGenerator.js")
    require("@/voder/BookmarkRenderer.js")
    const mainRequire = require("@/voder/main.js")
    const mainObject = mainRequire.default.mainObject;
    mainObject.initialize();
    let main = {};
    (function(){
        // let main = {};
        // new Vue({
        //     el: '#app',
        //     data: () => ({
        //         drawer: true,
        //         drawerRight: true,
        //         mini: true,
        //         miniRight: true,
        //         dialog: false,
        //         right: null,
        //         left: null
        //     }),

        //     props: {
        //         source: String
        //     }
        // })
        // var dataFileToUse = "dataFiles/csvs/output.csv";
         // var dataFileToUse = "dataFiles/csvs/cars.csv";
        var dataFileToUse = "../../static/local_testing_data/voder/cars.csv";
        // var dataFileToUse = "dataFiles/csvs/global500.csv";
        // var dataFileToUse = "dataFiles/csvs/euro.csv";
          // var dataFileToUse = "dataFiles/csvs/imdb-2016.csv";
         // var dataFileToUse = "dataFiles/csvs/olympics-0408.csv";
         // var dataFileToUse = "dataFiles/csvs/birdstrikes.csv";
         // var dataFileToUse = "dataFiles/csvs/colleges.csv";
        // var dataFileToUse = "dataFiles/csvs/colleges-full.csv";

        window._voder_globalVars.dataFactTierToShow = parseFloat($("#dataFactTierSelector").val());

        d3.csv(dataFileToUse,function(error,data){
            window._voder_globalVars.dataList = data;

            //let mainDataMapFileUrl = "dataFiles/output-mainDataMap.json";
            //let metadataMapFileUrl = "dataFiles/output-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/cars-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/cars-metadataMap.json";
           let mainDataMapFileUrl = "../../static/local_testing_data/voder/output-mainDataMap.json";
           let metadataMapFileUrl = "../../static/local_testing_data/voder/output-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/global500-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/global500-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/euro-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/euro-metadataMap.json";
             // let mainDataMapFileUrl = "dataFiles/imdb-2016-mainDataMap.json";
             // let metadataMapFileUrl = "dataFiles/imdb-2016-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/olympics-0408-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/olympics-0408-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/birdstrikes-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/birdstrikes-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/colleges-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/colleges-metadataMap.json";
            // let mainDataMapFileUrl = "dataFiles/colleges-full-mainDataMap.json";
            // let metadataMapFileUrl = "dataFiles/colleges-full-metadataMap.json";
            $.when(
                $.getJSON(mainDataMapFileUrl, function(data) {
                    window._voder_globalVars.mainSessionMap = data;
                }),
                $.getJSON(metadataMapFileUrl, function(data) {
                    window._voder_globalVars.metadataMap = data;
                })
                //$.getJSON(dataFactMapFileUrl, function(data) {
                //    window._voder_globalVars.dataFactMap = data;
                //})
            ).then(function() {
                    if (window._voder_globalVars.mainSessionMap!=null && window._voder_globalVars.metadataMap!=null){ // && window._voder_globalVars.dataFactMap!=null) {
                        console.log(window._voder_globalVars.mainSessionMap, window._voder_globalVars.metadataMap, window._voder_globalVars.dataFactMap);
                        for(var attributeCombination in window._voder_globalVars.mainSessionMap){
                            let dfObjects = window._voder_globalVars.mainSessionMap[attributeCombination]['dfObjects'];
                            for(var dfObject of dfObjects){
                                dfObject['id'] = window._voder_globalVars.dataFactCounter;
                                window._voder_globalVars.dataFactCounter++;
                                window._voder_globalVars.dataFactMap[dfObject['id']] = dfObject;
                                //window._voder_globalVars.activeAnnotationMap[dfObject['id']] = {};
                            }
                        }
                        initialize();
                    }
                    else {
                        // Request for data didn't work, handle it
                        console.log("Request for data didn't work, handle it")
                    }
                });
        });

        function initialize(){
            for(var attribute in window._voder_globalVars.metadataMap){
                if('isItemAttr' in window._voder_globalVars.metadataMap[attribute]){
                    if(window._voder_globalVars.metadataMap[attribute]['isItemAttr'] == "y"){
                        window._voder_globalVars.itemAttribute = attribute;
                        break;
                    }
                }
            }
            populateSpecificationDropdowns();
            document.getElementById('markTypeDropdown').selectedIndex=3;
            let availableAttributes = Object.keys(window._voder_globalVars.metadataMap);
            availableAttributes.sort();
            let attributeCounter = 0;
            for(let attribute of availableAttributes){
              attributeCounter++
              if(attribute=="d3mIndex"){
                attributeCounter--
              }
              if(attribute==vueThis.userClickedVariableName){
                let inputIndex = attributeCounter;
                break;
              }
            }
            let inputIndex = attributeCounter;
            document.getElementById('yAttrDropdown').selectedIndex=inputIndex;
            window._voder_globalVars.userClickedVariableName = vueThis.userClickedVariableName;
            document.getElementById('xAttrDropdown').selectedIndex=4;
            document.getElementById('showMeButton').click();
        }

        function populateSpecificationDropdowns(){
            $("#xAttrDropdown").find('option').remove().end().append('<option value=""></option>');
            $("#yAttrDropdown").find('option').remove().end().append('<option value=""></option>');

            $("#colorAttrDropdown").find('option').remove().end().append('<option value=""></option>');
            $("#sizeAttrDropdown").find('option').remove().end().append('<option value=""></option>');

            let availableAttributes = Object.keys(window._voder_globalVars.metadataMap);
            availableAttributes.sort();
            for(let attribute of availableAttributes){
              if(attribute!="d3mIndex"){
                $("#xAttrDropdown").append($("<option></option>").val(attribute).html(attribute));
                $("#yAttrDropdown").append($("<option></option>").val(attribute).html(attribute));
                if(window._voder_globalVars.metadataMap[attribute]["type"]=="quantitative"){
                    $("#sizeAttrDropdown").append($("<option></option>").val(attribute).html(attribute));
                }else{
                    $("#colorAttrDropdown").append($("<option></option>").val(attribute).html(attribute));
                }
              }
            }
        }
        main.initialize = function() {
            $(".specificationDropdown").change(function(evt){
                let markType = $("#markTypeDropdown").val();
                let xAttribute = $("#xAttrDropdown").val();
                let yAttribute = $("#yAttrDropdown").val();
                let yTransform = $("#yTransformDropdown").val();
                let colorAttribute = $("#colorAttrDropdown").val();
                let sizeAttribute = $("#sizeAttrDropdown").val();
                let sizeTransform = $("#sizeTransformDropdown").val();

                let specifiedVisObject = window._voder_utils.getNewSpecificationVisObject();
                specifiedVisObject.mark = markType;
                specifiedVisObject.x.attribute = xAttribute;
                specifiedVisObject.y.attribute = yAttribute;
                specifiedVisObject.y.transform = yTransform;
                specifiedVisObject.color.attribute = colorAttribute;
                specifiedVisObject.size.attribute = sizeAttribute;
                specifiedVisObject.size.transform = sizeTransform;

                let attributesInSpecification = [];
                let specifiedAttributes = [xAttribute,yAttribute,colorAttribute,sizeAttribute];
                for(var attribute of specifiedAttributes){
                    if(attributesInSpecification.indexOf(attribute)==-1 && attribute!=""){
                        attributesInSpecification.push(attribute);
                    }
                }
                attributesInSpecification.sort();

                let foundMatchingSpec = -1;
                for(var visObject of window._voder_globalVars.mainSessionMap[attributesInSpecification.join()]['visObjects']){
                    if(window._voder_utils.visObjectMatchesVisSpecObj(visObject,specifiedVisObject)==1){
                        main.updateActiveVisDiv(visObject);
                        foundMatchingSpec = 1;
                        break;
                    }
                }

                // if the specified visualization does not directly match a supported spec, allow users to pick from available ones
                if(foundMatchingSpec==-1){
                    window._voder_globalVars.activeVisObject = specifiedVisObject;
                    $("#partialSpecAttributes").html(attributesInSpecification.join())
                    $("#activeVisDiv").html("");
                    $("#activeVisDiv").html("<div align='middle'>Specification incomplete or currently unsupported.<br><button id='showSupportedVisualizations'>See supported visualizations for specified attributes.</button></div>");
                    $("#showSupportedVisualizations").click(function(evt){
                        triggerShowMeModal(attributesInSpecification);
                    });
                }
            });

            $("#showMeButton").click(function(evt){
                let markType = $("#markTypeDropdown").val();
                let xAttribute = $("#xAttrDropdown").val();
                let yAttribute = $("#yAttrDropdown").val();
                let yTransform = $("#yTransformDropdown").val();
                let colorAttribute = $("#colorAttrDropdown").val();
                let sizeAttribute = $("#sizeAttrDropdown").val();
                let sizeTransform = $("#sizeTransformDropdown").val();
                let attributesInSpecification = [];
                let specifiedAttributes = [xAttribute,yAttribute,colorAttribute,sizeAttribute];
                for(var attribute of specifiedAttributes){
                    if(attributesInSpecification.indexOf(attribute)==-1 && attribute!=""){
                        attributesInSpecification.push(attribute);
                    }
                }
                attributesInSpecification.sort();
                triggerShowMeModal(attributesInSpecification);
            });

            populateSpecificationDropdowns();


            $("#dataFactTierSelector").change(function(evt){
                window._voder_globalVars.dataFactTierToShow = parseFloat($("#dataFactTierSelector").val());
                main.updateActiveVisDiv(window._voder_globalVars.activeVisObject);
            });

            $("#manualFactSubmitButton").click(function(evt){
                let manualFactText = $("#manualFactInputBox").val();
                if(manualFactText!=""){
                    let dfObject = {}
                    dfObject['id'] = window._voder_globalVars.dataFactCounter;
                    window._voder_globalVars.dataFactCounter++;
                    dfObject['type'] = "ManualFact";
                    dfObject['taskCategory'] = "NA";
                    dfObject['tier'] = 1
                    dfObject['relatedVisObjects'] = [window._voder_globalVars.activeVisObject];
                    dfObject['defaultHtml'] = manualFactText;
                    dfObject['activeHtml'] = manualFactText;
                    dfObject['primaryTargetObjectType'] = "";
                    dfObject['secondaryTargetObjectType'] = "";
                    dfObject['primaryTargetObject'] = "";
                    dfObject['secondaryTargetObject'] = "";
                    dfObject['annotationMap'] = {
                        "stroke" : "",
                        "quadrant_lines" : "",
                        "hull" : "",
                        "text_highlight" : "",
                        "regression_line" : "",
                        "opacity" : "",
                        "item_label":""
                    };

                    window._voder_globalVars.dataFactMap[dfObject['id']] = dfObject;

                    let isDataFactBookmarked = -1;
                    for(var bookmarkedDataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                        if(dfObject.id == bookmarkedDataFactId){
                            isDataFactBookmarked = 1;
                            break;
                        }
                    }
                    if(isDataFactBookmarked==-1){
                        window._voder_globalVars.bookmarkedDataFactMap[dfObject.id] = {
                            "dfObject" : dfObject,
                            "associatedVisObjectMap" : {
                                "associatedVisObject" : window._voder_globalVars.activeVisObject,
                                "activeAnnotationIndex" : 0
                            }
                        };
                        $("#bookmarkedFactsSpan").html("Facts ("+Object.keys(window._voder_globalVars.bookmarkedDataFactMap).length+")");
                    }

                    let isActiveVisBookmarked = -1;
                    for(var bookmaredVisObj of window._voder_globalVars.bookmarkedVisObjects){
                        if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,bookmaredVisObj)==1){
                            isActiveVisBookmarked = 1;
                            break;
                        }
                    }
                    if(isActiveVisBookmarked==-1){
                        window._voder_globalVars.bookmarkedVisObjects.push(window._voder_globalVars.activeVisObject);
                        $("#bookmarkedVisualizationsSpan").html("Visualizations ("+window._voder_globalVars.bookmarkedVisObjects.length+")");
                    }


                    let acceptedVisRelatedDataFacts = [];
                    for(var dataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                        let dataFactObject = window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['dfObject'];
                        let associatedVisObject = window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['associatedVisObjectMap']['associatedVisObject'];
                        if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,associatedVisObject)==1){
                            acceptedVisRelatedDataFacts.push(dataFactObject);
                        }
                    }
                    main.updateAcceptedDataFactsDiv(acceptedVisRelatedDataFacts);
                }
            });

            $("#exportButton").click(function(evt){
                let exportJSON = {
                    "visualizations": window._voder_globalVars.bookmarkedVisObjects,
                    "dataFactMap" : window._voder_globalVars.bookmarkedDataFactMap
                };
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportJSON));
                var dlAnchorElem = document.getElementById('downloadAnchorElem');
                dlAnchorElem.setAttribute("href",dataStr);
                dlAnchorElem.setAttribute("download", "export.json");
                dlAnchorElem.click();
            });


            $("#factQueryBox").on("keyup",function(evt){
                let searchString = $("#factQueryBox").val();
                if (evt.keyCode == 13) {
                    let dataFacts = window._voder_utils.searchMatchingDataFacts(searchString);
                    main.updateSearchResults(dataFacts);
                }
                // let dataFacts = window._voder_utils.searchMatchingDataFacts(searchString);
                // main.updateSearchResults(dataFacts);
            });


            $("#imFeelingLuckyButton").click(function(evt){
                function getRandomInt(max) {
                    return Math.floor(Math.random() * Math.floor(max));
                }

                let itemAttributeToIgnore = window._voder_globalVars.itemAttribute;

                let randomDataFacts = [];
                let randomAttributeCombinations = [];
                while(randomAttributeCombinations.length<10){
                    let randomIndex = getRandomInt(Object.keys(window._voder_globalVars.mainSessionMap).length);
                    let attributeCombination = Object.keys(window._voder_globalVars.mainSessionMap)[randomIndex];
                    if(attributeCombination.split(',').indexOf(itemAttributeToIgnore)==-1){
                        if(randomAttributeCombinations.indexOf(attributeCombination)==-1){
                            if(window._voder_globalVars.mainSessionMap[attributeCombination]['dfObjects'].length>0){
                                randomAttributeCombinations.push(attributeCombination);
                            }
                        }
                    }
                }
                for(var randomAttributeCombination of randomAttributeCombinations){
                    let availableDataFacts = window._voder_globalVars.mainSessionMap[randomAttributeCombination]['dfObjects'];
                    let randomIndex = getRandomInt(availableDataFacts.length);
                    if(availableDataFacts[randomIndex]!=undefined){
                        randomDataFacts.push(availableDataFacts[randomIndex]);
                    }
                }

                main.updateSearchResults(randomDataFacts);
            });

            //let accordionContents = $('td').html();
            //$('td').blur(function() {
            //    if (accordionContents!=$(this).html()){
            //        accordionContents = $(this).html();
            //        console.log(accordionContents)
            //    }
            //});

            $('input[type=radio][name=modeSelectionRadio]').change(function() {
                if(this.value=="explore"){
                    $("#presentModeContainer").addClass("d-none");
                    $("#exploreModeContainer").removeClass("d-none");

                    main.updateActiveVisDiv(window._voder_globalVars.activeVisObject);
                }else if(this.value=="present"){
                    $("#exploreModeContainer").addClass("d-none");
                    $("#presentModeContainer").removeClass("d-none");
                    let presentModeLayout = $("input[name='presentModeLayoutOption']:checked").val();
                    if(presentModeLayout=="slideShow"){
                        window._voder_dashboardGenerator.generateSlideShowLayout();
                    }else{
                        window._voder_dashboardGenerator.generateDashboardLayout();
                    }
                }
            });

            $(".bookmarksSpan").click(function(evt){
                $('#bookmarksModal').modal('show');
                setTimeout(function(){
                    window._voder_bookmarkRenderer.generateBookmarksTable();
                },100);
            });
        }
    })();
  },

  data () {
    return {
      drawer: true,
      drawerRight: true,
      mini: true,
      miniRight: true,
      dialog: false,
      right: null,
      left: null
    }
  }
}
</script>

<style lang="scss">
#voder-wrapper {
    .v-content {
      height: 900px;
    }
    .bar {
        fill: steelblue;
    }

    .barStrip{
        fill: steelblue;
    }

    #actionStepRegion{
        padding-left: 8%;
    }

    #bookmarksRegion{
        /*float: right;*/
        /*margin-right: 2%;*/
        /*margin-top: 0.5%;*/
        padding-left: 10%;
    }

    #modeSelectionRegion{
        padding-left: 25%;
        color: white;
        font-weight: bold;
    }

    .modeSelectionSpan{
        padding-left: 0.5%;
        padding-right: 0.5%;
    }

    .bookmarksSpan{
        padding-left: 1%;
        padding-right: 1%;
        color: white;
        font-weight: bold;
        cursor: pointer;
    }

    #headerPanel{
        height: 4%;
        background-color:gray;
        width: 100%;
    }
    #leftPanel,#rightPanel{
        /*background-color:#38425d;*/
        background-color:#ccc;
        height: 96%;
    }

    #toolName{
        margin: 2%;
        font-size: 24px;
        font-weight: bold;
        color: white;
    }

    #mainContainer table td{
        border:1px solid lightgray;
    }

    .specificationDropdown{
        width: 100%;
    }

    select{
        background-color: white;
    }

    .exploratoryFactsDiv{
        margin:2% 2% 2% -1%;
        background-color: white;
        height: 40%;
        overflow-y: auto;
    }

    .exploratoryVisDiv{
        margin:2% 2% 2% -1%;
        background-color: white;
        height: 90%;
        overflow-y: auto;
    }

    #searchResultsDiv{
        background-color: white;
        margin:2% 2% 2% -1%;
        height: 85%;
        overflow-y: auto;
    }

    #factQueryBox{
        width:95%;
        border:3px solid gray;
        margin-top: 1%;
    }

    #showMeButton{
        background-color: white;
        border: 2px solid darkgray;
        cursor: pointer;
    }

    #imFeelingLuckyButton{
        margin-left:61%;
        margin-top:1%;
        margin-bottom:1%;
        background-color: white;
        border: 2px solid darkgray;
        cursor: pointer;
    }

    div.accordion b{
        font-weight: normal;
    }

    .dataFactSentence b{
        font-weight: normal;
    }

    div.accordion {
        background-color: #fbfbfb;
        color: #444;
        cursor: pointer;
        padding: 5px;
        width: 100%;
        border: none;
        /*text-align: left;*/
        outline: none;
        font-size: 15px;
        transition: 0.4s;
        border: 1px solid white;
    }

    div.accordion.active{
        background-color: #e5e5e5;
    }

    div.accordion:hover {
      background-color: #ccc;
    }

    div.accordion.bookmarkedDataFact .acceptButton{
        /*background-color: rgba(0, 0, 0, 0.48);*/
        /*border: 1px solid black;*/
        color: #0eaeff;
    }

    div.accordion.manualDataFact{
        background-color: #dddddd;
    }

    div.panel {
        padding: 0 18px;
        background-color: white;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.2s ease-out;
    }

    .supportedVisThumbnail{
        width: 250px;
        height: 250px;
        border: 1px solid gray;
        float: left;
        overflow: auto;
    }

    .supportedVisThumbnail svg text{
        font-size: 10px;
    }

    .annotationOption{
        margin: 1%;
        padding: 0.5%;
        float: left;
        border: 1px solid lightgray;
        cursor: pointer;
    }

    .annotationOption.activeAnnotation{
        border: 1px solid red;
    }

    polyline{
        opacity: .3;
        stroke: black;
        stroke-width: 2px;
        fill: none;
    }

    .suggestedVisDiv{
        width:175px;
        height:175px;
        border:1px solid lightgray;
        float:left;
        cursor: pointer;
        overflow: hidden;
    }

    .suggestedVisDiv svg text{
        font-size: 8px;
    }

    .box {
      font: 10px sans-serif;
    }

    .box line,
    .box rect,
    .box circle {
      fill: steelblue;
      stroke: #000;
      stroke-width: 1px;
    }

    .box .center {
      stroke-dasharray: 3,3;
    }

    .box .outlier {
      fill: white;
      stroke: #000;
      fill-opacity: 0;
    }

    .axis {
      font: 12px sans-serif;
    }

    .axis path,
    .axis line {
      fill: none;
      stroke: #000;
      shape-rendering: crispEdges;
    }

    .x.axis path {
      fill: none;
      stroke: #000;
      shape-rendering: crispEdges;
    }

    /*.nav-item{*/
        /*opacity: 0.5;*/
        /*background-color: white;*/
    /*}*/

    /*.nav-item.active{*/
        /*opacity: 1;*/
    /*}*/

    .right-inner-addon {
        position: relative;
    }
    .right-inner-addon input {
        padding-right: 30px;
    }
    .right-inner-addon i {
        position: absolute;
        right: 0px;
        padding: 10px 12px;
        pointer-events: none;
    }

    .factText{
        cursor: auto;
    }

    .factText.editing{
        background-color: white;
    }

    #slideShowTable{
        table-layout: fixed;
        width: 70%;
        margin-left: 15%;
        margin-top: 0.5%;
    }

    #slideShowTable td{
        border:1px solid lightgray;
    }

    #slideShowTable .visDivtd{
        height: 450px;
    }

    #slideShowTable .dfDivtd{
        vertical-align: top;
    }

    #slideShowTable .visDiv{
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    #slideShowTable .dfDiv{
        width: 100%;
        height: 100%;
    }

    #slideShowTable div.accordion {
        cursor: auto;
    }

    #presentModeOptions{
        padding-left: 40%;
        margin: 0.5%;
    }

    div.accordion.viewOnly{
        background-color: white;
    }

    div.accordion.active.viewOnly, div.accordion.viewOnly:hover {
        background-color: #ccc;
    }

    #dashboardTable{
        table-layout: fixed;
        width: 70%;
        height: 60%;
        margin-left: 15%;
        margin-top: 0.5%;
    }

    #dashboardTable td{
        border:1px solid lightgray;
        vertical-align: top;
    }

    .dashboardVisThumbnail{
        width: 350px;
        height: 350px;
        float: left;
    }

    .dot{
        stroke: steelblue;
    }

    #bookmarksTable{
        table-layout: fixed;
        width: 70%;
        margin-left: 15%;
        margin-top: 0.5%;
    }

    #bookmarksTable td{
        border:1px solid lightgray;
    }

    #bookmarksTable .visDivtd{
        height: 300px;
        overflow: auto;
    }

    #bookmarksTable .dfDivtd{
        vertical-align: top;
    }

    #bookmarksTable .visDiv{
        width: 275px;
        height: 300px;
        overflow: hidden;
    }

    #bookmarksTable .dfDiv{
        width: 100%;
        height: 100%;
    }

    #bookmarksTable div.accordion {
        cursor: auto;
    }

    #factStyleDisplayRow{
        display: none;
    }
}
</style>
