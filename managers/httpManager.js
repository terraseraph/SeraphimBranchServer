//@ts-check

//NOTE: use this httpManager to communicate with the controllers

const $ = require('jquery')
var config = require("./configManager").getConfig();
var serialController = require('../controllers/serialController')
var log = require('../controllers/loggingController').log;

exports.sendEventsToServer = function (message) {
    return new Promise((res, rej) => {
        $.post(config.serverUrl, message, (data) => {
            var result = { "Success": data }
            log(result)
            res(result)
        })
    })
}

/** Get all master devices connected to serial */
exports.getAllMasterDeviceInfo = function(req, res){
    res.send(serialController.masterDeviceInfo())
}

/** Send message to serial device */
exports.sendMessageToMasterSerial = function(req, res){
    var deviceName = req.params.deviceName;
    var message = req.params.message
    serialController.sendMessageToMaster(deviceName, message, (result) => {
        res.send(result)
    })
}