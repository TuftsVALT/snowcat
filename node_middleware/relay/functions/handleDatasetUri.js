function handleDatasetUri(uri) {
  let index = 0;
  if (uri.includes("input")) {
    index = uri.lastIndexOf("input");
  } else if (uri.includes("output")) {
    index = uri.lastIndexOf("output");
  }
  let out_uri = "file:///" + uri.substring(index);
  return out_uri;
}

module.exports = handleDatasetUri;
