/*
  Copyright (C) 2015 ATOS

    This file is part of Safepost.

  Authors:
    Antonis Migiakis <a.migiakis@clmsuk.com>

*/

var AeonSDK = require('aeonsdk-node');
var http = require('http');
var fs = require('fs');
var request = require('request');

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
  try {
    console.log("posting to CPSS...");
    request.post('http://' + this.host + '/' + this.postbackBaseUrl + '/' + channel, {form:{message: msg.xml}});
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
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/47d97839-eb77-488d-b039-3aacbd24e825";
  else if(channel == "dtube")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/131b04cc-1855-42c0-950e-b55eca86bd79";
  else if(channel == "sensors")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/c6bc5ae1-6b33-4692-8b64-db3348608e8d";
  else if(channel == "devEvents")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/2209fd95-861d-4511-8835-805d66429d2f";
  else if(channel == "transportEvents")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/5d9cb6fb-02fb-40be-a5ad-037e0b1d7954";
  else if(channel == "imgRecog")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/d5ef0808-13e7-4502-b909-17b38bae9455";
  else if(channel == "alert")
      SUB_URL = "http://aeon-back.herokuapp.com/subscribe/f00a1cca-5bc8-4d31-8bb3-1dde636f1b03";
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

    console.log('error', msg.error);
    console.log('code', msg.code);
    
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