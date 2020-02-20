function mapToImageUrl(url) {
  if (url.startsWith("/input")) {
    return url;
  } else {
    let splitUrl = url.split("/");
    // let i = splitUrl.indexOf("local_testing_data");
    let i = splitUrl.indexOf("input");
    let out_url = "/input/" + splitUrl.slice(i + 1, splitUrl.length).join("/");
    return out_url;

  // let index = 0;
  // if (url.includes("input")) {
  //   index = url.lastIndexOf("input");
  // } else if (url.includes("output")) {
  //   index = url.lastIndexOf("output");
  // }
  // let out_url = url.substring(index);
  // return out_url
  }
}

module.exports = mapToImageUrl;
