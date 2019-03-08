"use strict";
//@ts-check
// @ts-ignore
var configJson = require("../config/branchConfig.json");
const jsonfile = require("jsonfile");
const path = require('path');
const fs = require('fs');
var configPath = path.join(__dirname, '../config/branchConfig.json');
var config = {}; // local config file;

// configInit();
exports.configInit = configInit;

exports.config = config;
exports.configJson = configJson;


function configInit() {
    return new Promise((resolve, reject) => {
        config = fs.readFileSync(`${configPath}`, 'utf8');
        resolve(config);
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

exports.updateConfig = function (configUpdate) {
    config = configUpdate;
    configJson = configUpdate;
    jsonfile.writeFileSync(configPath, configUpdate, {
        spaces: 2
    })
}

//TODO: ADD config http routes!