/** BROWSER-SPECIFIC TEST CODE **/
var files = [
    './graphics/color.js',
    './debug/debug.js',
    './sound/audio.js',
    './controls/inputs.js',
    './graphics/dom.js',
    './graphics/dom-helper.js',
    './isometric/isometric.js',
    './core/loader.js',
    './graphics/viewport.js',
    './graphics/text.js',
    './graphics/sprite-animation.js',
];

if (typeof window !== 'undefined') {
    window.BROWSER_TEST_FILES = files;
}
