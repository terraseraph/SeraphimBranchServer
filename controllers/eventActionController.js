//@ts-check
// const $ = require('jquery');
var memoryManager = require('../managers/memoryManager');
var ScriptManager = require('../managers/scriptManager');
var httpManager = require('../managers/httpManager')
var log = require('./loggingController');
var DeviceManager = require('../managers/deviceManager');
var script;

var actions_array = new Array()
/**
 * 
 * State Variables
 * 
 */
var script_state = new Array(); //for dependencey updating
var completed_actions = new Array();
var non_repeatable_actions = new Array();
var fromServer = false; // if the request was from the server //TODO: rename to skip dependencies
getSelectedScript();

/** Skip dependencey check */
exports.setEventFromServer = function () {
    fromServer = true;
}

/** Find the event */
exports.parseEvent = function (packet, bridgeId, callback) {
    ScriptManager.getScriptBymasterId(bridgeId).then((selectedScript) => {

        // TODO: get bridge id and compare it to the script it is supposed to read
        // selectedScript = memoryManager.getSelectedScript();
        var actionsArr = new Array()
        findEvent(packet, selectedScript, false)
            .then((evt) => {
                log.log("script_state: ", script_state)
                log.log("non_repeatable_actions: ", non_repeatable_actions)
                /*dependencies are met or skipped if fromServer (http request)*/
                checkStateDependencies(evt).then(depMet => {
                    if (!depMet) {
                        callback(actionsArr)
                        return;
                    }
                    /*Dependencies are met, check if the event is in the script_state*/
                    setScriptStates(evt).then(() => {
                        evt.branch_name = selectedScript.name; //Attach the branch name
                        sendToServer(evt, selectedScript.states).then(result => {
                            // log(result);
                        });
                        processActionsArray(evt.actions, bridgeId, (actArr) => {
                            addActionsToMasterQueue(actArr, bridgeId);
                            callback(actArr);
                        })
                    })
                })
            })
    })
}




exports.forceEventFromServer = function (eventPacket, callback) {
    let bridgeId = eventPacket.masterId;
    let evtName = eventPacket.name;
    let ScriptName = eventPacket.scriptName;
    this.forceEvent(evtName, bridgeId, (actions) => {
        // addActionsToMasterQueue(actions, bridgeId);
        callback({
            actions: actions
        })
    })

}

/** Force event by name */
exports.forceEvent = function (eventName, bridgeId, callback) {
    ScriptManager.getScriptBymasterId(bridgeId).then((selectedScript) => {

        // selectedScript = memoryManager.getSelectedScript();
        var actionsArr = new Array()
        findEvent(eventName, selectedScript, true).then(evt => {
            setScriptStates(evt).then(() => {
                evt.branch_name = selectedScript.name; //Attach the branch name
                sendToServer(evt, selectedScript.states).then(result => {
                    // log(result);
                });
                processActionsArray(evt.actions, bridgeId, (actArr) => {
                    addActionsToMasterQueue(actArr, bridgeId);
                    callback(actArr);
                })
            })


        })
    })
}


function processActionsArray(actions, bridgeId, callback) {
    let actionsArr = new Array();
    if (actions.length > 0) {
        for (var j = 0; j < actions.length; j++) {
            findAction(actions[j], bridgeId).then((act) => {
                playAction(act, function (result) {
                    actionsArr.push(result);
                    if (j == actions.length) {
                        // addActionsToMasterQueue(actions, bridgeId);
                        callback(actionsArr)
                    }
                })
            })
        }
    }
}



/** find the action */
exports.parseAction = function (packet, bridgeId, callback) {
    var actions_arr
    log.log("============ACTION=================")
    log.log(packet.fromId, packet.action, packet.actionType, packet.data)
    //find the matching action
    //maybe just send the action name from the server and parse it here....
    findAction(packet.action, bridgeId).then((act) => {
        log.log(act.message)
        if (act.dependencies.length != 0) {
            forceAction(act, bridgeId, function (result) {
                actions_arr = result
                log.log("====Forced actions=====")
                log.log("actions_arr= ", actions_arr)
                callback(actions_arr)
            })
        } else {
            playAction(act, function (result) {
                actions_arr.push(result);
                callback(actions_arr)
            })
        }
    })
}


/**
 * Forces the action, rather than checking for dependencies
 * @param {*} obj json object 
 * @param {*} callback array of actions as callback
 */
function forceAction(obj, bridgeId, callback) {
    var actions_to_complete = new Array();
    log.log("DEPECNDENCIES : ", obj.dependencies)
    if (obj.dependencies.length < 1 || !obj.dependencies) {
        callback("no dependencies")
        return
    }
    for (var i = 0; i < obj.dependencies.length; i++) {
        var dep = obj.dependencies[i]
        if (!non_repeatable_actions.includes(dep)) {
            findAction(dep, bridgeId).then((act) => {
                log.log("dependencey name: ", dep)
                playAction(act, function (result) {
                    actions_to_complete.push(result);
                })
            })
        }
    }
    callback(actions_to_complete)
}

function forceActionFromServer(actionName, bridgeId) {
    ScriptManager.getScriptBymasterId(bridgeId).then((selectedScript) => {
        var actArr = new Array();
        findAction(actionName, bridgeId).then((act) => {
            playAction(act, function (result) {
                actArr.push(result);
                addActionsToMasterQueue(actArr, bridgeId);
            })
        })
    })
}
exports.forceActionFromServer = forceActionFromServer;


/**
 * //Prepare action
 * @param {*} action action to find and do 
 * @param {*} callback callback
 */
function playAction(action, callback) {
    log.log("======= play_action() ===========")
    log.log("=======Checking Action Dependencies ======")
    log.log(action)
    let result = makeActionPacket(action);

    if (action.repeatable == true) {
        callback(result)
        return
    }
    if (!action.hasOwnProperty("repeatable")) {
        callback(result)
        return
    }

    if (non_repeatable_actions.includes(action.name)) {
        callback("Cannot Repeat")
        return
    }
    if (action.repeatable == false && !non_repeatable_actions.includes(action.name)) {
        non_repeatable_actions.push(action.name)
        log.log("pushed non_repeatable_actions()")
        callback(result)
        return
    }
    log.log("play_action ===CANNOT FIND===")
}


function makeActionPacket(action) {
    let result = {
        toId: Number(action.device_id),
        state: {
            type: "action",
            message: {
                toId: Number(action.device_id),
                wait: action.wait,
                event: action.event,
                eventType: action.eventType,
                action: action.action,
                actionType: action.actionType,
                data: action.data
            }
        }
    }
    return result;
}

/**
 * Send the Master server the object too for logging
 * @param {*} event 
 */
function sendToServer(event, states) {
    return new Promise((resolve, reject) => {
        var packet = {
            event: event,
            states: states
        }
        log.log("===Sending packet to server ===", packet);
        httpManager.sendEventsToServer(packet)
            .then((data) => {
                resolve(data)
            })
    })
}

/**
 * Check if the script state has been added
 * @param {*} evt 
 * @param {*} cb 
 */
function scriptStateValidation(evt, cb) {
    var result = false
    if (!script_state.includes(evt.state)) {
        script_state.push(evt.state)
        result = true
        cb(result)
    }
    // If the state has already been triggered 'can_toggle' allows it again
    else if (script_state.includes(evt.state) && evt.can_toggle == "true") {
        result = true
        cb(result)
    } else {
        cb(result)
    }
}




/**
 * Checks for states in the config, ie end_script, start_script [DEPRECATED]
 * @param {*} evt 
 */
function eventStateSpecialActions(evt) { //TODO:make it check config
    if (evt.state == "end_script") {
        script_state = new Array();
        log.log("ENDING Script script_state:", script_state)
    }
}



/**
 * Check if the action to take has dependencies
 * @param {*} obj 
 */
function dependenciesCheck(obj) {
    log.log("======== dependencies_check() ========")
    var dependencies_ok;
    if (obj.dependencies.length > 0) {
        for (var x = 0; x < obj.dependencies.length; x++) {
            if (script_state.indexOf(obj.dependencies[x]) !== -1) {
                dependencies_ok = true;
                log.log("dependencies met: ", obj.dependencies[x])
            } else {
                dependencies_ok = false;
                log.log("===== All Dependencies not met ====")
                break;
            }
        }
    } else {
        dependencies_ok = true;
    }
    if (dependencies_ok) log.log("===== All Dependencies met ====");
    return dependencies_ok
}


// =======================================================
// ========= SEARCH EVENT ACTION =========================
// =======================================================



/**
 * Find event by name, Returns a promise
 * @param {*} packet Event name to find
 */
function findEvent(packet, script, findByName = false) {
    log.log("============== Searching Selected Script =============");
    log.log(script.name);
    var evt;
    return new Promise((resolve, reject) => {
        if (findByName) {
            script.events.forEach(event => {
                if (event.name == packet) {
                    resolve(event);
                    return;
                }
            });
        } else {
            for (var i = 0; i < script.events.length; i++) {
                evt = script.events[i]
                if ((evt.device_id == packet.fromId) && (evt.event == packet.event) && (arraysEqual(evt.data, packet.data) || evt.data == packet.data)) {
                    log.log("script state: ", script_state)
                    log.log("non_repeatable_actions: ", non_repeatable_actions)
                    resolve(evt);
                    return;
                }
            }
        }
        log.log("====== Cannot find matching event ========")
    })
}



/**
 * Find action
 * @param {*} actionName 
 */
function findAction(actionName, masterId) {
    return new Promise((resolve, reject) => {
        ScriptManager.getScriptBymasterId(masterId).then((selectedScript) => {

            // selectedScript = memoryManager.getSelectedScript();
            selectedScript.actions.forEach(act => {
                if (act.name == actionName) {
                    log.log("=====FIND ACTION===", act)
                    resolve(act)
                    return;
                }
            });
        })
    })
}

/**
 * If the data is a string array, compare them here
 * @param {Array} a 
 * @param {Array} b 
 */
function arraysEqual(a, b) {
    log.log("array comapre")
    return JSON.stringify(a) == JSON.stringify(b);

}

function getSelectedScript() {
    return new Promise((res, rej) => {
        script = memoryManager.getSelectedScript();
        res(script);
        return;
    })
}
exports.getSelectedScript = getSelectedScript;

// =======================================================
// ========= STATES ======================================
// =======================================================


function updateState(stateName, activate) {
    findState(stateName).then(state => {
        state.active = activate;
    })
}



function getState(stateName) {
    return new Promise((resolve, reject) => {
        findState(stateName).then(state => {
            resolve(state.active);
        })
    })
}

function resetStates(scriptName) {
    // script = memoryManager.getSelectedScript();
    ScriptManager.getScriptByName(scriptName).then(script => {
        script.states.forEach(state => {
            state.active = false;
        })
    })
}
exports.resetStates = resetStates;

function toggleState(stateName) {
    findState(stateName).then(state => {
        state.active = !state.active;
    })
}

function findState(stateName) {
    return new Promise((resolve, reject) => {
        script = memoryManager.getSelectedScript();
        script.states.forEach(state => {
            if (state.name == stateName) {
                resolve(state);
                return;
            }
        })
    })
}




function setScriptStates(evt) {
    return new Promise((resolve, reject) => {
        var result = false;
        evt.states.forEach(evtState => {
            findState(evtState.name).then(state => {
                //if the state has not been set, set it to the event state
                if (state.active != evtState.active) {
                    updateState(state.name, evtState.active);
                } else if (state.active == evtState.active && evt.can_toggle == "true") {
                    toggleState(state);
                }
                log.log(memoryManager.getSelectedScript().states);
            })
        });
        resolve()
    })
}

//TODO: check event can toggle


function checkStateDependencies(event_action) {
    return new Promise((resolve, reject) => {
        // var met = "false";
        for (let i = 0; i < event_action.dependencies.length; i++) {
            var dep = event_action.dependencies[i];
            findState(dep).then(state => {
                if (!state.active) {
                    resolve(false);
                    log.log("===== Dependencies not met ====", state.name);
                    return;
                }
                if (i == event_action.dependencies.length - 1) {
                    resolve(true);
                    return;
                }
            })
        }
        if (event_action.dependencies.length == 0) {
            resolve(true);
        }
    })
}



function addActionsToMasterQueue(actionsArray, deviceId) {
    log.log("====SENDING ACTION TO MASTER====", actionsArray)
    DeviceManager.addActionsToDeviceQueue(deviceId, actionsArray);
}
exports.addActionsToMasterQueue = addActionsToMasterQueue;