const props = require("../props");
const proto = props.proto;

const metric_mappings = {
  undefined: proto.PerformanceMetric.METRIC_UNDEFINED,
  accuracy: proto.PerformanceMetric.ACCURACY,
  recall: proto.PerformanceMetric.RECALL,
  f1: proto.PerformanceMetric.F1,
  f1Micro: proto.PerformanceMetric.F1_MICRO,
  f1Macro: proto.PerformanceMetric.F1_MACRO,
  rocAuc: proto.PerformanceMetric.ROC_AUC,
  rocAucMicro: proto.PerformanceMetric.ROC_AUC_MICRO,
  rocAucMacro: proto.PerformanceMetric.ROC_AUC_MACRO,
  meanSquaredError: proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR, //TODO - double check if we are supposed to support both these or just one - our proto file has only RMSE, not MSE
  rootMeanSquaredError: proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR,
  rootMeanSquareErrorAvg: proto.PerformanceMetric.ROOT_MEAN_SQUARED_ERROR_AVG,
  meanAbsoluteError: proto.PerformanceMetric.MEAN_ABSOLUTE_ERROR,
  rSquared: proto.PerformanceMetric.R_SQUARED,
  normalizedMutualInformation:
    proto.PerformanceMetric.NORMALIZED_MUTUAL_INFORMATION,
  jaccardSimilarityScore: proto.PerformanceMetric.JACCARD_SIMILARITY_SCORE,
  precisionAtTopK: proto.PerformanceMetric.PRECISION_AT_TOP_K,
  objectDetectionAveragePrecision:
    proto.PerformanceMetric.OBJECT_DETECTION_AVERAGE_PRECISION,
  loss: proto.PerformanceMetric.LOSS
};

module.exports = metric_mappings;
