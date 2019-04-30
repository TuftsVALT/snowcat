const VERSION = "2019.4.11"; // ta3-ta2-api version

const grpc = require("grpc");
const APP_ROOT_PATH = require("app-root-path");

const CONFIG_FILENAME = "tufts_gt_wisc_configuration.json";
const PROTO_PATH = APP_ROOT_PATH + "/lib/js/protos/v" + VERSION + "/core.proto";
const CONFIG_PATH = APP_ROOT_PATH + "/" + CONFIG_FILENAME;

// centralize all properties/variables
const props = {
  //   dynamic
  client: null,

  sessionVar: {
    search_id: "",
    ta2Ident: null,
    connected: false,
    solutions: new Map(),
    //produceSolutionRequests: [],
    //solutionResults: [],
    // NIST eval plan: only ranks 1-20 are considered (lower is better)
    rankVar: 20
  },
  evaluationConfig: null,

  // static
  proto: grpc.load(PROTO_PATH),
  userAgentTA3: "TA3-TGW",
  grpcVersion: VERSION,  
  allowed_val_types: [],
  CONFIG_PATH: CONFIG_PATH,

  // create folder to store response from ta2
  isResponse: true, // true if responses folder is wanted
  RESPONSES_PATH: APP_ROOT_PATH + "/output/responses/",

  // create folder to store request to ta2
  isRequest: true, // true if requests folder is wanted
  REQUESTS_PATH: APP_ROOT_PATH + "/output/requests/"
};

module.exports = props;
