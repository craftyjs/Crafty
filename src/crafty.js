var Crafty = require('./core/core');

Crafty.easing = require('./core/animation');
Crafty.extend(require('./core/extensions'));
Crafty.extend(require('./core/loader'));
Crafty.c('Model', require('./core/model'));
Crafty.extend(require('./core/scenes'));
Crafty.storage = require('./core/storage');
Crafty.c('Delay', require('./core/time'));
Crafty.c('Tween', require('./core/tween'));

Crafty.extend(require('./core/systems'));

require('./spatial/2d');
require('./spatial/collision');
require('./spatial/spatial-grid');
require('./spatial/rect-manager');
require('./spatial/math');

Crafty.c("Canvas", require('./graphics/canvas'));
Crafty.extend(require('./graphics/canvas-layer'));

var colorModule = require('./graphics/color');
Crafty.assignColor = colorModule.assignColor;
Crafty.c("Color", colorModule.colorComponent);

Crafty.c("DOM", require('./graphics/dom'));
Crafty.extend(require('./graphics/dom-helper'));
Crafty.extend(require('./graphics/dom-layer'));
Crafty.extend(require('./graphics/drawing'));
var glTextures = require('./graphics/gl-textures');
Crafty.extend({
  TextureManager: glTextures.TextureManager,
  TextureWrapper: glTextures.TextureWrapper
});
Crafty.c("HTML", require('./graphics/html'));
Crafty.c("Image", require('./graphics/image'));

Crafty.c("Particles", require('./graphics/particles'));
Crafty.c("SpriteAnimation", require('./graphics/sprite-animation'));
var sprite = require('./graphics/sprite');
require('./graphics/webgl');
Crafty.extend(sprite.spriteFunction);
Crafty.c("Sprite", sprite.spriteComponent);
Crafty.c("Text", require('./graphics/text'));
Crafty.extend(require('./graphics/viewport'));

require('./isometric/diamond-iso');
require('./isometric/isometric');

require('./controls/inputs');
require('./controls/controls');
require('./controls/device');
require('./controls/keycodes');

require('./sound/sound');

require('./debug/debug-layer');
require('./debug/logging');

if(window) window.Crafty = Crafty;

module.exports = Crafty;
