const props = require("../props");
const proto = props.proto;

const task_type_mappings = {
  undefined: proto.TaskType.TASK_TYPE_UNDEFINED,
  classification: proto.TaskType.CLASSIFICATION,
  regression: proto.TaskType.REGRESSION,
  clustering: proto.TaskType.CLUSTERING,
  linkPrediction: proto.TaskType.LINK_PREDICTION,
  vertexNomination: proto.TaskType.VERTEX_NOMINATION,
  communityDetection: proto.TaskType.COMMUNITY_DETECTION,
  graphClustering: proto.TaskType.GRAPH_CLUSTERING,
  graphMatching: proto.TaskType.GRAPH_MATCHING,
  timeSeriesForecasting: proto.TaskType.TIME_SERIES_FORECASTING,
  collaborativeFiltering: proto.TaskType.COLLABORATIVE_FILTERING,
  objectDectection: proto.TaskType.OBJECT_DETECTION
};

module.exports = task_type_mappings;
