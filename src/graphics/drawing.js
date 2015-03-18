var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.pixelart
     * @category Graphics
     * @sign public void Crafty.pixelart(Boolean enabled)
     *
     * Sets the image smoothing for drawing images (for both DOM and Canvas).
     * Setting this to true disables smoothing for images, which is the preferred
     * way for drawing pixel art. Defaults to false.
     *
     * This feature is experimental and you should be careful with cross-browser compatibility. 
     * The best way to disable image smoothing is to use the Canvas render method and the Sprite component for drawing your entities.
     *
     * If you want to switch modes in the middle of a scene, 
     * be aware that canvas entities won't be drawn in the new style until something else invalidates them. 
     * (You can manually invalidate all canvas entities with `Crafty("Canvas").trigger("Invalidate");`)
     *
     * Note that Firefox_26 currently has a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=696630) 
     * which prevents disabling image smoothing for Canvas entities that use the Image component. Use the Sprite
     * component instead.
     * Note that Webkit (Chrome & Safari) currently has a bug [link1](http://code.google.com/p/chromium/issues/detail?id=134040) 
     * [link2](http://code.google.com/p/chromium/issues/detail?id=106662) that prevents disabling image smoothing
     * for DOM entities.
     *
     * @example
     * This is the preferred way to draw pixel art with the best cross-browser compatibility.
     * ~~~
     * Crafty.canvasLayer.init();
     * Crafty.pixelart(true);
     * 
     * Crafty.sprite(imgWidth, imgHeight, "spriteMap.png", {sprite1:[0,0]});
     * Crafty.e("2D, Canvas, sprite1");
     * ~~~
     */
    _pixelartEnabled: false,
    pixelart: function(enabled) {
        Crafty._pixelartEnabled = enabled;
        Crafty.trigger("PixelartSet", enabled);
    }
});

Crafty.c("Pixelart", {
    init: function () {
        this._pixelartEnabled = Crafty._pixelartEnabled;
        this.bind("PreDraw", this._setPixelart);
        this.bind("PostDraw", this._resetPixelart);
    },
    
    pixelart: function(enabled) {
        this._pixelartEnabled = enabled;
        this.trigger("PixelartSet", enabled);
    },
    
    _setPixelart: function() {
        // Trigger global event for engines that need it (Canvas).
        // Should be ignored by others (WebGL,DOM).
        Crafty.trigger("PixelartSetDraw", this._pixelartEnabled);
    },
    
    _resetPixelart: function() {
        Crafty.trigger("PixelartSetDraw", Crafty._pixelartEnabled);
    }
});