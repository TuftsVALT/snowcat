var colType = {
  name: 0,
  type: 1,
  min: 2,
  max: 3,
  diff: 4,
  intvl: 5,
  barRel: 6,
  sum: 7,
  counts: 8,
  mean: 9,
};

var partFMvar = {
  index: 0,
  bars: 1,
  max: 2,
};

//

function isNumber(str){
     if (typeof str != "string")
       return false;
     return !isNaN(str) && !isNaN(parseFloat(str));
}


function assigningMinMaxSum(array, col, data){

    var histogramMin = [col.length];
    var histogramMax = [col.length];

    for(var i = 1; i < 2; i++){
        var obj = data[i];
        var j = 0;
        for(var key in obj){
            if(array[j][colType.type] == "integer" || array[j][colType.type] == "float" || array[j][colType.type] == "real"){//isNumber(obj[key]) == true){
                if(!(obj[key] == null || obj[key] == '' || obj[key] == "?" || isNaN(obj[key]) )){
                    var value = Number(obj[key]);
                    histogramMin[j] = value;
                    histogramMax[j] = value;
                    array[j][colType.sum] = value;
                    array[j][colType.counts] = 1;
                }
                else{
                  histogramMin[j] = 0;
                  histogramMax[j] = 0;
                  array[j][colType.sum] = 0;
                  array[j][colType.counts] = 1;
                }
              }
            else{
                histogramMin[j] = 0;
                histogramMax[j] = 0;
                array[j][colType.sum] = 0;
                array[j][colType.counts] = 0;

              }
              j++;
        }
      }

    for(var i = 2; i < data.length; i++){
        var obj = data[i];
        var j = 0;
        for(var key in obj){
            if(array[j][colType.type] == "integer" || array[j][colType.type] == "float" || array[j][colType.type] == "real"){//isNumber(obj[key]) == true){
                if(!(obj[key] == null || obj[key] == '' || obj[key] == "?" || isNaN(obj[key]) )){
                    var value = Number(obj[key]);
                    array[j][colType.sum] = array[j][colType.sum] + value;
                    array[j][colType.counts] = array[j][colType.counts] + 1;
                    if(histogramMin[j] > value){
                      histogramMin[j] = value;
                    }
                    if(histogramMax[j] < value){
                      histogramMax[j] = value;
                    }
                }
                j++;
            }
            else{
                j++;
            }
        }
    }


    for(var i = 0; i < col.length; i++){

        array[i][colType.min] = histogramMin[i];
        array[i][colType.max] = histogramMax[i];

        if(array[i][colType.counts] == 0){
          array[i][colType.mean] = 0;
        }
        else{
          array[i][colType.mean] = array[i][colType.sum]/array[i][colType.counts];
        }

        //console.log("Mean: "+array[i][colType.mean]);
    }
    return array;
}

function assigningDifferences(bars, col, array){

    // to find out the difference
    for(var i=0; i < col.length; i++){
        var diff = (Number(array[i][colType.max])-Number(array[i][colType.min]));
        array[i][colType.diff] = diff;
        array[i][colType.intvl] = 0;

        if(String(array[i][colType.type]) == "integer" && diff >= Number(bars)){
            array[i][colType.intvl] = Math.ceil(diff/bars);
        }
        else if (array[i][colType.type] == "integer" && diff < bars){
                 array[i][colType.intvl] = Number(1);
        }
        else if (array[i][colType.type] == "float" || array[i][colType.type] == "real"){
            array[i][colType.intvl] = Number(diff/bars);
        }
        else {
            array[i][colType.intvl] = 0;
        }
  }

  return array;
}

function assigningMetaData(bars, fields, metaDataArray, histogramData, colNames, colTypes){

    // Assigining names and types of each data column field
      for(var i = 0; i < colNames.length; i++){
      metaDataArray[i][colType.name] = colNames[i];
      metaDataArray[i][colType.type] = colTypes[i];

    }
    metaDataArray =
    assigningMinMaxSum(metaDataArray, fields, histogramData);

    metaDataArray = assigningDifferences(bars, fields, metaDataArray);
    return metaDataArray;
}


function isItemInArray(array, val){
      for(var i = 0; i < array.length; i++){
          if(array[i] == val){
            return true;
          }
      }
      return false;
}

function isNumItemInArray(array, val){
    for(var i = 0; i < array.length; i++){
        if((i%2 == 0) && (array[i] == val)){
          return true;
        }
    }
    return false;

}


function assigningHistogramCounts(bars, fields, message, metaDataArray, countsArray, trainNames, d3mIndexArray){
  var returnObject = {
    d3mIndexArray: [],
    histogramCountsArray: []
  };

  for(var i = 0; i < fields.length; i++){
    if(metaDataArray[i][colType.type] == "integer" || metaDataArray[i][colType.type] == "float" || metaDataArray[i][colType.type] == "real"){
      for(var j = 0; j < bars; j++){
        countsArray[i][(j*2)] = j+1;
        countsArray[i][((j*2)+1)] = 0;
        //3dm
        d3mIndexArray[i][(j*2)] = j+1;
        var n = (j*2)+1;
        d3mIndexArray[i][n] = new Array();
      }
    }
  }

  var emptySum = 0;

  //d3m for finding out the name
  var d3midx = 0;
  for(var i = 0; i < trainNames.length; i++){
      if(trainNames[i] == "d3mIndex"){
          d3midx = i;
      }
  }
  ///end

  for(var i = 1; i < message.length; i++){

    var obj = message[i];

    var j = 0;

    var d3midxValue = i-1;

    for(var key in obj){

      if(d3midx == j){
          d3midxValue = obj[key];
      }

      if(metaDataArray[j][colType.type] == "integer"){
          if(!(obj[key] == null || obj[key] == '' || obj[key] == "?" || isNaN(obj[key]) )){
            var value = Math.floor( (Number(obj[key])-Number(metaDataArray[j][colType.min])) / Number(metaDataArray[j][colType.intvl]));
            //the (value*2)+1 is used to locate the index of targetIndex,
            //where in the array the first index represents the bar number
            //while the second one represents the total number of bars associated to the bar
            var targetIndex = (value*2)+1;
            if(targetIndex < (bars*2)){
                countsArray[j][targetIndex] = 1 + (countsArray[j][targetIndex] || 0);
                d3mIndexArray[j][targetIndex].push(d3midxValue);
            }
            else{
              countsArray[j][((bars*2)-1)] = 1 + (countsArray[j][((bars*2)-1)] || 0);
              d3mIndexArray[j][((bars*2)-1)].push(d3midxValue);
            }
          }
          else{
              emptySum = emptySum+1;
          }
        }
        else if(metaDataArray[j][colType.type] == "real"){
          if(!(obj[key] == null || obj[key] == '' || obj[key] == ' ?' || isNaN(obj[key]) )){
            var value = Math.floor( (Number(obj[key])-Number(metaDataArray[j][colType.min])) / Number(metaDataArray[j][colType.intvl]));
            //Math.floor((Number(obj[key])/histogramBarInterval[j]) - histogramMin[j]/histogramBarInterval[j]);
            var targetIndex = (value*2)+1;
            if(targetIndex < (bars*2)){
                countsArray[j][targetIndex] = 1 + (countsArray[j][targetIndex] || 0);
                d3mIndexArray[j][targetIndex].push(d3midxValue);
            }
            else{
              countsArray[j][((bars*2)-1)] = 1 + (countsArray[j][((bars*2)-1)] || 0);
              d3mIndexArray[j][((bars*2)-1)].push(d3midxValue);
            }
          }
          else{
              emptySum = emptySum+1;
          }
        }
        else{ // for all other categorical or order forms
          if(!(obj[key] == null || obj[key] == '' || obj[key] == ' ?')){
            var currentArray = countsArray[j];
            var currentLength = currentArray.length;

            var val = obj[key];
            var currentVal;
            if(isNumber(val)){
              currentVal = val;//.toString();

              if(!isNumItemInArray(currentArray, currentVal)){
                  countsArray[j][currentLength] = currentVal;
                  countsArray[j][currentLength+1] = Number(1);
                  //d3midx
                  d3mIndexArray[j][currentLength] = currentVal;
                  d3mIndexArray[j][currentLength+1] = new Array();
                  d3mIndexArray[j][currentLength+1].push(d3midxValue);
              }
              else{
                  for(var k = 0; k < countsArray[j].length; k++){
                      if((k%2 == 0) && (countsArray[j][k] == currentVal)){
                        var val = Number(countsArray[j][k+1]);
                        val = val +1;
                        countsArray[j][k+1] = val;
                        //d3midxValue
                        d3mIndexArray[j][k+1].push(d3midxValue);
                      }
                  }
              }
            }
            else{
              currentVal = val;
              if(!isItemInArray(currentArray, currentVal)){
                  countsArray[j][currentLength] = currentVal;
                  countsArray[j][currentLength+1] = Number(1);
                  //d3midx
                  d3mIndexArray[j][currentLength] = currentVal;
                  d3mIndexArray[j][currentLength+1] = new Array();
                  d3mIndexArray[j][currentLength+1].push(d3midxValue);
                //  console.log(d3midxValue);
              }
              else{
                  for(var k = 0; k < countsArray[j].length; k++){
                      if(countsArray[j][k] == currentVal){
                        var val = Number(countsArray[j][k+1]);
                        val = val +1;
                        countsArray[j][k+1] = val;
                        //d3midxValue
                        d3mIndexArray[j][k+1].push(d3midxValue);

                      }
                  }
              }
            }

          }
          else {
            emptySum = emptySum+1;
          }

       }//end of if with string

        j++;
    }//end of for loop with key in object

  }// end of main for loop for couting histogramCountsArray

  returnObject.d3mIndexArray = d3mIndexArray;
  returnObject.histogramCountsArray = countsArray;
  return returnObject;
  //return countsArray;

}


function assigningBarRelations(partFields, partFieldsMetaData, message, metaDataArray, countsArray, relationsArray){

  for(var i = 1; i < message.length; i++){

      var currentCountsArray = [partFields];
      var flagArray = [partFields];

      var obj = message[i];

      var k = 0;
      var j = 0;

     for(var key in obj){

       if(metaDataArray[j][colType.barRel] == true){

        //the case of integer
         if(metaDataArray[j][colType.type] == "integer"){
              if(obj[key] == null || obj[key] == '' || obj[key] == ' ?' || isNaN(obj[key]) ){
                  currentCountsArray[k] = 0;
                  flagArray[k] = 1;
              }
              else{
                var value = Math.floor( (Number(obj[key])-Number(metaDataArray[j][colType.min])) / Number(metaDataArray[j][colType.intvl]));
                if(value < partFieldsMetaData[k][partFMvar.bars]){
                  currentCountsArray[k] = value;
                  flagArray[k] = 0;
                }
                else if(value == partFieldsMetaData[k][partFMvar.bars]){
                  currentCountsArray[k] = partFieldsMetaData[k][partFMvar.bars]-1;
                  flagArray[k] = 0;
                }
                else{
                  currentCountsArray[k] = 0;
                  flagArray[k] = 1;
                }
              }
         }

         //the case of float
         else if(metaDataArray[j][colType.type] == "real"){// || metaDataArray[j][colType.type] == "float"){
              if(obj[key] == null || obj[key] == '' || obj[key] == ' ?' || isNaN(obj[key]) ){
                currentCountsArray[k] = 0;
                flagArray[k] = 1;
              }
              else{
                var value = Math.floor( (Number(obj[key])-Number(metaDataArray[j][colType.min])) / Number(metaDataArray[j][colType.intvl]));
                if(value < partFieldsMetaData[k][partFMvar.bars]){
                  currentCountsArray[k] = value;
                  flagArray[k] = 0;
                }
                else if(value == partFieldsMetaData[k][partFMvar.bars]){
                  currentCountsArray[k] = partFieldsMetaData[k][partFMvar.bars]-1;
                  flagArray[k] = 0;
                }
                else{
                  currentCountsArray[k] = 0;
                  flagArray[k] = 1;
                  //console.log("partFieldsMetaData[k][partFMvar.bars]:"+j +" "+ k + " "+partFieldsMetaData[k][partFMvar.bars]);
                  //console.log("above");

                }

              }
         }
         // all other than integer or float
         else{
              if(obj[key] == null || obj[key] == '' || obj[key] == ' ?'){
                  currentCountsArray[k] = 0;
                  flagArray[k] = 1;
              }
              else{
                var len = countsArray[j].length;
                len = len/2;
                if(len < 20){
                    for(var l = 0; l < countsArray[j].length; l++){
                        if((l%2 == 0) && (countsArray[j][l] == obj[key])){
                          var idxNo = l/2;
                          currentCountsArray[k] = idxNo;
                          flagArray[k] = 0;
                        }//end of inner if
                    }//end of for
               }//end of if < 20

              }//end of main if inside others
         }
         //end of all if-else (integer, float, or other cases)
         k++;
       }//if(metaDataArray[j][colType.barRel] == true)
       j++;
     }//for(var key in obj)

     for(var m = 0; m < partFields; m++){
       if(flagArray[m] == 0){
         var verticalPointer = 0;
         var horizontalPointer = 0;
         for(var n = 0; n < m; n++){
             verticalPointer = verticalPointer + partFieldsMetaData[n][partFMvar.bars];
         }

          verticalPointer = verticalPointer + currentCountsArray[m];

         for(var p = 0; p < partFields; p++){
           if(flagArray[p] == 0){
             var q = horizontalPointer+currentCountsArray[p];
             relationsArray[verticalPointer][q] = Number(relationsArray[verticalPointer][q]) + 1;
             horizontalPointer = horizontalPointer+partFieldsMetaData[p][partFMvar.bars];
           }
           else{
             horizontalPointer = horizontalPointer+partFieldsMetaData[p][partFMvar.bars];
           }

         }
       }//end of if(flagArray[m] == 0)

      }

  }// //for(var i = 1; i < message.length; i++)

  //console.log("relationsArray:"+relationsArray[2][3])

  return relationsArray;

}


// this function is called for trigging the pre-processing
function tabularRawDataPreprocessing(dataJSONFile, tabularMetaData){

      var totalBars = 10;
      var totalFields = Object.keys(dataJSONFile[0]);
      //3dInx
      var d3mIndexArray = [totalFields.length];;

      // initialzing a 2D array for sotring meta-data of message in form of {name, type, min, max, difference}
      var tabularProcessedArrays = {
        histogramMetaDataArray: [totalFields.length],
        participatingFieldsMetaData: [],// [participatingFields];
        histogramBarCountsArray: [],
        histogramBarNamesArray: [],
        histogramCountsArray: [totalFields.length],
        barRelationsArray: [],
        //d3mIndex
        histogramD3MIndexArray: []
      };

      //var histogramMetaDataArray = [totalFields.length];//.fill(0);
      for(var i = 0; i < totalFields.length; i++){
        tabularProcessedArrays.histogramMetaDataArray[i] = new Array().fill(0);

      }

      // Assigning values to this 2D array in the form of {name, type, min, max, difference, barInterval}
      tabularProcessedArrays.histogramMetaDataArray =
      assigningMetaData(totalBars, totalFields, tabularProcessedArrays.histogramMetaDataArray, dataJSONFile, tabularMetaData.trainVarNames, tabularMetaData.trainVarTypes);


      //2D array for couting histogram counts
      //  var histogramCountsArray = [totalFields.length];//.fill(0);
      for(var i = 0; i < totalFields.length; i++){
        tabularProcessedArrays.histogramCountsArray[i] = new Array();//.fill(0);
        //d3m
        d3mIndexArray[i] = new Array();
      }

      // for creating the 2D array with hisogram bars and corresponding values
      var returnObject = assigningHistogramCounts(totalBars,  totalFields, dataJSONFile, tabularProcessedArrays.histogramMetaDataArray, tabularProcessedArrays.histogramCountsArray, tabularMetaData.trainVarNames, d3mIndexArray);

      tabularProcessedArrays.histogramCountsArray = returnObject.histogramCountsArray

      // for creating relationships between the hisogram bars
      var barRelationsCells = 0;

      for(var i = 0; i < totalFields.length; i++){
          if(tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "integer" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "float" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "real"){
              if(tabularProcessedArrays.histogramMetaDataArray[i][colType.name] == "d3mIndex"){
                tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] = false;
              }else{
                barRelationsCells = barRelationsCells + totalBars;
                tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] = true;
                //console.log(histogramCountsArray[i]);
              }

          }
        else if(tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "categorical" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "ordinal" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "boolean"){
        //else{
              var len = tabularProcessedArrays.histogramCountsArray[i].length;
              len = len/2;
              if(len <= 20){
                  barRelationsCells = barRelationsCells + len;
                  tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] = true;
              }
              else{
                    tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] = false;
              }
        }
       else{
                tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] = false;
        }
      }

    tabularProcessedArrays.barRelationsArray = [barRelationsCells];
    for(var i = 0; i < barRelationsCells; i++){
          tabularProcessedArrays.barRelationsArray[i] = new Array(barRelationsCells).fill(0);
    }

    var participatingFields = 0;

    for(var i = 0; i < totalFields.length; i++){
        if(tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] == true){
            participatingFields++;
        }
    }

    //participatingFieldsMetaData has three colums: index tall colums array, number of bars, and max value in each histogram
    // Its own index refer to the selected participating columns in the visualization

    tabularProcessedArrays.participatingFieldsMetaData = [participatingFields];

    for(var i = 0; i < participatingFields; i++){
        tabularProcessedArrays.participatingFieldsMetaData[i] = new Array();
    }

    var currentP = 0;
    for(var i = 0; i <totalFields.length; i++){
        if(tabularProcessedArrays.histogramMetaDataArray[i][colType.barRel] == true){
            tabularProcessedArrays.participatingFieldsMetaData[currentP][partFMvar.index] = i;
            if(tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "integer" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "float" || tabularProcessedArrays.histogramMetaDataArray[i][colType.type] == "real"){
                tabularProcessedArrays.participatingFieldsMetaData[currentP][partFMvar.bars] = totalBars;
            }
            else{
                tabularProcessedArrays.participatingFieldsMetaData[currentP][partFMvar.bars] = (tabularProcessedArrays.histogramCountsArray[i].length/2);
            }
            currentP++;
        }
    }

    tabularProcessedArrays.barRelationsArray = assigningBarRelations(participatingFields, tabularProcessedArrays.participatingFieldsMetaData, dataJSONFile, tabularProcessedArrays.histogramMetaDataArray, tabularProcessedArrays.histogramCountsArray, tabularProcessedArrays.barRelationsArray);

    //Initializing two arrays for names and counts for histogramCountsArray
    tabularProcessedArrays.histogramBarCountsArray = [participatingFields];
    tabularProcessedArrays.histogramBarNamesArray = [participatingFields];
    //d3midx
    tabularProcessedArrays.histogramD3MIndexArray = [participatingFields];

    for(var i = 0; i < participatingFields; i++){
          tabularProcessedArrays.histogramBarCountsArray[i] = new Array();
          tabularProcessedArrays.histogramBarNamesArray[i] = new Array();
          //d3midxValue
          tabularProcessedArrays.histogramD3MIndexArray[i] = new Array();
    }


    //Seperating histogramCountsArray into two arrays: names and counts
    for(var i = 0; i < participatingFields; i++){
        var currentIndex = Number(tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.index]);
        var currentLen = Number(tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.bars]);

       var nameIndex = 0;
       var countIndex = 0;
        for(var j = 0; j < currentLen*2; j++){

          if(j%2 == 0){
              var currentName = tabularProcessedArrays.histogramCountsArray[currentIndex][j];
              tabularProcessedArrays.histogramBarNamesArray[i][nameIndex] = currentName;
              nameIndex++;
          }
          else{
            var currentCount = tabularProcessedArrays.histogramCountsArray[currentIndex][j];
            tabularProcessedArrays.histogramBarCountsArray[i][countIndex] = currentCount;
            //d3midxValue
            tabularProcessedArrays.histogramD3MIndexArray[i][countIndex] = returnObject.d3mIndexArray[currentIndex][j];
            //end
            countIndex++;
          }
        }
    }


    // adding the max value of each hiustogram in the participatingFieldsMetaData
    for(var i = 0; i < participatingFields; i++){
        tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.max] = tabularProcessedArrays.histogramBarCountsArray[i][0];
    }


    for(var i = 0; i < participatingFields; i++){
        for(var j = 1; j < tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.bars]; j++){
            if(tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.max] < tabularProcessedArrays.histogramBarCountsArray[i][j]){
              tabularProcessedArrays.participatingFieldsMetaData[i][partFMvar.max] = tabularProcessedArrays.histogramBarCountsArray[i][j];
            }
        }
    }

/*
    console.log("abularProcessedArrays.histogramMetaDataArray:"+tabularProcessedArrays.histogramMetaDataArray);
    console.log("abularProcessedArrays.participatingFieldsMetaData:"+tabularProcessedArrays.participatingFieldsMetaData);
    console.log("abularProcessedArrays.participatingFieldsMetaData:"+tabularProcessedArrays.participatingFieldsMetaData);
    console.log("abularProcessedArrays.histogramBarCountsArray:"+tabularProcessedArrays.histogramBarCountsArray);
    console.log("abularProcessedArrays.histogramBarNamesArray:"+tabularProcessedArrays.histogramBarNamesArray);
    console.log("abularProcessedArrays.histogramCountsArray:"+tabularProcessedArrays.histogramCountsArray);
    console.log("abularProcessedArrays.barRelationsArray:"+tabularProcessedArrays.barRelationsArray);
    console.log("abularProcessedArrays.histogramD3MIndexArray:"+tabularProcessedArrays.histogramD3MIndexArray);

*/
    return tabularProcessedArrays;

}

exports.tabularRawDataPreprocessing = tabularRawDataPreprocessing;
