//@ts-check
const SerialPort = require('serialport');
var Readline = SerialPort.parsers.Readline;
const log = require('../controllers/loggingController').log;
const SerialController = require('../controllers/serialController');
const MqttController = require('../controllers/mqttController');

var nodeDeviceList = new Array();
exports.nodeDeviceList = nodeDeviceList;

exports.addNewDevice = addNewDevice;

/**
 * Adds a new device to the list, with optional overwrite
 * @param {*} details
 * @param {boolean} [overwrite=false]
 */
function addNewDevice(details, type, overwrite = false){
    var node = new NodeDevice(details, type);
    for( var i = 0 ; i < nodeDeviceList.length; i++){
        if ( nodeDeviceList[i].name === details.name){
            if(overwrite){
                // nodeDeviceList.splice(i, 1);
                nodeDeviceList[i] = node;
            }
            else{
                log('already exists, skipping')
                continue;
            }
        }
        else{
            nodeDeviceList.push(node);
            log('Adding new device', node)
        }
    }
}


function setDeviceReady(deviceName){
    nodeDeviceList.forEach(device => {
        if (device.name == deviceName) {
            device.ready = true
            device.playAction();
        }
    });
}
exports.setDeviceReady = setDeviceReady;

/**
 *Can use to force the next action down the pipe, if the ready has not triggered it yet
 *
 * @param {*} deviceName
 */
function sendAction(deviceName){
    nodeDeviceList.forEach(device => {
        if (device.name == deviceName) {
            device.playAction();
        }
    });
}
exports.sendAction = sendAction;

// Replacement for an enum;
const NodeType = {
    MQTT : 'mqtt',
    SERIAL : 'serial',
    HTTP : 'http'
}
exports.NodeType = NodeType;


function getNodeInfo(){
    var result = {
        nodeDevices : nodeDeviceList
    }
    return result;
}
exports.getNodeInfo = getNodeInfo;



/**
 * Creates a Node device object
 * Can handle MQTT, Serial, HTTP*(pending)
 * 
 * details are an object provided by either the serial controller or mqtt controller
 * pending HTTP implementation
 * @class NodeDevice
 */
class NodeDevice {
    constructor(details, nodeType) {

        // Mqtt details
        this.name = ""; //the topic to publish to
        this.ipAddress = ""; // the nodes ip address probably
        this.id = null;
        this.ready = false;
        this.actionsArray = new Array();
        this.writeCount = 0;
        // ==============


        // Serial details
        this.name = "";
        this.comName = "";
        this.baudRate = 115200;
        this.writeCount = 0;

        this.timer = null
        this.port = null
        this.parser = null
        // ================
        
        this.nodeType = nodeType;
        this.details = details;
        
        this.init();
    }

    init(){
        switch(this.nodeType){
            case NodeType.MQTT:
                this.mqtt_initialise();
            break;
            case NodeType.SERIAL:
                this.serial_initialise();
            break;
            case NodeType.HTTP:
            break;
            default:
        }
    }

    write(message, callback){
        switch(this.nodeType){
            case NodeType.MQTT:
                this.mqtt_write(message, (cb) =>{
                    callback(cb)
                });
            break;
            case NodeType.SERIAL:
                this.serial_write(message, (cb) =>{
                    callback(cb)
                });
            break;
            case NodeType.HTTP:
            break;
            default:
        }
    }

    setReady(){
        this.ready = true;
        this.playAction();
    }

    playAction(){
        switch(this.nodeType){
            case NodeType.MQTT:
                this.mqtt_playAction((cb) =>{
                    log(cb)
                });
            break;
            case NodeType.SERIAL:
                this.serial_playAction((cb) =>{
                    log(cb)
                });
            break;
            case NodeType.HTTP:
            break;
            default:
        }
    }

    // =======================================================
    // ========= SERIAL ======================================
    // =======================================================

    serial_initialise() {
        log("==================== Creating Node ====================", this.details)
        var masterDeviceName = this.details.comName
        this.name = masterDeviceName;
        this.timer = Date.now()
        this.port = new SerialPort(this.details.comName, {
            baudRate: this.baudRate,
            lock: true,
        });
        this.port.on('error', function (err) {
            log('Error: ', err.message);
        })
        this.parser = this.port.pipe(new Readline({ delimiter: '\n' }))
        this.parser.on('data', function (data) {
            var str = data;
            str = str.toString(); //Convert to string
            str = str.replace(/\r?\n|\r/g, ""); //remove '\r' from this String
            log(`msg_${masterDeviceName}`, str)
            try {
                SerialController.parseMessage(str, this.name)
            } catch (err) {
                log(err)
            }
        })
    }

    serial_write(data, callback) {
        this.writeCount += 1
        log("Total writes to port: ", this.writeCount)
        log("===== Data to be written to serial ===== ", data)

        data = JSON.stringify(data)
        this.port.write(data + "\n", function (err) {
            if (err) {
                log('Error on write: ', err.message);
                return
            }
            log('======= message written to serial==========');
            log(data)
            log('======= time taken to send ==========')
            log(Date.now() - this.timer, "ms")
            this.ready = false
            callback("data written")
        });
    }

    serial_playAction(callback) {
        if (this.actionsArray.length != undefined) {
            if (!this.ready) {
                callback(`${this.comName} Not ready`)
                return
            }
            if (this.actionsArray[0] == "") {
                callback("no action");
                return
            }
            if (this.actionsArray[0] == "Cannot Repeat") {
                callback('Cannot repeat');
                return
            }

            this.serial_write(this.actionsArray[0], (data) => {
                log(data);
                this.actionsArray.shift();
                this.ready = false;
            })
        }
    }

    // =======================================================
    // ========= MQTT ========================================
    // =======================================================

    mqtt_initialise(){
        var branchDetails = {
          branchIp : "0.0.0.0",
          branchName: "somebranch name",
          usingScript: "script name"
        }
        // publish branch details to the node
        MqttController.server.publish({
          topic: this.details.name,
          payload: Buffer.from(JSON.stringify(branchDetails)),
          qos: 1,
          retain:false
        }, () => {})
        log("================ created node =================")
      }
    
      mqtt_write(data, callback) {
        this.writeCount += 1
        log("Total writes to this node: ", this.writeCount)
    
        MqttController.server.publish({
          topic: this.details.name,
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
    
    
      mqtt_playAction(callback) {
        if (this.actionsArray.length != undefined) {
            if (!this.ready) {
                callback(`${this.details.name} Not ready`)
                return
            }
            if (this.actionsArray[0] == "") {
                callback("no action");
                return
            }
            if (this.actionsArray[0] == "Cannot Repeat") {
                callback('Cannot repeat');
                return
            }
    
            this.mqtt_write(this.actionsArray[0], (data) => {
                log(data);
                this.actionsArray.shift();
                this.ready = false;
            })
        }
    }


}