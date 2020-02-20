const { singleGetRelatedAttributes, convertColumnToQIDs, setHeaderTypes } = require("./qidServices.js");
const _ = require('lodash');
var Promise = require("bluebird");
const rp = require('request-promise');
const path = require('path');
const wikiSearch = require("./wikiSearch.js");
const config = require("./config.js");
const WIKIDATA_ENDPOINT_URI = config.sparqlEndpoint;
const CONCAT_DELIMITER = "|||||||||"
const RATE_LIMIT = 5;  // Wikidata limits you to 5 concurrent requests.
const { median, mode, variance } = require('mathjs'); 
const Bottleneck = require('bottleneck')

// NOTE: I shouldn't be converting column to QIDs here, because
// I should have already done that, I think...
function materializeJoin(joinInstructions, rawData, nrows=10) {
    // console.log("in materializeJoin, rawData.length is ", rawData.length);
    // joinInstructions will have format like this (note the recursion):
    // const joinInstructions = {
    //     'dataset': '185',
    //     'operation': 'join-string',
    //     'aggregationOp': null,
    //     'column': 'Player',
    //     'relationship': 'date-of-birth',
    //     'relationshipUri': 'http://www.wikidata.org/prop/P1082'
    //     'joinAction':  {
    //         'operation': 'join-count',
    //         'relationship': 'awards',
    //     }
    // }
    if (nrows < 0) {
        nrows = rawData.length;
    }

    const joinOp = joinInstructions['operation'];
    const aggregationOp = joinInstructions['aggregationOp'];
    const joinRel = joinInstructions['relationship'];
    const joinRelUri = joinInstructions['relationshipUri'];
    const columnName = joinInstructions['column'];
    const isRecursive = joinInstructions['joinAction'] ? true : false;
    let resultingColName = '';
    if (aggregationOp) {
        resultingColName = columnName + ' - ' + joinRel + ' (' + aggregationOp + ')';
    } else {
        resultingColName = columnName + ' - ' + joinRel;
    }

    const COLUMN_MAPPINGS = {
        "Player": 'Q10871364'      
    };

    // For now, we assume that we have a columnName mapping for the provided dataset.
    // 185_baseball headers and their mappings
    // Player,Number_seasons,Games_played,At_bats,Runs,Hits,Doubles,Triples,Home_runs,RBIs,Walks,Strikeouts,Batting_average,On_base_pct,Slugging_pct,Fielding_ave,Position,Hall_of_Fame

    // Right now, we don't do anything if we don't have a column ID.
    // if (!columnId) {
    //     return Promise.resolve([]);
    // } else {


    /* join-string
     * join-number
     * join-collection-string
         *** Valid aggregationOps:
         - count
         - mode
     * join-collection-number
         *** Valid aggregationOps:
         - count
         - mean
         - median
         - mode
         - max
         - min
         - variance
     */


    return convertColumnToQIDs(rawData, columnName, nrows).then((sampledQIDs) => {
        console.log("joinOp is ", joinOp, "and nrows is ", nrows, " and sampledQIDs.length is ", sampledQIDs.length)
        switch (joinOp) {
            case 'join-string':
                return materializeJoinString(rawData, columnName, joinRelUri, resultingColName, sampledQIDs);
                break;
            case 'join-number':
                return materializeJoinNumber(rawData, columnName, joinRelUri, resultingColName, sampledQIDs);
                break;
            case 'join-collection-string':
                // console.log("joining collection string")
                return materializeJoinCollectionString(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp);
                break;
            case 'join-collection-number':
                return materializeJoinCollectionNumber(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp);
                break;
            default:
                return Promise.resolve([]);
        }
    });
    // }
}

// https://stackoverflow.com/a/19178956/540675
function reshape(array, n){
    return _.compact(array.map(function(el, i){
        if (i % n === 0) {
            return array.slice(i, i + n);
        }
    }))
}

function subdivideQids(qids) {
    const qidGroupSize = 30;
    return reshape(qids, qidGroupSize);
}

function getRelatedLiteralColumn(targetRelUri, qids, targetColName='None') {
    console.log("qids length is ", qids.length)
    const qidGroups = subdivideQids(qids);
    console.log("qidGroups length is ", qidGroups.length)
    console.log("first group lenght is ", qidGroups[0].length);
    const regex = /\n/gi;
    let queries = qidGroups.map((qs) => {
        let query = `
            SELECT ?resource ?rel_resourcesLabel WHERE {
                VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
                
                ?resource <${targetRelUri}> ?rel_resources
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
        `
        query = query.replace(regex, '');
        return query;
        // console.log("query is ", query)
        // const headers = { 'User-Agent': 'd3m_tuftsgtwisc', 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const headers = { 'User-Agent': 'd3m_tuftsgtwisc' }
    // console.log("executing ", queries.length, " queries...")

    // // Using bottleneck library
    // const limiter = new Bottleneck({
    //     minTime: 1000 // 200 requests per second
    // });

    // return Promise.all(queries.map((query) => {
    return Promise.map(queries, (query) => {
        return rp({
            uri: WIKIDATA_ENDPOINT_URI,
            method: 'GET',
            json: true,
            headers: headers,
            // form: true,
            // followAllRedirects: true,
            qs: {
                'query': query
            }
        });
    }, { concurrency: RATE_LIMIT }).then((queryResults) => {
        // console.log(" the queries are all done, there are this many results: ", queryResults.length)
        const qidResults = _.flatten(queryResults.map((qr) => qr['results'] && qr['results']['bindings']));
        let qidMappings = {};
        qidResults.forEach((r) => {
            let resourceUri = r['resource']['value'].split('/');
            qidMappings[resourceUri[resourceUri.length - 1]] = r['rel_resourcesLabel']['value'];
        });

        let labelResults = [];
        qids.forEach((qid) => {
            labelResults.push(qidMappings[qid] || '');
        })
        // console.log("qidMappings is ", qidMappings)
        // console.log("labelResults is ", labelResults);
        // console.log("labelResults length is ", labelResults.length)
        return labelResults
    })
}

function getRelatedAggregatedColumn(targetRelUri, qids, method='count') {
    console.log("joining column with method ", method);
    let aggMethodString = '';
    switch (method) {
        case 'sum':
            aggMethodString = '(SUM(?rel_resources) as ?rel_resourcesLabelAgg)';
            break;
        case 'mean':
            aggMethodString = '(AVG(?rel_resources) as ?rel_resourcesLabelAgg)';
            break;
        case 'median':
            // console.log("no SPARQL native median")
            aggMethodString = '(GROUP_CONCAT(?rel_resources ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?rel_resourcesCollection)';
            break;
        case 'mode':
            // console.log("no SPARQL native mode")
            aggMethodString = '(GROUP_CONCAT(?rel_resources ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?rel_resourcesCollection)';
            break;
        case 'variance':
            // console.log("no SPARQL native variance")
            aggMethodString = '(GROUP_CONCAT(?rel_resources ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?rel_resourcesCollection)';
            break;
        case 'max':
            aggMethodString = '(MAX(?rel_resources) as ?rel_resourcesLabelAgg)';
            break;
        case 'min':
            aggMethodString = '(MIN(?rel_resources) as ?rel_resourcesLabelAgg)';
            break;
        default:
            aggMethodString = '(COUNT(?rel_resources) as ?rel_resourcesLabelAgg)';
    }
    const qidGroups = subdivideQids(qids);

    const regex = /\n/gi;
    let queries = qidGroups.map((qs) => {
        let query = `
            SELECT ?resource ${aggMethodString} WHERE {
                VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
                
                ?resource <${targetRelUri}> ?rel_resources
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            GROUP BY ?resource
        `
        query = query.replace(regex, '');
        return query;
        // console.log("query is ", query)
        // const headers = { 'User-Agent': 'd3m_tuftsgtwisc', 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const headers = { 'User-Agent': 'd3m_tuftsgtwisc' }
    // console.log("executing ", queries.length, " queries...")

    return Promise.map(queries, (query) => {
        return rp({
            uri: WIKIDATA_ENDPOINT_URI,
            method: 'GET',
            json: true,
            headers: headers,
            qs: {
                'query': query
            }
        });
    // }))
    }, { concurrency: RATE_LIMIT }).then((queryResults) => {
        // console.log(" the queries are all done, there are this many results: ", queryResults.length)
        const qidResults = _.flatten(queryResults.map((qr) => qr['results'] && qr['results']['bindings']));
        let qidMappings = {};
        qidResults.forEach((r) => {
            let resourceUri = r['resource']['value'].split('/');
            qidMappings[resourceUri[resourceUri.length - 1]] = r;
        });

        let labelResults = [];
        qids.forEach((qid) => {
            labelResults.push(qidMappings[qid] || {});
        })
        // console.log("qidMappings is ", qidMappings)
        // console.log("labelResults is ", labelResults);
        // console.log("labelResults length is ", labelResults.length)
        return labelResults
    })
}

/*
Takes in a dataset, a column name, and a list of QIDs to join to for that column
*/
function materializeJoinString(rawData, sourceColName, targetRelUri, targetColumnName, qids, nrows=10) {

    return getRelatedLiteralColumn(targetRelUri, qids).then((responses) => {
        if (responses) {
            // console.log("literalColumn length is ", responses.length)
            return joinColumn(rawData, targetColumnName, responses)
        } else {
            return [];
        }
    });
}   

// For now, do the same thing as joining to a string
function materializeJoinNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, nrows=10) {
    return materializeJoinString(rawData, sourceColName, targetRelUri, targetColumnName, qids, nrows);
}

// For now, do the same thing as joining to a string
function materializeJoinCollectionString(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod='count', nrows=10) {
    return materializeJoinCollectionNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod, nrows, true);
}

function stringMode(collection) {
    // console.log("calling string mode with collection ", collection)
    let counts = {};
    collection.forEach((c) => {
        counts[c] = counts[c] || 0;
        counts[c] += 1;
    })
    return _.max(Object.keys(counts), o => counts[o]);
}

function numericalMode(collection) {
    return mode(collection.map((r) => parseFloat(r)))[0];
}

// For now, do the same thing as joining to a string
function materializeJoinCollectionNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod='count', nrows=10, isString=false) {
    return getRelatedAggregatedColumn(targetRelUri, qids, joinMethod).then((response) => {
        if (response) {
            return joinColumn(rawData, targetColumnName, response.map((b) => {
                if (b['rel_resourcesLabelAgg']) {
                    return b['rel_resourcesLabelAgg']['value'];
                } else {
                    // Try to set the coltypes
                    switch (joinMethod) {
                        case 'count':
                            setHeaderTypes(targetColumnName, 'integer');
                            break;
                        default:
                            setHeaderTypes(targetColumnName, 'real');
                    }

                    // check to see if we had to define this aggregation ourselves, by group_concat
                    const resourceCollection = b['rel_resourcesCollection'] && _.split(b['rel_resourcesCollection']['value'], CONCAT_DELIMITER);
                    switch (b['rel_resourcesCollection'] && joinMethod) {
                        case 'median':
                            return median(resourceCollection.map((r) => parseFloat(r)));
                            break;
                        case 'mode':
                            if (isString) {
                                return stringMode(resourceCollection);
                            } else {
                                return numericalMode(resourceCollection);
                            }
                            break;
                        case 'variance':
                            // console.log("b is ", b, "and resourceCollection is ", resourceCollection.map((r) => parseFloat(r)));
                            // console.log("variance is ", variance(resourceCollection.map((r) => parseFloat(r))));
                            return variance(resourceCollection.map((r) => parseFloat(r)));
                            break;
                        default:
                            return ''
                    }
                }
            }))
        } else {
            return [];
        }
    });
}

/*
Takes in a dataset, a source column name, and a column of data that we assume is ordered the same as the raw data.
For now, just returns the data joined together.  But we may, at some point, want to return a d3m dataset.
*/
function joinColumn(rawData, targetColName, targetData) {
    // console.log("rawData[0] is ", rawData[0])
    // console.log("targetData is ", targetData)
    // console.log("HEY! targetColName is ", targetColName)
    // console.log("in joinColumn, targetData length is ", targetData.length, " and rawData length is ", rawData.length)
    for (let i=0; i<targetData.length; i++) {
        rawData[i][targetColName] = targetData[i];
    }
    return rawData;
}
module.exports = { materializeJoin, materializeJoinString, materializeJoinNumber, materializeJoinCollectionString, materializeJoinCollectionNumber };