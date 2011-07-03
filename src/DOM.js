/**@
* #DOM
* @category Graphics
* Draws entities as DOM nodes, specifically `<DIV>`s.
*/
Crafty.c("DOM", {
	/**@
	* #._element
	* @comp DOM
	* The DOM element used to represent the entity.
	*/
	_element: null,

	init: function() {
		this._element = document.createElement("div");
		Crafty.stage.inner.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];
		
		this.bind("Change", function() {
			if(!this._changed) {
				this._changed = true;
				Crafty.DrawManager.add(this);
			}
		});
		
		function updateClass() {
			var i = 0, c = this.__c, str = "";
			for(i in c) {
				str += ' ' + i;
			}
			str = str.substr(1);
			this._element.className = str;
		}
		
		this.bind("NewComponent", updateClass).bind("RemoveComponent", updateClass);
		
		if(Crafty.support.prefix === "ms" && Crafty.support.version < 9) {
			this._filters = {};
			
			this.bind("Rotate", function(e) {
				var m = e.matrix,
					elem = this._element.style,
					M11 = m.M11.toFixed(8),
					M12 = m.M12.toFixed(8),
					M21 = m.M21.toFixed(8),
					M22 = m.M22.toFixed(8);
				
				
				this._filters.rotation = "progid:DXImageTransform.Microsoft.Matrix(M11="+M11+", M12="+M12+", M21="+M21+", M22="+M22+", sizingMethod='auto expand')";
			});
		}
		
		this.bind("Remove", this.undraw);
	},
	
	/**@
	* #.DOM
	* @comp DOM
	* @sign public this .DOM(HTMLElement elem)
	* @param elem - HTML element that will replace the dynamically created one
	* Pass a DOM element to use rather than one created. Will set  `._element` to this value. Removes the old element.
	*/
	DOM: function(elem) {
		if(elem && elem.nodeType) {
			this.undraw();
			this._element = elem;
			this._element.style.position = 'absolute';
		}
		return this;
	},
	
	/**@
	* #.draw
	* @comp DOM
	* @sign public this .draw(void)
	* @triggers Draw
	* Updates the CSS properties of the node to draw on the stage.
	*/
	draw: function() {
		var style = this._element.style,
			coord = this.__coord || [0,0,0,0],
			co = {x: coord[0], y: coord[1] },
			prefix = Crafty.support.prefix,
			trans = [];
		
		if(!this._visible) style.visibility = "hidden";
		else style.visibility = "visible";
		
		if(Crafty.support.css3dtransform) trans.push("translate3d("+(~~this._x)+"px,"+(~~this._y)+"px,0)");
		else {
			style.top = Number(this._y)+"px";
			style.left = Number(this._x)+"px";
			//trans.push("translate("+(~~this._x)+"px,"+(~~this._y)+"px,0)");
		}
		style.width = ~~(this._w) + "px";
		style.height = ~~(this._h) + "px";
		style.zIndex = this._z;
		
		style.opacity = this._alpha;
		style[prefix+"Opacity"] = this._alpha;
		
		//if not version 9 of IE
		if(prefix === "ms" && Crafty.support.version < 9) {
			//for IE version 8, use ImageTransform filter
			if(Crafty.support.version === 8) {
				this._filters.alpha = "progid:DXImageTransform.Microsoft.Alpha(Opacity="+(this._alpha * 100)+")"; // first!
			//all other versions use filter
			} else {
				this._filters.alpha = "alpha(opacity="+(this._alpha*100)+")";
			}
			this.applyFilters();
		}
		
		if(this._mbr) {
			var origin = this._origin.x + "px " + this._origin.y + "px";
			style.transformOrigin = origin;
			style[prefix+"TransformOrigin"] = origin;
			if(Crafty.support.css3dtransform) trans.push("rotateZ("+this._rotation+"deg)");
			else trans.push("rotate("+this._rotation+"deg)");
		}
		
		style.transform = trans.join(" ");
		style[prefix+"Transform"] = trans.join(" ");
		
		this.trigger("Draw", {style: style, type: "DOM", co: co});
		
		return this;
	},
	
	applyFilters: function() {
		this._element.style.filter = "";
		for(var filter in this._filters) {
			if(!this._filters.hasOwnProperty(filter)) continue;
			this._element.style.filter += this._filters[filter] + " ";
		}
	},
	
	/**@
	* #.undraw
	* @comp DOM
	* @sign public this .undraw(void)
	* Removes the element from the stage.
	*/
	undraw: function() {
		Crafty.stage.inner.removeChild(this._element);
		return this;
	},
	
	/**@
	* #.css
	* @sign public * css(String property, String value)
	* @param property - CSS property to modify
	* @param value - Value to give the CSS property
	* @sign public * css(Object map)
	* @param map - Object where the key is the CSS property and the value is CSS value
	* Apply CSS styles to the element. 
	*
	* Can pass an object where the key is the style property and the value is style value.
	*
	* For setting one style, simply pass the style as the first argument and the value as the second.
	*
	* The notation can be CSS or JS (e.g. `text-align` or `textAlign`).
	*
	* To return a value, pass the property.
	* @example
	* ~~~
	* this.css({'text-align', 'center', font: 'Arial'});
	* this.css("textAlign", "center");
	* this.css("text-align"); //returns center
	* ~~~
	*/
	css: function(obj, value) {
		var key,
			elem = this._element, 
			val,
			style = elem.style;
		
		//if an object passed
		if(typeof obj === "object") {
			for(key in obj) {
				if(!obj.hasOwnProperty(key)) continue;
				val = obj[key];
				if(typeof val === "number") val += 'px';
				
				style[Crafty.DOM.camelize(key)] = val;
			}
		} else {
			//if a value is passed, set the property
			if(value) {
				if(typeof value === "number") value += 'px';
				style[Crafty.DOM.camelize(obj)] = value;
			} else { //otherwise return the computed property
				return Crafty.DOM.getStyle(elem, obj);
			}
		}
		
		this.trigger("Change");
		
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
	/**@
	* #Crafty.DOM
	* @category Graphics
	* Collection of utilities for using the DOM.
	*/
	DOM: {
		/**@
		* #Crafty.DOM.window
		* @comp Crafty.DOM
		* Object with `width` and `height` values representing the width
		* and height of the `window`.
		*/
		window: {
			init: function() {
				this.width = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
				this.height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
			},
			
			width: 0,
			height: 0
		},
		
		/**@
		* #Crafty.DOM.inner
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.inner(HTMLElement obj)
		* @param obj - HTML element to calculate the position
		* @returns Object with `x` key being the `x` position, `y` being the `y` position
		* Find a DOM elements position including
		* padding and border.
		*/
		inner: function(obj) { 
			var rect = obj.getBoundingClientRect(),
				x = rect.left + window.pageXOffset,
				y = rect.top + window.pageYOffset,
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
		
		/**@
		* #Crafty.DOM.getStyle
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.getStyle(HTMLElement obj, String property)
		* @param obj - HTML element to find the style
		* @param property - Style to return
		* Determine the value of a style on an HTML element. Notation can be
		* in either CSS or JS.
		*/
		getStyle: function(obj,prop) {
			var result;
			if(obj.currentStyle)
				result = obj.currentStyle[this.camelize(prop)];
			else if(window.getComputedStyle)
				result = document.defaultView.getComputedStyle(obj,null).getPropertyValue(this.csselize(prop));
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
		},
		
		/**@
		* #Crafty.DOM.translate
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.translate(Number x, Number y)
		* @param x - x position to translate
		* @param y - y position to translate
		* @return Object with x and y as keys and translated values
		*
		* Method will translate x and y positions to positions on the
		* stage. Useful for mouse events with `e.clientX` and `e.clientY`.
		*/
		translate: function(x,y) {
			return {
				x: x - Crafty.stage.x + document.body.scrollLeft + document.documentElement.scrollLeft - Crafty.viewport._x,
				y: y - Crafty.stage.y + document.body.scrollTop + document.documentElement.scrollTop - Crafty.viewport._y
			}
		}
	}
});