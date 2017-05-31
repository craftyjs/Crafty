
function createDeprecatedAlias(oldObject, oldName, newObject, newName) {
    Object.defineProperty(oldObject, oldName, {
        enumerable: false,
        configurable: false,
        get: function() { return newObject[newName]; },
        set: function(value) { newObject[newName] = value; }
    });
}

module.exports = {
    defineAliases: function defineAliases(Crafty) {
        createDeprecatedAlias(Crafty, "image_whitelist", Crafty, "imageWhitelist");

        createDeprecatedAlias(Crafty, "mouseDispatch", Crafty.s('Mouse'), "processEvent");
        createDeprecatedAlias(Crafty, "mouseButtonsDown", Crafty.s('Mouse'), "_buttonDown");
        createDeprecatedAlias(Crafty, "lastEvent", Crafty.s('Mouse'), "lastMouseEvent");
        createDeprecatedAlias(Crafty, "mouseObjs", Crafty.s('Mouse'), "mouseObjs");

        createDeprecatedAlias(Crafty, "keyboardDispatch", Crafty.s('Keyboard'), "processEvent");
        createDeprecatedAlias(Crafty, "keydown", Crafty.s('Keyboard'), "_keyDown");
        createDeprecatedAlias(Crafty, "resetKeyDown", Crafty.s('Keyboard'), "resetKeyDown");

        createDeprecatedAlias(Crafty, "touchDispatch", Crafty, "_touchDispatch");
        createDeprecatedAlias(Crafty, "touchObjs", Crafty.s('Touch'), "touchObjs");
        Crafty.touchHandler = {};
        createDeprecatedAlias(Crafty.touchHandler, "fingers", Crafty.s('Touch'), "touchPoints");
    }
};

