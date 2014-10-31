var Crafty = require('./core.js'),
    document = window.document;

/**@
 * #Canvas
 * @category Graphics
 * @trigger Draw - when the entity is ready to be drawn to the stage - {type: "canvas", pos, co, ctx}
 * @trigger NoCanvas - if the browser does not support canvas
 *
 * When this component is added to an entity it will be drawn to the global canvas element. The canvas element (and hence all Canvas entities) is always rendered below any DOM entities.
 *
 * Crafty.canvas.init() will be automatically called if it is not called already to initialize the canvas element.
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
        if (!Crafty.canvas.context) {
            Crafty.canvas.init();
        }

        //increment the amount of canvas objs
        Crafty.DrawManager.total2D++;
        //Allocate an object to hold this components current region
        this.currentRect = {};
        this._changed = true;
        Crafty.DrawManager.addCanvas(this);

        this.bind("Invalidate", function (e) {
            //flag if changed
            if (this._changed === false) {
                this._changed = true;
                Crafty.DrawManager.addCanvas(this);
            }

        });


        this.bind("Remove", function () {
            Crafty.DrawManager.total2D--;
            this._changed = true;
            Crafty.DrawManager.addCanvas(this);
        });
    },

    /**@
     * #.draw
     * @comp Canvas
     * @sign public this .draw([[Context ctx, ]Number x, Number y, Number w, Number h])
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
        if (arguments.length === 4) {
            h = w;
            w = y;
            y = x;
            x = ctx;
            ctx = Crafty.canvas.context;
        }

        var pos = this.drawVars.pos;
        pos._x = (this._x + (x || 0));
        pos._y = (this._y + (y || 0));
        pos._w = (w || this._w);
        pos._h = (h || this._h);


        context = ctx || Crafty.canvas.context;
        coord = this.__coord || [0, 0, 0, 0];
        var co = this.drawVars.co;
        co.x = coord[0] + (x || 0);
        co.y = coord[1] + (y || 0);
        co.w = w || coord[2];
        co.h = h || coord[3];

        if (this._rotation !== 0) {
            context.save();

            context.translate(this._origin.x + this._x, this._origin.y + this._y);
            pos._x = -this._origin.x;
            pos._y = -this._origin.y;

            context.rotate((this._rotation % 360) * (Math.PI / 180));
        }

        if (this._flipX || this._flipY) {
            context.save();
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

        if (this._rotation !== 0 || (this._flipX || this._flipY)) {
            context.restore();
        }
        if (globalpha) {
            context.globalAlpha = globalpha;
        }
        return this;
    }
});

/**@
 * #Crafty.canvas
 * @category Graphics
 *
 * Collection of methods to draw on canvas.
 */
Crafty.extend({
    canvas: {
        /**@
         * #Crafty.canvas.context
         * @comp Crafty.canvas
         *
         * This will return the 2D context of the main canvas element.
         * The value returned from `Crafty.canvas._canvas.getContext('2d')`.
         */
        context: null,
        /**@
         * #Crafty.canvas._canvas
         * @comp Crafty.canvas
         *
         * Main Canvas element
         */

        /**@
         * #Crafty.canvas.init
         * @comp Crafty.canvas
         * @sign public void Crafty.canvas.init(void)
         * @trigger NoCanvas - triggered if `Crafty.support.canvas` is false
         *
         * Creates a `canvas` element inside `Crafty.stage.elem`. Must be called
         * before any entities with the Canvas component can be drawn.
         *
         * This method will automatically be called if no `Crafty.canvas.context` is
         * found.
         */
        init: function () {
            //check if canvas is supported
            if (!Crafty.support.canvas) {
                Crafty.trigger("NoCanvas");
                Crafty.stop();
                return;
            }

            //create an empty canvas element
            var c;
            c = document.createElement("canvas");
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;
            c.style.position = 'absolute';
            c.style.left = "0px";
            c.style.top = "0px";

            Crafty.stage.elem.appendChild(c);
            Crafty.canvas.context = c.getContext('2d');
            Crafty.canvas._canvas = c;

            //Set any existing transformations
            var zoom = Crafty.viewport._scale;
            if (zoom != 1)
                Crafty.canvas.context.scale(zoom, zoom);

            // Set pixelart to current status, and listen for changes
            this._setPixelart(Crafty._pixelartEnabled);
            Crafty.uniqueBind("PixelartSet", this._setPixelart);

            //Bind rendering of canvas context (see drawing.js)
            Crafty.uniqueBind("RenderScene", Crafty.DrawManager.renderCanvas);
            
            Crafty.uniqueBind("ViewportResize", this._resize);
        },

        // Resize the canvas element to the current viewport
        _resize: function() {
            var c = Crafty.canvas._canvas;
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;

        },

        _setPixelart: function(enabled){
            var context = Crafty.canvas.context;
            context.imageSmoothingEnabled = !enabled;
            context.mozImageSmoothingEnabled = !enabled;
            context.webkitImageSmoothingEnabled = !enabled;
            context.oImageSmoothingEnabled = !enabled;
            context.msImageSmoothingEnabled = !enabled;
        }

    }
});
