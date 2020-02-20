const grpc = require("grpc");
const grpcVersion = require("./config.js").grpcVersion;
const appRootPath = require("app-root-path");
const protoPath = appRootPath + "/protos/v" + grpcVersion + "/core.proto";
const proto = grpc.load(protoPath);
module.exports = proto;
