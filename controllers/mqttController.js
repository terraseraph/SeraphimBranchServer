//@ts-check
//https://github.com/espressif/esp-mqtt
const log = require('./loggingController');
const DeviceManager = require('../managers/deviceManager');
const EventActionController = require('./eventActionController')
var mqtt = require('mqtt')
var mosca = require('mosca');
var expressServer = require("../app.js").server;

var nodeDeviceList = new Array();
var tempNodeId;
exports.nodeDeviceList = nodeDeviceList;


var settings = {
  port: 1883
};
let server = new mosca.Server(settings);
exports.server = server;
exports.mqttInit = mqttInit;

// fired when the mqtt server is ready
function setup() {
  log.log('Mosca server is up and running')
}


function mqttInit() {
  server.on('ready', setup);

  // fired whena  client is connected
  server.on('clientConnected', function (client) {
    log.log('client connected', client.id);
  });

  // fired when a message is received
  server.on('published', function (packet, client) {
    // log(packet.toString())
    log.log('Published : ', packet.payload.toString());
    if (client != undefined) {
      // log("Client id:");
      log.log("ClientId: ", client.id.normalize(), packet.topic);
      console.log(client.id.normalize("NFC"))
      parsePacket(packet, client.id);
    }
  });

  // fired when a client subscribes to a topic
  server.on('subscribed', function (topic, client) {
    log.log('subscribed : ', topic);
  });

  // fired when a client subscribes to a topic
  server.on('unsubscribed', function (topic, client) {
    log.log('unsubscribed : ', topic);
  });

  // fired when a client is disconnecting
  server.on('clientDisconnecting', function (client) {
    log.log('clientDisconnecting : ', client.id);
  });

  // fired when a client is disconnected
  server.on('clientDisconnected', function (client) {
    log.log('clientDisconnected : ', client.id);
    DeviceManager.removeDevice(client.id);
  });

}

function parsePacket(packet, nodeId = undefined) {
  tempNodeId = nodeId
  let msg = packet.payload.toString();
  msg.topic = packet.topic;
  if (isJSON(msg)) {
    msg = JSON.parse(msg);
    if (msg.hasOwnProperty("JOAT_CONNECT")) {
      // Packet is to create a new node device
      createMqttNode(msg)
    } else if (msg.hasOwnProperty("state")) {
      // is an event from a node device
      if (msg.state.type == "event") {
        EventActionController.parseEvent(msg.state.message, nodeId, actionsAddedToNode)
      } else if (msg.state.type == "action") {
        EventActionController.parseAction(msg.state.message, nodeId, actionsAddedToNode)
      }
    } else if (msg.hasOwnProperty("heartbeat")) {
      DeviceManager.updateMeshHeartbeat(tempNodeId, msg);
    } else if (msg.hasOwnProperty("bridgeMemory")) {
      DeviceManager.updateBridgeMemory(tempNodeId, msg);
    } else if (msg.hasOwnProperty("ready")) {
      log.log("SETTING READY", tempNodeId)
      DeviceManager.setDeviceReady(tempNodeId);
    }
  }
}


/**
 * Add actions to masters queue
 * @param {*} actionsArray The actions to add to queue
 */
function actionsAddedToNode(actionsArray) {
  log.logInfo("== Actions added to node ==", actionsArray);
}
exports.actionsAddedToNode = actionsAddedToNode;


function createMqttNode(details) {
  DeviceManager.addNewDevice(details, DeviceManager.NodeType.MQTT, true);
}

function int2ip(ipInt) {
  ipInt = parseInt(ipInt);
  return ((ipInt & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >>> 24));
}



var client = mqtt.connect('http://localhost');

client.subscribe('root');

client.on('message', function (topic, message) {
  // log.log(message.toString());
  // log.log("from subscribed");
});

client.on('connect', function () {
  client.subscribe('root', function (err) {
    if (!err) {
      client.publish('root', 'Hello mqtt')
    }
  })
})

exports.publishtMqtt = function (req, res) {
  var topic = req.params.topic;
  var packet = JSON.stringify(req.body);
  client.publish(topic, packet, (result) => {
    log.log(result);
    res.send(result);
  });
}

exports.getNodeList = function (req, res) {
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