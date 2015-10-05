var Crafty = require('../core/core.js'),
    document = window.document;

// Object for abstracting out all the gl calls to handle rendering entities with a particular program
RenderProgramWrapper = function(context, shader){
    this.shader = shader;
    this.context = context;

    this.array_size = 16;
    this.max_size = 1024;
    this._indexArray = new Uint16Array(6 * this.array_size);
    this._indexBuffer = context.createBuffer();
};

RenderProgramWrapper.prototype = {
    // Takes an array of attributes; see Crafty.webgl.getProgramWrapper
    initAttributes: function(attributes){
        this.attributes = attributes;
        this._attribute_table = {};
        var offset = 0;
        for (var i=0; i<attributes.length; i++){
            var a = attributes[i];
            this._attribute_table[a.name] = a;

            a.bytes = a.bytes || Float32Array.BYTES_PER_ELEMENT;
            a.type = a.type || this.context.FLOAT;
            a.offset = offset;
            a.location = this.context.getAttribLocation(this.shader, a.name);

            this.context.enableVertexAttribArray(a.location);

            offset += a.width;
        }

        // Stride is the full width including the last set
        this.stride = offset;

        // Create attribute array of correct size to hold max elements
        this._attributeArray = new Float32Array(this.array_size*4*this.stride);
        this._attributeBuffer = this.context.createBuffer();
        this._registryHoles = [];
        this._registrySize = 0;
    },

    // increase the size of the typed arrays
    // does so by creating a new array of that size and copying the existing one into it
    growArrays: function(size){
        if(this.array_size >= this.max_size) return;

        var newsize = Math.min(size, this.max_size);

        var newAttributeArray = new Float32Array(newsize*4*this.stride);
        var newIndexArray = new Uint16Array(6 * newsize);

        newAttributeArray.set(this._attributeArray);
        newIndexArray.set(this._indexArray);

        this._attributeArray = newAttributeArray;
        this._indexArray = newIndexArray;
        this.array_size = newsize;
    },

    // Add an entity that needs to be rendered by this program
    // Needs to be assigned an index in the buffer
    registerEntity: function(e){
        if (this._registryHoles.length === 0) {
            if (this._registrySize >= this.max_size){
                throw("Number of entities exceeds maximum limit.");
            } else if (this._registrySize >= this.array_size) {
                this.growArrays(2*this.array_size);
            }
            e._glBufferIndex = this._registrySize;
            this._registrySize++;
        } else {
            e._glBufferIndex = this._registryHoles.pop();
        }
    },

    // remove an entity; allow its buffer index to be reused
    unregisterEntity: function(e){
        if (typeof e._glBufferIndex === "number")
            this._registryHoles.push(e._glBufferIndex);
        e._glBufferIndex = null;
    },

    resetRegistry: function(){
        this._maxElement = 0;
        this._registryHoles.length = 0;
    },

    setCurrentEntity: function(ent){
        // offset is 4 * buffer index, because each entity has 4 vertices
        this.ent_offset = ent._glBufferIndex*4;
        this.ent = ent;
    },

    // Called before a batch of entities is prepped for rendering
    switchTo: function(){
        var gl = this.context;
        gl.useProgram(this.shader);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributeBuffer);
        var a, attributes = this.attributes;
        // Process every attribute
        for (var i=0; i<attributes.length; i++){
            a = attributes[i];
            gl.vertexAttribPointer(a.location, a.width, a.type, false, this.stride*a.bytes, a.offset*a.bytes);
        }

        // For now, special case the need for texture objects
        var t = this.texture_obj;
        if (t && t.unit === null){
            Crafty.webgl.texture_manager.bindTexture(t);
        }

        this.index_pointer = 0;
    },

    // Sets a texture
    setTexture: function(texture_obj) {
        // Only needs to be done once
        if (this.texture_obj !== undefined)
            return;
        // Set the texture buffer to use
        texture_obj.setToProgram(this.shader, "uSampler", "uTextureDimensions");
        this.texture_obj = texture_obj;
    },

    // adds a set of 6 indices to the index array
    // Corresponds to 2 triangles that make up a rectangle
    addIndices: function(offset){
        var index = this._indexArray, l = this.index_pointer;
        index[0+l] = 0 + offset;
        index[1+l] = 1 + offset;
        index[2+l] = 2 + offset;
        index[3+l] = 1 + offset;
        index[4+l] = 2 + offset;
        index[5+l] = 3 + offset;
        this.index_pointer+=6;
    },


    // Writes data from the attribute and index arrays to the appropriate buffers, and then calls drawElements.
    renderBatch: function(){
        var gl = this.context;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._attributeArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.index_pointer, gl.UNSIGNED_SHORT, 0);
    },

    setViewportUniforms: function(viewport){
        var gl = this.context;
        gl.useProgram(this.shader);
        gl.uniform4f(this.shader.viewport, viewport._x, viewport._y, viewport._width/viewport._scale, viewport._height/viewport._scale);
    },

    // Fill in the attribtue with the given arguments, cycling through the data if necessary
    // If the arguments provided match the width of the attribute, that means it'll fill the same values for each of the four vertices.
    // TODO determine if this abstraction is a performance hit!
    writeVector: function (name, x, y){
        var a = this._attribute_table[name];
        var stride = this.stride, offset = a.offset+this.ent_offset*stride, w = a.width;
        var l = (arguments.length-1);
        var data = this._attributeArray;

        for (var r=0; r<4 ; r++)
            for (var c=0; c<w; c++){
                data[offset + stride*r + c] = arguments[ (w*r + c) % l + 1];
            }
        }
};


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
 * If a webgl context does not yet exist, a WebGL entity will automatically create one by calling `Crafty.webgl.init()` before rendering.
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
        if (!Crafty.webgl.context) {
            Crafty.webgl.init();
        }
        var webgl = this.webgl = Crafty.webgl;
        var gl = webgl.context;

        //increment the amount of canvas objs
        this._changed = true;
        this.bind("Change", this._glChange);
    },

    remove: function(){
        this._changed = true;
        this.unbind(this._glChange);
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

/**@
 * #Crafty.webgl
 * @category Graphics
 *
 * A collection of methods to handle webgl contexts.
 */
Crafty.extend({

    webgl: {
        /**@
         * #Crafty.webgl.context
         * @comp Crafty.webgl
         *
         * This will return the context of the webgl canvas element.
         */
        context: null,
        changed_objects: [],
   
       // Create a vertex or fragment shader, given the source and type
       _compileShader: function (src, type){
            var gl = this.context;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              throw(gl.getShaderInfoLog(shader));
            }
            return shader;
        },

        // Create and return a complete, linked shader program, given the source for the fragment and vertex shaders.
        // Will compile the two shaders and then link them together
        _makeProgram: function (fragment_src, vertex_src){
            var gl = this.context;
            var fragment_shader = this._compileShader(fragment_src, gl.FRAGMENT_SHADER);
            var vertex_shader = this._compileShader(vertex_src, gl.VERTEX_SHADER);

            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertex_shader);
            gl.attachShader(shaderProgram, fragment_shader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
              throw("Could not initialise shaders");
            }
            
            shaderProgram.viewport = gl.getUniformLocation(shaderProgram, "uViewport");
            return shaderProgram;
        },

        programs: {},

        // Will create and return a RenderProgramWrapper for a shader program.
        // name is a unique id, attributes an array of attribute names with their metadata.
        // Each attribute needs at least a `name`  and `width` property:
        // ~~~
        //   [
        //      {name:"aPosition", width: 2},
        //      {name:"aOrientation", width: 3},
        //      {name:"aLayer", width:2},
        //      {name:"aColor",  width: 4}
        //   ]
        // ~~~
        // The "aPositon", "aOrientation", and "aLayer" attributes should be the same for any webgl entity,
        // since they support the basic 2D properties
        getProgramWrapper: function(name, fragment_src, vertex_src, attributes){
            if (this.programs[name] === undefined){
                var shader = this._makeProgram(fragment_src, vertex_src);
                var program = new RenderProgramWrapper(this.context, shader);
                program.name = name;
                program.initAttributes(attributes);
                program.setViewportUniforms(Crafty.viewport);
                this.programs[name] = program;
            }
            return this.programs[name];
        },

        // Make a texture out of the given image element
        // The url is just used as a unique ID
        makeTexture: function(url, image, repeating){
            var webgl = this;
            return webgl.texture_manager.makeTexture(url, image, repeating);
        },

        /**@
         * #Crafty.webgl.init
         * @comp Crafty.webgl
         * @sign public void Crafty.webgl.init(void)
         * @trigger NoWebGL - triggered if `Crafty.support.webgl` is false
         *
         * This will create a `canvas` element inside `Crafty.stage.elem`, used for displaying "WebGL" components.
         *
         * This method will automatically be called by any "WebGL" component if no `Crafty.webgl.context` is
         * found, so it is not neccessary to call this manually.
         */
        init: function () {

            //check if we support webgl is supported
            if (!Crafty.support.webgl) {
                Crafty.trigger("NoWebGL");
                Crafty.stop();
                return;
            }

            // necessary on restart
            this.changed_objects = [];

            //create an empty canvas element
            var c;
            c = document.createElement("canvas");
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;
            c.style.position = 'absolute';
            c.style.left = "0px";
            c.style.top = "0px";

            Crafty.stage.elem.appendChild(c);

            // Try to get a webgl context
            var gl;
            try {
                gl = c.getContext("webgl", { premultipliedalpha: true }) || c.getContext("experimental-webgl", { premultipliedalpha: true });
                gl.viewportWidth = c.width;
                gl.viewportHeight = c.height;
            } catch(e) {
                Crafty.trigger("NoWebGL");
                Crafty.stop();
                return;
            }

            // assign to this renderer
            this.context = gl;
            this._canvas = c;

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            
            // These commands allow partial transparency, but require drawing in z-order
            gl.disable(gl.DEPTH_TEST);
            // This particular blend function requires the shader programs to output pre-multiplied alpha
            // This is necessary to match the blending of canvas/dom entities against the background color
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            

            //Bind rendering of canvas context (see drawing.js)
            var webgl = this;
            Crafty.uniqueBind("RenderScene", webgl.render);
            Crafty.uniqueBind("ViewportResize", webgl._resize);
            Crafty.uniqueBind("InvalidateViewport", function(){webgl.dirtyViewport = true;});
            Crafty.uniqueBind("PixelartSet", webgl._setPixelart);
            webgl._setPixelart(Crafty._pixelartEnabled);
            this.dirtyViewport = true;

            this.texture_manager = new Crafty.TextureManager(gl, this);


        },

        // Called when the viewport resizes
        _resize: function(){
            var c = Crafty.webgl._canvas;
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;

            var gl = Crafty.webgl.context;
            gl.viewportWidth = c.width;
            gl.viewportHeight = c.height;
        },

        // TODO consider shifting to texturemanager
        _setPixelart: function(enabled) {
            var gl = Crafty.webgl.context;
            if (enabled){
                Crafty.webgl.texture_filter = gl.NEAREST;
            } else {
                Crafty.webgl.texture_filter = gl.LINEAR;
            }
        },

        // convenicne to sort array by global Z
        zsort: function(a, b) {
                return a._globalZ - b._globalZ;
        },

        // Hold an array ref to avoid garbage
        visible_gl: [],

        // Render any entities associated with this context; called in response to a draw event
        render: function(rect){
            rect = rect || Crafty.viewport.rect();
            var webgl = Crafty.webgl,
                gl = webgl.context;

            // Set viewport and clear it
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //Set the viewport uniform variables used by each registered program
            var programs = webgl.programs;
            if (webgl.dirtyViewport){
              for (var comp in programs) {
                  programs[comp].setViewportUniforms(Crafty.viewport);
              }
              webgl.dirtyViewport = false;
            }

            // Search for any entities in the given area (viewport unless otherwise specified)
            var q = Crafty.map.search(rect),
                i = 0,
                l = q.length,
                current;
            //From all potential candidates, build a list of visible entities, then sort by zorder
            var visible_gl = webgl.visible_gl;
            visible_gl.length = 0;
            for (i=0; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.WebGL && current.program) {
                    visible_gl.push(current);
                }
            }
            visible_gl.sort(webgl.zsort);
            l = visible_gl.length;


            // Now iterate through the z-sorted entities to be rendered
            // Each entity writes it's data into a typed array
            // The entities are rendered in batches, where the entire array is copied to a buffer in one operation
            // A batch is rendered whenever the next element needs to use a different type of program
            // Therefore, you get better performance by grouping programs by z-order if possible.
            // (Each sprite sheet will use a different program, but multiple sprites on the same sheet can be rendered in one batch)
            var batchCount = 0;
            var shaderProgram = null;
            for (i=0; i < l; i++) {
                current = visible_gl[i];
                if (shaderProgram !== current.program){
                  if (shaderProgram !== null){
                    shaderProgram.renderBatch();
                  }

                  shaderProgram = current.program;
                  shaderProgram.index_pointer = 0;
                  shaderProgram.switchTo();
                }
                current.draw();
                current._changed = false;
            }

            if (shaderProgram !== null){
              shaderProgram.renderBatch();
            }
            
        }

    }
});