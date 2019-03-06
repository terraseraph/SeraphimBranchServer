//@ts-check

//NOTE: use this httpManager to communicate with the controllers

// var $ = require('jQuery')
var request = require('request');
var config = require("./configManager").configJson;
var serialController = require('../controllers/serialController')
var log = require('../controllers/loggingController').log;
var EventActionController = require("../controllers/eventActionController");
var DeviceManager = require('./deviceManager');
var ScriptManager = require('./scriptManager');

var serverRoutes = {
    script: `/script`,
}






// =============================================================================== //
// ========================= JOAT Commands from root server====================== //
// ============================================================================= //

exports.serverEvent = function (req, res) {
    var packet = {
        scriptName: req.body.scriptName,
        name: req.body.eventName,
        masterId: req.body.masterId
    }
    EventActionController.setEventFromServer();
    EventActionController.forceEventFromServer(packet, (result) => {
        log(result);
    });
    res.send({
        success: true
    });
}

exports.serverAction = function (req, res) {
    var packet = {
        scriptName: req.body.scriptName,
        actionName: req.body.actionName,
        masterId: req.body.masterId
    }
    EventActionController.forceActionFromServer(packet.actionName, packet.masterId);
    res.send("Forcing Action")
}



exports.sendEventsToServer = function (message) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'put',
            body: message,
            json: true,
            url: config.server_url + '/game/event/complete' //TODO: change from game to script
        }
        request(options, (err, res, body) => {
            var result = {
                "Success": res,
                "body": body
            }
            resolve(result)
        })
    })
}



// =============================================================================== //
// ========================= Event action scripts =============================== //
// ============================================================================= //
exports.getRootServerScripts = function () {
    return new Promise((resolve, reject) => {
        var address = (config.server_url + serverRoutes.script);
        var options = {
            method: 'get',
            url: address
        }
        request(options, (err, res, body) => {
            resolve(body)
        })
    });
}

exports.getRootServerScript = function (scriptName) {
    return new Promise((resolve, reject) => {
        var address = (config.server_url + serverRoutes.script + `/${scriptName}`);
        var options = {
            method: 'get',
            url: address
        }
        request(options, (err, res, body) => {
            resolve(body)
        })
    });
}

exports.resetEventActionStates = (req, res) => {
    EventActionController.resetStates(req.params.scriptName);
    res.send("States reset");
}

exports.getSelectedEventActionScript = (req, res) => {
    EventActionController.getSelectedScript().then((script) => {
        res.send(script);
    })
}

/** Route from root server to fetch updates on all scripts */
exports.forceEventActionScriptUpdate = function (req, res) {
    ScriptManager.updateScriptsFromRootServer();
    res.send("Updated");
}

exports.deleteEventActionScript = function (req, res) {
    var script = req.params.scriptName;
    ScriptManager.deleteScript(script, (m) => {
        res.send(m)
    });
}



// =============================================================================== //
// ========================= HTTP from Device manager =========================== //
// ============================================================================= //
exports.deviceManager_sendHttp = function (address, message, type = "GET", callback) {
    if (type == "GET") {
        var url = encodeURI(`${address}/?BROADCAST=${JSON.stringify(message)}`);
        log(url);
        request
            .get(url)
            .on('response', function (response) {
                callback(response);
            })
    } else if (type == "POST") {
        var options = {
            method: 'post',
            body: message,
            json: true,
            url: address
        }
        request(options, (err, res, body) => {
            callback(res)
        })
    }
}






// =============================================================================== //
// ========================= HTTP for Device manager =========================== //
// ============================================================================= //

exports.deviceManager_info = function (req, res) {
    DeviceManager.getNodeInfo(req.params.id).then(info => {
        res.send(info);
    })
}

exports.DeviceManager_createNewNode = function (req, res) {
    DeviceManager.addNewDevice(req.body.details, req.body.type, true)
    res.send("Node created")
}

exports.DeviceManager_updateNode = function (req, res) {
    res.send("Node updated ------- TODO: NOT DONE YET")
}

exports.DeviceManager_deleteNode = function (req, res) {
    DeviceManager.removeDevice(req.params.id);
    res.send("Node removed")
}


/** Get all master devices connected to serial */
exports.deviceManager_infoAll = function (req, res) {
    DeviceManager.getAllNodeInfo().then(result => {
        res.send(result);
    })
}


exports.deviceManager_directMqttMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message;
    DeviceManager.directMqttMessage(id, message, (result) => {
        res.send(result);
    })
}

exports.deviceManager_directSerialMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message
    DeviceManager.directSerialMessage(id, message, (result) => {
        res.send(result)
    })
}

exports.deviceManager_directHTTPMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message
    DeviceManager.directHTTPMessage(id, message, (result) => {
        res.send(result)
    })
}




// =============================================================================== //
// ========================= Serial Controller ================================== //
// ============================================================================= //
exports.serialController_refresh = function (req, res) {
    serialController.generateSerialDevices();
    res.send("Refreshed");
}



// =============================================================================== //
// ========================= HTTP from Script manager =========================== //
// ============================================================================= //
exports.updateSelectedScript = function (req, res) {
    var scriptName = req.params.scriptName;
    ScriptManager.updateSelectedScript(scriptName, (result) => {
        res.send(result);
    });
}