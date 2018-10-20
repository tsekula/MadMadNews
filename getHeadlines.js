// retrieve headlines from various web services
// and write to local file
var headlineSources = require("./headline-sources.json");
var request = require('request');
var fs = require("fs");
var nlpfunctions = require('./nlptools/getNLP.js');

// details for headlines configuration JSON
const OutputFilesPath = "./headlines/";
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
    chosenRecord = pickRandomHeadline(loadHeadlinesFromFile(sourceIndex));
  
    if (chosenRecord)
      return chosenRecord;
    else
      return "";
}



// Refreshes Headlines from all external providers
function refreshHeadlines() {
  if (headlineSources["sources"]){
    for (source in headlineSources["sources"]){
      getHeadlinesFromURL(headlineSources["sources"][source], processHeadlineRecords);
      }
    }
}


// retrieve data from a specified web service
function getHeadlinesFromURL(source, callback) {
  if (source) {
    request.get(source[RequestParams], function(err, response, body) {
      if (err) callback(err);
      if(body){
        body = JSON.parse(body);
        callback(null, source, body);
      }
      else
        callback(err);
    })

  }
}

// parse individual records from external dataset
function processHeadlineRecords(err, source, body){
  if(err){
    console.log(err)
  }
  if (!body)
    console.log("nope.")
  else{
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
        eval("tryme."+param+"=\""+eval(pathtoread).replace(/"/g, '\\"')+"\"");
          //param: eval(pathtoread)
      }
      output[index]=tryme;
      index++;
    }
    //console.log(output);
    saveHeadlinesToFile(JSON.stringify(output, null, 2), source[OutputParam]);
  }
}

function saveHeadlinesToFile(body, location){
  if (body && location){
    fs.writeFileSync(location, body);
  }
}

function loadHeadlinesFromFile(sourceindex){
  var body="";
  if (headlineSources["sources"][sourceindex][OutputParam]){
      body = fs.readFileSync(headlineSources["sources"][sourceindex][OutputParam], 'utf8');
      if (body)
        return JSON.parse(body);
    }
}

// Returns a record containing a randomly chosen headline from the chosen source
function pickRandomHeadline(headlines) {
  if(headlines){
    var headlineCount = Object.keys(headlines).length;
    //var recordParams = headlineSources["sources"][sourceindex][ResponseParams]["record_params"];

    // randomly choose a record
    var chosenIndex = Math.floor(Math.random() * (headlineCount));
    var chosenRecord = Object.keys(headlines)[chosenIndex];
    
    //console.log(headlines[chosenRecord]);
    return headlines[chosenRecord];
  }
}