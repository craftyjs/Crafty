require("coffee-script");
var open = require("open"),
    semver = require("semver");

module.exports = function (grunt) {
    var banner = '/**\n' +
                ' * <%= pkg.name %> <%= pkg.version %>\n' +
                ' * <%= pkg.author.url %>\n *\n' +
                ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %>\n' +
                ' * Dual licensed under the MIT or GPL licenses.\n' +
                ' */\n\n';

    var docGen = function() {
        var outputFile = "./build/api.json";
        var sourceParser = require("./build/parseSourceDocs");
        var apiGenerator = require("./build/parseNodes");

        var sourceFiles = grunt.file.expand('src/**/*.js');
        var blocks = sourceParser.parse(sourceFiles);
        var jsonObject = apiGenerator.structureBlocks(blocks);

        var apiJSON = JSON.stringify(jsonObject, null, 4);
        grunt.file.write(outputFile, apiJSON);
        grunt.log.writeln("Wrote api data to " + outputFile);
    };

    var apiServer = require("./build/api-gen/dynamic-server.js");
    function runApiServer() {
      var done = this.async();
      apiServer(grunt, "./build/api.json");
      setTimeout(function(){
        open("http://localhost:8080");
      }, 100);
    }


    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        usebanner: {
            release: {
                options: {
                    position: 'top',
                    banner: banner
                },
                files: {
                    src: ['dist/crafty.js']
                }
            },
            dev: {
                options: {
                    position: 'top',
                    banner: banner
                },
                files: {
                    src: ['crafty.js']
                }
            }
        },

        browserify: {
            release: {
                files: {
                    'dist/crafty.js': ['src/crafty.js']
                },
                options: {
                    transform: ['brfs']
                }
            },
            dev: {
                files: {
                    'crafty.js': ['src/crafty.js']
                },
                options: {
                    debug: true,
                    transform: ['brfs']
                }
            }
        },

        watch: {
            files: ['src/**/*.js'],
            tasks: ['build:dev']
        },

        uglify: {
            options: {
                banner: banner
            },
            build: {
                src: 'dist/crafty.js',
                dest: 'dist/crafty-min.js'
            }
        },

        jsvalidate: {
            misc: ['Gruntfile.js'],
            src: ['src/**/*.js'],
            tests: ['tests/**/*.js'],
            dev: ['crafty.js'],
            release: ['dist/crafty.js', 'dist/crafty-min.js']
        },

        jshint: {
            misc: ['Gruntfile.js'],
            src: ['src/**/*.js'],
            tests: ['tests/**/*.js'],
            options: {
                trailing: true,
                ignores: ['tests/lib/*.js'],
                globals: {
                }
            }
        },

        qunit: {
            all: ['tests/index.html']
        },

        'node-qunit': {
            all: {
                code: 'tests/index_headless.js',
                setup: {
                    log: {
                        errors: true,
                        //tests: true,
                        globalSummary: true
                    }
                },
                callback: function(err, res) {
                    if (!err)
                        grunt.log.ok("Node tests successful!");
                    else
                        grunt.log.error("Node tests failed!");
                }
            }
        },

        'saucelabs-qunit': {
            all: {
                options: {
                    urls: [ 'http://localhost:8000/tests/index.html' ],
                    browsers: [
                        // see http://kangax.github.io/compat-table/es5/
                        // see https://github.com/mucaho/Mars/blob/master/tools/es5-mobile-compat-table.md
                        /*
                         * OLDEST COMPATIBLE BROWSERS
                         */
                        // WINDOWS
                        {
                            browserName: 'internet explorer',
                            version: '9.0',
                            platform: 'Windows 7'
                        }, {
                            browserName: 'firefox',
                            version: '4.0',
                            platform: 'Windows XP'
                        }, {
                            browserName: 'chrome',
                            version: '26.0', // should be 6
                            platform: 'Windows XP'
                        }, {
                            browserName: 'opera',
                            version: '12.12',
                            platform: 'Windows XP'
                        }, /* { // is not available as target browser currently
                            browserName: 'safari',
                            version: '6.0', // should be 5.1
                            platform: 'Windows 7'
                        }, */

                        // MAC
                        {
                            browserName: 'firefox',
                            version: '4.0',
                            platform: 'OS X 10.8'
                        }, {
                            browserName: 'chrome',
                            version: '27.0', // should be 6
                            platform: 'OS X 10.8'
                        }, {
                            browserName: 'safari',
                            version: '6.0', // should be 5.1
                            platform: 'OS X 10.8'
                        },

                        // LINUX
                        {
                            browserName: 'firefox',
                            version: '4.0',
                            platform: 'Linux'
                        }, {
                            browserName: 'chrome',
                            version: '26.0', // should be 6
                            platform: 'Linux'
                        }, {
                            browserName: 'opera',
                            version: '12.15',
                            platform: 'Linux'
                        },


                        // Android
                        {
                            browserName: 'android',
                            version: '4.0', // should be 2.3.3
                            deviceName: 'Android Emulator',
                            platform: 'Linux'
                        },
                        // PocketMAC
                        {
                            browserName: 'iphone',
                            version: '5.1', // should be 4.3
                            deviceName: 'iPhone Simulator',
                            platform: 'OS X 10.10'
                        }, {
                            browserName: 'iphone',
                            version: '5.1', // should be 4.3
                            deviceName: 'iPad Simulator',
                            platform: 'OS X 10.10'
                        }
                    ],
                    testname: "Cross-browser compatibility tests for CraftyJS",
                    build: process.env.TRAVIS_BUILD_NUMBER,
                    tags: [ process.env.TRAVIS_BRANCH ],
                    'public': 'public',
                    sauceConfig: {
                        "recordVideo": false,
                        "recordScreenshots": true,
                        "disablePopupHandler": true,
                        //"tunnelIdentifier": process.env.TRAVIS_JOB_NUMBER
                    },
                    throttled: 5,
                    'max-duration': 300,
                    statusCheckAttempts: 150
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }
        },

        open: {
            api : {
              path: 'http://localhost:8080/',
            },
        }

    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jsvalidate');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-node-qunit');
    grunt.loadNpmTasks('grunt-saucelabs');
 
    grunt.registerTask('check-saucelabs', function() {
        // execute this task only in travis and only if open sauce lab credentials are available
        if (process.env.CI && process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
            grunt.task.run('connect');
            grunt.task.run('saucelabs-qunit');
        }
    });


    grunt.registerTask('version', 'Propagates version changes', function() {
        var pkg = grunt.config.get('pkg');
        var version = grunt.option('crafty-version');
        if (!version) {
            grunt.warn("No command-line argument '--crafty-version' specified. Rerun the task with '--crafty-version=X.X.X'. You can force a release with the previous version.");
            version = pkg.version;
        }
        if (!semver.gt(version, pkg.version)) {
            grunt.warn("Command-line argument '--crafty-version' is not greater than previous version.");
        }
        pkg.version = version;
        grunt.config.set('pkg', pkg);

        grunt.file.write('package.json', JSON.stringify(pkg, null, 2));
        grunt.file.write('src/core/version.js', 'module.exports = "' + version + '";');
    });

    // Build development
    grunt.registerTask('build:dev', ['browserify:dev', 'usebanner:dev']);
    // Build release
    grunt.registerTask('build:release', ['browserify:release', 'usebanner:release']);
    // Building the documentation
    grunt.registerTask('api', "Generate api documentation", docGen);
    grunt.registerTask('api-server', "View dynamically generated docs", runApiServer);
    grunt.registerTask('view-api', ['api', 'api-server'] );

    // Run only validation and lint
    grunt.registerTask('validate', ['jsvalidate', 'jshint']);
    // Run only test suite
    grunt.registerTask('test', ['qunit', 'node-qunit', 'check-saucelabs']);

    // Rebuild, validate and run the test suite
    grunt.registerTask('check', ['build:dev', 'validate', 'test']);

    // Default task - debug version
    grunt.registerTask('default', ['jsvalidate:src', 'build:dev', 'jsvalidate:dev']);

    // Make crafty.js ready for release - minified version
    grunt.registerTask('release', ['version', 'build:release', 'uglify', 'jsvalidate:release', 'api']);

};
