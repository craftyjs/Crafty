exports.config = {
    specs: require('./index-webdriver.js').specs(),
    framework: 'qunit',
    baseUrl: 'http://localhost:8000',

    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    capabilities: (function() {
        var baseCapabilities = {
            recordVideo: false,
            recordScreenshots: true,
            maxDuration: 300,
            commandTimeout: 60,
            idleTimeout: 90,

            name: '(WIP) Cross-browser regression tests for CraftyJS',
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
            tags: [ process.env.TRAVIS_BRANCH ],
            build: process.env.TRAVIS_BUILD_NUMBER,
            'public': 'public'
        };

        var browsers = require('../../supported-browsers.json');
        browsers.forEach(function(capabilities) {
            for (var k in baseCapabilities)
                capabilities[k] = baseCapabilities[k];

            capabilities.exclude = require('./index-webdriver.js').exclude(
                capabilities.browserName, capabilities.version, capabilities.platform
            );
        });

        return browsers;
    })(),
    updateJob: true,
    waitforTimeout: 2000,

    logLevel: 'silent', //'verbose'
    coloredLogs: true,
    screenshotPath: 'build/webdriver/failed',

    onPrepare: require('./index-webdriver.js').onPrepare,
    before: require('./index-webdriver.js').before,
    after: require('./index-webdriver.js').after,
    onComplete: require('./index-webdriver.js').onComplete
};
