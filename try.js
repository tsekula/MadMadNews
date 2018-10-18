var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var pos = require('pos');
var request = require('request');
var nytBooks = require('./nytbooks');

var tagger = new pos.Tagger();
var nytBooks;
var words;

request.get({
  url: "https://api.nytimes.com/svc/books/v3/lists/best-sellers/history.json",
  qs: {
    'api-key': "4652552890064bc788ec90a4d5ff1048"
  }
}, getBooks);

console.log(nytBooks["results"].length);

//getBooks();


function getBooks(err, response, body) {
  nytBooks = JSON.parse(body);
  var i;
  for (i=0;i < nytBooks["results"].length; i++) {
        console.log("## " + nytBooks["results"][i]["title"] + " ###");
        console.log(nytBooks["results"][i]["description"]);
        wordpos.getPOS(nytBooks["results"][i]["title"], console.log);
          if (nytBooks["results"][i]["description"]) {
            words = new pos.Lexer().lex(nytBooks["results"][i]["description"]);
            var taggedWords = tagger.tag(words);
            console.log('########' + nytBooks["results"][i]["description"] + '########');
            for (j in taggedWords) {
              var taggedWord = taggedWords[j];
              var word = taggedWord[0];
              var tag = taggedWord[1];
              console.log(word + " /" + tag);            
          }

        }
  }
}
