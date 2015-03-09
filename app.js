/*
  Copyright (C) 2015 CLMS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var SCCU = require('./lib/sccu.js');
var http = require('http');
var restify = require('restify');

var channels = [ "ls", "dtube", "sensors", "devEvents", "transportEvents", "imgRecog", "alert" ];

sccu = new SCCU(channels, 'http://dev.zappdev.com/EUProjects_SafepostDemo_1_0_ador_Knockout');

sccu.start();

var port = process.env.PORT || 3000;
function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get('/channels' , function(req, res, next){
  res.send(sccu.channels);
  next();
});

server.get('/channels/stop' , function(req, res, next){
  sccu.stop();
  res.send("Done!");
  next();
});

server.get('/channels/start' , function(req, res, next){
  sccu.start();
  res.send("Started!");
  next();
});

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

process.on('SIGTERM', function(){

  console.log("Stopping...");
  sccu.stop();

});
