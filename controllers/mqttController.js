//@ts-check
//https://github.com/espressif/esp-mqtt
const log = require('./loggingController').log;
const DeviceManager = require('../managers/deviceManager');
const EventActionController = require('./eventActionController')
var mqtt = require('mqtt')
var mosca = require('mosca');

var nodeDeviceList = new Array();
var tempNodeId;
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
server.on('clientConnected', function (client) {
  console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function (packet, client) {
  // log(packet.toString())
  log('Published : ', packet.payload.toString());
  if (client != undefined) {
    log("Client id:");
    log(client.id.toString());
    parsePacket(packet, client.id);
  }
});

// fired when a client subscribes to a topic
server.on('subscribed', function (topic, client) {
  console.log('subscribed : ', topic);
});

// fired when a client subscribes to a topic
server.on('unsubscribed', function (topic, client) {
  console.log('unsubscribed : ', topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function (client) {
  console.log('clientDisconnecting : ', client.id);
});

// fired when a client is disconnected
server.on('clientDisconnected', function (client) {
  console.log('clientDisconnected : ', client.id);
  DeviceManager.removeDevice(client.id);
});


function parsePacket(packet, nodeId = undefined) {
  tempNodeId = nodeId
  let msg = packet.payload.toString();
  if (isJSON(msg)) {
    msg = JSON.parse(msg);
    if (msg.hasOwnProperty("JOAT_CONNECT")) {
      // Packet is to create a new node device
      createMqttNode(msg)
    } else if (msg.hasOwnProperty("state")) {
      // is an event from a node device
      if (msg.state.type == "event") {
        EventActionController.parseEvent(msg.state.message, addActionsToMasterQueue)
      } else if (msg.state.type == "action") {
        EventActionController.parseAction(msg.state.message, addActionsToMasterQueue)
      }
    } else if (msg.hasOwnProperty("heartbeat")) {
      DeviceManager.updateMeshHeartbeat(tempNodeId, msg);
    } else if (msg.hasOwnProperty("bridgeMemory")) {
      DeviceManager.updateBridgeMemory(tempNodeId, msg);
    }
  }
}

exports.addActionsToMasterQueue = addActionsToMasterQueue;

/**
 * Add actions to masters queue
 * @param {*} actionsArray The actions to add to queue
 */
function addActionsToMasterQueue(actionsArray) {
  DeviceManager.nodeDeviceList.forEach(device => {
    if (device.id == tempNodeId) {
      actionsArray.forEach(action => {
        device.actionsArray.push(action)
        DeviceManager.setDeviceReady(device.id);
      });
    }
  })
}


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
  // console.log(message.toString());
  // console.log("from subscribed");
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
    log(result);
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