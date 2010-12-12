Crafty.c("DOM", {
	_element: null,
	
	init: function() {
		this._element = document.createElement("div");
		Crafty.stage.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];
		this.bind("change", this.draw);
		this.bind("remove", this.undraw);
	},
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		this._element.style.position = 'absolute';
		return this;
	},
	
	draw: function() {
		var style = this._element.style, co;
		style.top = Math.floor(this._y) + "px";
		style.left = Math.floor(this._x) + "px";
		style.width = Math.floor(this._w) + "px";
		style.height = Math.floor(this._h) + "px";
		style.zIndex = this.z;
		if(this.has("sprite")) {
			co = this.__coord;
			style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
		} else if(this.has("image")) {
			style.background = "url(" + this.__image + ") "+this._repeat;
		} else if(this.has("color")) {
			style.background = this._color;
			style.lineHeight = 0;
		}
	},
	
	undraw: function() {
		Crafty.stage.removeChild(this._element);
	}
});

/**
* Fix IE6 background flickering
*/
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch(e) {}