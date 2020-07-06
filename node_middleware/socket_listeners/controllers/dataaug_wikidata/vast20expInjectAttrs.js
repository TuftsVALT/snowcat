/*
 * vast20expInjectAttrs.js
 * The list of attributes that is returned by relatedAttrs is non-deterministic,
 * because it is dependent on the relationships of the sampled rows.  For the 
 * experiment for our VAST 2020 paper, we have to make sure that the columns we
 * ask the users to find are going to be there, so we manually inject them here
 * if those related attributes calls are made.
 * 
 * WE ASSUME THAT THIS FUNCTION WILL NOT BE CALLED UNLESS WE ARE IN THE EXPERIMENT
 * MODE.  IT IS NOT THE RESPONSIBILITY OF THIS MODULE TO CHECK IF WE ARE IN vast20expMode.
 */

const task0CountyArea = require("./vast20exp_relatedAttrs/task0CountyArea.json");
const task0CountySharesBorderWith = require("./vast20exp_relatedAttrs/task0CountySharesBorderWith.json");
const task0CountySharesBorderWithInception = require("./vast20exp_relatedAttrs/task0CountySharesBorderWithInception.json");
const task0StatePopulation = require("./vast20exp_relatedAttrs/task0StatePopulation.json");
const task1director_nameCountryOfCitizenship = require("./vast20exp_relatedAttrs/task1director_nameCountryOfCitizenship.json");
const task1director_nameAwardsReceived = require("./vast20exp_relatedAttrs/task1director_nameAwardsReceived.json");
const task1movie_titleProducerAwardsReceived = require("./vast20exp_relatedAttrs/task1movie_titleProducerAwardsReceived.json");
const task1movie_titleCastMember = require("./vast20exp_relatedAttrs/task1movie_titleCastMember.json");
const task1movie_titleProducer = require("./vast20exp_relatedAttrs/task1movie_titleProducer.json");

let spliceExpAttrs = function(relatedAttrs, taskNum, columnName) {
  let injectableAttributes = [];
  if (taskNum == 1) {
    // this is actually task0, messed up the zero indexing somewhere
    switch (columnName) {
      case 'County':
        console.log("INJECTING ATTRS FOR COUNTY")
        injectableAttributes = [
          task0CountyArea,
          task0CountySharesBorderWith
        ];
        break;
      case 'County - shares border with (through)':
        console.log("INJECTING ATTRS FOR COUNTY THROUGH JOIN")
        injectableAttributes = [
          task0CountySharesBorderWithInception
        ];
        break;
      case 'State':
        console.log("INJECTING ATTRS FOR STATE")
        injectableAttributes = [
          task0StatePopulation
        ];
        break;
    }
  } else if (taskNum == 2) {
    // this is actually task1
    switch (columnName) {
      case 'director_name':
        console.log("INJECTING ATTRS FOR DIRECTOR")
        injectableAttributes = [
          task1director_nameCountryOfCitizenship,
          task1director_nameAwardsReceived
        ];
        break;
      case 'movie_title':
        console.log("INJECTING ATTRS FOR MOVIE TITLE")
        injectableAttributes = [
          task1movie_titleCastMember,
          task1movie_titleProducer
        ];
        break;
      case 'movie_title - producer (through)':
        console.log("INJECTING ATTRS FOR MOVIE TITLE PRODUCER THROUGH JOIN")
        injectableAttributes = [
          task1movie_titleProducerAwardsReceived
        ];
        break;
    }
  }

  return spliceAttrsIn(relatedAttrs, injectableAttributes);
}

let spliceAttrsIn = function(relatedAttrs, injectableAttributes) {
  injectableAttributes.forEach((attr) => {
    const colName = attr.name;
    const percentJoinable = attr.percentJoinable;
    const alreadyHasAttr = relatedAttrs.filter((r) => r['name'] === colName).length > 0;
    if (alreadyHasAttr) {
      console.log(colName + "is in there, replacing it")
      for (let i=0; i<relatedAttrs.length; i++) {
        let origAttr = relatedAttrs[i];
        if (origAttr['name'] === colName) {
          // we splice it in
          console.log("splicing in to relatedAttrs, its length is ", relatedAttrs.length)
          relatedAttrs.splice(i, 1, attr);
          console.log(" and now it is ", relatedAttrs.length);
        }
      }
    } else {
      console.log(colName + "is not there, gotta splice it in")
      console.log("relatedAttrs.length is ", relatedAttrs.length)
      // need to find where it should get spliced in, since they're generally sorted by percentJoinable.
      let numEqualPct = relatedAttrs.filter((r) => r['percentJoinable'] === percentJoinable).length;
      let shuffleIndex = 0;
      if (numEqualPct > 0) {
        shuffleIndex = Math.round(Math.random() * numEqualPct);
      }
      const originalAttrsLength = relatedAttrs.length;
      for (let i=0; i<originalAttrsLength; i++) {
        console.log("i is ", i, "and relatedAttrs.length is ", relatedAttrs.length, " and shuffleIndex is ", shuffleIndex);
        if ((numEqualPct > 0 && shuffleIndex === 0) || relatedAttrs[i]['percentJoinable'] < percentJoinable || (i === originalAttrsLength - 1)) {
          console.log("gonna splice it in at ", i)
          // we splice it in
          relatedAttrs.splice(i, 0, attr);
          break;
        } else {
          if (relatedAttrs[i]['percentJoinable'] === percentJoinable) {
            shuffleIndex -= 1;
          }
        }
      }
    }
  })

  return relatedAttrs;
}

module.exports = { spliceExpAttrs }