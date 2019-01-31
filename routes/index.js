//@ts-check
var express = require('express');
var router = express.Router();

const sysInfo = require('../controllers/systemInformation')
const scriptReader = require('../managers/scriptManager')
const memoryManager = require('../managers/memoryManager')
const httpManager = require('../managers/httpManager')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'Branch Server' });
});

/** System status */
router.get("/info", sysInfo.getSystemInfo)


/** Get all master devices connected to serial */
router.get('/devices', httpManager.getAllMasterDeviceInfo)

/** Send command to serial (deviceName, message) */
router.post('/devices/serialCommand', httpManager.sendMessageToMasterSerial)

/**
 * 
 * Memory manager routes
 * 
 */


/** EventAction scripts */
router.get("/scripts", memoryManager.showScripts)
router.post('/scripts', scriptReader.newScript)



/**
 * 
 * Root server routes
 * - Used for sending events/actions to the nodes
 */
router.post("/server/event");
router.post("/server/action");


module.exports = router;
