//@ts-check
var express = require('express');
var router = express.Router();

const sysInfo = require('../controllers/systemInformation')
const scriptReader = require('../managers/scriptManager')
const memoryManager = require('../managers/memoryManager')
const httpManager = require('../managers/httpManager')
const mqttController = require('../controllers/mqttController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'Branch Server' });
});

/** System status */
router.get("/info", sysInfo.getSystemInfo)



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
router.post("/server/event", httpManager.serverEvent);
router.post("/server/action", httpManager.serverEvent);



/**
 * Direct node messaging
 */
router.post('/node/mqtt/:id', httpManager.deviceManager_directMqttMessage);
router.post('/node/serial/:id', httpManager.deviceManager_directSerialMessage);
router.post('/node/http/:id', httpManager.deviceManager_directHTTPMessage);


/**
 * Device Manager routes
 */
router.get('/node/:id', httpManager.deviceManager_info); // Get a nodes info
router.get('/node', httpManager.deviceManager_infoAll); // Get all node info
router.post('/node', httpManager.DeviceManager_createNewNode); // Create new node
router.patch('/node', httpManager.DeviceManager_updateNode)
router.delete('/node/:id', httpManager.DeviceManager_deleteNode); // Delete and disconnect a node


/**
 * Serial Controller
 */
router.get('/serial/refresh', httpManager.serialController_refresh)



/**
 * Test routes
 */
router.get('/test/mqtt/nodes', mqttController.getNodeList);
router.post('/test/mqtt/publish/:topic', mqttController.publishtMqtt);




module.exports = router;