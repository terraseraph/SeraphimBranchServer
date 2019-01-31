//@ts-check
const SerialPort = require('serialport');
var Readline = SerialPort.parsers.Readline;
const log = require('../controllers/loggingController').log;
const serialController = require('../controllers/serialController');


/**
 * Idea was to have all devices (serial/mqtt) here, but too many specialised options for both
 * maybe once both are written they can be combined, so that one mesh can communicate with another
 */
class NodeDevice {



}