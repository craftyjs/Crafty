var Crafty = require('./core/core');

Crafty.easing = require('./core/animation');
Crafty.extend(require('./core/extensions'));
Crafty.extend(require('./core/loader'));
Crafty.c('Model', require('./core/model'));
Crafty.extend(require('./core/scenes'));
Crafty.storage = require('./core/storage');
Crafty.c('Delay', require('./core/time'));
Crafty.c('Tween', require('./core/tween'));

require('./core/systems');

require('./spatial/2d');
require('./spatial/motion');
require('./spatial/platform');
require('./spatial/collision');
require('./spatial/spatial-grid');
require('./spatial/rect-manager');
require('./spatial/math');

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
require('./controls/controls-system');
require('./controls/controls');
require('./controls/device');
require('./controls/keycodes');

require('./sound/sound');

require('./debug/debug-layer');
require('./debug/logging');

if(window) window.Crafty = Crafty;

module.exports = Crafty;
