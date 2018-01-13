var Crafty = require('../core/core.js'),
    document = window.document;

// Object for abstracting out all the gl calls to handle rendering entities with a particular program
function RenderProgramWrapper(layer, shader){
    this.shader = shader;
    this.layer = layer;
    this.context = layer.context;
    this.draw = function() { };

    this.array_size = 16;
    this.max_size = 1024;
    this._indexArray = new Uint16Array(6 * this.array_size);
    this._indexBuffer = layer.context.createBuffer();
}

RenderProgramWrapper.prototype = {
    // Takes an array of attributes; see WebGLLayer's getProgramWrapper method
    initAttributes: function(attributes) {
        this.attributes = attributes;
        this._attribute_table = {};
        var offset = 0;
        for (var i = 0; i < attributes.length; i++) {
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
        this._attributeArray = new Float32Array(this.array_size * 4 * this.stride);
        this._attributeBuffer = this.context.createBuffer();
        this._registryHoles = [];
        this._registrySize = 0;
    },

    // increase the size of the typed arrays
    // does so by creating a new array of that size and copying the existing one into it
    growArrays: function(size) {
        if (this.array_size >= this.max_size) return;

        var newsize = Math.min(size, this.max_size);

        var newAttributeArray = new Float32Array(newsize * 4 * this.stride);
        var newIndexArray = new Uint16Array(6 * newsize);

        newAttributeArray.set(this._attributeArray);
        newIndexArray.set(this._indexArray);

        this._attributeArray = newAttributeArray;
        this._indexArray = newIndexArray;
        this.array_size = newsize;
    },

    // Add an entity that needs to be rendered by this program
    // Needs to be assigned an index in the buffer
    registerEntity: function(e) {
        if (this._registryHoles.length === 0) {
            if (this._registrySize >= this.max_size) {
                throw ("Number of entities exceeds maximum limit.");
            } else if (this._registrySize >= this.array_size) {
                this.growArrays(2 * this.array_size);
            }
            e._glBufferIndex = this._registrySize;
            this._registrySize++;
        } else {
            e._glBufferIndex = this._registryHoles.pop();
        }
    },

    // remove an entity; allow its buffer index to be reused
    unregisterEntity: function(e) {
        if (typeof e._glBufferIndex === "number")
            this._registryHoles.push(e._glBufferIndex);
        e._glBufferIndex = null;
    },

    resetRegistry: function() {
        this._maxElement = 0;
        this._registryHoles.length = 0;
    },

    setCurrentEntity: function(ent) {
        // offset is 4 * buffer index, because each entity has 4 vertices
        this.ent_offset = ent._glBufferIndex * 4;
        this.ent = ent;
    },

    // Called before a batch of entities is prepped for rendering
    switchTo: function() {
        var gl = this.context;
        gl.useProgram(this.shader);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributeBuffer);
        var a, attributes = this.attributes;
        // Process every attribute
        for (var i = 0; i < attributes.length; i++) {
            a = attributes[i];
            gl.vertexAttribPointer(a.location, a.width, a.type, false, this.stride * a.bytes, a.offset * a.bytes);
        }

        // For now, special case the need for texture objects
        var t = this.texture_obj;
        if (t && t.unit === null) {
            this.layer.texture_manager.bindTexture(t);
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
    addIndices: function(offset) {
        var index = this._indexArray, l = this.index_pointer;
        index[0 + l] = 0 + offset;
        index[1 + l] = 1 + offset;
        index[2 + l] = 2 + offset;
        index[3 + l] = 1 + offset;
        index[4 + l] = 2 + offset;
        index[5 + l] = 3 + offset;
        this.index_pointer += 6;
    },


    // Writes data from the attribute and index arrays to the appropriate buffers, and then calls drawElements.
    renderBatch: function() {
        var gl = this.context;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._attributeArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.index_pointer, gl.UNSIGNED_SHORT, 0);
    },

    setViewportUniforms: function(viewport, cameraOptions) {
        var gl = this.context;
        gl.useProgram(this.shader);
        gl.uniform4f(this.shader.viewport, -viewport._x, -viewport._y, viewport._w , viewport._h );
    },

    // Fill in the attribute with the given arguments, cycling through the data if necessary
    // If the arguments provided match the width of the attribute, that means it'll fill the same values for each of the four vertices.
    // TODO determine if this abstraction is a performance hit!
    writeVector: function(name, x, y) {
        var a = this._attribute_table[name];
        var stride = this.stride, offset = a.offset + this.ent_offset * stride, w = a.width;
        var l = (arguments.length - 1);
        var data = this._attributeArray;

        for (var r = 0; r < 4; r++)
            for (var c = 0; c < w; c++) {
                data[offset + stride * r + c] = arguments[(w * r + c) % l + 1];
            }
    }
};

/**@
 * #WebGLLayer
 * @category Graphics
 * @kind System
 *
 * A collection of methods to handle webgl contexts.
 */
Crafty._registerLayerTemplate("WebGL", {
    type: "WebGL",

    /**@
     * #.context
     * @comp WebGLLayer
     * @kind Property
     *
     * This will return the context of the webgl canvas element.
     */
    context: null,

    // Create a vertex or fragment shader, given the source and type
    _compileShader: function(src, type) {
        var gl = this.context;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw (gl.getShaderInfoLog(shader));
        }
        return shader;
    },

    // Create and return a complete, linked shader program, given the source for the fragment and vertex shaders.
    // Will compile the two shaders and then link them together
    _makeProgram: function(shader) {
        var gl = this.context;
        var fragmentShader = this._compileShader(shader.fragmentCode, gl.FRAGMENT_SHADER);
        var vertexShader = this._compileShader(shader.vertexCode, gl.VERTEX_SHADER);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw ("Could not initialise shaders");
        }

        shaderProgram.viewport = gl.getUniformLocation(shaderProgram, "uViewport");
        return shaderProgram;
    },

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
    getProgramWrapper: function(name, shader) {
        if (this.programs[name] === undefined) {
            var compiledShader = this._makeProgram(shader);
            var program = new RenderProgramWrapper(this, compiledShader);
            program.name = name;
            program.initAttributes(shader.attributeList);
            program.draw = shader.drawCallback;
            program.setViewportUniforms(this._viewportRect(), this.options);
            this.programs[name] = program;
        }
        return this.programs[name];
    },

    // Make a texture out of the given image element
    // The url is just used as a unique ID
    makeTexture: function(url, image, repeating) {
        return this.texture_manager.makeTexture(url, image, repeating);
    },

    events: {
        // Respond to init & remove events
        "LayerInit": "layerInit",
        "LayerRemove": "layerRemove",
        // Bind scene rendering (see drawing.js)
        "RenderScene": "_render",
        // Listen for pixelart changes
        "PixelartSet": "_setPixelart",
        // Handle viewport modifications
        "ViewportResize": "_resize"
    },

    layerInit: function() {

        //check if we support webgl is supported
        if (!Crafty.support.webgl) {
            Crafty.trigger("NoWebGL");
            Crafty.stop();
            return;
        }

        // Avoid shared state between systems
        this.programs = {};

        //create an empty canvas element
        var c;
        c = document.createElement("canvas");
        c.width = Crafty.viewport.width;
        c.height = Crafty.viewport.height;
        c.style.position = 'absolute';
        c.style.left = "0px";
        c.style.top = "0px";
        c.style.zIndex = this.options.z;

        Crafty.stage.elem.appendChild(c);

        // Try to get a webgl context
        var gl;
        try {
            gl = c.getContext("webgl", { premultipliedalpha: true }) || c.getContext("experimental-webgl", { premultipliedalpha: true });
            gl.viewportWidth = c.width;
            gl.viewportHeight = c.height;
        } catch (e) {
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

        this.texture_manager = new Crafty.TextureManager(gl, this);

        this._dirtyViewport = true;
    },

    // Cleanup the DOM when the system is destroyed
    layerRemove: function() {
        this._canvas.parentNode.removeChild(this._canvas);
    },

    // Called when the viewport resizes
    _resize: function() {
        var c = this._canvas;
        c.width = Crafty.viewport.width;
        c.height = Crafty.viewport.height;

        var gl = this.context;
        gl.viewportWidth = c.width;
        gl.viewportHeight = c.height;
    },

    // TODO consider shifting to texturemanager
    _setPixelart: function(enabled) {
        var gl = this.context;
        if (enabled) {
            this.texture_filter = gl.NEAREST;
        } else {
            this.texture_filter = gl.LINEAR;
        }
    },

    // Hold an array ref to avoid garbage
    visible_gl: [],

    // Render any entities associated with this context; called in response to a draw event
    _render: function(rect) {
        rect = rect || this._viewportRect();
        var gl = this.context;

        // Set viewport and clear it
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //Set the viewport uniform variables used by each registered program
        var programs = this.programs;
        if (this._dirtyViewport) {
            var view = this._viewportRect();
            for (var comp in programs) {
                programs[comp].setViewportUniforms(view, this.options);
            }
            this._dirtyViewport = false;
        }

        // Search for any entities in the given area (viewport unless otherwise specified)
        var q = Crafty.map.search(rect),
            i = 0,
            l = q.length,
            current;
        //From all potential candidates, build a list of visible entities, then sort by zorder
        var visible_gl = this.visible_gl;
        visible_gl.length = 0;
        for (i = 0; i < l; i++) {
            current = q[i];
            if (current._visible && current.program && (current._drawLayer === this)) {
                visible_gl.push(current);
            }
        }
        visible_gl.sort(this._sort);
        l = visible_gl.length;


        // Now iterate through the z-sorted entities to be rendered
        // Each entity writes it's data into a typed array
        // The entities are rendered in batches, where the entire array is copied to a buffer in one operation
        // A batch is rendered whenever the next element needs to use a different type of program
        // Therefore, you get better performance by grouping programs by z-order if possible.
        // (Each sprite sheet will use a different program, but multiple sprites on the same sheet can be rendered in one batch)
        var shaderProgram = null;
        for (i = 0; i < l; i++) {
            current = visible_gl[i];
            if (shaderProgram !== current.program) {
                if (shaderProgram !== null) {
                    shaderProgram.renderBatch();
                }

                shaderProgram = current.program;
                shaderProgram.index_pointer = 0;
                shaderProgram.switchTo();
            }
            current.draw();
            current._changed = false;
        }

        if (shaderProgram !== null) {
            shaderProgram.renderBatch();
        }

    },

    /**@
     * #.dirty
     * @comp WebGLLayer
     * @kind Method
     * @private
     * 
     * @sign public .dirty(ent)
     * @param ent - The entity to mark as dirty
     *
     * Add an entity to the list of DOM object to draw
     */
    dirty: function dirty(ent) {
        // WebGL doens't need to do any special tracking of changed objects
    },

    /**@
     * #.attach
     * @comp WebGLLayer
     * @kind Method
     * @private
     * 
     * @sign public .attach(ent)
     * @param ent - The entity to add
     *
     * Add an entity to the layer
     */
    attach: function attach(ent) {
        // WebGL entities really need to be added to a specific program, which is handled in the LayerAttached event by components
        ent._drawContext = this.context;
    },

    /**@
     * #.detach
     * @comp WebGLLayer
     * @kind Method
     * @private
     * 
     * @sign public .detach(ent)
     * @param ent - The entity to remove
     *
     * Removes an entity from the layer
     */
    detach: function detach(ent) {
        // This could, like attach, be handled by components
        // We instead handle it in a central place for now
        if (ent.program) {
            ent.program.unregisterEntity(ent);
        }
    }

});

