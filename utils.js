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
