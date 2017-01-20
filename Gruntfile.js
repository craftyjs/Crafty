require("coffee-script");
var open = require("open"),
    semver = require("semver");


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
            tests: ['tests/**/*.js', 'tests/**/*.html', '!tests/lib/**/*.js'],
            playgrounds: ['playgrounds/**/*.js', 'playgrounds/**/*.html']
        },


        qunit: {

            browser: ['tests/index.html']
        },

        'node-qunit': {
            node: {
                code: 'tests/index-headless.js',
                setup: {
                    log: {
                        errors: true,
                        //tests: true,
                        globalSummary: true
                    }
                },
                callback: function(err, res) {
                    if (!err && res.failed === 0)
                        grunt.log.ok("Node tests successful.");
                    else
                        grunt.log.error("Node tests failed!");
                }
            }
        },

        'saucelabs-qunit': {
            browser: {
                options: {
                    urls: [ 'http://localhost:8000/tests/index.html' ],
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
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jsvalidate');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-node-qunit');
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
    });


    // Run local tests
    grunt.registerTask('test-local-browser', ['qunit:browser']);
    grunt.registerTask('test-local-node', ['node-qunit:node']);
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
    grunt.registerTask('release', ['version', 'build:release', 'uglify', 'jsvalidate:release', 'api']);

};
