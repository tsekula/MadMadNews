var request = require('request');

request.get({
  url: "https://api.nytimes.com/svc/books/v3/lists/best-sellers/history.json",
  qs: {
    'api-key': "4652552890064bc788ec90a4d5ff1048"
  }
}, function(err, response, body) {
  body = JSON.parse(body);
  console.log(body);
})