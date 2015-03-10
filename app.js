/*
  Copyright (C) 2015 CLMS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var SCCU = require('./lib/sccu.js');
var http = require('http');
var restify = require('restify');
var fs = require('fs');
var nconf = require('nconf');

var channels = [ "ls" ];//, "dtube", "sensors", "devEvents", "transportEvents", "imgRecog", "alert" ];

// First consider commandline arguments and environment variables, respectively and then file.
nconf.argv()
      .env()
      .file({ file: 'config.json' });

// Provide default values for settings not provided above.
nconf.defaults({
    'channels': [ "ls", "dtube", "sensors", "devEvents", "transportEvents", "imgRecog", "alert" ],
    'host' : 'dev.zappdev.com',
    'basepath' : 'EUProjects_SafepostDemo_1_0_ador_Knockout/sccu'
});

sccu = new SCCU(nconf.get("aeonid"), nconf.get("channels"), nconf.get("host"), nconf.get("basepath"));
sccu.start();

// HTTP Server
var port = process.env.PORT || 3000;
var server = restify.createServer();

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
