//@ts-check
//https://github.com/espressif/esp-mqtt
const log = require('./loggingController').log;
const DeviceManager = require('../managers/deviceManager');
var mqtt = require('mqtt')
var mosca = require('mosca');

var nodeDeviceList = new Array();
exports.nodeDeviceList = nodeDeviceList;


var settings = {
  port: 1883
};

var server = new mosca.Server(settings);
server.on('ready', setup);
exports.server = server;

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}

// fired whena  client is connected
server.on('clientConnected', function(client) {
  console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published : ', packet.payload.toString());
  createMqttNode(packet);
});
 
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
  console.log('subscribed : ', topic);
});
 
// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
  console.log('unsubscribed : ', topic);
});
 
// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
  console.log('clientDisconnecting : ', client.id);
});
 
// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
  console.log('clientDisconnected : ', client.id);
  DeviceManager.removeDevice(client.id);
});


function createMqttNode(packet){
  let details = packet.payload.toString();
  if(isJSON(details)){
    details = JSON.parse(details);
    if(details.hasOwnProperty("JOAT_CONNECT")){
      // let node = new MqttMasterNode(details);
      // details.ipAddress = int2ip(details.ipAddress);
      DeviceManager.addNewDevice(details, DeviceManager.NodeType.MQTT, true);
      // nodeDeviceList.push(node);
    }
  }
}

function int2ip (ipInt) {
  ipInt = parseInt(ipInt);
  return ( (ipInt & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt>>16 & 255) +'.' +  (ipInt>>>24));
}



var client = mqtt.connect('http://localhost');
 
client.subscribe('root');
 
client.on('message', function(topic, message) {
  console.log(message.toString());
  console.log("from subscribed");
});

client.on('connect', function () {
  client.subscribe('root', function (err) {
    if (!err) {
      client.publish('root', 'Hello mqtt')
    }
  })
})

exports.publishtMqtt = function(req,res){
  var topic = req.params.topic;
  var packet = JSON.stringify(req.body);
  client.publish(topic, packet, (result)=>{
    log(result);
    res.send(result);
  });
}

exports.getNodeList = function(req, res){
  res.send(nodeDeviceList);
}



// ============================
// ==== Helpers ===============
// ============================

function isJSON(str) {
  if (/^\s*$/.test(str)) return false;
  str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
  str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
  str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
  return (/^[\],:{}\s]*$/).test(str);

}