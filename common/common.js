//@ts-check

/* Packages */
const _express = require('express');
const _exphbs = require('express-handlebars');
const _fileUpload = require('express-fileupload');
const _router = _express.Router();
const _cors = require("cors");
const _path = require('path');
const _cookieParser = require('cookie-parser');
const _bodyParser = require('body-parser')
const _logger = require('morgan');
const _http = require('http');
const _fs = require('fs');
const _async = require("async");
const _jsonfile = require("jsonfile");
const _request = require('request');
const _SerialPort = require('serialport');
const _EventEmitter = require('events').EventEmitter;
const _Readline = _SerialPort.parsers.Readline;
const _mqtt = require('mqtt')
const _mosca = require('mosca');


/* Local requires */

const _indexRouter = require('../routes/index');

// Controllers
const _eventActionController = require('../controllers/eventActionController');
const _logController = require('../controllers/loggingController');
const _mqttController = require("../controllers/mqttController");
const _serialController = require('../controllers/serialController')
const _shellCommands = require("../controllers/shellCommands");
const _systemInformation = require("../controllers/systemInformation");

// Managers
const _configManager = require("../managers/configManager");
const _deviceManager = require('../managers/deviceManager');
const _httpManager = require("../managers/httpManager");
const _mediaManager = require("../managers/mediaManager");
const _memoryManager = require("../managers/memoryManager");
const _scriptManager = require('../managers/scriptManager')



/* Objects */
const _EventModel = require('../models/eventModel');
const _ActionModel = require('../models/actionModel');
const _EventActionScriptModel = require('../models/eventActionScriptModel');


/* Require Exports */
exports.express = _express;
exports.exphbs = _exphbs;
exports.fileUpload = _fileUpload;
exports.router = _router;
exports.cors = _cors;
exports.cookieParser = _cookieParser;
exports.bodyParser = _bodyParser;
exports.logger = _logger;
exports.http = _http;
exports.fs = _fs;
exports.async = _async;
exports.jsonFile = _jsonfile;
exports.request = _request;
exports.SerialPort = _SerialPort;
exports.EventEmitter = _EventEmitter;
exports.ReadLine = _Readline;
exports.mqtt = _mqtt;
exports.mosca = _mosca;
exports.path = _path;

/* Route Exports */
exports.indexRouter = _indexRouter;


/* Controller Exports */
exports.eventActionController = _eventActionController;
exports.logController = _logController;
exports.mqttController = _mqttController;
exports.serialController = _serialController;
exports.shellCommands = _shellCommands;
exports.systemInformation = _systemInformation;





/* Manager Exports */
exports.configManager = _configManager;
exports.deviceManager = _deviceManager;
exports.httpManager = _httpManager;
exports.mediaManager = _mediaManager;
exports.memoryManager = _memoryManager;
exports.scriptManager = _scriptManager;




/* Object Exports */
exports.EventModel = _EventModel;
exports.ActionModel = _ActionModel;
exports.EventActionScriptModel = _EventActionScriptModel;

