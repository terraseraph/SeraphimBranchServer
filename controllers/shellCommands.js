//@ts-check
var shell = require('shelljs')
const path = require('path');
var directory = path.join(__dirname, `../`)


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
    let cmd = `bash -c 'cd ${directory} && git pull && npm install && sudo reboot'`
    shell.exec(`${cmd}`);
    shell.exit(1);
}
exports.gitUpdate = gitUpdate