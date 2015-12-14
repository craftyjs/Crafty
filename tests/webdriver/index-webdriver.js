var fs = require('fs'),
    stream = require('stream'),
    q = require('q'),
    qfs = require('q-io/fs'),
    EOL = require('os').EOL,
    jimp = require('jimp'),
    resemble = require('node-resemble-js');


// ADD ALL TESTS & RUN CONDITIONS HERE
var tests = {
    'template-generic': true,
    'template-local': true,
    'template-crafty': true,
    'template-multi': true
};
exports.specs = function() {
    return Object.keys(tests).map(function(t) {
        return 'tests/webdriver/' + t + '.js';
    });
};
exports.exclude = function(browserName, version, platform) {
    var excluded = [],
        runCondition;
    for (var test in tests) {
        runCondition = tests[test];
        if (runCondition !== true && !runCondition(browserName, version, platform))
            excluded.push('tests/webdriver/' + test + '.js');
    }
    return excluded;
};

// UUID
function getRunId(capabilities) {
    return capabilities.browserName + '-' + capabilities.version + '-' + capabilities.platform;
}

// =====
// Hooks
// =====
exports.onPrepare = function() {};
exports.before = function() { // BEFORE RUNNING ANY TESTS, WITH GLOBALS AVAILABLE
    var capabilities = GLOBAL.browser.desiredCapabilities;

    //TODO retry commands with webbriverio/lib/helpers.js/staleElementRetry if need arises (StaleElementReference)
    addGenericCommands(GLOBAL.browser);
    addBrowserSpecificCommands(GLOBAL.browser, capabilities);
    addTestSpecificCommands(GLOBAL.browser, GLOBAL.QUnit, getRunId(capabilities));
    return setBrowserSpecificConfig(GLOBAL.browser, capabilities);
};
exports.after = function(failures, pid) {};
exports.onComplete = function() {};

// CURRENT POINTER STATE
var pointer = { x: 0, y: 0, isDown: false };


function addGenericCommands(client) {

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
}



// NON-STANDARD SCREENSHOT REGIONS PER PLATFORM
var rotatedCrops = {};
rotatedCrops[getRunId({"browserName": "android", "version": "4.1", "platform": "Linux"})] = { x: 0, y: 98, w: 261, h: 196, stretchW: 320, stretchH: 240 };
rotatedCrops[getRunId({"browserName": "android", "version": "5.1", "platform": "Linux"})] = { x: 0, y: 110, w: 261, h: 196, stretchW: 320, stretchH: 240 };
// TODO: iphone 8.4 emulator currently changing screenshot region constantly, readd to supported-browsers and observe region in future
//rotatedCrops[getRunId({"browserName": "iphone", "version": "8.4", "platform": "OS X 10.10"})] = { x: 0, y: 420, w: 217, h: 162, stretchW: 320, stretchH: 240 };
/*{
    "browserName": "iphone",
    "version": "8.4",
    "deviceName": "iPhone Simulator",
    "platform": "OS X 10.10",
    "deviceOrientation": "landscape"
}*/

// CRAFTY STAGE ELEMENT
var viewportStage = 'cr-stage';

function addBrowserSpecificCommands(client, capabilities) {

    // WEBDRIVER COMMAND: NORMALIZED SCREENSHOT - ROTATE CCW 90°, CROP TO DOCUMENT REGION, SCALE UP, CROP TO BOUNDS
    var rotatedCrop = rotatedCrops[getRunId(capabilities)];
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
    if (capabilities.browserName in {'safari': 0, 'MicrosoftEdge': 0, 'iphone': 0}) {
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
    if (capabilities.browserName === 'chrome' && capabilities.version === 'beta') {

        client.addCommand("pointerMove", function(x, y) {
            pointer.x = x;
            pointer.y = y;
            return this.moveToObject('#' + viewportStage, x, y);
        }, true);

    } else if (capabilities.browserName in {'safari': 0, 'MicrosoftEdge': 0, 'iphone': 0} ||
                capabilities.browserName === 'firefox' && capabilities.version === '6.0') {

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
}



// TEST ENVIRONMENT RESOLUTION - lowest common denominator of resolutions across all platforms -> QVGA (240x320) in landscape
var viewportWidth = 320,
    viewportHeight = 240;
// CURRENT TEST BASENAME WITHOUT EXTENSION
var currentTest;


function addTestSpecificCommands(client, QUnit, runId) {

    // QUnit TESTRUNNER SETUP
    QUnit.moduleStart(function( details ) {
        //console.log("Now running:", details.name);
        currentTest = details.name;
    });

    // WEBDRIVER COMMAND: URL SHORTCUT
    client.addCommand("testUrl", function() {
        return this.url('/tests/webdriver/' + currentTest + '.html');
    });

    // WEBDRIVER COMMANDS: SCREENSHOT SHORTCUTS
    client.addCommand("saveExpectedScreenshot", function(suffix, bounds) {
        if (typeof suffix === 'object') {
            bounds = suffix;
            suffix = undefined;
        }
        suffix = suffix ? '-' + suffix : '';
        bounds = bounds || {x: 0, y: 0, w: viewportWidth, h: viewportHeight};

        return this.saveNormalizedScreenshot('tests/assets/webdriver/' + currentTest + suffix + '-expected.png', bounds);
    });
    client.addCommand("saveActualScreenshot", function(suffix, bounds) {
        if (typeof suffix === 'object') {
            bounds = suffix;
            suffix = undefined;
        }
        suffix = suffix ? '-' + suffix : '';
        bounds = bounds || {x: 0, y: 0, w: viewportWidth, h: viewportHeight};

        return this.saveNormalizedScreenshot('build/webdriver/' + currentTest + suffix + '-' + runId + '-actual.png', bounds);
    });

    // WEBDRIVER COMMAND: IMAGE RESAMBLANCE ASSERTION SHORTCUT
    client.addCommand("assertResemble", function() {
        var suffix, bounds, threshold, checkAntialiasing;
        for (var i = 0, l = arguments.length, type; i < l; ++i) {
            type = typeof arguments[i];
            if (type === 'string') suffix = arguments[i];
            else if (type === 'object') bounds = arguments[i];
            else if (type === 'number') threshold = arguments[i];
            else if (type === 'boolean') checkAntialiasing = arguments[i];
        }
        suffix = suffix ? '-' + suffix : '';
        threshold = threshold || 0.05;
        bounds = bounds || {x: 0, y: 0, w: viewportWidth, h: viewportHeight};
        checkAntialiasing = !!checkAntialiasing;

        var expected = 'tests/assets/webdriver/' + currentTest + suffix + '-expected.png',
            actual = currentTest + suffix + '-' + runId + '-actual.png',
            diff = currentTest + suffix + '-' + runId + '-diff.png',
            prefix = 'build/webdriver/';

        return this.resemble(prefix + actual, expected, prefix + diff, bounds, checkAntialiasing)
                .then(function(result) {
                    if (!result || !('misMatchPercentage' in result)) {
                        QUnit.assert.ok(false, "Expected screenshot exists.");
                    } else {
                        QUnit.assert.ok(result.misMatchPercentage < threshold,
                            "Screenshot matches recorded one within error margin:" + EOL +
                            "Error " + result.misMatchPercentage + " >= threshold " + threshold + ".");
                        if (result.misMatchPercentage >= threshold)
                            return q.all([
                                qfs.copy(prefix + actual, prefix + 'failed/' + actual),
                                qfs.copy(prefix + diff, prefix + 'failed/' + diff)
                            ]);
                    }
                });
    });

    // WEBDRIVER COMMAND: WAIT SHORTCUT
    client.addCommand("waitBarrier", function(label, ms) {
        return this.waitForExist('#' + label, ms);
    });
}


function setBrowserSpecificConfig(browser, capabilities) {
    if (capabilities.browserName === 'phantomjs') // setting viewport size doesn't work on all browsers
        return browser.setViewportSize({width: viewportWidth, height: viewportHeight}, true);
}