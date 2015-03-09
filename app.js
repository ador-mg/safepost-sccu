/*
  Copyright (C) 2015 CLMS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var SCCU = require('./lib/sccu.js');
var http = require('http');

var channels = [ "ls", "dtube", "sensors", "devEvents", "transportEvents", "imgRecog", "alert" ];

sccu = new SCCU(channels, 'http://dev.zappdev.com/EUProjects_SafepostDemo_1_0_ador_Knockout');

sccu.start();

try{
  // Configure our HTTP server to respond with Hello World to all requests.
  var server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});

    response.write("Subscribed to channels:<br/>");
    for (var i = 0; i < sccu.channels.length; i++) {
      response.write(sccu.channels[i] + "<br/>");
    };

    response.end("Hello World\n");
  });

  // Listen on port 8000, IP defaults to 127.0.0.1
  var port = process.env.PORT || 3000;
  server.listen(port);

  // Put a friendly message on the terminal
  console.log("Server running at http://127.0.0.1:" + port + "/");
}
catch(er)
{
  console.log(er);
}

process.on('SIGTERM', function(){

  console.log("Stopping...");
  sccu.stop();

});
