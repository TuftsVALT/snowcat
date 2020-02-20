const task0 = require("./task0");
const task1 = require("./task1");
const task2 = require("./task2");

module.exports.set = function(session, socket) {
  task0.set(session, socket);
  task1.set(session, socket);
  task2.set(session, socket);
};
