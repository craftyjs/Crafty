var Crafty = require('../core/core.js');

// An object for wrangling textures
// An assumption here is that doing anything with textures is fairly expensive, so the code should be expressive rather than performant
var TextureManager = Crafty.TextureManager = function(gl, webgl) {
	this.gl = gl;
	this.webgl = webgl;
	// The maximum number of units the environment says it supports 
	this.max_units =  gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
	// An array of textures bound to a texture unit; position corresponds to the unit in question
	this.bound_textures = [];
	// A dictionary of registered textures, so that multiple copies of the same texture aren't generated
	this.registered_textures = {};
	// Try to track which texture is active
	this.active = null;
};

TextureManager.prototype = {

	// Clear out the bound textures and other existing state
	reset: function(){
		var t;
		for (var i = 0; i < this.bound_textures.length; i++){
			t = this.bound_textures[i];
			t.unbind();
		}
		this.bound_textures = [];
		this.active = null;
	},

	// creates a texture out of the given image and repeating state
	// The url is just used to generate a unique id for the texture
	makeTexture: function(url, image, repeating) {
		// gl is the context, webgl the Crafty object containing prefs/etc
        var gl = this.gl, webgl = this.webgl;

        // Check whether a texture that matches the one requested already exists
        var id =  "texture-(r:" + repeating + ")-" + url;
        if (typeof this.registered_textures[id] !== 'undefined')
            return this.registered_textures[id];

        // Create a texture, bind it to the next available unit
        var t = new TextureWrapper(this, id);
        this.registered_textures[id] = t;
        this.bindTexture(t);

        // Set the properties of the texture 
        t.setImage(image);
        t.setFilter(webgl.texture_filter);
        t.setRepeat(repeating);

        return t;
    },

    // Returns the bound texture of smallest size
    // If we have more textures than available units, we should preferentially leave the larger textures bound?
	smallest: function() {
		var min_size = Infinity;
		var index = null;
		for (var i=0; i<this.bound_textures.length; i++) {
			var t = this.bound_textures[i];
			if (t.size < min_size) {
				min_size = t.size;
				index = i;
			}
		}
		return index;
	},

	// Returns either the first empty unit, or the unit of the smallest bound texture
	getAvailableUnit: function() {
		if (this.bound_textures.length < this.max_units) {
			return this.bound_textures.length;
		} else {
			return this.smallest();
		}
	},

	// takes a texture object and, if it isn't associated with a unit, binds it to one
	bindTexture: function(t) {
		// return if the texture is already bound
		if (t.unit !== null) return;
		var i = this.getAvailableUnit();
		if (this.bound_textures[i]){
			this.unbindTexture(this.bound_textures[i]);
		}
		this.bound_textures[i] = t;
		t.bind(i);

	},

	// We don't actually "unbind" the texture -- we just set it's bound state to null
	// This is called before another texture is bound
	unbindTexture: function(t) {
		t.unbind();
	},

	setActiveTexture: function(t) {
		if (this.active === t.id) return;
		this.gl.activeTexture(this.gl[t.name]);
		this.active = t.unit;
	}

};

// An object for abstracting out the gl calls associated with textures
var TextureWrapper = Crafty.TextureWrapper = function(manager, id){
	this.manager = manager;
	this.gl = manager.gl;
	this.glTexture = this.gl.createTexture();
	this.id = id;
	this.active = false;
	this.unit = null;
	this.powerOfTwo = false;
};

TextureWrapper.prototype = {

	// Given a number, binds to the corresponding texture unit
	bind: function(unit) {
		var gl = this.gl;
		this.unit = unit;
		this.name = "TEXTURE" + unit;
		this.manager.setActiveTexture(this);
		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
	},

	// Check whether this texture is active (important for setting properties)
	isActive: function() {
		return (this.manager.active === this.unit);
	},

	// Since gl doesn't require unbinding, just clears the metadata
	unbind: function() {
		this.unit = null;
		this.name = null;
		if(this.isActive())
			this.manager.active = null;
	},

	// actually loads an image into the texture object; sets the appropriate metadata
	setImage: function(image) {
		if(!this.isActive()) throw("Trying to set image of texture that isn't active");
		this.width = image.width;
		this.height = image.height;
		this.size = image.width * image.height;
		this.powerOfTwo = !((Math.log(image.width)/Math.LN2 != Math.floor(Math.log(image.width)/Math.LN2)) || (Math.log(image.height)/Math.LN2 != Math.floor(Math.log(image.height)/Math.LN2)));
		var gl = this.gl;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	},

	// Sets the min/mag filters
	setFilter: function(filter) {
		if(!this.isActive()) throw("Trying to set filter of texture that isn't active");
		var gl = this.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	},

	// set image wrapping
	setRepeat: function(repeat) {
		if(!this.isActive()) throw("Trying to set repeat property of texture that isn't active");
		if(repeat && !this.powerOfTwo){
			throw("Can't create a repeating image whose dimensions aren't a power of 2 in WebGL contexts");
		}
		var gl = this.gl;
		this.repeatMode = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.repeatMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.repeatMode);
	},

	// given a shader and pair of uniform names, sets the sampler and dimensions to be used by this texture
	setToProgram: function(shader, sampler_name, dimension_name) {
		if(this.unit === null) throw("Trying to use texture not set to a texture unit.");
		var gl = this.gl;
		gl.useProgram(shader);
        // Set the texture buffer to use
        gl.uniform1i(gl.getUniformLocation(shader, sampler_name), this.unit);
        // Set the image dimensions
        gl.uniform2f(gl.getUniformLocation(shader, dimension_name), this.width, this.height);
	}
};