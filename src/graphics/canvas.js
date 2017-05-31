var Crafty = require('../core/core.js');


/**@
 * #Canvas
 * @category Graphics
 * @kind Component
 * 
 * @trigger Draw - when the entity is ready to be drawn to the stage - {type: "canvas", pos, co, ctx}
 * @trigger NoCanvas - if the browser does not support canvas
 *
 * When this component is added to an entity it will be drawn to the global canvas element. The canvas element (and hence all Canvas entities) is always rendered below any DOM entities.
 *
 * The canvas layer will be automatically initialized if it has not been created yet.
 *
 * Create a canvas entity like this
 * ~~~
 * var myEntity = Crafty.e("2D, Canvas, Color")
 *      .color("green")
 *      .attr({x: 13, y: 37, w: 42, h: 42});
 *~~~
 */
Crafty.c("Canvas", {

    init: function () {
        this.requires("Renderable");
        
        //Allocate an object to hold this components current region
        this.currentRect = {};
        
        // Add the default canvas layer if we aren't attached to a custom one
        if (!this._customLayer){
            this._attachToLayer( Crafty.s("DefaultCanvasLayer"));
        }
        
    },

    remove: function() {
        this._detachFromLayer();
    },

    /**@
     * #.draw
     * @comp Canvas
     * @kind Method
     * 
     * @sign public this .draw([Context ctx, Number x, Number y, Number w, Number h])
     * @param ctx - Canvas 2D context if drawing on another canvas is required
     * @param x - X offset for drawing a segment
     * @param y - Y offset for drawing a segment
     * @param w - Width of the segment to draw
     * @param h - Height of the segment to draw
     *
     * Method to draw the entity on the canvas element. Can pass rect values for redrawing a segment of the entity.
     */

    // Cache the various objects and arrays used in draw:
    drawVars: {
        type: "canvas",
        pos: {},
        ctx: null,
        coord: [0, 0, 0, 0],
        co: {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }
    },

    draw: function (ctx, x, y, w, h) {
        if (!this.ready) return;

        var pos = this.drawVars.pos;
        pos._x = (this._x + (x || 0));
        pos._y = (this._y + (y || 0));
        pos._w = (w || this._w);
        pos._h = (h || this._h);


        var context = ctx || this._drawContext;
        var coord = this.__coord || [0, 0, 0, 0];
        var co = this.drawVars.co;
        co.x = coord[0] + (x || 0);
        co.y = coord[1] + (y || 0);
        co.w = w || coord[2];
        co.h = h || coord[3];

        // If we are going to perform any entity-specific changes to the current context, save the current state
        if (this._flipX || (this._flipY || this._rotation)) {
            context.save();
        }

        // rotate the context about this entity's origin
        if (this._rotation !== 0) {
            context.translate(this._origin.x + this._x, this._origin.y + this._y);
            pos._x = -this._origin.x;
            pos._y = -this._origin.y;
            context.rotate((this._rotation % 360) * (Math.PI / 180));
        }

        // We realize a flipped entity by scaling the context in the opposite direction, then adjusting the position coordinates to match
        if (this._flipX || this._flipY) {
            context.scale((this._flipX ? -1 : 1), (this._flipY ? -1 : 1));
            if (this._flipX) {
                pos._x = -(pos._x + pos._w);
            }
            if (this._flipY) {
                pos._y = -(pos._y + pos._h);
            }
        }

        var globalpha;

        //draw with alpha
        if (this._alpha < 1.0) {
            globalpha = context.globalAlpha;
            context.globalAlpha = this._alpha;
        }

        this.drawVars.ctx = context;
        this.trigger("Draw", this.drawVars);

        // If necessary, restore context
        if (this._rotation !== 0 || (this._flipX || this._flipY)) {
            context.restore();
        }
        if (globalpha) {
            context.globalAlpha = globalpha;
        }
        return this;
    }
});
