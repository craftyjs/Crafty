var Crafty = require('./core/core');

require('./core/animation');
require('./core/extensions');
require('./core/loader');
require('./core/model');
require('./core/scenes');
require('./core/storage');
require('./core/systems');
require('./core/time');
require('./core/version');


require('./spatial/2d');
require('./spatial/collision');
require('./spatial/spatial-grid');
require('./spatial/rect-manager');
require('./spatial/math');

require('./graphics/canvas');
require('./graphics/canvas-layer');
require('./graphics/color');
require('./graphics/dom');
require('./graphics/dom-helper');
require('./graphics/dom-layer');
require('./graphics/drawing');
require('./graphics/gl-textures');
require('./graphics/html');
require('./graphics/image');
require('./graphics/particles');
require('./graphics/sprite-animation');
require('./graphics/sprite');
require('./graphics/text');
require('./graphics/viewport');
require('./graphics/webgl');

require('./isometric/diamond-iso');
require('./isometric/isometric');

require('./controls/controls');
require('./controls/device');
require('./controls/keycodes');

require('./sound/sound');

require('./debug/debug-layer');










if(window) window.Crafty = Crafty;

module.exports = Crafty;
