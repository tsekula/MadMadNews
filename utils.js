// take input string and return string with all contractions replaced
exports.replaceContractionsInSentence = function (text) {
    var updatedText = text;
    var contractions={
        "'ll": " will",
        "'re": " are",
        "'ve": " have",
        "n't": " not"
        };
    
    for (var key in contractions) {
        updatedText = updatedText.replace(key, contractions[key]);
    }
    
    return updatedText;
};

exports.getTagsInText = function(text) {
    var myRe = /\{{2}[A-Za-z]*\}{2}/g;
    var myArray;
    var tagsArray = [];
    
    while ((myArray = myRe.exec(text)) !== null) {
        tagsArray.push(myArray[0].replace("{{","").replace("}}",""));
    }    
    
    return tagsArray;
};

exports.replaceTroublesomeCharacters = function (text){
    if (text.length==0)
        return null;
        
    var badchars = ["\‘", "\’", "``"];
    var replacements = ["\'", "\'", "\""];

        // handle the ’ in cases of modals and possessives
        var index = text.indexOf("\’");

        while (index > -1) {
            if (['s', 'l', 't'].indexOf(text[index+1]) >-1 ) {   // it's part of a modal or possessive
                text = text.substr(0,index) + '\'' + text.substr(index+1);;     // set to single quote
            } else {
                text = text.substr(0,index) + '\"' + text.substr(index+1);;     // set to double quote
            }
            index = text.indexOf("\’", index);
        }

        // handle the ‘ in cases of quotations
        text = text.replace("\‘", "\"");

    return text;
};