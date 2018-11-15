/**
 * Primary file for the API
 * 
 * 
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');


// Instatiate the HTTP server
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Instatiate the HTTPS server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, function() {
  console.log(`The http server is listening on port ${config.httpPort} in ${config.envName} mode.`);
});

// Start the server
httpsServer.listen(config.httpsPort, function() {
  console.log(`The https server is listening on port ${config.httpsPort} in ${config.envName} mode.`);
});

// All the server logic for both the http and https server
const unifiedServer = function (req, res) {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url,true); 

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data); 
  });
  req.on('end', function(){
    buffer += decoder.end(); 

    // Choose the handler this request should go to. If one is not exist go to not found handler
    const choosenHandler = 
      typeof(router[trimmedPath]) !== 'undefined' ?
      router[trimmedPath] :
      router.notFound

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)
    };
    console.log(choosenHandler, router);
    // Route the request to the handler specified in the router 
    choosenHandler(data, function(statusCode, payload) {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof  statusCode === 'number' ? statusCode : 200;
      // Use the payload called back by the handler, or default to an empty object 
      payload = typeof payload  === 'object' ? payload: {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');

      // Return the response;
      res.writeHead(statusCode);

      // Log the request path
      console.log('Return this response: ', statusCode, payloadString);
      res.end(payloadString);

    });
  });
}



// Define a request router
const router = {
  'ping' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens
}

