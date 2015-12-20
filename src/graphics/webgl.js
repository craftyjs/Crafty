var Crafty = require('../core/core.js');

/**@
 * #WebGL
 * @category Graphics
 * @trigger Draw - when the entity is ready to be drawn to the stage - {type: "canvas", pos, co, ctx}
 * @trigger NoCanvas - if the browser does not support canvas
 *
 * When this component is added to an entity it will be drawn to the global webgl canvas element. Its canvas element (and hence any WebGL entity) is always rendered below any DOM entities.
 *
 * Sprite, Image, SpriteAnimation, and Color all support WebGL rendering.  Text entities will need to use DOM or Canvas for now.
 * 
 * If a webgl context does not yet exist, a WebGL entity will automatically create one.
 *
 * @note For better performance, minimize the number of spritesheets used, and try to arrange it so that entities with different spritesheets are on different z-levels.  This is because entities are rendered in z order, and only entities sharing the same texture can be efficiently batched.
 *
 * Create a webgl entity like this
 * ~~~
 * var myEntity = Crafty.e("2D, WebGL, Color")
 *      .color(1, 1, 0, 0.5)
 *      .attr({x: 13, y: 37, w: 42, h: 42});
 *~~~
 */

Crafty.c("WebGL", {
    /**@
     * #.context
     * @comp WebGL
     * 
     * The webgl context this entity will be rendered to.
     */
    init: function () {
        this.requires("Renderable");
        var webgl = this.webgl = Crafty.s("WebGLLayer");
        var gl = webgl.context;

        //increment the amount of canvas objs
        this._changed = true;
        this.bind("Change", this._glChange);
    },

    remove: function(){
        this._changed = true;
        this.unbind(this._glChange);
        // Webgl components need to be removed from their gl program
        if (this.program) {
            this.program.unregisterEntity(this);
        }
    },

    _glChange: function(){
        //flag if changed
        if (this._changed === false) {
            this._changed = true;
        }
    },

    // Cache the various objects and arrays used in draw
    drawVars: {
        type: "webgl",
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

    /**@
     * #.draw
     * @comp WebGL
     * @sign public this .draw([[Context ctx, ]Number x, Number y, Number w, Number h])
     * @param ctx - Optionally supply a different r 2D context if drawing on another canvas is required
     * @param x - X offset for drawing a segment
     * @param y - Y offset for drawing a segment
     * @param w - Width of the segment to draw
     * @param h - Height of the segment to draw
     *
     * An internal method to draw the entity on the webgl canvas element. Rather then rendering directly, it writes relevent information into a buffer to allow batch rendering.
     */
    draw: function (ctx, x, y, w, h) {

        if (!this.ready) return;

        if (arguments.length === 4) {
            h = w;
            w = y;
            y = x;
            x = ctx;
            ctx = this.webgl.context;
        }

        var pos = this.drawVars.pos;
        pos._x = (this._x + (x || 0));
        pos._y = (this._y + (y || 0));
        pos._w = (w || this._w);
        pos._h = (h || this._h);

        var coord = this.__coord || [0, 0, 0, 0];
        var co = this.drawVars.co;
        co.x = coord[0] + (x || 0);
        co.y = coord[1] + (y || 0);
        co.w = w || coord[2];
        co.h = h || coord[3];

        // Handle flipX, flipY
        // (Just swap the positions of e.g. x and x+w)
        if (this._flipX ) {
           co.x = co.x + co.w;
           co.w = - co.w;
        }
        if (this._flipY ) {
           co.y = co.y + co.h;
           co.h = - co.h;
        }

        //Draw entity
        var gl = this.webgl.context;
        this.drawVars.gl = gl;
        var prog = this.drawVars.program = this.program;

        // The program might need to refer to the current element's index
        prog.setCurrentEntity(this);
        // Write position; x, y, w, h
        prog.writeVector("aPosition",
            this._x, this._y,
            this._x , this._y + this._h,
            this._x + this._w, this._y,
            this._x + this._w, this._y + this._h
        );

        // Write orientation 
        prog.writeVector("aOrientation",
            this._origin.x + this._x,
            this._origin.y + this._y,
            this._rotation * Math.PI / 180
        );

        // Write z, alpha
        prog.writeVector("aLayer",
            this._globalZ,
            this._alpha
        );

        // This should only need to handle *specific* attributes!
        this.trigger("Draw", this.drawVars);

        // Register the vertex groups to be drawn, referring to this entities position in the big buffer
        prog.addIndices(prog.ent_offset);
        
        return this;
    },

    // v_src is optional, there's a default vertex shader that works for regular rectangular entities
    _establishShader: function(compName, f_src, v_src, attributes){
        this.program = this.webgl.getProgramWrapper(compName, f_src, v_src, attributes);
        
        // Needs to know where in the big array we are!
        this.program.registerEntity(this);
        // Shader program means ready
        this.ready = true;
    }
});