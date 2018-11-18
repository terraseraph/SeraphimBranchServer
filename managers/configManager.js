//@ts-check
var config = require("../config/branchConfig.json")


/**
 * Gets the config file.
 */
exports.getConfig = function(){
    return config;
}