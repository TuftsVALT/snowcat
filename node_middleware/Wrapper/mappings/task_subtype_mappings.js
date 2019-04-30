const props = require("../props");
const proto = props.proto;

const task_subtype_mappings = {
  undefined: proto.TaskSubtype.TASK_SUBTYPE_UNDEFINED,
  none: proto.TaskSubtype.NONE,
  binary: proto.TaskSubtype.BINARY,
  multiClass: proto.TaskSubtype.MULTICLASS,
  multiLabel: proto.TaskSubtype.MULTILABEL,
  univariate: proto.TaskSubtype.UNIVARIATE,
  multivariate: proto.TaskSubtype.MULTIVARIATE,
  overlapping: proto.TaskSubtype.OVERLAPPING,
  nonoverlapping: proto.TaskSubtype.NONOVERLAPPING
};

module.exports = task_subtype_mappings;
