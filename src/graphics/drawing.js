var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.background
     * @category Graphics, Stage
     * @kind Method
     *
     * @sign public void Crafty.background(String style)
     * @param style - Modify the background with a color or image
     *
     * This method is a shortcut for adding a background
     * style to the stage element, i.e.
     * `Crafty.stage.elem.style.background = ...`
     *
     * For example, if you want the background to be white,
     * with an image in the center, you might use:
     * ~~~
     * Crafty.background('#FFFFFF url(landscape.png) no-repeat center center');
     * ~~~
     */
    background: function (style) {
        Crafty.stage.elem.style.background = style;
    },

    /**@
     * #Crafty.pixelart
     * @category Graphics
     * @kind Method
     * 
     * @sign public void Crafty.pixelart(Boolean enabled)
     * @param enabled - whether to preserve sharp edges when rendering images
     *
     * Sets the image smoothing for drawing images (for all layer types).
     *
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
     * @note Firefox_26 currently has a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=696630) 
     * which prevents disabling image smoothing for Canvas entities that use the Image component. Use the Sprite
     * component instead.
     *
     * @note Webkit (Chrome & Safari) currently has a bug [link1](http://code.google.com/p/chromium/issues/detail?id=134040) 
     * [link2](http://code.google.com/p/chromium/issues/detail?id=106662) that prevents disabling image smoothing
     * for DOM entities.
     *
     * @example
     * This is the preferred way to draw pixel art with the best cross-browser compatibility.
     * ~~~
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
