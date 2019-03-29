//@ts-check
var shell = require("shelljs");
const path = require("path");
var directory = path.join(__dirname, `../`);

function restartBranchServer() {
  shell.exec("sudo reboot", result => {
    console.log(result);
  });
  shell.exit(1);
}
exports.restartBranchServer = restartBranchServer;

function reloadBranchDesktop() {
  var cmd = ("sudo service lightdm restart");
      shell.exec(`${cmd}`, function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
});
  shell.exit(1);
}
exports.reloadBranchDesktop = reloadBranchDesktop;

function customCommand(cmd) {
  shell.exec(`${cmd}`, function(code, stdout, stderr) {
    console.log("Exit code:", code);
    console.log("Program output:", stdout);
    console.log("Program stderr:", stderr);
  });
  shell.exit(1);
}
exports.customCommand = customCommand;

function gitUpdate() {
  let cmd = `bash -c 'cd ${directory} && git pull && npm install && sudo reboot'`;
  shell.exec(`${cmd}`, function(code, stdout, stderr) {
    console.log("Exit code:", code);
    console.log("Program output:", stdout);
    console.log("Program stderr:", stderr);
  });
  shell.exit(1);
}
exports.gitUpdate = gitUpdate;
