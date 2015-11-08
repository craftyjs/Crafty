var Crafty = require('../core/core.js'),
    HashMap = require('./spatial-grid.js');



/**@
 * #Crafty.map
 * @category 2D
 * Functions related with querying entities.
 * @see Crafty.HashMap
 */
Crafty.map = new HashMap();
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
 * @trigger Invalidate - when the entity needs to be redrawn
 * @trigger Rotate - when the entity is rotated - { cos:Number, sin:Number, deg:Number, rad:Number, o: {x:Number, y:Number}}
 * @trigger Reorder - when the entity's z index has changed
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
     *
     * `z` is required to be an integer, e.g. `z=11.2` is not allowed.
     * @see ._attr
     */
    _z: 0,
    /**@
     * #.rotation
     * @comp 2D
     * The rotation state of the entity, in clockwise degrees.
     * `this.rotation = 0` sets it to its original orientation; `this.rotation = 10`
     * sets it to 10 degrees clockwise from its original orientation;
     * `this.rotation = -10` sets it to 10 degrees counterclockwise from its
     * original orientation, etc.
     *
     * When modified, will automatically be redrawn. Is actually a getter/setter
     * so when using this value for calculations and not modifying it,
     * use the `._rotation` property.
     *
     * `this.rotation = 0` does the same thing as `this.rotation = 360` or `720` or
     * `-360` or `36000` etc. So you can keep increasing or decreasing the angle for continuous
     * rotation. (Numerical errors do not occur until you get to millions of degrees.)
     *
     * The default is to rotate the entity around its (initial) top-left corner; use
     * `.origin()` to change that.
     *
     * @see ._attr, .origin
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
     */
    _visible: true,

    /**@
     * #._globalZ
     * @comp 2D
     * When two entities overlap, the one with the larger `_globalZ` will be on top of the other.
     */
    _globalZ: null,

    _origin: null,
    _mbr: null,
    _entry: null,
    _children: null,
    _parent: null,
    _changed: false,

    
    // Setup   all the properties that we need to define
    _2D_property_definitions: {
        x: {
            set: function (v) {
                this._attr('_x', v);
            },
            get: function () {
                return this._x;
            },
            configurable: true,
            enumerable: true
        },
        _x: {enumerable:false},

        y: {
            set: function (v) {
                this._attr('_y', v);
            },
            get: function () {
                return this._y;
            },
            configurable: true,
            enumerable: true
        },
        _y: {enumerable:false},

        w: {
            set: function (v) {
                this._attr('_w', v);
            },
            get: function () {
                return this._w;
            },
            configurable: true,
            enumerable: true
        },
        _w: {enumerable:false},

        h: {
            set: function (v) {
                this._attr('_h', v);
            },
            get: function () {
                return this._h;
            },
            configurable: true,
            enumerable: true
        },
        _h: {enumerable:false},

        z: {
            set: function (v) {
                this._attr('_z', v);
            },
            get: function () {
                return this._z;
            },
            configurable: true,
            enumerable: true
        },
        _z: {enumerable:false},

        rotation: {
            set: function (v) {
                this._attr('_rotation', v);
            },
            get: function () {
                return this._rotation;
            },
            configurable: true,
            enumerable: true
        },
        _rotation: {enumerable:false},

        alpha: {
            set: function (v) {
                this._attr('_alpha', v);
            },
            get: function () {
                return this._alpha;
            },
            configurable: true,
            enumerable: true
        },
        _alpha: {enumerable:false},

        visible: {
            set: function (v) {
                this._attr('_visible', v);
            },
            get: function () {
                return this._visible;
            },
            configurable: true,
            enumerable: true
        },
        _visible: {enumerable:false}

    },

    _define2DProperties: function () {
        for (var prop in this._2D_property_definitions){
            Object.defineProperty(this, prop, this._2D_property_definitions[prop]);
        }
    },

    init: function () {
        this._globalZ = this[0];
        this._origin = {
            x: 0,
            y: 0
        };

        // offsets for the basic bounding box
        this._bx1 = 0;
        this._bx2 = 0;
        this._by1 = 0;
        this._by2 = 0;

        this._children = [];

        
        // create setters and getters that associate properties such as x/_x
        this._define2DProperties();
        

        //insert self into the HashMap
        this._entry = Crafty.map.insert(this);

        //when object changes, update HashMap
        this.bind("Move", function (e) {
            // Choose the largest bounding region that exists
            var area = this._cbr || this._mbr || this;
            this._entry.update(area);
            // Move children (if any) by the same amount
            if (this._children.length > 0) {
                this._cascade(e);
            }
        });

        this.bind("Rotate", function (e) {
            // Choose the largest bounding region that exists
            var old = this._cbr || this._mbr || this;
            this._entry.update(old);
            // Rotate children (if any) by the same amount
            if (this._children.length > 0) {
                this._cascade(e);
            }
        });

        //when object is removed, remove from HashMap and destroy attached children
        this.bind("Remove", function () {
            if (this._children) {
                for (var i = 0; i < this._children.length; i++) {
                    // delete the child's _parent link, or else the child will splice itself out of
                    // this._children while destroying itself (which messes up this for-loop iteration).
                    delete this._children[i]._parent;

                    // Destroy child if possible (It's not always possible, e.g. the polygon attached
                    // by areaMap has no .destroy(), it will just get garbage-collected.)
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


    /**@
     * #.offsetBoundary
     * @comp 2D
     * Extends the MBR of the entity by a specified amount.
     * 
     * @trigger BoundaryOffset - when the MBR offset changes
     * @sign public this .offsetBoundary(Number dx1, Number dy1, Number dx2, Number dy2)
     * @param dx1 - Extends the MBR to the left by this amount
     * @param dy1 - Extends the MBR upward by this amount
     * @param dx2 - Extends the MBR to the right by this amount
     * @param dy2 - Extends the MBR downward by this amount
     *
     * @sign public this .offsetBoundary(Number offset)
     * @param offset - Extend the MBR in all directions by this amount
     *
     * You would most likely use this function to ensure that custom canvas rendering beyond the extent of the entity's normal bounds is not clipped.
     */
    offsetBoundary: function(x1, y1, x2, y2){
        if (arguments.length === 1)
            y1 = x2 = y2 = x1;
        this._bx1 = x1;
        this._bx2 = x2;
        this._by1 = y1;
        this._by2 = y2;
        this.trigger("BoundaryOffset");
        this._calculateMBR();
        return this;
    },

    /**
     * Calculates the MBR when rotated some number of radians about an origin point o.
     * Necessary on a rotation, or a resize
     */

    _calculateMBR: function () {
        var ox = this._origin.x + this._x,
            oy = this._origin.y + this._y,
            rad = -this._rotation * DEG_TO_RAD;
        // axis-aligned (unrotated) coordinates, relative to the origin point
        var dx1 = this._x - this._bx1 - ox,
            dx2 = this._x + this._w + this._bx2 - ox,
            dy1 = this._y - this._by1 - oy,
            dy2 = this._y + this._h + this._by2 - oy;

        var ct = Math.cos(rad),
            st = Math.sin(rad);
        // Special case 90 degree rotations to prevent rounding problems
        ct = (ct < 1e-10 && ct > -1e-10) ? 0 : ct;
        st = (st < 1e-10 && st > -1e-10) ? 0 : st;

        // Calculate the new points relative to the origin, then find the new (absolute) bounding coordinates!
        var x0 =   dx1 * ct + dy1 * st,
            y0 = - dx1 * st + dy1 * ct,
            x1 =   dx2 * ct + dy1 * st,
            y1 = - dx2 * st + dy1 * ct,
            x2 =   dx2 * ct + dy2 * st,
            y2 = - dx2 * st + dy2 * ct,
            x3 =   dx1 * ct + dy2 * st,
            y3 = - dx1 * st + dy2 * ct,
            minx = Math.floor(Math.min(x0, x1, x2, x3) + ox),
            miny = Math.floor(Math.min(y0, y1, y2, y3) + oy),
            maxx = Math.ceil(Math.max(x0, x1, x2, x3) + ox),
            maxy = Math.ceil(Math.max(y0, y1, y2, y3) + oy);
        if (!this._mbr) {
            this._mbr = {
                _x: minx,
                _y: miny,
                _w: maxx - minx,
                _h: maxy - miny
            };
        } else {
            this._mbr._x = minx;
            this._mbr._y = miny;
            this._mbr._w = maxx - minx;
            this._mbr._h = maxy - miny;
        }

        // If a collision hitbox exists AND sits outside the entity, find a bounding box for both.
        // `_cbr` contains information about a bounding circle of the hitbox. 
        // The bounds of `_cbr` will be the union of the `_mbr` and the bounding box of that circle.
        // This will not be a minimal region, but since it's only used for the broad phase pass it's good enough. 
        //
        // cbr is calculated by the `_checkBounds` method of the "Collision" component
        if (this._cbr) {
            var cbr = this._cbr;
            var cx = cbr.cx, cy = cbr.cy, r = cbr.r;
            var cx2 = ox + (cx + this._x - ox) * ct + (cy + this._y - oy) * st;
            var cy2 = oy - (cx + this._x - ox) * st + (cy + this._y - oy) * ct;
            cbr._x = Math.min(cx2 - r, minx);
            cbr._y = Math.min(cy2 - r, miny);
            cbr._w = Math.max(cx2 + r, maxx) - cbr._x;
            cbr._h = Math.max(cy2 + r, maxy) - cbr._y;
        }

    },

    /**
     * Handle changes that need to happen on a rotation
     */
    _rotate: function (v) {
        var theta = -1 * (v % 360); //angle always between 0 and 359
        var difference = this._rotation - v;
        // skip if there's no rotation!
        if (difference === 0)
            return;
        else
            this._rotation = v;

        //Calculate the new MBR
        var rad = theta * DEG_TO_RAD,
            o = {
                x: this._origin.x + this._x,
                y: this._origin.y + this._y
            };

        this._calculateMBR();


        //trigger "Rotate" event
        var drad = difference * DEG_TO_RAD,
            // ct = Math.cos(rad),
            // st = Math.sin(rad),
            cos = Math.cos(drad),
            sin = Math.sin(drad);

        this.trigger("Rotate", {
            cos: (-1e-10 < cos && cos < 1e-10) ? 0 : cos, // Special case 90 degree rotations to prevent rounding problems
            sin: (-1e-10 < sin && sin < 1e-10) ? 0 : sin, // Special case 90 degree rotations to prevent rounding problems
            deg: difference,
            rad: drad,
            o: o
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
     * @param rect - An object that must have the `_x, _y, _w, _h` values as properties
     *
     * Determines if this entity intersects a rectangle.  If the entity is rotated, its MBR is used for the test.
     */
    intersect: function (x, y, w, h) {
        var rect, mbr = this._mbr || this;
        if (typeof x === "object") {
            rect = x;
        } else {
            rect = {
                _x: x,
                _y: y,
                _w: w,
                _h: h
            };
        }

        return mbr._x < rect._x + rect._w && mbr._x + mbr._w > rect._x &&
            mbr._y < rect._y + rect._h && mbr._y + mbr._h > rect._y;
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
     * @param rect - An object that must have the `_x, _y, _w, _h` values as properties
     *
     * Determines if this current entity is within another rectangle.
     */
    within: function (x, y, w, h) {
        var rect, mbr = this._mbr || this;
        if (typeof x === "object") {
            rect = x;
        } else {
            rect = {
                _x: x,
                _y: y,
                _w: w,
                _h: h
            };
        }

        return rect._x <= mbr._x && rect._x + rect._w >= mbr._x + mbr._w &&
            rect._y <= mbr._y && rect._y + rect._h >= mbr._y + mbr._h;
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
     * @param rect - An object that must have the `_x, _y, _w, _h` values as properties.
     *
     * Determines if the rectangle is within the current entity.  If the entity is rotated, its MBR is used for the test.
     */
    contains: function (x, y, w, h) {
        var rect, mbr = this._mbr || this;
        if (typeof x === "object") {
            rect = x;
        } else {
            rect = {
                _x: x,
                _y: y,
                _w: w,
                _h: h
            };
        }

        return rect._x >= mbr._x && rect._x + rect._w <= mbr._x + mbr._w &&
            rect._y >= mbr._y && rect._y + rect._h <= mbr._y + mbr._h;
    },

    /**@
     * #.pos
     * @comp 2D
     * @sign public Object .pos([Object pos])
     * @param pos - an object to use as output
     *
     * @returns An object with this entity's `_x`, `_y`, `_w`, and `_h` values. 
     *          If an object is passed in, it will be reused rather than creating a new object.
     *
     * @note The keys have an underscore prefix. This is due to the x, y, w, h
     * properties being setters and getters that wrap the underlying properties with an underscore (_x, _y, _w, _h).
     */
    pos: function (pos) {
        pos = pos || {};
        pos._x = (this._x);
        pos._y = (this._y);
        pos._w = (this._w);
        pos._h = (this._h);
        return pos;
    },

    /**@
     * #.mbr
     * @comp 2D
     * @sign public Object .mbr()
     * Returns the minimum bounding rectangle. If there is no rotation
     * on the entity it will return the rect.
     */
    mbr: function (mbr) {
        mbr = mbr || {};
		if (!this._mbr) {
			return this.pos(mbr);
		} else {
            mbr._x = (this._mbr._x);
            mbr._y = (this._mbr._y);
            mbr._w = (this._mbr._w);
            mbr._h = (this._mbr._h);
            return mbr;
        }
    },

    /**@
     * #.isAt
     * @comp 2D
     * @sign public Boolean .isAt(Number x, Number y)
     * @param x - X position of the point
     * @param y - Y position of the point
     *
     * Determines whether a point is contained by the entity. Unlike other methods,
     * an object can't be passed. The arguments require the x and y value.
     *
     * The given point is tested against the first of the following that exists: a mapArea associated with "Mouse", the hitarea associated with "Collision", or the object's MBR.
     */
    isAt: function (x, y) {
        if (this.mapArea) {
            return this.mapArea.containsPoint(x, y);
        } else if (this.map) {
            return this.map.containsPoint(x, y);
        }
        var mbr = this._mbr || this;
        return mbr._x <= x && mbr._x + mbr._w >= x &&
            mbr._y <= y && mbr._y + mbr._h >= y;
    },

    /**@
     * #.move
     * @comp 2D
     * @sign public this .move(String dir, Number by)
     * @param dir - Direction to move (n,s,e,w,ne,nw,se,sw)
     * @param by - Amount to move in the specified direction
     *
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
     *
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
     * @param e - An object describing the motion
     *
     * Move or rotate the entity's children according to a certain motion.
     * This method is part of a function bound to "Move": It is used
     * internally for ensuring that when a parent moves, the child also
     * moves in the same way.
     */
    _cascade: function (e) {
        if (!e) return; //no change in position
        var i = 0,
            children = this._children,
            l = children.length,
            obj;
        //rotation
        if (("cos" in e) || ("sin" in e)) {
            for (; i < l; ++i) {
                obj = children[i];
                if ('rotate' in obj) obj.rotate(e);
            }
        } else {
            //use current position
            var dx = this._x - e._x,
                dy = this._y - e._y,
                dw = this._w - e._w,
                dh = this._h - e._h;

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
     * @param obj - Child entity(s) to attach
     *
     * Sets one or more entities to be children, with the current entity (`this`)
     * as the parent. When the parent moves or rotates, its children move or
     * rotate by the same amount. (But not vice-versa: If you move a child, it
     * will not move the parent.) When the parent is destroyed, its children are
     * destroyed.
     *
     * For any entity, `this._children` is the array of its children entity
     * objects (if any), and `this._parent` is its parent entity object (if any).
     *
     * As many objects as wanted can be attached, and a hierarchy of objects is
     * possible by attaching.
     */
    attach: function () {
        var i = 0,
            arg = arguments,
            l = arguments.length,
            obj;
        for (; i < l; ++i) {
            obj = arg[i];
            if (obj._parent) {
                obj._parent.detach(obj);
            }
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
     *
     * Stop an entity from following the current entity. Passing no arguments will stop
     * every entity attached.
     */
    detach: function (obj) {
        var i;
        //if nothing passed, remove all attached objects
        if (!obj) {
            for (i = 0; i < this._children.length; i++) {
                this._children[i]._parent = null;
            }
            this._children = [];
            return this;
        }

        //if obj passed, find the handler and unbind
        for (i = 0; i < this._children.length; i++) {
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
     *
     * @sign public this .origin(Number x, Number y)
     * @param x - Pixel value of origin offset on the X axis
     * @param y - Pixel value of origin offset on the Y axis
     *
     * @sign public this .origin(String offset)
     * @param offset - Combination of center, top, bottom, middle, left and right
     *
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
     * @trigger Invalidate - when the entity has flipped
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
        if (!this["_flip" + dir]) {
            this["_flip" + dir] = true;
            this.trigger("Invalidate");
        }
        return this;
    },

    /**@
     * #.unflip
     * @comp 2D
     * @trigger Invalidate - when the entity has unflipped
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
        if (this["_flip" + dir]) {
            this["_flip" + dir] = false;
            this.trigger("Invalidate");
        }
        return this;
    },

    /**
     * Method for rotation rather than through a setter
     */
    rotate: function (e) {
        var x2, y2;
        x2 =  (this._x + this._origin.x - e.o.x) * e.cos + (this._y + this._origin.y - e.o.y) * e.sin + (e.o.x - this._origin.x);
        y2 =  (this._y + this._origin.y - e.o.y) * e.cos - (this._x + this._origin.x - e.o.x) * e.sin + (e.o.y - this._origin.y);
        this._attr('_rotation', this._rotation - e.deg);
        this._attr('_x', x2 );
        this._attr('_y', y2 );
    },

    /**@
     * #._attr
     * @comp 2D
     * Setter method for all 2D properties including
     * x, y, w, h, alpha, rotation and visible.
     */
    _attr: function (name, value) {
        // Return if there is no change
        if (this[name] === value) {
            return;
        }
        //keep a reference of the old positions
        var old = Crafty.rectManager._pool.copy(this);

        var mbr;
        //if rotation, use the rotate method
        if (name === '_rotation') {
            this._rotate(value); // _rotate triggers "Rotate"
            //set the global Z and trigger reorder just in case
        } else if (name === '_z') {
            var intValue = value <<0;
            value = value==intValue ? intValue : intValue+1;
            this._globalZ = value*100000+this[0]; //magic number 10^5 is the max num of entities
            this[name] = value;
            this.trigger("Reorder");
            //if the rect bounds change, update the MBR and trigger move
        } else if (name === '_x' || name === '_y') {
            // mbr is the minimal bounding rectangle of the entity
            mbr = this._mbr;
            if (mbr) {
                mbr[name] -= this[name] - value;
                // cbr is a non-minmal bounding rectangle that contains both hitbox and mbr
                // It will exist only when the collision hitbox sits outside the entity
                if (this._cbr){
                    this._cbr[name] -= this[name] - value;
                }
            }
            this[name] = value;

            this.trigger("Move", old);

        } else if (name === '_h' || name === '_w') {
            mbr = this._mbr;

            var oldValue = this[name];
            this[name] = value;
            if (mbr) {
                this._calculateMBR();
            }
            if (name === '_w') {
                this.trigger("Resize", {
                    axis: 'w',
                    amount: value - oldValue
                });
            } else if (name === '_h') {
                this.trigger("Resize", {
                    axis: 'h',
                    amount: value - oldValue
                });
            }
            this.trigger("Move", old);

        }

        //everything will assume the value
        this[name] = value;

        // flag for redraw
        this.trigger("Invalidate");

        Crafty.rectManager._pool.recycle(old);
    }
});

/**@
 * #Supportable
 * @category 2D
 * @trigger LandedOnGround - When entity has landed. This event is triggered with the object the entity landed on.
 * @trigger LiftedOffGround - When entity has lifted off. This event is triggered with the object the entity stood on before lift-off.
 * @trigger CheckLanding - When entity is about to land. This event is triggered with the object the entity is about to land on. Third parties can respond to this event and prevent the entity from being able to land.
 *
 * Component that detects if the entity collides with the ground. This component is automatically added and managed by the Gravity component.
 * The appropriate events are fired when the entity state changes (lands on ground / lifts off ground). The current ground entity can also be accessed with `.ground`.
 */
Crafty.c("Supportable", {
    /**@
     * #.ground
     * @comp Supportable
     *
     * Access the ground entity (which may be the actual ground entity if it exists, or `null` if it doesn't exist) and thus whether this entity is currently on the ground or not. 
     * The ground entity is also available through the events, when the ground entity changes.
     */
    _ground: null,
    _groundComp: null,

    /**@
     * #.canLand
     * @comp Supportable
     *
     * The canLand boolean determines if the entity is allowed to land or not (e.g. perhaps the entity should not land if it's not falling).
     * The Supportable component will trigger a "CheckLanding" event. 
     * Interested parties can listen to this event and prevent the entity from landing by setting `canLand` to false.
     *
     * @example
     * ~~~
     * var player = Crafty.e("2D, Gravity");
     * player.bind("CheckLanding", function(ground) {
     *     if (player.y + player.h > ground.y + player.dy) { // forbid landing, if player's feet are not above ground
     *         player.canLand = false;
     *     }
     * });
     * ~~~
     */
    canLand: true,

    init: function () {
        this.requires("2D");
        this.__area = {_x: 0, _y: 0, _w: 0, _h: 0};
        this.defineField("ground", function() { return this._ground; }, function(newValue) {});
    },
    remove: function(destroyed) {
        this.unbind("EnterFrame", this._detectGroundTick);
    },

    /*@
     * #.startGroundDetection
     * @comp Supportable
     * @sign private this .startGroundDetection([comp])
     * @param comp - The name of a component that will be treated as ground
     *
     * This method is automatically called by the Gravity component and should not be called by the user.
     *
     * Enable ground detection for this entity no matter whether comp parameter is specified or not.
     * If comp parameter is specified all entities with that component will stop this entity from falling.
     * For a player entity in a platform game this would be a component that is added to all entities
     * that the player should be able to walk on.
     * 
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravity("platform");
     * ~~~
     *
     * @see Gravity
     */
    startGroundDetection: function(ground) {
        if (ground) this._groundComp = ground;
        this.uniqueBind("EnterFrame", this._detectGroundTick);

        return this;
    },
    /*@
     * #.stopGroundDetection
     * @comp Supportable
     * @sign private this .stopGroundDetection()
     *
     * This method is automatically called by the Gravity component and should not be called by the user.
     *
     * Disable ground detection for this component. It can be reenabled by calling .startGroundDetection()
     */
    stopGroundDetection: function() {
        this.unbind("EnterFrame", this._detectGroundTick);

        return this;
    },

    _detectGroundTick: function() {
        var groundComp = this._groundComp,
            ground = this._ground,
            overlap = Crafty.rectManager.overlap;

        var pos = this._cbr || this._mbr || this,
            area = this.__area;
        area._x = pos._x;
        area._y = pos._y + 1; // Increase by 1 to make sure map.search() finds the floor
        area._w = pos._w;
        area._h = pos._h;
        // Decrease width by 1px from left and 1px from right, to fall more gracefully
        // area._x++; area._w--;

        if (ground) {
            var garea = ground._cbr || ground._mbr || ground;
            if (!(ground.__c[groundComp] && overlap(garea, area))) {
                this._ground = null;
                this.trigger("LiftedOffGround", ground); // no collision with ground was detected for first time
                ground = null;
            }
        }

        if (!ground) {
            var obj, oarea,
                results = Crafty.map.search(area, false),
                i = 0,
                l = results.length;

            for (; i < l; ++i) {
                obj = results[i];
                oarea = obj._cbr || obj._mbr || obj;
                // check for an intersection with the player
                if (obj !== this && obj.__c[groundComp] && overlap(oarea, area)) {
                    this.canLand = true;
                    this.trigger("CheckLanding", obj); // is entity allowed to land?
                    if (this.canLand) {
                        this._ground = ground = obj;
                        this.y = obj._y - this._h; // snap entity to ground object
                        this.trigger("LandedOnGround", ground); // collision with ground was detected for first time

                        break;
                    }
                }
            }
        }
    }
});

/**@
 * #GroundAttacher
 * @category 2D
 *
 * Component that attaches the entity to the ground when it lands. Useful for platformers with moving platforms.
 * Remove the component to disable the functionality.
 *
 * @see Supportable, Gravity
 *
 * @example
 * ~~~
 * Crafty.e("2D, Gravity, GroundAttacher")
 *     .gravity("Platform"); // entity will land on and move with entites that have the "Platform" component
 * ~~~
 */
Crafty.c("GroundAttacher", {
    _groundAttach: function(ground) {
        ground.attach(this);
    },
    _groundDetach: function(ground) {
        ground.detach(this);
    },

    init: function () {
        this.requires("Supportable");

        this.bind("LandedOnGround", this._groundAttach);
        this.bind("LiftedOffGround", this._groundDetach);
    },
    remove: function(destroyed) {
        this.unbind("LandedOnGround", this._groundAttach);
        this.unbind("LiftedOffGround", this._groundDetach);
    }
});


/**@
 * #Gravity
 * @category 2D
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * 
 * Adds gravitational pull to the entity.
 *
 * @see Supportable, Motion
 */
Crafty.c("Gravity", {
    _gravityConst: 500,

    init: function () {
        this.requires("2D, Supportable, Motion");

        this.bind("LiftedOffGround", this._startGravity); // start gravity if we are off ground
        this.bind("LandedOnGround", this._stopGravity); // stop gravity once landed
    },
    remove: function(removed) {
        this.unbind("LiftedOffGround", this._startGravity);
        this.unbind("LandedOnGround", this._stopGravity);
    },

    _gravityCheckLanding: function(ground) {
        if (this._dy < 0) 
            this.canLand = false;
    },

    /**@
     * #.gravity
     * @comp Gravity
     * @sign public this .gravity([comp])
     * @param comp - The name of a component that will stop this entity from falling
     *
     * Enable gravity for this entity no matter whether comp parameter is specified or not.
     * If comp parameter is specified all entities with that component will stop this entity from falling.
     * For a player entity in a platform game this would be a component that is added to all entities
     * that the player should be able to walk on.
     * See the Supportable component documentation for additional methods & events that are available.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravity("platform");
     * ~~~
     *
     * @see Supportable, Motion
     */
    gravity: function (comp) {
        this.bind("CheckLanding", this._gravityCheckLanding);
        this.startGroundDetection(comp);
        this._startGravity();

        return this;
    },
    /**@
     * #.antigravity
     * @comp Gravity
     * @sign public this .antigravity()
     * Disable gravity for this component. It can be reenabled by calling .gravity()
     */
    antigravity: function () {
        this._stopGravity();
        this.stopGroundDetection();
        this.unbind("CheckLanding", this._gravityCheckLanding);

        return this;
    },

    /**@
     * #.gravityConst
     * @comp Gravity
     * @sign public this .gravityConst(g)
     * @param g - gravitational constant in pixels per second squared
     *
     * Set the gravitational constant to g for this entity. The default is 500. The greater g, the stronger the downwards acceleration.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravityConst(5)
     *   .gravity("platform");
     * ~~~
     */
    gravityConst: function (g) {
        if (this._gravityActive) { // gravity active, change acceleration
            this.ay -= this._gravityConst;
            this.ay += g;
        }
        this._gravityConst = g;

        return this;
    },
    _startGravity: function() {
        this._gravityActive = true;
        this.ay += this._gravityConst;
    },
    _stopGravity: function() {
        this.ay = 0;
        this.vy = 0;
        this._gravityActive = false;
    }
});

// This is used to define getters and setters for Motion properties
// For instance
//      __motionProp(entity, "a", "x", true) 
// will define a getter for `ax` which accesses an underlying private property `_ax`
// If the `setter` property is false, setting a value will be a null-op
var __motionProp = function(self, prefix, prop, setter) {
    var publicProp = prefix + prop;
    var privateProp = "_" + publicProp;

    var motionEvent = { key: "", oldValue: 0};
    // getters & setters for public property
    if (setter) {
        Crafty.defineField(self, publicProp, function() { return this[privateProp]; }, function(newValue) {
            var oldValue = this[privateProp];
            if (newValue !== oldValue) {
                this[privateProp] = newValue;

                motionEvent.key = publicProp;
                motionEvent.oldValue = oldValue;
                this.trigger("MotionChange", motionEvent);
            }
        });
    } else {
        Crafty.defineField(self, publicProp, function() { return this[privateProp]; }, function(newValue) {});
    }

    // hide private property
    Object.defineProperty(self, privateProp, {
        value : 0,
        writable : true,
        enumerable : false,
        configurable : false
    });
};

// This defines an alias for a pair of underlying properties which represent the components of a vector
// It takes an object with vector methods, and redefines its x/y properties as getters and setters to properties of self
// This allows you to use the vector's special methods to manipulate the entity's properties, 
// while still allowing you to manipulate those properties directly if performance matters
var __motionVector = function(self, prefix, setter, vector) {
    var publicX = prefix + "x",
        publicY = prefix + "y",
        privateX = "_" + publicX,
        privateY = "_" + publicY;

    if (setter) {
        Crafty.defineField(vector, "x", function() { return self[privateX]; }, function(v) { self[publicX] = v; });
        Crafty.defineField(vector, "y", function() { return self[privateY]; }, function(v) { self[publicY] = v; });
    } else {
        Crafty.defineField(vector, "x", function() { return self[privateX]; }, function(v) {});
        Crafty.defineField(vector, "y", function() { return self[privateY]; }, function(v) {});
    }
    if (Object.seal) { Object.seal(vector); }

    return vector;
};

/**@
 * #AngularMotion
 * @category 2D
 * @trigger Rotated - When entity has rotated due to angular velocity/acceleration a Rotated event is triggered. - Number - Old rotation
 * @trigger NewRotationDirection - When entity has changed rotational direction due to rotational velocity a NewRotationDirection event is triggered. The event is triggered once, if direction is different from last frame. - -1 | 0 | 1 - New direction
 * @trigger MotionChange - When a motion property has changed a MotionChange event is triggered. - { key: String, oldValue: Number } - Motion property name and old value
 *
 * Component that allows rotating an entity by applying angular velocity and acceleration.
 * All angular motion values are expressed in degrees per second (e.g. an entity with `vrotation` of 10 will rotate 10 degrees each second).
 */
Crafty.c("AngularMotion", {
    /**@
     * #.vrotation
     * @comp AngularMotion
     * 
     * A property for accessing/modifying the angular(rotational) velocity. 
     * The velocity remains constant over time, unless the acceleration increases the velocity.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, AngularMotion");
     *
     * var vrotation = ent.vrotation; // retrieve the angular velocity
     * ent.vrotation += 1; // increase the angular velocity
     * ent.vrotation = 0; // reset the angular velocity
     * ~~~
     */
    _vrotation: 0,

    /**@
     * #.arotation
     * @comp AngularMotion
     * 
     * A property for accessing/modifying the angular(rotational) acceleration. 
     * The acceleration increases the velocity over time, resulting in ever increasing speed.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, AngularMotion");
     *
     * var arotation = ent.arotation; // retrieve the angular acceleration
     * ent.arotation += 1; // increase the angular acceleration
     * ent.arotation = 0; // reset the angular acceleration
     * ~~~
     */
    _arotation: 0,

    /**@
     * #.drotation
     * @comp AngularMotion
     * 
     * A number that reflects the change in rotation (difference between the old & new rotation) that was applied in the last frame.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, AngularMotion");
     *
     * var drotation = ent.drotation; // the change of rotation in the last frame
     * ~~~
     */
    _drotation: 0,

    init: function () {
        this.requires("2D");

        __motionProp(this, "v", "rotation", true);
        __motionProp(this, "a", "rotation", true);
        __motionProp(this, "d", "rotation", false);

        this.__oldRotationDirection = 0;

        this.bind("EnterFrame", this._angularMotionTick);
    },
    remove: function(destroyed) {
        this.unbind("EnterFrame", this._angularMotionTick);
    },

    /**@
     * #.resetAngularMotion
     * @comp AngularMotion
     * @sign public this .resetAngularMotion()
     * 
     * Reset all motion (resets velocity, acceleration, motionDelta).
     */
    resetAngularMotion: function() {
        this._drotation = 0;
        this.vrotation = 0;
        this.arotation = 0;

        return this;
    },

    /*
     * s += v * Δt + (0.5 * a) * Δt * Δt
     * v += a * Δt
     */
    _angularMotionTick: function(frameData) {
        var dt = frameData.dt / 1000; // Time in s
        var oldR = this._rotation,
            vr = this._vrotation,
            ar = this._arotation;

        // s += v * Δt + (0.5 * a) * Δt * Δt
        var newR = oldR + vr * dt + 0.5 * ar * dt * dt;
        // v += a * Δt
        this.vrotation = vr + ar * dt;

        // Check if direction of velocity has changed
        var _vr = this._vrotation, dvr = _vr ? (_vr<0 ? -1:1):0; // Quick implementation of Math.sign
        if (this.__oldRotationDirection !== dvr) {
            this.__oldRotationDirection = dvr;
            this.trigger('NewRotationDirection', dvr);
        }

        // Check if velocity has changed
        // Δs = s[t] - s[t-1]
        this._drotation = newR - oldR;
        if (this._drotation !== 0) {
            this.rotation = newR;
            this.trigger('Rotated', oldR);
        }
    }
});

/**@
 * #Motion
 * @category 2D
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger MotionChange - When a motion property has changed a MotionChange event is triggered. - { key: String, oldValue: Number } - Motion property name and old value
 *
 * Component that allows moving an entity by applying linear velocity and acceleration.
 * All linear motion values are expressed in pixels per second (e.g. an entity with `vx` of 1 will move 1px on the x axis each second).
 *
 * @note Several methods return Vector2D objects that dynamically reflect the entity's underlying properties.  If you want a static copy instead, use the vector's `clone()` method.
 */
Crafty.c("Motion", {
    /**@
     * #.vx
     * @comp Motion
     * 
     * A property for accessing/modifying the linear velocity in the x axis.
     * The velocity remains constant over time, unless the acceleration changes the velocity.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var vx = ent.vx; // retrieve the linear velocity in the x axis
     * ent.vx += 1; // increase the linear velocity in the x axis
     * ent.vx = 0; // reset the linear velocity in the x axis
     * ~~~
     */
    _vx: 0,

    /**@
     * #.vy
     * @comp Motion
     * 
     * A property for accessing/modifying the linear velocity in the y axis.
     * The velocity remains constant over time, unless the acceleration changes the velocity.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var vy = ent.vy; // retrieve the linear velocity in the y axis
     * ent.vy += 1; // increase the linear velocity in the y axis
     * ent.vy = 0; // reset the linear velocity in the y axis
     * ~~~
     */
    _vy: 0,

    /**@
     * #.ax
     * @comp Motion
     * 
     * A property for accessing/modifying the linear acceleration in the x axis.
     * The acceleration changes the velocity over time.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var ax = ent.ax; // retrieve the linear acceleration in the x axis
     * ent.ax += 1; // increase the linear acceleration in the x axis
     * ent.ax = 0; // reset the linear acceleration in the x axis
     * ~~~
     */
    _ax: 0,

    /**@
     * #.ay
     * @comp Motion
     * 
     * A property for accessing/modifying the linear acceleration in the y axis.
     * The acceleration changes the velocity over time.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var ay = ent.ay; // retrieve the linear acceleration in the y axis
     * ent.ay += 1; // increase the linear acceleration in the y axis
     * ent.ay = 0; // reset the linear acceleration in the y axis
     * ~~~
     */
    _ay: 0,

    /**@
     * #.dx
     * @comp Motion
     * 
     * A number that reflects the change in x (difference between the old & new x) that was applied in the last frame.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var dx = ent.dx; // the change of x in the last frame
     * ~~~
     */
    _dx: 0,

    /**@
     * #.dy
     * @comp Motion
     * 
     * A number that reflects the change in y (difference between the old & new y) that was applied in the last frame.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var dy = ent.dy; // the change of y in the last frame
     * ~~~
     */
    _dy: 0,

    init: function () {
        this.requires("2D");

        __motionProp(this, "v", "x", true);
        __motionProp(this, "v", "y", true);
        this._velocity = __motionVector(this, "v", true, new Crafty.math.Vector2D());
        __motionProp(this, "a", "x", true);
        __motionProp(this, "a", "y", true);
        this._acceleration = __motionVector(this, "a", true, new Crafty.math.Vector2D());
        __motionProp(this, "d", "x", false);
        __motionProp(this, "d", "y", false);
        this._motionDelta = __motionVector(this, "d", false, new Crafty.math.Vector2D());

        this.__movedEvent = {axis: '', oldValue: 0};
        this.__oldDirection = {x: 0, y: 0};

        this.bind("EnterFrame", this._linearMotionTick);
    },
    remove: function(destroyed) {
        this.unbind("EnterFrame", this._linearMotionTick);
    },

    /**@
     * #.resetMotion
     * @comp Motion
     * @sign public this .resetMotion()
     * @return this
     * 
     * Reset all linear motion (resets velocity, acceleration, motionDelta).
     */
    resetMotion: function() {
        this.vx = 0; this.vy = 0;
        this.ax = 0; this.ay = 0;
        this._dx = 0; this._dy = 0;

        return this;
    },

    /**@
     * #.motionDelta
     * @comp Motion
     * @sign public Vector2D .motionDelta()
     * @return A Vector2D with the properties {x, y} that reflect the change in x & y.
     * 
     * Returns the difference between the old & new position that was applied in the last frame.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var deltaY = ent.motionDelta().y; // the change of y in the last frame
     * ~~~
     * @see Crafty.math.Vector2D
     */
    motionDelta: function() {
        return this._motionDelta;
    },

    /**@
     * #.velocity
     * @comp Motion
     * Method for accessing/modifying the linear(x,y) velocity. 
     * The velocity remains constant over time, unless the acceleration increases the velocity.
     *
     * @sign public Vector2D .velocity()
     * @return The velocity Vector2D with the properties {x, y} that reflect the velocities in the <x, y> direction of the entity.
     *
     * Returns the current velocity. You can access/modify the properties in order to retrieve/change the velocity.

     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var vel = ent.velocity(); //returns the velocity vector
     * vel.x;       // retrieve the velocity in the x direction
     * vel.x = 0;   // set the velocity in the x direction
     * vel.x += 4   // add to the velocity in the x direction
     * ~~~
     * @see Crafty.math.Vector2D
     */
    velocity: function() {
        return this._velocity;
    },


    /**@
     * #.acceleration
     * @comp Motion
     * Method for accessing/modifying the linear(x,y) acceleration. 
     * The acceleration increases the velocity over time, resulting in ever increasing speed.
     * 
     * @sign public Vector2D .acceleration()
     * @return The acceleration Vector2D with the properties {x, y} that reflects the acceleration in the <x, y> direction of the entity.
     *
     * Returns the current acceleration. You can access/modify the properties in order to retrieve/change the acceleration.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D, Motion");
     *
     * var acc = ent.acceleration(); //returns the acceleration object
     * acc.x;       // retrieve the acceleration in the x direction
     * acc.x = 0;   // set the acceleration in the x direction
     * acc.x += 4   // add to the acceleration in the x direction
     * ~~~
     * @see Crafty.math.Vector2D
     */
    acceleration: function() {
        return this._acceleration;
    },

    /*
     * s += v * Δt + (0.5 * a) * Δt * Δt
     * v += a * Δt
     */
    _linearMotionTick: function(frameData) {
        var dt = frameData.dt / 1000; // time in s
        var oldX = this._x, vx = this._vx, ax = this._ax,
            oldY = this._y, vy = this._vy, ay = this._ay;

        // s += v * Δt + (0.5 * a) * Δt * Δt
        var newX = oldX + vx * dt + 0.5 * ax * dt * dt;
        var newY = oldY + vy * dt + 0.5 * ay * dt * dt;
        // v += a * Δt
        this.vx = vx + ax * dt;
        this.vy = vy + ay * dt;

        // Check if direction of velocity has changed
        var oldDirection = this.__oldDirection,
            _vx = this._vx, dvx = _vx ? (_vx<0 ? -1:1):0, // A quick implementation of Math.sign
            _vy = this._vy, dvy = _vy ? (_vy<0 ? -1:1):0;
        if (oldDirection.x !== dvx || oldDirection.y !== dvy) {
            oldDirection.x = dvx;
            oldDirection.y = dvy;
            this.trigger('NewDirection', oldDirection);
        }

        // Check if velocity has changed
        var movedEvent = this.__movedEvent;
        // Δs = s[t] - s[t-1]
        this._dx = newX - oldX;
        this._dy = newY - oldY;
        if (this._dx !== 0) {
            this.x = newX;
            movedEvent.axis = 'x';
            movedEvent.oldValue = oldX;
            this.trigger('Moved', movedEvent);
        }
        if (this._dy !== 0) {
            this.y = newY;
            movedEvent.axis = 'y';
            movedEvent.oldValue = oldY;
            this.trigger('Moved', movedEvent);
        }
    }
});

/**@
 * #Crafty.polygon
 * @category 2D
 *
 * The constructor for a polygon object used for hitboxes and click maps. Takes a set of points as an
 * argument, giving alternately the x and y coordinates of the polygon's vertices in order.
 *
 * The constructor accepts the coordinates as either a single array or as a set of individual arguments.
 * If passed an array, the current implementation will use that array internally -- do not attempt to reuse it.
 *
 * When creating a polygon for an entity, each point should be offset or relative from the entities `x` and `y`
 * (don't include the absolute values as it will automatically calculate this).
 *
 *
 * @example
 * Two ways to create a triangle with vertices at `(50, 0)`, `(100, 100)` and `(0, 100)`.
 * ~~~
 * new Crafty.polygon([50, 0, 100, 100, 0, 100]);
 * new Crafty.polygon(50, 0, 100, 100, 0, 100);
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
     * var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
     * poly.containsPoint(50, 50); //TRUE
     * poly.containsPoint(0, 0); //FALSE
     * ~~~
     */
    containsPoint: function (x, y) {
        var p = this.points, l = p.length/2,
            i, j, c = false;

        for (i = 0, j = l - 1; i < l; j = i++) {
            if (((p[2*i+1] > y) != (p[2*j+1] > y)) && (x < (p[2*j] - p[2*i]) * (y - p[2*i+1]) / (p[2*j+1] - p[2*i+1]) + p[2*i])) {
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
     * var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
     * poly.shift(5,5);
     * //[[55, 5, 105, 5, 5, 105];
     * ~~~
     */
    shift: function (x, y) {
        var i = 0, p =this.points,
            l = p.length;
        for (; i < l; i+=2) {
            p[i] += x;
            p[i+1] += y;
        }
    },

    /**@
     * #.clone
     * @comp Crafty.polygon
     * @sign public void .clone()
     * 
     * Returns a clone of the polygon.
     *
     * @example
     * ~~~
     * var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
     * var shiftedpoly = poly.clone().shift(5,5);
     * //[55, 5, 105, 5, 5, 105], but the original polygon is unchanged
     * ~~~
     */
    clone: function() {
        //Shallow clone, but points should be full of Number primitives that are copied
        return new Crafty.polygon(this.points.slice(0));
    },

    rotate: function (e) {
        var i = 0, p = this.points,
            l = p.length,
            x, y;

        for (; i < l; i+=2) {

            x = e.o.x + (p[i] - e.o.x) * e.cos + (p[i+1] - e.o.y) * e.sin;
            y = e.o.y - (p[i] - e.o.x) * e.sin + (p[i+1] - e.o.y) * e.cos;

            p[i] = x;
            p[i+1] = y;
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

    for (var i = 0; i < 16; i+=2) {
        theta = i * Math.PI / 8;
        this.points[i] = this.x + (Math.sin(theta) * radius);
        this.points[i+1] = this.y + (Math.cos(theta) * radius);
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
     * var circle = new Crafty.circle(0, 0, 10);
     * circle.shift(5,5);
     * //{x: 5, y: 5, radius: 10};
     * ~~~
     */
    shift: function (x, y) {
        this.x += x;
        this.y += y;

        var i = 0, p = this.points,
            l = p.length,
            current;
        for (; i < l; i+=2) {
            p[i] += x;
            p[i+1] += y;
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
};
