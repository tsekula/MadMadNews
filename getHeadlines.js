// retrieve headlines from various web services
// and write to local file
var headlineSources = require("./headline-sources.json");
var request = require('request');
var fs = require("fs");
var nlpfunctions = require('./nlptools/getNLP.js');

// details for headlines configuration JSON
const OutputFilesPath = "./headlines/";
const HeadlinesOriginalPrefix = "orig"
const OutputFilesAlteredPrefix = "mad-"
const OutputParam = "output_file";
const ResponseParams = "source_response_params";
const RequestParams = "source_request_params";
const RecordLabel = "record_label";
const RecordParams = "record_params";
var exports = module.exports = {};

// retrieve random headline
exports.getRandomHeadline = function (sourceIndex) {
  var chosenRecord;

  // refresh local headline depot if out of date
    //refreshHeadlines();
    
  // load the chosen type of headlines and choose 1 at random
    chosenRecord = loadHeadlinesFromFile(sourceIndex, pickRandomHeadline);

    if (chosenRecord)
      return chosenRecord;
    else
      return null;
}

refreshHeadlines();

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
      //add the text to the output stream
      output[index] = text;
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
          eval("newoutput."+HeadlinesOriginalPrefix+recordParamKeys[recordIndex]+"=\""+sourceText.replace(/"/g, '\\"')+"\"");
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


// parse individual records JSON from external dataset
function OLDprocessHeadlineRecords(err, source, body){
  if (err || !body){
    return null;
  }
  var output = {};

  var records = body[source[ResponseParams][RecordLabel]];
  var recordparams = source[ResponseParams][RecordParams];
  var index=0;
  for (entry in records){
    var tryme = {};
    for (param in recordparams) {
      var paramlocation = recordparams[param];
      var fulllocation ="";
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
      var pathtoread = "records[entry]"+fulllocation;
      var sourceText = eval(pathtoread);

      // add original text
      eval("tryme."+HeadlinesOriginalPrefix+param+"=\""+sourceText.replace(/"/g, '\\"')+"\"");
      
      // add Maddened replacement text
      var madText="";
      try {
        // send original text to be NLP processed
        nlpfunctions.getPOSTags(sourceText, function(body) {
            if (!body){
              return "";
            }
            console.log('here before returning body');
            eval("tryme."+param+"=\""+body.replace(/"/g, '\\"')+"\"");
          });
        } catch (err) {
      }

    }

    output[index]=tryme;
    index++;
  }
    
  // Save original text to file
  saveHeadlinesToFile(JSON.stringify(output, null, 2), OutputFilesPath + source[OutputParam]);
}


function saveHeadlinesToFile(body, location, callback){
  if (body && location){
    fs.writeFile(location, body, callback);
  }
}

function loadHeadlinesFromFile(sourceindex, callback){
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

  return callback(parsedBody);
  }

// Returns a record containing a randomly chosen headline from the chosen source
function pickRandomHeadline(headlines) {
  if(!headlines){
    return null;
  }
    
  var headlineCount = Object.keys(headlines).length;
  //var recordParams = headlineSources["sources"][sourceindex][ResponseParams]["record_params"];

  // randomly choose a record
  var chosenIndex = Math.floor(Math.random() * (headlineCount));
  var chosenRecord = Object.keys(headlines)[chosenIndex];
    
  return headlines[chosenRecord];
}