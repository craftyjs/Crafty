var Crafty = require('../core/core.js'),
    document = window.document;


/**@
 * #DomLayer
 * @category Graphics
 *
 * Collection of mostly private methods to represent entities using the DOM.
 */
Crafty.domLayerObject = {
    type: "DOM",
    _changedObjs: [],
    _dirtyViewport: false,

    /**@
     * #._div
     * @comp DomLayer
     * A div inside the `#cr-stage` div that holds all DOM entities.
     */
    _div: null,

    init: function () {
        // Avoid shared state between systems
        this._changedObjs = [];

        // Create the div that will contain DOM elements
        var div = this._div = document.createElement("div");

        Crafty.stage.elem.appendChild(div);
        div.style.position = "absolute";
        div.style.zIndex = "1";
        div.style.transformStyle = "preserve-3d"; // Seems necessary for Firefox to preserve zIndexes?

        // Bind scene rendering (see drawing.js)
        this.uniqueBind("RenderScene", this._render);

        // Layers should generally listen for resize events, but the DOM layers automatically inherit the stage's dimensions

        // Listen for changes in pixel art settings
        // Since window is inited before stage, can't set right away, but shouldn't need to!
        this.uniqueBind("PixelartSet", this._setPixelArt);

        this.uniqueBind("InvalidateViewport", function() {
            this._dirtyViewport = true;
        });
    },

    // Cleanup the DOM when the layer is destroyed
    remove: function() {
        this._div.parentNode.removeChild(this._div);
    },

    // Handle whether images should be smoothed or not
    _setPixelArt: function(enabled) {
        var style = this._div.style;
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
     * #.debug
     * @comp DomLayer
     * @sign public .debug()
     */
    debug: function () {
        Crafty.log(this._changedObjs);
    },


    /**@
     * #._render
     * @comp DomLayer
     * @sign public .render()
     *
     * When "RenderScene" is triggered, draws all DOM entities that have been flagged
     *
     * @see DOM#.draw
     */
    _render: function () {
        var changed = this._changedObjs;
        // Adjust the viewport
        if (this._dirtyViewport) {
           this._setViewport();
           this._dirtyViewport = false;
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
     * #.dirty
     * @comp DomLayer
     * @sign public .dirty(ent)
     * @param ent - The entity to mark as dirty
     *
     * Add an entity to the list of DOM object to draw
     */
    dirty: function add(ent) {
        this._changedObjs.push(ent);
    },

    /**@
     * #.attach
     * @comp DomLayer
     * @sign public .attach(ent)
     * @param ent - The entity to add
     *
     * Add an entity to the layer
     */
    attach: function attach(ent) {
        ent._drawContext = this.context;
        // attach the entity's div element to the dom layer
        this._div.appendChild(ent._element);
        // set position style and entity id
        ent._element.style.position = "absolute";
        ent._element.id = "ent" + ent[0];
    },
    
    /**@
     * #.detach
     * @comp DomLayer
     * @sign public .detach(ent)
     * @param ent - The entity to remove
     *
     * Removes an entity from the layer
     */
    detach: function detach(ent) {
        this._div.removeChild(ent._element);
    },

    // Sets the viewport position and scale
    // Called by render when the dirtyViewport flag is set
    _setViewport: function() {
        var style = this._div.style,
            view = Crafty.viewport;

        style.transform = style[Crafty.support.prefix + "Transform"] = "scale(" + view._scale + ", " + view._scale + ")";
        style.left = Math.round(view._x * view._scale) + "px";
        style.top = Math.round(view._y * view._scale) + "px";
        style.zIndex = 10;


    }

};