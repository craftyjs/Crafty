/** BROWSER-SPECIFIC TEST CODE **/
var files = [
  "./core/loader.js",
  "./debug/debug.js",
  "./graphics/color.js",
  "./graphics/dom.js",
  "./graphics/dom-helper.js",
  "./graphics/sprite-animation.js",
  "./graphics/text.js",
  "./graphics/viewport.js",
  "./inputs/inputs.js",
  "./isometric/isometric.js",
  "./sound/audio.js"
];

if (typeof window !== "undefined") {
  window.BROWSER_TEST_FILES = files;
}
