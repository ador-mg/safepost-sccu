/*
  Copyright (C) 2015 ATOS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var AeonSDK = require('aeonsdk-node');
var http = require('http');

function SCCU(channels, postbackUrl){
  this.channels = channels;
  this.postbackBaseUrl = postbackUrl;
  this.id = "CPSS";
  this.desc = "CPSS System";
  this.activechannels = [];
}

module.exports = SCCU;

SCCU.prototype.start = function(){
  // Subscribe to all channels
  for (var i = 0; i < this.channels.length; i++) {
    this.listenToChannel(this.channels[i], 
                          function(msg) { 
                            console.log("Received: ", msg);
                            var options = {
                              host: this.postbackBaseUrl,
                              port: 80,
                              path: '/' + this.channels[i],
                              method: 'POST'
                            };

                            var req = http.request(options, function(res) {
                              console.log('STATUS: ' + res.statusCode);
                              console.log('HEADERS: ' + JSON.stringify(res.headers));
                              res.setEncoding('utf8');
                              res.on('data', function (chunk) {
                                console.log('POST response BODY: ' + chunk);
                              });
                              res.on('data', function (e) {
                                console.error(e);
                              });
                            })

                            req.write(msg);
                            req.end();
                          });
  };
}

SCCU.prototype.stop = function(){
  console.log("Killing all subscriptions....");

  // Stopping all channels
  for (var i = 0; i < this.activechannels.length; i++) {
    try {
      console.log("killing " + this.activechannels[i].url);
      this.activechannels[i].deleteSubscription();
    }
    catch(er){
      console.log("failed to delete subscription for channel " + this.channel[i]);
    }
  };

  this.activechannels = [];
}

var control = function control(msg){
    console.log("Control: ", msg);
}

SCCU.prototype.listenToChannel = function (channel, receivemessage) {
  var userData = { "id":this.id + "_" + channel, "desc": this.desc };

  var SUB_URL;
  if(channel == "ls")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/444196bf-9452-4bad-95a5-0aab2bf7b4ee";
  else if(channel == "dtube")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/4d6d1e27-205c-44a0-bfd8-28a8edca0374";
  else if(channel == "sensors")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/06ab4ff0-4cf8-45b8-a40a-dd03750e61c9";
  else if(channel == "devEvents")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/85082ece-c08a-4d20-af85-d9bf5804a355";
  else if(channel == "transportEvents")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/75f2913d-2821-4a27-8049-e6e67203d433";
  else if(channel == "imgRecog")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/92d3be12-8a3a-4dc0-abec-3de1357e0efc";
  else if(channel == "alert")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/66ba3dda-f6b4-488a-a2b4-c64c49b384e6";
  else{
      console.log("Unknown channel: " + channel);
      return;
  }

  var sdk = new AeonSDK(SUB_URL, userData);

  console.log("=========================================");
  console.log("Channel: " + channel);
  console.log("Channel URL: " + SUB_URL);
  console.log("=========================================");

  sdk.subscribe(receivemessage, function control(msg){
    console.log("Channel: " + channel + ", Control: ", msg);
  });
  console.log("Subscribed to channel: " + channel + ". Waiting for messages...");
  this.activechannels.push(sdk);
}