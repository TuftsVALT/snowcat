// Author: Cong Liu

// const rp = require("request-promise-native");
const rp = require("request-promise");
const apiHost = "www.wikidata.org";
const apiPath = "/w/api.php";
const searchAction = "wbsearchentities";
const language = "en";
const limit = 7;
const type = "item";

function wikiSearch(keyWord) {
  const prefix = apiHost + apiPath + "?action=" + searchAction + "&format=json";
  const middle = "&language=" + language + "&type=" + type + "&limit=" + limit;
  const suffix = "&search=" + encodeURIComponent(keyWord);
  const combinedUri = "https://" + prefix + middle + suffix;

  const requestOptions = {
    uri: combinedUri,
    method: "GET",
    json: true
  };
  // console.log("got to this point of wikisearch, before the request has gone out")
  // let res = rp(requestOptions)
  return rp(requestOptions)
    .then(function(response) {
      let results = response["search"];
      let id = "";
    //   for (let i = 0; i < results.length; i++) {
    //     let result = results[i];
    //     console.log(result);
    //     let description = result["description"];
    //     console.log("description", description);
    //     if (description && description.includes(keyWord)) {
    //       id = result["id"];
    //       console.log("description", description);
    //       break;
    //     }
    //   }
      // console.log("results[0] are ", results[0])
      // id = results[0] && results[0]['id']
      // return id
      return results;
    })
    .catch(function (err) {
      console.log("wikisearch got an error, err was ", err)
    });
    // return res;
}

module.exports = wikiSearch;
