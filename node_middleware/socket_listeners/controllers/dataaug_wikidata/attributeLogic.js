const fs = require("fs");
const papa = require("papaparse");
const { singleGetRelatedAttributes, convertColumnToQIDs, convertHeaderToQID } = require("./qidServices.js");
const _ = require('lodash');
const RATE_LIMIT = 5;  // Wikidata limits you to 5 concurrent requests.
const Promise = require("bluebird");

function getRawData(dataset, nrows=-1, rawData=null) {
    if (rawData) {
        resolve(rawData);
    } else {
        return new Promise(function(resolve, reject) {
            if (dataset) {
                let filepath = dataset.getLearningDataFile();
                let stream = fs.createReadStream(filepath);
                papa.parse(stream, {
                    header: true,
                    dynamicTyping: true,
                    preview: nrows,
                    error: function(error, file) {
                        console.log("error reading file", file);
                        reject(err);
                    },
                    complete: function(results) {
                        resolve((results.data));
                    }
                });
            } else {
                resolve(null);
            }
        });
    };
}

/* 
TODOS
- add in some kind of loading messages getting sent back to the front end.  This may be
a really long process, so we'll need to give feedback / a progress bar.

Also calculates the `type` of each related attribute.  Valid options are
    - join-string
    - join-number
    - join-collection-string
    - join-collection-number

Parameters:
- columnName: the name of the column we are getting related attributes for
- fn: function called with the results of this function
- numSampled: the number of rows we sample to determine the common attributes
*/
function getRelatedAttributes(columnName, rawData, numAttributes=50, numSampled=10) {

    // For now, we assume that we have a columnName mapping for the provided dataset.
    // 185_baseball headers and their mappings
    // Player,Number_seasons,Games_played,At_bats,Runs,Hits,Doubles,Triples,Home_runs,RBIs,Walks,Strikeouts,Batting_average,On_base_pct,Slugging_pct,Fielding_ave,Position,Hall_of_Fame

    const columnId = convertHeaderToQID(rawData, columnName);
    // We actually don't do anything differently if we don't have the columnId
    // if (!columnId) {
    //     return Promise.resolve([]);
    // } else {
        // We randomly sample 10 rows from the dataset, and search for their related attributes, then sample 10 of the most
        // frequent relationships, numerical and literal.
        // if (!rawData) {
        //   getRawData();
        // }

    return convertColumnToQIDs(rawData, columnName, numSampled).then((sampledQIDs) => {
        // Make 10 Promises, and when they are all resolved, we take the count of common attributes
        // const relatedAttributesListsPromises = sampledQIDs.map((qid) => singleGetRelatedAttributes(qid));
        // return Promise.all(relatedAttributesListsPromises).then(function (relatedAttributesLists) {
        return Promise.map(sampledQIDs, singleGetRelatedAttributes, { concurrency: RATE_LIMIT }).then(function (relatedAttributesLists) {
                // Return the 10 most common attributes
                // console.log("relatedAttributesLists is ", relatedAttributesLists)
            return joinAttributes(relatedAttributesLists, numAttributes);
        });
    });
    // }
}

/*
 * This function should choose the top k most common attributes from the lists provided.
 */
function joinAttributes(relatedAttributesLists, attrNumber = 10) {
    let attrCounts = {};
    // console.log("relatedAttributesLists is ", relatedAttributesLists)
    relatedAttributesLists.forEach((attributeList) => {
        attributeList.forEach((attr) => {
            if (attr['wdLabel']) {
                const attrName = attr['wdLabel'] && attr['wdLabel']['value'];
                const attrUri = attr['p'] && attr['p']['value'];
                const attrType = attr['valueType'];
                attrCounts[attrName] = attrCounts[attrName] || { 'name': attrName, 'count': 0, 'valueType': attrType, 'uri': attrUri};
                attrCounts[attrName]['count'] += 1;
            }
        });
    });
    // console.log("attrCounts are ", attrCounts)
    return _.slice(_.reverse(_.sortBy(Object.values(attrCounts), (a) => a['count'])), 0, attrNumber);
}


module.exports = { getRawData, getRelatedAttributes, joinAttributes };