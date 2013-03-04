/**@
* #Color
* @category Graphics
* Draw a solid color for the entity
*/
Crafty.c("Color", {
	_color: "",
	ready: true,

	init: function () {
		this.bind("Draw", function (e) {
			if (e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if (e.type === "canvas") {
				if (this._color) e.ctx.fillStyle = this._color;
				e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
			}
		});
	},

	/**@
	* #.color
	* @comp Color
	* @trigger Change - when the color changes
	* @sign public this .color(String color)
	* @sign public String .color()
	* @param color - Color of the rectangle
	* Will create a rectangle of solid color for the entity, or return the color if no argument is given.
	*
	* The argument must be a color readable depending on which browser you
	* choose to support. IE 8 and below doesn't support the rgb() syntax.
	* 
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Color")
	*    .color("#969696");
	* ~~~
	*/
	color: function (color) {
		if (!color) return this._color;
		this._color = color;
		this.trigger("Change");
		return this;
	}
});

/**@
* #Tint
* @category Graphics
* Similar to Color by adding an overlay of semi-transparent color.
*
* *Note: Currently only works for Canvas*
*/
Crafty.c("Tint", {
	_color: null,
	_strength: 1.0,

	init: function () {
		var draw = function d(e) {
			var context = e.ctx || Crafty.canvas.context;

			context.fillStyle = this._color || "rgb(0,0,0)";
			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
		};

		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
			if (id === "Tint") this.unbind("Draw", draw);
		});
	},

	/**@
	* #.tint
	* @comp Tint
	* @trigger Change - when the tint is applied
	* @sign public this .tint(String color, Number strength)
	* @param color - The color in hexadecimal
	* @param strength - Level of opacity
	* 
	* Modify the color and level opacity to give a tint on the entity.
	* 
	* @example
	* ~~~
	* Crafty.e("2D, Canvas, Tint")
	*    .tint("#969696", 0.3);
	* ~~~
	*/
	tint: function (color, strength) {
		this._strength = strength;
		this._color = Crafty.toRGB(color, this._strength);

		this.trigger("Change");
		return this;
	}
});

/**@
* #Image
* @category Graphics
* Draw an image with or without repeating (tiling).
*/
Crafty.c("Image", {
	_repeat: "repeat",
	ready: false,

	init: function () {
		var draw = function (e) {
			if (e.type === "canvas") {
				//skip if no image
				if (!this.ready || !this._pattern) return;

				var context = e.ctx;
				
				context.fillStyle = this._pattern;
				
				context.save();
				context.translate(e.pos._x, e.pos._y);
				context.fillRect(0, 0, this._w, this._h);
				context.restore();
			} else if (e.type === "DOM") {
				if (this.__image)
					e.style.background = "url(" + this.__image + ") " + this._repeat;
			}
		};

		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
			if (id === "Image") this.unbind("Draw", draw);
		});
	},

	/**@
	* #.image
	* @comp Image
	* @trigger Change - when the image is loaded
	* @sign public this .image(String url[, String repeat])
	* @param url - URL of the image
	* @param repeat - If the image should be repeated to fill the entity.
	* 
	* Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
	*
	* *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
	*
	* If the width and height are `0` and repeat is set to `no-repeat` the width and
	* height will automatically assume that of the image. This is an
	* easy way to create an image without needing sprites.
	* 
	* @example
	* Will default to no-repeat. Entity width and height will be set to the images width and height
	* ~~~
	* var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
	* ~~~
	* Create a repeating background.
	* ~~~
	* var bg = Crafty.e("2D, DOM, Image")
	*              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
	*              .image("bg.png", "repeat");
	* ~~~
	* 
	* @see Crafty.sprite
	*/
	image: function (url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";

		this.img = Crafty.asset(url);
		if (!this.img) {
			this.img = new Image();
			Crafty.asset(url, this.img);
			this.img.src = url;
			var self = this;

			this.img.onload = function () {
				if (self.has("Canvas")) self._pattern = Crafty.canvas.context.createPattern(self.img, self._repeat);
				self.ready = true;

				if (self._repeat === "no-repeat") {
					self.w = self.img.width;
					self.h = self.img.height;
				}

				self.trigger("Change");
			};

			return this;
		} else {
			this.ready = true;
			if (this.has("Canvas")) this._pattern = Crafty.canvas.context.createPattern(this.img, this._repeat);
			if (this._repeat === "no-repeat") {
				this.w = this.img.width;
				this.h = this.img.height;
			}
		}


		this.trigger("Change");

		return this;
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,

	/**@
	* #Crafty.scene
	* @category Scenes, Stage
	* @trigger SceneChange - when a scene is played - { oldScene:String, newScene:String }
	* @sign public void Crafty.scene(String sceneName, Function init[, Function uninit])
	* @param sceneName - Name of the scene to add
	* @param init - Function to execute when scene is played
	* @param uninit - Function to execute before next scene is played, after entities with `2D` are destroyed
	* @sign public void Crafty.scene(String sceneName)
	* @param sceneName - Name of scene to play
	* 
	* Method to create scenes on the stage. Pass an ID and function to register a scene.
	*
	* To play a scene, just pass the ID. When a scene is played, all
	* entities with the `2D` component on the stage are destroyed.
	*
	* If you want some entities to persist over scenes (as in not be destroyed)
	* simply add the component `Persist`.
	*
	* @example
	* ~~~
	* Crafty.scene("loading", function() {});
	*
	* Crafty.scene("loading", function() {}, function() {});
	*
	* Crafty.scene("loading");
	* ~~~
	*/
	scene: function (name, intro, outro) {
		//play scene
		if (arguments.length === 1) {
			Crafty.viewport.reset();
			Crafty("2D").each(function () {
				if (!this.has("Persist")) this.destroy();
			});
			// uninitialize previous scene
			if (this._current !== null && 'uninitialize' in this._scenes[this._current]) {
				this._scenes[this._current].uninitialize.call(this);
			}
			// initialize next scene
			this._scenes[name].initialize.call(this);
			var oldScene = this._current;
			this._current = name;
			Crafty.trigger("SceneChange", { oldScene: oldScene, newScene: name });
			return;
		}
		//add scene
		this._scenes[name] = {}
		this._scenes[name].initialize = intro
		if (typeof outro !== 'undefined') {
			this._scenes[name].uninitialize = outro;
		}
		return;
	},

	/**@
	* #Crafty.toRGB
	* @category Graphics
	* @sign public String Crafty.scene(String hex[, Number alpha])
	* @param hex - a 6 character hex number string representing RGB color
	* @param alpha - The alpha value.
	* 
	* Get a rgb string or rgba string (if `alpha` presents).
	* 
	* @example
	* ~~~
	* Crafty.toRGB("ffffff"); // rgb(255,255,255)
	* Crafty.toRGB("#ffffff"); // rgb(255,255,255)
	* Crafty.toRGB("ffffff", .5); // rgba(255,255,255,0.5)
	* ~~~
	* 
	* @see Text.textColor
	*/
	toRGB: function (hex, alpha) {
		var hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex,
			c = [], result;

		c[0] = parseInt(hex.substr(0, 2), 16);
		c[1] = parseInt(hex.substr(2, 2), 16);
		c[2] = parseInt(hex.substr(4, 2), 16);

		result = alpha === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + alpha + ')';

		return result;
	}
});

/**@
* #Crafty.DrawManager
* @category Graphics
* @sign Crafty.DrawManager
* 
* An internal object manage objects to be drawn and implement
* the best method of drawing in both DOM and canvas
*/
Crafty.DrawManager = (function () {
	/** Helper function to sort by globalZ */
	function zsort(a, b) { return a.obj._globalZ - b.obj._globalZ; };
	/** array of dirty rects on screen */
	var dirty_rects = [], changed_objs = [], 
	/** array of DOMs needed updating */
		dom = [], 
	
	/** object for managing dirty rectangles */
	rectManager = {
		merge: function(a, b, target){
			if (target == null)
				target={}
			// Doing it in this order means we can use either a or b as the target, with no conflict
			// Round resulting values to integers; down for xy, up for wh
			// Would be slightly off if negative w, h were allowed
			target._h = Math.max(a._y + a._h, b._y + b._h);
			target._w = Math.max(a._x + a._w, b._x + b._w);
			target._x = ~~Math.min(a._x, b._x);
			target._y = ~~Math.min(a._y, b._y);
			target._w = (target._w == ~~target._w) ? target._w : ~~target._w + 1 | 0;
			target._h = (target._h == ~~target._h) ? target._h : ~~target._h + 1 | 0;
			return target
		},

		clean: function(){
			// Cleanup; assign the now stale rectangles and clear the arrays
            for (var i=0, l=changed_objs.length; i<l; i++){
            	var obj = changed_objs[i];
            	if (obj.staleRect == null)
            			obj.staleRect = {}
        		obj.staleRect._x = obj._x;
				obj.staleRect._y = obj._y;
				obj.staleRect._w = obj._w;
				obj.staleRect._h = obj._h;

				obj._dirtyFlag = false
            }
            changed_objs.length = 0;
            dirty_rects.length = 0

		},

		// Takes the current and previous position of an object, and pushes the dirty regions onto the stack
		// If the entity has only moved/changed a little bit, the regions are squashed together
		createDirty: function(obj){
			if (obj.staleRect){
				//If overlap, merge stale and current position together, then return
				//Otherwise just push stale rectangle
				if (  rectManager.overlap( obj.staleRect, obj)){
					rectManager.merge(obj.staleRect, obj, obj.staleRect)
					dirty_rects.push(obj.staleRect)
					return
				}
				else{
					dirty_rects.push(obj.staleRect)
				}
			}

			// We use the intermediate "currentRect" so it can be modified without messing with obj
			obj.currentRect._x = obj._x;
			obj.currentRect._y = obj._y;
			obj.currentRect._w = obj._w;
			obj.currentRect._h = obj._h;
			dirty_rects.push(obj.currentRect)
			
		},

		overlap: function(a, b){
			return (a._x < b._x + b._w && a._y < b._y + b._h 
					&& a._x + a._w > b._x && a._y + a._h > b._y)
		}

	};

	return {
		/**@
		* #Crafty.DrawManager.total2D
		* @comp Crafty.DrawManager
		* 
		* Total number of the entities that have the `2D` component.
		*/
		total2D: Crafty("2D").length,

		/**@
		* #Crafty.DrawManager.onScreen
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.onScreen(Object rect)
		* @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
		* 
		* Test if a rectangle is completely in viewport
		*/
		onScreen: function (rect) {
			return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
				   Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
		},

		/**@
		* #Crafty.DrawManager.merge
		* @comp Crafty.DrawManager
		* @sign public Object Crafty.DrawManager.merge(Object set)
		* @param set - an array of rectangular regions
		* 
		* Merged into non overlapping rectangular region
		* Its an optimization for the redraw regions.
		*/
		merge: function (set) {
			var newset = []
			// 
			do {
				var didMerge = false, i = 0,
					l = set.length, current, next;

				while (i < l) {
					current = set[i];
					next = set[i + 1];

					// If current and next overlap, merge them together, and skip the index forward
					if (i < l - 1 && rectManager.overlap(current, next) ){
						rectManager.merge(current, next, current);
						i++;
						didMerge = true;
					}
					newset.push(current);
					i++;
				}

				// Use current as a placeholder while we swap set and newset to iterate once through the list again
				if (newset.length){
					current = set;
					set = newset;
					newset = current;
					newset.length=0;
				}
			} while (didMerge);

			return set;
		},

		/**@
		* #Crafty.DrawManager.addCanvas
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.addCanvas(ent)
		* @param ent - The entity to add
		* 
		* Add an entity to the list of Canvas objects to draw
		*/
		addCanvas: function addCanvas(ent){
			changed_objs.push(ent)
		},

		/**@
		* #Crafty.DrawManager.addDom
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.addDom(ent)
		* @param ent - The entity to add
		* 
		* Add an entity to the list of DOM object to draw
		*/
		addDom: function addDom(ent) {
				dom.push(ent);
		},

		/**@
		* #Crafty.DrawManager.debug
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.debug()
		*/
		debug: function () {
			console.log(changed_objs, dom);
		},

		/**@
		* #Crafty.DrawManager.drawAll
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.drawAll([Object rect])
        * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
        * ~~~
		* - If rect is omitted, redraw within the viewport
		* - If rect is provided, redraw within the rect
		* ~~~
		*/
		drawAll: function (rect) {
			var rect = rect || Crafty.viewport.rect(),
				q = Crafty.map.search(rect),
				i = 0,
				l = q.length,
				ctx = Crafty.canvas.context,
				current;

			ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

			//sort the objects by the global Z
			q.sort(function (a, b) { return a._globalZ - b._globalZ; });
			for (; i < l; i++) {
				current = q[i];
				if (current._visible && current.__c.Canvas) {
					current.draw();
					current._changed = false;
				}
			}
		},

		/**@
		* #Crafty.DrawManager.boundingRect
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.boundingRect(set)
		* @param set - Undocumented
		* ~~~
		* - Calculate the common bounding rect of multiple canvas entities.
		* - Returns coords
		* ~~~
		*/
		boundingRect: function (set) {
			if (!set || !set.length) return;
			var newset = [], i = 1,
			l = set.length, current, master = set[0], tmp;
			master = [master._x, master._y, master._x + master._w, master._y + master._h];
			while (i < l) {
				current = set[i];
				tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
				if (tmp[0] < master[0]) master[0] = tmp[0];
				if (tmp[1] < master[1]) master[1] = tmp[1];
				if (tmp[2] > master[2]) master[2] = tmp[2];
				if (tmp[3] > master[3]) master[3] = tmp[3];
				i++;
			}
			tmp = master;
			master = { _x: tmp[0], _y: tmp[1], _w: tmp[2] - tmp[0], _h: tmp[3] - tmp[1] };

			return master;
		},



		/**@
		* #Crafty.DrawManager.draw
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.draw()
		* ~~~
		* - If the number of rects is over 60% of the total number of objects
		*	do the naive method redrawing `Crafty.DrawManager.drawAll`
		* - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
		* ~~~
		* 
        * @see Canvas.draw, DOM.draw
		*/
		draw: function draw() {
			//if no objects have been changed, stop
			if (!changed_objs.length && !dom.length) return;

			var i = 0, l = changed_objs.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [], ctx = Crafty.canvas.context;

			//loop over all DOM elements needing updating
			for (; i < k; ++i) {
				dom[i].draw()._changed = false;
			}
			//reset DOM array
            dom.length = 0;

			//again, stop if no canvas components have changed
			if (!l) { return; }

			//if the amount of changed objects is over 60% of the total objects
			//do the naive method redrawing
			// TODO: I'm not sure this condition really makes that much sense!
			if (l / this.total2D > 0.6 ) {
				console.log("numbers: " + l + "  | "  + this.total2D )

				this.drawAll();
				rectManager.clean()
				return;
			}

			// Calculate dirty_rects from all changed objects, then merge some overlapping regions together
			for  (i=0; i<l; i++){
				rectManager.createDirty(changed_objs[i])
			}
			dirty_rects = this.merge(dirty_rects);

			// Find entities overlapping dirty screen areas
			l = dirty_rects.length;
			dupes = []
			for (i = 0; i < l; ++i) { //loop over every dirty rect
				rect = dirty_rects[i];
				if (!rect) continue;
				q = Crafty.map.search(rect, false); //search for ents under dirty rect

				dupes.length=0;
				//clear the rect from the main canvas
				ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

				//loop over found objects removing dupes and adding to obj array
				for (j = 0, len = q.length; j < len; ++j) {
					obj = q[j];
      
					if (dupes[obj[0]] || !obj._visible || !obj.__c.Canvas)
						continue;
					dupes[obj[0]] = true;
					obj.dirtyRegion = rect;
					objs.push({ obj: obj, rect:rect });
				}

				

			}

			//sort the objects by the global Z
			objs.sort(zsort);
			if (!objs.length){ 
				rectManager.clean()
				return;
			}

			//loop over the objects
			for (i = 0, l = objs.length; i < l; ++i) {
				obj = objs[i];
				
				ent = obj.obj;
				rect = obj.rect;

				var area = ent._mbr || ent;
				// Check to make sure ent and dirty region overlap at all
				if (!rectManager.overlap(area, rect))
					continue;
				
				// Clip to dirty region
				ctx.save();
				ctx.beginPath();
				ctx.rect(rect._x, rect._y, rect._w, rect._h);
				ctx.clip();

				//draw entity, then restore to previous clipping state
				ent.draw();
				ctx.closePath();
				ctx.restore();

				//Now object is up-to-date, reset flag
				ent._changed = false;
			}

			/*ctx.strokeStyle = 'red';
            for (i = 0, l=dirty_rects.length; i < l; ++i) { //loop over every dirty rect
                rect = dirty_rects[i];
                ctx.strokeRect(rect._x,rect._y,rect._w,rect._h)
            } */

            //Clean up lists etc
            rectManager.clean()
			//all merged IDs are now invalid
			merged = {};
		}
	};
})();
