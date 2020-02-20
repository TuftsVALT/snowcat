const handleUrl = require("./handleUrl");
const mapToImageUrl = require("./mapToImageUrl");

function handleImageUrl(url) {
  return mapToImageUrl(handleUrl(url));
}

module.exports = handleImageUrl;
