require("coffee-script");
var open = require("open");

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
            dist: {
                options: {
                    position: 'top',
                    banner: banner
                },
                files: {
                    src: ['dist/crafty.js']
                }
            },
            debug: {
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
            dist: {
                files: {
                    'dist/crafty.js': ['src/crafty.js']
                },
                options: {
                    transform: ['brfs']
                }
            },
            debug: {
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
            files: ['src/*.js', 'src/**/*.js'],
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

        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'tests/**/*.js'],
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
                deps: 'tests/lib/helperFunctions.js',
                code: 'tests/index_headless.js',
                tests: [
                    'tests/common.js',
                    'tests/core.js',
                    'tests/2d.js',
                    'tests/logging.js',
                    'tests/controls.js',
                    'tests/events.js',
                    //TODO add these once isometric adapted:
                    //'tests/isometric.js',
                    'tests/math.js',
                    'tests/model.js',
                    'tests/storage.js',
                    'tests/systems.js',
                    'tests/time.js',
                    'tests/tween.js',
                    'tests/issue746/mbr.js',
                    'tests/issue746/pos.js',
                    'tests/2D/collision/collision.js',
                    'tests/2D/collision/sat.js'
                ],
                setup: {
                    log: {
                        errors: true,
                        //tests: true,
                        globalSummary: true
                    }
                },
                done: function(err, res) {
                    if (!err)
                        grunt.log.ok("NODE TESTS SUCCESSFUL");
                    else
                        grunt.log.error("NODE TESTS FAILED");
                }
            }
        },

        jsvalidate: {
            files: ['crafty.js', 'tests/**/*.js']
        },

        connect: {
            server: {
                options: {
                    keepalive: true
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

 

    grunt.registerTask('version', 'Propagates version changes', function() {
        var pkg = grunt.config.get('pkg');
        var version = grunt.option('crafty_version');
        if (!version) {
            grunt.warn("No command-line argument 'crafty_version' specified. Rerun the task with '--crafty_version=X.X.X'.");
            version = pkg.version;
        }
        if (version === pkg.version) {
            grunt.warn("Command-line argument 'crafty_version' is same as previous release version.");
        }
        pkg.version = version;
        grunt.config.set('pkg', pkg);

        grunt.file.write('package.json', JSON.stringify(pkg, null, 2));
        grunt.file.write('src/core/version.js', 'module.exports = "' + version + '";');
    });

    // Build development
    grunt.registerTask('build:dev', ['browserify:debug', 'usebanner:debug']);

    // Build release
    grunt.registerTask('build:release', ['browserify:dist', 'usebanner:dist']);

    // Building the documentation
    grunt.registerTask('api', "Generate api documentation", docGen);

    // Default task.
    grunt.registerTask('default', ['build:dev', 'jsvalidate']);

    // Run the test suite
    grunt.registerTask('check', ['build:dev', 'jsvalidate', 'qunit', 'node-qunit', 'jshint']);

    // Make crafty.js ready for release - minified version
    grunt.registerTask('release', ['version', 'build:release', 'uglify', 'api']);

    // Run only tests
    grunt.registerTask('validate', ['qunit', 'node-qunit']);

    grunt.registerTask('api-server', "View dynamically generated docs", runApiServer);
    grunt.registerTask('view-api', ['api', 'api-server'] );

};
