var Crafty = require('../core/core.js');

var M = Math,
    //Mc = M.cos,
    //Ms = M.sin,
    PI = M.PI,
    DEG_TO_RAD = PI / 180;

/**@
 * #2D
 * @category 2D
 * @kind Component
 * 
 * Component for any entity that has a position on the stage.
 * @trigger Move - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
 * @trigger Invalidate - when the entity needs to be redrawn
 * @trigger Rotate - when the entity is rotated - { rotation:Number} - Rotation in degrees
 * @trigger Reorder - when the entity's z index has changed
 * @trigger Resize - when the entity's dimensions have changed - { axis: 'w' | 'h', amount: Number }
 */
Crafty.c("2D", {
    /**@
     * #.x
     * @comp 2D
     * @kind Property
     * 
     * The `x` position on the stage. When modified, will automatically be redrawn.
     * Is actually a getter/setter so when using this value for calculations and not modifying it,
     * use the `._x` property.
     * @see ._setter2d
     */
    _x: 0,
    /**@
     * #.y
     * @kind Property
     * 
     * @comp 2D
     * The `y` position on the stage. When modified, will automatically be redrawn.
     * Is actually a getter/setter so when using this value for calculations and not modifying it,
     * use the `._y` property.
     * @see ._setter2d
     */
    _y: 0,
    /**@
     * #.w
     * @comp 2D
     * @kind Property
     * 
     * The width of the entity. When modified, will automatically be redrawn.
     * Is actually a getter/setter so when using this value for calculations and not modifying it,
     * use the `._w` property.
     *
     * Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
     * @see ._setter2d
     */
    _w: 0,
    /**@
     * #.h
     * @comp 2D
     * @kind Property
     * 
     * The height of the entity. When modified, will automatically be redrawn.
     * Is actually a getter/setter so when using this value for calculations and not modifying it,
     * use the `._h` property.
     *
     * Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
     * @see ._setter2d
     */
    _h: 0,

    /**@
     * #.z
     * @comp 2D
     * @kind Property
     * 
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
     * #._globalZ
     * @comp 2D
     * @kind Property
     * 
     * When two entities overlap, the one with the larger `_globalZ` will be on top of the other.
     */
    _globalZ: null,

    /**@
     * #.rotation
     * @comp 2D
     * @kind Property
     * 
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
     * @see ._setter2d, .origin
     */
    _rotation: 0,

    _origin: null,
    _mbr: null,
    _entry: null,
    _children: null,
    _parent: null,

    // Setup all the properties that we need to define
    properties: {
        x: {
            set: function (v) {
                this._setter2d('_x', v);
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
                this._setter2d('_y', v);
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
                this._setter2d('_w', v);
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
                this._setter2d('_h', v);
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
                this._setter2d('_z', v);
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
                this._setter2d('_rotation', v);
            },
            get: function () {
                return this._rotation;
            },
            configurable: true,
            enumerable: true
        },
        _rotation: {enumerable:false},
        
        /**@
         * #.ox
         * @comp 2D
         * @kind Property
         * 
         * The `x` position on the stage of the origin. When modified, will set the underlying `x` value of the entity.
         * 
         * @see .origin
         */
        ox: {
            set: function (v) {
                var x = v - this._origin.x;
                this._setter2d('_x', x);
            },
            get: function () {
                return this._x + this._origin.x;
            },
            configurable: true,
            enumerable: true
        },

        /**@
         * #.oy
         * @comp 2D
         * @kind Property
         * 
         * The `y` position on the stage of the origin. When modified, will set the underlying `y` value of the entity.
         * 
         * @see .origin
         */
        oy: {
            set: function (v) {
                var y = v - this._origin.y;
                this._setter2d('_y', y);
            },
            get: function () {
                return this._y + this._origin.y;
            },
            configurable: true,
            enumerable: true
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
                this._cascadeRotation(e);
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

            Crafty.map.remove(this._entry);

            this.detach();
        });
    },

    events: {
        "Freeze":function(){
            Crafty.map.remove(this._entry);
        },
        "Unfreeze":function(){
            this._entry = Crafty.map.insert(this, this._entry);
        }
    }, 

    /**@
     * #.offsetBoundary
     * @comp 2D
     * @kind Method
     * 
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
        //var theta = -1 * (v % 360); //angle always between 0 and 359
        var difference = this._rotation - v;
        // skip if there's no rotation!
        if (difference === 0)
            return;
        else
            this._rotation = v;

        this._calculateMBR();

        this.trigger("Rotate", difference);
    },

    /**@
     * #.area
     * @comp 2D
     * @kind Method
     * 
     * @sign public Number .area(void)
     * Calculates the area of the entity
     */
    area: function () {
        return this._w * this._h;
    },

    /**@
     * #.intersect
     * @comp 2D
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
     * @sign public Object .pos([Object pos])
     * @param pos - an object to use as output
     * @returns an object with `_x`, `_y`, `_w`, and `_h` properties; if an object is passed in, it will be reused rather than creating a new object.
     *
     * Return an object containing a copy of this entity's bounds (`_x`, `_y`, `_w`, and `_h` values).
     *
     * @note The keys have an underscore prefix. This is due to the x, y, w, h properties
     * being setters and getters that wrap the underlying properties with an underscore (_x, _y, _w, _h).
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
     * @kind Method
     * 
     * @sign public Object .mbr([Object mbr])
     * @param mbr - an object to use as output
     * @returns an object with `_x`, `_y`, `_w`, and `_h` properties; if an object is passed in, it will be reused rather than creating a new object.
     *
     * Return an object containing a copy of this entity's minimum bounding rectangle.
     * The MBR encompasses a rotated entity's bounds.
     * If there is no rotation on the entity it will return its bounds (`.pos()`) instead.
     *
     * @note The keys have an underscore prefix. This is due to the x, y, w, h properties
     * being setters and getters that wrap the underlying properties with an underscore (_x, _y, _w, _h).
     *
     * @see .pos
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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
        if (x || y) this._setPosition(this._x + x, this._y + y);
        if (w) this.w += w;
        if (h) this.h += h;

        return this;
    },

    /**@
     * #._cascade
     * @comp 2D
     * @kind Method
     * @private
     * 
     * @sign public void ._cascade(e)
     * @param e - An object describing the motion
     *
     * Move the entity's children according to a certain motion.
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

        //use current position
        var dx = this._x - e._x,
            dy = this._y - e._y,
            dw = this._w - e._w,
            dh = this._h - e._h;

        for (; i < l; ++i) {
            obj = children[i];
            if (obj.__frozen) continue;
            obj.shift(dx, dy, dw, dh);
        }
        
    },
    
    /**@
     * #._cascadeRotation
     * @comp 2D
     * @kind Method
     * @private
     * 
     * @sign public void ._cascade(deg)
     * @param deg - The amount of rotation in degrees
     *
     * Move the entity's children the specified amount
     * This method is part of a function bound to "Move": It is used
     * internally for ensuring that when a parent moves, the child also
     * moves in the same way.
     */
    _cascadeRotation: function(deg) {
        if (!deg) return;
        var i = 0,
            children = this._children,
            l = children.length,
            obj;
        // precalculate rotation info
        var drad = deg * DEG_TO_RAD;
        var cos = Math.cos(drad);
        var sin = Math.sin(drad);
        // Avoid some rounding problems
        cos = (-1e-10 < cos && cos < 1e-10) ? 0 : cos;
        sin = (-1e-10 < sin && sin < 1e-10) ? 0 : sin;
        var ox = this._origin.x + this._x;
        var oy = this._origin.y + this._y;

        for (; i < l; ++i) {
            obj = children[i];
            if (obj.__frozen) continue;
            if ('rotate' in obj) obj.rotate(deg, ox, oy, cos, sin);
        }
    },

    /**@
     * #.attach
     * @comp 2D
     * @kind Method
     * 
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
     * @kind Method
     * 
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
            if (this._children[i] === obj) {
                this._children.splice(i, 1);
            }
        }
        obj._parent = null;

        return this;
    },

    /**@
     * #.origin
     * @comp 2D
     * @kind Method
     * 
     * @sign public this .origin(Number x, Number y)
     * @param x - Pixel value of origin offset on the X axis
     * @param y - Pixel value of origin offset on the Y axis
     *
     * @sign public this .origin(String offset)
     * @param offset - Alignment identifier, which is a combination of center, top, bottom, middle, left and right
     *
     * Set the origin point of an entity for it to rotate around.
     * 
     * The properties `ox` and `oy` map to the coordinates of the origin on the stage; setting them moves the entity.
     * In contrast, this method sets the origin relative to the entity itself.
     *
     * @triggers OriginChanged -- after the new origin is assigned
     * 
     * @example
     * ~~~
     * this.origin("top left")
     * this.origin("center")
     * this.origin("bottom right")
     * this.origin("middle right")
     * ~~~
     *
     * The origin should be set before changing the `rotation`,
     * since it does not apply retroactively.
     * Additionally, setting the origin via an alignment identifier works only
     * after the entity's dimensions have been set.
     * These points are shown in the following example:
     *
     * @example
     * ~~~
     * Crafty.e("2D")
     *       .attr({w: 100, h: 100})
     *       .origin('center')
     *       .attr({x: 25, y: 25, rotation: 180});
     * ~~~
     *
     * @see .rotation, .ox, .oy
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
        this.trigger("OriginChanged");
        return this;
    },

    /**
     * Method for rotation rather than through a setter
     * 
     * Pass in degree amount, origin coordinate and precalculated cos/sin
     */
    rotate: function (deg, ox, oy, cos, sin) {
        var x2, y2;
        x2 =  (this._x + this._origin.x - ox) * cos + (this._y + this._origin.y - oy) * sin + (ox - this._origin.x);
        y2 =  (this._y + this._origin.y - oy) * cos - (this._x + this._origin.x - ox) * sin + (oy - this._origin.y);
        this._setter2d('_rotation', this._rotation - deg);
        this._setter2d('_x', x2 );
        this._setter2d('_y', y2 );
    },

    // A separate setter for the common case of moving an entity along both axes
    _setPosition: function(x, y) {
        if (x === this._x && y === this._y) return;
        var old = Crafty.rectManager._pool.copy(this);
        var mbr = this._mbr;
        if (mbr) {
            mbr._x -= this._x - x;
            mbr._y -= this._y - y;
            // cbr is a non-minimal bounding rectangle that contains both hitbox and mbr
            // It will exist only when the collision hitbox sits outside the entity
            if (this._cbr){
                this._cbr._x -= this._x - x;
                this._cbr._y -= this._y - y;
            }
        }
        this._x = x;
        this._y = y;
        this.trigger("Move", old);
        this.trigger("Invalidate");
        Crafty.rectManager._pool.recycle(old);
    },

    // This is a setter method for all 2D properties including
    // x, y, w, h, and rotation.
    _setter2d: function (name, value) {
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
        } else if (name === '_x' || name === '_y') {
            // mbr is the minimal bounding rectangle of the entity
            mbr = this._mbr;
            if (mbr) {
                mbr[name] -= this[name] - value;
                // cbr is a non-minimal bounding rectangle that contains both hitbox and mbr
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

        } else if (name === '_z') {
            var intValue = value << 0;
            value = value === intValue ? intValue : intValue+1;
            this._globalZ = value * 100000 + this[0]; //magic number 10^5 is the max num of entities
            this[name] = value;
            this.trigger("Reorder");
        }

        //everything will assume the value
        this[name] = value;

        // flag for redraw
        this.trigger("Invalidate");

        Crafty.rectManager._pool.recycle(old);
    }
});




/**@
 * #Crafty.polygon
 * @category 2D
 * @kind Class
 *
 * The constructor for a polygon object used for hitboxes and click maps. Takes a set of points as an
 * argument, giving alternately the x and y coordinates of the polygon's vertices in order.
 *
 * For a polygon of `n` edges exactly `n` vertex coordinate pairs should be passed to the constructor.
 * It is advised to pass the vertices in a clockwise order.
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
     * @kind Method
     * 
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
            if (((p[2*i+1] > y) !== (p[2*j+1] > y)) && (x < (p[2*j] - p[2*i]) * (y - p[2*i+1]) / (p[2*j+1] - p[2*i+1]) + p[2*i])) {
                c = !c;
            }
        }

        return c;
    },

    /**@
     * #.shift
     * @comp Crafty.polygon
     * @kind Method
     * 
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
     * @kind Method
     * 
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

    rotate: function (deg, ox, oy, cos, sin) {
        var i = 0, p = this.points,
            l = p.length,
            x, y;

        for (; i < l; i+=2) {

            x = ox + (p[i] - ox) * cos + (p[i+1] - oy) * sin;
            y = oy - (p[i] - ox) * sin + (p[i+1] - oy) * cos;

            p[i] = x;
            p[i+1] = y;
        }
    },

    /**@
     * #.intersectRay
     * @comp Crafty.polygon
     * @kind Method
     * 
     * @sign public Number .intersectRay(Object origin, Object direction)
     * @param origin - the point of origin from which the ray will be cast. The object must contain the properties `_x` and `_y`.
     * @param direction - the direction the ray will be cast. It must be normalized. The object must contain the properties `x` and `y`.
     * @returns a Number indicating the distance from the ray's origin to the closest intersection point of the polygon.
     *          Returns `Infinity` if there is no intersection.
     *
     * Find the distance to the closest intersection point of the supplied ray with any of this polygon's segments.
     *
     * @example
     * ~~~
     * var poly = new Crafty.polygon([0,0, 50,0, 50,50, 0,50]);
     *
     * var origin = {_x: -1, _y: 25};
     * var direction = new Crafty.math.Vector2D(1, 0).normalize();;
     *
     * var distance = poly.intersectRay(origin, direction);
     * Crafty.log('Distance from origin to closest intersection point', distance); // logs '1'
     * ~~~
     */

    // Note that for the algorithm to work, the points of the polygon have to be defined
    // either clock-wise or counter-clock-wise
    //
    // Segment-segment intersection is described here: http://stackoverflow.com/a/565282/3041008
    // see dot projection: http://www.wildbunny.co.uk/blog/vector-maths-a-primer-for-games-programmers/vector/#Projection
    //
    // origin = {_x, _y}
    // direction = {x, y}, must be normalized
    // edge = end - start (of segment)
    //
    //
    // # Segment - segment intersection equation
    // origin + d * direction = start + e * edge
    //
    // ## Solving for d
    // (origin + d * direction) x edge = (start + e * edge) x edge
    // edge x edge == 0
    // d = (start − origin) × edge / (direction × edge)
    // d_nominator = (start - origin) x edge =
    //      (start.x - origin.x, start.y - origin.y) x (edge.x, edge.y) =
    //      (start.x - origin.x) * edge.y - (start.y - origin.y) * edge.x
    // d_denominator = direction x edge =
    //      (direction.x, direction.y) x (edge.x, edge.y) =
    //      direction.x * edge.y - direction.y * edge.x
    //
    // ## Solving for e
    // (origin + d * direction) x direction = (start + e * edge) x direction
    // direction x direction == 0
    // edge factor must be in interval [0, 1]
    // e = (start − origin) × direction / (direction × edge)
    // e_nominator = (start − origin) × direction =
    //      (start.x - origin.x) * direction.y - (start.y - origin.y) * direction.x
    // e_denominator = d_denominator
    //
    //
    // # If segments are colinear (both nominator and denominator == 0),
    //    then minDistance is min(d0, d1) >= 0,
    //    get d0, d1 by doing dot projection onto normalized direction vector
    //
    // origin + d0*direction = start
    // d0*direction = (start - origin)
    // -> d0 = (start - origin) • direction =
    //      (start.x - origin.x, start.y - origin.y) • (direction.x, direction.y) =
    //      (start.x - origin.x) * direction.x + (start.y - origin.y) * direction.y
    //
    // origin + d1*direction = end
    // d1*direction = end - origin
    // -> d1 = (end - origin) • direction =
    //      (end.x - origin.x, end.y - origin.y) • (direction.x, direction.y) =
    //      (end.x - origin.x) * direction.x + (end.y - origin.y) * direction.y
    intersectRay: function (origin, direction) {
        var points = this.points,
            minDistance = Infinity;
        var d, d_nom,
            e, e_nom,
            denom;

        var originX = origin._x, directionX = direction.x,
            originY = origin._y, directionY = direction.y;

        var i = 0, l = points.length;
        var startX = points[l - 2], endX, edgeX,
            startY = points[l - 1], endY, edgeY;
        for (; i < l; i += 2) {
            endX = points[i];
            endY = points[i+1];
            edgeX = endX - startX;
            edgeY = endY - startY;

            d_nom = (startX - originX) * edgeY      - (startY - originY) * edgeX;
            e_nom = (startX - originX) * directionY - (startY - originY) * directionX;
            denom = directionX * edgeY - directionY * edgeX;

            if (denom !== 0) {
                d = d_nom / denom;
                e = e_nom / denom;

                if (e >= 0 && e <= 1 && d >= 0 && d < minDistance)
                    minDistance = d;

            } else if (d_nom === 0 || e_nom === 0) {

                d = (startX - originX) * directionX + (startY - originY) * directionY;
                if (d >= 0 && d < minDistance)
                    minDistance = d;

                d = (endX - originX) * directionX + (endY - originY) * directionY;
                if (d >= 0 && d < minDistance)
                    minDistance = d;
            }

            startX = endX;
            startY = endY;
        }

        return minDistance;
    }
};

/**@
 * #Crafty.circle
 * @category 2D
 * @kind Class
 * 
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
     * @kind Method
     * 
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
            deltaX = this.x - x,
            deltaY = this.y - y;

        return (deltaX * deltaX + deltaY * deltaY) < (radius * radius);
    },

    /**@
     * #.shift
     * @comp Crafty.circle
     * @kind Method
     * 
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
            l = p.length;
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
        if (this.width !== other.height) {
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
