var request = require('request');
const NLPAPI = "https://nlp-api-tsekula.c9users.io:8080/nlp/parse"
var text = "Marine Le Pen \"Sharpens\" Attack on Emmanuel Macron in French Debate.";
console.log(text.replace(/"/g, '\\"'));

  if (text) {
      request.get({
      url: NLPAPI,
      json: {
        "text": text  }
    }, function(err, response, body) {
      if (err) console.log(err);
      if (body){
        console.log(body);
      }
      else
        console.log(err);
    })
  }

