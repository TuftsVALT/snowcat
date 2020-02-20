const proto = require("../proto.js");
const method_mappings = {
  undefined: proto.EvaluationMethod.EVALUATION_METHOD_UNDEFINED,
  holdOut: proto.EvaluationMethod.HOLDOUT,
  kFold: proto.EvaluationMethod.K_FOLD,
  ranking: proto.EvaluationMethod.RANKING,
  leaveOneOut: proto.EvaluationMethod.LEAVE_ONE_OUT,
  prediction: proto.EvaluationMethod.PREDICTION,
  traingData: proto.EvaluationMethod.TRAINING_DATA
};
module.exports = method_mappings;
