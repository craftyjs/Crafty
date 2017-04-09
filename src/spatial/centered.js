var Crafty = require('../core/core.js');

/**@
 * #Centered
 * @category 2D
 * @kind Component
 * 
 * A component for setting an entities position by its origin, rather than the top left corner.
 * 
 * Setting `cx` and `cy` will move the entity such that its origin is at that location. 
 * This will fire the same events that setting `x` and `y` directly would.
 * 
 * The origin of an entity defaults to the top left corner.  To set it explicitly, call the `origin()` method
 * of the 2D component.  To center the origin, you can also use the `centerOrigin()` method of this component.
 * 
 * @trigger Move - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
 * @trigger Invalidate - when the entity needs to be redrawn
 * 
 * @see 2D#.origin
 */
Crafty.c("Centered", {
    properties: {
        /**@
         * #.cx
         * @comp Centered
         * @kind Property
         * 
         * The `x` position on the stage of the origin. When modified, will set the underlying `x` value of the entity.
         */
        cx: {
            set: function (v) {
                var x = v - this._origin.x;
                this._setter2d('_x', x);
            },
            get: function () {
                return this._x + this._origin.x;
            },
            configurable: true,
            enumerable: true
        },

        /**@
         * #.cy
         * @comp Centered
         * @kind Property
         * 
         * The `y` position on the stage of the origin. When modified, will set the underlying `y` value of the entity.
         */
        cy: {
            set: function (v) {
                var y = v - this._origin.y;
                this._setter2d('_y', y);
            },
            get: function () {
                return this._y + this._origin.y;
            },
            configurable: true,
            enumerable: true
        }
    },

    required: "2D",

    /**@
     * #.centerOrigin
     * @comp Centered
     * @kind Method
     * 
     * @sign public this .centerOrigin(bool roundCoordinates)
     * @param roundCoordinates - If truthy, will round the resulting position to integral coordinates.
     *
     * Adjusts the origin to be in the center of the entity.
     * 
     * @example
     * ~~~
     * var e = Crafty.e("2D, Centered");
     * e.attr({x: 10, y:10, w: 50, h:50});
     * 
     * // Whenever the entity resizes, keep it's origin and center fixed on the stage
     * e.bind("Resize", function(){
     *  var oldX = this.cx;
     *  var oldY = this.cy;
     *  this.centerOrigin();
     *  this.cx = oldX;
     *  this.cy = oldY;
     * }); 
     * ~~~
     */
    centerOrigin: function (roundCoordinates) {
        var ox = this._w/2;
        var oy = this._h/2;
        if (roundCoordinates) {
            ox = Math.round(ox);
            oy = Math.round(oy);
        }
        this.origin(ox, oy);
        return this;
    },

    /**@
     * #.shiftAroundOrigin
     * @comp Centered
     * @kind Method
     * 
     * @sign public this .shiftAroundOrigin(dx, dy)
     * @param dx - Shift the entity by this amount along the x axis
     * @param dy - Shift the entity by this amount along the y axis
     *
     * Moves the entity while keeping the origin fixed on the stage.
     */
    shiftAroundOrigin: function(dx, dy) {
        var currentX = this.cx;
        var currentY = this.cy;
        this.origin(this._origin.x - dx, this._origin.y - dy);
        this.cx = currentX;
        this.cy = currentY;
    }
});



