<template>
  <div id="text-raw-data">
     <h6>Text Raw Data</h6>
     <div id="textViewContainer">
    <div id = "textSidePanel">
         <div id = "searchInputDiv"></div>
         <div id = "keywordList"></div>
         <div id = "recomList"></div>
    </div>
    <div id = "textViewPanel"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import store from '@/store';
//inside cards
export default {
  name: "TextRawData",
  data: function() {
    return {
        rawDataFolder: null,
        rawTrainDataPath: null,
        textDict: {},
        textIdDict : {},
        filesList : [],
      };

  },
  sockets: {
    text_content_return: function(data) {
      console.log("text data view received socket .. ", data)
      this.textDict[data.index] = data.results;
      this.textIdDict[data.index] = data.id;
      this.filesList.push(data.index)
      this.loadSidePanel(this.filesList, this.textDict, this.textIdDict);
      this.addSearchFeature(this.searchList, this.findStringInText, this.textDict);


      setTimeout(function(func,param) {
        func(param);
      }, 200, this.loadDefaultTextFile, this.textDict)

    }
  },
  computed: {},

  mounted: function() {
    console.log("loading text data .... ")
    $("#searchInputDiv").append("<input id ='searchBox' type='text' style='width:100%'>");
    // this.$store.dispatch('loadTextData', "");
    this.$socket.emit('load-text-data');
  },

  methods: {

    loadDefaultTextFile : function(textDict){

       var keys = Object.keys(textDict);
       var item =   keys[0];

       $("#textViewPanel").empty();
       $("#textViewPanel").html(textDict[item]);
      //  console.log("item gotten ", textDict)
      //  console.log("item gotten ", item)

       $(".recoms").css("background", "lightgray");
       $("#" +item.replace(".", "_")).css("background", "steelblue");
       return;

       var id = $(item).attr("id");
       id = id.replace("rowMatch_", "");
       $(".recoms").css("background", "lightgray");
       $("#" + id.replace(".", "_")).css("background", "steelblue");
       $("#textViewPanel").empty();
       $("#textViewPanel").html(this.textDict[id.replace("_", ".")]);
    },

    findStringInText: function(textValueList, textDict) {
      var idList = [];
      for (var i in textDict) {
        for (var j = 0; j < textValueList.length; j++) {
          var ind = textDict[i].toLowerCase().indexOf(textValueList[j]);
          if (ind != -1) {
            idList.push(i);
            break;
          }
        }
      }
      return idList;
    },

    customHighlightText: function(textList){

      for(var i=0;i<textList.length;i++){
          highlight(textList[i]);
      }

      function highlight(text)
          {
              // $(".highlight").remove();
              var inputText = document.getElementById("textViewPanel");
              var innerHTML = inputText.innerHTML;
              var index = innerHTML.indexOf(text);


              var indices = getIndicesOf(text, innerHTML);
              for(var m=0;m<indices.length;m++){
                 var index = indices[m];
                 if ( index >= 0 )
                    {
                        innerHTML = innerHTML.substring(0,index) + "<div class='highlight'>" + innerHTML.substring(index,index+text.length) + "</div>" + innerHTML.substring(index + text.length);
                        inputText.innerHTML = innerHTML;
                    }
              }


            $(".highlight").css("background", "orange");
            $(".highlight").css("display", "inline");
            $(".highlight").css("width", "auto");

          }


      function getIndicesOf(searchStr, str, caseSensitive = false) {
            var searchStrLen = searchStr.length;
            if (searchStrLen == 0) {
                return [];
            }
            var startIndex = 0, index, indices = [];
            // if (!caseSensitive) {
            //     str = str.toLowerCase();
            //     searchStr = searchStr.toLowerCase();
            // }
            while ((index = str.indexOf(searchStr, startIndex)) > -1) {
                indices.push(index);
                startIndex = index + searchStrLen;
            }
            return indices;
        }

    },

    highlightText: function(textList) {
      // if(text.length> 3) {
      $("#textViewPanel").unmark({
        done: function() {
          for (var i = 0; i < textList.length; i++) {
            var text = textList[i];
            $("#textViewPanel").mark(text, []);
          }
        }
      });
      // }
      $("mark").css("background", "orange");
      $("mark").css("color", "white");
      $("mark").css("opacity", "0.75");
    },

    searchList: function(idSearchList, textDict, searchedText) {
      $("#searchList").remove();
      $(".rowMatchesNone").remove();

      var someNumber = idSearchList.length;
      var topMargin = 25;
      var ht = 20;
      var widPanel = $("#textSidePanel").width();
      var htPanel = someNumber * (ht + 1);
      var posPanel = $("#searchPanel").position();
      // $("#textSidePanel").append("<div id = 'searchList' ></div>");

      $("#searchList").css("display", "flex");
      $("#searchList").css("flex-direction", "column");
      $("#searchList").css("position", "absolute");
      $("#searchList").css("z-index", "100");
      $("#searchList").css("padding", "5px");
      $("#searchList").css("background", "lightgray");
      $("#searchList").css("width", widPanel * 1);

      var htmlStr = "";
      $(".recoms").hide();
      for (var i = 0; i < someNumber; i++) {
        var textValue = idSearchList[i];

        $("#"+textValue.replace(".", "_")).show();
        htmlStr +=
          "<div class = 'rowMatches' id= 'rowMatch_" +  idSearchList[i] + "' >" + textValue + "</div>";
      }
      if (someNumber == 0) {
        textValue = "No results found !";
        htmlStr ="<div class = 'rowMatchesNone' id= 'rowMatch_" + 0 + "' >" + textValue + "</div>";
        $(".rowMatchesNone").remove();
        $(".rowMatchesSummary").remove();
        $("#recomList").append(htmlStr);
      }else{
        var y = Object.keys(textDict).length;
        var x = someNumber;
        textValue = x + " out of " + y + " files found !";
        // textValue = "FILLER HAHAH"
        htmlStr ="<div class = 'rowMatchesSummary' id= 'rowMatch_" + 0 + "' >" + textValue + "</div>";
        $(".rowMatchesNone").remove();
        $(".rowMatchesSummary").remove();
        $("#recomList").prepend(htmlStr);
        if(searchedText[0].length == 0 )  $(".rowMatchesSummary").remove();
      }

      // $(".rowMatchesNone").css("color", "white");
      // $(".rowMatchesSummary").css("color", "white");
      // return;

      // $("#searchList").append(htmlStr);
      // $(".rowMatches").css("border-bottom", "1px gray solid");
      // $(".rowMatches").css("padding", "2px");

      // $(".rowMatches").hover(
      //   function(e) {
      //     $(this).css("background", "steelblue");
      //   },
      //   function(e) {
      //     $(this).css("background", "transparent");
      //   }
      // );
      // var highlightIt = this.highlightText;

      // $(".rowMatches").click(function() {
      //   var id = $(this).attr("id");
      //   id = id.replace("rowMatch_", "");
      //   $(".recoms").css("background", "lightgray");
      //   $("#" + id.replace(".", "_")).css("background", "steelblue");

      //   $("#textViewPanel").empty();
      //   $("#textViewPanel").html(textDict[id.replace("_", ".")]);
      //   highlightIt(searchedText);
      // });

      // $("body").click(function() {
      //   $("#searchList").remove();
      // });


      // this.highlightText(searchedText);
      // this.customHighlightText(searchedText);
    },

    addSearchFeature: function(callSearch, callFindText, textDict) {
       var highlightIt = this.highlightText;
      $('#searchBox').on("keyup", function(e) {


          if (e.keyCode == 13) {
              // console.log('Enter');
              $(".keys_texts").remove();
              var textList = e.target.value.split(",");
              var idList = callFindText(textList, textDict);
              highlightIt(textList);

              // $(".keys_texts").remove();
              // var textList = e.target.value.split(",");
              // var idList = callFindText(textList, textDict);
              // callSearch(idList, textDict, textList);

              // for (var i = 0; i < textList.length; i++) {
              //   if (textList[i].length == 0) continue;
              //   var htmlStr =
              //     "<div class = 'keys_texts' id ='keyword_" + i +"' >" +   textList[i] +  "</div>";
              //   $("#keywordList").append(htmlStr);
              // }
              // $("#keywordList").css("padding", "3px");
              // $("#keywordList").css("display", "flex");
              // $("#keywordList").css("width", "100%");
              // $("#keywordList").css("max-width", "100%");
              // $("#keywordList").css("overflow-x", "auto");
              // $(".keys_texts").css("background", "orange");
              // $(".keys_texts").css("color", "white");
              // $(".keys_texts").css("padding", "5px");
              // $(".keys_texts").css("margin", "3px");
              // $(".keys_texts").css("font-size", "0.7em");
              // $(".keys_texts").css("border-radius", "3px");
              // $(".keys_texts").css("cursor", "default");
          }
      });

      $("#searchBox").on("input", function(e) {


        $(".keys_texts").remove();
        var textList = e.target.value.split(",");
        var idList = callFindText(textList, textDict);
        callSearch(idList, textDict, textList);

        for (var i = 0; i < textList.length; i++) {
          if (textList[i].length == 0) continue;
          var htmlStr =
            "<div class = 'keys_texts' id ='keyword_" + i +"' >" +   textList[i] +  "</div>";
          $("#keywordList").append(htmlStr);
        }
        $("#keywordList").css("padding", "3px");
        $("#keywordList").css("display", "flex");
        $("#keywordList").css("width", "100%");
        $("#keywordList").css("max-width", "100%");
        $("#keywordList").css("overflow-x", "auto");
        $(".keys_texts").css("background", "orange");
        $(".keys_texts").css("color", "white");
        $(".keys_texts").css("padding", "5px");
        $(".keys_texts").css("margin", "3px");
        $(".keys_texts").css("font-size", "0.7em");
        $(".keys_texts").css("border-radius", "3px");
        $(".keys_texts").css("cursor", "default");
      });
    },

    loadSidePanel: function(filesList, textDict, textIdDict) {
      $(".recoms").remove();
      var highlightIt = this.highlightText
      for (var i = 0; i < filesList.length; i++) {
        $("<div/>", {
          class: "recoms",
          id: "" + filesList[i].replace(".", "_"),
          html: filesList[i]
        }).appendTo($("#recomList"));

        $("#" + filesList[i]).prepend(
          '<a id="accept" class="btnIcon" href="#"><i class="fa fa-eye"></i></a>'
        );
        $("#" + filesList[i]).prepend(
          '<a id="reject" class="btnIcon" href="#"><i class="fa fa-times"></i></a>'
        );




        $("#" + filesList[i].replace(".", "_")).click(function(d) {


          var textID = $(this).attr("id");
          $(".recoms").css("background", "lightgray");
          $(this).css("background", "steelblue");
          var textData = textDict[textID.replace("_", ".")];
          $("#textViewPanel").empty();
          $("#textViewPanel").html(textData);

          var textList = $("#searchBox").val();
          textList = textList.split(',')
          // console.log("texts found ", textList);
          highlightIt(textList);
        });
      }

      $(".recoms").css("font", "12px sans-serif");
      $(".recoms").css("border", "1px solid black");
      $(".recoms").css("vertical-align", "middle");
      $(".recoms").css("line-height", "18px");
      $(".recoms").css("border-radius", "3px");
      $(".recoms").css("height", "25px");
      $(".recoms").css("margin", "4px");
      $(".recoms").css("padding-left", "19px");
      $(".recoms").css("padding-top", "2px");
      $(".recoms").css("font-size", "11px");
      $(".recoms").css("user-select", "none");
      $(".recoms").css("background-color", "rgba(237,237,237,.8)");
      $(".recoms").css("text-align", "left");

       var xLinking = {
            xLinkIndexes: [],
            highlight: false,
            visType: 'text',
            visValue: false
        }

      $(".recoms").hover(function(){
        $(this).css('border', '2px solid black');
        var idVal = $(this).attr('id')
        idVal = idVal.replace("_", ".")
        var id = textIdDict[idVal]
        // console.log('hovered recome found ', idVal, id, textIdDict)

        //this sends the data for cross linking
        xLinking.xLinkIndexes = [id];
        xLinking.highlight = true;
        xLinking.visValue = true;
        store.commit('updateXLinking', xLinking);

      }, function(){
        $(this).css('border', '1px solid black');
        //this sends the data for cross linking
        xLinking.xLinkIndexes = [];
        xLinking.highlight = false;
        xLinking.visValue = false;
        store.commit('updateXLinking', xLinking);
      })
    },

    // loads the raw text data to the component data - can be removed
    loadRawTextFiles: function(folderPath, trainDataPath, obj) {
      d3.csv("" + trainDataPath, function(dataMain) {
        var fileNameList = [];
        var filePathFull = [];
        for (var i = 0; i < dataMain.length - 100; i++) {
          fileNameList.push(dataMain[i]["raw_text_file"]);
          filePathFull.push(folderPath + dataMain[i]["raw_text_file"]);
          var dataSend = {
            fileName: folderPath + dataMain[i]["raw_text_file"],
            index: dataMain[i]["raw_text_file"],
            // id:  dataMain[i]["d3mIndex"],
          };
          obj.$socket.emit("getTextContent", dataSend);
        }
        obj.filesList = fileNameList;
      });
    }
  },
  created: function() {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#text-raw-data {
  display: flex;
  flex-direction: column;
  /* background: lightgray; */
  width: 100%;
  height: 100%;
}


#textViewContainer{
  display: flex;
  flex-direction: row;
  width: 100%;
}
h6{
  padding: 4px;
  width: 100%;
  text-align: left;
}

#textSidePanel {
  display: block;
  width: 20%;
  max-width: 20%;
  height: 500px;
  max-height: 500px;
  /* text-align: left; */
  padding: 5px;
  border-right: 1px solid lightgray;
  /* overflow-y: auto; */
}

#searchInputDiv {
  width: 100%;
  padding: 5px;
  background: #ffffff;
  border: 1px solid gray;
}

#searchBox {
  padding: 3px;
  margin: 10px;
}

#recomList {
  max-height: 95%;
  overflow-y: auto;
}

#textViewPanel {
  display: block;
  width: 100%;
  height: 500px;
  text-align: left;
  font-size: 0.75em;
  padding: 10px;
  overflow-y: auto;
  /* color: white; */
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: dimgray;
}
</style>
