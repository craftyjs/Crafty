var path = require("path"),
    q = require("q"),
    qfs = require("q-io/fs"),
    EOL = require("os").EOL;

// TEST ENVIRONMENT RESOLUTION - lowest common denominator of resolutions across all platforms -> QVGA (240x320) in landscape
var viewportWidth = 320,
    viewportHeight = 240;

// BASE PATHS FOR TEST SPECIFIC FILES
var testPath = "tests/webdriver/",
    expectedPath = "tests/webdriver/assets/",
    resultPath = "build/webdriver/",
    failedPath = resultPath + "failed/";

module.exports = function addTestSpecificCommands(
    client,
    capabilities,
    runId,
    QUnit,
    indexModuleFileName
) {
    // CURRENT TEST BASENAME AND RELATIVE PATH WITHOUT EXTENSION
    function currentTestPath() {
        return QUnit.config.current.module.name;
    }
    function currentTestName() {
        return path.basename(currentTestPath());
    }

    // QUnit TESTRUNNER SETUP
    var qunitModule = QUnit.module;
    QUnit.module = function(testModule) {
        if (typeof testModule === "string")
            throw new Error(
                "Custom module names are not supported in webdriver tests. Call `QUnit.module(module)` per start of file instead."
            );

        var testFilePath = path.relative(
                path.dirname(indexModuleFileName),
                testModule.filename
            ),
            testFilePathNoExt =
                testFilePath.substr(0, testFilePath.lastIndexOf(".")) ||
                testFilePath;
        // need to convert possible windows path (with backslashes) to url (with forwardslashes)
        qunitModule(testFilePathNoExt.replace(/\\/g, "/"));
    };

    // WEBDRIVER COMMAND: TEST PAGE URL SHORTCUT
    client.addCommand("testUrl", function(testName, testScript) {
        if (typeof testName === "string" && typeof testScript === "undefined") {
            testScript = testName;
            testName = undefined;
        }

        console.log(
            "\n# Starting " +
                (testName || currentTestName()) +
                " test for " +
                runId
        );

        if (typeof testScript === "string") {
            var testFilePath =
                    resultPath + (testName || currentTestName()) + ".html",
                testFile =
                    "<!DOCTYPE html>" +
                    EOL +
                    "<html>" +
                    EOL +
                    "<head>" +
                    EOL +
                    "  <meta charset='UTF-8'>" +
                    EOL +
                    "  <title>CraftyJS Webdriver Test</title>" +
                    EOL +
                    "  <link rel='stylesheet' href='../../tests/webdriver/common.css'>" +
                    EOL +
                    "  <script src='../../tests/webdriver/common.js'></script>" +
                    EOL +
                    "  <script src='../../crafty.js'></script>" +
                    EOL +
                    "</head>" +
                    EOL +
                    "<body>" +
                    EOL +
                    "<script>" +
                    EOL +
                    "window.addEventListener('load'," +
                    testScript.toString() +
                    ", false);" +
                    EOL +
                    "</script>" +
                    EOL +
                    "</body>" +
                    EOL +
                    "</html>" +
                    EOL;
            return (
                qfs
                    .write(testFilePath, testFile, "w+")
                    // all urls need a prepended "/" so that they are expanded based upon baseUrl in config
                    .then(this.url.bind(this, "/" + testFilePath))
            );
        } else {
            // all urls need a prepended "/" so that they are expanded based upon baseUrl in config
            return this.url("/" + testPath + currentTestPath() + ".html");
        }
    });

    // WEBDRIVER COMMANDS: SCREENSHOT SHORTCUTS
    client.addCommand("saveExpectedScreenshot", function(pathMod, bounds) {
        var suffix, testName;
        if (typeof pathMod === "object") bounds = pathMod;
        else if (typeof pathMod === "string")
            if (pathMod.charAt(0) === "-") suffix = pathMod;
            else testName = pathMod;

        suffix = suffix || "";
        testName = testName || currentTestName();
        bounds = bounds || { x: 0, y: 0, w: viewportWidth, h: viewportHeight };

        return this.saveNormalizedScreenshot(
            expectedPath + testName + suffix + "-expected.png",
            bounds
        );
    });
    client.addCommand("saveActualScreenshot", function(suffix, bounds) {
        if (typeof suffix === "object") {
            bounds = suffix;
            suffix = undefined;
        }
        suffix = suffix ? "-" + suffix : "";
        bounds = bounds || { x: 0, y: 0, w: viewportWidth, h: viewportHeight };

        return this.saveNormalizedScreenshot(
            resultPath +
                currentTestName() +
                suffix +
                "-" +
                runId +
                "-actual.png",
            bounds
        );
    });

    // WEBDRIVER COMMAND: IMAGE RESAMBLANCE ASSERTION SHORTCUT
    client.addCommand("assertResemble", function() {
        var suffix, testName, bounds, threshold, checkAntialiasing;
        for (var i = 0, l = arguments.length, type; i < l; ++i) {
            type = typeof arguments[i];
            if (type === "object") bounds = arguments[i];
            else if (type === "number") threshold = arguments[i];
            else if (type === "boolean") checkAntialiasing = arguments[i];
            else if (type === "string")
                if (arguments[i].charAt(0) === "-") suffix = arguments[i];
                else testName = arguments[i];
        }
        suffix = suffix || "";
        testName = testName || currentTestName();
        threshold = threshold || 0.05;
        bounds = bounds || { x: 0, y: 0, w: viewportWidth, h: viewportHeight };
        checkAntialiasing = !!checkAntialiasing;

        var expected = testName + suffix + "-expected.png",
            actual = currentTestName() + suffix + "-" + runId + "-actual.png",
            diff = currentTestName() + suffix + "-" + runId + "-diff.png";

        return this.resemble(
            resultPath + actual,
            expectedPath + expected,
            resultPath + diff,
            bounds,
            checkAntialiasing
        ).then(function(result) {
            if (!result || !("misMatchPercentage" in result)) {
                QUnit.assert.ok(false, "Expected screenshot exists.");
            } else {
                QUnit.assert.ok(
                    result.misMatchPercentage < threshold,
                    "Screenshot matches recorded one within error margin:" +
                        EOL +
                        "Error " +
                        result.misMatchPercentage +
                        " >= threshold " +
                        threshold +
                        "."
                );
                if (result.misMatchPercentage >= threshold)
                    return q.all([
                        qfs.copy(resultPath + actual, failedPath + actual),
                        qfs.copy(resultPath + diff, failedPath + diff)
                    ]);
            }
        });
    });

    // WEBDRIVER COMMAND: WAIT FOR BROWSER SIGNAL SHORTCUT
    client.addCommand("waitBarrier", function(label, ms) {
        return this.waitForExist("#" + label, ms);
    });
    // WEBDRIVER COMMAND: SIGNAL TO BROWSER SHORTCUT
    client.addCommand("signalBarrier", function(label) {
        return this.execute(function(label) {
            window.triggerBarrierSignal(label);
        }, label);
    });
};
