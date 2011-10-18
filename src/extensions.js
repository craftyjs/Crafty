/**@
* #Crafty.support
* @category Misc, Core
* Determines feature support for what Crafty can do.
*/
(function testSupport() {
	var support = Crafty.support = {},
		ua = navigator.userAgent.toLowerCase(),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
				/(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
				/(ms)ie ([\w.]+)/.exec(ua) ||
				/(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [],
		mobile = /iPad|iPod|iPhone|Android|webOS/i.exec(ua);

	if (mobile) Crafty.mobile = mobile[0];

	/**@
	* #Crafty.support.setter
	* @comp Crafty.support
	* Is `__defineSetter__` supported?
	*/
	support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);

	/**@
	* #Crafty.support.defineProperty
	* @comp Crafty.support
	* Is `Object.defineProperty` supported?
	*/
	support.defineProperty = (function () {
		if (!'defineProperty' in Object) return false;
		try { Object.defineProperty({}, 'x', {}); }
		catch (e) { return false };
		return true;
	})();

	/**@
	* #Crafty.support.audio
	* @comp Crafty.support
	* Is HTML5 `Audio` supported?
	*/
	support.audio = ('Audio' in window);

	/**@
	* #Crafty.support.prefix
	* @comp Crafty.support
	* Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`).
	*/
	support.prefix = (match[1] || match[0]);

	//browser specific quirks
	if (support.prefix === "moz") support.prefix = "Moz";
	if (support.prefix === "o") support.prefix = "O";

	if (match[2]) {
		/**@
		* #Crafty.support.versionName
		* @comp Crafty.support
		* Version of the browser
		*/
		support.versionName = match[2];

		/**@
		* #Crafty.support.version
		* @comp Crafty.support
		* Version number of the browser as an Integer (first number)
		*/
		support.version = +(match[2].split("."))[0];
	}

	/**@
	* #Crafty.support.canvas
	* @comp Crafty.support
	* Is the `canvas` element supported?
	*/
	support.canvas = ('getContext' in document.createElement("canvas"));

	support.css3dtransform = (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined");
})();
Crafty.extend({
	/**@
	* #Crafty.randRange
	* @category Misc
	* @sign public Number Crafty.randRange(Number from, Number to)
	* @param from - Lower bound of the range
	* @param to - Upper bound of the range
	* Returns a random number between (and including) the two numbers.
	*/
	randRange: function(from, to) {
		return Math.floor(Math.random() * (to - from + 1) + from);
	},
	
	zeroFill: function(number, width) {
		width -= number.toString().length;
		if (width > 0)
			return new Array(width + (/\./.test( number ) ? 2 : 1)).join( '0' ) + number;
		return number.toString();
	},
	
	/**@
	* #Crafty.sprite
	* @category Graphics
	* @sign public this Crafty.sprite([Number tile], String url, Object map[, Number paddingX[, Number paddingY]])
	* @param tile - Tile size of the sprite map, defaults to 1
	* @param url - URL of the sprite image
	* @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
	* @param paddingX - Horizontal space inbetween tiles. Defaults to 0.
	* @param paddingY - Vertical space inbetween tiles. Defaults to paddingX.
	* Generates components based on positions in a sprite image to be applied to entities.
	*
	* Accepts a tile size, URL and map for the name of the sprite and it's position. 
	*
	* The position must be an array containing the position of the sprite where index `0` 
	* is the `x` position, `1` is the `y` position and optionally `2` is the width and `3` 
	* is the height. If the sprite map has padding, pass the values for the `x` padding 
	* or `y` padding. If they are the same, just add one value.
	*
	* If the sprite image has no consistent tile size, `1` or no argument need be 
	* passed for tile size.
	*
	* Entities that add the generated components are also given a component called `Sprite`.
	* @see Sprite
	*/
	sprite: function(tile, tileh, url, map, paddingX, paddingY) {
		var pos, temp, x, y, w, h, img;
		
		//if no tile value, default to 16
		if(typeof tile === "string") {
			map = url;
			url = tileh;
			tile = 1;
			tileh = 1;
		}
		
		if(typeof tileh == "string") {
			map = url;
			url = tileh;
			tileh = tile;
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
						this.trigger("Change");
					});
				}
			};
		}
		
		for(pos in map) {
			if(!map.hasOwnProperty(pos)) continue;
			
			temp = map[pos];
			x = temp[0] * (tile + paddingX);
			y = temp[1] * (tileh + paddingY);
			w = temp[2] * tile || tile;
			h = temp[3] * tileh || tileh;
			
			/**@
			* #Sprite
			* @category Graphics
			* Component for using tiles in a sprite map.
			*/
			Crafty.c(pos, {
				ready: false,
				__coord: [x,y,w,h],
				
				init: function() {
					this.requires("Sprite");
					this.__trim = [0,0,0,0];
					this.__image = url;
					this.__coord = [this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]];
					this.__tile = tile;
					this.__tileh = tileh;
					this.__padding = [paddingX, paddingY];
					this.img = img;
		
					//draw now
					if(this.img.complete && this.img.width > 0) {
						this.ready = true;
						this.trigger("Change");
					}

					//set the width and height to the sprite size
					this.w = this.__coord[2];
					this.h = this.__coord[3];
				}
			});
		}
		
		return this;
	},
	
	_events: {},

	/**@
	* #Crafty.addEvent
	* @category Events, Misc
	* @sign public this Crafty.addEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element to add the DOM event to
	* @param event - Event name to bind to
	* @param callback - Method to execute when triggered
	* Adds DOM level 3 events to elements. The arguments it accepts are the call 
	* context (the value of `this`), the DOM element to attach the event to, 
	* the event name (without `on` (`click` rather than `onclick`)) and 
	* finally the callback method. 
	*
	* If no element is passed, the default element will be `window.document`.
	* 
	* Callbacks are passed with event data.
	* @see Crafty.removeEvent
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

	/**@
	* #Crafty.removeEvent
	* @category Events, Misc
	* @sign public this Crafty.removeEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element the event is on
	* @param event - Name of the event
	* @param callback - Method executed when triggered
	* Removes events attached by `Crafty.addEvent()`. All parameters must 
	* be the same that were used to attach the event including a reference 
	* to the callback method.
	* @see Crafty.addEvent
	*/
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
	
	/**@
	* #Crafty.background
	* @category Graphics, Stage
	* @sign public void Crafty.background(String value)
	* @param color - Modify the background with a color or image
	* This method is essentially a shortcut for adding a background
	* style to the stage element.
	*/
	background: function(color) {
		Crafty.stage.elem.style.background = color;
	},
	
	/**@
	* #Crafty.viewport
	* @category Stage
	* Viewport is essentially a 2D camera looking at the stage. Can be moved which
	* in turn will react just like a camera moving in that direction.
	*/
	viewport: {
		width: 0, 
		height: 0,
		/**@
		* #Crafty.viewport.x
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `x` 
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity 
		* positions are not exactly where they are on screen. To get the exact position, 
		* simply add `Crafty.viewport.x` onto the entities `x` position.
		*/
		_x: 0,
		/**@
		* #Crafty.viewport.y
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `y` 
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity 
		* positions are not exactly where they are on screen. To get the exact position, 
		* simply add `Crafty.viewport.y` onto the entities `y` position.
		*/
		_y: 0,
		
		/**@
		 * #Crafty.viewport.scroll
		 * @comp Crafty.viewport
		 * @sign Crafty.viewport.scroll(String axis, Number v)
		 * @param axis - 'x' or 'y' 
		 * @param v - The new absolute position on the axis
		 * 
		 * Will move the viewport to the position given on the axis given
		 * @example Crafty.viewport.scroll('x', 500);
		 * Will shift everything in the viewport 500 pixels to the left
		 */
		scroll: function(axis, v) {
			v = Math.floor(v);
			var change = (v - this[axis]), //change in direction
				context = Crafty.canvas.context,
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
		
		/**
		 * #Crafty.viewport.pan
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.pan(String axis, Number v, Number time)
		 * @param String axis - 'x' or 'y'. The axis to move the camera on
		 * @param Number v - the distance to move the camera by
		 * @param Number time - The number of frames to move the camera over
		 *
		 * Pans the camera a given number of pixels over a given number of frames
		 */
		pan: (function () {
			var tweens = {}, i, bound=false;
			
			function enterFrame(e) {
				for (i in tweens) {
					var prop = tweens[i];
					if (prop.remTime >= 0) {
						prop.current += prop.diff;
						prop.remTime--;
						Crafty.viewport[i] = Math.floor(prop.current);
					}
					else {
						delete tweens[i];
					}
				}
				//Crafty.viewport._clamp();
			}
			
			return function (axis, v, time) {
				if (axis == 'reset') {
					for (i in tweens) {
						tweens[i].remTime = 0;
					}
					return;
				}
				Crafty.viewport.follow();
				tweens[axis] = {
					diff: -v/time,
					current: Crafty.viewport[axis],
					remTime: time,
				};
				if (!bound) {
					Crafty.bind("EnterFrame", enterFrame);
					bound = true;
				}
			}
		})(),
		
		/** 
		 * #Crafty.viewport.follow
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.follow(Object target, Number offsetx, Number offsety)
		 * @param Object target - An entity with the 2D component
		 * @param Number offsetx - Follow target should be offsetx pixels away from center
		 * @param Number offsety - Positive puts targ to the right of center
		 *
		 * Follows a given entity with the 2D component. If following target will take a portion of
		 * the viewport out of bounds of the world, following will stop until the target moves away.
		 * @example
		 * var ent = Crafty.e('2D, DOM').attr({w: 100, h: 100:});
		 * Crafty.viewport.follow(ent, 0, 0);
		 */
		follow: (function (){
			var targ, offx, offy;
			
			function change() {
				var x = targ.x, 
					y = targ.y, 
					mid_x = targ.w/2, 
					mid_y = targ.h/2, 
					cent_x = Crafty.viewport.width/2, 
					cent_y = Crafty.viewport.height/2,
					new_x = x + mid_x - cent_x - offx,
					new_y = y + mid_y - cent_y - offy;
				
				Crafty.viewport.x -= new_x;
				Crafty.viewport.y -= new_y;
				//Crafty.viewport._clamp();
			}
			
			return function (target, offsetx, offsety) {
				if (target && target.has('2D')) {
					Crafty.viewport.pan('reset');
					target.bind('Change', change);
				}				
				if (targ) {
					targ.unbind('Change', change);
				}
				targ = target;
				offx = (typeof offsetx != 'undefined')?offsetx:0;
				offy = (typeof offsety != 'undefined')?offsety:0;
			}
		})(),
		
		/** 
		 * #Crafty.viewport.centerOn
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.centerOn(Object target)
		 * @param Object target - An entity with the 2D component
		 * @param Number time - The number of frames to perform the centering over
		 *
		 * Centers the viewport on the given entity
		 */
		 centerOn: function (targ, time) {
				var x = targ.x, 
					y = targ.y, 
					mid_x = targ.w/2, 
					mid_y = targ.h/2, 
					cent_x = Crafty.viewport.width/2, 
					cent_y = Crafty.viewport.height/2,
					new_x = x + mid_x - cent_x,
					new_y = y + mid_y - cent_y;
				
				Crafty.viewport.pan('reset');
				Crafty.viewport.pan('x', new_x, time);
				Crafty.viewport.pan('y', new_y, time);
		 },
		
		/**
		 * #Crafty.viewport.zoom
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.zoom(Number amt, Number cent_x, Number cent_y)
		 * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
		 * @param Number cent_x - the center to zoom on
		 * @param Number cent_y - the center to zoom on
		 *
		 * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
		 * amt < 1 will bring it farther away. amt = 0 will do nothing. 
		 * Zooming is multiplicative. To reset the zoom amount, pass 0.
		 */
		zoom: (function () {
			var zoom = 1,
				tweens = {},
				prop = Crafty.support.prefix+"Transform";
			// what's going on:
			// 1. Get the original point as a percentage of the stage
			// 2. Scale the stage
			// 3. Get the new size of the stage
			// 4. Get the absolute position of our point using previous percentage
			// 4. Offset inner by that much
			
			function enterFrame () {
			}
			
			return function (amt, cent_x, cent_y, time) {
				var width = Crafty.stage.inner.clientWidth,
					height = Crafty.stage.inner.clientHeight,
					prct_width = cent_x/width,
					prct_height = cent_y/height,
					final_zoom = zoom * amt,
					zoom_tick = (final_zoom - zoom)/time;
				
				Crafty.viewport.pan('reset');
				Crafty.stage.inner.style[prop] = "scale("+final_zoom+")";
			}
		})(),
		
		/** 
		 * #Crafty.viewport.mouselook
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.mouselook(Boolean active)
		 * @param Boolean active - Activate or deactivate mouselook
		 *
		 * Toggle mouselook on the current viewport.
		 * Simply call this function and the user will be able to
		 * drag the viewport around.
		 */
		mouselook: (function() {
			var active = false,
				dragging = false,
				lastMouse = {};
			
			
			return function (op, arg) {
				if (typeof op == 'boolean') {
					active = op;
					if (active) {
						Crafty.mouseObjs++;
					}
					else {
						Crafty.mouseObjs = Math.max(0, Crafty.mouseObjs-1);
					}
					return;
				}
				if (!active) return;
				switch (op) {
					case 'move':
					case 'drag':
						console.log(Crafty.stage.inner);
						if (!dragging) return;
						diff = {
							x: arg.clientX - lastMouse.x,
							y: arg.clientY - lastMouse.y,
						};
						Crafty.viewport.x = diff.x;
						Crafty.viewport.y = diff.y;
						//Crafty.viewport._clamp();
					break;
					case 'start':
						lastMouse.x = arg.clientX - Crafty.viewport.x;
						lastMouse.y = arg.clientY - Crafty.viewport.y;
						dragging = true;
					break;
					case 'stop':
						dragging = false;
					break;
				}
			};
		})(),
		 
		_clamp: function() {
			// clamps the viewport to the viewable area
			// under no circumstances should the viewport see something outside the boundary of the 'world'
			var bound_x = Crafty.stage.inner.scrollWidth - Crafty.viewport.width, 
				bound_y = Crafty.stage.inner.scrollHeight - Crafty.viewport.height;
				
			if (Crafty.viewport.x > bound_x) {
				Crafty.viewport.x = bound_x;
			}
			else if (Crafty.viewport.x < 0) {
				Crafty.viewport.x = 0;
			}
			
			if (Crafty.viewport.y > bound_y) {
				Crafty.viewport.y = bound_y;
			}
			else if (Crafty.viewport.y < 0) {
				Crafty.viewport.y = 0;
			}
			
		},
		
		init: function(w,h) {
			Crafty.DOM.window.init();
			
			//fullscreen if mobile or not specified
			this.width = (!w || Crafty.mobile) ? Crafty.DOM.window.width : w;
			this.height = (!h || Crafty.mobile) ? Crafty.DOM.window.height : h;
			
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
			if((!w && !h) || Crafty.mobile) {
				document.body.style.overflow = "hidden";
				Crafty.stage.fullscreen = true;
			}
			
			Crafty.addEvent(this, window, "resize", function() {
				Crafty.DOM.window.init();
				var w = Crafty.DOM.window.width,
					h = Crafty.DOM.window.height,
					offset;
				
				
				if(Crafty.stage.fullscreen) {
					this.width = w;
					this.height = h;
					Crafty.stage.elem.style.width = w + "px";
					Crafty.stage.elem.style.height = h + "px";
					
					if(Crafty._canvas) {
						Crafty._canvas.width = w + "px";
						Crafty._canvas.height = h + "px";
						Crafty.DrawManager.drawAll();
					}
				}
				
				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});
			
			Crafty.addEvent(this, window, "blur", function() {
				if(Crafty.settings.get("autoPause")) {
					Crafty.pause();
				}
			});
			Crafty.addEvent(this, window, "focus", function() {
				if(Crafty._paused && Crafty.settings.get("autoPause")) {
					Crafty.pause();
				}
			});
			
			//make the stage unselectable
			Crafty.settings.register("stageSelectable", function(v) {
				Crafty.stage.elem.onselectstart = v ? function() { return true; } : function() { return false; };
			});
			Crafty.settings.modify("stageSelectable", false);
			
			//make the stage have no context menu
			Crafty.settings.register("stageContextMenu", function(v) {
				Crafty.stage.elem.oncontextmenu = v ? function() { return true; } : function() { return false; };
			});
			Crafty.settings.modify("stageContextMenu", false);
			
			Crafty.settings.register("autoPause", function(){});
			Crafty.settings.modify("autoPause", false);

			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			Crafty.stage.elem.appendChild(Crafty.stage.inner);
			Crafty.stage.inner.style.position = "absolute";
			Crafty.stage.inner.style.zIndex = "1";
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			
			if(Crafty.mobile) {
				elem.position = "absolute";
				elem.left = "0px";
				elem.top = "0px";
				
				var meta = document.createElement("meta"),
					head = document.getElementsByTagName("HEAD")[0];
				
				//stop mobile zooming and scrolling
				meta.setAttribute("name", "viewport");
				meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
				head.appendChild(meta);
				
				//hide the address bar
				meta = document.createElement("meta");
				meta.setAttribute("name", "apple-mobile-web-app-capable");
				meta.setAttribute("content", "yes");
				head.appendChild(meta);
				setTimeout(function() { window.scrollTo(0,1); }, 0);
				
				Crafty.addEvent(this, window, "touchmove", function(e) {
					e.preventDefault();
				});
				
				Crafty.stage.x = 0;
				Crafty.stage.y = 0;
				
			} else {
				elem.position = "relative";
				//find out the offset position of the stage
				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			}
			
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
	
	/**@
	* #Crafty.keys
	* @category Input
	* Object of key names and the corresponding key code.
	* ~~~
	* BACKSPACE: 8,
    * TAB: 9,
    * ENTER: 13,
    * PAUSE: 19,
    * CAPS: 20,
    * ESC: 27,
    * SPACE: 32,
    * PAGE_UP: 33,
    * PAGE_DOWN: 34,
    * END: 35,
    * HOME: 36,
    * LEFT_ARROW: 37,
    * UP_ARROW: 38,
    * RIGHT_ARROW: 39,
    * DOWN_ARROW: 40,
    * INSERT: 45,
    * DELETE: 46,
    * 0: 48,
    * 1: 49,
    * 2: 50,
    * 3: 51,
    * 4: 52,
    * 5: 53,
    * 6: 54,
    * 7: 55,
    * 8: 56,
    * 9: 57,
    * A: 65,
    * B: 66,
    * C: 67,
    * D: 68,
    * E: 69,
    * F: 70,
    * G: 71,
    * H: 72,
    * I: 73,
    * J: 74,
    * K: 75,
    * L: 76,
    * M: 77,
    * N: 78,
    * O: 79,
    * P: 80,
    * Q: 81,
    * R: 82,
    * S: 83,
    * T: 84,
    * U: 85,
    * V: 86,
    * W: 87,
    * X: 88,
    * Y: 89,
    * Z: 90,
    * NUMPAD_0: 96,
    * NUMPAD_1: 97,
    * NUMPAD_2: 98,
    * NUMPAD_3: 99,
    * NUMPAD_4: 100,
    * NUMPAD_5: 101,
    * NUMPAD_6: 102,
    * NUMPAD_7: 103,
    * NUMPAD_8: 104,
    * NUMPAD_9: 105,
    * MULTIPLY: 106,
    * ADD: 107,
    * SUBSTRACT: 109,
    * DECIMAL: 110,
    * DIVIDE: 111,
    * F1: 112,
    * F2: 113,
    * F3: 114,
    * F4: 115,
    * F5: 116,
    * F6: 117,
    * F7: 118,
    * F8: 119,
    * F9: 120,
    * F10: 121,
    * F11: 122,
    * F12: 123,
    * SHIFT: 16,
    * CTRL: 17,
    * ALT: 18,
    * PLUS: 187,
    * COMMA: 188,
    * MINUS: 189,
    * PERIOD: 190 
	* ~~~
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
* Entity fixes the lack of setter support
*/
Crafty.c("viewport", {
	init: function() {
		this.bind("EnterFrame", function() {
			if(Crafty.viewport._x !== Crafty.viewport.x) {
				Crafty.viewport.scroll('_x', Crafty.viewport.x);
			}
			
			if(Crafty.viewport._y !== Crafty.viewport.y) {
				Crafty.viewport.scroll('_y', Crafty.viewport.y);
			}
		});
	}
});
