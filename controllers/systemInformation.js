//@ts-check
const si = require('systeminformation');

var os = si.osInfo()
var system = si.system()
var cpu = si.cpu()
var networkInterfaces = si.networkInterfaces()

exports.getSystemInfo = function(req, res){
    getInfo().then(data => res.send(data))
}

//TODO: print the config too 
//Gets OS, system & cpu
function getInfo(){
    var result = {}
    return Promise.all([
        os.then(data => result.os = data),
        system.then(data => result.system = data),
        cpu.then(data => result.cpu = data),
        networkInterfaces.then(data=> result.networkInterfaces = data)
    ]).then(values => {
        return result
    })
}