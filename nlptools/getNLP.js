// Work on getListofTagstoReplace()

var request = require('request');
var nlpfunctions = require('./nlpfunctions.js');
var exports = module.exports = {};
const NLPAPI = "https://nlp-api-tsekula.c9users.io:8080/nlp/parse-sentences"
const NLPAPITEST = "https://nlp-api-tsekula.c9users.io:8080/nlp/parse"

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
    
    // iterate through object and return object containing only allowed tags
    sentence["restricted"] = nlpfunctions.PreserveWhitelist(sentence["original"]);
    sentence["modified"] = getSingleModifiedSentence(sentence, sentence["restricted"]);
    delete sentence["restricted"];
    
  }
  return tags;
}


function getModifiedSentence(tags) {
  var modifiedSentence = "";
  for (key in tags["sentences"]){
    var sentence = tags["sentences"][key];
    
    // iterate through object and return object containing only allowed tags
    sentence["restricted"] = nlpfunctions.PreserveWhitelist(sentence["original"]);
    modifiedSentence = modifiedSentence + " " + getSingleModifiedSentence(sentence, sentence["restricted"]);

    delete sentence["restricted"];
    
  }
  return modifiedSentence;
}


function getSingleModifiedSentence(sentence, restrictedSentence) {
    var modifiedSentence = sentence["original"];
    for (wordkey in sentence["words"]){
      var word= sentence["words"][wordkey];

      // if this tag is on the blocklist,
      //  and word is not on the block list
      //   and whitelist words are preserved
      if(nlpfunctions.IsTagAllowed(word.tag) && !nlpfunctions.IsTextIgnored(word.text) && restrictedSentence.indexOf(word.text)>-1 && isChosenForReplacement()){
        modifiedSentence = modifiedSentence.replace(word.text, "{{" + word.tag + "}}");
        //console.log(word.text + " - " + word.tag);
      }
    }  
    return modifiedSentence;
}


var isChosenForReplacement = function() {
  // perform dice roll to determine if this is a word that will be replaced
  if (Math.random()<=0.4)
    return 1;
  else
    return 0;
};

// For given text return POS tags in simple text field
exports.getPOSTags = function(text, callback) {
  if (!text) {
    return callback(null);
  }
    request.get({
    url: NLPAPI,
    json: {
      "text": text  }
    }, function(err, response, body) {
      if (err) {
        console.log(err.message);
        return callback(null);
        }
      if (body){
        var newText = getModifiedSentence(body);
        return callback(newText);
      }
      else
        return callback(null);
    });
};

// For given text return POS tags in JSON
exports.getJSONPOSTags = function(text, callback) {
  if (!text) {
    return callback(null);
  }
    request.get({
    url: NLPAPI,
    json: {
      "text": text  }
    }, function(err, response, body) {
      if (err) return callback(null);
      if (body){
        //console.log(body);
        var tags = getListofTagstoReplace(body);
        return callback(tags);
      }
      else
        return callback(null);
    });
};