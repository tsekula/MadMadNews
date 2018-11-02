// retrieve headlines from various web services
// and write to local file
var storySources = require("./story-sources.json");
var posTags = require("./pos-tags.json");
var request = require('request');
var fs = require("fs");
var nlpfunctions = require('./nlptools/getNLP.js');
var utils = require('./utils.js');


// details for headlines configuration JSON
const OutputFilesPath = "./headlines/";
const HeadlinesOriginalPrefix = "orig"
const OutputFilesAlteredPrefix = "mad-"
const OutputParam = "output_file";
const ResponseParams = "source_response_params";
const RequestParams = "source_request_params";
const RecordLabel = "record_label";
const RecordParams = "record_params";
const AlexaParams = "alexa_params";
const AlexaReadingParam = "reading_format";

var exports = module.exports = {};


refreshStories();
//nlpfunctions.getPOSTags("Khashoggi Killing Overshadows Saudis' Grand Economic Ambitions. Google Retreats from Berlin Plan Opposed by Local Groups. Why We Are Publishing Haunting Photos of Emaciated Yemeni Children.", function(body){ console.log(body); });
//nlpfunctions.getPOSTags("They know President Trump has vowed to block them yet they press on. \"We prefer to die on the American border than die in Honduras from hunger,\" one said.  One New Zealand lawmaker has accused another of trying to disguise a campaign contribution from a businessman with ties to the Chinese Communist Party.", function(body){ console.log(body); });


// retrieve random headline
exports.getRandomStory = function (sourceIndex) {
  var chosenRecord;

  // refresh local headline depot if out of date
    //refreshStories();
    
  // load the chosen type of headlines and choose 1 at random
    chosenRecord = pickRandomStory(sourceIndex);

    if (chosenRecord)
      return chosenRecord;
    else
      return null;
};

// retrieve random headline
exports.getRandomStoryIndex = function (sourceIndex) {
  var chosenStoryIndex;

  // refresh local headline depot if out of date
    //refreshStories();
    
  // load the chosen type of headlines and choose 1 at random
    chosenStoryIndex = pickRandomStoryIndex(sourceIndex);

    if (isNaN(chosenStoryIndex))
      return null;
    else
      return chosenStoryIndex;
};

exports.getStory = function (sourceIndex, storyIndex) {
  if (isNaN(sourceIndex) || isNaN(storyIndex)) {
    return null;
  }
    
  return getStoryByIndex (sourceIndex, storyIndex);
};

// piece together the reading format of a story
exports.getAlexaStoryFormattedForReading = function (story, chosentags){
  if (!story) {
    return null;
  }

  var headlinetext = story.headlinetext;
  var replaceindex;

  for (var t=0; t< story.headlineentitytags.length; t++) {
    if (chosentags.indexOf(t) == -1) {     // this tag should be replaced with its content
      headlinetext = headlinetext.replace("{"+t+"}", story.headlineentitytags[t][0]);
    }
  }
  return headlinetext;
};

exports.getAlexaFinalStory = function(story, replacetags, chosenwords) {
  if (story.length==0) {
    return null;
  }

  var text = story;
  for (var i=0; i<chosenwords.length;i++) {
    text = text.replace("{"+replacetags[i]+"}", chosenwords[i]);
  }
  return text;
}

exports.getAlexaWordsForUserToReplace = function (story, replacetags) {
  var taglist=[];
  for (var o of replacetags) {
      taglist.push(story.headlineentitytags[o][1]);
  }  
  return taglist;
};

// returns the description, help text, and examples for a given tag
exports.getEntityTagInfo = function (targettag) {
  for (var tagitem of posTags) {
    if (tagitem.tag == targettag) {
      return tagitem;
    }
  }
  return null;
}

// Refreshes Headlines from all external providers
function refreshStories() {
  var index = 0;
  
  (function next(index){
    if (index === storySources["sources"].length) {
        return;
    }
    //var source = storySources["sources"][index];

    getOriginalStoriesFromURL(storySources["sources"][index], function(err, source, body) {
      if (err) return err;
      if(body){
        processStoryRecords(source, body, function(){
           next(index+1);
        });

      }
      else
        return err;
    });

  })(0);
}


// retrieve data from a specified web service
function getOriginalStoriesFromURL(source, callback) {
  if (source) {
    request.get(source[RequestParams], function(err, response, body) {
      if (err) return callback(err);
      if(body){
        body = JSON.parse(body);
        return callback(null, source, body);
      }
      else
        return callback(err);
    })

  }
}


// parse individual records from external dataset
function processStoryRecords(source, body, callback){
  if (!body){
    return null;
  }
  var output = {};
  var index;
  var records = body[source[ResponseParams][RecordLabel]];
  var recordKeys= Object.keys(records);

  // begin recursive processing of headlines
  (function next(index){

    // if we've processed all records stop the recursion and write to file
    if (index === recordKeys.length){
//    if (index === 3){
      return saveStoriesToFile(JSON.stringify(output, null, 2), OutputFilesPath + source[OutputParam], callback);
    }

    // otherwise process this record
    //  get the processed text (orig and mad) for this headline
    processStoryParameterRecords(source, body, index, function(text) {
      // convert simple group of records into the final output, stripped of POS tags;
      // move POS tags into own array
      var madHeadline = {};
      madHeadline = makeMadStory(source, text);

      //add the text to the output stream
      output[index] = madHeadline;
      next(index+1);
    });
  })(0);
}


// parse individual parameters of a record from external dataset
function processStoryParameterRecords(source, body, index, callback) {
  var recordIndex;
  var recordparams = source[ResponseParams][RecordParams];
  var recordParamKeys = Object.keys(recordparams);
  var newoutput = {};

  // begin recursive processing of each parameter (headline, abstract, description) of the headline
  (function nextRecordParam(recordIndex){

  // if we've processed all records stop the recursion and return the new text
    if (recordIndex === recordParamKeys.length) {
      return callback(newoutput);
    }

    var paramlocation = recordparams[recordParamKeys[recordIndex]];
    try {
      // send original text to be NLP processed
      var sourceText = getParamTextFromPath(source, body, paramlocation, index);
      nlpfunctions.getPOSTags(sourceText, function(body) {
          if (!body){
            nextRecordParam(recordIndex+1);
          }
          // add original text
          //eval("newoutput."+HeadlinesOriginalPrefix+recordParamKeys[recordIndex]+"=\""+sourceText.replace(/"/g, '\\"')+"\"");
          // add text with random replacements
          //eval("newoutput."+recordParamKeys[recordIndex]+"=\""+body.replace(/"/g, '\\"')+"\"");
          var tagstext = JSON.stringify(body);
          var thisrecord = eval("newoutput."+recordParamKeys[recordIndex]+"="+tagstext);
          //thisrecord = tagstext;
          nextRecordParam(recordIndex+1);
        });
      } catch (err) {
        console.log(err.message);
        nextRecordParam(recordIndex+1);
    }
  })(0);  
}

// Determine proper path and return text value of a parameter
function getParamTextFromPath(source, body, paramlocation, index) {
  var recordparams = source[ResponseParams][RecordParams];
  var records = body[source[ResponseParams][RecordLabel]];
  var sourceText="";
  var fulllocation;

    // each list of headlines has its own structure, with the good stuff for each record more than 1 level down in the JSON response
  if(paramlocation.indexOf("/")){
    var parselocation = paramlocation.split("/");
    fulllocation ="";
    for (level in parselocation){
      fulllocation+="[\"" + parselocation[level] + "\"]";
    }
  }
  else {
    fulllocation ="[\"" + paramlocation + "\"]";
  }

  try {
    var pathtoread = "records[index]"+fulllocation;
    // finally read the text for the given parameter
    sourceText = eval(pathtoread);
  } catch (err) {
    console.log(err.message);
    return "";
  }
    
  return sourceText;
}


function saveStoriesToFile(body, location, callback){
  if (body && location){
    fs.writeFile(location, body, callback);
  }
}

function loadStoriesFromFile(sourceindex){
  var body="";
  var parsedBody;

  try {
    if (storySources["sources"][sourceindex][OutputParam]){
        body = fs.readFileSync(OutputFilesPath + storySources["sources"][sourceindex][OutputParam], 'utf8');
        parsedBody = JSON.parse(body);
      }
    } catch (err) {
      return null;
    }

  return parsedBody;
  }

function getStoryByIndex(sourceIndex, storyIndex) {
  var stories;
  
  try {
    stories = loadStoriesFromFile(sourceIndex)
    
    if (!stories)
      return null;
  } catch (err){
    console.log(err.message);
    return null;
  }

  var storyCount = Object.keys(stories).length;
  if (storyIndex > storyCount)
    return null;

  var chosenRecord = Object.keys(stories)[storyIndex];
    
  return stories[chosenRecord];    
}

// Returns a record containing a randomly chosen headline from the chosen source
function pickRandomStory(sourceindex) {
  var headlines;
  
  try {
    headlines = loadStoriesFromFile(sourceindex)
    
    if (!headlines)
      return null;
  } catch (err){
    console.log(err.message);
    return null;
  }

  var headlineCount = Object.keys(headlines).length;
  //var recordParams = storySources["sources"][sourceindex][ResponseParams]["record_params"];

  // randomly choose a record
  var chosenIndex = Math.floor(Math.random() * (headlineCount));
  var chosenRecord = Object.keys(headlines)[chosenIndex];
    
  return headlines[chosenRecord];    

}

// Returns a record containing a randomly chosen headline from the chosen source
function pickRandomStoryIndex(sourceindex) {
  var headlines;
  
  try {
    headlines = loadStoriesFromFile(sourceindex)
    
    if (!headlines)
      return null;
  } catch (err){
    console.log(err.message);
    return null;
  }

  var headlineCount = Object.keys(headlines).length;
  //var recordParams = storySources["sources"][sourceindex][ResponseParams]["record_params"];

  // randomly choose a record
  var chosenIndex = Math.floor(Math.random() * (headlineCount));

  return chosenIndex;    

}

// takes text with POS tags and replaces tags with generic substitution tags;
// moves POS tags to own array; returns object with those 2 records
function makeMadStoryOLD(source, body) {
  var newHeadlineText = source[AlexaParams][AlexaReadingParam];
  var newHeadlinePOStags = [];
  var recitalParams = utils.getTagsInText(newHeadlineText);
  var madHeadline = {};
  var tagindex=0;

  if (recitalParams.length===0)
    return null;

  // walk through each part of the final sentence to be recited    
  for (var i=0; i< recitalParams.length; i++) {
    // grab all the POS tags from the record (record = headline, abstract, etc)
    var recordText = body[recitalParams[i]];
    //    "'{{title}}', by {{author}}. {{description}}"
    var recordPOStags = utils.getTagsInText(recordText);
    var newRecordText;
    
    if (recordPOStags.length > 0) {
      // load this record's POS tags into overall recited text POS tags array
      for (var j=0; j < recordPOStags.length; j++) {
        newHeadlinePOStags.push(recordPOStags[j]);
      }
      
      // replace all POS tags from the record with a numerated replacement tag
      newRecordText = recordText.replace(/\{{2}[A-Za-z]*\}{2}/g, function(){
        return "{{" + tagindex++ + "}}";
      });
    }
    else
      newRecordText = recordText;
    
    newHeadlineText = newHeadlineText.replace("{{"+recitalParams[i]+"}}", newRecordText);
  }
  
  madHeadline["headlinetext"] = newHeadlineText;
  madHeadline["headlinepostags"] = newHeadlinePOStags;

  
  return madHeadline;
}

// takes text with POS tags and replaces tags with generic substitution tags;
// moves POS tags to own array; returns object with those 2 records
function makeMadStory(source, body) {
  var newHeadlineText = source[AlexaParams][AlexaReadingParam];
  var newHeadlineEntityTags = [];
  var recitalParams = utils.getTagsInText(newHeadlineText);
  var madHeadline = {};
  var targetableTags = [];
  var targetedtuplesindex=0;

  if (recitalParams.length===0)
    return null;

  // load all targetable entity tags
  for (var o of posTags) {
    targetableTags.push(o.tag);
  }

  // walk through each part of the final sentence to be recited    
  for (var i=0; i< recitalParams.length; i++) {
    // grab all the POS tags from the record (record = headline, abstract, etc)
    var tuples = body[recitalParams[i]];
    var newRecordText = "";

    // walk through each tuple in this record
    for (var tupleindex=0; tupleindex<tuples.length; tupleindex++){
      // build newHeadlineText and newHeadlineEntityTags
      var literal = tuples[tupleindex][0];
      var entitytag = tuples[tupleindex][1];
      
      if (targetableTags.indexOf(entitytag)>-1 && literal.length>2) {   // this is a tag we potentially want to replace
        newRecordText = newRecordText +  " {" + targetedtuplesindex + "}";
        targetedtuplesindex++;
        newHeadlineEntityTags.push(tuples[tupleindex]);
      } else {              // tag is not on targeted list
        if (entitytag != "PUNCT")
          newRecordText = newRecordText + " ";
        newRecordText = newRecordText + literal;
      }
      
      
    }
    
    newHeadlineText = newHeadlineText.replace("{{"+recitalParams[i]+"}}", newRecordText);
  }
  
  madHeadline["headlinetext"] = newHeadlineText;
  madHeadline["headlineentitytags"] = newHeadlineEntityTags;
  
  return madHeadline;
}

