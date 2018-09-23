exports.config = {
    specs: require("./index-webdriver.js").specs(),
    framework: "qunit",
    baseUrl: "./",
    sync: false,

    capabilities: [
        {
            browserName: "phantomjs",
            exclude: require("./index-webdriver.js").exclude({
                browserName: "phantomjs"
            })
        }
    ],
    updateJob: false,
    waitforTimeout: 3000,
    // maxInstances: 1, // uncomment this for debugging

    logLevel: "silent", // 'verbose' for debugging
    coloredLogs: true,
    screenshotPath: "build/webdriver/failed",

    onPrepare: require("./index-webdriver.js").onPrepare,
    before: require("./index-webdriver.js").before,
    after: require("./index-webdriver.js").after,
    onComplete: require("./index-webdriver.js").onComplete
};
