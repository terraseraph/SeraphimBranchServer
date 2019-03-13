var fs = require('fs');
// var util = require('util');
// var mv = require('mv');
var os = require('os');
var path = require('path');
os.tmpDir = os.tmpdir;




exports.getAudio = function (req, res) {
    var audioPath = req.params.audioFile
    console.log('sending audio')
    res.sendFile(path.resolve(__dirname, `../public/files/video/${audioPath}`));
}



// Note form field name must be file....
exports.saveAudio = function (req, res) {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }
    console.log("FILES===", req.files)
    let audioFile = req.files.file;
    audioFile.mv(path.resolve(__dirname, `../public/files/audio/${audioFile.name}`), function (err) {
        if (err)
            return res.status(500).send(err);

        res.send({
            data: {
                name: audioFile.name,
                path: audioFile.path,
                size: audioFile.size
            }
        })
    });
}



exports.getVideo = function (req, res) {
    var videoPath = req.params.videoFile
    console.log('sending video', video)
    res.sendFile(path.resolve(__dirname, `../public/files/video/${videoPath}`));
}



// Note form field name must be file....
exports.saveVideo = function (req, res) {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }
    console.log("FILES===", req.files)
    let videoFile = req.files.file;
    videoFile.mv(path.resolve(__dirname, `../public/files/video/${videoFile.name}`), function (err) {
        if (err)
            return res.status(500).send(err);

        res.send({
            data: {
                name: videoFile.name,
                path: videoFile.path,
                size: videoFile.size
            }
        })
    });
}


function save_fs(req) {
    // get the temporary location of the file
    var tmp_path = req.files[0].path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './public/images/' + req.files[0].name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function (err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function () {
            if (err) throw err;
            return ('File uploaded to: ' + target_path + ' - ' + req.files[0].size + ' bytes');
        });
    });
}