//@ts-check


/** Keeps the current event action scripts in memory */
var eventActionScripts = new Array()
const path = require('path');
const fs = require('fs');
var configManager = require("./configManager");
var log = require('../controllers/loggingController').log;
var jsonfile = require("jsonfile");
var selectedScript, config, selectedS;
var currentScript;

configManager.getConfig().then(c =>{
    config = c;
    selectedScript = config.selected_script;
    selectedS = require(`../EventActionScripts/${selectedScript}`);
    currentScript = jsonfile.readFileSync(path.join(__dirname, `../EventActionScripts/${selectedScript}`));
})


/** for local functions accessing the script */
function getSelectedScript(){
    return selectedS
}
exports.getSelectedScript = getSelectedScript;

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
    return getSelectedScript()
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