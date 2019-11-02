"use strict";
//@ts-check
// @ts-ignore
var configJson = require("../config/branchConfig.json");
var jsonfile = require("jsonfile");
var path = require('path');
var fs = require('fs');
var configPath = path.join(__dirname, '../config/branchConfig.json');
var config = {}; // local config file;

// configInit();
exports.configInit = configInit;

exports.config = config;
exports.configJson = configJson;


function configInit() {
    return new Promise((resolve, reject) => {
        fs.readFile(`${configPath}`, 'utf8', function (err, data) {
            if (err) {
                updateConfig(defaultConfig)
                resolve(defaultConfig);
            }
            else {
                resolve(data)
            }
        });
        // config = fs.readFileSync(`${configPath}`, 'utf8');
        // resolve(config);
    })
};


/**
 * Gets the config file.
 */
exports.getConfig = function () {
    return new Promise((resolve, reject) => {
        resolve(configJson);
    })
}


// Update the config with a new one
exports.updateConfig = function (configUpdate) {
    config = configUpdate;
    console.log("======UPDATING=======", config)
    configJson = configUpdate;
    jsonfile.writeFileSync(configPath, configUpdate, {
        spaces: 2
    })
}

// Update the running configuration
function updateRunningConfig(cb) {
    console.log("updating config")
    jsonfile.writeFileSync(configPath, configJson, {
        spaces: 2
    })
    cb()
}
exports.updateRunningConfig = updateRunningConfig;

var defaultConfig = {
    "server_url": "http://192.168.0.180:4300",
    "port": 4400,
    "branchId": 1,
    "localUrl": "0.0.0.0",
    "branch_name": "Default",
    "selected_script": "EXAMPLE.json",
    "start_script_command": "placeholder",
    "end_script_command": "",
    "branch_scripts": [],
}

//TODO: ADD config http routes!