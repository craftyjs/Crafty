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
				img: img,
				ready: false,
				
				init: function() {
					this.addComponent("sprite");
					
					//draw now if image is loaded
					if(this.img.complete && this.img.width > 0) {
						this.ready = true;
						this.trigger("change");
					}
					
					//set the width and height to the sprite size
					this._w = this.__coord[2];
					this._h = this.__coord[3];
					
					this.bind("draw", function(e) {
						var co = e.co,
							pos = e.pos;
						
						if(e.type === "canvas") {
							//draw the image on the canvas element
							try {
							e.ctx.drawImage(this.img, //image element
											 co.x, //x position on sprite
											 co.y, //y position on sprite
											 co.w, //width on sprite
											 co.h, //height on sprite
											 pos._x, //x position on canvas
											 pos._y, //y position on canvas
											 pos._w, //width on canvas
											 pos._h //height on canvas
							);
							} catch(er) {
								console.log(er, e, co, pos);
							}
						} else if(e.type === "DOM") {
							this._element.style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
						}
					});
				},
				
				sprite: function(x,y,w,h) {
					this.__coord = [x*this.__tile+this.__padding[0],y*this.__tile+this.__padding[1],w*this.__tile || this.__tile,h*this.__tile || this.__tile];
					this.trigger("change");
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
		var afn = function(e) { var e = e || window.event; fn.call(ctx,e) };
		if(!this._events[obj+type+fn]) this._events[obj+type+fn] = afn;
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
		var afn = this._events[obj+type+fn];

		if(afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on'+type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[obj+type+fn];
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
			var old = this[axis];
			
			Crafty("2D obj").each(function() {
				var oldposition = this.pos();
				
				this[axis] -= old - v;
				//if no setter available
				if(Crafty.support.setter === false) {
					this[axis.substr(1)] = this[axis]; 
				}
				this.trigger("move",oldposition);
			});
			Crafty.DrawList.change = true;

			this[axis] = v;
		},
		
		rect: function() {
			return {_x: this._x, _y: this._y, _w: this.width, _h: this.height};
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
				elem: (crstage ? crstage : document.createElement("div"))
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
			
			
			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			elem.position = "relative";
			
			//find out the offset position of the stage
			offset = Crafty.inner(Crafty.stage.elem);
			Crafty.stage.x = offset.x;
			Crafty.stage.y = offset.y;
			
			if('__defineSetter__' in this && '__defineGetter__' in this) {
				//define getters and setters to scroll the viewport
				this.__defineSetter__('x', function(v) { this.scroll('_x', v); });
				this.__defineSetter__('y', function(v) { this.scroll('_y', v); });
				this.__defineGetter__('x', function() { return this._x; });
				this.__defineGetter__('y', function() { return this._y; });
			//IE9
			} else if('defineProperty' in Object) {
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
	keys: {'BSP':8, 'TAB':9, 'ENT':13, 'SHF':16, 'CTR':17, 'ALT':18, 'PAU':19, 'CAP':20, 'ESC':27, 'SP':32, 'PGU':33, 'PGD':34, 'END':35, 'HOM':36, 'LA':37, 'UA':38, 'RA':39, 'DA':40, 'INS':45, 'DEL':46, 'D0':48, 'D1':49, 'D2':50, 'D3':51, 'D4':52, 'D5':53, 'D6':54, 'D7':55, 'D8':56, 'D9':57, 'SEM':59, 'EQL':61, 'A':65, 'B':66, 'C':67, 'D':68, 'E':69, 'F':70, 'G':71, 'H':72, 'I':73, 'J':74, 'K':75, 'L':76, 'M':77, 'N':78, 'O':79, 'P':80, 'Q':81, 'R':82, 'S':83, 'T':84, 'U':85, 'V':86, 'W':87, 'X':88, 'Y':89, 'Z':90, 'LWN':91, 'RWN':92, 'SEL':93, 'N0':96, 'N1':97, 'N2':98, 'N3':99, 'N4':100, 'N5':101, 'N6':102, 'N7':103, 'N8':104, 'N9':105, 'MUL':106, 'ADD':107, 'SUB':109, 'DEC':110, 'DIV':111, 'F1':112, 'F2':113, 'F3':114, 'F4':115, 'F5':116, 'F6':117, 'F7':118, 'F8':119, 'F9':120, 'F10':121, 'F11':122, 'F12':123, 'NUM':144, 'SCR':145, 'COM':188, 'PER':190, 'FSL':191, 'ACC':192, 'OBR':219, 'BSL':220, 'CBR':221, 'QOT':222}
});

/**
* Test support for various javascript and HTML features
*/
Crafty.onload(this, function() {
	Crafty.support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);
	Crafty.support.defineProperty = ('defineProperty' in Object);
	Crafty.support.audio = ('Audio' in window);
});

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
