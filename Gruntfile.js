require("coffee-script");
var fs = require('fs');

module.exports = function (grunt) {
    var pkg = grunt.file.readJSON('package.json');
    var fileList = pkg.files, version = pkg.version;
    var banner =    '/**\n' +
                    ' * <%= pkg.name %> <%= pkg.version %>\n' +
                    ' * <%= pkg.author.url %>\n *\n' +
                    ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %>\n' +
                    ' * Dual licensed under the MIT or GPL licenses.\n' +
                    ' */\n\n';

    var getFiles = function (){
        return fileList;
    };

    var docGen = function(){
        done = this.async();
        buildDir = "build/api/";
        grunt.file.mkdir(buildDir);
        var callback = function(){
            console.log("Documentation created in " + buildDir);
            done();
        };
        var md = require("./build/api-gen");
        md.document(getFiles(), buildDir, "build/template.html", version, callback);
    };

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
                    src: ['crafty.js']
                }
            }
        },

        browserify: {
            dist: {
                files: {
                    'crafty.js': ['src/*.js']
                }
            },
            debug: {
                files: {
                    'crafty.js': ['src/*.js']
                },
                options: {
                    debug: true
                }
            }
        },

        watch: {
            files: ['src/*.js'],
            tasks: ['build:dev']
        },

        uglify: {
            options: {
                banner: banner
            },
            build: {
                src: 'crafty.js',
                dest: 'crafty-min.js'
            }
        },

        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                globals: {
                }
            }
        },

        qunit: {
            all: [
                'tests/core.html',
                'tests/animation/animation.html',
                'tests/stage.html',
                'tests/events.html',
                'tests/math.html',
                'tests/isometric.html',
                'tests/loader.html',
                'tests/text.html',
                'tests/dom.html',
                'tests/tween.html'
            ]
        }, 

        jsvalidate: {
            files: "crafty.js"
        },

    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsvalidate');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-banner');

    grunt.registerTask('version', 'Takes the version into src/version.js', function() {
        fs.writeFileSync('src/version.js', 'module.exports = "' + version + '";');
    });
    
    // Build development
    grunt.registerTask('build:dev', ['browserify:debug', 'usebanner']);
    
    // Build release
    grunt.registerTask('build:release', ['browserify:dist', 'usebanner']);

    // Building the documentation
    grunt.registerTask('api', "Generate api documentation", docGen);

    // Default task.
    grunt.registerTask('default', ['build:dev', 'jsvalidate']);

    // Run the test suite
    grunt.registerTask('check', ['build:dev', 'jsvalidate', 'qunit', 'jshint']);

    // Make crafty.js ready for release - minified version
    grunt.registerTask('release', ['version', 'build:release', 'uglify', 'api']);

    // Run only tests
    grunt.registerTask('validate', ['qunit']);


};
