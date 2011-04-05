Crafty.extend({
	
	randRange: function(from, to) {
		return Math.round(Math.random() * (to - from) + from);
	},
	
	zeroFill: function(number, width) {
		width -= number.toString().length;
		if (width > 0)
			return new Array(width + (/\./.test( number ) ? 2 : 1)).join( '0' ) + number;
		return number.toString();
	},
	
	/**
	* Sprite generator.
	*
	* Extends Crafty for producing components
	* based on sprites and tiles
	*/
	sprite: function(tile, url, map, paddingX, paddingY) {
		var pos, temp, x, y, w, h, img;
		
		//if no tile value, default to 16
		if(typeof tile === "string") {
			map = url;
			url = tile;
			tile = 1;
		}
		
		//if no paddingY, use paddingX
		if(!paddingY && paddingX) paddingY = paddingX;
		paddingX = parseInt(paddingX || 0, 10); //just incase
		paddingY = parseInt(paddingY || 0, 10);
		
		img = Crafty.assets[url];
		if(!img) {
			img = new Image();
			img.src = url;
			Crafty.assets[url] = img;
			img.onload = function() {
				//all components with this img are now ready
				for(var pos in map) {
					Crafty(pos).each(function() {
						this.ready = true;
						this.trigger("change");
					});
				}
			};
		}
		
		for(pos in map) {
			if(!map.hasOwnProperty(pos)) continue;
			
			temp = map[pos];
			x = temp[0] * tile + paddingX;
			y = temp[1] * tile + paddingY;
			w = temp[2] * tile || tile;
			h = temp[3] * tile || tile;
			
			//create a component for the sprite
			Crafty.c(pos, {
				__image: url,
				__coord: [x,y,w,h],
				__tile: tile,
				__padding: [paddingX, paddingY],
				__trim: null,
				img: img,
				ready: false,
				
				init: function() {
					this.addComponent("sprite");
					this.__trim = [0,0,0,0];
		
					//draw now
					if(this.img.complete && this.img.width > 0) {
						this.ready = true;
						this.trigger("change");
					}

					//set the width and height to the sprite size
					this.w = this.__coord[2];
					this.h = this.__coord[3];
					
					this.bind("draw", function(e) {
						var co = e.co,
							pos = e.pos,
							context = e.ctx;
							
						if(e.type === "canvas") {
							//draw the image on the canvas element
							context.drawImage(this.img, //image element
											 co.x, //x position on sprite
											 co.y, //y position on sprite
											 co.w, //width on sprite
											 co.h, //height on sprite
											 pos._x, //x position on canvas
											 pos._y, //y position on canvas
											 pos._w, //width on canvas
											 pos._h //height on canvas
							);
						} else if(e.type === "DOM") {
							this._element.style.background = "url('" + this.__image + "') no-repeat -" + co.x + "px -" + co.y + "px";
						}
					});
				},
				
				sprite: function(x,y,w,h) {
					this.__coord = [x * this.__tile + this.__padding[0] + this.__trim[0],
									y * this.__tile + this.__padding[1] + this.__trim[1],
									this.__trim[2] || w * this.__tile || this.__tile,
									this.__trim[3] || h * this.__tile || this.__tile];
					this.trigger("change");
				},
				
				crop: function(x,y,w,h) {
					var old = this._mbr || this.pos();
					this.__trim = [];
					this.__trim[0] = x;
					this.__trim[1] = y;
					this.__trim[2] = w;
					this.__trim[3] = h;
					
					this.__coord[0] += x;
					this.__coord[1] += y;
					this.__coord[2] = w;
					this.__coord[3] = h;
					this._w = w;
					this._h = h;
					
					this.trigger("change", old);
					return this;
				}
			});
		}
		
		return this;
	},
	
	_events: {},

	/**
	* Window Events credited to John Resig
	* http://ejohn.org/projects/flexible-javascript-events
	*/
	addEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//save anonymous function to be able to remove
		var afn = function(e) { var e = e || window.event; fn.call(ctx,e) },
			id = ctx[0] || "";

		if(!this._events[id+obj+type+fn]) this._events[id+obj+type+fn] = afn;
		else return;

		if (obj.attachEvent) { //IE
			obj.attachEvent('on'+type, afn);
		} else { //Everyone else
			obj.addEventListener(type, afn, false);
		}
	},

	removeEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//retrieve anonymouse function
		var id = ctx[0] || "",
			afn = this._events[id+obj+type+fn];

		if(afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on'+type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[id+obj+type+fn];
		}
	},
	
	background: function(color) {
		Crafty.stage.elem.style.background = color;
	},
	
	viewport: {
		width: 0, 
		height: 0,
		_x: 0,
		_y: 0,
		
		scroll: function(axis, v) {
			var change = (v - this[axis]), //change in direction
				context = Crafty.context,
				style = Crafty.stage.inner.style,
				canvas;
			
			//update viewport and DOM scroll
			this[axis] = v;
			if(axis == '_x') {
				if(context) context.translate(change, 0);
			} else {
				if(context) context.translate(0, change);
			}
			if(context) Crafty.DrawManager.drawAll();
			style[axis == '_x' ? "left" : "top"] = ~~v + "px";
		},
		
		rect: function() {
			return {_x: -this._x, _y: -this._y, _w: this.width, _h: this.height};
		},
		
		init: function(w,h) {
			Crafty.window.init();
			this.width = w || Crafty.window.width;
			this.height = h || Crafty.window.height;
				
			//check if stage exists
			var crstage = document.getElementById("cr-stage");
			
			//create stage div to contain everything
			Crafty.stage = {
				x: 0,
				y: 0,
				fullscreen: false,
				elem: (crstage ? crstage : document.createElement("div")),
				inner: document.createElement("div")
			};
			
			//fullscreen, stop scrollbars
			if(!w && !h) {
				document.body.style.overflow = "hidden";
				Crafty.stage.fullscreen = true;
			}
			
			Crafty.addEvent(this, window, "resize", function() {
				Crafty.window.init();
				var w = Crafty.window.width;
					h = Crafty.window.height,
					offset;
				
				
				if(Crafty.stage.fullscreen) {
					this.width = w;
					this.height = h;
					Crafty.stage.elem.style.width = w;
					Crafty.stage.elem.style.width = h;
					
					if(Crafty._canvas) {
						Crafty._canvas.width = w;
						Crafty._canvas.height = h;
						Crafty.DrawManager.drawAll();
					}
				}
				
				offset = Crafty.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});
			
			Crafty.addEvent(this, window, "blur", function() {
				if (!Crafty.dontPauseOnBlur) {
					Crafty.trigger('Pause');
					Crafty.stop();
					Crafty._stopped = true;
				}
			});
			Crafty.addEvent(this, window, "focus", function() {
				if (Crafty._paused && !Crafty.dontPauseOnBlur) {
					Crafty.timer.init();
					Crafty.trigger('Unpause');
					Crafty._stopped = false;
				}
			});

			
			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			Crafty.stage.elem.appendChild(Crafty.stage.inner);
			Crafty.stage.inner.style.position = "absolute";
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			elem.position = "relative";
			
			//find out the offset position of the stage
			offset = Crafty.inner(Crafty.stage.elem);
			Crafty.stage.x = offset.x;
			Crafty.stage.y = offset.y;
			
			if(Crafty.support.setter) {
				//define getters and setters to scroll the viewport
				this.__defineSetter__('x', function(v) { this.scroll('_x', v); });
				this.__defineSetter__('y', function(v) { this.scroll('_y', v); });
				this.__defineGetter__('x', function() { return this._x; });
				this.__defineGetter__('y', function() { return this._y; });
			//IE9
			} else if(Crafty.support.defineProperty) {
				Object.defineProperty(this, 'x', {set: function(v) { this.scroll('_x', v); }, get: function() { return this._x; }});
				Object.defineProperty(this, 'y', {set: function(v) { this.scroll('_y', v); }, get: function() { return this._y; }});
			} else {
				//create empty entity waiting for enterframe
				this.x = this._x;
				this.y = this._y;
				Crafty.e("viewport"); 
			}
		}
	},
	
	support: {},
	
	/**
	* Map key names to key codes
	*/
	keys: {
		'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190 
	}
});

/**
* Test support for various javascript and HTML features
*/
(function testSupport() {
	var support = Crafty.support,
		ua = navigator.userAgent.toLowerCase(),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) || 
				/(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) || 
				/(ms)ie ([\w.]+)/.exec(ua) || 
				/(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [];
	
	//start tests
	support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);
	support.defineProperty = (function() {
		if(!'defineProperty' in Object) return false;
		try { Object.defineProperty({},'x',{}); }
		catch(e) { return false };
		return true;
	})();
	support.audio = ('Audio' in window);
	
	support.prefix = (match[1] || match[0]);
	//browser specific quirks
	if(support.prefix === "moz") support.prefix = "Moz";
	
	//record the version name an integer
	if(match[2]) {
		support.versionName = match[2];
		support.version = +(match[2].split("."))[0];
	}
	
	support.canvas = ('getContext' in document.createElement("canvas"));
})();

/**
* Entity fixes the lack of setter support
*/
Crafty.c("viewport", {
	init: function() {
		this.bind("enterframe", function() {
			if(Crafty.viewport._x !== Crafty.viewport.x) {
				Crafty.viewport.scroll('_x', Crafty.viewport.x);
			}
			
			if(Crafty.viewport._y !== Crafty.viewport.y) {
				Crafty.viewport.scroll('_y', Crafty.viewport.y);
			}
		});
	}
});
