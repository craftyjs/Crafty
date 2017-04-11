require("coffee-script");
var path = require("path"),
    fs = require("fs"),
    EOL = require("os").EOL;

var request = require("request"),
    open = require("open"),
    semver = require("semver");

var pathToQUnit = path.dirname(path.relative(path.resolve(), require.resolve('qunitjs')));

module.exports = function (grunt) {
    var banner = '/**\n' +
                ' * <%= pkg.name %> <%= pkg.version %>\n' +
                ' * <%= pkg.author.url %>\n *\n' +
                ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %>\n' +
                ' * Licensed under the MIT license.\n' +
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
      this.async();
      apiServer(grunt, "./build/api.json");
      setTimeout(function(){
        open("http://localhost:8080");
      }, 100);
    }


    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        supportedBrowsers: grunt.file.readJSON('supported-browsers.json'),

        copy: {
            lib: {
                expand: true,
                flatten: true,
                src: pathToQUnit + '/*',
                dest: 'tests/unit/lib/',
            },
        },

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
            playgrounds: ['playgrounds/**/*.js'],
            build: ['build/**/*.js'],
            dev: ['crafty.js'],
            release: ['dist/crafty.js', 'dist/crafty-min.js']
        },

        jshint: {
            options: {
                jshintrc: true,
                extract: 'auto'
            },
            misc: ['Gruntfile.js'],
            src: ['src/**/*.js', 'src/**/*.html'],
            tests: ['tests/**/*.js', 'tests/**/*.html', '!tests/unit/lib/**/*.js'],
            playgrounds: ['playgrounds/**/*.js', 'playgrounds/**/*.html']
        },


        qunit: {
            /* PhantomJS has propblem with url parameter "noGlobal", omit for now
            options: {
                noGlobals: true
            },
            */
            browser: ['tests/unit/index.html']
        },

        'qunit-node': {
            options: {
                noglobals: true
            },
            node: {
                src: 'tests/unit/index-headless.js',
                options: {
                    // requireExpects: true,
                    setup: function (qunit) {
                        qunit.on('testEnd', function (testEnd) {
                            testEnd.errors.forEach(function (error) {
                                var actual = qunit.dump.parse(error.actual),
                                expected = qunit.dump.parse(error.expected),
                                reason = 'Actual value ' + actual + ' does not match expected value ' + expected,
                                message = 'Description: ' + error.message + EOL +
                                'Reason: ' + reason + EOL +
                                'Stack: ' + error.stack;

                                grunt.log.errorlns(message);
                            });
                        });
                    }
                }
            }
        },

        'saucelabs-qunit': {
            browser: {
                options: {
                    urls: [ 'http://localhost:8000/tests/unit/index.html' ],
                    browsers: '<%= supportedBrowsers %>',
                    testname: "Cross-browser compatibility tests for CraftyJS",
                    build: process.env.TRAVIS_BUILD_NUMBER,
                    tags: [ process.env.TRAVIS_BRANCH ],
                    identifier: process.env.TRAVIS_JOB_NUMBER,
                    tunneled: false,
                    'public': 'public',
                    sauceConfig: {
                        "recordVideo": false,
                        "recordScreenshots": true,
                        "disablePopupHandler": true,
                        "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
                        "tunnelIdentifier": process.env.TRAVIS_JOB_NUMBER
                    },
                    throttled: 5,
                    'max-duration': 480,
                    statusCheckAttempts: 150
                }
            }
        },

        webdriver: {
            options: {
            },
            local: {
                configFile: './tests/webdriver/index-webdriver-local.js'
            },
            cloud: {
                configFile: './tests/webdriver/index-webdriver-cloud.js'
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
        },

        run: {
            phantomjs: {
                cmd: require('phantomjs-prebuilt').path,
                args: [ '--webdriver=4444' ],
                options: {
                    quiet: true,
                    wait: false,
                    ready: /.*GhostDriver.*running.*/i
                }
            }
        },

        'gh-pages': {
            options: {
                silent: true,
            },
            'crafty-distro-regression-tests': {
              options: {
                repo: 'https://' + process.env.GH_TOKEN + '@github.com/craftyjs/Crafty-Distro.git',
                branch: 'regression-tests',
                message: 'Auto-generated commit of Travis build ' + process.env.TRAVIS_BUILD_NUMBER,
                user: {
                    name: 'Travis',
                    email: 'travis@travis-ci.org'
                },
                base: 'build/webdriver/failed'
                //add: false,
                //only: ['**/*', '!README.md']
              },
              src: ['**/*.png']
            }
        }

    });

    // Load grunt tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jsvalidate');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-qunit-node');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-webdriver');


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

        grunt.log.ok('Updated version in all files.');
    });

    grunt.registerTask('changelog', 'Copies changelog to file', function() {
        var done = this.async();

        var changelog = grunt.option('changelog');
        if (typeof changelog === 'undefined') {
            grunt.fatal("No command-line argument '--changelog' specified. Rerun the task with the appropriate argument value." + EOL +
                "Use '--changelog=false' to indicate that you DON'T want to update the changelog." + EOL +
                "Use '--changelog=true' to indicate that you DO want to update the changelog." + " " +
                "However, first make sure that the release notes on the wiki are updated for the version you are about to release.");
        } else if (changelog === true) {
            request
                .get('https://raw.github.com/wiki/craftyjs/Crafty/Release-Notes.md')
                .on('error', function(err) {
                    grunt.fatal(err);
                })
                .on('response', function(response) {
                    if (response.statusCode === 200) {
                        grunt.log.ok('Successfully retrieved release notes.');
                        done();
                    } else {
                        grunt.fatal('Error while retrieving release notes: ' + response.statusCode);
                    }
                })
                .pipe(fs.createWriteStream('CHANGELOG.md'));
        }
    });


    // Run local tests
    grunt.registerTask('test-local-browser', ['qunit:browser']);
    grunt.registerTask('test-local-node', ['qunit-node:node']);
    grunt.registerTask('test-local-webdriver', ['run:phantomjs', 'webdriver:local']);
    grunt.registerTask('test-local', [
        'test-local-browser', 'test-local-node', 'test-local-webdriver'
    ]);


    // Run tests in the cloud
    grunt.registerTask('test-cloud-browser', ['saucelabs-qunit:browser']);
    grunt.registerTask('test-cloud-webdriver', ['webdriver:cloud']);
    grunt.registerTask('test-cloud', function() {
        // execute cloud tests only in travis, while on testing branch, with open sauce lab credentials
        var branch =  process.env.TRAVIS_BRANCH;
        if (process.env.TRAVIS && branch === process.env.SAUCE_BRANCH &&
            process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY)
            grunt.task.run('connect', 'test-cloud-browser', 'test-cloud-webdriver');
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
    grunt.registerTask('test', ['test-local', 'test-cloud']);

    // Rebuild, validate and run the test suite
    grunt.registerTask('check', ['build:dev', 'validate', 'test']);

    // Default task - debug version
    grunt.registerTask('default', ['jsvalidate:src', 'build:dev', 'jsvalidate:dev']);

    // Make crafty.js ready for release - minified version
    grunt.registerTask('release', ['version', 'changelog', 'build:release', 'uglify', 'jsvalidate:release', 'api']);

};
