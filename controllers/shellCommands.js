//@ts-check
var shell = require("shelljs");
const path = require("path");
var directory = path.join(__dirname, `../`);

function restartBranchServer() {
    var cmd = 'sudo reboot'
        var bash = shell.exec(`${cmd}`, {
        async: true
    })
    // @ts-ignore
    bash.stdout.on('data', function (data) {
        console.log(data)
        // @ts-ignore
        bash.kill();
    });
}
exports.restartBranchServer = restartBranchServer;

function reloadBranchDesktop() {
    var cmd = ("sudo service lightdm restart");
    var bash = shell.exec(`${cmd}`, {
        async: true
    })
    // @ts-ignore
    bash.stdout.on('data', function (data) {
        console.log(data)
        // @ts-ignore
        bash.kill();
    });
}
exports.reloadBranchDesktop = reloadBranchDesktop;

function customCommand(cmd) {
    var bash = shell.exec(`${cmd}`, {
        async: true
    })
    // @ts-ignore
    bash.stdout.on('data', function (data) {
        console.log(data)
        // @ts-ignore
        bash.kill();
    });

}
exports.customCommand = customCommand;

function gitUpdate() {
    let cmd = `git pull && npm install && sudo reboot`;
    var bash = shell.exec(`${cmd}`, {
        async: true
    })
    // @ts-ignore
    bash.stdout.on('data', function (data) {
        console.log(data)
        // @ts-ignore
        bash.kill();
    });
}
exports.gitUpdate = gitUpdate;