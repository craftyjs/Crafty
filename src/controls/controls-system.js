var Crafty = require('../core/core.js');


// ToggleInput contract
// Must provide an isDown method which returns whether the input is down or not
// May provide a destroy method which can be used for cleanup




// MouseButtonToggleInput
function MouseButtonToggleInput(button) {
    this.button = button;
}

MouseButtonToggleInput.prototype = {
    isDown: function() {
        var mouseSystem = this.mouseSystem;
        if (!mouseSystem) this.mouseSystem = mouseSystem = Crafty.s('Mouse');
        return mouseSystem.isButtonDown(this.button);
    }
};

// KeyboardToggleInput
function KeyboardToggleInput(key) {
    this.key = key;
}

KeyboardToggleInput.prototype = {
    isDown: function() {
        var keyboardSystem = this.keyboardSystem;
        if (!keyboardSystem) this.keyboardSystem = keyboardSystem = Crafty.s('Keyboard');
        return keyboardSystem.isKeyDown(this.key);
    }
};


// ToggleInputGroup
function ToggleInputGroup(inputs) {
    this.inputs = inputs;
}

// Handles a group of inputs that represent the same toggle state
ToggleInputGroup.prototype = {
    timeDown: null,
    isActive: function () {
        for (var i in this.inputs) {
            var input = this.inputs[i];
            if (input.isDown()) {
                if (!this.timeDown) {
                    this.timeDown = Date.now();
                }
                return true;
            }
        }
        delete this.timeDown;
        return false;
    },
    destroy: function() {
        for (var i in this.inputs) {
            if (typeof this.inputs[i].destroy === 'function') {
                this.inputs[i].destroy();
            }
        }
    }
};

// Provides abstractions for specific types of inputs:
// - DirectionalInput: {x, y}
// - TriggerInputDown/TriggerInputUp

/**@
 * #Controls
 * @category Controls
 * @kind System
 * 
 * A built-in system for linking specific inputs to general types of input events.
 * 
 * @note The methods provided by this system are likely to change in future verisons of Crafty, as more input types are supported.
 * 
 * @trigger TriggerInputDown - When a trigger group is activated - {name}
 * @trigger TriggerInputUp - When a trigger group is released - {name, downFor}
 * @trigger DirectionalInput - When a directional input changes - {name, x, y}
 *
 * @trigger ControlDefined - When a control input is defined - {type, name}
 * @trigger ControlDestroyed - When a control input is destroyed - {type, name}
 */
Crafty.s("Controls", {
    init: function () {
        // internal object to store definitions
        this._dpads = {};
        this._triggers = {};

        // listen to mouse events
        Crafty.s("Mouse").bind("MouseDown", this.updateTriggers.bind(this));
        Crafty.s("Mouse").bind("MouseUp", this.updateTriggers.bind(this));
        Crafty.s("Mouse").bind("DoubleClick", this.updateTriggers.bind(this));
        Crafty.s("Mouse").bind("Click", this.updateTriggers.bind(this));
    },

    events: {
        "EnterFrame": "runEvents",
        "KeyDown": "updateTriggers",
        "KeyUp": "updateTriggers"
    },

    // Runs through all triggers and updates their status
    updateTriggers: function(e) {
        for (var t in this._triggers) {
            var trigger = this._triggers[t];
            this.updateTriggerInput(trigger);
        }
    },

    runEvents: function () { 
        // Trigger DirectionalInput events for dpads
        for (var d in this._dpads) {
            var dpad = this._dpads[d];
            dpad.oldX = dpad.x;
            dpad.oldY = dpad.y;
            this.updateDpadInput(dpad, dpad.multipleDirectionBehavior);
            this.updateActiveDirection(dpad, dpad.normalize);
            dpad.event.x = dpad.x;
            dpad.event.y = dpad.y;
            if (dpad.x !== dpad.oldX || dpad.y !== dpad.oldY) {
                Crafty.trigger("DirectionalInput", dpad.event);
            }
        }
    },

    getDpad: function (name) {
        return this._dpads[name];
    },

    isTriggerDown: function(name) {
        return this._triggers[name].active;
    },

    /**@
     * #.defineTriggerGroup
     * @comp Controls
     * @kind Method
     *
     * @sign defineTriggerGroup(string name, obj definition)
     * @param name - a name for the trigger group
     * @param definition - an object which defines the inputs for the trigger
     * 
     * A trigger group is a set of togglable inputs mapped to the same event.  
     * If any of the inputs are down, the trigger is considered down.  If all are up, it is considered up.  
     * When the trigger state changes, a `TriggerInputUp` or `TriggerInputDown` event is fired.
     * 
     * The definition object lists the inputs that are mapped to the trigger:
     * - `keys`: An array of Crafty keycodes
     * - `mouseButtons`: An array of Crafty mouse button codes
     * 
     * @example
     * ~~~
     * // Define a trigger group mapped to the left mouse button and the A and B keys.
     * Crafty.s("Controls").defineTriggerGroup("MyTrigger", {
     *   mouseButtons: [Crafty.mouseButtons.LEFT],
     *   keys: [Crafty.keys.A, Crafty.keys.B]
     * });
     * ~~~
     *
     * @see .destroyTriggerGroup
     * @see Crafty.mouseButtons
     * @see Crafty.keys
     * @see Controllable
     */
    defineTriggerGroup: function(name, definition) {
        var inputs;
        if (Array.isArray(definition)) {
            inputs = definition;
        } else {
            inputs = [];
            if (definition.mouseButtons) {
                for (var b in definition.mouseButtons){
                    inputs.push(new MouseButtonToggleInput(definition.mouseButtons[b]));
                }
            }
            if (definition.keys) {
                for (var k in definition.keys) {
                    inputs.push(new KeyboardToggleInput(definition.keys[k]));
                }
            }
        }
        this.destroyTriggerGroup(name);
        this._triggers[name] = {
            name: name,
            input: new ToggleInputGroup(inputs),
            downFor: 0,
            active: false
        };

        Crafty.trigger("ControlDefined", { type: "TriggerGroup", name: name });
    },

    /**@
     * #.destroyTriggerGroup
     * @comp Controls
     * @kind Method
     *
     * @sign destroyTriggerGroup(string name)
     * @param name - the name of the trigger group
     *
     * Destroys a previously defined trigger group.
     *
     * @see .defineTriggerGroup
     */
    destroyTriggerGroup: function(name) {
        if (this._triggers[name]) {
            this._triggers[name].input.destroy();
            delete this._triggers[name];
            Crafty.trigger("ControlDestroyed", { type: "TriggerGroup", name: name });
        }
    },

    /**@
     * #.defineDpad
     * @comp Controls
     * @kind Method
     * 
     * @sign defineDpad(string name, obj definition[, obj options])
     * @param name - a name for the dpad input
     * @param definition - an object which defines the inputs and directions for the dpad
     * @param options - a set of options for the dpad
     * 
     * A dpad is a type of directional control which maps a set of triggers to a set of directions.
     * 
     * The options object has two properties:
     * - `normalize` *(bool)*: If true, the directional input will be normalized to a unit vector.  Defaults to false.
     * - `multipleDirectionBehavior` *(string)*: How to behave when multiple directions are active at the same time.  Values are "first", "last", and "all".  Defaults to "all".
     * 
     * @example
     * ~~~
     * // Define a two-direction dpad, with two keys each bound to the right and left directions
     * Crafty.s("Controls").defineDpad("MyDpad", {RIGHT_ARROW: 0, LEFT_ARROW: 180, D: 0, A: 180});
     * ~~~
     *
     * @see .destroyDpad
     * @see Crafty.keys
     * @see Controllable
     * @see Multiway
     */
    defineDpad: function (name, definition, options) {
        var directionDict = {};
        for (var k in definition) {
            var direction = definition[k];
            var keyCode = Crafty.keys[k] || k;

            // create a mapping of directions to all associated keycodes
            if (!directionDict[direction]) {
                directionDict[direction] = [];
            }
            directionDict[direction].push(new KeyboardToggleInput(keyCode));
        }

        // Create a useful definition from the input format that tracks state
        var parsedDefinition = {};
        for (var d in directionDict) {
            parsedDefinition[d] = {
                input: new ToggleInputGroup(directionDict[d]),
                active: false,
                n: this.parseDirection(d)
            };
        }
        if (typeof options === 'undefined') {
            options = {};
        }
        if (typeof options.normalize === 'undefined') {
            options.normalize = false;
        }
        if (typeof options.multipleDirectionBehavior === 'undefined') {
            options.multipleDirectionBehavior = "all";
        }
        // Create the fully realized dpad object
        // Store the name/definition pair
        this.destroyDpad(name);
        this._dpads[name] = {
            name: name,
            directions: parsedDefinition,
            x: 0,
            y: 0,
            oldX: 0,
            oldY: 0,
            event: { x: 0, y: 0, name: name },
            normalize: options.normalize,
            multipleDirectionBehavior: options.multipleDirectionBehavior
        };

        Crafty.trigger("ControlDefined", { type: "Dpad", name: name });
    },

    /**@
     * #.destroyDpad
     * @comp Controls
     * @kind Method
     *
     * @sign destroyDpad(string name)
     * @param name - the name of the dpad input
     *
     * Destroys a previously defined dpad.
     *
     * @see .defineDpad
     */
    destroyDpad: function (name) {
        if (this._dpads[name]) {
            for (var d in this._dpads[name].parsedDefinition) {
                this._dpads[name].parsedDefinition[d].input.destroy();
            }
            delete this._dpads[name];
            Crafty.trigger("ControlDestroyed", { type: "Dpad", name: name });
        }
    },

    // Takes an amount in degrees and converts it to an x/y object.
    // Clamps to avoid rounding issues with sin/cos
    parseDirection: function (direction) {
        return {
            x: Math.round(Math.cos(direction * (Math.PI / 180)) * 1000) / 1000,
            y: Math.round(Math.sin(direction * (Math.PI / 180)) * 1000) / 1000
        };
    },

    // dpad definition is a map of directions to keys array and active flag
    updateActiveDirection: function (dpad, normalize) {
        var x = 0, y = 0;

        // Sum up all active directions
        for (var d in dpad.directions) {
            var dir = dpad.directions[d];
            if (!dir.active) continue;
            x += dir.n.x;
            y += dir.n.y;
        }

        // Mitigate rounding errors when close to zero movement
        x = (-1e-10 < x && x < 1e-10) ? 0 : x;
        y = (-1e-10 < y && y < 1e-10) ? 0 : y;

        // Normalize
        if (normalize) {
            var m = Math.sqrt(x * x + y * y);
            if (m > 0) {
                x /= m;
                y /= m;
            }
        }

        dpad.x = x;
        dpad.y = y;
    },

    updateTriggerInput: function (trigger) {
        if (!trigger.active) {
            if (trigger.input.isActive()) {
                trigger.downFor = Date.now() - trigger.input.timeDown;
                trigger.active = true;
                Crafty.trigger("TriggerInputDown", trigger);
            }
        } else {
            if (!trigger.input.isActive()) {
                trigger.active = false;
                Crafty.trigger("TriggerInputUp", trigger);
                trigger.downFor = 0;
            }
        }
    },

    // Has to handle three cases concerning multiple active input groups:
    // - "all": all directions are active
    // - "last": one direction at a time, new directions replace old ones
    // - "first": one direction at a time, new directions are ignored while old ones are still active 
    updateDpadInput: function (dpad, multiBehavior) {
        var d, dir;
        var winner;

        for (d in dpad.directions) {
            dir = dpad.directions[d];
            dir.active = false;

            if (dir.input.isActive()) {
                if (multiBehavior === "all") {
                    dir.active = true;
                } else {
                    if (!winner) {
                        winner = dir;
                    } else {
                        if (multiBehavior === "first") {
                            if (winner.input.timeDown > dir.input.timeDown) {
                                winner = dir;
                            }
                        }
                        if (multiBehavior === "last") {
                            if (winner.input.timeDown < dir.input.timeDown) {
                                winner = dir;
                            }
                        }
                    }
                }
            }
        }
        // If we picked a winner, set it active
        if (winner) winner.active = true;
    }
});