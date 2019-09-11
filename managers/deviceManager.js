//@ts-check
const SerialPort = require('serialport');
const EventEmitter = require('events').EventEmitter;
const async = require("async");
var Readline = SerialPort.parsers.Readline;
const log = require('../controllers/loggingController');
const SerialController = require('../controllers/serialController');
const MqttController = require('../controllers/mqttController');
const HttpManager = require('./httpManager');

var nodeDeviceList = new Array();

exports.nodeDeviceList = nodeDeviceList;
exports.addNewDevice = addNewDevice;
exports.setDeviceReady = setDeviceReady;

// Create a default device for debugging
createDefaultDevice();

function createDefaultDevice() {
    setTimeout(() => {
        var type = "default"
        var details = {
            id: "default",
            name: "default",
            ipAddress: "",
            type: "default",
            HardwareId: "default"
        }
        addNewDevice(details, NodeType.MQTT);
    }, 1000);
}


/**
 * Adds a new device to the list, with optional overwrite
 * @param {*} details
 * @param {boolean} [overwrite=false]
 */
function addNewDevice(details, type, overwrite = false) {
    var node = new NodeDevice(details, type);

    if (!nodeExists(details.id)) {
        nodeDeviceList.push(node);
    } else if (nodeExists(details.id) && overwrite) {
        findNodeIndex(details.id).then(i => {
            nodeDeviceList[i] = node;
        })
    }
}

function nodeExists(id) {
    if (nodeDeviceList.length == 0) {
        return false;
    }
    for (let node of nodeDeviceList) {
        if (node.id == id) {
            return (true);
        }

    }
    return (false);
}

function findNodeIndex(id) {
    return new Promise((resolve, reject) => {
        for (var i = 0; i < nodeDeviceList.length; i++) {
            if (nodeDeviceList[i].id == id) {
                resolve(i);
            }
        }
    })
}

/**
 * Removes a node device from the list, also handles disconnect for serial
 *
 * @param {*} deviceId
 */
function removeDevice(deviceId) {
    nodeDeviceList.forEach(device => {
        if (device.id == deviceId) {
            if (device.nodeType == NodeType.SERIAL) {
                device.serial_disconnect(cb => {
                    log.log(cb);
                    nodeDeviceList.splice(nodeDeviceList.indexOf(device), 1);
                })
            }

        }
    });
}
exports.removeDevice = removeDevice;


/**
 * Sets the device as ready to receive commands
 * Used to stop the device from getting overloaded with too many messages at once
 * @param {*} deviceName
 */
function setDeviceReady(deviceName) {
    nodeDeviceList.forEach(device => {
        if (device.name == deviceName) {
            // device.ready = true
            device.setReady();
            // device.readyEvent.emit('ready');
            // device.playAction();
        }
    });
}


/**
 *Can use to force the next action down the pipe, if the ready has not triggered it yet
 *
 * @param {*} deviceName
 */
function sendAction(deviceName) {
    nodeDeviceList.forEach(device => {
        if (device.name == deviceName) {
            device.setReady();
        }
    });
}
exports.sendAction = sendAction;


function addActionsToDeviceQueue(bridgeId, actionsArray) {

    async.eachSeries(nodeDeviceList, (device, dCallback) => {
        buildActionArrayForOneDevice(device.id, actionsArray, (deviceActions) => {
            if (deviceActions.length > 0 && deviceActions != undefined) {
                device.pushNewActions(deviceActions).then(actions => {
                    setDeviceReady(device.id);
                })
            }
        })
        dCallback();
    }, () => {
        //on done
    })

    // Send all actions to the mesh network attached
    nodeDeviceList.forEach(device => {
        if (device.name == bridgeId) {
            device.pushNewActions(actionsArray).then(actions => {
                setDeviceReady(bridgeId); //legacy
                setDeviceReady("default");
            });
        }
    });
}
exports.addActionsToDeviceQueue = addActionsToDeviceQueue;


// Build an array of actions for a single device, returns an array of actions
function buildActionArrayForOneDevice(deviceId, actionsArray, callbackActions) {
    var tempActionsArr = new Array();
    async.eachSeries(actionsArray, (action, aCallback) => {
        if (action.toId == deviceId) {
            tempActionsArr.push(action);
        }
        aCallback();
    }, () => {
        callbackActions(tempActionsArr)
    })
}

// Replacement for an enum;
const NodeType = {
    MQTT: 'mqtt',
    SERIAL: 'serial',
    HTTP: 'http'
}
exports.NodeType = NodeType;


function getAllNodeInfo() {
    return new Promise((resolve, reject) => {
        resolve(nodeDeviceList)
    })
}
exports.getAllNodeInfo = getAllNodeInfo;

function getNodeInfo(id) {
    return new Promise((resolve, reject) => {
        nodeDeviceList.forEach(device => {
            if (device.id == id) {
                resolve(device)
            }
        });
    })
}
exports.getNodeInfo = getNodeInfo;



function updateMeshHeartbeat(nodeId, heartbeatPacket) {
    getNodeInfo(nodeId).then(node => {
        node.updateHeartbeat(heartbeatPacket);
    })
}
exports.updateMeshHeartbeat = updateMeshHeartbeat;


function updateBridgeMemory(nodeId, packet) {
    getNodeInfo(nodeId).then(node => {
        node.updateBridgeStatus(packet);
    })
}
exports.updateBridgeMemory = updateBridgeMemory;

//=====================================================
//========== Direct message Handling ==================
//=====================================================

/**
 *Direct message to serial device
 *
 * @param {*} deviceId
 * @param {*} message
 * @param {*} callback
 */
function directSerialMessage(deviceId, message, callback) {
    nodeDeviceList.forEach(device => {
        if (device.id == deviceId) {
            device.serial_write(message, (result) => {
                callback(result)
            })
        }
    })
}
exports.directSerialMessage = directSerialMessage;



/**
 *Direct message to Mqtt device
 *
 * @param {*} deviceId
 * @param {*} message
 * @param {*} callback
 */
function directMqttMessage(deviceId, message, callback) {
    nodeDeviceList.forEach(device => {
        if (device.id == deviceId) {
            device.mqtt_write(message, (result) => {
                callback(result)
            })
        }
    })
}
exports.directMqttMessage = directMqttMessage;

/**
 *Direct message to Http device
 *
 * @param {*} deviceId
 * @param {*} message
 * @param {*} callback
 */
function directHTTPMessage(deviceId, message, callback) {
    nodeDeviceList.forEach(device => {
        if (device.id == deviceId) {
            device.http_write(message, (result) => {
                callback(result)
            })
        }
    })
}
exports.directHTTPMessage = directHTTPMessage;





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
        this.ready = true;
        this.actionsArray = new Array();
        this.writeCount = 0;

        // this.readyEvent = new EventEmitter;
        // this.readyEvent.on('ready', this.setReady);
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
        this.meshNodes = {};
        this.bridgeStatus = {};
        this.sendUpdates = true;
        this.heartbeatInterval = 10000;

        this.init();
    }

    init() {
        switch (this.nodeType) {
            case NodeType.MQTT:
                this.mqtt_initialise();
                break;
            case NodeType.SERIAL:
                this.serial_initialise();
                break;
            case NodeType.HTTP:
                this.http_initialise();
                break;
            default:
        }
        this.sendHeartbeatOnInterval();
    }



    write(message, callback) {
        switch (this.nodeType) {
            case NodeType.MQTT:
                this.mqtt_write(message, (cb) => {
                    callback(cb)
                });
                break;
            case NodeType.SERIAL:
                this.serial_write(message, (cb) => {
                    callback(cb)
                });
                break;
            case NodeType.HTTP:
                this.http_write(message, (cb) => {
                    callback(cb)
                });
                break;
            default:
        }
    }


    playAction() {
        switch (this.nodeType) {
            case NodeType.MQTT:
                this.mqtt_playAction((cb) => {
                    this.actionsArray.shift();
                    log.log(cb)
                });
                break;
            case NodeType.SERIAL:
                this.serial_playAction((cb) => {
                    log.log(cb)
                });
                break;
            case NodeType.HTTP:
                this.http_playAction((cb) => {
                    log.log(cb)
                });
                break;
            default:
        }
    }

    setReady() {
        this.ready = true;
        this.playAction();
        log.log("===Ready===")
    }

    updateHeartbeat(heartbeatPacket) {
        var timeNow = new Date().getTime();
        heartbeatPacket.heartbeat.lastUpdated = timeNow;
        this.meshNodes[`${heartbeatPacket.heartbeat.hardwareId}`] = heartbeatPacket.heartbeat;
    }

    sendHeartbeatOnInterval() {
        HttpManager.deviceManager_sendHeartbeats(this);
        if (this.sendUpdates) {
            setTimeout(this.sendHeartbeatOnInterval, this.heartbeatInterval);
        }
    }

    updateBridgeStatus(packet) {
        this.bridgeStatus = packet;
        // HttpManager.deviceManager_sendHeartbeats(this)
    }

    pushNewActions(newActions) {
        log.log("==================== NEW ACTIONS ====================", newActions)
        log.log("==================== ACTIONS LIST ====================", this.actionsArray)
        return new Promise((resolve, reject) => {
            this.actionsArray = this.actionsArray.concat(newActions);
            resolve(this.actionsArray);
        })
    }

    // =======================================================
    // ========= SERIAL ======================================
    // =======================================================

    serial_initialise() {
        log.log("==================== Creating Node ====================", this.details)
        var masterDeviceName = this.details.comName;
        this.id = this.details.id;
        this.name = masterDeviceName;
        this.timer = Date.now()
        this.port = new SerialPort(this.details.comName, {
            baudRate: this.baudRate,
            lock: true,
        });
        this.port.on('error', function (err) {
            log.log('Error: ', err.message);
        })
        this.parser = this.port.pipe(new Readline({
            delimiter: '\n'
        }))
        this.parser.on('data', function (data) {
            var str = data;
            str = str.toString(); //Convert to string
            str = str.replace(/\r?\n|\r/g, ""); //remove '\r' from this String
            log.log(`msg_${masterDeviceName}`, str)
            try {
                SerialController.parseMessage(str, this.name)
            } catch (err) {
                log.log(err)
            }
        })
    }

    serial_write(data, callback) {
        this.writeCount += 1
        log.log("Total writes to port: ", this.writeCount)
        log.log("===== Data to be written to serial ===== ", data)

        data = JSON.stringify(data)
        this.port.write(data + "\n", function (err) {
            if (err) {
                log.log('Error on write: ', err.message);
                return
            }
            log.log('======= message written to serial==========');
            log.log(data)
            log.log('======= time taken to send ==========')
            log.log(Date.now() - this.timer, "ms")
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
                log.log(data);
                this.actionsArray.shift();
                this.ready = false;
            })
        }
    }

    serial_disconnect(callback) {
        this.port.close(cb => {
            callback(cb)
        })
    }

    // =======================================================
    // ========= MQTT ========================================
    // =======================================================

    mqtt_initialise() {
        this.name = this.details.name;
        this.id = this.details.id;
        this.ipAddress = this.details.ipAddress
        var branchDetails = {
            branchIp: "0.0.0.0",
            branchName: "somebranch name",
            usingScript: "script name"
        }
        // publish branch details to the node
        MqttController.server.publish({
            topic: this.details.name,
            payload: Buffer.from(JSON.stringify(branchDetails)),
            qos: 1,
            retain: false
        }, () => { })
        log.log("================ created node =================")
    }

    mqtt_write(data, callback) {
        this.writeCount += 1
        log.log("Total writes to this node: ", this.writeCount)

        MqttController.server.publish({
            topic: this.details.name,
            payload: Buffer.from(JSON.stringify(data)),
            qos: 1,
            retain: false
        }, () => {
            log.log('======= message written to mqtt ==========');
            log.log(data)
            log.log('======= time taken to send ==========')
            log.log(Date.now() - this.timer, "ms")
            callback(data)
        })
    }


    mqtt_playAction(callback) {
        if (this.actionsArray.length != undefined) {
            if (this.actionsArray.length == 0) {
                callback("No actions");
                return;
            }
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
            var action = this.actionsArray[0];
            this.mqtt_write(action, (data) => {
                console.log("===== SENDING MQTT ========", action);
                console.log("===== Actions array ========", this.actionsArray);

                // log.log(data);
                // this.actionsArray.shift();
                this.ready = false;
                callback(data);
            })
        }
    }


    // =======================================================
    // ========= HTTP ========================================
    // =======================================================
    http_initialise() {
        this.name = this.details.name;
        this.id = this.details.id;
        this.ipAddress = this.details.ipAddress;
        var branchDetails = {
            branchIp: "0.0.0.0",
            branchName: "somebranch name",
            usingScript: "script name"
        }
        // publish branch details to the node
        HttpManager.deviceManager_sendHttp("http://" + this.ipAddress, JSON.stringify(branchDetails), "GET", (data) => {
            log.log("================ created node =================")
            log.log(data);
        });
    }

    http_write(data, callback) {
        this.writeCount += 1
        log.log("Total writes to this node: ", this.writeCount)

        HttpManager.deviceManager_sendHttp("http://" + this.ipAddress, data, "GET", (data) => {

            log.log('======= message written to http ==========');
            log.log(data)
            log.log('======= time taken to send ==========')
            log.log(Date.now() - this.timer, "ms")
            // this.ready = false
            callback("data written")
        });
    }


    http_playAction(callback) {
        if (this.actionsArray.length != undefined) {
            // if (!this.ready) {
            //     callback(`${this.details.name} Not ready`)
            //     return
            // }
            if (this.actionsArray[0] == "") {
                callback("no action");
                return
            }
            if (this.actionsArray[0] == "Cannot Repeat") {
                callback('Cannot repeat');
                return
            }

            this.http_write(this.actionsArray[0], (data) => {
                log.log(data);
                this.actionsArray.shift();
                // this.ready = false;
            })
        }
    }

}