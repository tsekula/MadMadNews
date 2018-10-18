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

nlpfunctions.getPOSTags("This should be a pretty sweet way to go about things, right President Trump and Prime Minister Trudeau?  I really think that we should change our shoes when we get home.", nlpfunctions.processString);

// retrieve 
exports.getRandomHeadline = function (source, callback) {
// 1. refresh local headline depot if out of date
  refreshHeadlines();
// 2. load the chosen type of headlines from the local file
// 3. choose 1 at random

  
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