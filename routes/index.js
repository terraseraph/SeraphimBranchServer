//@ts-check
var express = require("express");
var router = express.Router();
var path = require("path");

// const sysInfo = require("../controllers/systemInformation");
const g = require("../common/common");
const scriptReader = require("../managers/scriptManager");
const memoryManager = require("../managers/memoryManager");
const httpManager = require("../managers/httpManager");
const mqttController = require("../controllers/mqttController");
const mediaManager = require("../managers/mediaManager");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home", {
    title: "Branch Server"
  });
});

/** System status */
// router.get("/info", sysInfo.getSystemInfo);


/**
 * 
 * Media management
 */
router.get("/video/:path", mediaManager.getVideo);
router.get("/audio/:path", mediaManager.getAudio);
router.get("/video", mediaManager.getAllVideo);
router.get("/audio", mediaManager.getAllAudio);
router.get("/media", mediaManager.httpGetAllMedia);
router.post("/audio", mediaManager.saveAudio);
router.post("/video", mediaManager.saveVideo);
router.delete("/media/:type/:name", mediaManager.deleteMedia);


/**
 *
 * Config manager routes
 *
 */
router.get("/config", httpManager.getConfig);
router.post("/config", httpManager.updateConfig);
router.put("/config/api", httpManager.updateRootApi)


/**
 *
 * Shell controller routes
 *
 */
router.get("/shell/restart", httpManager.shellRestartBranchServer);
router.get("/shell/reload", httpManager.shellReloadBranchDesktop);
router.get("/shell/gitupdate", httpManager.shellGitUpdate);
router.post("/shell/command", httpManager.shellCustomCommand);



/**
 *
 * Memory manager routes
 *
 */

/** EventAction scripts */
router.get("/scripts", memoryManager.showScripts);
router.post("/scripts", scriptReader.newScript);

router.get("/scripts/selected", httpManager.getSelectedEventActionScript);
router.get(
  "/scripts/selected/set/:scriptName",
  httpManager.updateSelectedScript
);
router.get("/scripts/selected/reset/:scriptName", httpManager.resetEventActionStates);

router.get("/scripts/update", httpManager.forceEventActionScriptUpdate);
router.delete("/scripts/:scriptName", httpManager.deleteEventActionScript)

/**
 *
 * Root server routes
 * - Used for sending events/actions to the nodes
 */
router.post("/server/event", httpManager.serverEvent);
router.post("/server/action", httpManager.serverAction);

/**
 * Direct node messaging
 */
router.post("/node/mqtt/:id", httpManager.deviceManager_directMqttMessage);
router.post("/node/serial/:id", httpManager.deviceManager_directSerialMessage);
router.post("/node/http/:id", httpManager.deviceManager_directHTTPMessage);

/**
 * Device Manager routes
 */
router.get("/node/:id", httpManager.deviceManager_info); // Get a nodes info
router.get("/node", httpManager.deviceManager_infoAll); // Get all node info
router.post("/node", httpManager.DeviceManager_createNewNode); // Create new node
router.patch("/node", httpManager.DeviceManager_updateNode);
router.delete("/node/:id", httpManager.DeviceManager_deleteNode); // Delete and disconnect a node

/**
 * Serial Controller
 */
router.get("/serial/refresh", httpManager.serialController_refresh);

/**
 * Test routes
 */
router.get("/test/mqtt/nodes", mqttController.getNodeList);
router.post("/test/mqtt/publish/:topic", mqttController.publishtMqtt);

module.exports = router;