const grpc = require("grpc");
const proto = require("../proto.js");

function connect(herald) {
  let ta2_port = herald.getPort();
  console.log("Connect to " + ta2_port);
  let client = new proto.Core(ta2_port, grpc.credentials.createInsecure());
  herald.setClient(client);
}

module.exports = connect;
