var Crafty = require('../core/core.js');

/**@
 * #WebGL
 * @category Graphics
 * @kind Component
 * 
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

Crafty.extend({
    /**@
     * #Crafty.WebGLShader
     * @category Graphics
     * @kind Method
     * 
     * @sign public Crafty.WebGLShader Crafty.WebGLShader(String vertexShaderCode, String fragmentShaderCode, Array attributeList, Function drawCallback(e, entity))
     * @param vertexShaderCode - GLSL code for the vertex shader
     * @param fragmentShaderCode - GLSL code for the fragment shader
     * @param attributeList - List of variable names with their vertex length
     * @param drawCallback - Function that pushes all attribute values to WebGL.
     *
     * Assigns or fetches a default shader for a component.
     *
     * This allows the default shader for a component to be overridden, and therefor allows
     * developers to override the default shader behaviour with more complex shaders.
     *
     * @example
     * Let's say we want to extend sprite to draw the images in grayscale when we
     * set a `grayscale: true` attribute.
     * ~~~
     * var recoloredSprite = new Crafty.WebGLShader(
     *   // The vertex shader
     *   "attribute vec2 aPosition;\n" +
     *   "attribute vec3 aOrientation;\n" +
     *   "attribute vec2 aLayer;\n" +
     *   "attribute vec2 aTextureCoord;\n" +
     *   "attribute vec2 aGrayscale;\n" + // Addition of our grayscale
     *   "varying mediump vec3 vTextureCoord;\n" +
     *   "varying mediump vec2 vGrayscale;\n" + // passing attribute to fragment shader
     *   "uniform vec4 uViewport;\n" +
     *   "uniform mediump vec2 uTextureDimensions;\n" +
     *   "mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);\n" +
     *   "vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);\n" +
     *   "void main() {\n" +
     *   "  vec2 pos = aPosition;\n" +
     *   "  vec2 entityOrigin = aOrientation.xy;\n" +
     *   "  mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));\n" +
     *   "  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;\n" +
     *   "  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aLayer.x) ), 1) );\n" +
     *   "  vTextureCoord = vec3(aTextureCoord, aLayer.y);\n" +
     *   "  vGrayscale = aGrayscale;\n" + // Assigning the grayscale for fragment shader
     *   "}",
     *   // The fragment shader
     *   "precision mediump float;\n" +
     *   "varying mediump vec3 vTextureCoord;\n" +
     *   "varying mediump vec2 vGrayscale;\n" +
     *   "uniform sampler2D uSampler;\n " +
     *   "uniform mediump vec2 uTextureDimensions;\n" +
     *   "void main() {\n" +
     *   "  highp vec2 coord =   vTextureCoord.xy / uTextureDimensions;\n" +
     *   "  mediump vec4 base_color = texture2D(uSampler, coord);\n" +
     *   "  if (vGrayscale.x == 1.0) {\n" +
     *   "    mediump float lightness = (0.2126*base_color.r + 0.7152*base_color.g + 0.0722*base_color.b);\n" +
     *   "    lightness *= base_color.a * vTextureCoord.z; // Premultiply alpha\n" +
     *   "    gl_FragColor = vec4(lightness, lightness, lightness, base_color.a*vTextureCoord.z);\n" +
     *   "  } else {\n" +
     *   "    gl_FragColor = vec4(base_color.rgb*base_color.a*vTextureCoord.z, base_color.a*vTextureCoord.z);\n" +
     *   "  }\n" +
     *   "}",
     *   [
     *     { name: "aPosition",     width: 2 },
     *     { name: "aOrientation",  width: 3 },
     *     { name: "aLayer",        width: 2 },
     *     { name: "aTextureCoord", width: 2 },
     *     { name: "aGrayscale",    width: 2 }
     *   ],
     *   function(e, entity) {
     *     var co = e.co;
     *     // Write texture coordinates
     *     e.program.writeVector("aTextureCoord",
     *       co.x, co.y,
     *       co.x, co.y + co.h,
     *       co.x + co.w, co.y,
     *       co.x + co.w, co.y + co.h
     *     );
     *     // Write our grayscale attribute
     *     e.program.writeVector("aGrayscale",
     *       entity.grayscale ? 1.0 : 0.0,
     *       0.0
     *     );
     *   }
     * );
     * ~~~
     *
     * It seems like a lot of work, but most of the above code is the default Crafty shader code.
     * When you get the hang of it, it is really easy to extend for your own effects. And remember
     * you only need to write it once, and suddenly all sprite entities have extra effects available.
     *
     * @see Crafty.defaultShader
     * @see Sprite
     * @see Image
     * @see Color
     * @see WebGL
     */
    WebGLShader: function(vertexCode, fragmentCode, attributeList, drawCallback){
        this.vertexCode = vertexCode;
        this.fragmentCode = fragmentCode;
        this.attributeList = attributeList;
        this.drawCallback = drawCallback;
    },
    /**@
     * #Crafty.defaultShader
     * @category Graphics
     * @kind Method
     * 
     * @sign public Crafty.WebGLShader Crafty.defaultShader(String component[, Crafty.WebGLShader shader])
     * @param component - Name of the component to assign a default shader to
     * @param shader - New default shader to assign to a component
     *
     * Assigns or fetches a default shader for a component.
     *
     * This allows the default shader for a component to be overridden, and therefor allows
     * developers to override the default shader behaviour with more complex shaders.
     *
     * @example
     * Let's say we want to set the grayscale enabled shader from the example of the WebGLShader
     * as default for sprites:
     * ~~~
     * Crafty.defaultShader("Sprite", recoloredSprite);
     * ~~~
     *
     * @see Crafty.WebGLShader
     * @see Sprite
     * @see Image
     * @see Color
     * @see WebGL
     */
    defaultShader: function(component, shader) {
        this._defaultShaders = (this._defaultShaders || {});
        if (arguments.length === 1 ){
            return this._defaultShaders[component];
        }
        this._defaultShaders[component] = shader;
    },

});

Crafty.c("WebGL", {
    /**@
     * #.context
     * @comp WebGL
     * @kind Property
     *
     * The webgl context this entity will be rendered to.
     */
    init: function () {
        this.requires("Renderable");
        // Attach to webgl layer
        if (!this._customLayer){
            this._attachToLayer( Crafty.s("DefaultWebGLLayer") );
        }
    },
 
    remove: function(){
        this._detachFromLayer();
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
     * @kind Method
     * @private
     * 
     * @sign public this .draw()
     *
     * An internal method to draw the entity on the webgl canvas element. Rather then rendering directly, it writes relevent information into a buffer to allow batch rendering.
     */
    draw: function () {

        if (!this.ready) return;

        var pos = this.drawVars.pos;
        pos._x = this._x;
        pos._y = this._y;
        pos._w = this._w;
        pos._h = this._h;

        var coord = this.__coord || [0, 0, 0, 0];
        var co = this.drawVars.co;
        co.x = coord[0];
        co.y = coord[1];
        co.w = coord[2];
        co.h = coord[3];

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
        var gl = this._drawContext;
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
    _establishShader: function(compName, shader){
        this.program = this._drawLayer.getProgramWrapper(compName, shader);

        // Needs to know where in the big array we are!
        this.program.registerEntity(this);
        // Shader program means ready
        this.ready = true;
    }
});
