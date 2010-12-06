Crafty.c("DOM", {
	_element: null,
	
	init: function() {
		this._element = document.createElement("div");
		document.body.appendChild(this._element);
		this._element.style.position = "absolute";
		
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
		style.top = Math.ceil(this.y) + "px";
		style.left = Math.ceil(this.x) + "px";
		style.width = Math.ceil(this.w) + "px";
		style.height = Math.ceil(this.h) + "px";
		style.zIndex = this.z;
		if(this.has("sprite")) {
			co = this.__coord;
			style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
		} else if(this.has("image")) {
			style.background = "url(" + this.__image + ") "+this._repeat;
		} else if(this.has("color")) {
			style.background = this._color;
		}
	},
	
	undraw: function() {
		document.body.removeChild(this._element);
	}
});