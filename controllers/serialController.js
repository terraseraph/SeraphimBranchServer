//@ts-check
const SerialPort = require('serialport');
// const Readline = require('parser-readline')
var Readline = SerialPort.parsers.Readline;
const log = require('./loggingController').log;
const eventActionController = require('./eventActionController')
const DeviceManager = require('../managers/deviceManager');


var tempMasterName;
//TODO: curently broadcast to all com ports the message to send.
//in the script, if it has a type send only on that, otherwise send to all.

//TODO: make a connect and disconnect for new serial devices

var nodeDeviceList = new Array() //list of the attached serial devices
generateSerialDevices() //TODO: place this function in an init controller


// TODO: CURRENTLY UNUSED MOVED TO DEVICE MANAGER!!!!
class SerialMasterNode {
    constructor(details) {
        this.comName = details.comName;
        this.baudRate = 115200;
        this.writeCount = 0;
        this.ready = false;
        this.actionsArray = new Array();

        this.timer = null
        this.port = null
        this.parser = null


        this.initialise();
    }

    initialise() {
        var masterDeviceName = this.comName
        this.timer = Date.now()
        this.port = new SerialPort(this.comName, {
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
                parseMessage(str, masterDeviceName)
            } catch (err) {
                log(err)
            }
        })
    }

    write(data, callback) {
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

    playAction(callback) {
        if (this.actionsArray.length != undefined) {
            if (!this.ready) {
                callback(`${this.comName} Not ready`)
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


exports.parseMessage = parseMessage;

//TODO: might initialise in the class
/**
 * Parse message from serial
 *
 * @param {*} packet
 * @param {*} masterDeviceName
 * @returns
 */
function parseMessage(packet, masterDeviceName) {
    if(!isJSON(packet)){
        return;
    }
    log("parsing message from: ",masterDeviceName)
    tempMasterName = masterDeviceName; // to call in the following functions
    packet = JSON.parse(packet)
    if (packet.ready == "true") {
        setDeviceReady(masterDeviceName);
        playAction(masterDeviceName);
        return;
    }
    if(packet.hasOwnProperty("heartbeat")){
        log(packet);
        return
    }
    if (packet.eventType != "noneET" && packet.hasOwnProperty("event")) { //if is event
        eventActionController.parseEvent(packet, addActionsToMasterQueue)
    }
    else if(packet.actionType != "noneAT" && packet.hasOwnProperty("action")){ //is action
        eventActionController.parseAction(packet, addActionsToMasterQueue)
    }
}


exports.addActionsToMasterQueue = addActionsToMasterQueue;

/**
 * Add actions to masters queue
 * @param {*} actionsArray The actions to add to queue
 */
function addActionsToMasterQueue(actionsArray) {
    //TODO: using the tempMasterName limits the useage to only actions on that device.. fix
    DeviceManager.nodeDeviceList.forEach(device => {
        if (device.comName == tempMasterName) {
            actionsArray.forEach(action => {
                device.actionsArray.push(action)
            });
        }
    })
}

/**
 * Sets the master device ready to receive messages
 * @param {*} name name of master device
 */
function setDeviceReady(name) {
    DeviceManager.setDeviceReady(name);
    // DeviceManager.nodeDeviceList.forEach(device => {
    //     if (device.comName == name) {
    //         device.ready = true
    //     }
    // });
}

/**
 * Plays the action queue for the device
 * @param {*} masterName Master device name
 */
function playAction(masterName) {
    // masterName.playAction((data) => {
    //     log(data)
    // })
    DeviceManager.sendAction(masterName)
}


/**
 * Generates a list of all serial devices
 */
function generateSerialDevices() {
    SerialPort.list(function (err, result) {
        log(result)
        result.forEach(device => {
            log(device)
            // var dev = new SerialMasterNode(device)
            // nodeDeviceList.push(dev)

            DeviceManager.addNewDevice(device, DeviceManager.NodeType.SERIAL, true); //add new serial devices and overwrite
        });
    })
}

function isJSON(str) {
    if (/^\s*$/.test(str)) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);

  }


/** Get all master devices connected to serial */
exports.masterDeviceInfo = function(){
    var result = {
        nodeDevices : nodeDeviceList
    }
    return result;
}


exports.sendMessageToMaster = function(masterDeviceName, message, callback){
    nodeDeviceList.forEach(device => {
        if(device.comName == masterDeviceName){
            device.write(message, (result) => {
                callback(result)
            })
        }
    })
}



