//@ts-check
var EventModel = require('../models/eventModel');
var ActionModel = require('../models/actionModel');
var memoryManager = require('./memoryManager');
var EventActionScriptModel = require('../models/eventActionScriptModel');
const path = require('path');
const fs = require('fs');
const log = require('../controllers/loggingController');
const directoryPath = path.join(__dirname, '../EventActionScripts');
const jsonfile = require("jsonfile");
var configManager = require("./configManager");
const HttpManager = require('./httpManager');

var eventActionScriptList = new Array();
readScriptsInDirectory(); //TODO: put this in an init file or something

updateScriptsFromRootServer();



/** Create new script from http request */
exports.newScript = function (req, res) {
    var script = req.body.script
    console.log(req.body)
    createLocalScript(script);
    res.send({
        "message": script
    })
}

//TODO: make script updator function to fetch new scripts on startup


/** Get all json event action scripts from directory */
function readScriptsInDirectory() {
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return log.logError('Unable to scan directory: ' + err);
        }
        configManager.configJson.branch_scripts = [];
        files.forEach(function (file) {
            var script = fs.readFileSync(directoryPath + `/${file}`, 'utf8')
            var pScript = JSON.parse(script);
            eventActionScriptList.push(pScript);
            configManager.configJson.branch_scripts.push(file);
        });
    });
}
exports.readScriptsInDirectory = readScriptsInDirectory;

/**
 *Update scripts from root server.
 *Scripts are defined in config.json
 */
function updateScriptsFromRootServer() {
    eventActionScriptList = [];
    configManager.getConfig().then(config => {
        for (var scriptName of config.branch_scripts) {
            HttpManager.getRootServerScript(scriptName).then(script => {
                if (script == undefined) return;
                createLocalScript(script);
                eventActionScriptList.push(JSON.parse(script));
                console.log(script);
            })
        }
    })
}
exports.updateScriptsFromRootServer = updateScriptsFromRootServer;

function updateSelectedScript(scriptName, cb) {
    var config = configManager.configJson;
    config.selected_script = scriptName + ".json";
    configManager.updateConfig(config);
    cb("scriptUpdated");
};
exports.updateSelectedScript = updateSelectedScript;


/**
 * Creates a local copy of the script to the file directory
 *
 * @param {*} script
 */
function createLocalScript(script) {
    console.log(script);
    // script = JSON.parse(script);
    var scriptName = JSON.parse(script).name;

    jsonfile.writeFileSync(directoryPath + `/${scriptName}.json`, JSON.parse(script), {
        spaces: 2
    });
}
// ================================================
// -------------------------------------------------
// HACKS take out master id
function getScriptBymasterId(masterId) {
	masterId = 10;
    return new Promise((resolve, reject) => {

        for (let i = 0; i < eventActionScriptList.length; i++) {
            const script = eventActionScriptList[i];
            if (script.masterId == masterId) {
                resolve(script)
            }

        }
    })
}


function getScriptByName(scriptName) {
    return new Promise((resolve, reject) => {

        for (let i = 0; i < eventActionScriptList.length; i++) {
            const script = eventActionScriptList[i];
            if (script.name == scriptName) {
                resolve(script)
            }

        }
    })
}
exports.getScriptByName = getScriptByName

function deleteScript(scriptName, callback) {
    fs.unlink(directoryPath + `/${scriptName}.json`, (e) => {
        console.log("complete", e)
        readScriptsInDirectory();
        callback({
            "success": `Deleted ${scriptName}`
        });
    })
}
exports.deleteScript = deleteScript;

exports.getScriptBymasterId = getScriptBymasterId;















//NOTE: All the below is not needed -------------


/** Gets all the json file and creates Event Action objects from them */
function generateScriptObjects(file) {
    var script = fs.readFileSync(directoryPath + `/${file}`, 'utf8')
    var pScript = JSON.parse(script)
    createScriptModel(pScript)
}

/** Create script from json object */
function createScriptModel(script) {
    memoryManager.addEventActionToScript(script) //add to memory manager
    var eventActionScript = new EventActionScriptModel(script.name, script.id, script.masterId)
    script.events.forEach(event => {
        createEvent(event, (evt) => {
            eventActionScript.events.push(evt)
        })
    });
    script.actions.forEach(action => {
        createAction(action, (act) => {
            eventActionScript.actions.push(act)
        })
    });
    eventActionScriptList.push(eventActionScript)

}

/** Creates an event object */
function createEvent(event, cb) {
    var e = new EventModel(event.name)
    e.id = event.id
    e.name = event.name
    e.device_id = event.device_id
    e.event = event.event
    e.eventType = event.eventType
    e.data = event.data
    e.description = event.description
    e.dependencies = event.dependencies
    e.actions = event.actions
    e.can_toggle = event.can_toggle
    e.message = event.message
    e.state = event.state
    cb(e)
}

/** Creates an action object */
function createAction(action, cb) {
    var act = new ActionModel(action.name)
    act.id = action.id
    act.name = action.name
    act.device_id = action.device_id
    act.event = action.event
    act.eventType = action.eventType
    act.wait = action.wait
    act.data = action.data
    act.description = action.description
    act.dependencies = action.dependencies
    act.repeatable = action.repeatable
    act.actions = action.actions
    act.message = action.message
    act.state = action.state
    cb(act)
}