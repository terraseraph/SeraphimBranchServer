$(document).ready(init())

function init(){
    getSysInfo()
    getEventActionScripts()
}

function getSysInfo(){
    $.get('/info', (result) => {
        var res = syntaxHighlight(JSON.stringify(result, null, 2))
        $('#info').html(res)
        console.log(result)
    })
}

function getEventActionScripts(){
    $.get("/scripts", function(data){
        var res = syntaxHighlight(JSON.stringify(data, null, 2))
        $("#scripts").html(res)
        console.log(data)
    })
}
