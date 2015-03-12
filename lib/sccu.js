/*
  Copyright (C) 2015 ATOS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var AeonSDK = require('aeonsdk-node');
var http = require('http');
var fs = require('fs');

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4() + s4() +
    s4() + s4() + s4() + s4();
}

function SCCU(aeonid, channels, host, postbackBaseUrl){
  this.channels = channels;
  this.host = host;
  this.postbackBaseUrl = postbackBaseUrl;
  
  this.id = "CPSS_" + aeonid;
  this.desc = "CPSS System (" + aeonid + ")";
  this.activechannels = [];
  this.activesubscriptions = [];
  this.failedchannels = [];
  this.selfCheckTimeout;
}

module.exports = SCCU;

SCCU.prototype.start = function(){
  // Subscribe to all channels
  var othis = this;
  for (var i = 0; i < this.channels.length; i++) {
    var channel = this.channels[i];
    this.listenToChannel(channel, function(msg) { 
                                    othis.handleMessage(msg, channel);
                                  });
  };

  this.selfCheckTimeout = setTimeout(othis.selfCheck.bind(this), 10000);
}

SCCU.prototype.selfCheck = function(){
  console.log("Self-testing...");
  console.log("Live channels: ", sccu.activechannels);
  console.log("Failed channels: ", sccu.failedchannels);

  // Check for failed channels
  var othis = this;
  var channelstofix = this.failedchannels.slice();
  this.failedchannels = [];
  for (var i = 0; i < channelstofix.length; i++) {
    var channel = channelstofix[i];
    this.listenToChannel(channel, function(msg) { 
                                    othis.handleMessage(msg, channel);
                                  });
  };

  this.selfCheckTimeout = setTimeout(othis.selfCheck.bind(this), 10000);
}

SCCU.prototype.handleMessage = function(msg, channel){
  console.log("Received: ", msg);

  try {
    var dataString = JSON.stringify(msg);

    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };

    var options = {
      host: this.host,
      port: 80,
      path: '/' + this.postbackBaseUrl + '/' + channel,
      method: 'POST',
      headers: headers
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
          responseString += data;
        });

        res.on('end', function() {
          console.log("Received response:" + responseString);
          //var responseObject = JSON.parse(responseString);
          //success(responseObject);
        });
    });

    console.log("posting to CPSS...");

    req.write(dataString);
    req.end();

    req.on('error', function (e) {
        console.error("error while posting:");
        console.error(e);
    });
  }
  catch(e){
    console.error("exception while posting.", e);
  }
}

SCCU.prototype.stop = function() {
  console.log("Pausing active subscriptions....");

  // Stopping all channels
  for (var i = 0; i < this.activesubscriptions.length; i++) {
    try {
      console.log("killing " + this.activesubscriptions[i].url);
      this.activesubscriptions[i].pauseSubscription();
    }
    catch(er){
      console.log("failed to delete subscription for channel " + this.channel[i]);
    }
  };

  this.activesubscriptions = [];
  this.activechannels = [];
  this.failedchannels = [];

  clearTimeout(this.selfCheckTimeout);
}

SCCU.prototype.listenToChannel = function (channel, receivemessage) {
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

  var subscriptionData = { "id" : this.id + "_" + channel, "desc": this.desc + " for channel: " + channel };
  var savedSubscription = this.loadSubscriptionData(subscriptionData);
  if(savedSubscription != undefined){
    subscriptionData = savedSubscription;
  }

  var sdk = new AeonSDK(SUB_URL, subscriptionData);
  var sccu = this;

  console.log(subscriptionData);

  sdk.subscribe(receivemessage, function control(msg){
    subscription = sdk.getSubscription();

    if(!msg.error && msg.code == 250){
      sccu.activesubscriptions.push(sdk);
      sccu.activechannels.push(channel);
      sccu.saveSubscriptionData(subscription);
      console.log("Subscribed to channel: " + channel);
    }

    if(msg.code == 201){
      console.log("Failed to subscribe to channel: " + channel);
    }
    
    if(msg.error && msg.code != 202) {
      sdk.deleteSubscription();
      sccu.failedchannels.push(channel);
      sccu.removeSubscriptionData(subscription);
      console.log("Error for channel: " + channel + " (code: " + msg.code + ", desc: " + msg.msg + ")");
    }
  });
}

SCCU.prototype.removeSubscriptionData = function(subscription){
  var outputFilename = 'data/' + subscription.id + '.json';
  try {
    var filename = 'data/' + subscription.id + '.json';
    fs.unlinkSync(filename); 
  }
  catch (e) { }
}

SCCU.prototype.saveSubscriptionData = function(subscription){
  //console.log("saving:", subscription);
  var outputFilename = 'data/' + subscription.id + '.json';
  fs.writeFile(outputFilename, JSON.stringify(subscription, null, 4), function(err) {
      if(err) {
        console.log(err);
      }
  }); 
}

SCCU.prototype.loadSubscriptionData = function(subscription){
  try {
    var filename = 'data/' + subscription.id + '.json';
    var strSub = fs.readFileSync(filename, {encoding: "utf-8"}); 
    return JSON.parse(strSub);
  }
  catch (e) { }
}