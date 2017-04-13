var q = require('q'),
    jimp = require('jimp');


// CRAFTY STAGE ELEMENT
var viewportStage = 'cr-stage';
// CURRENT POINTER STATE
var pointer = { x: 0, y: 0, isDown: false };

module.exports = function addBrowserSpecificCommands(client, capabilities, runId, syntheticKeyEvents, syntheticMouseEvents, rotatedCrop) {

    // WEBDRIVER COMMAND: NORMALIZED SCREENSHOT - ROTATE CCW 90°, CROP TO DOCUMENT REGION, SCALE UP, CROP TO BOUNDS
    if (rotatedCrop) {
        client.addCommand("saveNormalizedScreenshot", function(filePath, bounds) {
            return this.saveScreenshot().then(function(screenshotBuffer, response) {
                return jimp.read(screenshotBuffer).then(function(screenshot) {
                    var deferred = q.defer();
                    var x = bounds.x > 0 ? Math.min(bounds.x, rotatedCrop.stretchW - 1) : 0,
                        y = bounds.y > 0 ? Math.min(bounds.y, rotatedCrop.stretchH - 1) : 0,
                        w = bounds.w > 0 ? Math.min(bounds.w, rotatedCrop.stretchW - x) : rotatedCrop.stretchW - x,
                        h = bounds.h > 0 ? Math.min(bounds.h, rotatedCrop.stretchH - y) : rotatedCrop.stretchH - y;

                    screenshot
                        .rotate(270)
                        .crop(rotatedCrop.x, rotatedCrop.y, rotatedCrop.w, rotatedCrop.h)
                        .cover(rotatedCrop.stretchW, rotatedCrop.stretchH)
                        .crop(x, y, w, h)
                        .write(filePath, deferred.makeNodeResolver());

                    return deferred.promise;
                });
            });
        }, true);
    }

    // WEBDRIVER COMMAND: NORMALIZED KEYPRESS - trigger synthethic event
    if (syntheticKeyEvents) {
        client.addCommand("keyDown", function(key) {
            key = key.toUpperCase();
            return this.execute(function(key) {
                        var evt = document.createEvent('Event');
                        evt.initEvent('keydown', true, true);
                        evt.key = key;
                        evt.char = key;
                        evt.keyCode = key.charCodeAt(0);
                        evt.which = key.charCodeAt(0);
                        evt.charCode = key.charCodeAt(0);
                        document.dispatchEvent(evt);
                    }, key);
        }, true);

        client.addCommand("keyUp", function(key) {
            key = key.toUpperCase();
            return this.execute(function(key) {
                        var evt = document.createEvent('Event');
                        evt.initEvent('keyup', true, true);
                        evt.key = key;
                        evt.char = key;
                        evt.keyCode = key.charCodeAt(0);
                        evt.which = key.charCodeAt(0);
                        evt.charCode = key.charCodeAt(0);
                        document.dispatchEvent(evt);
                    }, key);
        }, true);
    }

    // WEBDRIVER COMMAND: NORMALIZED POINTER - trigger synthetic event
    if (syntheticMouseEvents) {
        client.addCommand("pointerDown", function() {
            pointer.isDown = true;
            return this.execute(function(x, y, viewportStage) {
                        var evt = document.createEvent('Event');
                        evt.initEvent('mousedown', true, true);
                        evt.button = 0;
                        evt.which = 1;
                        evt.clientX = x;
                        evt.clientY = y;
                        document.getElementById(viewportStage).dispatchEvent(evt);
                    }, pointer.x, pointer.y, viewportStage);
        }, true);

        client.addCommand("pointerMove", function(x, y) {
            pointer.x = x;
            pointer.y = y;
            return this.execute(function(x, y, isDown, viewportStage) {
                        var evt = document.createEvent('Event');
                        evt.initEvent('mousemove', true, true);
                        evt.button = isDown ? 0 : -1;
                        evt.which = isDown ? 1 : 0;
                        evt.clientX = x;
                        evt.clientY = y;
                        document.getElementById(viewportStage).dispatchEvent(evt);
                    }, x, y, pointer.isDown, viewportStage);
        }, true);

        client.addCommand("pointerUp", function() {
            pointer.isDown = false;
            return this.execute(function(x, y, viewportStage) {
                        var evt = document.createEvent('Event');
                        evt.initEvent('mouseup', true, true);
                        evt.button = 0;
                        evt.which = 1;
                        evt.clientX = x;
                        evt.clientY = y;
                        document.getElementById(viewportStage).dispatchEvent(evt);
                    }, pointer.x, pointer.y, viewportStage);
        }, true);
    }
};
