var files = [
    /** HELPER FUNCTIONS **/
    './common.js',
    /** COMMON TEST CODE THAT RUNS IN BROWSER AND NODE **/
    './core/core.js',
    './spatial/2d.js',
    './debug/logging.js',
    './controls/controls.js',
    './core/events.js',
    './spatial/math.js',
    './core/model.js',
    './core/storage.js',
    './core/systems.js',
    './core/time.js',
    './core/tween.js',
    './spatial/collision.js',
    './spatial/sat.js',
    './spatial/spatial-grid.js',
    './spatial/raycast.js'
];

if (typeof require === 'function') {
    files.forEach(function (file) {
        require(file);
    });
}

if (typeof window !== 'undefined') {
    window.COMMON_TEST_FILES = files;
}
