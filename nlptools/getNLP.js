// Work on getListofTagstoReplace()

var request = require('request');
var nlpfunctions = require('./nlpfunctions.js');
var exports = module.exports = {};

const NLPAPI = "https://nlp-api-tsekula.c9users.io:8080/nlp/parse-sentences"
const DemoText = "Marine Le Pen Sharpens Attack on Emmanuel Macron in French Debate. The two presidential hopefuls clashed over immigration, integration and France’s role in the world.  It was about bringing the player to the game."

//getPOSTags(DemoText, processString);


exports.processString = function (tags){
  var replacetags = getListofTagstoReplace(tags);
}

var getListofTagstoReplace = function (tags) {
  // iterate through object and return object containing only allowed tags

  for (key in tags["sentences"]){
    var sentence = tags["sentences"][key];
    
    sentence["modified"] = sentence["original"];
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
  console.log(tags);
}

var isChosenForReplacement = function() {
  // perform dice roll to determine if this is a word that will be replaced
  if (Math.random()<=0.4)
    return 1;
  else
    return 0;
}

exports.getPOSTags = function(text, callback) {
  if (text) {
      request.get({
      url: NLPAPI,
      json: {
        "text": text  }
    }, function(err, response, body) {
      if (err) callback(err);
      if (body){
        callback(body);
      }
      else
        callback(err);
    })
  }
}