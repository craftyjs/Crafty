/**@
* #Crafty.map
* @category 2D
* Functions related with querying entities.
* @see Crafty.HashMap
*/
Crafty.map = new Crafty.HashMap();
var M = Math,
	Mc = M.cos,
	Ms = M.sin,
	PI = M.PI,
	DEG_TO_RAD = PI / 180;


/**@
* #2D
* @category 2D
* Component for any entity that has a position on the stage.
* @trigger Move - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
* @trigger Change - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
* @trigger Rotate - when the entity is rotated - { cos:Number, sin:Number, deg:Number, rad:Number, o: {x:Number, y:Number}, matrix: {M11, M12, M21, M22} }
*/
Crafty.c("2D", {
/**@
	* #.x
	* @comp 2D
	* The `x` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._x` property.
	* @see ._attr
	*/
	_x: 0,
	/**@
	* #.y
	* @comp 2D
	* The `y` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._y` property.
	* @see ._attr
	*/
	_y: 0,
	/**@
	* #.w
	* @comp 2D
	* The width of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._w` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	* @see ._attr
	*/
	_w: 0,
	/**@
	* #.h
	* @comp 2D
	* The height of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._h` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	* @see ._attr
	*/
	_h: 0,
	/**@
	* #.z
	* @comp 2D
	* The `z` index on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._z` property.
	*
	* A higher `z` value will be closer to the front of the stage. A smaller `z` value will be closer to the back.
	* A global Z index is produced based on its `z` value as well as the GID (which entity was created first).
	* Therefore entities will naturally maintain order depending on when it was created if same z value.
	* @see ._attr
	*/
	_z: 0,
	/**@
	* #.rotation
	* @comp 2D
	* Set the rotation of your entity. Rotation takes degrees in a clockwise direction.
	* It is important to note there is no limit on the rotation value. Setting a rotation
	* mod 360 will give the same rotation without reaching huge numbers.
	* @see ._attr
	*/
	_rotation: 0,
	/**@
	* #.alpha
	* @comp 2D
	* Transparency of an entity. Must be a decimal value between 0.0 being fully transparent to 1.0 being fully opaque.
	*/
	_alpha: 1.0,
	/**@
	* #.visible
	* @comp 2D
	* If the entity is visible or not. Accepts a true or false value.
	* Can be used for optimization by setting an entities visibility to false when not needed to be drawn.
	*
	* The entity will still exist and can be collided with but just won't be drawn.
  * @see Crafty.DrawManager.draw, Crafty.DrawManager.drawAll
	*/
	_visible: true,

	/**@
	* #._globalZ
	* @comp 2D
	* When two entities overlap, the one with the larger `_globalZ` will be on top of the other.
	* @see Crafty.DrawManager.draw, Crafty.DrawManager.drawAll
	*/
	_globalZ: null,

	_origin: null,
	_mbr: null,
	_entry: null,
	_children: null,
	_parent: null,
	_changed: false,

	_defineGetterSetter_setter: function() {
		//create getters and setters using __defineSetter__ and __defineGetter__
		this.__defineSetter__('x', function (v) { this._attr('_x', v); });
		this.__defineSetter__('y', function (v) { this._attr('_y', v); });
		this.__defineSetter__('w', function (v) { this._attr('_w', v); });
		this.__defineSetter__('h', function (v) { this._attr('_h', v); });
		this.__defineSetter__('z', function (v) { this._attr('_z', v); });
		this.__defineSetter__('rotation', function (v) { this._attr('_rotation', v); });
		this.__defineSetter__('alpha', function (v) { this._attr('_alpha', v); });
		this.__defineSetter__('visible', function (v) { this._attr('_visible', v); });

		this.__defineGetter__('x', function () { return this._x; });
		this.__defineGetter__('y', function () { return this._y; });
		this.__defineGetter__('w', function () { return this._w; });
		this.__defineGetter__('h', function () { return this._h; });
		this.__defineGetter__('z', function () { return this._z; });
		this.__defineGetter__('rotation', function () { return this._rotation; });
		this.__defineGetter__('alpha', function () { return this._alpha; });
		this.__defineGetter__('visible', function () { return this._visible; });
		this.__defineGetter__('parent', function () { return this._parent; });
		this.__defineGetter__('numChildren', function () { return this._children.length; });
	},

	_defineGetterSetter_defineProperty: function() {
		Object.defineProperty(this, 'x', {
				set: function (v) { this._attr('_x', v); }
				, get: function () { return this._x; }
				, configurable: true
			});

		Object.defineProperty(this, 'y', {
				set: function (v) { this._attr('_y', v); }
				, get: function () { return this._y; }
				, configurable: true
			});

		Object.defineProperty(this, 'w', {
				set: function (v) { this._attr('_w', v); }
				, get: function () { return this._w; }
				, configurable: true
			});

		Object.defineProperty(this, 'h', {
				set: function (v) { this._attr('_h', v); }
				, get: function () { return this._h; }
				, configurable: true
			});

		Object.defineProperty(this, 'z', {
				set: function (v) { this._attr('_z', v); }
				, get: function () { return this._z; }
				, configurable: true
			});

		Object.defineProperty(this, 'rotation', {
			set: function (v) { this._attr('_rotation', v); }
			, get: function () { return this._rotation; }
			, configurable: true
		});

		Object.defineProperty(this, 'alpha', {
			set: function (v) { this._attr('_alpha', v); }
			, get: function () { return this._alpha; }
			, configurable: true
		});

		Object.defineProperty(this, 'visible', {
			set: function (v) { this._attr('_visible', v); }
			, get: function () { return this._visible; }
			, configurable: true
		});
	},

	_defineGetterSetter_fallback: function() {
		//set the public properties to the current private properties
		this.x = this._x;
		this.y = this._y;
		this.w = this._w;
		this.h = this._h;
		this.z = this._z;
		this.rotation = this._rotation;
		this.alpha = this._alpha;
		this.visible = this._visible;

		//on every frame check for a difference in any property
		this.bind("EnterFrame", function () {
			//if there are differences between the public and private properties
			if (this.x !== this._x || this.y !== this._y ||
				this.w !== this._w || this.h !== this._h ||
				this.z !== this._z || this.rotation !== this._rotation ||
				this.alpha !== this._alpha || this.visible !== this._visible) {

				//save the old positions
				var old = this.mbr() || this.pos();

				//if rotation has changed, use the private rotate method
				if (this.rotation !== this._rotation) {
					this._rotate(this.rotation);
				} else {
					//update the MBR
					var mbr = this._mbr, moved = false;
					// If the browser doesn't have getters or setters,
					// {x, y, w, h, z} and {_x, _y, _w, _h, _z} may be out of sync,
					// in which case t checks if they are different on tick and executes the Change event.
					if (mbr) { //check each value to see which has changed
						if (this.x !== this._x) { mbr._x -= this.x - this._x; moved = true; }
						else if (this.y !== this._y) { mbr._y -= this.y - this._y; moved = true; }
						else if (this.w !== this._w) { mbr._w -= this.w - this._w; moved = true; }
						else if (this.h !== this._h) { mbr._h -= this.h - this._h; moved = true; }
						else if (this.z !== this._z) { mbr._z -= this.z - this._z; moved = true; }
					}

					//if the moved flag is true, trigger a move
					if (moved) this.trigger("Move", old);
				}

				//set the public properties to the private properties
				this._x = this.x;
				this._y = this.y;
				this._w = this.w;
				this._h = this.h;
				this._z = this.z;
				this._rotation = this.rotation;
				this._alpha = this.alpha;
				this._visible = this.visible;

				//trigger the changes
				this.trigger("Change", old);
				//without this entities weren't added correctly to Crafty.map.map in IE8.
				//not entirely sure this is the best way to fix it though
				this.trigger("Move", old);
			}
		});
  },

	init: function() {
		this._globalZ = this[0];
		this._origin = { x: 0, y: 0 };
		this._children = [];

		if(Crafty.support.setter) {
      this._defineGetterSetter_setter();
		} else if (Crafty.support.defineProperty) {
			//IE9 supports Object.defineProperty
      this._defineGetterSetter_defineProperty();
		} else {
			/*
			If no setters and getters are supported (e.g. IE8) supports,
			check on every frame for a difference between this._(x|y|w|h|z...)
			and this.(x|y|w|h|z) and update accordingly.
			*/
      this._defineGetterSetter_fallback();
		}

		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);

		//when object changes, update HashMap
		this.bind("Move", function (e) {
			var area = this._mbr || this;
			this._entry.update(area);
			this._cascade(e);
		});

		this.bind("Rotate", function (e) {
			var old = this._mbr || this;
			this._entry.update(old);
			this._cascade(e);
		});

		//when object is removed, remove from HashMap and destroy attached children
		this.bind("Remove", function () {
			if (this._children) {
				for (var i = 0; i < this._children.length; i++) {
					if (this._children[i].destroy) {
						this._children[i].destroy();
					}
				}
				this._children = [];
			}
			
			if (this._parent) {
				this._parent.detach(this);
			}

			Crafty.map.remove(this);

			this.detach();
		});
	},

	/**
	* Calculates the MBR when rotated with an origin point
	*/
	_rotate: function (v) {
		var theta = -1 * (v % 360), //angle always between 0 and 359
			rad = theta * DEG_TO_RAD,
			ct = Math.cos(rad), //cache the sin and cosine of theta
			st = Math.sin(rad),
			o = {
			x: this._origin.x + this._x,
			y: this._origin.y + this._y
		};

		//if the angle is 0 and is currently 0, skip
		if (!theta) {
			this._mbr = null;
			if (!this._rotation % 360) return;
		}

		var x0 = o.x + (this._x - o.x) * ct + (this._y - o.y) * st,
			y0 = o.y - (this._x - o.x) * st + (this._y - o.y) * ct,
			x1 = o.x + (this._x + this._w - o.x) * ct + (this._y - o.y) * st,
			y1 = o.y - (this._x + this._w - o.x) * st + (this._y - o.y) * ct,
			x2 = o.x + (this._x + this._w - o.x) * ct + (this._y + this._h - o.y) * st,
			y2 = o.y - (this._x + this._w - o.x) * st + (this._y + this._h - o.y) * ct,
			x3 = o.x + (this._x - o.x) * ct + (this._y + this._h - o.y) * st,
			y3 = o.y - (this._x - o.x) * st + (this._y + this._h - o.y) * ct,
			minx = Math.round(Math.min(x0, x1, x2, x3)),
			miny = Math.round(Math.min(y0, y1, y2, y3)),
			maxx = Math.round(Math.max(x0, x1, x2, x3)),
			maxy = Math.round(Math.max(y0, y1, y2, y3));

		this._mbr = { _x: minx, _y: miny, _w: maxx - minx, _h: maxy - miny };

		//trigger rotation event
		var difference = this._rotation - v,
			drad = difference * DEG_TO_RAD;

		this.trigger("Rotate", {
			cos: Math.cos(drad),
			sin: Math.sin(drad),
			deg: difference,
			rad: drad,
			o: { x: o.x, y: o.y },
			matrix: { M11: ct, M12: st, M21: -st, M22: ct }
		});
	},

	/**@
	* #.area
	* @comp 2D
	* @sign public Number .area(void)
	* Calculates the area of the entity
	*/
	area: function () {
		return this._w * this._h;
	},

	/**@
	* #.intersect
	* @comp 2D
	* @sign public Boolean .intersect(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .intersect(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this entity intersects a rectangle.
	*/
	intersect: function (x, y, w, h) {
		var rect, obj = this._mbr || this;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return obj._x < rect.x + rect.w && obj._x + obj._w > rect.x &&
			   obj._y < rect.y + rect.h && obj._h + obj._y > rect.y;
	},

	/**@
	* #.within
	* @comp 2D
	* @sign public Boolean .within(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .within(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this current entity is within another rectangle.
	*/
	within: function (x, y, w, h) {
		var rect;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return rect.x <= this.x && rect.x + rect.w >= this.x + this.w &&
				rect.y <= this.y && rect.y + rect.h >= this.y + this.h;
	},

	/**@
	* #.contains
	* @comp 2D
	* @sign public Boolean .contains(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .contains(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if the rectangle is within the current entity.
	*/
	contains: function (x, y, w, h) {
		var rect;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return rect.x >= this.x && rect.x + rect.w <= this.x + this.w &&
				rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
	},

	/**@
	* #.pos
	* @comp 2D
	* @sign public Object .pos(void)
	* Returns the x, y, w, h properties as a rect object
	* (a rect object is just an object with the keys _x, _y, _w, _h).
	*
	* The keys have an underscore prefix. This is due to the x, y, w, h
	* properties being merely setters and getters that wrap the properties with an underscore (_x, _y, _w, _h).
	*/
	pos: function () {
		return {
			_x: (this._x),
			_y: (this._y),
			_w: (this._w),
			_h: (this._h)
		};
	},

	/**@
	* #.mbr
	* @comp 2D
	* @sign public Object .mbr()
	* Returns the minimum bounding rectangle. If there is no rotation
	* on the entity it will return the rect.
	*/
	mbr: function () {
		if (!this._mbr) return this.pos();
		return {
			_x: (this._mbr._x),
			_y: (this._mbr._y),
			_w: (this._mbr._w),
			_h: (this._mbr._h)
		};
	},

	/**@
	* #.isAt
	* @comp 2D
	* @sign public Boolean .isAt(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Determines whether a point is contained by the entity. Unlike other methods,
	* an object can't be passed. The arguments require the x and y value
	*/
	isAt: function (x, y) {
		if (this.mapArea) {
      		return this.mapArea.containsPoint(x, y);
		} else if (this.map) {
			return this.map.containsPoint(x, y);
		}
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},

	/**@
	* #.move
	* @comp 2D
	* @sign public this .move(String dir, Number by)
	* @param dir - Direction to move (n,s,e,w,ne,nw,se,sw)
	* @param by - Amount to move in the specified direction
	* Quick method to move the entity in a direction (n, s, e, w, ne, nw, se, sw) by an amount of pixels.
	*/
	move: function (dir, by) {
		if (dir.charAt(0) === 'n') this.y -= by;
		if (dir.charAt(0) === 's') this.y += by;
		if (dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if (dir === 'w' || dir.charAt(1) === 'w') this.x -= by;

		return this;
	},

	/**@
	* #.shift
	* @comp 2D
	* @sign public this .shift(Number x, Number y, Number w, Number h)
	* @param x - Amount to move X
	* @param y - Amount to move Y
	* @param w - Amount to widen
	* @param h - Amount to increase height
	* Shift or move the entity by an amount. Use negative values
	* for an opposite direction.
	*/
	shift: function (x, y, w, h) {
		if (x) this.x += x;
		if (y) this.y += y;
		if (w) this.w += w;
		if (h) this.h += h;

		return this;
	},

	/**@
	* #._cascade
	* @comp 2D
    * @sign public void ._cascade(e)
	* @param e - Amount to move X
	* Shift move or rotate the entity by an amount. Use negative values
	* for an opposite direction.
	*/
	_cascade: function (e) {
		if (!e) return; //no change in position
		var i = 0, children = this._children, l = children.length, obj;
		//rotation
		if (e.cos) {
			for (; i < l; ++i) {
				obj = children[i];
				if ('rotate' in obj) obj.rotate(e);
			}
		} else {
			//use MBR or current
			var rect = this._mbr || this,
				dx = rect._x - e._x,
				dy = rect._y - e._y,
				dw = rect._w - e._w,
				dh = rect._h - e._h;

			for (; i < l; ++i) {
				obj = children[i];
				obj.shift(dx, dy, dw, dh);
			}
		}
	},

	/**@
	* #.attach
	* @comp 2D
	* @sign public this .attach(Entity obj[, .., Entity objN])
	* @param obj - Entity(s) to attach
	* Attaches an entities position and rotation to current entity. When the current entity moves,
	* the attached entity will move by the same amount. Attached entities stored in _children array,
	* the parent object is stored in _parent on the child entities.
	*
	* As many objects as wanted can be attached and a hierarchy of objects is possible by attaching.
	*/
	attach: function () {
		var i = 0, arg = arguments, l = arguments.length, obj;
		for (; i < l; ++i) {
			obj = arg[i];
			if (obj._parent) { obj._parent.detach(obj); }
			obj._parent = this;
			this._children.push(obj);
		}

		return this;
	},

	/**@
	* #.detach
	* @comp 2D
	* @sign public this .detach([Entity obj])
	* @param obj - The entity to detach. Left blank will remove all attached entities
	* Stop an entity from following the current entity. Passing no arguments will stop
	* every entity attached.
	*/
	detach: function (obj) {
		//if nothing passed, remove all attached objects
		if (!obj) {
			for (var i = 0; i < this._children.length; i++) {
				this._children[i]._parent = null;
			}
			this._children = [];
			return this;
		}

		//if obj passed, find the handler and unbind
		for (var i = 0; i < this._children.length; i++) {
			if (this._children[i] == obj) {
				this._children.splice(i, 1);
			}
		}
		obj._parent = null;

		return this;
	},

	/**@
	* #.origin
	* @comp 2D
	* @sign public this .origin(Number x, Number y)
	* @param x - Pixel value of origin offset on the X axis
	* @param y - Pixel value of origin offset on the Y axis
	* @sign public this .origin(String offset)
	* @param offset - Combination of center, top, bottom, middle, left and right
	* Set the origin point of an entity for it to rotate around.
	*
	* @example
	* ~~~
	* this.origin("top left")
	* this.origin("center")
	* this.origin("bottom right")
	* this.origin("middle right")
	* ~~~
	*
	* @see .rotation
	*/
	origin: function (x, y) {
		//text based origin
		if (typeof x === "string") {
			if (x === "centre" || x === "center" || x.indexOf(' ') === -1) {
				x = this._w / 2;
				y = this._h / 2;
			} else {
				var cmd = x.split(' ');
				if (cmd[0] === "top") y = 0;
				else if (cmd[0] === "bottom") y = this._h;
				else if (cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this._h / 2;

				if (cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this._w / 2;
				else if (cmd[1] === "left") x = 0;
				else if (cmd[1] === "right") x = this._w;
			}
		}

		this._origin.x = x;
		this._origin.y = y;

		return this;
	},

	/**@
	* #.flip
	* @comp 2D
	* @trigger Change - when the entity has flipped
	* @sign public this .flip(String dir)
	* @param dir - Flip direction
	*
	* Flip entity on passed direction
	*
	* @example
	* ~~~
	* this.flip("X")
	* ~~~
	*/
	flip: function (dir) {
		dir = dir || "X";
                if(!this["_flip" + dir]) {
                    this["_flip" + dir] = true;
                    this.trigger("Change");
                }
	},

        /**@
	* #.unflip
	* @comp 2D
	* @trigger Change - when the entity has unflipped
	* @sign public this .unflip(String dir)
	* @param dir - Unflip direction
	*
	* Unflip entity on passed direction (if it's flipped)
	*
	* @example
	* ~~~
	* this.unflip("X")
	* ~~~
	*/
	unflip: function (dir) {
		dir = dir || "X";
                if(this["_flip" + dir]) {
                    this["_flip" + dir] = false;
                    this.trigger("Change");
                }
	},

	/**
	* Method for rotation rather than through a setter
	*/
	rotate: function (e) {
		//assume event data origin
		this._origin.x = e.o.x - this._x;
		this._origin.y = e.o.y - this._y;

		//modify through the setter method
		this._attr('_rotation', e.theta);
	},

	/**@
	* #._attr
	* @comp 2D
	* Setter method for all 2D properties including
	* x, y, w, h, alpha, rotation and visible.
	*/
	_attr: function (name, value) {
		//keep a reference of the old positions
		var pos = this.pos(),
			old = this.mbr() || pos;

		//if rotation, use the rotate method
		if (name === '_rotation') {
			this._rotate(value);
			this.trigger("Rotate");
			//set the global Z and trigger reorder just in case
		} else if (name === '_z') {
			this._globalZ = parseInt(value + Crafty.zeroFill(this[0], 5), 10); //magic number 10e5 is the max num of entities
			this.trigger("reorder");
			//if the rect bounds change, update the MBR and trigger move
		} else if (name == '_x' || name === '_y' || name === '_w' || name === '_h') {
			var mbr = this._mbr;
			if (mbr) {
				mbr[name] -= this[name] - value;
			}
			this[name] = value;
			this.trigger("Move", old);
		}

		//everything will assume the value
		this[name] = value;

		//trigger a change
		this.trigger("Change", old);
	}
});

Crafty.c("Physics", {
	_gravity: 0.4,
	_friction: 0.2,
	_bounce: 0.5,

	gravity: function (gravity) {
		this._gravity = gravity;
	}
});

/**@
* #Gravity
* @category 2D
* Adds gravitational pull to the entity.
*/
Crafty.c("Gravity", {
	_gravityConst: 0.2,
	_gy: 0,
	_falling: true,
	_anti: null,

	init: function () {
		this.requires("2D");
	},

	/**@
	* #.gravity
	* @comp Gravity
	* @sign public this .gravity([comp])
	* @param comp - The name of a component that will stop this entity from falling
	*
	* Enable gravity for this entity no matter whether comp parameter is not specified,
	* If comp parameter is specified all entities with that component will stop this entity from falling.
	* For a player entity in a platform game this would be a component that is added to all entities
	* that the player should be able to walk on.
	*
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Color, Gravity")
	*	 .color("red")
	*	 .attr({ w: 100, h: 100 })
	*	 .gravity("platform")
	* ~~~
	*/
	gravity: function (comp) {
		if (comp) this._anti = comp;

		this.bind("EnterFrame", this._enterFrame);

		return this;
	},

	/**@
	* #.gravityConst
	* @comp Gravity
	* @sign public this .gravityConst(g)
	* @param g - gravitational constant
	*
	* Set the gravitational constant to g. The default is .2. The greater g, the faster the object falls.
	*
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Color, Gravity")
	*   .color("red")
	*   .attr({ w: 100, h: 100 })
	*   .gravity("platform")
	*   .gravityConst(2)
	* ~~~
	*/
	gravityConst: function(g) {
		this._gravityConst=g;
		return this;
	},

	_enterFrame: function () {
		if (this._falling) {
			//if falling, move the players Y
			this._gy += this._gravityConst;
			this.y += this._gy;
		} else {
			this._gy = 0; //reset change in y
		}

		var obj, hit = false, pos = this.pos(),
			q, i = 0, l;

		//Increase by 1 to make sure map.search() finds the floor
		pos._y++;

		//map.search wants _x and intersect wants x...
		pos.x = pos._x;
		pos.y = pos._y;
		pos.w = pos._w;
		pos.h = pos._h;

		q = Crafty.map.search(pos);
		l = q.length;

		for (; i < l; ++i) {
			obj = q[i];
			//check for an intersection directly below the player
			if (obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
				hit = obj;
				break;
			}
		}

		if (hit) { //stop falling if found
			if (this._falling) this.stopFalling(hit);
		} else {
			this._falling = true; //keep falling otherwise
		}
	},

	stopFalling: function (e) {
		if (e) this.y = e._y - this._h; //move object

		//this._gy = -1 * this._bounce;
		this._falling = false;
		if (this._up) this._up = false;
		this.trigger("hit");
	},

	/**@
	* #.antigravity
	* @comp Gravity
	* @sign public this .antigravity()
	* Disable gravity for this component. It can be reenabled by calling .gravity()
	*/
	antigravity: function () {
		this.unbind("EnterFrame", this._enterFrame);
	}
});

/**@
* #Crafty.polygon
* @category 2D
*
* Polygon object used for hitboxes and click maps. Must pass an Array for each point as an
* argument where index 0 is the x position and index 1 is the y position.
*
* For example one point of a polygon will look like this: `[0,5]` where the `x` is `0` and the `y` is `5`.
*
* Can pass an array of the points or simply put each point as an argument.
*
* When creating a polygon for an entity, each point should be offset or relative from the entities `x` and `y`
* (don't include the absolute values as it will automatically calculate this).
*
*
* @example
* ~~~
* new Crafty.polygon([50,0],[100,100],[0,100]);
* new Crafty.polygon([[50,0],[100,100],[0,100]]);
* ~~~
*/
Crafty.polygon = function (poly) {
	if (arguments.length > 1) {
		poly = Array.prototype.slice.call(arguments, 0);
	}
	this.points = poly;
};

Crafty.polygon.prototype = {
	/**@
	* #.containsPoint
	* @comp Crafty.polygon
	* @sign public Boolean .containsPoint(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	*
	* Method is used to determine if a given point is contained by the polygon.
	*
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.containsPoint(50, 50); //TRUE
	* poly.containsPoint(0, 0); //FALSE
	* ~~~
	*/
	containsPoint: function (x, y) {
		var p = this.points, i, j, c = false;

		for (i = 0, j = p.length - 1; i < p.length; j = i++) {
			if (((p[i][1] > y) != (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) {
				c = !c;
			}
		}

		return c;
	},

	/**@
	* #.shift
	* @comp Crafty.polygon
	* @sign public void .shift(Number x, Number y)
	* @param x - Amount to shift the `x` axis
	* @param y - Amount to shift the `y` axis
	*
	* Shifts every single point in the polygon by the specified amount.
	*
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.shift(5,5);
	* //[[55,5], [105,5], [5,105]];
	* ~~~
	*/
	shift: function (x, y) {
		var i = 0, l = this.points.length, current;
		for (; i < l; i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},

	rotate: function (e) {
		var i = 0, l = this.points.length,
			current, x, y;

		for (; i < l; i++) {
			current = this.points[i];

			x = e.o.x + (current[0] - e.o.x) * e.cos + (current[1] - e.o.y) * e.sin;
			y = e.o.y - (current[0] - e.o.x) * e.sin + (current[1] - e.o.y) * e.cos;

			current[0] = x;
			current[1] = y;
		}
	}
};

/**@
* #Crafty.circle
* @category 2D
* Circle object used for hitboxes and click maps. Must pass a `x`, a `y` and a `radius` value.
*
*@example
* ~~~
* var centerX = 5,
*     centerY = 10,
*     radius = 25;
*
* new Crafty.circle(centerX, centerY, radius);
* ~~~
*
* When creating a circle for an entity, each point should be offset or relative from the entities `x` and `y`
* (don't include the absolute values as it will automatically calculate this).
*/
Crafty.circle = function (x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    // Creates an octagon that approximate the circle for backward compatibility.
    this.points = [];
    var theta;

    for (var i = 0; i < 8; i++) {
        theta = i * Math.PI / 4;
        this.points[i] = [this.x + (Math.sin(theta) * radius), this.y + (Math.cos(theta) * radius)];
    }
};

Crafty.circle.prototype = {
    /**@
	* #.containsPoint
	* @comp Crafty.circle
	* @sign public Boolean .containsPoint(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	*
	* Method is used to determine if a given point is contained by the circle.
	*
	* @example
	* ~~~
	* var circle = new Crafty.circle(0, 0, 10);
	* circle.containsPoint(0, 0); //TRUE
	* circle.containsPoint(50, 50); //FALSE
	* ~~~
	*/
	containsPoint: function (x, y) {
		var radius = this.radius,
		    sqrt = Math.sqrt,
		    deltaX = this.x - x,
		    deltaY = this.y - y;

		return (deltaX * deltaX + deltaY * deltaY) < (radius * radius);
	},

	/**@
	* #.shift
	* @comp Crafty.circle
	* @sign public void .shift(Number x, Number y)
	* @param x - Amount to shift the `x` axis
	* @param y - Amount to shift the `y` axis
	*
	* Shifts the circle by the specified amount.
	*
	* @example
	* ~~~
	* var poly = new Crafty.circle(0, 0, 10);
	* circle.shift(5,5);
	* //{x: 5, y: 5, radius: 10};
	* ~~~
	*/
	shift: function (x, y) {
		this.x += x;
		this.y += y;

		var i = 0, l = this.points.length, current;
		for (; i < l; i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},

	rotate: function () {
		// We are a circle, we don't have to rotate :)
	}
};


Crafty.matrix = function (m) {
	this.mtx = m;
	this.width = m[0].length;
	this.height = m.length;
};

Crafty.matrix.prototype = {
	x: function (other) {
		if (this.width != other.height) {
			return;
		}

		var result = [];
		for (var i = 0; i < this.height; i++) {
			result[i] = [];
			for (var j = 0; j < other.width; j++) {
				var sum = 0;
				for (var k = 0; k < this.width; k++) {
					sum += this.mtx[i][k] * other.mtx[k][j];
				}
				result[i][j] = sum;
			}
		}
		return new Crafty.matrix(result);
	},


	e: function (row, col) {
		//test if out of bounds
		if (row < 1 || row > this.mtx.length || col < 1 || col > this.mtx[0].length) return null;
		return this.mtx[row - 1][col - 1];
	}
}
