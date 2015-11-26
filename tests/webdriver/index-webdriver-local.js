exports.config = {
    specs: (function() { return require('./index-webdriver.js').specs(); })(),
    framework: 'qunit',
    baseUrl: './',

    capabilities: [{
        browserName: 'phantomjs'
    }],
    updateJob: false,
    waitforTimeout: 1000,

    logLevel: 'silent',
    coloredLogs: true,
    screenshotPath: 'build/webdriver/failed',

    onPrepare: require('./index-webdriver.js').onPrepare,
    before: require('./index-webdriver.js').before,
    after: require('./index-webdriver.js').after,
    onComplete: require('./index-webdriver.js').onComplete
};
