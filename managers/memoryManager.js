//@ts-check


/** Keeps the current event action scripts in memory */
var eventActionScripts = new Array()
const path = require('path');
const fs = require('fs');
var configManager = require("./configManager");
var log = require('../controllers/loggingController').log;
var jsonfile = require("jsonfile");
var scriptName, config, selectedScript;
var currentScript;

configManager.getConfig().then(c =>{
    config = c;
    scriptName = config.selected_script;
    selectedScript = require(`../EventActionScripts/${scriptName}`);
    currentScript = jsonfile.readFileSync(path.join(__dirname, `../EventActionScripts/${scriptName}`));
})


/** for local functions accessing the script */
function getSelectedScript(){
    return selectedScript
}
exports.getSelectedScript = getSelectedScript;

function updateSelectedScriptByName(scriptName){
    scriptName = scriptName;
    selectedScript = require(`../EventActionScripts/${scriptName}`);
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
    scriptName = script //TODO: add this to config as well
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