//@ts-check

/** Keeps the current event action scripts in memory */
var eventActionScripts = new Array()

















/** 
 * 
 * 
 * Exports functions 
 * 
 */
exports.addEventActionToScript = function(script){
    eventActionScripts.push(script)
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