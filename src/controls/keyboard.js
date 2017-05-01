var Crafty = require('../core/core.js');

/**@
 * #KeyboardState
 * @category Input
 * @kind Component
 *
 * Provides valid key related events and key states for the entity.
 *
 * @trigger KeyDown - is triggered when the DOM 'keydown' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
 * @trigger KeyUp - is triggered when the DOM 'keyup' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
 *
 * The event callbacks are triggered with a native [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) received by `window.document`,
 * which is wrapped in a standard Crafty event object consisting of additional properties:
 * ~~~
 * // event name of key event
 * e.eventName
 *
 * // Normalized keyCode according to Crafty.keys
 * e.key
 *
 * // Original keyboard event, containing additional native properties
 * e.originalEvent
 * ~~~
 *
 * In addition to binding to these events, the current state (pressed/released) of a key can also be queried using the `.isKeyDown` method.
 *
 * @see Keyboard, KeyboardSystem
 * @see Crafty.keys
 */
Crafty.__keyboardStateTemplate = {
    _keyDown: null,

    init: function() {
        this._keyDown = {};
        // use custom trigger method if specified
        this.triggerKeyEvent = this.triggerKeyEvent || this.trigger;
    },

    /**@
     * #.isKeyDown
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public Boolean isKeyDown(String keyName)
     * @param keyName - Name of the key to check. See `Crafty.keys`.
     * @returns The pressed state of the key
     *
     * @sign public Boolean isKeyDown(Number keyCode)
     * @param keyCode - Key code in `Crafty.keys`.
     * @returns The pressed state of the key
     *
     * Determine if a certain key is currently down.
     *
     * @example
     * ~~~
     * ent.bind('EnterFrame', function() {
     *   if (Crafty.s('Keyboard').isKeyDown('SPACE'))
     *     this.y--;
     * });
     * ~~~
     *
     * @see .resetKeyDown
     * @see Crafty.keys
     */
    isKeyDown: function (key) {
        if (typeof key === "string") {
            key = Crafty.keys[key];
        }
        return !!this._keyDown[key];
    },

    /**@
     * #.resetKeyDown
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public this .resetKeyDown()
     *
     * Reset all currently pressed keys. Triggers appropriate "KeyUp" events.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @see .isKeyDown
     * @see Crafty.keys
     */
    resetKeyDown: function () {
        var evt = { key: -1, eventName: "KeyUp" };

        // Tell all the keys they're no longer held down
        var keyDown = this._keyDown;
        for (var k in keyDown) {
            if (keyDown[k] === true) {
                evt.key = +k; // convert k propertyString to number!
                this.triggerKey("KeyUp", evt);
            }
        }

        return this;
    },

    /**@
     * #.triggerKey
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public this triggerKey(String eventName, Object eventData)
     * @param eventName - Name of the key event to trigger ("KeyDown" or "KeyUp")
     * @param eventData - The key event to trigger
     *
     * Try to trigger a key event on this entity.
     * This method prevents inconsistent key state.
     * e.g. If this entity didn't receive a "KeyDown" previously, it won't fire a "KeyUp" event.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @example
     * ~~~
     * var wasTriggered = false;
     *
     * ent.requires('KeyboardState')
     *    .bind('KeyUp', function(evt) {
     *       wasTriggered = true;
     *    })
     *    .triggerKey('KeyUp', { key: Crafty.keys.RIGHT_ARROW });
     *
     * Crafty.log(wasTriggered); // prints false
     * ~~~
     *
     * @see Crafty.keys
     */
    triggerKey: function (eventName, eventData) {
        // trigger event only if valid state
        var key = eventData.key;
        if (eventName === "KeyDown") {
            // ignore KeyDown due to inconsistent state caused by loosing focus
            if (this._keyDown[key] !== true) {
                this._keyDown[key] = true;
                this.triggerKeyEvent(eventName, eventData);
            }
        } else if (eventName === "KeyUp") {
            // ignore KeyUp due to inconsistent state caused by loosing focus
            if (this._keyDown[key] === true) {
                this._keyDown[key] = false;
                this.triggerKeyEvent(eventName, eventData);
            }
        } else {
            // trigger the event otherwise
            this.triggerKeyEvent(eventName, eventData);
        }

        return this;
    }
};
Crafty.c("KeyboardState", Crafty.__keyboardStateTemplate);

// define a basic Keyboard system for headless mode
// will be substituted with proper one in browser mode
Crafty.s("Keyboard", Crafty.extend.call({
    // this method will be called by KeyboardState iff triggerKey event was valid
    triggerKeyEvent: function (eventName, e) {
        Crafty.trigger(eventName, e);
    }
}, Crafty.__keyboardStateTemplate), {}, false);
