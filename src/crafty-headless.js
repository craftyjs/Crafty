function requireNew (id) {
    delete require.cache[require.resolve(id)];
    return require(id);
}

module.exports = function() {
    // Define common features
    var Crafty = require('./crafty-common.js')(requireNew);

    // Define some aliases for renamed properties
    requireNew('./aliases').defineAliases(Crafty);

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
    // dummy keydown+mousedown registry
    Crafty.keydown = {};
    Crafty.resetKeyDown = function() {
        Crafty.keydown = {};
    };
    Crafty.mouseButtonsDown = {};

    return Crafty;
};
