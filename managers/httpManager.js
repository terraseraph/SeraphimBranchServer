//@ts-check
const $ = require('jquery')
var config = require("../config/branchConfig.json")
var log = require('../controllers/loggingController').log;

exports.sendEventsToServer = function (message) {
    return new Promise((res, rej) => {
        $.post(config.serverUrl, message, (data) => {
            var result = { "Success": data }
            log(result)
            res(result)
        })
    })
}