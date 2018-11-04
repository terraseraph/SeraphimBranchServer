//@ts-check
/**Packages */
var express = require('express');
var exphbs  = require('express-handlebars');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var logger = require('morgan');
var http = require('http');

/**Local requires */
var serialPort = require('./controllers/serialController')
var scriptReader = require('./managers/scriptManager')
var log = require('./controllers/loggingController').log;
var indexRouter = require('./routes/index');

/** Express settings */
var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

/** Directory linking */
app.use(express.static(path.join(__dirname, 'public')));
app.use("/packages",express.static(path.join(__dirname, 'node_modules'))) //TODO: make individ paths for each (jquery..etc)

/** Server Settings */
var server = http.createServer(app);
var port = 5002 //TODO: get this from a config file
var ipAddress = "0.0.0.0"; //TODO: get this froma  config file too
server.listen(port, ipAddress);
server.on('error', onError);
server.on('listening', onListening);


/** Routes */
app.use('/', indexRouter);



/** Server events */
function onListening(){
    var addr = server.address();
    log(addr);
}

function onError(err){
    log(err);
    if(err.syscall !== 'listen'){
        throw err;
    }
}
module.exports = app;
