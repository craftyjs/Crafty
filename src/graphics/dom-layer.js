var Crafty = require('../core/core.js'),
    document = window.document;


/**@
 * #Crafty.domLayer
 * @category Graphics
 *
 * Collection of mostly private methods to represent entities using the DOM.
 */
Crafty.extend({
    domLayer: {
        _changedObjs: [],
        _dirtyViewport: false,
        _div: null,

        init: function () {
            // Set properties to initial values -- necessary on a restart
            this._changedObjs = [];
            this._dirtyViewport = false;

            // Create the div that will contain DOM elements
            var div = this._div = document.createElement("div");

            Crafty.stage.elem.appendChild(div);
            div.style.position = "absolute";
            div.style.zIndex = "1";
            div.style.transformStyle = "preserve-3d"; // Seems necessary for Firefox to preserve zIndexes?

            // Bind scene rendering (see drawing.js)
            Crafty.uniqueBind("RenderScene", this._render);

            // Layers should generally listen for resize events, but the DOM layers automatically inherit the stage's dimensions

            // Listen for changes in pixel art settings
            // Since window is inited before stage, can't set right away, but shouldn't need to!
            Crafty.uniqueBind("PixelartSet", this._setPixelArt);

            Crafty.uniqueBind("InvalidateViewport", function() {
                Crafty.domLayer._dirtyViewport = true;
            });
        },

        // Handle whether images should be smoothed or not
        _setPixelArt: function(enabled) {
            var style = Crafty.domLayer._div.style;
            var camelize = Crafty.domHelper.camelize;
            if (enabled) {
                style[camelize("image-rendering")] = "optimizeSpeed";   /* legacy */
                style[camelize("image-rendering")] = "-moz-crisp-edges";    /* Firefox */
                style[camelize("image-rendering")] = "-o-crisp-edges";  /* Opera */
                style[camelize("image-rendering")] = "-webkit-optimize-contrast";   /* Webkit (Chrome & Safari) */
                style[camelize("-ms-interpolation-mode")] = "nearest-neighbor";  /* IE */
                style[camelize("image-rendering")] = "optimize-contrast";   /* CSS3 proposed */
                style[camelize("image-rendering")] = "pixelated";   /* CSS4 proposed */
                style[camelize("image-rendering")] = "crisp-edges"; /* CSS4 proposed */
            } else {
                style[camelize("image-rendering")] = "optimizeQuality";   /* legacy */
                style[camelize("-ms-interpolation-mode")] = "bicubic";   /* IE */
                style[camelize("image-rendering")] = "auto";   /* CSS3 */
            }
        },

        /**@
         * #Crafty.domLayer.debug
         * @comp Crafty.domLayer
         * @sign public Crafty.domLayer.debug()
         */
        debug: function () {
            Crafty.log(this._changedObjs);
        },


        /**@
         * #Crafty.domLayer._render
         * @comp Crafty.domLayer
         * @sign public Crafty.domLayer.render()
         *
         * When "RenderScene" is triggered, draws all DOM entities that have been flagged
         *
         * @see DOM#.draw
         */
        _render: function () {
            var layer = Crafty.domLayer;
            var changed = layer._changedObjs;
            // Adjust the viewport
            if (layer._dirtyViewport) {
               layer._setViewport();
               layer._dirtyViewport = false;
            }

            //if no objects have been changed, stop
            if (!changed.length) return;

            var i = 0,
                k = changed.length;
            //loop over all DOM elements needing updating
            for (; i < k; ++i) {
                changed[i].draw()._changed = false;
            }

            //reset DOM array
            changed.length = 0;

        },

        /**@
         * #Crafty.domLayer.add
         * @comp Crafty.domLayer
         * @sign public Crafty.domLayer.add(ent)
         * @param ent - The entity to add
         *
         * Add an entity to the list of DOM object to draw
         */
        add: function add(ent) {
            this._changedObjs.push(ent);
        },

        // Sets the viewport position and scale
        // Called by render when the dirtyViewport flag is set
        _setViewport: function() {
            var style = Crafty.domLayer._div.style,
                view = Crafty.viewport;

            style.transform = style[Crafty.support.prefix + "Transform"] = "scale(" + view._scale + ", " + view._scale + ")";
            style.left = Math.round(view._x * view._scale) + "px";
            style.top = Math.round(view._y * view._scale) + "px";
            style.zIndex = 10;


        }

    }
});