function requireNew (id) {
    delete require.cache[require.resolve(id)];
    return require(id);
}

module.exports = function() {
    var Crafty = requireNew('./core/core');

    Crafty.easing = requireNew('./core/animation');
    requireNew('./core/extensions');
    Crafty.c('Model', requireNew('./core/model'));
    Crafty.extend(requireNew('./core/scenes'));
    Crafty.storage = requireNew('./core/storage');
    Crafty.c('Delay', requireNew('./core/time'));
    Crafty.c('Tween', requireNew('./core/tween'));

    requireNew('./core/systems');
    requireNew('./core/version');

    requireNew('./spatial/2d');
    requireNew('./spatial/collision');
    requireNew('./spatial/spatial-grid');
    requireNew('./spatial/rect-manager');
    requireNew('./spatial/math');

    require('./controls/controls-system');
    requireNew('./controls/controls');
    requireNew('./controls/keycodes');

    requireNew('./debug/logging');

    // add dummys - TODO remove this in future
    Crafty.viewport = {
        _x: 0,
        _y: 0,
        width: 0,
        height: 0,
        init: function() {},
        reset: function() {}
    };
    Crafty.c("Keyboard", {
        isDown: function (key) {
            return false;
        }
    });
    // dummy keydown registry
    Crafty.keydown = {};
    Crafty.resetKeyDown = function() {
        Crafty.keydown = {};
    };
    return Crafty;
};
