function mapToImageUrl(url) {
  if (url.startsWith("/input")) return url;
  let splitUrl = url.split("/");
  let i = splitUrl.indexOf("local_testing_data");
  let out_url = "/input/" + splitUrl.slice(i + 1, splitUrl.length).join("/");
  return out_url;
}

module.exports = mapToImageUrl;
