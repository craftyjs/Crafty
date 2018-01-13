var Crafty = require('../core/core.js');

/**@
 * #KeyboardSystem
 * @category Input
 * @kind System
 *
 * Provides access to key events.
 * @note Events and methods are inherited from the `KeyboardState` component.
 *
 * The event callbacks are triggered with a native [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
 * received by `window.document`, which is wrapped in a standard Crafty event object (as described in `KeyboardState`).
 *
 * These key events are triggered globally, thus on the global Crafty instance, every entity and system.
 *
 * @example
 * Move viewport by arrow keys.
 * ~~~
 * Crafty.bind('KeyDown', function(e) {
 *     if (e.key === Crafty.keys.LEFT_ARROW) {
 *         Crafty.viewport.x++;
 *     } else if (e.key === Crafty.keys.RIGHT_ARROW) {
 *         Crafty.viewport.x--;
 *     } else if (e.key === Crafty.keys.UP_ARROW) {
 *         Crafty.viewport.y++;
 *     } else if (e.key === Crafty.keys.DOWN_ARROW) {
 *         Crafty.viewport.y--;
 *     }
 * });
 * ~~~
 * @see KeyboardState, Keyboard
 */
Crafty.s("Keyboard", Crafty.extend.call(Crafty.extend.call(new Crafty.__eventDispatcher(), {
    _evt: { // evt object to reuse
        eventName:'',
        key: 0,
        which: 0,
        originalEvent: null
    },

    prepareEvent: function (e) {
        var evt = this._evt;

        // Normalize event name
        var type = e.type;
        evt.eventName = type === "keydown" ? "KeyDown" :
                        type === "keyup" ? "KeyUp" : type;

        // Normalize key to avoid cross-browser issues
        evt.which = e.charCode !== null ? e.charCode : e.keyCode;
        evt.key = e.keyCode || e.which;

        // wrap original event into standard Crafty event object
        // as original key event's properties are read-only
        evt.originalEvent = e;

        return evt;
    },

    // this method will be called by KeyboardState iff triggerKey event was valid
    triggerKeyEvent: function (eventName, e) {
        Crafty.trigger(eventName, e);
    },

    dispatchEvent: function (e) {
        var evt = this.prepareEvent(e);
        this.triggerKey(evt.eventName, evt);
    }
}), Crafty.__keyboardStateTemplate), {}, false);


/**@
 * #Keyboard
 * @category Input
 * @kind Component
 *
 * Provides the entity with keyboard events.
 * Keyboard events get dispatched to all entities that have the Keyboard component.
 * @note If you do not add this component, key events will not be triggered on the entity.
 *
 * Triggers all events described in the `KeyboardState` component, these are:
 * @trigger KeyDown - when a key is pressed - KeyboardEvent
 * @trigger KeyUp - when a key is released - KeyboardEvent
 *
 * @example
 * ~~~
 * Crafty.e("2D, DOM, Color, Keyboard")
 *   .attr({x: 100, y: 100, w: 50, h: 50})
 *   .color("red")
 *   .bind('KeyDown', function(e) {
 *     if (e.key == Crafty.keys.LEFT_ARROW) {
 *       this.x -= 1;
 *     } else if (e.key == Crafty.keys.RIGHT_ARROW) {
 *       this.x += 1;
 *     } else if (e.key == Crafty.keys.UP_ARROW) {
 *       this.y -= 1;
 *     } else if (e.key == Crafty.keys.DOWN_ARROW) {
 *       this.y += 1;
 *     }
 *   });
 * ~~~
 *
 * @see KeyboardState, KeyboardSystem
 */
Crafty.c("Keyboard", {
    // DEPRECATED: remove in an upcoming release
    isDown: function(key) {
        return Crafty.s('Keyboard').isKeyDown(key);
    }
});
