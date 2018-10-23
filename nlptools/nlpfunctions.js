var blacklist = require("./blocklists.json");
var exports = module.exports = {};
var whitelistPOSTags, blacklistText, whitelistKeyThemes;
if (blacklist.include_POS_tags) 
    whitelistPOSTags = blacklist.include_POS_tags.split(",");
if (blacklist.exclude_words) 
    blacklistText = blacklist.exclude_words.split(",");
if (blacklist.include_keywords) 
    whitelistKeyThemes = blacklist.include_keywords.split(",");

exports.IsTagAllowed = function (tag){
    if (whitelistPOSTags && tag){
        return whitelistPOSTags.indexOf(tag) > -1;
    }
}

exports.IsTextIgnored = function (text){
    if (blacklistText && text){
        if (blacklistText.indexOf(text) > -1 || text.length<3)
            return 1;
    }
}

exports.PreserveWhitelist = function (text){
    if (whitelistKeyThemes && text){
        var cleanedText=text;
        // walk through all themes and remove them from the text
        for (item in whitelistKeyThemes){
            cleanedText = cleanedText.replace(whitelistKeyThemes[item].trim(),"");
        }
        return cleanedText;
    }
}