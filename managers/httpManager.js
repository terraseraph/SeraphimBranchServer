//@ts-check

//NOTE: use this httpManager to communicate with the controllers

const $ = require('jquery')
var config = require("./configManager").config;
var serialController = require('../controllers/serialController')
var log = require('../controllers/loggingController').log;
var EventActionController = require("../controllers/eventActionController");

var serverRoutes = {
    script : `/script`,
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



// =============================================================================== //
// ========================= JOAT Commands from root server====================== //
// ============================================================================= //

exports.serverEvent = function(req, res){
    var packet = {
        scriptName : req.body.scriptName,
        name : req.body.eventName
    }
    EventActionController.setEventFromServer();
    EventActionController.forceEvent(packet, function(actions){
        serialController.addActionsToMasterQueue(actions);
    });
}



exports.sendEventsToServer = function (message) {
    return new Promise((res, rej) => {
        $.post(config.serverUrl, message, (data) => {
            var result = { "Success": data }
            log(result)
            res(result)
        })
    })
}



// =============================================================================== //
// ========================= Event action scripts =============================== //
// ============================================================================= //
exports.getRootServerScripts = function(){
    return new Promise((resolve, reject) => {
        $.get(config.serverUrl + serverRoutes.script, function(scripts){
            resolve(scripts);
        });
    });
}

exports.getRootServerScript = function(scriptName){
    return new Promise((resolve, reject) => {
        $.get(config.serverUrl + serverRoutes.script + `/${scriptName}`, function(script){
            resolve(script);
        });
    });
}
