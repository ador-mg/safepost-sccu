var AeonSDK = require('aeonsdk-node');


if(process.argv.length != 4){
    console.log("Use: node sendmessage.js ls|dtube|sensors|devEvents|imgRecog|transportEvents|alert <message to send>");
    return;
}

var date = new Date();
var current_hour = date.getHours();
var channel = process.argv[2];
var message = process.argv[3];

console.log("sending: " + message + ", to channel: " + channel);

var PUB_URL;
if(channel == "ls")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/fbee9395-dea7-4a20-9a02-6480f7227de7";
else if(channel == "dtube")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/7d4542d2-1753-40ef-b71d-f3e6f9e6edd3";
else if(channel == "sensors")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/a6ec0c32-80ad-4172-8dd1-36e6324a76bf";
else if(channel == "devEvents")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/2ee1785a-d466-4368-b56c-ab478f2d4270";
else if(channel == "transportEvents")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/c5d034f0-9634-4e5e-a0ea-da09dbea99b3";
else if(channel == "imgRecog")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/a70768dc-d771-4c00-abed-cae0eeb9b168";
else if(channel == "alert")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/a59fd728-992a-419f-9fa5-8cb2448ddc30";
else{
  console.log("Unknown channel: " + channel);
  return;
}

var sdk = new AeonSDK(PUB_URL);
sdk.publish({ message: message, datetime: current_hour });

console.log("message sent");