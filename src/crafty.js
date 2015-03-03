var createInstance = function() {
    var version = require('./core/version');
    var Crafty = require('./core/core')(version);

    require('./core/animation')(Crafty);
    require('./core/extensions')(Crafty);
    require('./core/loader')(Crafty);
    require('./core/model')(Crafty);
    require('./core/scenes')(Crafty);
    require('./core/storage')(Crafty);
    require('./core/time')(Crafty);

    var HashMap = require('./spatial/spatial-grid.js');
    require('./spatial/2d')(Crafty, HashMap);
    require('./spatial/collision')(Crafty);
    require('./spatial/rect-manager')(Crafty);
    require('./spatial/math')(Crafty);

    require('./graphics/canvas')(Crafty);
    require('./graphics/canvas-layer')(Crafty);
    require('./graphics/color')(Crafty);
    require('./graphics/dom')(Crafty);
    require('./graphics/dom-helper')(Crafty);
    require('./graphics/dom-layer')(Crafty);
    require('./graphics/drawing')(Crafty);
    require('./graphics/gl-textures')(Crafty);
    require('./graphics/html')(Crafty);
    require('./graphics/image')(Crafty);
    require('./graphics/particles')(Crafty);
    require('./graphics/sprite-animation')(Crafty);
    require('./graphics/sprite')(Crafty);
    require('./graphics/text')(Crafty);
    require('./graphics/viewport')(Crafty);
    require('./graphics/webgl')(Crafty);

    require('./isometric/diamond-iso')(Crafty);
    require('./isometric/isometric')(Crafty);

    require('./controls/controls')(Crafty);
    require('./controls/device')(Crafty);
    require('./controls/keycodes')(Crafty);

    require('./sound/sound')(Crafty);

    require('./debug/debug-layer')(Crafty);

    return Crafty;
};

var Crafty = createInstance();
if(window) window.Crafty = Crafty;

module.exports = Crafty;
