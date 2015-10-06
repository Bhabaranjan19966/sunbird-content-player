var exec = require('cordova/exec');

function GenieService() {
}

GenieService.prototype.sendTelemetry = function(aString) {
    console.log("GenieService sendTelemetry: ", aString);
    return new Promise(function(resolve, reject) {
        exec(function(result) {
                if (result.status == 'success') {
                    console.log('Telemetry successfully sent');
                    resolve(true);
                } else {
                    reject(result);
                }
            },
            function(error) {
                reject(error);
            },
            "GenieService", "sendTelemetry", [aString]);
    });
}

GenieService.prototype.getCurrentUser = function() {
    console.log("GenieService getCurrentUser... ");
    return new Promise(function(resolve, reject) {
        exec(function(result) {
                resolve(result);
            },
            function(error) {
                reject(error);
            },
            "GenieService", "getCurrentUser", []);
    });
}

var genieService = new GenieService();
module.exports = genieService;