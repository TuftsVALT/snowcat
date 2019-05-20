import * as d3 from 'd3v4';

let main = {};
(function(){
    var dataFileToUse = "../../static/local_testing_data/voder/cars.csv";

    window._voder_globalVars.dataFactTierToShow = parseFloat($("#dataFactTierSelector").val());

    d3.csv(dataFileToUse,function(error,data){
        window._voder_globalVars.dataList = data;

        let mainDataMapFileUrl = "../../static/local_testing_data/voder/output-mainDataMap.json";
        let metadataMapFileUrl = "../../static/local_testing_data/voder/output-metadataMap.json";

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
            let dataFacts = window._voder_utils.searchMatchingDataFacts(window._voder_globalVars.userClickedVariableName);
            main.updateSearchResults(dataFacts);
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

    function triggerShowMeModal(attributesInSpecification){
        // $('#supportedVisualizationsModal').modal('show');
        // $("#supportedVisualizationsModalBody").html('');
        let supportedVisualizations = window._voder_globalVars.mainSessionMap[attributesInSpecification.join()]['visObjects'];
        for(var i in supportedVisualizations){
            let visObject = supportedVisualizations[i];
            //let supportedVisualizationId = attributesInSpecification.join('.')+'_supportedVis_'+i;
            let supportedVisualizationId = 'supportedVis_'+i;
            let supportedVisThumnailHTML = "<div class='supportedVisThumbnail' id='"+supportedVisualizationId+"'></div>"
            // $("#supportedVisualizationsModalBody").append(supportedVisThumnailHTML);
            $("#acceptedDataFactsDiv").append(supportedVisThumnailHTML);
            $("#"+supportedVisualizationId).attr("associatedAttributes",attributesInSpecification.join());
            window._voder_visRenderer.renderVisualization("#"+supportedVisualizationId,visObject,{"isThumbnail":true});
        }
        $(".supportedVisThumbnail").mouseover(function(evt){
            let divId = this.id;
            let visIndex = parseInt(divId.split("_")[1]);
            let attributesInSpec = $("#"+divId).attr("associatedAttributes");
            let visObject = window._voder_globalVars.mainSessionMap[attributesInSpec]['visObjects'][visIndex];
            main.populateSpecDropdownsByVisObject(visObject,true);
        });
        $(".supportedVisThumbnail").mouseout(function(evt){
            main.populateSpecDropdownsByVisObject(window._voder_globalVars.activeVisObject);
            $(".specificationDropdown").css("background-color","");
        });
        $(".supportedVisThumbnail").click(function(evt){
            let divId = this.id;
            let visIndex = parseInt(divId.split("_")[1]);
            let attributesInSpec = $("#"+divId).attr("associatedAttributes");
            attributesInSpec = attributesInSpec.replace(/'.'/g,',')

            let visObject = window._voder_globalVars.mainSessionMap[attributesInSpec]['visObjects'][visIndex];
            main.updateActiveVisDiv(visObject);
            main.populateSpecDropdownsByVisObject(visObject,false);
        });
    }

    main.populateSpecDropdownsByVisObject = function(visObject, highlightChanges){
        let markType = visObject.mark;
        let xAttribute = visObject.x.attribute;
        let yAttribute = visObject.y.attribute;
        let yTransform = visObject.y.transform;
        let sizeAttribute = visObject.size.attribute;
        let sizeTransform = visObject.size.transform;
        let colorAttribute = visObject.color.attribute;

        let activeMarkType =  $("#markTypeDropdown").val()
        let activeXAttribute = $("#xAttrDropdown").val();
        let activeYAttribute = $("#yAttrDropdown").val();
        let activeYTransform = $("#yTransformDropdown").val();
        let activeSizeAttribute = $("#sizeAttrDropdown").val();
        let activeSizeTransform = $("#sizeTransformDropdown").val();
        let activeColorAttribute = $("#colorAttrDropdown").val();


        if(markType!=activeMarkType){
            $("#markTypeDropdown").val(markType);
            if(highlightChanges==true){
                $("#markTypeDropdown").css("background-color","yellow");
            }
        }
        if(xAttribute!=activeXAttribute){
            $("#xAttrDropdown").val(xAttribute);
            if(highlightChanges==true){
                $("#xAttrDropdown").css("background-color","yellow");
            }
        }
        if(yAttribute!=activeYAttribute){
            $("#yAttrDropdown").val(yAttribute);
            if(highlightChanges==true){
                $("#yAttrDropdown").css("background-color","yellow");
            }
        }
        if(yTransform!=activeYTransform){
            $("#yTransformDropdown").val(yTransform);
            if(highlightChanges==true){
                $("#yTransformDropdown").css("background-color","yellow");
            }
        }
        if(sizeAttribute!=activeSizeAttribute){
            $("#sizeAttrDropdown").val(sizeAttribute);
            if(highlightChanges==true){
                $("#sizeAttrDropdown").css("background-color","yellow");
            }
        }
        if(sizeTransform!=activeSizeTransform){
            $("#sizeTransformDropdown").val(sizeTransform);
            if(highlightChanges==true){
                $("#sizeTransformDropdown").css("background-color","yellow");
            }
        }
        if(colorAttribute!=activeColorAttribute){
            $("#colorAttrDropdown").val(colorAttribute);
            if(highlightChanges==true){
                $("#colorAttrDropdown").css("background-color","yellow");
            }
        }
    };

    main.updateActiveVisDiv = function(visObject){
        $("#activeVisDiv").html('');
        window._voder_visRenderer.renderVisualization("#activeVisDiv",visObject,{});
        window._voder_globalVars.activeVisObject = visObject;

        if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObjectList[window._voder_globalVars.activeVisObjectList.length-1],window._voder_globalVars.activeVisObject)==-1){
            window._voder_globalVars.activeVisObjectList.push(window._voder_globalVars.activeVisObject);
        }

        let activeVisSpecifiedAttributes = [];
        let activeVisAttributes = [window._voder_globalVars.activeVisObject.x.attribute,window._voder_globalVars.activeVisObject.y.attribute,window._voder_globalVars.activeVisObject.size.attribute,window._voder_globalVars.activeVisObject.color.attribute];
        for(var attribute of activeVisAttributes){
            if(activeVisSpecifiedAttributes.indexOf(attribute)==-1 && attribute!=""){
                activeVisSpecifiedAttributes.push(attribute);
            }
        }
        activeVisSpecifiedAttributes.sort();

        window._voder_globalVars.displayedDataFactIds = [];

        let dataFactsBasedOnActiveVis = window._voder_globalVars.mainSessionMap[activeVisSpecifiedAttributes.join()]['dfObjects'];
        let dataFactsForActiveVis = [], otherDataFactsForActiveAttributes = [];
        for(var dataFact of dataFactsBasedOnActiveVis){
            let relatedVisObjects = dataFact["relatedVisObjects"];
            let dataFactMapsToActiveVis = -1;
            for(var relatedVisObject of relatedVisObjects){
                if(window._voder_utils.visObjectsAreEquivalent(relatedVisObject,window._voder_globalVars.activeVisObject)==1){
                    dataFactMapsToActiveVis = 1;
                    break;

                }
            }
            if(dataFactMapsToActiveVis==1){
                if(dataFact.tier<=window._voder_globalVars.dataFactTierToShow){
                    window._voder_globalVars.displayedDataFactIds.push(dataFact.id);
                    dataFactsForActiveVis.push(dataFact);
                }
            }else{
                if(dataFact.tier<=window._voder_globalVars.dataFactTierToShow) {
                    window._voder_globalVars.displayedDataFactIds.push(dataFact.id);
                    if(activeVisSpecifiedAttributes.length==3){
                        let sizedScatterplotCombinations = 1;
                        for(var attribute of activeVisSpecifiedAttributes){
                            if(window._voder_globalVars.metadataMap[attribute]['type']!="quantitative"){
                                sizedScatterplotCombinations = -1;
                                break;
                            }
                        }
                        if(sizedScatterplotCombinations==-1){
                            otherDataFactsForActiveAttributes.push(dataFact);
                        }
                    }else{
                        otherDataFactsForActiveAttributes.push(dataFact);
                    }
                }
            }
        }

        let activeVisRelatedAcceptedDataFacts = [];
        for(var dataFactId in window._voder_globalVars.bookmarkedDataFactMap){
            let dataFactObject = window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['dfObject'];
            let associatedVisObject = window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['associatedVisObjectMap']['associatedVisObject'];
            if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,associatedVisObject)==1){
                activeVisRelatedAcceptedDataFacts.push(dataFactObject);
            }
        }

        main.updateActiveVisRelatedDataFactsDiv(dataFactsForActiveVis);
        main.updateActiveAttributesRelatedDataFactsDiv(otherDataFactsForActiveAttributes);        
        main.updateAcceptedDataFactsDiv(activeVisRelatedAcceptedDataFacts);
        document.getElementById('showMeButton').click();
    };

    main.updateActiveVisRelatedDataFactsDiv = function(dataFacts){
        d3.select("#activeVisRelatedDataFactsDiv").selectAll("div").remove();
        var dataFactRows = d3.select("#activeVisRelatedDataFactsDiv").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "activeVisAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class","accordion activeVisDataFact")
            .html(function(d){
                let uniqueAlternativeVisualizationsForFact = window._voder_utils.getUniqueAlternativeVisualizationsForFact(d,window._voder_globalVars.activeVisObject);
                if(uniqueAlternativeVisualizationsForFact.length>0){
                    return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;' class='activeVisFactButtons'><i class='fa fa-eye' style='padding-left: 15%;' title='Click to see "+uniqueAlternativeVisualizationsForFact.length+" alternate visualization(s).'></i><i class='acceptButton fa fa-star' style='float: right;' value='"+JSON.stringify(d)+"'></i></td></tr></table>"
                }else{
                    return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><i class='acceptButton fa fa-star' style='float: right;' value='"+JSON.stringify(d)+"'></i></td></tr></table>"
                }
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
                // return "<div id='activeAttributesRelatedDataFactsDiv' style='width:100%;height:100%;overflow:auto;'></div>"
            });

        dataFactRows.append("div")
            .attr("class","panel")
            .html(function(d){
                return "bla bla bla"
            });
            //.html(function(d){
            //    if(d.relatedVisObjects.length==0){
            //        return "nothing yet";
            //    }else{
            //        var htmlStr = "";
            //        let alternativeVisExists = -1;
            //        for(var i in d.relatedVisObjects){
            //            let relatedVisObject = d.relatedVisObjects[i];
            //            let suggestedVisDivId = "activeVisDataFact_"+ d.id + "_vis_" + i;
            //            if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,relatedVisObject)==-1){
            //                htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
            //                alternativeVisExists = 1;
            //            }
            //        }
            //        if(alternativeVisExists==-1){
            //            htmlStr = "<span style='margin:20%;'>No alternative visualizations available.</span>"
            //        }
            //        return htmlStr;
            //    }
            //});

        //$(".suggestedVisDiv").each(function(){
        //    let divId = this.id;
        //    let associatedDataFact = d3.select(this.parentNode).datum();
        //    let visIndex = parseInt(divId.split("_")[3]);
        //    let visObject = associatedDataFact.relatedVisObjects[visIndex];
        //    //visObject.data = window._voder_visDataShaper.generateVisData(visObject,window._voder_globalVars.data);
        //    window._voder_visRenderer.renderVisualization("#"+divId,visObject,{})
        //});

        bindEventsToSuggestedVisDivs();
        bindEventsToInsightAccordions();
        updateDataFactAccordionColors();

        bindEventsToAcceptButtons();
        bindAnnotationEventsToAccordions();
    };

    main.updateActiveAttributesRelatedDataFactsDiv = function(dataFacts){
        d3.select("#activeAttributesRelatedDataFactsDiv").selectAll("div").remove();

        var dataFactRows = d3.select("#activeAttributesRelatedDataFactsDiv").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "activeAttributeRelatedAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class","accordion")
            .html(function(d){
                // return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><button class='acceptButton'>Accept</button></td></tr></table>"
                return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><i class='fa fa-eye' style='float:right;'></i></td></tr></table>"
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
            });

        dataFactRows.append("div")
            .attr("class","panel")
            //.html(function(d){
            //    if(d.relatedVisObjects.length==0){
            //        return "nothing yet";
            //    }else{
            //        var htmlStr = "";
            //        let alternativeVisExists = -1;
            //        for(var i in d.relatedVisObjects){
            //            let relatedVisObject = d.relatedVisObjects[i];
            //            let suggestedVisDivId = "activeAttributeRelatedDataFact_"+ d.id + "_vis_" + i;
            //            if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,relatedVisObject)==-1){
            //                htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
            //                alternativeVisExists = 1;
            //            }
            //            // let suggestedVisDivId = "dataFact_"+ d.id + "_vis_" + i;
            //            // htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
            //        }
            //        if(alternativeVisExists==-1){
            //            htmlStr = "<span style='margin:20%;'>No alternative visualizations available.</span>"
            //        }
            //
            //        return htmlStr;
            //    }
            //});

        //$(".suggestedVisDiv").each(function(){
        //    let divId = this.id;
        //    let associatedDataFact = d3.select(this.parentNode).datum();
        //    let visIndex = parseInt(divId.split("_")[3]);
        //    let visObject = associatedDataFact.relatedVisObjects[visIndex];
        //    //visObject.data = window._voder_visDataShaper.generateVisData(visObject,window._voder_globalVars.data);
        //    window._voder_visRenderer.renderVisualization("#"+divId,visObject,{})
        //});

        bindEventsToSuggestedVisDivs();
        bindEventsToInsightAccordions();
        updateDataFactAccordionColors();
    };

    main.updateAcceptedDataFactsDiv = function(dataFacts){
        d3.select("#acceptedDataFactsDiv").selectAll("div").remove();

        var dataFactRows = d3.select("#acceptedDataFactsDiv").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "acceptedDataFactAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class",function(d){
                if(d.type=="ManualFact"){
                    return "accordion acceptedDataFact manualDataFact"
                }else{
                    return "accordion acceptedDataFact"
                }
            })
            .html(function(d){
                let annotationHTML = window._voder_visAnnotator.getPossibleAnnotationOptionsHTML(d, window._voder_globalVars.activeVisObject);
                if(annotationHTML!=""){
                    return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;' class='factText' associatedDataFactId='"+ d.id +"' contenteditable='true'><i class='fa fa-pencil'></i>"+d.activeHtml+"</td><td class='acceptedFactButtons' style='border: none;'><i class='fa fa-magic' style='padding-left: 15%;' title='Click to see annotation options.'></i><i class='removeButton fa fa-remove' style='float: right;' value='"+JSON.stringify(d)+"'></i></td></tr></table>"
                }else{
                    if(d.type=="ManualFact"){
                        return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;' class='factText' associatedDataFactId='"+ d.id +"' contenteditable='true'><i class='fa fa-pencil'></i>"+d.activeHtml+"</td><td class='acceptedFactButtons' style='border: none;'><i class='fa fa-sticky-note' style='padding-left: 15%;'></i><i class='removeButton fa fa-remove' style='float: right;' value='"+JSON.stringify(d)+"'></i></td></tr></table>"
                    }else{
                        return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;' class='factText' associatedDataFactId='"+ d.id +"' contenteditable='true'><i class='fa fa-pencil'></i>"+d.activeHtml+"</td><td class='acceptedFactButtons' style='border: none;'><i class='removeButton fa fa-remove' style='float: right;' value='"+JSON.stringify(d)+"'></i></td></tr></table>"
                    }
                }
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
            });

        dataFactRows.append("div")
            .attr("class","panel")
            .html(function(d) {
                //let possibleAnnotations = window._voder_visAnnotator.getPossibleAnnotations(d,window._voder_globalVars.activeVisObject)
                //let htmlStr = "";
                //for(var i in possibleAnnotations){
                //    let possibleAnnotation = possibleAnnotations[i];
                //
                //    let option;
                //    //if(i==window._voder_globalVars.bookmarkedDataFactMap[d.id]['associatedVisObjectMap']['activeAnnotationIndex']){
                //    //    option = '<div class="annotationOption activeAnnotation" value="'+i+'" associatedDataFactId="'+ d.id+'">'+possibleAnnotation+'</div>';
                //    //}else{
                //        option = '<div class="annotationOption" value="'+i+'" associatedDataFactId="'+ d.id+'">'+possibleAnnotation+'</div>';
                //    //}
                //    htmlStr += option;
                //}
                //return htmlStr;
                let annotationHTML = window._voder_visAnnotator.getPossibleAnnotationOptionsHTML(d, window._voder_globalVars.activeVisObject);
                return annotationHTML;
            });
        
        updateDataFactAccordionColors();

        $(".removeButton").click(function(evt){
            let removedBookmarkDataFact = JSON.parse($(this).attr("value"));
            for(var bookmarkedDataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                if(removedBookmarkDataFact.id == bookmarkedDataFactId){
                    delete window._voder_globalVars.bookmarkedDataFactMap[bookmarkedDataFactId];
                    main.updateActiveVisDiv(window._voder_globalVars.activeVisObject);
                }
            }
        });

        bindEventsToInsightAccordions();
        bindAnnotationEventsToAccordions();
        bindEventsToAnnotationOptions();

        $(".factText").focusin(function(evt){
            $(this).addClass("editing");
        });

        $(".factText").focusout(function(evt){
            $(this).removeClass("editing");
        });

        $(".factText").on("keyup",function(evt){
            let associatedDataFactId = $(this).attr("associatedDataFactId");
            window._voder_globalVars.bookmarkedDataFactMap[associatedDataFactId]['dfObject']['activeHtml'] = $(this).text();
        });
    };

    main.updateActiveVisRelatedExploratoryDataFactsDiv = function(dataFacts){
        //d3.select("#exploratoryDataFactsDiv-currentVisRelated").selectAll("div").remove();
        $("#exploratoryDataFactsDiv-currentVisRelated").html("");

        var dataFactRows = d3.select("#exploratoryDataFactsDiv-currentVisRelated").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "activeVisRelatedExploratoryAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class","accordion")
            .html(function(d){
                // return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><button class='acceptButton'>Accept</button></td></tr></table>"
                return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:100%;border: none;'>"+d.activeHtml+"</td></tr></table>"
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
            });

        dataFactRows.append("div")
            .attr("class","panel")
            //.html(function(d){
            //    if(d.relatedVisObjects.length==0){
            //        return "nothing yet";
            //    }else{
            //        var htmlStr = "";
            //        let alternativeVisExists = -1;
            //        for(var i in d.relatedVisObjects){
            //            let relatedVisObject = d.relatedVisObjects[i];
            //            let suggestedVisDivId = "activeVisRelatedExploratoryDataFact_"+ d.id + "_vis_" + i;
            //            if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,relatedVisObject)==-1){
            //                htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
            //                alternativeVisExists = 1;
            //            }
            //            // let suggestedVisDivId = "dataFact_"+ d.id + "_vis_" + i;
            //            // htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
            //        }
            //        if(alternativeVisExists==-1){
            //            htmlStr = "<span style='margin:20%;'>No alternative visualizations available.</span>"
            //        }
            //
            //        return htmlStr;
            //    }
            //});

        //$(".suggestedVisDiv").each(function(){
        //    let divId = this.id;
        //    let associatedDataFact = d3.select(this.parentNode).datum();
        //    let visIndex = parseInt(divId.split("_")[3]);
        //    let visObject = associatedDataFact.relatedVisObjects[visIndex];
        //    //visObject.data = window._voder_visDataShaper.generateVisData(visObject,window._voder_globalVars.data);
        //    window._voder_visRenderer.renderVisualization("#"+divId,visObject,{})
        //});

        bindEventsToSuggestedVisDivs();
        bindEventsToInsightAccordions();
        updateDataFactAccordionColors();
    };

    main.updateActiveBookmarksRelatedExploratoryDataFactsDiv = function(dataFacts){
        $("#exploratoryDataFactsDiv-breadthOriented").html("");

        var dataFactRows = d3.select("#exploratoryDataFactsDiv-breadthOriented").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "activeDataFactsRelatedExploratoryAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class","accordion")
            .html(function(d){
                // return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><button class='acceptButton'>Accept</button></td></tr></table>"
                return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:100%;border: none;'>"+d.activeHtml+"</td></tr></table>"
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
            });

        dataFactRows.append("div")
            .attr("class","panel")

        bindEventsToSuggestedVisDivs();
        bindEventsToInsightAccordions();
        updateDataFactAccordionColors();
    };

    function bindEventsToSuggestedVisDivs(){
        $(".suggestedVisDiv").mouseover(function(evt){
            let divId = this.id;
            let associatedDataFact = d3.select(this.parentNode).datum();
            let visIndex = parseInt(divId.split("_")[3]);
            //let visObject = associatedDataFact.relatedVisObjects[visIndex];
            let associatedVisSuggestions = window._voder_utils.getUniqueAlternativeVisualizationsForFact(associatedDataFact,window._voder_globalVars.activeVisObject);
            let visObject = associatedVisSuggestions[visIndex];

            main.populateSpecDropdownsByVisObject(visObject,true);
        });
        $(".suggestedVisDiv").mouseout(function(evt){
            if(window._voder_globalVars.activeVisObject!=null){
                main.populateSpecDropdownsByVisObject(window._voder_globalVars.activeVisObject);
            }else{
                main.populateSpecDropdownsByVisObject(window._voder_utils.getNewSpecificationVisObject());
            }
            $(".specificationDropdown").css("background-color","");
        });
        $(".suggestedVisDiv").click(function(evt){
            let divId = this.id;
            let associatedDataFact = d3.select(this.parentNode).datum();
            let visIndex = parseInt(divId.split("_")[3]);
            //let visObject = associatedDataFact.relatedVisObjects[visIndex];
            let associatedVisSuggestions = window._voder_utils.getUniqueAlternativeVisualizationsForFact(associatedDataFact,window._voder_globalVars.activeVisObject);
            let visObject = associatedVisSuggestions[visIndex];

            $(".specificationDropdown").css("background-color","");
            main.updateSpecDropdownsByVisObject(visObject);

            //let dataFactDivId = $("")
            let dataFactDivId = ($(this).parent()).parent().attr("id");
            if(dataFactDivId!=undefined){
                if(dataFactDivId.indexOf("factSearch")!=-1){
                    d3.select("#"+dataFactDivId).select(".accordion").dispatch("click");
                    d3.select("#"+dataFactDivId).select(".accordion").dispatch("click");
                }
            }
        });
    }

    function bindEventsToInsightAccordions(){
        var acc = document.getElementsByClassName("accordion");
        var i;

        for (i = 0; i < acc.length; i++) {
            acc[i].onclick = function() {
                this.classList.toggle("active");
                var panel = this.nextElementSibling;
                if (panel.style.maxHeight){
                    if(this.classList.contains("acceptedDataFact")==false) {
                        let parentDivId = $(this).parent().attr("id");
                        d3.select("#" + parentDivId).select(".panel").html("")
                    }

                    panel.style.maxHeight = null;
                } else {
                    if(this.classList.contains("acceptedDataFact")==false){
                        let parentDivId = $(this).parent().attr("id");
                        let associatedDataFactId = parseInt(parentDivId.split("_")[1]);
                        let associatedDataFact = window._voder_globalVars.dataFactMap[associatedDataFactId];
                        //console.log(parentDivId,associatedDataFactId,associatedDataFact)
                        //let associatedDataFactRelatedVisObjs = associatedDataFact.relatedVisObjects;
                        let associatedDataFactRelatedVisObjs = window._voder_utils.getUniqueAlternativeVisualizationsForFact(associatedDataFact,window._voder_globalVars.activeVisObject);

                        d3.select("#"+parentDivId).select(".panel").html(function(){
                            var htmlStr = "";
                            let alternativeVisExists = -1;
                            for(var i in associatedDataFactRelatedVisObjs){
                                let relatedVisObject = associatedDataFactRelatedVisObjs[i];
                                let suggestedVisDivId = "dataFact_"+ associatedDataFactId + "_vis_" + i;
                                if(window._voder_globalVars.activeVisObject!=null){
                                    if(window._voder_utils.visObjectsAreEquivalent(window._voder_globalVars.activeVisObject,relatedVisObject)==-1){
                                        htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>";
                                        alternativeVisExists = 1;
                                    }
                                }else{ // for search cases where no active vis is shown
                                    htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>";
                                    alternativeVisExists=1;
                                }
                            }
                            if(alternativeVisExists==-1){
                                htmlStr = "<span style='margin:20%;'>No alternative visualizations available.</span>"
                            }
                            return htmlStr;
                        });

                        d3.select("#"+parentDivId).selectAll(".suggestedVisDiv").each(function(d){
                            let divId = this.id;
                            let associatedDataFact = d3.select(this.parentNode).datum();
                            let visIndex = parseInt(divId.split("_")[3]);
                            let possibleVisObjects = window._voder_utils.getUniqueAlternativeVisualizationsForFact(associatedDataFact,window._voder_globalVars.activeVisObject)
                            //let visObject = associatedDataFact.relatedVisObjects[visIndex];
                            let visObject = possibleVisObjects[visIndex];

                            //visObject.data = window._voder_visDataShaper.generateVisData(visObject,window._voder_globalVars.data);
                            window._voder_visRenderer.renderVisualization("#"+divId,visObject,{})
                        });
                        bindEventsToSuggestedVisDivs();
                    }

                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            }
        }

        $(".acceptButton").click(function(evt){
            evt.stopPropagation();
        });
        $(".rejectButton").click(function(evt){
            evt.stopPropagation();
        });

    }

    function bindAnnotationEventsToAccordions(){
        d3.selectAll(".accordion.activeVisDataFact").on("mouseover",function(dataFact){
            window._voder_visAnnotator.annotateVis(dataFact,window._voder_globalVars.activeVisObject);
        }).on("mouseout",function(){
            window._voder_visAnnotator.clearAnnotations();
        });

        d3.selectAll(".accordion.acceptedDataFact").on("mouseover",function(dataFact){
            window._voder_visAnnotator.annotateVis(dataFact,window._voder_globalVars.activeVisObject);
        }).on("mouseout",function(){
            window._voder_visAnnotator.clearAnnotations();
        });
    }

    function bindEventsToAcceptButtons(){
        $(".acceptButton").click(function(evt){
            //console.log($(this).attr("value"))
            let acceptedDataFact = JSON.parse($(this).attr("value"));

            let isDataFactBookmarked = -1;
            for(var bookmarkedDataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                if(acceptedDataFact.id == bookmarkedDataFactId){
                    isDataFactBookmarked = 1;
                    break;
                }
            }
            if(isDataFactBookmarked==-1){
                window._voder_globalVars.bookmarkedDataFactMap[acceptedDataFact.id] = {
                    "dfObject" : acceptedDataFact,
                    "associatedVisObjectMap" : {
                        "associatedVisObject" : window._voder_globalVars.activeVisObject,
                        "activeAnnotationIndex" : 0
                    }
                };
                $("#bookmarkedFactsSpan").html("Facts ("+Object.keys(window._voder_globalVars.bookmarkedDataFactMap).length+")");

                let taskCategoryList = [], attributeList = [], itemList = [], categoryList = [];

                attributeList = window._voder_utils.getAttributesFromVisObject(window._voder_globalVars.activeVisObject);
                itemList = window._voder_utils.getItemsFromDataFact(acceptedDataFact);
                categoryList = window._voder_utils.getCategoriesFromDataFact(acceptedDataFact);
                taskCategoryList.push(acceptedDataFact.taskCategory);

                main.updateUserInterestModel(taskCategoryList,attributeList,itemList,categoryList,"increment");
                let activeVisRelatedExploratoryDataFacts = main.getActiveVisRelatedExploratoryDataFacts();
                main.updateActiveVisRelatedExploratoryDataFactsDiv(activeVisRelatedExploratoryDataFacts);

                let activeBookmarksRelatedExploratoryDataFacts = main.getBookmarksRelatedExploratoryDataFacts();
                main.updateActiveBookmarksRelatedExploratoryDataFactsDiv(activeBookmarksRelatedExploratoryDataFacts);
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

        });
    }


    function updateDataFactAccordionColors(){
        d3.selectAll(".accordion").each(function(d){
            if(d.id in window._voder_globalVars.bookmarkedDataFactMap){
                if(!d3.select(this).classed("bookmarkedDataFact")){
                    d3.select(this).classed("bookmarkedDataFact",true);
                }
            }
        })
    }

    main.updateSpecDropdownsByVisObject = function(visObject){
        let markType = visObject.mark;
        let xAttribute = visObject.x.attribute;
        let yAttribute = visObject.y.attribute;
        let yTransform = visObject.y.transform;
        let colorAttribute = visObject.color.attribute;
        let sizeAttribute = visObject.size.attribute;
        let sizeTransform = visObject.size.transform;

        $("#xAttrDropdown").val(xAttribute);
        $("#yAttrDropdown").val(yAttribute);
        $("#yTransformDropdown").val(yTransform);
        $("#colorAttrDropdown").val(colorAttribute);
        $("#sizeAttrDropdown").val(sizeAttribute);
        $("#sizeTransformDropdown").val(sizeTransform);
        $("#markTypeDropdown").val(markType);
        $(".specificationDropdown").trigger("change");

        document.getElementById('showMeButton').click();
    };

    main.updateUserInterestModel = function(taskCategoryList,attributeList,itemList,categoryList,updateType){
        console.log("updateUserInterestModel")
        if(updateType=="increment"){
            for(var taskCategory of taskCategoryList){
                window._voder_globalVars.taskCategoryInterestMap[taskCategory] += 1.0;
            }
            for(var attribute of attributeList){
                if(window._voder_globalVars.attributesOfInterest.indexOf(attribute)==-1){
                    window._voder_globalVars.attributesOfInterest.push(attribute);
                }
            }
            for(var item of itemList){
                if(window._voder_globalVars.itemsOfInterest.indexOf(item)==-1){
                    window._voder_globalVars.itemsOfInterest.push(item);
                }
            }
            for(var category of categoryList){
                if(window._voder_globalVars.categoriesOfInterest.indexOf(category)==-1){
                    window._voder_globalVars.categoriesOfInterest.push(category);
                }
            }
        }else if(updateType=="decrement"){
            for(var taskCategory of taskCategoryList){
                window._voder_globalVars.taskCategoryInterestMap[taskCategory] -= 1.0;
            }
        }

        for(var attributes in window._voder_globalVars.mainSessionMap){
            let dataFactObjects = window._voder_globalVars.mainSessionMap[attributes]['dfObjects'];
            for(var dataFactObject of dataFactObjects){
                dataFactObject['interestingness'] += window._voder_globalVars.taskCategoryInterestMap[dataFactObject.taskCategory];

                if(dataFactObject.primaryTargetObjectType=="item"){
                    if(window._voder_globalVars.itemsOfInterest.indexOf(dataFactObject.primaryTargetObject)!=-1){
                        dataFactObject['interestingness'] += 1.0;
                    }
                }
                if(dataFactObject.secondaryTargetObjectType=="item"){
                    if(window._voder_globalVars.itemsOfInterest.indexOf(dataFactObject.secondaryTargetObject)!=-1){
                        dataFactObject['interestingness'] += 1.0;
                    }
                }
                if(dataFactObject.primaryTargetObjectType=="category"){
                    if(window._voder_globalVars.categoriesOfInterest.indexOf(dataFactObject.primaryTargetObject)!=-1){
                        dataFactObject['interestingness'] += 1.0;
                    }
                }
                if(dataFactObject.secondaryTargetObjectTargetObjectType=="category"){
                    if(window._voder_globalVars.categoriesOfInterest.indexOf(dataFactObject.secondaryTargetObject)!=-1){
                        dataFactObject['interestingness'] += 1.0;
                    }
                }
            }
            window._voder_utils.sortObj(window._voder_globalVars.mainSessionMap[attributes]['dfObjects'],'interestingness','d');
        }
    };

    main.getActiveVisRelatedExploratoryDataFacts = function(){
        let exploratoryDataFacts = [];
        let activeVisAttributes = window._voder_utils.getAttributesFromVisObject(window._voder_globalVars.activeVisObject);

        for(var attributeCombination in window._voder_globalVars.mainSessionMap){
            let attributes = attributeCombination.split(',');
            if(_.intersection(attributes, activeVisAttributes).length>0 && window._voder_utils.arraysEqual(attributes.sort(), activeVisAttributes.sort())==false){
                let possibleDataFacts = window._voder_globalVars.mainSessionMap[attributeCombination]['dfObjects'];
                for(var possibleDataFact of possibleDataFacts){
                    if(possibleDataFacts!=undefined && parseInt(possibleDataFact.tier)==1 && possibleDataFact.interestingness>0.0){
                        exploratoryDataFacts.push(possibleDataFact);
                        break;
                    }
                }
            }
        }
        return window._voder_utils.sortObj(exploratoryDataFacts,'interestingness','d').slice(0,11);
    };

    main.getBookmarksRelatedExploratoryDataFacts = function(){
        let exploratoryDataFacts = [];
        let activeVisAttributes = window._voder_utils.getAttributesFromVisObject(window._voder_globalVars.activeVisObject);

        for(var attributeCombination in window._voder_globalVars.mainSessionMap){
            let attributes = attributeCombination.split(',');
            if(_.intersection(attributes, activeVisAttributes).length==0 && window._voder_utils.arraysEqual(attributes.sort(), activeVisAttributes.sort())==false){
                let possibleDataFacts = window._voder_globalVars.mainSessionMap[attributeCombination]['dfObjects'];
                for(var possibleDataFact of possibleDataFacts){
                    if(possibleDataFacts!=undefined && parseInt(possibleDataFact.tier)==1 && possibleDataFact.interestingness>0.0){
                        exploratoryDataFacts.push(possibleDataFact);
                        break;
                    }
                }
            }
        }
        return window._voder_utils.sortObj(exploratoryDataFacts,'interestingness','d');
    };

    function bindEventsToAnnotationOptions(){
        //$(".annotationOption").on("mouseover",function(evt){
        //    let annotationOption = $(this).html();
        //    let dataFactId =  $(this).attr("associatedDataFactId");
        //    let dataFact = window._voder_globalVars.dataFactMap[dataFactId];
        //    window._voder_visAnnotator.annotateVis(dataFact,window._voder_globalVars.activeVisObject,annotationOption);
        //}).on("mouseout",function(evt){
        //    window._voder_visAnnotator.clearAnnotations();
        //})
        $(".annotationOption").change(function(evt){
            let annotation = $(this).val();
            let checkedProperty = $(this).prop("checked");
            let dataFactId = $(this).attr("associatedDFid");

            if(checkedProperty==true){
                window._voder_globalVars.dataFactMap[dataFactId]['annotationMap'][annotation] = "checked";
                if(dataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                    window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['dfObject']['annotationMap'][annotation] = "checked";
                }
            }else{
                window._voder_globalVars.dataFactMap[dataFactId]['annotationMap'][annotation] = "";
                if(dataFactId in window._voder_globalVars.bookmarkedDataFactMap){
                    window._voder_globalVars.bookmarkedDataFactMap[dataFactId]['dfObject']['annotationMap'][annotation] = "";
                }
            }
        });
    }

    main.updateSearchResults = function(dataFacts){
        d3.select("#searchResultsDiv").selectAll("div").remove();

        var dataFactRows = d3.select("#searchResultsDiv").selectAll("div")
            .data(dataFacts)
            .enter()
            .append("div")
            .attr("id",function(d){
                return "factSearchResultAccordionDiv_"+d.id;
            });

        dataFactRows.append("div")
            .attr("class","accordion")
            .html(function(d){
                return "<table style='width: 100%;'><tr style='width: 100%;'><td style='width:90%;border: none;'>"+d.activeHtml+"</td><td style='border: none;'><i style='float: right;' class='fa fa-eye'></i></td></tr></table>"
                //return "<span>" + d.activeHtml + "</span><span style='float: right;'><button class='acceptButton'>Accept</button></span>";
            });

        dataFactRows.append("div")
            .attr("class","panel")
            .html(function(d){
                if(d.relatedVisObjects.length==0){
                    return "nothing yet";
                }else{
                    var htmlStr = "";
                    for(var i in d.relatedVisObjects){
                        let suggestedVisDivId = "dataFact_"+ d.id + "_vis_" + i;
                        htmlStr += "<div id='"+suggestedVisDivId+"' class='suggestedVisDiv'></div>"
                    }
                    return htmlStr;
                }
            });

        // $(".suggestedVisDiv").each(function(){
        //     let divId = this.id;
        //     let associatedDataFact = d3.select(this.parentNode).datum();
        //     let visIndex = parseInt(divId.split("_")[3]);
        //     let visObject = associatedDataFact.relatedVisObjects[visIndex];
        //     //visObject.data = window._voder_visDataShaper.generateVisData(visObject,window._voder_globalVars.data);
        //     window._voder_visRenderer.renderVisualization("#"+divId,visObject,{})
        // });

        bindEventsToSuggestedVisDivs();
        bindEventsToInsightAccordions();

        if(dataFacts.length==0){
            $("#searchResultsDiv").append("<div>No matching data facts found.</div>")
        }

    };

})();

export default {
    mainObject: main
}