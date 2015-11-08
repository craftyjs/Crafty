var Crafty = require('../core/core.js');

/**@
 * #Draggable
 * @category Controls
 * Enable drag and drop of the entity. Listens to events from `MouseDrag` and moves entity accordingly.
 *
 * @see MouseDrag
 */
Crafty.c("Draggable", {
    _origX: null,
    _origY: null,
    _oldX: null,
    _oldY: null,
    _dir: null,

    init: function () {
        this.requires("MouseDrag");
        this.bind("StartDrag", this._startDrag)
            .bind("Dragging", this._drag);
    },

    remove: function() {
        this.unbind("StartDrag", this._startDrag)
            .unbind("Dragging", this._drag);
    },

    /**@
     * #.enableDrag
     * @comp Draggable
     * @sign public this .enableDrag(void)
     *
     * Reenable dragging of entity. Use if `.disableDrag` has been called.
     *
     * @see .disableDrag
     */
    enableDrag: function () {
        this.uniqueBind("Dragging", this._drag);
        return this;
    },

    /**@
     * #.disableDrag
     * @comp Draggable
     * @sign public this .disableDrag(void)
     *
     * Disables entity dragging. Reenable with `.enableDrag()`.
     *
     * @see .enableDrag
     */
    disableDrag: function () {
        this.unbind("Dragging", this._drag);
        return this;
    },

    /**@
     * #.dragDirection
     * @comp Draggable
     * Method used for modifying the drag direction.
     * If direction is set, the entity being dragged will only move along the specified direction.
     * If direction is not set, the entity being dragged will move along any direction.
     *
     * @sign public this .dragDirection()
     * Remove any previously specified direction.
     *
     * @sign public this .dragDirection(vector)
     * @param vector - Of the form of {x: valx, y: valy}, the vector (valx, valy) denotes the move direction.
     *
     * @sign public this .dragDirection(degree)
     * @param degree - A number, the degree (clockwise) of the move direction with respect to the x axis.
     *
     * Specify the dragging direction.
     *
     * @example
     * ~~~
     * this.dragDirection()
     * this.dragDirection({x:1, y:0}) //Horizontal
     * this.dragDirection({x:0, y:1}) //Vertical
     * // Note: because of the orientation of x and y axis,
     * // this is 45 degree clockwise with respect to the x axis.
     * this.dragDirection({x:1, y:1}) //45 degree.
     * this.dragDirection(60) //60 degree.
     * ~~~
     */
    dragDirection: function (dir) {
        if (typeof dir === 'undefined') {
            this._dir = null;
        } else if (("" + parseInt(dir, 10)) == dir) { //dir is a number
            this._dir = {
                x: Math.cos(dir / 180 * Math.PI),
                y: Math.sin(dir / 180 * Math.PI)
            };
        } else {
            if (dir.x === 0 && dir.y === 0) {
                this._dir = { x: 0, y: 0 };
            } else {
                var r = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                this._dir = {
                    x: dir.x / r,
                    y: dir.y / r
                };
            }
        }
        return this;
    },

    _startDrag: function (e) {
        this._origX = e.realX;
        this._origY = e.realY;
        this._oldX = this._x;
        this._oldY = this._y;
    },

    _drag: function(e) {
        if (this._dir) {
            if (this._dir.x !== 0 || this._dir.y !== 0) {
                var len = (e.realX - this._origX) * this._dir.x + (e.realY - this._origY) * this._dir.y;
                this.x = this._oldX + len * this._dir.x;
                this.y = this._oldY + len * this._dir.y;
            }
        } else {
            this.x = this._oldX + (e.realX - this._origX);
            this.y = this._oldY + (e.realY - this._origY);
        }
    }
});

/**@
 * #Multiway
 * @category Controls
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 *
 * Used to bind keys to directions and have the entity move accordingly.
 *
 * @see Motion, Keyboard
 */
Crafty.c("Multiway", {
    _speed: null,
    
    init: function () {
        this.requires("Motion, Keyboard");

        this._keyDirection = {}; // keyCode -> direction
        this._activeDirections = {}; // direction -> # of keys pressed for that direction
        this._directionSpeed = {}; // direction -> {x: x_speed, y: y_speed}
        this._speed = { x: 150, y: 150 };

        this.bind("KeyDown", this._keydown)
            .bind("KeyUp", this._keyup);
    },

    remove: function() {
        this.unbind("KeyDown", this._keydown)
            .unbind("KeyUp", this._keyup);

        // unapply movement of pressed keys
        this.__unapplyActiveDirections();
    },

    _keydown: function (e) {
        var direction = this._keyDirection[e.key];
        if (direction !== undefined) { // if this is a key we are interested in
            if (this._activeDirections[direction] === 0 && !this.disableControls) { // if key is first one pressed for this direction
                this.vx += this._directionSpeed[direction].x;
                this.vy += this._directionSpeed[direction].y;
            }
            this._activeDirections[direction]++;
        }
    },

    _keyup: function (e) {
        var direction = this._keyDirection[e.key];
        if (direction !== undefined) { // if this is a key we are interested in
            this._activeDirections[direction]--;
            if (this._activeDirections[direction] === 0 && !this.disableControls) { // if key is last one unpressed for this direction
                this.vx -= this._directionSpeed[direction].x;
                this.vy -= this._directionSpeed[direction].y;
            }
        }
    },


    /**@
     * #.multiway
     * @comp Multiway
     * @sign public this .multiway([Number speed,] Object keyBindings)
     * @param speed - A speed in pixels per second
     * @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
     *
     * Constructor to initialize the speed and keyBindings. Component will listen to key events and move the entity appropriately.
     * Can be called while a key is pressed to change direction & speed on the fly.
     *
     * Multiway acts by adding a velocity on key press and removing the same velocity when the respective key is released.
     * This works well in most cases, but can cause undesired behavior if you manipulate velocities by yourself while this component is in effect.
     * If you need to resolve collisions, it's advised to correct the position directly rather than to manipulate the velocity. If you still need to reset the velocity once a collision happens, make sure to re-add the previous velocity once the collision is resolved.
     *
     * @example
     * ~~~
     * this.multiway(150, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({x:150,y:75}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({W: -90, S: 90, D: 0, A: 180});
     * ~~~
     *
     * @see Motion, Keyboard
     */
    multiway: function (speed, keys) {
        if (keys) {
            if (speed.x !== undefined && speed.y !== undefined) {
                this._speed.x = speed.x;
                this._speed.y = speed.y;
            } else {
                this._speed.x = speed;
                this._speed.y = speed;
            }
        } else {
            keys = speed;
        }


        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }

        this._updateKeys(keys);
        this._updateSpeed(this._speed);

        if (!this.disableControls) {
            this.__applyActiveDirections();
        }

        return this;
    },

    /**@
     * #.speed
     * @comp Multiway
     * @sign public this .speed(Object speed)
     * @param speed - New speed the entity has, for x and y axis.
     *
     * Change the speed that the entity moves with, in units of pixels per second.
     *
     * Can be called while a key is pressed to change speed on the fly.
     *
     * @example
     * ~~~
     * this.speed({ x: 150, y: 50 });
     * ~~~
     */
    speed: function (speed) {
        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }

        this._updateSpeed(speed);

        if (!this.disableControls) {
            this.__applyActiveDirections();
        }

        return this;
    },

    _updateKeys: function(keys) {
        // reset data
        this._keyDirection = {};
        this._activeDirections = {};

        for (var k in keys) {
            var keyCode = Crafty.keys[k] || k;
            // add new data
            var direction = this._keyDirection[keyCode] = keys[k];
            this._activeDirections[direction] = this._activeDirections[direction] || 0;
            if (this.isDown(keyCode)) // add directions of already pressed keys
                this._activeDirections[direction]++;
        }
    },

    _updateSpeed: function(speed) {
        // reset data
        this._directionSpeed = {};

        var direction;
        for (var keyCode in this._keyDirection) {
            direction = this._keyDirection[keyCode];
            // add new data
            this._directionSpeed[direction] = {
                x: Math.round(Math.cos(direction * (Math.PI / 180)) * 1000 * speed.x) / 1000,
                y: Math.round(Math.sin(direction * (Math.PI / 180)) * 1000 * speed.y) / 1000
            };
        }
    },

    __applyActiveDirections: function() {
        for (var direction in this._activeDirections) {
            if (this._activeDirections[direction] > 0) {
                this.vx += this._directionSpeed[direction].x;
                this.vy += this._directionSpeed[direction].y;
            }
        }
    },

    __unapplyActiveDirections: function() {
        for (var direction in this._activeDirections) {
            if (this._activeDirections[direction] > 0) {
                this.vx -= this._directionSpeed[direction].x;
                this.vy -= this._directionSpeed[direction].y;
            }
        }
    },

    /**@
     * #.enableControl
     * @comp Multiway
     * @sign public this .enableControl()
     *
     * Enable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.enableControl();
     * ~~~
     */
    enableControl: function () {
        if (this.disableControls) {
            this.__applyActiveDirections();
        }
        this.disableControls = false;

        return this;
    },

    /**@
     * #.disableControl
     * @comp Multiway
     * @sign public this .disableControl()
     *
     * Disable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.disableControl();
     * ~~~
     */
    disableControl: function () {
        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }
        this.disableControls = true;

        return this;
    }
});


/**@
 * #Jumper
 * @category Controls
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 * @trigger CheckJumping - When entity is about to jump. This event is triggered with the object the entity is about to jump from (if it exists). Third parties can respond to this event and enable the entity to jump.
 *
 * Make an entity jump in response to key events.
 *
 * @see Supportable, Motion, Keyboard, Gravity
 */
Crafty.c("Jumper", {
    _jumpSpeed: 300,

    /**@
     * #.canJump
     * @comp Jumper
     *
     * The canJump function determines if the entity is allowed to jump or not (e.g. perhaps the entity should be able to double jump).
     * The Jumper component will trigger a "CheckJumping" event.
     * Interested parties can listen to this event and enable the entity to jump by setting `canJump` to true.
     *
     * @example
     * ~~~
     * var player = Crafty.e("2D, Jumper");
     * player.hasDoubleJumpPowerUp = true; // allow player to double jump by granting him a powerup
     * player.bind("CheckJumping", function(ground) {
     *     if (!ground && player.hasDoubleJumpPowerUp) { // allow player to double jump by using up his double jump powerup
     *         player.canJump = true;
     *         player.hasDoubleJumpPowerUp = false;
     *     }
     * });
     * player.bind("LandedOnGround", function(ground) {
     *     player.hasDoubleJumpPowerUp = true; // give player new double jump powerup upon landing
     * });
     * ~~~
     */
    canJump: true,

    /**@
     * #.enableControl
     * @comp Jumper
     * @sign public this .enableControl()
     *
     * Enable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.enableControl();
     * ~~~
     */

    /**@
     * #.disableControl
     * @comp Jumper
     * @sign public this .disableControl()
     *
     * Disable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.disableControl();
     * ~~~
     */

    init: function () {
        this.requires("Supportable, Motion, Keyboard");
        // don't overwrite methods from Multiway if they exist
        this.enableControl = this.enableControl || function() { this.disableControls = false; };
        this.disableControl = this.disableControl || function() { this.disableControls = true; };
    },

    remove: function() {
        this.unbind("KeyDown", this._keydown_jumper);
    },

    _keydown_jumper: function (e) {
        if (this.disableControls) return;

        if (this._jumpKeys[e.key]) {
            var ground = this.ground;
            this.canJump = !!ground;
            this.trigger("CheckJumping", ground);
            if (this.canJump) {
                this.vy = -this._jumpSpeed;
            }
        }
    },

    /**@
     * #.jumper
     * @comp Jumper
     * @sign public this .jumper([Number jumpSpeed,] Array jumpKeys)
     * @param jumpSpeed - Vertical jump speed in pixels per second
     * @param jumpKeys - Keys to listen for and make entity jump in response
     *
     * Constructor to initialize the power of jump and keys to listen to. Component will
     * listen for key events and move the entity appropriately. Used with the
     * `gravity` component will simulate jumping.
     *
     * @example
     * ~~~
     * this.jumper(300, ['UP_ARROW', 'W']);
     * this.jumper(['UP_ARROW', 'W']);
     * ~~~
     *
     * @see Supportable, Motion, Keyboard, Gravity
     */
    jumper: function (jumpSpeed, jumpKeys) {
        if (jumpKeys) {
            this._jumpSpeed = jumpSpeed;
        } else {
            jumpKeys = jumpSpeed;
        }

        this._jumpKeys = {};
        for (var i = 0; i < jumpKeys.length; ++i) {
            var key = jumpKeys[i];
            var keyCode = Crafty.keys[key] || key;
            this._jumpKeys[keyCode] = true;
        }

        this.uniqueBind("KeyDown", this._keydown_jumper);

        return this;
    },

    /**@
     * #.jumpSpeed
     * @comp Jumper
     * @sign public this .jumpSpeed(Number jumpSpeed)
     * @param jumpSpeed - new vertical jump speed
     *
     * Change the vertical jump speed.
     *
     * @example
     * ~~~
     * this.jumpSpeed(300);
     * ~~~
     */
    jumpSpeed: function (jumpSpeed) {
        this._jumpSpeed = jumpSpeed;
        return this;
    }
});

/**@
 * #Fourway
 * @category Controls
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 *
 * Move an entity in four directions by using the
 * arrow keys or `W`, `A`, `S`, `D`.
 *
 * @see Multiway
 */
Crafty.c("Fourway", {

    init: function () {
        this.requires("Multiway");
    },

    /**@
     * #.fourway
     * @comp Fourway
     * @sign public this .fourway([Number speed])
     * @param speed - The speed of motion in pixels per second.
     *
     * Constructor to initialize the speed. Component will listen for key events and move the entity appropriately.
     * This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
     *
     * The key presses will move the entity in that direction by the speed passed in the argument.
     *
     * @see Multiway
     */
    fourway: function (speed) {
        this.multiway(speed || this._speed, {
            UP_ARROW: -90,
            DOWN_ARROW: 90,
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            W: -90,
            S: 90,
            D: 0,
            A: 180,
            Z: -90,
            Q: 180
        });

        return this;
    }
});

/**@
 * #Twoway
 * @category Controls
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 * @trigger CheckJumping - When entity is about to jump. This event is triggered with the object the entity is about to jump from (if it exists). Third parties can respond to this event and enable the entity to jump.
 *
 * Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
 *
 * @see Multiway, Jumper
 */
Crafty.c("Twoway", {

    init: function () {
        this.requires("Multiway, Jumper");
    },

    /**@
     * #.twoway
     * @comp Twoway
     * @sign public this .twoway([Number speed[, Number jumpSpeed]])
     * @param speed - A speed in pixels per second
     * @param jumpSpeed - Vertical jump speed in pixels per second
     *
     * Constructor to initialize the speed and power of jump. Component will
     * listen for key events and move the entity appropriately. This includes
     * `Up Arrow`, `Right Arrow`, `Left Arrow` as well as `W`, `A`, `D`. Used with the
     * `gravity` component to simulate jumping.
     *
     * The key presses will move the entity in that direction by the speed passed in
     * the argument. Pressing the `Up Arrow` or `W` will cause the entity to jump.
     *
     * @see Multiway, Jumper
     */
    twoway: function (speed, jumpSpeed) {

        this.multiway(speed || this._speed, {
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            D: 0,
            A: 180,
            Q: 180
        });

        this.jumper(jumpSpeed || speed * 2 || this._jumpSpeed, [
            Crafty.keys.UP_ARROW,
            Crafty.keys.W,
            Crafty.keys.Z
        ]);

        return this;
    }
});
