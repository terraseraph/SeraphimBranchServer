//@ts-check
const $ = require('jquery');
var memoryManager = require('../managers/memoryManager');
var log = require('./loggingController').log;
var selectedScript = memoryManager.getSelectedScriptModule();


/**
 * 
 * State Variables
 * 
 */
var script_state = new Array(); //for dependencey updating
var completed_actions = new Array();
var non_repeatable_actions = new Array();
var fromServer = false; // if the request was from the server //TODO: rename to skip dependencies

/** Skip dependencey check */
exports.setEventFromServer = function(){
    fromServer = true;
}

/** Find the event */
exports.parseEvent = function (packet) {
    var sScript = selectedScript(); //selected script
    var actions_arr = new Array()
    find_event(packet.events.name, (evt) => {
        if ((evt.device_id == packet.fromId) && (evt.event == packet.event) && (arrays_equal(evt.data, packet.data) || evt.data == packet.data)){
            log("script_state: ", script_state)
            log("non_repeatable_actions: ", non_repeatable_actions)
            //dependencies are met or skipped if fromServer (http request)
            if (dependencies_check(evt) || fromServer){
                //First time event triggering
                scriptStateValidation(evt, (result) => {
                    if(result){
                        evt.branch_name = sScript.branch_name;
                        /** SEND EVENT TO SERVER HERE send(evt) */
                        log("=======SENT TO SERVER=====", evt)
                        eventStateSpecialActions(evt);
                        log("message :", evt.message)
                        if(evt.actions.length > 0){
                            for (var j = 0 ; j < evt.actions.length; j++){
                                playAction(evt.actions[j], function(result){
                                    actions_arr.push(result)
                                })
                            }
                            callback(actions_arr)
                        }

                    }
                })
            }
            
        }


    })
}

/** find the action */
exports.parseAction = function (packet) {

}

/**
 * //Prepare action
 * @param {*} act 
 * @param {*} cb 
 */
function playAction(act, cb){

}

/**
 * Send the message to serial
 * @param {*} obj 
 */
function sendToSerial(obj){

}

/**
 * Send the Master server the object too for logging
 * @param {*} obj 
 */
function sendToServer(obj){

}

/**
 * Check of the script has been added
 * @param {*} evt 
 * @param {*} cb 
 */
function scriptStateValidation(evt, cb){
    var result = false
    if (!script_state.includes(evt.state)){
        script_state.push(evt.state)
        result = true
        cb(result)
    }
    // If the state has already been triggered 'can_toggle' allows it again
    else if(script_state.includes(evt.state) && evt.can_toggle == "true"){
        result = true
        cb(result)
    }
    else{
        cb(result)
    }
}

/**
 * Checks for states in the config, ie end_script, start_script
 * @param {*} evt 
 */
function eventStateSpecialActions(evt){ //TODO:make it check config
    if(evt.state == "end_script"){
        script_state = new Array();
        log("ENDING Script script_state:", script_state)
    }
}



/**
 * Check if the action to take has dependencies
 * @param {*} obj 
 */
function dependencies_check(obj){
    console.log("======== dependencies_check() ========")
    var dependencies_ok;
    if(obj.dependencies.length > 0){
        for (var x = 0 ; x < obj.dependencies.length; x++){
                if (game_state.indexOf(obj.dependencies[x]) !== -1){
                    dependencies_ok = true;
                    console.log("dependencies met: ", obj.dependencies[x])
                }
                else{
                    dependencies_ok = false;
                    console.log("===== All Dependencies not met ====")
                    break;
                }
            }
        }
    else{
        dependencies_ok = true;
    }
    if (dependencies_ok) console.log("===== All Dependencies met ====");
    return dependencies_ok
}


/**
 * for finding event by name
 * @param {string} event_name 
 * @param {*} cb 
 */
function find_event(event_name, cb) {
    console.log("==FINDING event by name===")
    for (var i = 0; i < selectedScript().events.length; i++) {
        if (selectedScript().events[i].name == event_name) {
            cb(selectedScript().events[i])
        }
    }
}

/**
 * If the data is a string array, compare them here
 * @param {Array} a 
 * @param {Array} b 
 */
function arrays_equal(a, b) {
    console.log("array comapre")
    return JSON.stringify(a) == JSON.stringify(b);

}