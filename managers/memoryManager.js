//@ts-check


/** Keeps the current event action scripts in memory */
var eventActionScripts = new Array()
var configManager = require("./configManager");
var selectedScript, config, selectedS;

configManager.getConfig().then(c =>{
    config = c;
    selectedScript = config.selected_script;
    selectedS = require(`../EventActionScripts/${selectedScript}`);
})


/** for local functions accessing the script */
function getSelectedScriptLocal(){
    return selectedS
}


/** 
 * 
 * 
 * Exports functions 
 * 
 */
exports.addEventActionToScript = function(script){
    eventActionScripts.push(script)
}

/** sets the event action script to use */
exports.setSelectedScript = function(script){
    selectedScript = script //TODO: add this to config as well
}

exports.getSelectedScriptModule = function(){
    return getSelectedScriptLocal()
}




/** 
 * 
 * HTTP requests for memory data
 * 
 */

/** Used for http requests */
exports.showScripts = function(req, res){
    res.send(eventActionScripts)
    console.log(eventActionScripts)
}

/** sends the currently selected script */
exports.getSelectedScript = function(req, res){
    res.send(getSelectedScriptLocal())
}