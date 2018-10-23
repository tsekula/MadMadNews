var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var pos = require('pos');
var request = require('request');
var nytBooks = require('./nytbooks');
var nlpfunctions = require('./nlptools/getNLP.js');
var headlinefunctions = require('./getHeadlines.js');
var utils = require('./utils.js');
var taggedHeadline = Object;

var tagger = new pos.Tagger();
var nytBooks;
var words;

// for chosen type, get headlines in

//for (i=0; i<3;i++){
  //console.log(utils.replaceContractionsInSentence("This is my sentence isn't it grand?  I should've done better but we'll try again later."));
//  nlpfunctions.getJSONPOSTags("This is my sentence isn't it grand?  I should've done better but we'll try again later.", function(body) {
//      console.log(body);
//    });

//}


GetTagsForHeadline(headlinefunctions.getRandomHeadline(1), function(body) {
  if(!body) {
    return console.log("empty");
  }
  return console.log(body);
});


// Return a headline record with POSTags inserted 
function GetTagsForHeadline(headline, callback){
  if (!headline) {
    return callback(null);
  }
  
  for (record in headline) {
    nlpfunctions.getJSONPOSTags(headline[record], function(body) {
      if (!body){
        return callback(null);
      }
      return callback(body);
    });
  }
}


// test to retrieve a single list of books then call getBooks
//request.get({
//  url: "https://api.nytimes.com/svc/books/v3/lists/best-sellers/history.json",
//  qs: {
//    'api-key': "4652552890064bc788ec90a4d5ff1048"
//  }
//}, getBooks);



// for each returned book get POS info
function getBooks(err, response, body) {
  nytBooks = JSON.parse(body);
  var i;
  for (i=0;i < nytBooks["results"].length; i++) {
        console.log("## " + nytBooks["results"][i]["title"] + " ###");
        //console.log(nytBooks["results"][i]["description"]);

        // return nouns, verbs, adjectives, adverbs, etc. for each title
        wordpos.getPOS(nytBooks["results"][i]["title"], console.log);


          if (nytBooks["results"][i]["description"]) {
            words = new pos.Lexer().lex(nytBooks["results"][i]["description"]);
            var taggedWords = tagger.tag(words);

            // print description of a book
            //console.log('######## DESCRIPTION: ######## ' + nytBooks["results"][i]["description"] + '########');

            for (j in taggedWords) {
              var taggedWord = taggedWords[j];
              var word = taggedWord[0];
              var tag = taggedWord[1];
              //console.log(word + " /" + tag);            
          }

        }
  }
}
