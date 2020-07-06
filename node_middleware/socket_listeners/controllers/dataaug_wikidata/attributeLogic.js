const fs = require("fs");
const papa = require("papaparse");
var chrono = require('chrono-node');
const { singleGetRelatedAttributes, convertColumnToQIDs, convertHeaderToQID } = require("./qidServices.js");
const { materializeJoin, getRelatedLiteralColumn } = require("./joinLogic.js");
const _ = require("lodash");
const RATE_LIMIT = 3;  // Wikidata limits you to 5 concurrent requests.
const AGGREGATE_SAMPLE_RATE = 50;
const NUM_BINS = 10;
const Promise = require("bluebird");
const ss = require("simple-statistics");
const d3 = require("d3");
const config = require("./config.js");
const CONCAT_DELIMITER = "|||||||||"

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

// https://stackoverflow.com/a/19178956/540675
function reshape(array, n){
    return _.compact(array.map(function(el, i){
        if (i % n === 0) {
            return array.slice(i, i + n);
        }
    }))
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
function getRelatedAttributes(columnName, rawData, numAttributes=100, numSampled=10, aggregateSampleSize=-1) {

    // For now, we assume that we have a columnName mapping for the provided dataset.
    // 185_baseball headers and their mappings
    // Player,Number_seasons,Games_played,At_bats,Runs,Hits,Doubles,Triples,Home_runs,RBIs,Walks,Strikeouts,Batting_average,On_base_pct,Slugging_pct,Fielding_ave,Position,Hall_of_Fame

    // const columnId = convertHeaderToQID(rawData, columnName);
    // We actually don't do anything differently if we don't have the columnId
    // if (!columnId) {
    //     return Promise.resolve([]);
    // } else {
        // We randomly sample 10 rows from the dataset, and search for their related attributes, then sample 10 of the most
        // frequent relationships, numerical and literal.
        // if (!rawData) {
        //   getRawData();
        // }
    console.log("GETTING COLUMN QIDS")
    return convertColumnToQIDs(rawData, columnName, numSampled).then((sampledQIDs) => {
        // console.log("GOT COLUMN QIDS, they are ", sampledQIDs)

        const qidGroups = reshape(sampledQIDs, 4);

        // Make 10 Promises, and when they are all resolved, we take the count of common attributes
        // const relatedAttributesListsPromises = sampledQIDs.map((qid) => singleGetRelatedAttributes(qid));
        // return Promise.all(relatedAttributesListsPromises).then(function (relatedAttributesLists) {
        return Promise.map(qidGroups, singleGetRelatedAttributes, { concurrency: RATE_LIMIT }).then(function (relatedAttributesLists) {
            console.log("Successfully got related attributes")
            let joinedAttributes = joinAttributes(relatedAttributesLists, numAttributes); 
            if (aggregateSampleSize > 0) {
                return attachAggregateSummaries(sampledQIDs, joinedAttributes, rawData, columnName, aggregateSampleSize);
            } else {
                return Promise.resolve(joinedAttributes);
            }
        });
    });
    // }
}

/* recurses through join instructions, starting at parent entity, and then going through join instructions
   to get an example for each level.
   Returns an array of arrays.  
   Each array is a set of up to 3 examples that are a child of the first element of the preceding array in the array
   */
function recursiveGetExamples(throughJoinInstructions, parentQID) {
    let relationshipUri = throughJoinInstructions['relationshipUri'];
    console.log("parentQID is ", parentQID, " and throughJoinInstructions['parentEntityExample'] is ", throughJoinInstructions['parentEntityExample'])
    let extractQID = function(uri) {
        let splitUri = uri.split('/');
        return splitUri[splitUri.length - 1]
    }
    if (throughJoinInstructions['parentJoin']) {
        // console.log("throughJoin has a parent")
        return recursiveGetExamples(throughJoinInstructions['parentJoin'], parentQID).then((parentExamples) => {
        // return recursiveGetExamples(throughJoinInstructions['parentJoin'], { 'uri': throughJoinInstructions['parentEntityExampleUri'], 'label': throughJoinInstructions['parentEntityExample']}).then((parentExamples) => {
            // console.log("throughJoin has a parentExamples", parentExamples, " and newExample is ", parentExamples[0][0])
            const newExample = parentExamples[0][0];
            return getRelatedLiteralColumn(relationshipUri, [extractQID(newExample['uri'])], true).then((responses) => {
                console.log("gotRelatedLiteralColumn for child, responses is ", responses, " and parentExamples[0] is ", parentExamples[0])
                return(parentExamples.concat(responses));
            })
        })
    } else {
        // At the bottom, use the parentQid
        console.log("throughJoin has no parent!  and it is ", throughJoinInstructions['parentEntityExampleUri'], ", relationship uri is ", relationshipUri, "parentQID is ", parentQID );

        return getRelatedLiteralColumn(relationshipUri, [extractQID(parentQID['uri'])], true).then((responses) => {
        // return getRelatedLiteralColumn(relationshipUri, [extractQID(throughJoinInstructions['parentEntityExampleUri'])], true).then((responses) => {
                console.log("gotRelatedLiteralColumn for parent, and it was ", responses)
            return [responses[0]];
        })
    }
}

// function calculateRecursiveColName(joinInstructions, baseName='', recursed=false) {
//     const joinRel = joinInstructions['relationship'];
//     const aggregationOp = joinInstructions['aggregationOp'];
//     let addition = '';
//     if (aggregationOp) { 
//         addition = ' - ' + joinRel + ' (' + aggregationOp + ')';
//     } else {
//         addition = ' - ' + joinRel;
//     }
//     if (joinInstructions['parentJoin']) {
//         return calculateRecursiveColName(joinInstructions['parentJoin'], baseName, true) + addition
//     } else {
//         if (recursed) {
//             const origCol = joinInstructions['column'];
//             return origCol + addition;
//         } else {
//             return baseName + addition;
//         }
//     }
// }


/*
 * This function calculates aggregate summaries for the related attributes.
 * Currently, it takes in the joined attributes, and attaches the other ones onto it.
 * In the future, this should just be an asynchronous method that sends updates over the socket, and doesn't block things.
 */
function attachAggregateSummaries(sampledQIDs, joinedAttributes, rawData, columnName, aggregateSampleSize) {
    // We need to get the QIDs for aggregateSampleSize
    // Then, we get the join values for those
    // Then, we calculate the following aggregates:
    // console.log("attaching Aggregate summaries")
    const totalRows = rawData.length;
    const scaleFactor = 1 / (aggregateSampleSize / totalRows);
    // console.log("got all the QIDs")
    return Promise.map(joinedAttributes, (j) => {
        const uri = j['uri'];
        const dataType = j['dataType'];
        const joinName = j['name'];
        // console.log("calculating aggregate statistics for ", joinName)

        return getRelatedLiteralColumn(uri, sampledQIDs).then((responses) => {
            // console.log(" materialized the join for ", joinName)
            // console.log("data is joined, now calculating statistics:")
            // - percentJoinable
            // console.log("percentJoinable");

            // Round it here to two decimal places
            const numNonNull = responses.filter((v) => !!v).length;
            j['percentJoinable'] = numNonNull / sampledQIDs.length;

            if (dataType === 'integer' || dataType === 'number' || dataType === 'real' || dataType === 'datetime') {
                // Numeric attribute, so we can calculate summaryStats, histogramBins, and correlations
                // - summaryStats ('max', 'min', 'mean', 'firstQuartileEnd', 'median', 'thirdQuartileEnd')
                // - histogramBins
                // - correlations
                let responseNums = [];

                if (dataType === 'datetime') {
                    let responseDateTimes = responses.map(chrono.parseDate);
                    responseNums = responseDateTimes.filter((j) => !isNaN(j)).map((d) => {return d && d.getTime()});
                    // console.log("responses is ", responses)
                    // console.log("responseDateTimes is ", responseDateTimes)
                    // console.log("responseNums is ", responseNums)
                } else {
                    let responseFloats = responses.map(parseFloat);
                    responseNums = responseFloats.filter((j) => !isNaN(j));
                }

                j['summaryStats'] = {
                    'max': ss.max(responseNums),
                    'min': ss.min(responseNums),
                    'mean': ss.mean(responseNums),
                    'mode': ss.mode(responseNums),
                    'firstQuartileEnd': ss.quantile(responseNums, 0.25),
                    'median': ss.median(responseNums, 0.5),
                    'thirdQuartileEnd': ss.quantile(responseNums, 0.75),
                    'variance': ss.variance(responseNums)
                };

                if (dataType === 'datetime') {
                    Object.keys(j['summaryStats']).forEach((k) => {
                        j['summaryStats'][k] = new Date(j['summaryStats'][k])
                    });
                }

                const min = j['summaryStats']['min'];
                const max = j['summaryStats']['max'];
                const range = [];
                for (let j = 0; j<NUM_BINS; j++) {
                    range.push(j);
                }
                const binningScale = d3.scaleQuantize()
                    .domain([min, max])
                    .range(range);

                const binAssignments = responseNums.map(binningScale);
                const bins = new Array(NUM_BINS);
                for (let i=0; i< NUM_BINS; i++) {
                    if (dataType === 'datetime') {
                        bins[i] = {
                            'min': new Date(binningScale.invertExtent(i)[0]),
                            'max': new Date(binningScale.invertExtent(i+1)[0]) || new Date(max),
                            'count': 0
                        };

                    } else {
                        bins[i] = {
                            'min': binningScale.invertExtent(i)[0],
                            'max': binningScale.invertExtent(i+1)[0] || max,
                            'count': 0
                        };
                    }
                }
                binAssignments.forEach((ba) => {
                    bins[ba]['count'] += 1;
                });

                j['histogramBins'] = bins;
                j['sampleData'] = responseNums;

                // j['correlations'] = {

                // }
            }

            if (dataType === 'string') {
                // Categorical attribute, can calculate frequencyCounts
                // - frequencyCounts
                let frequencyCounts = {};
                responses.forEach((r) => {
                    frequencyCounts[r] = frequencyCounts[r] || 0;
                    frequencyCounts[r] += 1;
                });

                j['frequencyCounts'] = frequencyCounts;
                j['sampleData'] = responses;
            }
            return j;

        });
    }, { concurrency: RATE_LIMIT });
}

/*
 * This function should choose the top k most common attributes from the lists provided.
 */
function joinAttributes(relatedAttributesLists, attrNumber = 10, exampleNum = 3) {
    let attrCounts = {};
    // console.log("relatedAttributesLists is ", relatedAttributesLists)
    relatedAttributesLists.forEach((attributeList) => {
        attributeList.forEach((attr) => {
            if (attr['wdLabel']) {
                const attrName = attr['wdLabel'] && attr['wdLabel']['value'];
                const attrDescription = attr['wdDescription'] && attr['wdDescription']['value'];
                const attrUri = attr['wdt'] && attr['wdt']['value'];
                const attrUnits = attr['unitLabel'] && attr['unitLabel']['value'];
                const attrType = attr['valueType'];
                const example = (!!attr['exampleLab']) ? attr['exampleLab']['value'] : attr['exampleLit']['value'];
                const parentEntity = attr['entityLabel'] && attr['entityLabel']['value'];
                const parentEntityUri = attr['entity'] && attr['entity']['value'];
                const pointsInTime = attr['pointsInTime'] && attr['pointsInTime']['value'] && attr['pointsInTime']['value'].split(CONCAT_DELIMITER);
                const valsInTime = attr['valsInTime'] && attr['valsInTime']['value'] && attr['valsInTime']['value'].split(CONCAT_DELIMITER);
                let sortedTemporalVals = [];
                for (let i=0; i<pointsInTime.length; i++) {
                    sortedTemporalVals[i] = { 'time': pointsInTime[i], 'val': valsInTime[i]}
                }
                sortedTemporalVals = _.sortBy(sortedTemporalVals, ((o) => o['time'])).reverse();

                if (!attrCounts[attrName]) {
                    attrCounts[attrName] = attr;
                    attrCounts[attrName]['count'] = 0;
                    attrCounts[attrName]['uri'] = attrUri;
                    attrCounts[attrName]['name'] = attrName;
                    attrCounts[attrName]['valueType'] = attrType;
                    attrCounts[attrName]['description'] = attrDescription;
                    attrCounts[attrName]['units'] = attrUnits;
                    attrCounts[attrName]['examples'] = [];
                    attrCounts[attrName]['pointsInTime'] = pointsInTime;
                    attrCounts[attrName]['valsInTime'] = valsInTime;
                    attrCounts[attrName]['sortedTemporalVals'] = sortedTemporalVals;
                }
                // attrCounts[attrName] = attrCounts[attrName] || attr{ 'name': attrName, 'count': 0, 'valueType': attrType, 'uri': attrUri};
                attrCounts[attrName]['count'] += 1;
                if (attrCounts[attrName]['examples'].length < exampleNum) {
                    attrCounts[attrName]['examples'].push(example);
                }
                if (!attrCounts[attrName]['parentEntityExample']) {
                    attrCounts[attrName]['parentEntityExample'] = parentEntity;
                    attrCounts[attrName]['parentEntityExampleUri'] = parentEntityUri;
                }

            }
        });
    });
    // console.log("attrCounts are ", attrCounts.map((a) => {'name': attrName})
    // console.log("attrCounts are ", _.reverse(_.sortBy(Object.values(attrCounts), (a) => a['count'])).map((a) => { return {'name': a['name'], 'count': a['count']}}))
    return _.slice(_.reverse(_.sortBy(Object.values(attrCounts), (a) => a['count'])), 0, attrNumber);
}


module.exports = { getRawData, getRelatedAttributes, joinAttributes, recursiveGetExamples };