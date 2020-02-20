const _ = require("lodash");
const appRoot = require('app-root-path');

function handleUrl(url) {
  if (_.startsWith(url, "/") || _.startsWith(url, "./")) {
    return url;
  } else {
    // return "../../../../" + url;
    return appRoot+"/"+url;
  }
}

module.exports = handleUrl;
