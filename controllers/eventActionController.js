//@ts-check
// const $ = require('jquery');
var memoryManager = require('../managers/memoryManager');
var httpManager = require('../managers/httpManager')
var log = require('./loggingController').log;
var DeviceManager = require('../managers/deviceManager');
var selectedScript;

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

/** Skip dependencey check */
exports.setEventFromServer = function () {
    fromServer = true;
}

/** Find the event */
exports.parseEvent = function (packet, callback) {
    selectedScript = memoryManager.getSelectedScript();
    var actionsArr = new Array()
    findEvent(packet, false)
        .then((evt) => {
            log("script_state: ", script_state)
            log("non_repeatable_actions: ", non_repeatable_actions)
            /*dependencies are met or skipped if fromServer (http request)*/
            checkStateDependencies(evt).then(result => {
                /*Dependencies are met, check if the event is in the script_state*/
                setScriptStates(evt).then(() => {
                    evt.branch_name = selectedScript.branch_name;
                    sendToServer(evt)
                    eventStateSpecialActions(evt);
                    if (evt.actions.length > 0) {
                        for (var j = 0; j < evt.actions.length; j++) {
                            findAction(evt.actions[j]).then((act) => {
                                playAction(act, function (result) {
                                    actionsArr.push(result);
                                })
                            })
                            // playAction(evt.actions[j], function (result) {
                            //     actionsArr.push(result)
                            // })
                        }
                        callback(actionsArr)
                    }
                })
            })
        })
}


// exports.parseEvent = function (packet, callback) {
//     selectedScript = memoryManager.getSelectedScript();
//     var actionsArr = new Array()
//     findEvent(packet, false)
//         .then((evt) => {
//             log("script_state: ", script_state)
//             log("non_repeatable_actions: ", non_repeatable_actions)
//             /*dependencies are met or skipped if fromServer (http request)*/
//             if (dependenciesCheck(evt)) {
//                 /*Dependencies are met, check if the event is in the script_state*/
//                 scriptStateValidation(evt, (result) => {
//                     if (result) {
//                         evt.branch_name = selectedScript.branch_name;
//                         sendToServer(evt)
//                         eventStateSpecialActions(evt);
//                         if (evt.actions.length > 0) {
//                             for (var j = 0; j < evt.actions.length; j++) {
//                                 playAction(evt.actions[j], function (result) {
//                                     actionsArr.push(result)
//                                 })
//                             }
//                             callback(actionsArr)
//                         }

//                     }
//                 })
//             }


//         })
// }

/** Force event by name */
exports.forceEvent = function (packet, callback) {
    selectedScript = memoryManager.getSelectedScript();
    var actionsArr = new Array()
    findEvent(packet, true).then(evt => {
        setScriptStates(evt).then(() => {
            evt.branch_name = selectedScript.branch_name;
            sendToServer(evt)
            if (evt.actions.length > 0) {
                for (var j = 0; j < evt.actions.length; j++) {
                    findAction(evt.actions[j]).then((act) => {
                        playAction(act, function (result) {
                            actionsArr.push(result);
                        })
                    })
                }
                callback(actionsArr)
            }
        })


    })
}


// exports.forceEvent = function (packet, callback) {
//     selectedScript = memoryManager.getSelectedScript();
//     var actionsArr = new Array()
//     findEvent(packet, true).then(evt => {
//         log("script_state: ", script_state)
//         log("non_repeatable_actions: ", non_repeatable_actions)
//         /*dependencies are met or skipped if fromServer (http request)*/
//         if (dependenciesCheck(evt)) {
//             /*Dependencies are met, check if the event is in the script_state*/
//             scriptStateValidation(evt, (result) => {
//                 if (result) {
//                     evt.branch_name = selectedScript.branch_name;
//                     sendToServer(evt)
//                     eventStateSpecialActions(evt); //TODO: use triggers instead!!!!
//                     if (evt.actions.length > 0) {
//                         for (var j = 0; j < evt.actions.length; j++) {
//                             playAction(evt.actions[j], function (result) {
//                                 actionsArr.push(result)
//                             })
//                         }
//                         callback(actionsArr)
//                     }

//                 }
//             })
//         }


//     })
// }

/** find the action */
exports.parseAction = function (packet, callback) {
    var actions_arr
    log("============ACTION=================")
    log(packet.fromId, packet.action, packet.actionType, packet.data)
    //find the matching action
    //maybe just send the action name from the server and parse it here....
    findAction(packet.action).then((act) => {
        log(act.message)
        if (act.dependencies.length != 0) {
            forceAction(act, function (result) {
                actions_arr = result
                log("====Forced actions=====")
                log("actions_arr= ", actions_arr)
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
function forceAction(obj, callback) {
    var actions_to_complete = new Array();
    log("DEPECNDENCIES : ", obj.dependencies)
    if (obj.dependencies.length < 1 || !obj.dependencies) {
        callback("no dependencies")
        return
    }
    for (var i = 0; i < obj.dependencies.length; i++) {
        var dep = obj.dependencies[i]
        if (!non_repeatable_actions.includes(dep)) {
            findAction(dep).then((act) => {
                log("dependencey name: ", dep)
                playAction(act, function (result) {
                    actions_to_complete.push(result);
                })
            })
        }
    }
    callback(actions_to_complete)
}

function forceActionFromServer(actionName, bridgeId) {
    var actArr = new Array();
    findAction(actionName).then((act) => {
        // forceAction(act, (actions_arr)=>{
        //     addActionsToMasterQueue(actions_arr, bridgeId);
        // })
        playAction(act, function (result) {
            actArr.push(result);
            addActionsToMasterQueue(actArr, bridgeId);
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
    log("======= play_action() ===========")
    log("=======Checking Action Dependencies ======")
    log(action)
    let result = makeActionPacket(action);

    if (action.repeatable == true) {
        callback(result)
        return
    }
    if(!action.hasOwnProperty("repeatable")){
        callback(result)
        return
    }

    if (non_repeatable_actions.includes(action.name)) {
        callback("Cannot Repeat")
        return
    }
    if (action.repeatable == false && !non_repeatable_actions.includes(action.name)) {
        non_repeatable_actions.push(action.name)
        log("pushed non_repeatable_actions()")
        callback(result)
        return
    }
    log("play_action ===CANNOT FIND===")
}


// function playAction(action, callback) {
//     var act = selectedScript.actions;
//     log("======= play_action() ===========")
//     log("=======Checking Action Dependencies ======")
//     log(action)
//     for (var i = 0; i < act.length; i++) {
//         if (act[i].name == action) {
//             if (act[i].dependencies.length > 0) {
//                 checkStateDependencies(act[i]).then((result)=>{
//                     if(!result){
//                         callback("Dependencies not met")
//                         return log("Dependencies not met for acitons..")    
//                     }
//                 })
//                 // if (!dependenciesCheck(act[i])) {
//                 //     callback("Dependencies not met")
//                 //     return log("Dependencies not met for acitons..")
//                 // }
//             }
//             //TODO: make this a class model if it is cleaner later on
//             let result = makeActionPacket(act[i]);
//             // let result = {
//             //     toId: Number(act[i].device_id),
//             //     state: {
//             //         type: "action",
//             //         message: {
//             //             toId: Number(act[i].device_id),
//             //             wait: act[i].wait,
//             //             event: act[i].event,
//             //             eventType: act[i].eventType,
//             //             action: act[i].action,
//             //             actionType: act[i].actionType,
//             //             data: act[i].data
//             //         }
//             //     }
//             // }


//             // let result_old = {
//             //     "messageType": "eventAction",
//             //     "fromId": Number(selectedScript.masterId),
//             //     "toId": Number(act[i].device_id),
//             //     "wait": act[i].wait,
//             //     "event": act[i].event,
//             //     "eventType": act[i].eventType,
//             //     "action": act[i].action,
//             //     "actionType": act[i].actionType,
//             //     "data": act[i].data
//             // }
//             if (act[i].repeatable == "true") {
//                 callback(result)
//                 return
//             }

//             if (non_repeatable_actions.includes(act[i].name)) {
//                 callback("Cannot Repeat")
//                 return
//             }
//             if (act[i].repeatable == "false" && !non_repeatable_actions.includes(act[i].name)) {
//                 non_repeatable_actions.push(act[i].name)
//                 log("pushed non_repeatable_actions()")
//                 callback(result)
//                 return
//             }
//         }
//     }
//     log("play_action ===CANNOT FIND===")
// }

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
 * @param {*} obj 
 */
function sendToServer(obj) {
    return new Promise((resolve, reject) => {
        httpManager.sendEventsToServer(obj)
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
        log("ENDING Script script_state:", script_state)
    }
}



/**
 * Check if the action to take has dependencies
 * @param {*} obj 
 */
function dependenciesCheck(obj) {
    log("======== dependencies_check() ========")
    var dependencies_ok;
    if (obj.dependencies.length > 0) {
        for (var x = 0; x < obj.dependencies.length; x++) {
            if (script_state.indexOf(obj.dependencies[x]) !== -1) {
                dependencies_ok = true;
                log("dependencies met: ", obj.dependencies[x])
            } else {
                dependencies_ok = false;
                log("===== All Dependencies not met ====")
                break;
            }
        }
    } else {
        dependencies_ok = true;
    }
    if (dependencies_ok) log("===== All Dependencies met ====");
    return dependencies_ok
}


// =======================================================
// ========= SEARCH EVENT ACTION =========================
// =======================================================



/**
 * Find event by name, Returns a promise
 * @param {*} packet Event name to find
 */
function findEvent(packet, findByName = false) {
    log("============== Searching Selected Script =============");
    log(selectedScript.name);
    var evt;
    return new Promise((resolve, reject) => {
        if (findByName) {
            selectedScript.events.forEach(evt => {
                if (evt.name == packet.name) {
                    resolve(evt);
                    return;
                }
            });
        } else {
            for (var i = 0; i < selectedScript.events.length; i++) {
                evt = selectedScript.events[i]
                if ((evt.device_id == packet.fromId) && (evt.event == packet.event) && (arraysEqual(evt.data, packet.data) || evt.data == packet.data)) {
                    log("script state: ", script_state)
                    log("non_repeatable_actions: ", non_repeatable_actions)
                    resolve(evt);
                    return;
                }
            }
        }
        log("====== Cannot find matching event ========")
    })
}



/**
 * Find action
 * @param {*} actionName 
 */
function findAction(actionName) {
    selectedScript = memoryManager.getSelectedScript();
    return new Promise((resolve, reject) => {
        selectedScript.actions.forEach(act => {
            if (act.name == actionName) {
                log("=====FIND ACTION===", act)
                resolve(act)
                return;
            }
        });
    })
}

/**
 * If the data is a string array, compare them here
 * @param {Array} a 
 * @param {Array} b 
 */
function arraysEqual(a, b) {
    log("array comapre")
    return JSON.stringify(a) == JSON.stringify(b);

}

function getSelectedScript() {
    return new Promise((res, rej) => {
        selectedScript = memoryManager.getSelectedScript();
        res(selectedScript);
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

function resetStates() {
    selectedScript.forEach(state => {
        state.active = false;
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
        selectedScript.forEach(state => {
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
            })
        });
        resolve()
    })
}

//TODO: check event can toggle


function checkStateDependencies(event_action) {
    return new Promise((resolve, reject) => {
        var result = false;
        event_action.dependencies.forEach(dep => {
            findState(dep).then(state => {
                if (!state.active) {
                    result = false;
                    resolve(result);
                    return;
                }
            })
        });
        resolve(true);
    })
}



function addActionsToMasterQueue(actionsArray, deviceId) {
    log("====SENDING ACTION TO MASTER====", actionsArray)
    DeviceManager.nodeDeviceList.forEach(device => {
        if (device.id == deviceId) {
            actionsArray.forEach(action => {
                device.actionsArray.push(action)
                DeviceManager.setDeviceReady(device.id);
            });
        }
    })
}
exports.addActionsToMasterQueue = addActionsToMasterQueue;