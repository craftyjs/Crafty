var Crafty = require('../core/core.js');

/**@
 * #Draggable
 * @category Controls
 * @kind Component
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

    required: "MouseDrag",
    events: {
        "StartDrag": "_startDrag",
        "Dragging": "_drag"
    },

    /**@
     * #.enableDrag
     * @comp Draggable 
     * @kind Method
     * 
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
     * @kind Method
     * 
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
     * @kind Method
     * 
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
        } else if (+dir === dir) { //dir is a number
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

    //Note: the code is not tested with zoom, etc., that may distort the direction between the viewport and the coordinate on the canvas.
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
 * #Controllable
 * @category Controls
 * @kind Component
 *
 * Used to bind methods to generalized input events.
 *
 * Currently supports the events "DirectionalInput", "TriggerInputDown", and "TriggerInputUp".
 *
 */
Crafty.c("Controllable", {
    init: function () {
        this._inputBindings = {
            "DirectionalInput": {},
            "TriggerInputDown": {},
            "TriggerInputUp": {}
        };
    },
    
    events: {
        // We don't want to use dot notation here for the property names
        /* jshint -W069 */
        "DirectionalInput": function (e) {
            if (this._inputBindings["DirectionalInput"][e.name]) {
                this._inputBindings["DirectionalInput"][e.name].call(this, e);
            }
        },

        "TriggerInputDown": function (e) {
            if (this._inputBindings["TriggerInputDown"][e.name]) {
                this._inputBindings["TriggerInputDown"][e.name].call(this, e);
            }
        },

         "TriggerInputUp": function (e) {
            if (this._inputBindings["TriggerInputUp"][e.name]) {
                this._inputBindings["TriggerInputUp"][e.name].call(this, e);
            }
        }
        /* jshint +W069 */
    },

    /**@
     * #.linkInput
     * @comp Controllable
     * @kind Method
     * 
     * @sign public this linkInput(string event, string name, function fn)
     * @param event - the name of the input event
     * @param name - the name of the input
     * @param fn - the function that will be called with the event object
     * 
     * Binds the function to the particular named event trigger.
     * 
     * Currently supports three types of input events.  Each event will have a `name` property.
     * - `DirectionalInput`: The event will have `x` and `y` properties representing the directional input vector, often normalized to a unit vector.  Triggered when the input changes.
     * - `TriggerInputDown`: Occurs when the input is triggered.
     * - `TriggerInputDown`: Occurs when the trigger is released.  The event will have a `downFor` property, indicating how long it had been active.
     * 
     * @example
     * ~~~~
     * // Create a trigger bound to the `b` key
     * Crafty.s("Controls").defineTriggerGroup("BlushTrigger", {keys:['b']});
     * // Create a blue square that turns pink when the trigger is pressed
     * Crafty.e("2D, Canvas, Color, Controllable")
     *   .attr({x:10, y:10, h:10, w:10}).color("blue")
     *   .linkInput("TriggerInputDown", "BlushTrigger", function(){this.color('pink');});
     * ~~~
     * 
     * @see .unlinkInput  
     */
    linkInput: function(event, name, fn) {
        this._inputBindings[event][name] = fn;
        return this;
    },

    /**@
     * #.unlinkInput
     * @comp Controllable
     * @kind Method
     * 
     * @sign public this linkInput(string event, string name)
     * @param event - the name of the input event
     * @param name - the name of the input
     * 
     * Removes a binding setup by linkInput
     * 
     * @see .linkInput
     */
    unlinkInput: function(event, name) {
        delete this._inputBindings[event][name];
        return this;
    },


    disableControls: false,

    /**@
     * #.enableControl
     * @comp Controllable
     * @kind Method
     * 
     * @sign public this .enableControl()
     *
     * Enable the component to listen to input events.
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
     * @comp Controllable
     * @kind Method
     * 
     * @sign public this .disableControl()
     *
     * Disable the component from responding to input events.
     *
     * @example
     * ~~~
     * this.disableControl();
     * ~~~
     */
    disableControl: function () {
        this.disableControls = true;
        return this;
    }
});


/**@
 * #Multiway
 * @category Controls
 * @kind Component
 *
 * Used to bind keys to directions and have the entity move accordingly.
 *
 * Multiway acts by listening to directional events, and then setting the velocity each frame based on the current direction and the current speed.
 * 
 * If a speed is not defined for a particular axis (x or y), then the velocity along that axis will not be set.
 *   
 * This behavior works in most cases, but can cause undesired behavior if you manipulate velocities by yourself while this component is in effect.
 * If you need to resolve collisions, it's advised to correct the position directly rather than to manipulate the velocity.
 * If you still need to reset the velocity once a collision happens, make sure to re-add the previous velocity once the collision is resolved.
 *
 * Additionally, this component provides the entity with `Motion` methods & events.
 *
 * @see Motion
 */
Crafty.c("Multiway", {
    _speed: null,
    
    init: function () {
        this.requires("Motion, Controllable");
        this._dpadName = "MultiwayDpad" + this[0];
        this._speed = { x: 150, y: 150 };
        this._direction = {x:0, y:0};
    },

    remove: function() {
        if (!this.disableControls) this.vx = this.vy = 0;
        this.unlinkInput("DirectionalInput", this._dpadName);
        Crafty.s("Controls").destroyDpad(this._dpadName);
    },

    events: {
        "UpdateFrame": function() {
            if (!this.disableControls) {
                if (typeof this._speed.x !== 'undefined' && this._speed.x !== null){
                    this.vx = this._speed.x * this._direction.x;
                }
                if (typeof this._speed.y !== 'undefined' && this._speed.y !== null) {
                    this.vy = this._speed.y * this._direction.y;
                }
            }
        }
    },
   
   // Rather than update the velocity directly in response to changing input, track the input direction separately
   // That makes it easier to enable/disable control
    _updateDirection: function(e) {
        this._direction.x = e.x;
        this._direction.y = e.y;
    },

    /**@
     * #.multiway
     * @comp Multiway
     * @kind Method
     * 
     * @sign public this .multiway([Number speed,] Object keyBindings[, Object options])
     * @param speed - A speed in pixels per second
     * @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
     * @param options - An object with options for `normalize` and `multipleDirectionBehavior`.
     *
     * Constructor to initialize the speed and keyBindings.
     * Component will listen to key events and move the entity appropriately.
     * Can be called while a key is pressed to change direction & speed on the fly.
     *
     * The options parameter controls the behavior of the component, and has the following defaults:
     * 
     *  - `"normalize": false`.  When set to true, the directional input always has a magnitude of 1
     *  - `"multipleDirectionBehavior": "all"` How to resolve multiple active directions.  
     *     Set to "first" or "last" to allow only one active direction at a time.
     *
     *  @example
     * ~~~
     * this.multiway(150, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({x:150,y:75}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({W: -90, S: 90, D: 0, A: 180});
     * ~~~
     *
     * @see Crafty.keys
     */         
    multiway: function (speed, keys, options) {
        var inputSystem = Crafty.s("Controls");

        if (keys) {
            this.speed(speed);
        } else {
            keys = speed;
        }
        inputSystem.defineDpad(this._dpadName, keys, options);
        this.linkInput("DirectionalInput", this._dpadName, this._updateDirection);

        return this;
    },

    /**@
     * #.speed
     * @comp Multiway
     * @kind Method
     * 
     * @sign public this .speed(Object speed)
     * @param speed - New speed the entity has, for x and y axis.
     *
     * Change the speed that the entity moves with, in units of pixels per second.
     * Can be called while a key is pressed to change speed on the fly.
     * 
     * If the passed object has only an x or y property, only the velocity along that axis will be controlled.
     *
     * @example
     * ~~~
     * this.speed({ x: 150, y: 50 });
     * ~~~
     */
    speed: function (speed) {
        if (typeof speed === 'object') {
            this._speed.x = speed.x;
            this._speed.y = speed.y;
        } else {
            this._speed.x = speed;
            this._speed.y = speed;
        }
        return this;
    },

    
});


/**@
 * #Jumper
 * @category Controls
 * @kind Component
 * @trigger CheckJumping - When entity is about to jump. This event is triggered with the object the entity is about to jump from (if it exists). Third parties can respond to this event and enable the entity to jump.
 *
 * Make the entity jump in response to key events.
 * Simulates jumping and falling when used with the `Gravity` component.
 *
 * Additionally, this component provides the entity with `Supportable`, `Motion` and `Keyboard` methods & events.
 *
 * @see Supportable, Motion, Keyboard, Gravity
 */
Crafty.c("Jumper", {
    _jumpSpeed: 300,

    /**@
     * #.canJump
     * @comp Jumper
     * @kind Method
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

    init: function () {
        this.requires("Supportable, Motion, Controllable");
    },

    remove: function() {
        this.unlinkInput("TriggerInputDown", this._jumpTriggerName);
        Crafty.s("Controls").destroyTriggerGroup(this._jumpTriggerName);
    },

    _keydown_jumper: function (e) {
        if (this.disableControls) return;
        this.jump();        
    },

    /**@
     * #.jump
     * @comp Jumper
     * @kind Method
     * 
     * @sign public this .jump()
     *
     * Directly trigger the entity to jump.
     *
     */
    jump: function() {
        var ground = this.ground;
        this.canJump = !!ground;
        this.trigger("CheckJumping", ground);
        if (this.canJump) {
            this.vy = -this._jumpSpeed;
        }
        return this;
    },

    /**@
     * #.jumper
     * @comp Jumper
     * @kind Method
     * 
     * @sign public this .jumper([Number jumpSpeed,] Array jumpKeys)
     * @param jumpSpeed - Vertical jump speed in pixels per second
     * @param jumpKeys - Keys to listen for and make entity jump in response
     * 
     * @sign public this .jumper([Number jumpSpeed,] Object jumpInputs)
     * @param jumpSpeed - Vertical jump speed in pixels per second
     * @param jumpInputs - An object with two properties, `keys` and `mouseButtons`.
     *
     * Constructor to initialize the power of jump and keys to listen to.
     * Component will listen for key events and make the entity jump appropriately.
     * 
     * If second argument is an object, the properties `keys` and `mouseButtons` will be used as triggers.
     *
     * @example
     * ~~~
     * this.jumper(300, ['UP_ARROW', 'W']);
     * this.jumper(['UP_ARROW', 'W']);
     * ~~~
     *
     * @see Crafty.keys
     */
    jumper: function (jumpSpeed, jumpKeys) {
        if (jumpKeys) {
            this._jumpSpeed = jumpSpeed;
        } else {
            jumpKeys = jumpSpeed;
        }
        this._jumpTriggerName = "JumpTrigger" + this[0];
        if (Array.isArray(jumpKeys)) {
            var keys = [];
            for (var i = 0; i < jumpKeys.length; ++i) {
                var key = jumpKeys[i];
                var keyCode = Crafty.keys[key] || key;
                keys.push(keyCode);
            }
            Crafty.s("Controls")
                .defineTriggerGroup(this._jumpTriggerName, {keys:keys});
        } else {
            Crafty.s("Controls")
                .defineTriggerGroup(this._jumpTriggerName, jumpKeys);
        }
        
        this.linkInput("TriggerInputDown", this._jumpTriggerName, this._keydown_jumper);

        return this;
    },

    /**@
     * #.jumpSpeed
     * @comp Jumper
     * @kind Method
     * 
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
 * @kind Component
 *
 * Move an entity in four directions by using the
 * `Up Arrow`, `Left Arrow`, `Down Arrow`, `Right Arrow` keys or `W`, `A`, `S`, `D`.
 *
 * This component is a thin wrapper around the `Multiway` component and sets the appropriate key bindings.
 * It is a well suited for games with a top-down (birds-eye) perspective.
 *
 * @see Multiway
 * @see Motion
 */
Crafty.c("Fourway", {

    init: function () {
        this.requires("Multiway");
    },

    /**@
     * #.fourway
     * @comp Fourway
     * @kind Method
     * 
     * @sign public this .fourway([Number speed[, Object options]])
     * @param speed - The speed of motion in pixels per second.
     * @param options - A dictionary of options passed through to the underlying Multiway component
     *
     * Initialize the component with the given speed and options.  See the Multiway component for available options.
     * 
     * @example
     * ~~~
     * Crafty.e("2D, Color, Fourway")
     *    .attr({x: 100, y: 100, w: 50, h:50})
     *    .color("green")
     *    .fourway(100, {normalize:true});
     * ~~~
     * Create a green square controlled by the arrow keys and WASD, with diagonal movement normalized to the given speed.
     * 
     * The speed is in units of pixels per second.
     */
    fourway: function (speed, options) {
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
        }, options);

        return this;
    }
});

/**@
 * #Twoway
 * @category Controls
 * @kind Component
 *
 * Move an entity left or right using the `Left Arrow`, `Right Arrow` keys or `D` and `A`
 * and make it jump using `Up Arrow` or `W`.
 * Simulates jumping and falling when used with the `Gravity` component.
 *
 * This component is a thin wrapper around the `Multiway` and `Jumper` components and sets the appropriate key bindings.
 * It is a well suited for side-scrolling platformer type games.
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
     * @kind Method
     * 
     * @sign public this .twoway([Number speed[, Number jumpSpeed]])
     * @param speed - A speed in pixels per second
     * @param jumpSpeed - Vertical jump speed in pixels per second
     *
     * Constructor to initialize the speed and power of jump.
     * Component will listen for key events and move the entity
     * in the respective direction by the speed passed in the argument.
     * Pressing the jump key will cause the entity to jump with the supplied power.
     */
    twoway: function (speed, jumpSpeed) {
        // Set multiway with horizontal speed only
        var hSpeed = speed || this._speed;
        this.multiway({x: hSpeed}, {
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
