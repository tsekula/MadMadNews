// retrieve headlines from various web services
// and write to local file
var headlineSources = require("./headline-sources.json");
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


//refreshHeadlines();

// retrieve random headline
exports.getRandomHeadline = function (sourceIndex) {
  var chosenRecord;

  // refresh local headline depot if out of date
    //refreshHeadlines();
    
  // load the chosen type of headlines and choose 1 at random
    chosenRecord = pickRandomHeadline(sourceIndex);

    if (chosenRecord)
      return chosenRecord;
    else
      return null;
}

// retrieve the reading format of a headline
exports.getAlexaReadingFormat = function (index){
  if (!index) {
    return null;
  }
  else if (index >= headlineSources["sources"].length) {
    return null;
  }
  
  var source = headlineSources["sources"][index][AlexaParams][AlexaReadingParam];
  
  return source;
}

// Refreshes Headlines from all external providers
function refreshHeadlines() {
  var index = 0;
  
  (function next(index){
    if (index === headlineSources["sources"].length) {
        return;
    }
    //var source = headlineSources["sources"][index];

    getOriginalHeadlinesFromURL(headlineSources["sources"][index], function(err, source, body) {
      if (err) return callback(err);
      if(body){
        processHeadlineRecords(source, body, function(){
           next(index+1);
        });

      }
      else
        return callback(err);
    });

  })(0);
}


// retrieve data from a specified web service
function getOriginalHeadlinesFromURL(source, callback) {
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
function processHeadlineRecords(source, body, callback){
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
      return saveHeadlinesToFile(JSON.stringify(output, null, 2), OutputFilesPath + source[OutputParam], callback);
    }

    // otherwise process this record
    //  get the processed text (orig and mad) for this headline
    processHeadlineParameterRecords(source, body, index, function(text) {
      // convert simple group of records into the final output, stripped of POS tags;
      // move POS tags into own array
      var madHeadline = {};
      madHeadline = makeMadHeadline(source, text);

      //add the text to the output stream
      output[index] = madHeadline;
      next(index+1);
    });
  })(0);
}


// parse individual parameters of a record from external dataset
function processHeadlineParameterRecords(source, body, index, callback) {
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
          eval("newoutput."+recordParamKeys[recordIndex]+"=\""+body.replace(/"/g, '\\"')+"\"");
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


function saveHeadlinesToFile(body, location, callback){
  if (body && location){
    fs.writeFile(location, body, callback);
  }
}

function loadHeadlinesFromFile(sourceindex){
  var body="";
  var parsedBody;

  try {
    if (headlineSources["sources"][sourceindex][OutputParam]){
        body = fs.readFileSync(OutputFilesPath + headlineSources["sources"][sourceindex][OutputParam], 'utf8');
        parsedBody = JSON.parse(body);
      }
    } catch (err) {
      return null;
    }

  return parsedBody;
  }

// Returns a record containing a randomly chosen headline from the chosen source
function pickRandomHeadline(sourceindex) {
  var headlines;
  
  try {
    headlines = loadHeadlinesFromFile(sourceindex)
    
    if (!headlines)
      return null;
  } catch (err){
    console.log(err.message);
    return null;
  }

  var headlineCount = Object.keys(headlines).length;
  //var recordParams = headlineSources["sources"][sourceindex][ResponseParams]["record_params"];

  // randomly choose a record
  var chosenIndex = Math.floor(Math.random() * (headlineCount));
  var chosenRecord = Object.keys(headlines)[chosenIndex];
    
  return headlines[chosenRecord];    

}


// takes text with POS tags and replaces tags with generic substitution tags;
// moves POS tags to own array; returns object with those 2 records
function makeMadHeadline(source, body) {
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