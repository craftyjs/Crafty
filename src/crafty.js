var Crafty = require('./core/core');
var colorModule = require('./graphics/color');
var glTextures = require('./graphics/gl-textures');
var sprite = require('./graphics/sprite');
var webgl = require('./graphics/webgl');
var inputs = require('./controls/inputs');
var controls = require('./controls/controls');
var debug = require('./debug/debug-layer');

Crafty.c('AreaMap', inputs.areaComponent);
Crafty.c('Button', inputs.buttonComponent);
Crafty.c('Canvas', require('./graphics/canvas'));
Crafty.c('Color', colorModule.colorComponent);
Crafty.c('DebugCanvas', debug.debugCanvas);
Crafty.c('DebugPolygon', debug.debugPolygon);
Crafty.c('DebugRectangle', debug.debugRectangle);
Crafty.c('Delay', require('./core/time'));
Crafty.c('DOM', require('./graphics/dom'));
Crafty.c('Draggable', controls.dragableComponent);
Crafty.c('Fourway', controls.fourwayComponent);
Crafty.c('HTML', require('./graphics/html'));
Crafty.c('Image', require('./graphics/image'));
Crafty.c('Jumpway', controls.jumpwayComponent);
Crafty.c('Keyboard', inputs.keyboardComponent);
Crafty.c('Model', require('./core/model'));
Crafty.c('Mouse', inputs.mouseComponent);
Crafty.c('MouseDrag', inputs.mouseDragComponent);
Crafty.c('Multiway', controls.multiWayComponent);
Crafty.c('Particles', require('./graphics/particles'));
Crafty.c('SolidHitBox', debug.solidHitBox);
Crafty.c('Sprite', sprite.spriteComponent);
Crafty.c('SpriteAnimation', require('./graphics/sprite-animation'));
Crafty.c('Text', require('./graphics/text'));
Crafty.c('Touch', inputs.touchComponent);
Crafty.c('Tween', require('./core/tween'));
Crafty.c('Twoway', controls.twowayComponent);
Crafty.c('VisibleMBR', debug.visibleMBR);
Crafty.c('WebGL', webgl.WebGLComponent);
Crafty.c('WiredHitBox', debug.wiredHitBox);

Crafty.assignColor = colorModule.assignColor;
Crafty.DebugCanvas = debug.DebugCanvas;
Crafty.easing = require('./core/animation');
Crafty.storage = require('./core/storage');
Crafty.webgl = webgl.webgl;
Crafty.extend(require('./core/extensions'));
Crafty.extend(require('./core/loader'));
Crafty.extend(require('./core/scenes'));
Crafty.extend(require('./core/systems'));
Crafty.extend(require('./graphics/canvas-layer'));
Crafty.extend(require('./graphics/dom-helper'));
Crafty.extend(require('./graphics/dom-layer'));
Crafty.extend(require('./graphics/drawing'));
Crafty.extend({
  TextureManager: glTextures.TextureManager,
  TextureWrapper: glTextures.TextureWrapper
});
Crafty.extend(sprite.spriteFunction);
Crafty.extend(require('./graphics/viewport'));
Crafty.extend(inputs.inputsObject);
Crafty.extend(require('./isometric/diamond-iso'));
Crafty.extend(require('./isometric/isometric'));
Crafty.extend(require('./controls/device'));
Crafty.extend(require('./controls/keycodes'));
Crafty.extend(require('./sound/sound'));
Crafty.extend(require('./debug/logging'));

require('./spatial/2d');
require('./spatial/collision');
require('./spatial/spatial-grid');
require('./spatial/rect-manager');
require('./spatial/math');


if(window) window.Crafty = Crafty;

module.exports = Crafty;
