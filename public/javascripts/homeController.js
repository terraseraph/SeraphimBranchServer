$(document).ready(init())


var currentConfig;
var newConfig;
var scripts;

function init() {
    getSysInfo().then(config => {
        currentConfig = config;
        newConfig = config;
        getEventActionScripts();
        preFillConfigForm();
    })
    prepareDOMEvents();
}

function prepareDOMEvents() {
    $("#config-form").on('submit', function (e) {
        e.preventDefault();
    })

    $("#config-form").submit(function (e) {
        return false
    })
}

function getSysInfo() {
    return new Promise((resolve, reject) => {
        $.get('/config', (result) => {
            var res = syntaxHighlight(JSON.stringify(result, null, 2))
            $('#info').html(res)
            console.log(result)
            resolve(result);
        })
    })
}

function getEventActionScripts() {
    // $.get("/scripts", function (data) {
    //     var res = syntaxHighlight(JSON.stringify(data, null, 2))
    //     $("#scripts").html(res)
    //     console.log(data)
    // })
    $("#scripts").html(currentConfig.branch_scrpts)
}

function preFillConfigForm() {
    console.log("preFillConfigForm...")
    console.log(currentConfig)
    $("#server_url").val(currentConfig.server_url);
    $("#port").val(currentConfig.port);
    $("#selected_script").val(currentConfig.selected_script);
}

function makeAndSendConfigForm() {
    console.log("makling and sending form");
    newConfig.server_url = $("#server_url").val();
    newConfig.port = $("#port").val();
    newConfig.selected_script = $("#selected_script").val();
    console.log(newConfig);
    $.post("/config", newConfig, function (result) {
        console.log(result, "updated....")
    });
}





////////////////////////////////////////////
////////// HELPERS ////////////////////////
//////////////////////////////////////////

// Prevent the form from sending by default
function preventSend(evt) {
    evt.preventDefault();
    return false;
}
