
function createDeprecatedAlias(baseObject, oldName, newName) {
    Object.defineProperty(baseObject, oldName, {
        enumerable: false,
        configurable: false,
        get: function() { return baseObject[newName]; },
        set: function(value) { baseObject[newName] = value; }
    });
}

module.exports = {
    defineAliases: function defineAliases(Crafty) {
        createDeprecatedAlias(Crafty, "image_whitelist", "imageWhitelist");
    }
};

