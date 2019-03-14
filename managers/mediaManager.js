var fs = require('fs');
var os = require('os');
var path = require('path');
const audioPath = path.join(__dirname, '../public/files/audio');
const videoPath = path.join(__dirname, '../public/files/video');
os.tmpDir = os.tmpdir;




exports.getAudio = function (req, res) {
    var audioPath = req.params.audioFile
    console.log('sending audio')
    res.sendFile(path.resolve(__dirname, `../public/files/video/${audioPath}`));
}

exports.getVideo = function (req, res) {
    var videoPath = req.params.videoFile
    console.log('sending video', video)
    res.sendFile(path.resolve(__dirname, `../public/files/video/${videoPath}`));
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


function readMediaDirectory(path) {
    return new Promise((resolve, reject) => {
        let result = [];
        fs.readdir(path, function (err, files) {
            if (err) {
                resolve(log.logError('Unable to scan directory: ' + err));
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                result.push(file)
                if (i == files.length - 1) {
                    resolve(result)
                }
            }
        });
    })
}

exports.httpGetAllMedia = function (req, res) {
    let result = {}
    readMediaDirectory(audioPath).then(audioArr => {
        result["audio"] = audioArr
        readMediaDirectory(videoPath).then(videoArr => {
            result["video"] = videoArr
            res.send(result);
        })
    })
}

function getAllMedia() {
    return new Promise((resolve, reject) => {
        result = {};
        readMediaDirectory(audioPath).then(audioArr => {
            result["audio"] = audioArr
            readMediaDirectory(videoPath).then(videoArr => {
                result["video"] = videoArr
                resolve(result);
            })
        })
    })
}
exports.getAllMedia = getAllMedia;

exports.getAllVideo = function (req, res) {
    let result = {}
    readMediaDirectory(videoPath).then(videoArr => {
        result["video"] = videoArr
        res.send(result);
    })
}


exports.getAllAudio = function (req, res) {
    let result = {}
    readMediaDirectory(audioPath).then(audioArr => {
        result["audio"] = audioArr
        res.send(result);
    })
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