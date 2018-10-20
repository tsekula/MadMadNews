var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var pos = require('pos');
var request = require('request');
var nytBooks = require('./nytbooks');
var nlpfunctions = require('./nlptools/getNLP.js');
var headlinefunctions = require('./getHeadlines.js');
var taggedHeadline = Object;

var tagger = new pos.Tagger();
var nytBooks;
var words;

GetTagsForHeadline(headlinefunctions.getRandomHeadline(1));

// Return a headline record with POSTags inserted 
function GetTagsForHeadline(headline){
  for (record in headline) {
    nlpfunctions.getPOSTags(headline[record], function(body, err) {
      if (err) return(err);
      if (body){
        //taggedHeadline.
        console.log(body);
      }
      else
        return(err);  // is an error sent?
    })
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
