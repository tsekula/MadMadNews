var pos = require('pos');
var words = new pos.Lexer().lex('A compilation of interesting information on subjects ranging from Zeus to Zuckerberg.');
var tagger = new pos.Tagger();
var taggedWords = tagger.tag(words);

//tagger.extendLexicon({'Sekula': ['NNP']});
//tagger.extendLexicon({'Zuckerberg': ['NNP']});
console.log(taggedWords);

for (i in taggedWords) {
    var taggedWord = taggedWords[i];
    var word = taggedWord[0];
    var tag = taggedWord[1];
    //console.log(word + " /" + tag);
}

