var fs = require('fs'),
    q = require('q'),
    qfs = require('q-io/fs'),
    jimp = require('jimp'),
    resemble = require('node-resemble-js');

// CURRENT POINTER STATE
var pointer = { x: 0, y: 0, isDown: false };

module.exports = function addGenericCommands(client, capabilities, runId) {

    // WEBDRIVER COMMAND: NORMALIZED SCREENSHOT - ignore platform specific offsets
    client.addCommand("saveNormalizedScreenshot", function(filePath, bounds) {
        return this.saveCroppedScreenshot(filePath, bounds);
    });

    // WEBDRIVER COMMAND: CROPPED SCREENSHOT
    client.addCommand("saveCroppedScreenshot", function(filePath, bounds) {
        if (arguments.length === 1)
            return this.saveScreenshot(filePath);

        return this.saveScreenshot().then(function(screenshotBuffer, response) {
            return jimp.read(screenshotBuffer).then(function(screenshot) {
                var deferred = q.defer();
                var x = bounds.x > 0 ? Math.min(bounds.x, screenshot.bitmap.width - 1) : 0,
                    y = bounds.y > 0 ? Math.min(bounds.y, screenshot.bitmap.height - 1) : 0,
                    w = bounds.w > 0 ? Math.min(bounds.w, screenshot.bitmap.width - x) : screenshot.bitmap.width - x,
                    h = bounds.h > 0 ? Math.min(bounds.h, screenshot.bitmap.height - y) : screenshot.bitmap.height - y;

                screenshot.crop(x, y, w, h).write(filePath, deferred.makeNodeResolver());
                return deferred.promise;
            });
        });
    });

    // WEBDRIVER COMMAND: IMAGE COMPARE
    client.addCommand("resemble", function(actualPath, expectedPath, diffPath, bounds, checkAntialiasing) {
        var self = this;
        return qfs.exists(expectedPath)
                .then(function(exists) {
                    if (!exists) // baseline screenshot to compare against doesn't exist; save it
                        return self.saveNormalizedScreenshot(expectedPath, bounds);
                    else // baseline screenshot to compare against exists; do comparison
                        return self.saveNormalizedScreenshot(actualPath, bounds).then(function() {
                            var deferred = q.defer();
                            resemble(actualPath)
                                .compareTo(expectedPath)
                                [checkAntialiasing ? 'ignoreNothing' : 'ignoreAntialiasing']()
                                .onComplete(function(data) {
                                    data.getDiffImage()
                                        .pack()
                                        .pipe(fs.createWriteStream(diffPath))
                                        .on('error', deferred.reject)
                                        .on('close', deferred.reject)
                                        .on('finish', function() {
                                            deferred.resolve(data);
                                        });
                                });
                            return deferred.promise;
                        });
                });
    });



    // WEBDRIVER COMMAND: NORMALIZED POINTER
    client.addCommand("pointerDown", function() {
        pointer.isDown = true;
        return this.isMobile ? this.touchDown(pointer.x, pointer.y) : this.buttonDown();
    });
    client.addCommand("pointerMove", function(x, y) {
        pointer.x = x;
        pointer.y = y;
        if (this.isMobile) {
            if (pointer.isDown)
                return this.touchMove(x,y);
        } else {
            return this.moveToObject(':root', x, y);
        }
    });
     client.addCommand("pointerUp", function() {
        pointer.isDown = false;
        return this.isMobile ? this.touchUp(pointer.x, pointer.y) : this.buttonUp();
    });

    // WEBDRIVER COMMAND: NORMALIZED KEYPRESS
    client.addCommand("keyDown", function(key) {
        return this.keys(key);
    });
    client.addCommand("keyUp", function(key) {
        return this.keys(key);
    });
};
