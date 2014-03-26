var Crafty = require('./core.js'),
    document = window.document;

/**@
 * #Color
 * @category Graphics
 * Draw a solid color for the entity
 */
Crafty.c("Color", {
    _color: "",
    ready: true,

    init: function () {
        this.bind("Draw", this._drawColor);
        this.trigger("Invalidate");
    },

    remove: function(){
        this.unbind("Draw", this._drawColor);
        if (this.has("DOM")){
            this._element.style.backgroundColor = "transparent";
        }
        this.trigger("Invalidate");
    },

    // draw function for "Color"
    _drawColor: function(e){
        if (!this._color) { return; }
        if (e.type === "DOM") {
            e.style.backgroundColor = this._color;
            e.style.lineHeight = 0;
        } else if (e.type === "canvas") {
            e.ctx.fillStyle = this._color;
            e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        }
    },

    /**@
     * #.color
     * @comp Color
     * @trigger Invalidate - when the color changes
     * @sign public this .color(String color)
     * @sign public String .color()
     * @param color - Color of the rectangle
     * Will create a rectangle of solid color for the entity, or return the color if no argument is given.
     *
     * The argument must be a color readable depending on which browser you
     * choose to support.
     *
     * @example
     * ```
     * Crafty.e("2D, DOM, Color")
     *    .color("#969696");
     * ```
     */
    color: function (color) {
        if (!color) return this._color;
        this._color = color;
        this.trigger("Invalidate");
        return this;
    }
});

/**@
 * #Tint
 * @category Graphics
 * Similar to Color by adding an overlay of semi-transparent color.
 *
 * *Note: Currently only works for Canvas*
 */
Crafty.c("Tint", {
    _color: null,
    _strength: 1.0,

    init: function () {
        var draw = function d(e) {
            var context = e.ctx || Crafty.canvas.context;

            context.fillStyle = this._color || "rgba(0,0,0, 0)";
            context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        };

        this.bind("Draw", draw).bind("RemoveComponent", function (id) {
            if (id === "Tint") this.unbind("Draw", draw);
        });
    },

    /**@
     * #.tint
     * @comp Tint
     * @trigger Invalidate - when the tint is applied
     * @sign public this .tint(String color, Number strength)
     * @param color - The color in hexadecimal
     * @param strength - Level of opacity
     *
     * Modify the color and level opacity to give a tint on the entity.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Canvas, Tint")
     *    .tint("#969696", 0.3);
     * ~~~
     */
    tint: function (color, strength) {
        this._strength = strength;
        this._color = Crafty.toRGB(color, this._strength);

        this.trigger("Invalidate");
        return this;
    }
});