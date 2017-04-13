// NOTE: this index file must always be located at root of webdriver tests directory (Crafty/tests/webdriver)

// ADD ALL TESTS & RUN CONDITIONS HERE
var canRunWebdriver = function(capabilities) {
    return !("noWebdriver" in capabilities);
};
var hasWebGL = function(capabilities) {
    return "hasWebGL" in capabilities;
};

var tests = {
    'template/template-multi': canRunWebdriver,
    'color/color-dom': canRunWebdriver,
    'color/color-canvas': canRunWebdriver,
    // only edge supports webgl for webdriver right now
    'color/color-webgl': function(capabilities) {
        return canRunWebdriver(capabilities) && hasWebGL(capabilities);
    }
};


// BROWSERS THAT NEED SYNTHETIC EVENTS
// some browsers don't support triggering native events via webdriver
var syntheticKeyEvents = function(capabilities) {
    return 'syntheticKeyEvents' in capabilities;
};
var syntheticMouseEvents = function(capabilities) {
    return 'syntheticMouseEvents' in capabilities;
};


// TODO: FIX NON-STANDARD SCREENSHOT REGIONS FOR MOBILE BROWSERS
// NON-STANDARD SCREENSHOT REGIONS PER PLATFORM
// ROTATE CCW 90°, CROP TO DOCUMENT REGION, SCALE UP, CROP TO BOUNDS
var rotatedCrops = {};
// These platforms are no longer used, and the updated versions require different regions
//rotatedCrops[getRunId({"browserName": "android", "version": "4.1", "platform": "Linux"})] = { x: 0, y: 98, w: 261, h: 196, stretchW: 320, stretchH: 240 };
//rotatedCrops[getRunId({"browserName": "android", "version": "5.1", "platform": "Linux"})] = { x: 0, y: 110, w: 261, h: 196, stretchW: 320, stretchH: 240 };
//rotatedCrops[getRunId({"browserName": "iphone", "version": "8.4", "platform": "OS X 10.10"})] = { x: 0, y: 420, w: 217, h: 162, stretchW: 320, stretchH: 240 };





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
exports.exclude = function(capabilities) {
    var excluded = [],
        runCondition;
    for (var test in tests) {
        runCondition = tests[test];
        if (runCondition === false || !runCondition(capabilities))
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
