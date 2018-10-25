var headlinefunctions = require('./headlinefunctions.js');
var utils = require('./utils.js');
var headline;
var headlinePOStags;
var sourceIndex;

// set to NYT World Stories as source per headline-sources.json
sourceIndex=1;
// get a random headline
headline = headlinefunctions.getRandomHeadline(sourceIndex);

console.log(headline);


// get real words for each substitution spot from the user

// put the real words in place

// return the final presentation of the headlines sections with real words in place