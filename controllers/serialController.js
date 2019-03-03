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
// generateSerialDevices() //TODO: place this function in an init controller


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
    if (!isJSON(packet)) {
        return;
    }
    log("parsing message from: ", masterDeviceName)
    tempMasterName = masterDeviceName; // to call in the following functions
    packet = JSON.parse(packet)
    if (packet.ready == "true") {
        setDeviceReady(masterDeviceName);
        playAction(masterDeviceName);
        return;
    }
    if (packet.hasOwnProperty("heartbeat")) {
        log(packet);
        return
    }
    if (packet.eventType != "noneET" && packet.hasOwnProperty("event")) { //if is event
        eventActionController.parseEvent(packet, addActionsToMasterQueue)
    } else if (packet.actionType != "noneAT" && packet.hasOwnProperty("action")) { //is action
        eventActionController.parseAction(packet, masterDeviceName, addActionsToMasterQueue)
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
            device.id = device.comName;

            DeviceManager.addNewDevice(device, DeviceManager.NodeType.SERIAL, true); //add new serial devices and overwrite
        });
    })
}
exports.generateSerialDevices = generateSerialDevices;

function isJSON(str) {
    if (/^\s*$/.test(str)) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);

}


/** Get all master devices connected to serial */
exports.masterDeviceInfo = function () {
    var result = {
        nodeDevices: nodeDeviceList
    }
    return result;
}