const grpc = require("grpc");
const props = require("../props");

function connect(ta2_url) {
  console.log("Connect to:" + ta2_url);
  let proto = props.proto;
  client = new proto.Core(ta2_url, grpc.credentials.createInsecure());
  props.client = client;
}

module.exports = connect;
