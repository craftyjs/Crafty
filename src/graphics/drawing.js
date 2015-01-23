var Crafty = require('../core/core.js'),
    document = window.document;


/**@
 * #Crafty.DrawManager
 * @category Graphics
 * @sign Crafty.DrawManager
 *
 * An internal object manage objects to be drawn and implement
 * the best method of drawing in both DOM and canvas
 */
Crafty.DrawManager = (function () {
    /** Helper function to sort by globalZ */
    function zsort(a, b) {
        return a._globalZ - b._globalZ;
    }

    var dom = [], // array of DOMs needed updating
        dirtyViewport = false;


    Crafty.bind("InvalidateViewport", function () {
        dirtyViewport = true;
    });
    Crafty.bind("PostRender", function () {
        dirtyViewport = false;
    });

    return {

        /**@
         * #Crafty.DrawManager.onScreen
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.onScreen(Object rect)
         * @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * Test if a rectangle is completely in viewport
         */
        onScreen: function (rect) {
            return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
                Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
        },

        /**@
         * #Crafty.DrawManager.addDom
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.addDom(ent)
         * @param ent - The entity to add
         *
         * Add an entity to the list of DOM object to draw
         */
        addDom: function addDom(ent) {
            dom.push(ent);
        },

        /**@
         * #Crafty.DrawManager.debug
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.debug()
         */
        debug: function () {
            console.log(dom);
        },

        /**@
         * #Crafty.DrawManager.boundingRect
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.boundingRect(set)
         * @param set - Undocumented
         *
         * - Calculate the common bounding rect of multiple canvas entities.
         * - Returns coords
         */
        boundingRect: function (set) {
            if (!set || !set.length) return;
            var newset = [],
                i = 1,
                l = set.length,
                current, master = set[0],
                tmp;
            master = [master._x, master._y, master._x + master._w, master._y + master._h];
            while (i < l) {
                current = set[i];
                tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
                if (tmp[0] < master[0]) master[0] = tmp[0];
                if (tmp[1] < master[1]) master[1] = tmp[1];
                if (tmp[2] > master[2]) master[2] = tmp[2];
                if (tmp[3] > master[3]) master[3] = tmp[3];
                i++;
            }
            tmp = master;
            master = {
                _x: tmp[0],
                _y: tmp[1],
                _w: tmp[2] - tmp[0],
                _h: tmp[3] - tmp[1]
            };

            return master;
        },


        /**@
         * #Crafty.DrawManager.renderDOM
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.renderDOM()
         *
         * When "RenderScene" is triggered, draws all DOM entities that have been flagged
         *
         * @see DOM.draw
         */
        renderDOM: function () {
            // Adjust the viewport
            if (dirtyViewport) {
                var style = Crafty.stage.inner.style,
                    view = Crafty.viewport;

                style.transform = style[Crafty.support.prefix + "Transform"] = "scale(" + view._scale + ", " + view._scale + ")";
                style.left = Math.round(view._x * view._scale) + "px";
                style.top = Math.round(view._y * view._scale) + "px";
                style.zIndex = 10;
            }

            //if no objects have been changed, stop
            if (!dom.length) return;

            var i = 0,
                k = dom.length;
            //loop over all DOM elements needing updating
            for (; i < k; ++i) {
                dom[i].draw()._changed = false;
            }

            //reset DOM array
            dom.length = 0;

        }


    };
})();

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
