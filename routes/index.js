//@ts-check
var express = require('express');
var router = express.Router();

const sysInfo = require('../controllers/systemInformation')
const scriptReader = require('../managers/scriptManager')
const memoryManager = require('../managers/memoryManager')

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



module.exports = router;
