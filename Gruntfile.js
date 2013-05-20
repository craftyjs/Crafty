module.exports = function (grunt) {

    var banner =    '/**\n' +
                    ' * <%= pkg.name %> <%= pkg.version %>\n' +
                    ' * <%= pkg.author.url %>\n *\n' +
                    ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %>\n' +
                    ' * Dual licensed under the MIT or GPL licenses.\n' +
                    ' */\n\n';

        // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: '\n',
                banner: banner
            },
            dist: {
                src: [
                    'src/core.js',
                    'src/intro.js',
                    'src/HashMap.js',
                    'src/2D.js',
                    'src/collision.js',
                    'src/hitbox.js',
                    'src/DOM.js',
                    'src/fps.js',
                    'src/html.js',
                    'src/storage.js',
                    'src/extensions.js',
                    'src/device.js',
                    'src/sprite.js',
                    'src/canvas.js',
                    'src/controls.js',
                    'src/animate.js',
                    'src/animation.js',
                    'src/drawing.js',
                    'src/isometric.js',
                    'src/particles.js',
                    'src/sound.js',
                    'src/text.js',
                    'src/loader.js',
                    'src/math.js',
                    'src/time.js',
                    'src/outro.js'
                ],
                dest: 'crafty.js'
            }
        },

        uglify: {
            options: {
                banner: banner
            },
            build: {
                src: 'crafty.js',
                dest: 'crafty.min.js'
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
            all: ['tests/**/*.html']
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

};
