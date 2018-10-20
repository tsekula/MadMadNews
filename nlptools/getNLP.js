// Work on getListofTagstoReplace()

var request = require('request');
var nlpfunctions = require('./nlpfunctions.js');
var exports = module.exports = {};
const NLPAPI = "https://nlp-api-tsekula.c9users.io:8080/nlp/parse-sentences"

exports.processString = function (tags, callback){
  var replacetags = getListofTagstoReplace(tags);
  callback(replacetags);
  //console.log(replacetags);
}

exports.processString = function (tags, callback){
  var replacetags = getListofTagstoReplace(tags);
  callback(replacetags);
  //console.log(replacetags);
}

// For given text return the same text but with randomly chosen words replaced with their POS tag
function getListofTagstoReplace(tags) {

  for (key in tags["sentences"]){
    var sentence = tags["sentences"][key];
    
    sentence["modified"] = sentence["original"];
    // iterate through object and return object containing only allowed tags
    sentence["restricted"] = nlpfunctions.PreserveWhitelist(sentence["original"]);
    //console.log(sentence["original"]);

    for (wordkey in sentence["words"]){
      var word= sentence["words"][wordkey];

      // if this tag is on the blocklist,
      //  and word is not on the block list
      //   and whitelist words are preserved
      if(nlpfunctions.IsTagAllowed(word.tag) && !nlpfunctions.IsTextIgnored(word.text) && sentence["restricted"].indexOf(word.text)>-1 && isChosenForReplacement()){
        sentence["modified"] = sentence["modified"].replace(word.text, "{{" + word.tag + "}}");
        //console.log(word.text + " - " + word.tag);
      }
    }
    delete sentence["restricted"];
    
  }
  //console.log(tags);
  return tags;
}

var isChosenForReplacement = function() {
  // perform dice roll to determine if this is a word that will be replaced
  if (Math.random()<=0.4)
    return 1;
  else
    return 0;
}

// For given text return POS tags
exports.getPOSTags = function(text, callback) {
  if (text) {
      request.get({
      url: NLPAPI,
      json: {
        "text": text  }
    }, function(err, response, body) {
      if (err) return (err);
      if (body){
        var tags = getListofTagstoReplace(body);
        callback(tags);
      }
      else
        return (err);
    })
  }
}