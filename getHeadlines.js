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

  // Retrieve new headlines from external source, then process to be 'Maddened'
  if (headlineSources["sources"]){
    for (source in headlineSources["sources"]){
      // create new headline file
      getOriginalHeadlinesFromURL(headlineSources["sources"][source], processHeadlineRecords);
      
      // create new Mad headlines form new file
      //      }
    }
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

// parse individual records JSON from external dataset
function processHeadlineRecords(err, source, body){
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
        nlpfunctions.getJSONPOSTags(sourceText, function(body) {
            if (!body){
              madText="";
            }
            madText = body;
          });
      } catch (err) {
        madText="";
      }

      // add Mad text
      eval("tryme."+param+"=\""+madText.replace(/"/g, '\\"')+"\"");

    }

    output[index]=tryme;
    index++;
  }
    
  // Save original text to file
  saveHeadlinesToFile(JSON.stringify(output, null, 2), OutputFilesPath + source[OutputParam]);
}
}

function saveHeadlinesToFile(body, location){
  if (body && location){
    fs.writeFileSync(location, body);
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
    
  //console.log(headlines[chosenRecord]);

  return headlines[chosenRecord];
}