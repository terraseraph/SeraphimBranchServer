//@ts-check
const SerialPort = require('serialport');
const Readline = require('parser-readline')
const log = require('./loggingController').log;
const eventActionController = require('./eventActionController')

//TODO: curently broadcast to all com ports the message to send.
//in the script, if it has a type send only on that, otherwise send to all.

var masterDeviceList = new Array() //list of the attached serial devices
generateSerialDevices() //TODO: place this function in an init controller



class MasterDevices {
    constructor(details) {
        this.comName = details.comName;
        this.baudRate = 115200;
        this.writeCount = 0;
        this.ready = false;
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

    
}

//might initialise in the class
function parseMessage(packet, masterDeviceName) {
    var len = packet.length - 1
    if (packet[0] != "{" && packet[len] != "}") { //TODO: if json parsing errors check this....
        return;
    }
    log(masterDeviceName)
    packet = JSON.parse(packet)
    if (packet.ready == "true") { setDeviceReady(masterDeviceName) }
    if (packet.eventType != "noneET") { eventActionController.parseEvent(packet) }
    else { eventActionController.parseAction(packet) }


}

function setDeviceReady(name){
    masterDeviceList.forEach(device => {
        if(device.comName == name){
            device.ready = true
        }
    });
}

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



