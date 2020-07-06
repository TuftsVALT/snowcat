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
const { mean, median, mode, variance } = require('mathjs'); 
const Bottleneck = require('bottleneck')
const nearest = require('nearest-date')
const moment = require('moment');
// NOTE: I shouldn't be converting column to QIDs here, because
// I should have already done that, I think...

// In here, we are breaking if there is a deep through join.  I think it's just when calculating the statistics, though, right?...
// Hmm...  Actually, it's when I get the additional values.  So I just need a slightly different query here, I really only need to 
// get the first when I'm doing this.  So through's shouldn't get all and return concatenated, just sample.
function materializeJoin(joinInstructions, rawData, nrows=10) {
    console.log("in materializeJoin, rawData.length is ", rawData.length);
    // console.log(" and joinInstructions are", joinInstructions)
    // joinInstructions will have format like this (note the recursion):
    // const joinInstructions = {
    //     'dataset': '185',
    //     'operation': 'join-string',
    //     'aggregationOp': null,
    //     'column': 'Player',
    //     'relationship': 'date-of-birth',
    //     'relationshipUri': 'http://www.wikidata.org/prop/P1082'
    //     'parentJoin':  {
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
    const columnName = joinInstructions['parentEntityColumn'] || joinInstructions['column'];
    const isRecursive = joinInstructions['parentJoin'] ? true : false;
    // Here, we need to actually calculate the correct aggregation name.
    let resultingColName = '';
    resultingColName = calculateRecursiveColName(joinInstructions, columnName)
    const temporalSelectionInstructions = joinInstructions['temporalSelectionInstructions'];
    const temporalFilterChoice = temporalSelectionInstructions && temporalSelectionInstructions.temporalFilterChoice;
    const closestToDate = temporalSelectionInstructions && temporalSelectionInstructions.closestToDate;
    const inferDateAttribute = temporalSelectionInstructions && temporalSelectionInstructions.inferDateAttribute;

    if (temporalFilterChoice === 'most_recent') {
        resultingColName = 'most_recent-' + resultingColName;
    } else if (temporalFilterChoice === 'closest_to_date') {
        resultingColName = 'closest_to_' + closestToDate + '-' + resultingColName;
    } else if (temporalFilterChoice === 'other_column') {
        resultingColName = 'inferred_' + inferDateAttribute + '-' + resultingColName;
    }
    // if (aggregationOp) {
    //     resultingColName = columnName + ' - ' + joinRel + ' (' + aggregationOp + ')';
    // } else {
    //     resultingColName = columnName + ' - ' + joinRel;
    // }

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
        if (isRecursive) {
            switch (joinOp) {
                case 'join-string':
                case 'join-collection-string':
                    return materializeJoinCollectionString(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp, joinInstructions);
                    break;
                case 'join-number':
                case 'join-collection-number':
                    return materializeJoinCollectionNumber(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp, joinInstructions);
                    break;
                default:
                    return Promise.resolve([]);
            }
        } else {
            switch (joinOp) {
                case 'join-string':
                    return materializeJoinString(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, joinInstructions);
                    break;
                case 'join-number':
                    return materializeJoinNumber(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, joinInstructions);
                    break;
                case 'join-collection-string':
                    return materializeJoinCollectionString(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp, joinInstructions);
                    break;
                case 'join-collection-number':
                    return materializeJoinCollectionNumber(rawData, columnName, joinRelUri, resultingColName, sampledQIDs, aggregationOp, joinInstructions);
                    break;
                default:
                    return Promise.resolve([]);
    
            }
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

function subdivideQids(qids, qidGroupSize=30) {
    return reshape(qids, qidGroupSize);
}

function getRelatedLiteralColumn(targetRelUri, qids, returnUris=false) {
    // console.log("qids length is ", qids.length)
    const qidGroups = subdivideQids(qids);
    // console.log("qidGroups length is ", qidGroups.length)
    // console.log("first group length is ", qidGroups[0].length);
    const regex = /\n/gi;
    let queries = qidGroups.map((qs) => {
        let query = `
            SELECT ?resource ?rel_resourcesLabel ?rel_resources WHERE {
                VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
                
                ?resource <${targetRelUri}> ?rel_resources
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
        `
        query = query.replace(regex, '');
        console.log("getRelatedLiteralColumn query is ", query)
        return query;
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
            if (returnUris) {
                // We use this to get examples quickly, so we actually want to 
                qidMappings[resourceUri[resourceUri.length - 1]] = qidMappings[resourceUri[resourceUri.length - 1]] || [];
                qidMappings[resourceUri[resourceUri.length - 1]].push({'label': r['rel_resourcesLabel']['value'], 'uri': r['rel_resources']['value']});

            } else {
                qidMappings[resourceUri[resourceUri.length - 1]] = r['rel_resourcesLabel']['value'];
            }
        });

        let labelResults = [];
        qids.forEach((qid) => {
            if (qidMappings[qid]) {
                labelResults.push(qidMappings[qid] || []);
            }
        })
        // console.log("qidMappings is ", qidMappings)
        // console.log("labelResults is ", labelResults);
        // console.log("labelResults length is ", labelResults.length)
        return labelResults
    })
}

function queryStringForMethod(method, labelString='rel_resources', resultString='rel_resources', temporalSelectionInstructions={}) {
    const temporalFilterChoice = temporalSelectionInstructions && temporalSelectionInstructions.temporalFilterChoice;
    if (temporalFilterChoice === 'most_recent' || temporalFilterChoice === 'closest_to_date' || temporalFilterChoice === 'other_column') {
        // ?temporalVal .
        // ?stmnode pq:P585 ?pointInTime .
        return '(GROUP_CONCAT(?temporalVal ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection) (GROUP_CONCAT(?pointInTime ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'CollectionDates)';
    }
    switch (method) {
        case 'sum':
            return '(SUM(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        case 'mean':
            return '(AVG(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
            // return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        case 'median':
            return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        case 'mode':
            return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        case 'through':
            return '(SAMPLE(DISTINCT ?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        case 'value':
            return '(SAMPLE(DISTINCT ?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        case 'any':
            // First statement is for through joins, so we keep the QID if joining through
            // Second statement is for labels, if it's the final step of the join, so we get the labeling service
            return '(SAMPLE(DISTINCT ?' + labelString + ') as ?' + resultString + 'LabelAgg) (SAMPLE(DISTINCT ?' + labelString + 'Label) as ?' + resultString + 'LabelAggAny)';
        case 'variance':
            return '(GROUP_CONCAT(?' + labelString + ' ; SEPARATOR="' + CONCAT_DELIMITER + '") as ?' + resultString + 'Collection)';
        case 'max':
            return '(MAX(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        case 'min':
            return '(MIN(?' + labelString + ') as ?' + resultString + 'LabelAgg)';
        default:
            return '(COUNT(DISTINCT ?' + labelString + ') as ?' + resultString + 'LabelAgg)';
    }
    
}

function calculateRecursiveColName(joinInstructions, baseName='', recursed=false) {
    const joinRel = joinInstructions['relationship'];
    const aggregationOp = joinInstructions['aggregationOp'];
    let addition = '';
    if (aggregationOp) { 
        addition = ' - ' + joinRel + ' (' + aggregationOp + ')';
    } else {
        addition = ' - ' + joinRel;
    }
    if (joinInstructions['parentJoin']) {
        return calculateRecursiveColName(joinInstructions['parentJoin'], baseName, true) + addition
    } else {
        if (recursed) {
            const origCol = joinInstructions['column'];
            return origCol + addition;
        } else {
            return baseName + addition;
        }
    }
}

function calculateRecursivePreamble (joinInstructions, joinDepth, first=true, prevAggregationOp='count') {
    const aggregationOp = joinInstructions['aggregationOp'];
    let queryString = "SELECT ?resource ";
    for (let i = joinDepth - 1; i > 1; i--) {
        queryString = queryString + "?inter" + i + " "
    }
    if (first) {
        // I think I unfortunately have to add this opening bracket in here to handle the label service later...
        queryString = "{" + queryString + queryStringForMethod(aggregationOp, "inter0", "aggInter" + (joinDepth));
    } else {
        let aggregatedFeature = "aggInter" + (joinDepth+1) + 'LabelAgg';
        if (['mode', 'median', 'variance'].includes(prevAggregationOp)) {
            aggregatedFeature = "aggInter" + (joinDepth+1) + 'Collection';
        }
        if (joinDepth == 1) {
            queryString = queryString + queryStringForMethod(aggregationOp, aggregatedFeature);
        } else {
            queryString = queryString + queryStringForMethod(aggregationOp, aggregatedFeature, "aggInter" + (joinDepth));
        }
    }
    queryString = queryString + " WHERE { "
    if (joinInstructions['parentJoin']) {
        return calculateRecursivePreamble(joinInstructions['parentJoin'], joinDepth - 1, false, aggregationOp) + queryString
    } else {
        return queryString
    }
}

function calculateRecursiveQueryTriplets(joinInstructions, joinDepth, fullJoinDepth, first=true) {
    if (joinDepth > 0) {
        const uri = joinInstructions['relationshipUri'];
        let queryString;
        if (joinDepth == 1) {
            queryString = "?resource <" + uri + "> ?inter" + (fullJoinDepth - joinDepth) + " . ";
        } else {
            queryString = "?inter" + (fullJoinDepth - joinDepth + 1) + " <" + uri + "> ?inter" + (fullJoinDepth - joinDepth) + " . ";
        }
        return queryString + calculateRecursiveQueryTriplets(joinInstructions['parentJoin'], joinDepth - 1, fullJoinDepth, false);
    } else {
        return '';
    }
}

function calculateRecursivePostamble (joinInstructions, joinDepth) {
    if (joinDepth < 2) {
        return ''
    } else {
        let queryString = "} GROUP BY ?resource";
        for (let i = joinDepth - 1; i > 0; i--) {
            queryString = queryString + " ?inter" + i
        }
    
        if (joinInstructions['parentJoin']) {
            return queryString + calculateRecursivePostamble(joinInstructions['parentJoin'], joinDepth - 1);
        } else {
            return queryString
        }    
    
    }
}

// SELECT ?resource ${aggMethodString} WHERE {
//     ${recursivePreamble(joinInstructions, joinDepth)}
//     VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
    
//     ?resource <${targetRelUri}> ?rel_resources
//     ${recursivePostamble(joinInstructions, joinDepth)}
// }
// GROUP BY ?resource


function calculateJoinDepth (joinInstructions) {
    if (joinInstructions['parentJoin']) {
        return 1 + calculateJoinDepth(joinInstructions['parentJoin']);
    } else {
        return 1;
    }
}

function getRelatedAggregatedColumn(targetRelUri, qids, method='count', throughJoinInstructions = {}) {
    // console.log("joining column with method ", method);
    const temporalSelectionInstructions = throughJoinInstructions['temporalSelectionInstructions'];

    let aggMethodString = queryStringForMethod(method, 'rel_resources', 'rel_resources', temporalSelectionInstructions);

    // I got a bit screwy in the data structures, so I have to 
    // unfortunately calculate the depth of the join here.
    // If I was smarter, I could have organized the join Instructions
    // so that I didn't have to do this, but oh well.
    let joinDepth = calculateJoinDepth(throughJoinInstructions)    

    let qidGroups = [];

    if (joinDepth > 1) {
        // For some reason, these recursive sparql queries are breaking if there are more than one resource being used.
        qidGroups = subdivideQids(qids, 1);
    } else {
        qidGroups = subdivideQids(qids);
    }

    // Hmm... The recursive query building doesn't take into account the 
    // date disaggregations...  Need to update it.
    const regex = /\n/gi;
    let queries = qidGroups.map((qs) => {
        let query;
        if (joinDepth > 1) {
            // recursive join
            query = `
            ${calculateRecursivePreamble(throughJoinInstructions, joinDepth)}
                    VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
                    ${calculateRecursiveQueryTriplets(throughJoinInstructions, joinDepth, joinDepth)}
                    ${calculateRecursivePostamble(throughJoinInstructions, joinDepth)}
                }
                SERVICE wikibase:label {bd:serviceParam wikibase:language "en". ?aggInter${joinDepth}LabelAgg rdfs:label ?aggInter${joinDepth}LabelAggLabel . }
            }
            GROUP BY ?resource
            `
        } else {
            query = `
            SELECT ?resource ${aggMethodString} WHERE {
                VALUES ?resource { ${qs.map((qid) => "wd:" + qid).join(' ')} }
                
                ?resource <${targetRelUri}> ?rel_resources .

                OPTIONAL {
                    ?wd wikibase:directClaim <${targetRelUri}> .
                    ?wd wikibase:claim ?p .
                    ?wd wikibase:statementValue ?psv .
                    ?resource ?p ?stmnode .
                    ?wd wikibase:statementProperty ?ps .
                    ?stmnode ?ps ?temporalVal .
                    ?stmnode pq:P585 ?pointInTime .
                }

                SERVICE wikibase:label {bd:serviceParam wikibase:language "en". ?rel_resources rdfs:label ?rel_resourcesLabel . }
            }
            GROUP BY ?resource
            `

        }
        query = query.replace(regex, '');
        console.log("get related Aggregated query is ", query)
        return query;
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
function materializeJoinString(rawData, sourceColName, targetRelUri, targetColumnName, qids, throughJoinInstructions={}) {

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
function materializeJoinNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, throughJoinInstructions={}) {
    return materializeJoinString(rawData, sourceColName, targetRelUri, targetColumnName, qids, throughJoinInstructions);
}

// For now, do the same thing as joining to a collection of numbers
function materializeJoinCollectionString(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod='count', throughJoinInstructions={}) {
    return materializeJoinCollectionNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod, throughJoinInstructions, true);
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

function mostRecent(resourceCollection, datesCollection) {
    let indexes = [];
    for (let i=0; i<resourceCollection.length; i++) {
        indexes[i] = i;
    }
    const maxIndex = _.maxBy(indexes, (j) => datesCollection[j]);
    const maxDate = resourceCollection[maxIndex];
    console.log("max is ", maxDate, " and resourceCollection is ", resourceCollection)
    return maxDate;
};

function getClosestToDate(resourceCollection, closestToDate, datesCollection) {
    const dates = datesCollection.map((d) => { return new Date(d) });
    const closestDateObj = new Date(closestToDate);
    console.log("returning closest date to ", closestToDate)
    const index = nearest(dates, closestDateObj);
    return resourceCollection[index];
};

function materializeJoinCollectionNumber(rawData, sourceColName, targetRelUri, targetColumnName, qids, joinMethod='count', throughJoinInstructions={}, isString=false) {

    const temporalSelectionInstructions = throughJoinInstructions['temporalSelectionInstructions'];
    const temporalFilterChoice = temporalSelectionInstructions && temporalSelectionInstructions.temporalFilterChoice;
    const closestToDate = temporalSelectionInstructions && temporalSelectionInstructions.closestToDate;
    const inferDateAttribute = temporalSelectionInstructions && temporalSelectionInstructions.inferDateAttribute;

    // console.log("IM IN MATERIALIZEJOINCOLLECTIONNUMBER and temporalFilterChoice is ", temporalFilterChoice)

    return getRelatedAggregatedColumn(targetRelUri, qids, joinMethod, throughJoinInstructions).then((response) => {
        if (response) {
            let joinedData = joinColumn(rawData, targetColumnName, response.map((joinedDataRow) => {
                // console.log("joinedDataRow is ", joinedDataRow)
                if (joinedDataRow['rel_resourcesLabelAggAny'] && joinedDataRow['rel_resourcesLabelAggAny']['value'] && joinedDataRow['rel_resourcesLabelAggAny']['value'].length > 0) {
                    return joinedDataRow['rel_resourcesLabelAggAny']['value'];
                } else if (joinedDataRow['rel_resourcesLabelAgg']) {
                    return joinedDataRow['rel_resourcesLabelAgg']['value'];
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
                    const resourceCollection = joinedDataRow['rel_resourcesCollection'] && _.split(joinedDataRow['rel_resourcesCollection']['value'], CONCAT_DELIMITER);
                    const datesCollection = joinedDataRow['rel_resourcesCollectionDates'] && _.split(joinedDataRow['rel_resourcesCollectionDates']['value'], CONCAT_DELIMITER);
                    console.log("temporalFilterChoice is ", temporalFilterChoice);
                    if (temporalFilterChoice === 'most_recent') {
                        return mostRecent(resourceCollection, datesCollection);
                    } else if (temporalFilterChoice === 'closest_to_date') {
                        return getClosestToDate(resourceCollection, closestToDate, datesCollection);
                    } else if (temporalFilterChoice === 'other_column') {
                        // We have to return the values and the dates, so that, once we join to the original data,
                        // we can select the one closest to the date from the column
                        // console.log("filter choice was other_column....")
                        return {
                            'datesCollection': datesCollection,
                            'resourceCollection': resourceCollection
                        };
                    }
                    console.log("joinMethod is ", joinMethod)
                    switch (joinedDataRow['rel_resourcesCollection'] && joinMethod) {
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
                        case 'through':
                            console.log("actually got a through joine, should be working.")
                            return resourceCollection.slice(0, 3).join(", ") + "...";
                            break;
                        default:
                            return ''
                    }
                }
            }))
            if (temporalFilterChoice === 'other_column') {
                // Here, we have to go through each row, replacing the targetColName from
                // { 'datesCollection': datesCollection, 'resourceCollection': resourceCollection }
                // to the item in resourceCollection corresponding to the closest date to the inferred date column
                return _.map(joinedData, function(row) {
                    // Really need to add some error handling here
                    let inferredDateString = row[inferDateAttribute];
                    let closestToDate = moment(inferredDateString).format();
                    // console.log("row is ", row)
                    console.log("inferred date string was ", inferredDateString);
                    if (row[targetColumnName] && row[targetColumnName].resourceCollection) {
                        row[targetColumnName] = getClosestToDate(row[targetColumnName].resourceCollection, closestToDate, row[targetColumnName].datesCollection)
                    }
                    return row;
                });
            }
            return joinedData;
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
    console.log("rawData[0] is ", rawData[0])
    console.log("targetData is ", targetData)
    console.log("HEY! targetColName is ", targetColName)
    console.log("in joinColumn, targetData length is ", targetData.length, " and rawData length is ", rawData.length)
    for (let i=0; i<targetData.length; i++) {
        rawData[i][targetColName] = targetData[i];
    }
    console.log("and after join, rawData[0] is ", rawData[0])
    return rawData;
}
module.exports = { materializeJoin, materializeJoinString, materializeJoinNumber, materializeJoinCollectionString, materializeJoinCollectionNumber, getRelatedLiteralColumn };