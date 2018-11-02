var storyfunctions = require('./storyfunctions.js');
var posTags = require("./pos-tags.json");
var utils = require('./utils.js');
var storyIndex, story;
var headlinePOStags;
var sourceIndex;

// set to NYT World Stories as source per headline-sources.json
sourceIndex=0;

// choose 5 spots to designate word replacement
var replacetags = [3,5,6,9, 12, 15];
// get a random story
storyIndex = storyfunctions.getRandomStoryIndex(sourceIndex);
story = storyfunctions.getStory(sourceIndex, storyIndex);
var readme = storyfunctions.getAlexaStoryFormattedForReading(story, replacetags);

var thistag = story.headlineentitytags[replacetags[0]][1];

var chosenwords = ["poop", "plop", "parp", "starp", "hohffsd", "clarp"];


console.log(storyfunctions.getAlexaFinalStory(readme, replacetags, chosenwords));

// write out the tags that need the user to provide
//var taglist = storyfunctions.getAlexaWordsForUserToReplace(story, replacetags);
//console.log(taglist);