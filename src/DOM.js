Crafty.c("DOM", {
	_element: null,
	
	init: function() {
		this._element = document.createElement("div");
		Crafty.stage.elem.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];
		
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
		style.zIndex = this._z;
		style.opacity = this._alpha;
		
		if(this._mbr) {
			var rstring = "rotate("+this._rotation+"deg)",
				origin = this._origin.x + "px " + this._origin.y + "px";
			
			style.transformOrigin = origin;
			style.mozTransformOrigin = origin;
			style.webkitTransformOrigin = origin;
			style.oTransformOrigin = origin;
			
			style.transform = rstring;
			style.mozTransform = rstring;
			style.webkitTransform = rstring;
			style.oTransform = rstring;
		}
		
		this.trigger("draw", {style: style, type: "DOM"});
		
		if(this.has("sprite")) {
			co = this.__coord;
			style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
		}
		return this;
	},
	
	undraw: function() {
		Crafty.stage.elem.removeChild(this._element);
		return this;
	},
	
	css: function(obj, value) {
		var key,
			elem = this._element, 
			style = elem.style;
		
		//if an object passed
		if(typeof obj === "object") {
			for(key in obj) {
				if(!obj.hasOwnProperty(key)) continue;
				style[Crafty.camelize(key)] = obj[key];
			}
		} else {
			//if a value is passed, set the property
			if(value) style[Crafty.camelize(obj)] = value;
			else { //otherwise return the computed property
				return Crafty.getStyle(elem, obj);
			}
		}
		
		this.trigger("change");
		
		return this;
	}
});

/**
* Fix IE6 background flickering
*/
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch(e) {}


Crafty.extend({
	window: {
		init: function() {
			this.width = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
			this.height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
		},
		
		width: 0,
		height: 0
	},
	
	/**
	* Find a DOM elements position including
	* padding and border
	*/
	inner: function(obj) { 
		var rect = obj.getBoundingClientRect(),
			x = rect.left,
			y = rect.top,
			borderX,
			borderY;
		
		//border left
		borderX = parseInt(this.getStyle(obj, 'border-left-width') || 0, 10);
		borderY = parseInt(this.getStyle(obj, 'border-top-width') || 0, 10);
		if(!borderX || !borderY) { //JS notation for IE
			borderX = parseInt(this.getStyle(obj, 'borderLeftWidth') || 0, 10);
			borderY = parseInt(this.getStyle(obj, 'borderTopWidth') || 0, 10);
		}
		
		x += borderX;
		y += borderY;
		
		return {x: x, y: y}; 
	},
	
	getStyle: function(obj,prop) {
		var result;
		if(obj.currentStyle)
			result = obj.currentStyle[Crafty.camelize(prop)];
		else if(window.getComputedStyle)
			result = document.defaultView.getComputedStyle(obj,null).getPropertyValue(Crafty.csselize(prop));
		return result;
	},
	
	/**
	* Used in the Zepto framework
	*
	* Converts CSS notation to JS notation
	*/
	camelize: function(str) { 
		return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
	},
	
	/**
	* Converts JS notation to CSS notation
	*/
	csselize: function(str) {
		return str.replace(/[A-Z]/g, function(chr){ return chr ? '-' + chr.toLowerCase() : '' });
	}
});