// take input string and return string with all contractions replaced
exports.replaceContractionsInSentence = function (text) {
    var updatedText = text;
    var contractions={
        "'ll": " will",
        "'re": " are",
        "'ve": " have",
        "n't": " not"
        };
    
    for (key in contractions) {
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
}