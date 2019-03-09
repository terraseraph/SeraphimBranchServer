//@ts-check
var config = require("../managers/configManager").config;
var httpManager = require('../managers/httpManager')

function log(...args) {
    try {

        args.unshift(log.caller.name.toString())
    } catch (e) {}
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: "info",
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)

}
exports.log = log
exports.logInfo = logInfo
exports.logWarning = logWarning
exports.logError = logError
exports.logCritical = logCritical
exports.logStatus = logStatus


var MessageType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    STATUS: "status",
    CRITICAL: "critical"
}

function logInfo(...args) {
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: MessageType.INFO,
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)
}

function logWarning(...args) {
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: MessageType.WARNING,
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)
}


function logError(...args) {
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: MessageType.ERROR,
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)
}


function logCritical(...args) {
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: MessageType.CRITICAL,
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)
}

function logStatus(...args) {
    console.log(args)
    var msg = {
        text: JSON.stringify(args),
        type: MessageType.STATUS,
        time: new Date().getTime(),
        from: config.branchName
    }
    httpManager.sendLogToRoot(msg)
}