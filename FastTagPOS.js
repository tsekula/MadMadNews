var pos = require('pos');
var words = new pos.Lexer().lex("Palestinian leaders are accused of using torture and arbitrary arrests to crush dissent");
var taggedWords = new pos.Tagger().tag(words);
for (i in taggedWords) {
    var taggedWord = taggedWords[i];
    var word = taggedWord[0];
    var tag = taggedWord[1];
    console.log(word + " /" + tag);
}