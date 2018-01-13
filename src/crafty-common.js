// Define common features available in both browser and node
module.exports = function(requireNew) {
    if (requireNew) {
        require = requireNew; // jshint ignore:line
    }

    var Crafty = require('./core/core');
    require('./core/extensions');

    Crafty.easing = require('./core/animation');
    Crafty.c('Model', require('./core/model'));
    Crafty.extend(require('./core/scenes'));
    Crafty.storage = require('./core/storage');
    Crafty.c('Delay', require('./core/time'));
    Crafty.c('Tween', require('./core/tween'));

    var HashMap = require('./spatial/spatial-grid');
    Crafty.HashMap = HashMap;
    Crafty.map = new HashMap();

    require('./core/systems');

    require('./spatial/2d');
    require('./spatial/motion');
    require('./spatial/platform');
    require('./spatial/collision');
    require('./spatial/rect-manager');
    require('./spatial/math');

    require('./controls/controls-system');
    require('./controls/controls');
    require('./controls/keyboard');
    require('./controls/keycodes');
    require('./controls/mouse');
    require('./controls/touch');

    require('./debug/logging');

    return Crafty;
};