var Crafty = require('../core/core.js');


/**@
 * #Renderable
 * @category Graphics
 * @kind Component
 * 
 * Component for any entity that has a position on the stage.
 * @trigger Invalidate - when the entity needs to be redrawn
 */
Crafty.c("Renderable", {

    // Flag for tracking whether the entity is dirty or not
    _changed: false,
    
    /**@
     * #.alpha
     * @comp Renderable
     * @kind Property
     * 
     * Transparency of an entity. Must be a decimal value between 0.0 being fully transparent to 1.0 being fully opaque.
     */
    _alpha: 1.0,

    /**@
     * #.visible
     * @comp Renderable
     * @kind Property
     * 
     * If the entity is visible or not. Accepts a true or false value.
     * Can be used for optimization by setting an entities visibility to false when not needed to be drawn.
     *
     * The entity will still exist and can be collided with but just won't be drawn.
     */
    _visible: true,

    _setterRenderable: function(name, value) {
        if (this[name] === value) {
            return;
        }

        //everything will assume the value
        this[name] = value;

        // flag for redraw
        this.trigger("Invalidate");
    },

    // Setup all the properties that we need to define
    properties: {
        alpha: {
            set: function (v) {
                this._setterRenderable('_alpha', v);
            },
            get: function () {
                return this._alpha;
            },
            configurable: true,
            enumerable: true
        },
        _alpha: {enumerable:false},

        visible: {
            set: function (v) {
                this._setterRenderable('_visible', v);
            },
            get: function () {
                return this._visible;
            },
            configurable: true,
            enumerable: true
        },
        _visible: {enumerable:false}
    },

    init: function () {
    },

    // Need to store visibility before being frozen
    _hideOnUnfreeze: false,
    events: {
        "Freeze":function(){
            this._hideOnUnfreeze = !this._visible;
            this._visible = false;
            this.trigger("Invalidate");
        },
        "Unfreeze":function(){
            this._visible = !this._hideOnUnfreeze;
            this.trigger("Invalidate");
        }
    },

    // Renderable assumes that a draw layer has 3 important methods: attach, detach, and dirty

    // Dirty the entity when it's invalidated
    _invalidateRenderable: function() {
        //flag if changed
        if (this._changed === false) {
            this._changed = true;
            this._drawLayer.dirty(this);
        }
    },

    // Attach the entity to a layer to be rendered
    _attachToLayer: function(layer) {
        if (this._drawLayer) {
            this._detachFromLayer();
        }
        this._drawLayer = layer;
        layer.attach(this);
        this.bind("Invalidate", this._invalidateRenderable);
        this.trigger("LayerAttached", layer);
        this.trigger("Invalidate");
    },

    // Detach the entity from a layer
    _detachFromLayer: function() {
        if (!this._drawLayer) {
            return;
        }
        this._drawLayer.detach(this);
        this.unbind("Invalidate", this._invalidateRenderable);
        this.trigger("LayerDetached", this._drawLayer);
        delete this._drawLayer;
    },

    /**@
     * #.flip
     * @comp Renderable
     * @kind Method
     * 
     * @trigger Invalidate - when the entity has flipped
     * @sign public this .flip(String dir)
     * @param dir - Flip direction
     *
     * Flip entity on passed direction
     *
     * @example
     * ~~~
     * this.flip("X")
     * ~~~
     */
    flip: function (dir) {
        dir = dir || "X";
        if (!this["_flip" + dir]) {
            this["_flip" + dir] = true;
            this.trigger("Invalidate");
        }
        return this;
    },

    /**@
     * #.unflip
     * @comp Renderable
     * @kind Method
     * 
     * @trigger Invalidate - when the entity has unflipped
     * @sign public this .unflip(String dir)
     * @param dir - Unflip direction
     *
     * Unflip entity on passed direction (if it's flipped)
     *
     * @example
     * ~~~
     * this.unflip("X")
     * ~~~
     */
    unflip: function (dir) {
        dir = dir || "X";
        if (this["_flip" + dir]) {
            this["_flip" + dir] = false;
            this.trigger("Invalidate");
        }
        return this;
    }
});