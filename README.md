# SeraphimBranchServer

Branch server that bridges the end point devices to the network

## Installation

Go to the \_INSTALLER foler, find your platform and run in the order of

- install nvm
- nvm install 10.15.0
- (in project folder) npm install

Requires node 10.15.0

Run `npm install`

## Startup

Run `npm start`

## Running with NWJS

Tested on version 0.33.4 (windows)

First nw-gyp needt to be installed
Run `npm install -g nw-gyp`

This also requires a build pipeline for python and C++
On windows run `npm install --global --production windows-build-tools`
Add python2.7 to path

There are some native modules included in this package, nwjs needs to build these itself.
Therefore the known ones are currently:

- @serialPort

### To build with nw-gyp

- Navigate to `node_modules/<package>/bindings`
- run `nw-gyp configure --target=0.33.4` (or whatever version installed)
- This will create a vcxproj file in the `build/` directory (or a MAKEFILE on other platforms)
- run `nw-gyp build --target=0.33.4`

### Finally

Either:

- Place the repository folder into the nwjs directory, to run drag the server folder onto nw.exe;
- Or
- zip the server repository and change the name+extension to package.nw and place in the nw.exe directory, then run nw.exe.
- Alternitively after zipping and placing in the directory run `copy /b nw.exe+package.nw app.exe` on windows or `cat nw app.nw > app && chmod +x app` on linux
- Another way is to leave it uncompressed in the folder and creating a package.json file that points to the app.js file.
