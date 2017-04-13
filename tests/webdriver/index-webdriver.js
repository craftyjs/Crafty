// NOTE: this index file must always be located at root of webdriver tests directory (Crafty/tests/webdriver)

// ADD ALL TESTS & RUN CONDITIONS HERE
var tests = {
    // Problems with input capture in firefox driver
    'template/template-multi': function(browserName) { return browserName !== "firefox"; },
    'color/color-dom': true,
    'color/color-canvas': true,
    // neither phantomjs nor open sauce support webgl right now
    'color/color-webgl': function(browserName) { return false; }
};


// BROWSERS THAT NEED SYNTHETIC EVENTS
// some browsers don't support triggering native events via webdriver
var syntheticKeyEvents = function(capabilities) {
    return capabilities.browserName in {'safari': 0, 'MicrosoftEdge': 0, 'iphone': 0};
};
var syntheticMouseEvents = function(capabilities) {
    return (capabilities.browserName in {'safari': 0, 'MicrosoftEdge': 0, 'iphone': 0}) ||
            (capabilities.browserName === 'firefox' && capabilities.version === '6.0')  ||
            (capabilities.browserName === 'chrome' && capabilities.version === 'beta');
};


// NON-STANDARD SCREENSHOT REGIONS PER PLATFORM
// ROTATE CCW 90°, CROP TO DOCUMENT REGION, SCALE UP, CROP TO BOUNDS
var rotatedCrops = {};
// These platforms are no longer used, and the updated versions require different regions
// TODO: update them and add the new platforms back to supported-platforms-webdriver
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





// ====
// UUID
// ====
function getRunId(capabilities) {
    return capabilities.browserName + '-' + capabilities.version + '-' + capabilities.platform;
}

// ======
// Config
// ======
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
        if (runCondition !== true && (runCondition === false || !runCondition(browserName, version, platform)))
            excluded.push('tests/webdriver/' + test + '.js');
    }
    return excluded;
};

// =====
// Hooks
// =====
exports.onPrepare = function() {};
exports.before = function() { // BEFORE RUNNING ANY TESTS, WITH GLOBALS AVAILABLE
    var capabilities = global.browser.desiredCapabilities,
        runId = getRunId(capabilities);

    // add commands
    //TODO retry commands with webbriverio/lib/helpers.js/staleElementRetry if need arises (StaleElementReference)
    require('./commands/generic.js')(global.browser, capabilities, runId);
    require('./commands/browser.js')(
        global.browser, capabilities, runId,
        syntheticKeyEvents(capabilities), syntheticMouseEvents(capabilities), rotatedCrops[runId]
    );
    require('./commands/test.js')(global.browser, capabilities, runId, global.QUnit, module.filename);
};
exports.after = function(failures, pid) {};
exports.onComplete = function() {};
