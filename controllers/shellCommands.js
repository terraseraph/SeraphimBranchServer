//@ts-check
var shell = require('shelljs')


function restartBranchServer() {
    shell.exec('sudo reboot');
    shell.exit(1);
}
exports.restartBranchServer = restartBranchServer

function reloadBranchDesktop() {
    shell.exec('sudo service lightdm restart');
    shell.exit(1);
}
exports.reloadBranchDesktop = reloadBranchDesktop

function customCommand(cmd) {
    shell.exec(`${cmd}`);
    shell.exit(1);
}
exports.customCommand = customCommand


function gitUpdate() {
    let cmd = `cd ${process.cwd} && git pull && npm install && sudo reboot`
    shell.exec(`${cmd}`);
    shell.exit(1);
}
exports.gitUpdate = gitUpdate