//@ts-check
//https://github.com/espressif/esp-mqtt
const log = require('./loggingController').log;
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
  console.log('Published : ', packet.payload);
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
});


function createMqttNode(packet){
  let details = packet.payload.toString();
  if(isJSON(details)){
    details = JSON.parse(details);
    if(details.hasOwnProperty("JOAT_CONNECT")){
      let node = new MqttMasterNode(details);
      nodeDeviceList.push(node);
    }
  }
}





// when a node connects
  // make a new mqtmasternode
  // node sends through its details {name, id, thoer stuff}

class MqttMasterNode {
  constructor(details){
    this.name = details.name; //the topic to publish to
    this.ipAddress = ""; // the nodes ip address probably
    this.id = null;
    this.ready = false;
    this.actionsArray = new Array();
    this.writeCount = 0;
    this.timer = null;

    this.initialise();
  }

  initialise(){
    var branchDetails = {
      branchIp : "0.0.0.0",
      branchName: "somebranch name",
      usingScript: "script name"
    }
    // publish branch details to the node
    server.publish({
      topic: this.name,
      payload: Buffer.from(JSON.stringify(branchDetails)),
      qos: 1,
      retain:false
    }, () => {})
    log("================ created node =================")
  }

  write(data, callback) {
    this.writeCount += 1
    log("Total writes to this node: ", this.writeCount)

    server.publish({
      topic: this.name,
      payload: new Buffer(JSON.stringify(JSON.stringify(data))),
      qos: 1,
      retain:false
    }, () => {
      log('======= message written to mqtt ==========');
      log(data)
      log('======= time taken to send ==========')
      log(Date.now() - this.timer, "ms")
      this.ready = false
      callback("data written")
    })
}


  playAction(callback) {
    if (this.actionsArray.length != undefined) {
        if (!this.ready) {
            callback(`${this.name} Not ready`)
            return
        }
        if (this.actionsArray[0] == "") {
            callback("no message");
            return
        }
        if (this.actionsArray[0] == "Cannot Repeat") {
            callback('Cannot repeat');
            return
        }

        this.write(this.actionsArray[0], (data) => {
            log(data);
            this.actionsArray.shift();
            this.ready = false;
        })
    }
}
}



var client = mqtt.connect('http://localhost');
 
client.subscribe('presence');
 
client.on('message', function(topic, message) {
  console.log(message.toString());
  console.log("from subscribed");
});

client.on('connect', function () {
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})
 
 
console.log('Client started...');


var s = {
  JOAT_CONNECT : "true",
  name : "sexcc"
}

exports.publishtMqtt = function(req,res){
  var topic = req.params.topic;
  var packet = JSON.stringify(req.body);
  client.publish(topic, packet, (result)=>{
    log(result);
    res.send(result);
  });
}

exports.pubMqtt = function (req, res){
  client.publish('10', JSON.stringify(s));
  res.send('sent')
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