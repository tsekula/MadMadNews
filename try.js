var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var pos = require('pos');
var request = require('request');
var nytBooks = require('./nytbooks');
var nlpfunctions = require('./nlptools/getNLP.js');
var headlinefunctions = require('./getHeadlines.js');


var tagger = new pos.Tagger();
var nytBooks;
var words;

GetTagsForEachHeadline();

function GetTagsForEachHeadline(){
  // load NYT headlines from file
  headlinefunctions.refreshHeadlines();
  // for each headline get the replacement version



  //nlpfunctions.getPOSTags("This should be a pretty sweet way to go about things, right President Trump and Prime Minister Trudeau?  I really think that we should change our shoes when we get home.", nlpfunctions.processString);

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
