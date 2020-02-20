const createHerald = require("./createHerald.js");
const deleteHerald = require("./deleteHerald.js");
const readHerald = require("./readHerald.js");

module.exports.set = function(session, socket) {
  // for dev purpose, maybe removed later
  socket.on("getAllHeraldsRequest", () => {
    let heraldsMap = session.getHeraldsMap();
    let heraldIds = Array.from(heraldsMap.keys());
    socket.emit("getAllHeraldsResponse", heraldIds);
  });
  //

  socket.on("createHeraldRequest", () => {
    console.log("CREATE HERALD REQUEST");
    let heraldId = createHerald(session);
    console.log("NUMBER OF HERALDS AFTER CREATION", session.getHeraldsMap().size);
    socket.emit("createHeraldResponse", heraldId);
  });

  socket.on("deleteHeraldRequest", heraldIdSelected => {
    // console.log("deleteHeraldRequest received:", heraldIdSelected);
    deleteHerald(session, heraldIdSelected);
    socket.emit("deleteHeraldResponse", heraldIdSelected);
  });

  socket.on("readHeraldRequest", heraldIdSelected => {
    console.log("readHeraldRequest received:", heraldIdSelected);
    let heraldObj = readHerald(session, heraldIdSelected);
    socket.emit("readHeraldResponse", heraldObj);
  });
};
