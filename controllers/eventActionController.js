//@ts-check
const $ = require('jquery');
var memoryManager = require('../managers/memoryManager')
var selectedScript = memoryManager.getSelectedScriptModule();


/**
 * 
 * State Variables
 * 
 */
var script_state = new Array(); //for dependencey updating
var completed_actions = new Array();
var non_repeatable_actions = new Array();
var fromServer = false; // if the request was from the server

/** Find the event */
exports.parseEvent = function () {

}

/** find the action */
exports.parseAction = function () {

}







//for finding event by name
function find_event(event_name) {
    console.log("==FINDING event by name===")
    for (var i = 0; i < selectedScript.events.length; i++) {
        if (selectedScript.events[i].name == event_name) {
            return selectedScript.events[i]
        }
    }
}