cordova.define("org.ekstep.downloader.service.plugin.DownloaderService", function(require, exports, module) { var exec = require('cordova/exec');

exports.extract = function(fileName, outputDirectory, callback) {
    var win = function(result) {
        console.log("extract success:", result);
        if(callback) {
            callback("success");
        }
    };
    var fail = function(result) {
        console.log("extract fail:", result);
        if(callback) {
            callback(result);
        }
    }
    exec(win, fail, 'DownloaderService', 'extract', [fileName, outputDirectory]);
}
});
