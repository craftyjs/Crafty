var Crafty = require('./core.js');

/**@
 * #Multiway
 * @category Input
 * Used to bind keys to directions and have the entity move accordingly
 * @trigger NewDirection - triggered when direction changes - { x:Number, y:Number } - New direction
 * @trigger Moved - triggered on movement on either x or y axis. If the entity has moved on both axes for diagonal movement the event is triggered twice - { x:Number, y:Number } - Old position
 */
Crafty.c("Multiway", {
    _speed: 3,

    _keydown: function (e) {
        if (this._keys[e.key]) {
            this._movement.x = Math.round((this._movement.x + this._keys[e.key].x) * 1000) / 1000;
            this._movement.y = Math.round((this._movement.y + this._keys[e.key].y) * 1000) / 1000;
            this.trigger('NewDirection', this._movement);
        }
    },

    _keyup: function (e) {
        if (this._keys[e.key]) {
            this._movement.x = Math.round((this._movement.x - this._keys[e.key].x) * 1000) / 1000;
            this._movement.y = Math.round((this._movement.y - this._keys[e.key].y) * 1000) / 1000;
            this.trigger('NewDirection', this._movement);
        }
    },

    _enterframe: function () {
        if (this.disableControls) return;

        if (this._movement.x !== 0) {
            this.x += this._movement.x;
            this.trigger('Moved', {
                x: this.x - this._movement.x,
                y: this.y
            });
        }
        if (this._movement.y !== 0) {
            this.y += this._movement.y;
            this.trigger('Moved', {
                x: this.x,
                y: this.y - this._movement.y
            });
        }
    },

    _initializeControl: function () {
        return this.unbind("KeyDown", this._keydown)
            .unbind("KeyUp", this._keyup)
            .unbind("EnterFrame", this._enterframe)
            .bind("KeyDown", this._keydown)
            .bind("KeyUp", this._keyup)
            .bind("EnterFrame", this._enterframe);
    },

    /**@
     * #.multiway
     * @comp Multiway
     * @sign public this .multiway([Number speed,] Object keyBindings )
     * @param speed - Amount of pixels to move the entity whilst a key is down
     * @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
     * Constructor to initialize the speed and keyBindings. Component will listen to key events and move the entity appropriately.
     *
     * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
     * When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
     *
     * @example
     * ~~~
     * this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({W: -90, S: 90, D: 0, A: 180});
     * ~~~
     */
    multiway: function (speed, keys) {
        this._keyDirection = {};
        this._keys = {};
        this._movement = {
            x: 0,
            y: 0
        };
        this._speed = {
            x: 3,
            y: 3
        };

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

        this._keyDirection = keys;
        this.speed(this._speed);

        this._initializeControl();

        //Apply movement if key is down when created
        for (var k in keys) {
            if (Crafty.keydown[Crafty.keys[k]]) {
                this.trigger("KeyDown", {
                    key: Crafty.keys[k]
                });
            }
        }

        return this;
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
        this.disableControls = true;
        return this;
    },

    speed: function (speed) {
        for (var k in this._keyDirection) {
            var keyCode = Crafty.keys[k] || k;
            this._keys[keyCode] = {
                x: Math.round(Math.cos(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.x) / 1000,
                y: Math.round(Math.sin(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.y) / 1000
            };
        }
        return this;
    }
});

/**@
 * #Fourway
 * @category Input
 * Move an entity in four directions by using the
 * arrow keys or `W`, `A`, `S`, `D`.
 */
Crafty.c("Fourway", {

    init: function () {
        this.requires("Multiway");
    },

    /**@
     * #.fourway
     * @comp Fourway
     * @sign public this .fourway(Number speed)
     * @param speed - Amount of pixels to move the entity whilst a key is down
     * Constructor to initialize the speed. Component will listen for key events and move the entity appropriately.
     * This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
     *
     * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
     * When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
     *
     * The key presses will move the entity in that direction by the speed passed in the argument.
     *
     * @see Multiway
     */
    fourway: function (speed) {
        this.multiway(speed, {
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
 * @category Input
 * Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
 *
 * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}. This is consistent with Fourway and Multiway components.
 * When entity has moved on x-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
 */
Crafty.c("Twoway", {
    _speed: 3,
    _up: false,

    init: function () {
        this.requires("Fourway, Keyboard");
    },

    /**@
     * #.twoway
     * @comp Twoway
     * @sign public this .twoway(Number speed[, Number jump])
     * @param speed - Amount of pixels to move left or right
     * @param jump - Vertical jump speed
     *
     * Constructor to initialize the speed and power of jump. Component will
     * listen for key events and move the entity appropriately. This includes
     * ~~~
     * `Up Arrow`, `Right Arrow`, `Left Arrow` as well as W, A, D. Used with the
     * `gravity` component to simulate jumping.
     * ~~~
     *
     * The key presses will move the entity in that direction by the speed passed in
     * the argument. Pressing the `Up Arrow` or `W` will cause the entity to jump.
     *
     * @see Gravity, Fourway
     */
    twoway: function (speed, jump) {

        this.multiway(speed, {
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            D: 0,
            A: 180,
            Q: 180
        });

        if (speed) this._speed = speed;
        if (arguments.length < 2) jump = this._speed * 2;

        this.bind("EnterFrame", function () {
            if (this.disableControls) return;
            if (this._up) {
                this.y -= jump;
                this._falling = true;
            }
        }).bind("KeyDown", function (e) {
            if (e.key === Crafty.keys["UP_ARROW"] || e.key === Crafty.keys["W"] || e.key === Crafty.keys["Z"])
                this._up = true;
        });

        return this;
    }
});
