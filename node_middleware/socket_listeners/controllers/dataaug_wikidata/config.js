const config = {
  //  sparqlEndpoint: 'https://query.wikidata.org/bigdata/namespace/wdq/sparql/',  //Public wikidata endpoint
  //  sparqlEndpoint: 'http://dsbox02.isi.edu:8888/bigdata/namespace/wdq/sparql',  //ISI public endpoint, without ethiopia data
      sparqlEndpoint: 'http://dsbox02.isi.edu:8899/bigdata/namespace/wdq/sparql',  //ISI private endpoint, with ethiopia data, requires whitelisted IP
  //  sparqlEndpoint: 'https://www.eecs.tufts.edu/~dcashm01/'  //broken endpoint, to test against evergreen
  concurrentApiCallLimit: 5
};
  
  module.exports = config;
  