//@ts-check

//NOTE: use this httpManager to communicate with the controllers

// var $ = require('jQuery')
var request = require('request');
var path = require('path');
var configManager = require("./configManager");
const g = require("../common/common")
// var config = g.configManager.configJson;
var serialController = require('../controllers/serialController')
var logController = require('../controllers/loggingController');
var eventActionController = require("../controllers/eventActionController");
var deviceManager = require('./deviceManager');
var scriptManager = require('./scriptManager');
const mediaManager = require("../managers/mediaManager");
const systemInformation = require("../controllers/systemInformation");
const shellCommands = require("../controllers/shellCommands");

var serverRoutes = {
    script: `/script`,
}

// Enable logging direct to root server
var enableHttpLog = false;


// =============================================================================== //
// ========================= Config Manager ===================================== //
// ============================================================================= //
exports.getConfig = function (req, res) {
    let conf = {}
    g.configManager.getConfig().then(c => {
        conf = c;
    }).then(() => {
        g.mediaManager.getAllMedia().then(media => {
            conf.media = media
        })
    }).then(() => {
        g.systemInformation.getInfo().then(data => {
            conf.systemInformation = data
            res.send(conf)
        })
    })
}

exports.updateConfig = function (req, res) {
    // var newConfig = req.params.config
    var newConfig = req.body;
    g.configManager.updateConfig(newConfig)
    res.send({
        "success": true,
        "config": newConfig
    })
}

exports.updateRootApi = function (req, res) {
    var newApi = req.body.api
    g.configManager.getConfig().then(currentConfig => {
        currentConfig.server_url = newApi;
        g.configManager.updateConfig(currentConfig);
    })
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
    g.eventActionController.setEventFromServer();
    g.eventActionController.forceEventFromServer(packet, (result) => {
        g.logController.log(result);
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
    g.eventActionController.forceActionFromServer(packet.actionName, packet.masterId);
    res.send("Forcing Action")
}



exports.sendEventsToServer = function (message) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'put',
            body: message,
            json: true,
            url: g.configManager.configJson.server_url + '/game/event/complete' //TODO: change from game to script
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
        var address = (g.configManager.configJson.server_url + serverRoutes.script);
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
    scriptName = path.parse(scriptName).name;
    return new Promise((resolve, reject) => {
        var address = (g.configManager.configJson.server_url + serverRoutes.script + `/${scriptName}`);
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
    g.eventActionController.resetStates(req.params.scriptName);
    res.send("States reset");
}

exports.getSelectedEventActionScript = (req, res) => {
    g.eventActionController.getSelectedScript().then((script) => {
        res.send(script);
    })
}

/** Route from root server to fetch updates on all scripts */
exports.forceEventActionScriptUpdate = function (req, res) {
    g.scriptManager.updateScriptsFromRootServer();
    res.send("Updated");
}

exports.deleteEventActionScript = function (req, res) {
    var script = req.params.scriptName;
    g.scriptManager.deleteScript(script, (m) => {
        res.send(m)
    });
}



// =============================================================================== //
// ========================= HTTP from Device manager =========================== //
// ============================================================================= //
exports.deviceManager_sendHttp = function (address, message, type = "GET", callback) {
    if (type == "GET") {
        var url = encodeURI(`${address}/?BROADCAST=${JSON.stringify(message)}`);
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


exports.deviceManager_sendHeartbeats = function (node) {
    var msg = {
        branchId: g.configManager.configJson.branchId,
        node: node
    }
    var options = {
        method: 'post',
        body: msg,
        json: true,
        url: g.configManager.configJson.server_url + "/branch/nodeUpdate"
    }
    request(options, (err, res, body) => {
        // callback(res)
    })
}






// =============================================================================== //
// ========================= HTTP for Device manager =========================== //
// ============================================================================= //

exports.deviceManager_info = function (req, res) {
    g.deviceManager.getNodeInfo(req.params.id).then(info => {
        res.send(info);
    })
}

exports.DeviceManager_createNewNode = function (req, res) {
    g.deviceManager.addNewDevice(req.body.details, req.body.type, true)
    res.send("Node created")
}

exports.DeviceManager_updateNode = function (req, res) {
    res.send("Node updated ------- TODO: NOT DONE YET")
}

exports.DeviceManager_deleteNode = function (req, res) {
    g.deviceManager.removeDevice(req.params.id);
    res.send("Node removed")
}


/** Get all master devices connected to serial */
exports.deviceManager_infoAll = function (req, res) {
    g.deviceManager.getAllNodeInfo().then(result => {
        res.send(result);
    })
}


exports.deviceManager_directMqttMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message;
    g.deviceManager.directMqttMessage(id, message, (result) => {
        res.send(result);
    })
}

exports.deviceManager_directSerialMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message
    g.deviceManager.directSerialMessage(id, message, (result) => {
        res.send(result)
    })
}

exports.deviceManager_directHTTPMessage = function (req, res) {
    var id = req.body.id;
    var message = req.body.message
    g.deviceManager.directHTTPMessage(id, message, (result) => {
        res.send(result)
    })
}




// =============================================================================== //
// ========================= Serial Controller ================================== //
// ============================================================================= //
exports.serialController_refresh = function (req, res) {
    g.serialController.generateSerialDevices();
    res.send("Refreshed");
}



// =============================================================================== //
// ========================= HTTP from Script manager =========================== //
// ============================================================================= //
exports.updateSelectedScript = function (req, res) {
    var scriptName = req.params.scriptName;
    g.scriptManager.updateSelectedScript(scriptName, (result) => {
        res.send(result);
    });
}




// =============================================================================== //
// ========================= HTTP from Logging Controller ======================= //
// ============================================================================= //
exports.sendLogToRoot = function (msg) {
    var options = {
        method: 'post',
        body: msg,
        json: true,
        url: g.configManager.configJson.server_url + "/log"
    }
    if (enableHttpLog) {
        request(options, (err, res, body) => {
            // callback(res)
        })
    }
}



// =============================================================================== //
// ========================= Shell commands ===================================== //
// ============================================================================= //
exports.shellRestartBranchServer = function (req, res) {
    res.send({ success: true })
    g.shellCommands.restartBranchServer();
}

exports.shellReloadBranchDesktop = function (req, res) {
    res.send({ success: true })
    g.shellCommands.reloadBranchDesktop();
}

exports.shellCustomCommand = function (req, res) {
    res.send({ success: true })
    g.shellCommands.customCommand(req.body.command);
}

exports.shellGitUpdate = function (req, res) {
    res.send({ success: true })
    g.shellCommands.gitUpdate();
}