var files = [
  /** HELPER FUNCTIONS **/
  "./common.js",
  /** COMMON TEST CODE THAT RUNS IN BROWSER AND NODE **/
  "./controls/controls.js",
  "./core/animation.js",
  "./core/core.js",
  "./core/events.js",
  "./core/model.js",
  "./core/scenes.js",
  "./core/storage.js",
  "./core/systems.js",
  "./core/time.js",
  "./core/tween.js",
  "./debug/logging.js",
  "./spatial/2d.js",
  "./spatial/collision.js",
  "./spatial/math.js",
  "./spatial/motion.js",
  "./spatial/platform.js",
  "./spatial/sat.js",
  "./spatial/spatial-grid.js",
  "./spatial/raycast.js"
];

if (typeof require === "function") {
  files.forEach(function(file) {
    require(file);
  });
}

if (typeof window !== "undefined") {
  window.COMMON_TEST_FILES = files;
}
