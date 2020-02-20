/* qidServices.js
 * Author: Dylan Cashman
 * This script contains functions for converting raw data into QIDs.  There are a few different ways to do this:
 * SPARQL, and then various external services.
 * Broken out into a separte file so that it is easier to test it.
 */

const rp = require("request-promise");
const path = require("path");
const _ = require("lodash");
const wikiSearch = require("./wikiSearch.js");
const config = require("./config.js");
const WIKIDATA_ENDPOINT_URI = config.sparqlEndpoint;
const wikidataBlacklist = require("./wikidataBlacklist.json");
const wikidataBlacklistSet = new Set(wikidataBlacklist);
const WIKIMEDIA_RATE_LIMIT = 50; // Wikimedia restricts us to 200 queries per second.  No easy way to control that, so we set a concurrency limit with bluebird.
const Promise = require("bluebird");
const debounce = require("debounce-promise");
const Bottleneck = require("bottleneck");
let qidCache = {};

//https://www.w3.org/TR/rdf-sparql-query/#operandDataTypes
const INTEGER_LITERALS = [
  "http://www.w3.org/2001/XMLSchema#integer",
  "http://www.w3.org/2001/XMLSchema#nonPositiveInteger",
  "http://www.w3.org/2001/XMLSchema#negativeInteger",
  "http://www.w3.org/2001/XMLSchema#int",
  "http://www.w3.org/2001/XMLSchema#nonNegativeInteger",
  "http://www.w3.org/2001/XMLSchema#unsignedInt",
  "http://www.w3.org/2001/XMLSchema#positiveInteger"
];

const REAL_LITERALS = [
  "http://www.w3.org/2001/XMLSchema#decimal",
  "http://www.w3.org/2001/XMLSchema#float",
  "http://www.w3.org/2001/XMLSchema#double",
  "http://www.w3.org/2001/XMLSchema#long",
  "http://www.w3.org/2001/XMLSchema#short",
  "http://www.w3.org/2001/XMLSchema#unsignedLong",
  "http://www.w3.org/2001/XMLSchema#unsignedShort"
];
const DATE_TIME_LITERALS = ["http://www.w3.org/2001/XMLSchema#dateTime"];

const NUMBER_LITERALS = INTEGER_LITERALS + REAL_LITERALS;

let headerTypes = {};

function getHeaderTypes(attributesInCurrentDataTable=null) {
  if (attributesInCurrentDataTable){
    let newHeaderTypes = { };
    attributesInCurrentDataTable.forEach((attr) => {
      try {
        let name = attr.value.name;
        newHeaderTypes[attr.key] = headerTypes[name];
      } catch(e) {
        newHeaderTypes[attr.key] = headerTypes[attr.key];
      }
    });
    return newHeaderTypes;
  }
  return headerTypes;
}

function setHeaderTypes(header, val) {
  headerTypes[header] = val;
}
// const language = "en";

/*
convertHeaderToQID

Takes in a column name and spits back the QID representing that entity type.

To do this, it grabs a set number of values of that column (default 5)
It runs SPARQL queries to get the entity type of each value.
Then, it checks to see which is the most common between them.
If there's a tie, it searches the description of the entity types for the column Name.
It returns the first match, and if there are no matches, just returns the first one.
*/
function convertHeaderToQID(rawData, columnName) {
  let COLUMN_MAPPINGS = {
    Player: "Q10871364"
  };

  const columnId = COLUMN_MAPPINGS[columnName];

  return columnId;
}

function parseValType(data) {
  return data.map((d,i) => {
    const isCollection = d["count"] && d["count"]["value"] > 1;
 
    let valTypeValue = d["valType"] ? d["valType"]["value"] : "NONE";
    const isInt = _.includes(
      INTEGER_LITERALS,
      valTypeValue
    );

    const isDateTime = _.includes(
      DATE_TIME_LITERALS,
      valTypeValue
    );
    const isReal = _.includes(
      REAL_LITERALS,
      valTypeValue
    );

    const isNumber = isInt || isReal;
    if (isCollection) {
      if (isNumber) {
        d["valueType"] = "join-collection-number";
      } else {
        d["valueType"] = "join-collection-string";
      }
    } else {
      if (isInt) {
        headerTypes[d["wdLabel"]["value"]] = "integer";
      }
      if (isReal) {
        headerTypes[d["wdLabel"]["value"]] = "real";
      }
      if (isDateTime) {
        headerTypes[d["wdLabel"]["value"]] = "datetime";
      }

      if (isNumber) {
        d["valueType"] = "join-number";
      } else {
        d["valueType"] = "join-string";
      }
    }
    return d;
  });
}

/* NOTE: eventually, we want to filter out all the external identifiers, so that we only get 
 * the right kind of data.  I don't know if we can count on doing that with ISI's wikidata, though, if the
 * metadata won't be there.  We can probably just put in an optional filter.
 * Here's an example of getting the wikibase data type that we can filter on:
 * 
 * #Properties grouped by their Wikibase datatype (Q19798645) with number of properties
    #Properties grouped by their type with number of properties
    # SELECT (COUNT(?property) as ?pcount ) ?wbtype WHERE {
    #   ?property rdf:type               wikibase:Property.
    #   ?property wikibase:propertyType  ?wbtype.
    #   SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    # }
    # GROUP BY ?wbtype
    # ORDER BY DESC(?pcount)
 */

function singleGetRelatedAttributes(entityId) {
  let query = `SELECT (COUNT(?wdLabel) AS ?count) ?wdLabel ?p (datatype(sample(?statement)) as ?valType)  WHERE {
        VALUES (?entity) {(wd:${entityId})}

        ?entity ?p ?statement .

        ?wd wikibase:directClaim ?p.

        OPTIONAL {
        ?statement ?pq ?pq_ .
        ?wdpq wikibase:qualifier ?pq .
        }
        ?wd wikibase:propertyType ?externalId .
        FILTER( ?externalId != wikibase:ExternalId ) 
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
GROUP BY ?wdLabel ?p 
`;
  // Some cleaning
  const regex = /\n/gi;
  query = query.replace(regex, "");
  const headers = { "User-Agent": "d3m_tuftsgtwisc" };

  // console.log("SENDING QUERY TO ENDPOINT ", WIKIDATA_ENDPOINT_URI)
  return rp({
    uri: WIKIDATA_ENDPOINT_URI,
    method: "GET",
    json: true,
    headers: headers,
    qs: {
      query: query
    }
  }).then(response => {
    if (response && response["results"] && response["results"]["bindings"]) {
      let returnedData = removeBlacklist(response["results"]["bindings"]);
      returnedData = parseValType(returnedData);
      return returnedData;
    } else {
      return [];
    }
  });
}

function removeBlacklist(collection) {
  return _.reject(collection, c =>
    wikidataBlacklistSet.has(c["wdLabel"] && c["wdLabel"]["value"])
  );
}

/*
# Converting to QIDs

Takes in a dataset, a column, and its column QID.  Returns a set of promises that resolve to QIDs for that
column.

This is actually a really complex pair of functions, it needs to map from various string formats to QIDs.  
This is a very difficult task, because the strings might be oddly formatted.
It is a many-to-many mapping because of ambiguous spellings/formatting and multiple meanings (The Godfather is a movie, videogame, and novel)
"Burundi" => "Q967"
"Hank Aaron" => "Q215777"
"HANK_AARON" => "Q215777"
"The Godfather" => "Q47703"
"The Godfather" => "Q1139696"
"The Godfather" => "Q243556"

We will want to use an external service for this.  The question is, are we going to build it, or is there something
already available.  ISI has a few API endpoints we may be able to use.  One is a "wikifier", which takes in a CSV
and tries to map it to entities.  

We also have to figure out what the column QID is.  So we should do this at the same time.
Here's a working algorithm, albeit slow.

- wikisearch each value in a column.  Store all possible results.
- For each row, look for the one that has the name of the column (downcased) in its description.  So "Player" is the column name, American football player is in the description. 
- If there is no match, choose the first.
- Take some subset of those (5-10), look up the instance of relationships.  Find the most common one.  
- Also use the "Player" trick to differentiate between common relationships.  So "Quarterback" and "Football Player" should have the same thing.

This also returns the best guess at what the column header is.

*/

function convertColumnToQIDs(
  rawData,
  columnName,
  numSampled = 10,
  useCache = true
) {
  if (
    useCache &&
    qidCache[columnName] &&
    qidCache[columnName]["" + numSampled]
  ) {
    console.log(
      " QID CACHE HIT FOR COLUMN NAME ",
      columnName,
      " and numSampled ",
      numSampled
    );
    return Promise.resolve(qidCache[columnName]["" + numSampled]);
  }
  console.log(
    " QID CACHE MISS FOR COLUMN NAME ",
    columnName,
    " and numSampled ",
    numSampled
  );
  // Randomly sample cells if numSampled is > 0 (rows)
  if (numSampled < 0 || numSampled > rawData.length) {
    numSampled = rawData.length;
  }

  console.log("numSampled in convert column is ", numSampled);

  let sampledValues = [];
  for (let i = 0; i < numSampled; i++) {
    sampledValues.push(rawData[i][columnName]);
  }
  // Convert them to potential QID
  // NOTE - we need to make sure we aren't violating the rate limit, which I believe is 200 per second.
  // So let's do just 150 per second, using the debounce function, which delays function invocation until a certain amount of time has passed.
  // Basically, we batch them into groups of 150, then kick off each group every second.  Wrap it in a promise, return the promise.
  // call once every 1000ms

  let valueGroups = reshape(sampledValues, WIKIMEDIA_RATE_LIMIT);
  // console.log("How many valueGroups are there?  ", valueGroups.length, " and how many in first group? ", valueGroups[0].length, " and last group? ", valueGroups[valueGroups.length - 1].length)
  let mapToQids = function(vals) {
    console.log("RUNNING MAP TO QIDS, time is ", Date.now());
    return Promise.map(vals, v => convertToPotentialQID(v)).catch(e => {
      console.log("bluebird error, ", e);
    });
  };

  // let potentialQIDs = Promise.map(sampledValues, (v) => convertToPotentialQID(v, columnId), { concurrency: RATE_LIMIT } );
  // let potentialQIDs = Promise.all(sampledValues.map((v) => convertToPotentialQID(v, columnId)));

  // console.log("sampledValues are ", sampledValues)

  // var debouncedMapToQids = debounce(mapToQids, 1000, {leading: true});

  // Using bottleneck library
  const limiter = new Bottleneck({
    minTime: 1000 // 200 requests per second
  });
  var rateLimitedMapToQids = limiter.wrap(mapToQids);

  // Try to pick a single QID for each one.
  return Promise.all(
    valueGroups.map(vg => {
      // console.log("running a debounced map to QIDs")
      // return debouncedMapToQids(vg);
      return rateLimitedMapToQids(vg);
    })
  ).then(
    qidGroups => {
      let qidLists = _.flatten(qidGroups);
      // console.log("qidLists are ", qidLists)
      console.log("qidLists[0] is ", qidLists[0]);
      console.log("qidLists length is ", qidLists.length);
      let chosenQIDs = qidLists.map(qidObjList => {
        let matchedDescriptions = _.filter(qidObjList, qidObj => {
          const description = qidObj["description"];
          return _.includes(_.lowerCase(description), _.lowerCase(columnName));
        });
        let returnedQIDObj = matchedDescriptions[0] || qidObjList[0];

        return returnedQIDObj && returnedQIDObj["id"];
      });

      // Then, pick 5 of the chosen QIDs, look up their properties, and take the most common one.
      qidCache[columnName] = qidCache[columnName] || {};
      qidCache[columnName]["" + numSampled] = chosenQIDs;
      return chosenQIDs;
    },
    rejectionEvent => {
      console.log("promise was rejected, event was ", rejectionEvent);
    }
  );
}

// https://stackoverflow.com/a/19178956/540675
function reshape(array, n) {
  return _.compact(
    array.map(function(el, i) {
      if (i % n === 0) {
        return array.slice(i, i + n);
      }
    })
  );
}

// Huh, for now we don't even use ColumnID.  So maybe we're pretty good here...
function convertToPotentialQID(entityName, maxRetries = 1, columnId = null) {
  // Maybe we can do this with wikiSearch.js, or we can do this via SPARQL...  Should benchmark to see what is faster
  // That would mean breaking out into different files, so that we can run tests on them...  We'll see.
  // For now, we'll use wikiSearch.js, and we'll just try the regular format before some variants.
  // Note, this doesn't solve the issue with multiple versions of The Godfather.
  // console.log("wikisearching entity name ", entityName, " and time is ", Date.now())

  return wikiSearch(entityName).then(
    qid => {
      if (qid) {
        return qid;
      } else {
        const sepRegex = /[-_]/gi;
        // qid = wikiSearch(entityName.replace(sepRegex, ' ').toLowerCase().split(' ').forEach((s) => )
        // Searches but replaces - and _ with spaces.
        return wikiSearch(entityName.replace(sepRegex, " "));
      }
    },
    error => {
      console.log("error on wikisearch, ", error);
      if (maxRetries > 0) {
        return convertToPotentialQID(entityName, maxRetries - 1);
      } else {
        return Promise.resolve("");
      }
    }
  );
}

module.exports = {
  singleGetRelatedAttributes,
  convertColumnToQIDs,
  convertToPotentialQID,
  convertHeaderToQID,
  getHeaderTypes,
  setHeaderTypes
};
