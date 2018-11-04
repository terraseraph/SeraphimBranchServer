//@ts-check
var EventModel = require('../models/eventModel')
var ActionModel = require('../models/actionModel')
var memoryManager = require('./memoryManager')
var EventActionScriptModel = require('../models/eventActionScriptModel')
const path = require('path');
const fs = require('fs');
const directoryPath = path.join(__dirname, '../EventActionScripts');

var eventActionScriptList = new Array();
readScriptsInDirectory(); //TODO: put this in an init file or something


/** Create new script from http request */
exports.newScript = function(req, res){
    var script = req.body
    createScriptModel(script)
    res.send({"message":script})
}


/** Get all json event action scripts from directory */
function readScriptsInDirectory() {
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (file) {
            generateScriptObjects(file)
        });
    });
}

/** Gets all the json file and creates Event Action objects from them */
function generateScriptObjects(file) {
    var script = fs.readFileSync(directoryPath + `/${file}`, 'utf8')
    var pScript = JSON.parse(script)
    createScriptModel(pScript)
}

/** Create script from json object */
function createScriptModel(script){
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
