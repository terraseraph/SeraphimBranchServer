//@ts-check
var config = require("../managers/configManager").config;
var httpManager = require('../managers/httpManager')
exports.log = log

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