class Herald {
  constructor(id, devSolutions = null) {
    // to be private, getters and setters
    console.log("New herald created", id);
    this.id = id; // new
    this.devSolutions = devSolutions;
    this.dataset = null;
    this.problem = null;
    this.client = null;
    this.port = "localhost:50054"; //"localhost:50054"; // port for ta2
    this.solutions = new Map();

    this.datasetUri = null;

    // not to be private
    this.isConnected = false;
    this.ta2Ident = null; // string
    this.search_id = null; // {}
    this.rankVar = 20;

    this.searchEnded = null; //true

    this.isRequest = true;
    this.isResponse = true;
    this.REQUESTS_PATH = null; //""
    this.RESPONSES_PATH = null; //""
  }

  getId() {
    return this.id;
  }

  // getters
  getDataset() {
    return this.dataset;
  }

  getProblem() {
    return this.problem;
  }

  getClient() {
    return this.client;
  }

  getPort() {
    return this.port;
  }

  getSolutions() {
    return this.solutions;
  }

  getDatasetUri() {
    return this.datasetUri;
  }

  // setters
  // setId(id) {
  //   this.id = id;
  // }
  setDataset(dataset) {
    this.dataset = dataset;
  }

  setProblem(problem) {
    this.problem = problem;
  }

  setClient(client) {
    this.client = client;
  }

  setPort(port) {
    this.port = port;
  }

  setSolutions(solutions) {
    this.solutions = solutions;
  }

  setDatasetUri(datasetUri) {
    this.datasetUri = datasetUri;
  }
}

module.exports = Herald;

//   constructor() {
//     this.session = null;
//     // properties
//     this. = {
//       //   dynamic
//       client: null,

//       : {
//         search_id: "",
//         ta2Ident: null,
//         connected: false,
//         solutions: new Map(),
//         //produceSolutionRequests: [],
//         //solutionResults: [],
//         // NIST eval plan: only ranks 1-20 are considered (lower is better)
//         rankVar: 20
//       },
//

//       // static
//       proto: proto,
//       userAgentTA3: "TA3-TGW",
//       grpcVersion: grpcVersion,
//       allowed_val_types: [],
//       // CONFIG_PATH: CONFIG_PATH,

//       // create folder to store response from ta2
//      isResponse: true, // true if responses folder is wanted
//       RESPONSES_PATH: APP_ROOT_PATH + "/output/responses/",

//       // create folder to store request to ta2
//      isRequest: true, // true if requests folder is wanted
//       REQUESTS_PATH: APP_ROOT_PATH + "/output/requests/"
//     };
