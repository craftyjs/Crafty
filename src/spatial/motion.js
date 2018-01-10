var Crafty = require('../core/core.js');



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
 * @kind Component
 * 
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
     * @kind Property
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
     * @kind Property
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
     * @kind Property
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

        this.bind("UpdateFrame", this._angularMotionTick);
    },
    remove: function(destroyed) {
        this.unbind("UpdateFrame", this._angularMotionTick);
    },

    /**@
     * #.resetAngularMotion
     * @comp AngularMotion
     * @kind Method
     * 
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
 * @kind Component
 * 
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
     * @kind Property
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
     * @kind Property
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
     * @kind Property
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
     * @kind Property
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
     * @kind Property
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
     * @kind Property
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

        this.__oldDirection = {x: 0, y: 0};

        this.bind("UpdateFrame", this._linearMotionTick);
    },
    remove: function(destroyed) {
        this.unbind("UpdateFrame", this._linearMotionTick);
    },

    /**@
     * #.resetMotion
     * @comp Motion
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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

    /**@
     * #.ccdbr
     * @comp Motion
     * @kind Method
     * 
     * @sign public Object .ccdbr([Object ccdbr])
     * @param ccdbr - an object to use as output
     * @returns an object with `_x`, `_y`, `_w`, and `_h` properties; if an object is passed in, it will be reused rather than creating a new object.
     *
     * Return an object containing the entity's continuous collision detection bounding rectangle.
     * The CCDBR encompasses the motion delta of the entity's bounding rectangle since last frame.
     * The CCDBR is minimal if the entity moved on only one axis since last frame, however it encompasses a non-minimal region if it moved on both axis.
     * For further details, refer to [FAQ#Tunneling](https://github.com/craftyjs/Crafty/wiki/Crafty-FAQ-%28draft%29#why-are-my-bullets-passing-through-other-entities-without-registering-hits).
     *
     * @note The keys have an underscore prefix. This is due to the x, y, w, h properties
     * being setters and getters that wrap the underlying properties with an underscore (_x, _y, _w, _h).
     *
     * @see .motionDelta, Collision#.cbr
     */
    ccdbr: function (ccdbr) {
        var pos = this._cbr || this._mbr || this,
            dx = this._dx,
            dy = this._dy,
            ccdX = 0, ccdY = 0,
            ccdW = dx > 0 ? (ccdX = dx) : -dx,
            ccdH = dy > 0 ? (ccdY = dy) : -dy;

        ccdbr = ccdbr || {};
        ccdbr._x = pos._x - ccdX;
        ccdbr._y = pos._y - ccdY;
        ccdbr._w = pos._w + ccdW;
        ccdbr._h = pos._h + ccdH;

        return ccdbr;
    },

    /*
     * s += v * Δt + (0.5 * a) * Δt * Δt
     * v += a * Δt
     */
    _linearMotionTick: function(frameData) {
        var dt = frameData.dt / 1000; // time in s
        var vx = this._vx, ax = this._ax,
            vy = this._vy, ay = this._ay;

        // s += v * Δt + (0.5 * a) * Δt * Δt
        var dx = vx * dt + 0.5 * ax * dt * dt;
        var dy = vy * dt + 0.5 * ay * dt * dt;
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

        this._dx = dx;
        this._dy = dy;

        // Set the position using the optimized _setPosition method
        this._setPosition(this._x + dx, this._y + dy);
    }
});
