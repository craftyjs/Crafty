var Crafty = require('./core/core');

require('./core/animation');
require('./core/extensions');
require('./core/loader');
require('./core/model');
require('./core/scenes');
require('./core/storage');
require('./core/time');
require('./core/version');


require('./spatial/2D');
require('./spatial/collision');
require('./spatial/HashMap');
require('./spatial/math');

require('./graphics/canvas');
require('./graphics/color');
require('./graphics/DOM');
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

require('./isometric/diamondiso');
require('./isometric/isometric');

require('./controls/controls');
require('./controls/device');
require('./controls/keycodes');

require('./sound/sound');

require('./debug/DebugLayer');










if(window) window.Crafty = Crafty;

module.exports = Crafty;
