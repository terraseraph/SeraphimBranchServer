//@ts-check
const SerialPort = require('serialport');
const Readline = require('parser-readline')
const log = require('./loggingController').log;
const eventActionController = require('./eventActionController')


var tempMasterName;
//TODO: curently broadcast to all com ports the message to send.
//in the script, if it has a type send only on that, otherwise send to all.

//TODO: make a connect and disconnect for new serial devices

var masterDeviceList = new Array() //list of the attached serial devices
generateSerialDevices() //TODO: place this function in an init controller



class MasterDevices {
    constructor(details) {
        this.comName = details.comName;
        this.baudRate = 115200;
        this.writeCount = 0;
        this.ready = false;
        this.actionsArray = new Array();
        this.initialise();
    }

    initialise() {
        var masterDeviceName = this.comName
        this.timer = Date.now()
        this.port = new SerialPort(this.comName, {
            baudRate: this.baudRate,
            lock: true,
        });
        this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }))
        this.port.on('error', function (err) {
            log('Error: ', err.message);
        })
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

//TODO: might initialise in the class
function parseMessage(packet, masterDeviceName) {
    var len = packet.length - 1
    if (packet[0] != "{" && packet[len] != "}") { //TODO: if json parsing errors check this....
        return;
    }
    log(masterDeviceName)
    tempMasterName = masterDeviceName; // to call in the following functions
    packet = JSON.parse(packet)
    if (packet.ready == "true") {
        setDeviceReady(masterDeviceName);
        playAction(masterDeviceName);
        return;
    }
    if (packet.eventType != "noneET") { //if is event
        eventActionController.parseEvent(packet, addActionsToMasterQueue)
    }
    else { //is action
        eventActionController.parseAction(packet, addActionsToMasterQueue)
    }
}

/**
 * Add actions to masters queue
 * @param {*} actionsArray The actions to add to queue
 */
function addActionsToMasterQueue(actionsArray) {
    //TODO: using the tempMasterName limits the useage to only actions on that device.. fix
    masterDeviceList.forEach(device => {
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
    masterDeviceList.forEach(device => {
        if (device.comName == name) {
            device.ready = true
        }
    });
}

/**
 * Plays the action queue for the device
 * @param {*} masterName Master device name
 */
function playAction(masterName) {
    masterName.playAction((data) => {
        log(data)
    })
}


/**
 * Generates a list of all serial devices
 */
function generateSerialDevices() {
    SerialPort.list(function (err, result) {
        log(result)
        result.forEach(device => {
            log(device)
            var dev = new MasterDevices(device)
            masterDeviceList.push(dev)
        });
    })
}


/** Get all master devices connected to serial */
exports.masterDeviceInfo = function(){
    var result = {
        masterDevices : masterDeviceList
    }
    return result;
}


exports.sendMessageToMaster = function(masterDeviceName, message, callback){
    masterDeviceList.forEach(device => {
        if(device.comName == masterDeviceName){
            device.write(message, (result) => {
                callback(result)
            })
        }
    })
}



