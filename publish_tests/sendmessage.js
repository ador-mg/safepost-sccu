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
  PUB_URL = "http://aeon-back.herokuapp.com/publish/b3436faa-a32e-4535-ab9b-c1f1e5071920";
else if(channel == "dtube")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/af454eef-d96a-4a13-9604-4064c2727061";
else if(channel == "sensors")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/7f61b87e-1547-4945-bf27-8863fd5f4378";
else if(channel == "devEvents")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/76744391-dcfc-493c-a37d-bfe7b3284046";
else if(channel == "transportEvents")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/2cfc5ae1-8c67-4096-88eb-382c07632c17";
else if(channel == "imgRecog")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/97dbc0a8-3180-458a-ac3e-c96150d6723a";
else if(channel == "alert")
  PUB_URL = "http://aeon-back.herokuapp.com/publish/7a48a3a9-4cad-4cea-94a1-836071db3801";
else{
  console.log("Unknown channel: " + channel);
  return;
}

var sdk = new AeonSDK(PUB_URL);
sdk.publish({ message: message, datetime: current_hour });
