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

var DirtyRectangles = (function() {

	function x1(rect) { return rect._x; }
	function x2(rect) { return rect._x + rect._w; }
	function y1(rect) { return rect._y; }
	function y2(rect) { return rect._y + rect._h; }

	function intersects(a, b) {
		return x1(a) < x2(b) && x2(a) > x1(b) && y1(a) < y2(b) && y2(a) > y1(b);
	}

	var corner_data = {};

	function reset_corner_data() {
		corner_data.x1y1 = false;
		corner_data.x1y2 = false;
		corner_data.x2y1 = false;
		corner_data.x2y2 = false;
		corner_data.count = 0;
	}

	// Return the number of corners of b that are inside a.
	// _cornersInside stores its results in _corner_data. This is safe to do
	// since the only recursive call in this file is in tail position.
	function corners_inside(a, b) {
		reset_corner_data();

		// The x1, y1 corner of b.
		if (x1(b) >= x1(a) && x1(b) <= x2(a)) {

			// The x1, y1 corner of b.
			if (y1(b) >= y1(a) && y1(b) <= y2(a)) {
				corner_data.x1y1 = true;
				corner_data.count++;
			}
			// The x1, y2 corner of b
			if (y2(b) >= y1(a) && y2(b) <= y2(a)) {
				corner_data.x1y2 = true;
				corner_data.count++;
			}
		}

		if (x2(b) >= x1(a) && x2(b) <= x2(a)) {
			// The x2, y1 corner of b.
			if (y1(b) >= y1(a) && y1(b) <= y2(a)) {
				corner_data.x2y1 = true;
				corner_data.count++;
			}
			// The x2, y2 corner of b
			if (y2(b) >= y1(a) && y2(b) <= y2(a)) {
				corner_data.x2y2 = true;
				corner_data.count++;
			}
		}

		return corner_data.count;
	}

	// Shrink contained so that it no longer overlaps containing.
	// Requires:
	//   * Exactly two corners of contained are within containing.
	//   * _cornersInside called for containing and contained.
	function shrink_rect(containing, contained) {

		// The x1, y1 and x2, y1 corner of contained.
		if (corner_data.x1y1 && corner_data.x2y1) {
			contained._h -= y2(containing) - y1(contained);
			contained._y = y2(containing);
			return;
		}

		// The x1, y1 and x1, y2 corner of contained.
		if (corner_data.x1y1 && corner_data.x1y2) {
			contained._w -= x2(containing) - x1(contained);
			contained._x = x2(containing);
			return;
		}

		// The x1, y2 and x2, y2 corner of contained.
		if (corner_data.x1y2 && corner_data.x2y2) {
			contained._h = y1(containing) - y1(contained);
			return;
		}

		// The x2, y1 and x2, y2 corner of contained.
		if (corner_data.x2y1 && corner_data.x2y2) {
			contained._w = x1(containing) - x1(contained);
			return;
		}

	}

	// Enlarge `a` such that it covers `b` as well.
	function merge_into(a, b) {
		var newX2 = Math.max(x2(a), x2(b));
		var newY2 = Math.max(y2(a), y2(b));

		a._x = Math.min(a._x, b._x);
		a._y = Math.min(a._y, b._y);

		a._w = newX2 - a._x;
		a._h = newY2 - a._y;
	}

	function DirtyRectangles() {
		this.rectangles = [];
	};

	DirtyRectangles.prototype.add_rectangle = function(new_rect) {
		var _this = this;

		var indices_to_delete = [];

		function delete_indices() {
			var i, index;
			for (i = 0; i < indices_to_delete.length; i++) {
				index = indices_to_delete[i];
				_this.rectangles.splice(index, 1);
			}
		}

		var index, rect, corners, indices_to_delete;

		for (index = 0; index < this.rectangles.length; index++) {
			rect = this.rectangles[index];

			if (intersects(new_rect, rect)) {
				corners = corners_inside(rect, new_rect);
				switch (corners) {
					case 4:
						// If 4 corners of new_rect lie within rect, we can discard
						// new_rect.  We shouldn't have found any rectangles to delete,
						// because if a rectangle in the list is contained within
						// new_rect, and new_rect is contained with rect, then there are
						// overlapping rectangles in the list.
						if (indices_to_delete.length > 0)
							console.error("Dirty rectangle bug");
						return;
					case 3:
						console.error("Impossible corner count");
						return;
					case 2:
						// Shrink new_rect to not overlap rect.
						shrink_rect(rect, new_rect);
						break;
					case 1:
						corners = corners_inside(new_rect, rect);
						switch (corners) {
							case 1:
								// Merge the two rectangles.
								merge_into(rect, new_rect);
								// TODO: Must remove rect and re-insert it.
								indices_to_delete.unshift(index);
								delete_indices();
								_this.add_rectangle(rect);
								return;
							case 2:
								// This case looks like this:
								// +--------+=========+----------+
								// |rect    |         |          |
								// |        |         |          |
								// +--------+---------+ new_rect |
								//          +--------------------+
								// Note how new_rect has 1 corner in rect, while
								// rect has 2 corners in new_rect.
								//
								// Obviously, we shrink rect to not overlap new_rect.
								shrink_rect(new_rect, rect);
								break;
							case 4:
								// This case occurs when new_rect and rect have 1 corner in common,
								// but rect lies entirely within new_rect.
								// We delete rect, since new_rect encompasses it, and continue with
								// insertion normally.
								indices_to_delete.unshift(index);
								break;
							default:
								console.error("Dirty rectangle bug");
						}
						break;
					case 0:
						// No corners of new_rect are inside rect. Instead, see how many
						// corners of rect are inside new_rect
						corners = corners_inside(new_rect, rect);
						switch (corners) {
							case 4:
								// Delete rect, continue with insertion of new_rect
								indices_to_delete.unshift(index);
								break;
							case 3:
								console.error("Impossible corner count");
								return;
							case 2:
								// Shrink rect to not overlap new_rect, continue with insertion.
								shrink_rect(new_rect, rect);
								break;
							case 1:
								// This should be impossible, the earlier case of 1 corner overlapping
								// should have been triggered.
								console.error("Impossible corner count");
								return;
						}
				}
			}
		}

		delete_indices();
		this.rectangles.push(new_rect);
	};

	return DirtyRectangles;

})();

/**@
* #Crafty.DrawManager
* @category Graphics
* @sign Crafty.DrawManager
* 
* An internal object manage objects to be drawn and implement
* the best method of drawing in both DOM and canvas
*/
Crafty.DrawManager = (function () {
	/** array of dirty rects on screen */
	var dirty_rects = [],
	/** array of DOMs needed updating */
		dom = [];

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
			var dr = new DirtyRectangles();
			for (var i = 0, new_rect; new_rect = set[i]; i++) {
				dr.add_rectangle(new_rect);
			}
			return dr.rectangles;
		},

		/**@
		* #Crafty.DrawManager.add
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.add(old, current)
		* @param old - Undocumented
		* @param current - Undocumented
		* 
		* Calculate the bounding rect of dirty data and add to the register of dirty rectangles
		*/
		add: function add(old, current) {
			if (!current) {
				dom.push(old);
				return;
			}

			var rect,
				before = old._mbr || old,
				after = current._mbr || current;

			if (old === current) {
				rect = old.mbr() || old.pos();
			} else {
				rect = {
					_x: ~~Math.min(before._x, after._x),
					_y: ~~Math.min(before._y, after._y),
					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
				};

				rect._w = (rect._w - rect._x);
				rect._h = (rect._h - rect._y);
			}

			if (rect._w === 0 || rect._h === 0 || !this.onScreen(rect)) {
				return false;
			}

			//floor/ceil
			rect._x = ~~rect._x;
			rect._y = ~~rect._y;
			rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
			rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;

			//add to dirty_rects, check for merging
			dirty_rects.push(rect);

			//if it got merged
			return true;
		},

		/**@
		* #Crafty.DrawManager.debug
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.debug()
		*/
		debug: function () {
			console.log(dirty_rects, dom);
		},

		/**@
		* #Crafty.DrawManager.draw
		* @comp Crafty.DrawManager
		* @sign public Crafty.DrawManager.draw([Object rect])
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
			//if nothing in dirty_rects, stop
			if (!dirty_rects.length && !dom.length) return;

			var i = 0, l = dirty_rects.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [], ctx = Crafty.canvas.context;

			//loop over all DOM elements needing updating
			for (; i < k; ++i) {
				dom[i].draw()._changed = false;
			}
			//reset DOM array
            dom.length = 0;
			//again, stop if nothing in dirty_rects
			if (!l) { return; }

			//if the amount of rects is over 60% of the total objects
			//do the naive method redrawing
			if (l / this.total2D > 0.6) {
				this.drawAll();
				dirty_rects.length = 0;
				return;
			}

			dirty_rects = this.merge(dirty_rects);
			for (i = 0; i < l; ++i) { //loop over every dirty rect
				rect = dirty_rects[i];
				if (!rect) continue;
				q = Crafty.map.search(rect, false); //search for ents under dirty rect

				dupes = {};

				//loop over found objects removing dupes and adding to obj array
				for (j = 0, len = q.length; j < len; ++j) {
					obj = q[j];

					if (dupes[obj[0]] || !obj._visible || !obj.__c.Canvas)
						continue;
					dupes[obj[0]] = true;

					objs.push({ obj: obj, rect: rect });
				}

				//clear the rect from the main canvas
				ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

			}

			//sort the objects by the global Z
			objs.sort(function (a, b) { return a.obj._globalZ - b.obj._globalZ; });
			if (!objs.length){ return; }

			//loop over the objects
			for (i = 0, l = objs.length; i < l; ++i) {
				obj = objs[i];
				rect = obj.rect;
				ent = obj.obj;

				var area = ent._mbr || ent,
					x = (rect._x - area._x <= 0) ? 0 : ~~(rect._x - area._x),
					y = (rect._y - area._y < 0) ? 0 : ~~(rect._y - area._y),
					w = ~~Math.min(area._w - x, rect._w - (area._x - rect._x), rect._w, area._w),
					h = ~~Math.min(area._h - y, rect._h - (area._y - rect._y), rect._h, area._h);

				//no point drawing with no width or height
				if (h === 0 || w === 0) continue;

				ctx.save();
				ctx.beginPath();
				ctx.moveTo(rect._x, rect._y);
				ctx.lineTo(rect._x + rect._w, rect._y);
				ctx.lineTo(rect._x + rect._w, rect._h + rect._y);
				ctx.lineTo(rect._x, rect._h + rect._y);
				ctx.lineTo(rect._x, rect._y);

				ctx.clip();

				ent.draw();
				ctx.closePath();
				ctx.restore();

				//allow entity to re-dirty_rects
				ent._changed = false;
			}

			//empty dirty_rects
			dirty_rects.length = 0;
			//all merged IDs are now invalid
			merged = {};
		}
	};
})();
