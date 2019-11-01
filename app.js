//@ts-check
/**Packages */
var config = require('./managers/configManager');
var express = require('express');
var exphbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const cors = require("cors");
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var logger = require('morgan');
var http = require('http');

var server, port, ipAddress;


/**Local requires */
var serialPort = require('./controllers/serialController')
var scriptReader = require('./managers/scriptManager')
var log = require('./controllers/loggingController');
var indexRouter = require('./routes/index');

/** Express settings */
var app = express();
app.use(cors());
app.use(logger('dev'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

/** Directory linking */
app.use(express.static(path.join(__dirname, 'public')));
app.use("/packages", express.static(path.join(__dirname, 'node_modules'))) //TODO: make individ paths for each (jquery..etc)


/** Server Settings */
config.configInit;
config.getConfig().then(c => {
    server = http.createServer(app);
    port = c.port;
    ipAddress = c.localUrl;
    server.listen(port, ipAddress);
    server.on('error', onError);
    server.on('listening', onListening);
})


/** Routes */
app.use('/', indexRouter);



/** Server events */
function onListening() {
    var addr = server.address();
    log.log(addr);
}

function onError(err) {
    log.log(err);
    if (err.syscall !== 'listen') {
        throw err;
    }
}
exports.server = server;
exports.app = app;
// module.exports = app, server;