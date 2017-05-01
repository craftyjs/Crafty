// Define common features
var Crafty = require('./crafty-common.js')();

// Define features only available in browser environment

Crafty.extend(require('./core/loader'));
Crafty.extend(require('./inputs/dom-events'));

// Needs to be required before any specific layers are
require('./graphics/layers');
require('./graphics/canvas');
require('./graphics/canvas-layer');
require('./graphics/webgl');
require('./graphics/webgl-layer');

require('./graphics/color');
require('./graphics/dom');
require('./graphics/dom-helper');
require('./graphics/dom-layer');
require('./graphics/drawing');
require('./graphics/gl-textures');
require('./graphics/renderable');
require('./graphics/html');
require('./graphics/image');
require('./graphics/particles');
require('./graphics/sprite-animation');
require('./graphics/sprite');
require('./graphics/text');
require('./graphics/viewport');

require('./isometric/diamond-iso');
require('./isometric/isometric');

require('./controls/inputs');
require('./controls/device');

require('./sound/sound');

require('./debug/debug-layer');

// Define some aliases for renamed properties
require('./aliases').defineAliases(Crafty);

if(window) window.Crafty = Crafty;

module.exports = Crafty;
