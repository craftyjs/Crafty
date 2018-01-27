var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.multitouch
     * @category Input
     * @kind Method
     *
     * Enables/disables support for multitouch feature.
     * @sign public this .multitouch(Boolean bool)
     * @param bool - Turns multitouch on and off.  The initial state is off (false).
     *
     * Query whether multitouch is on or off.
     * @sign public Boolean .multitouch()
     * @returns Whether multitouch is currently enabled
     *
     * By default, touch events are treated as mouse events and are handled by the `MouseSystem`.
     * To change this behaviour and handle events by the `TouchSystem`, enable multitouch.
     *
     * If this is set to true, it is expected that your entities have the `Touch` component instead of the `Mouse` component.
     * If false (default), then only entities with the Mouse component will respond to touch.
     * For simple use cases, tt's recommended to add the `Button` component instead, which requires the proper component depending on this feature.
     *
     * @note The multitouch feature is currently incompatible with the `Draggable` component and `Crafty.viewport.mouselook`.
     * @note When multitouch is not enabled, Crafty will cancel touch events when forwarding them to the mouse system.
     *
     * @example
     * ~~~
     * Crafty.multitouch(true);
     * Crafty.log("multitouch is " + Crafty.multitouch());
     *
     * Crafty.e('2D, Canvas, Color, Button')
     *    .attr({ x: 100, y: 100, w:200, h:200, z:1 })
     *    .color('black')
     *    .bind('TouchStart', function(e) { this.color('green'); });
     * ~~~
     * @see TouchSystem
     * @see MouseSystem
     * @see Button
     * @see Touch
     * @see Mouse
     */
    multitouch: function (bool) {
        if (typeof bool !== "boolean") return this._multitouch;
        this._multitouch = bool;
        return this;
    },
     _multitouch: false,

    _touchDispatch: (function () {
        var touchSystem;

        var startX = 0, // keeps track of start touch location
            startY = 0; // keeps track of start touch location

        function mimicMouse (e) {
            var type, first;
            if (e.type === "touchstart") type = "mousedown";
            else if (e.type === "touchmove") type = "mousemove";
            else if (e.type === "touchend") type = "mouseup";
            else if (e.type === "touchcancel") type = "mouseup";
            else if (e.type === "touchleave") type = "mouseup";
            if (e.touches && e.touches.length) {
                first = e.touches[0];
            } else if (e.changedTouches && e.changedTouches.length) {
                first = e.changedTouches[0];
            }
            var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
                first.screenX,
                first.screenY,
                first.clientX,
                first.clientY,
                false, false, false, false, 0, e.relatedTarget
            );
            first.target.dispatchEvent(simulatedEvent);

            // trigger click when it should be triggered
            if (type === 'mousedown') {
                startX = first.clientX;
                startY = first.clientY;
            } else if (type === 'mouseup') {
                var diffX = first.clientX - startX,
                    diffY = first.clientY - startY;

                // make sure that distance between touchstart and touchend smaller than some threshold,
                // e.g. <= 16 px
                if (diffX * diffX + diffY * diffY <= 256) {
                    type = 'click';
                    simulatedEvent = document.createEvent("MouseEvent");
                    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                        first.screenX,
                        first.screenY,
                        first.clientX,
                        first.clientY,
                        false, false, false, false, 0, e.relatedTarget
                    );
                    first.target.dispatchEvent(simulatedEvent);
                }
            }
            e.preventDefault();
        }

        return function(e) {
            // either dispatch real touch events
            if (Crafty._multitouch) {
                if (!touchSystem) touchSystem = Crafty.s('Touch');
                touchSystem.processEvent(e);
            // or mimic mouse events
            } else {
                mimicMouse(e);
            }
        };
    })()
});

/**@
 * #TouchSystem
 * @category Input
 * @kind System
 *
 * Provides access to touch point events.
 * @note Additional events and methods are inherited from the `TouchState` component.
 *
 * @trigger TouchOver - when a finger enters an entity - TouchPointEvent
 * @trigger TouchOut - when a finger leaves an entity - TouchPointEvent
 *
 * The event callbacks are triggered with the native [`TouchEvent`](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent)
 * received by Crafty's stage (`Crafty.stage.elem`), which is wrapped in a standard Crafty event object (see `TouchState`).
 * Note that for each changed [`Touch` point](https://developer.mozilla.org/en-US/docs/Web/API/Touch)) a separate
 * Crafty TouchPointEvent event is triggered.
 *
 * These touch point events are triggered on the TouchSystem itself.
 * Additionally, they are dispatched to the closest (visible & `Touch`-enhanced) entity to the source of the event (if available).
 *
 * @note By default, touch events are treated as mouse events and are not triggered by this system.
 * To change this behaviour (and enable multitouch) use `Crafty.multitouch`.
 *
 * @see TouchState, Touch
 * @see Crafty.multitouch
 */
Crafty.s("Touch", Crafty.extend.call(Crafty.extend.call(new Crafty.__eventDispatcher(), {
    normedEventNames: {
        "touchstart": "TouchStart",
        "touchmove": "TouchMove",
        "touchend": "TouchEnd",
        "touchcancel": "TouchCancel" // touchcancel is treated as touchend, but triggers a TouchCancel event
    },

    _evt: { // evt object to reuse
        eventName:'',
        identifier: -1,
        target: null,
        entity: null, // DEPRECATED: remove this in upcoming release
        realX: 0,
        realY: 0,
        originalEvent: null
    },

    // Indicates how many entities have the Touch component, for performance optimization
    // Touch events are still routed to Crafty.s('Touch') even if there are no entities with Touch component
    touchObjs: 0,

    // current entites that are pointed at
    overs: {},

    prepareEvent: function (e, type) {
        var evt = this._evt;

        // Normalize event name
        evt.eventName = this.normedEventNames[type] || type;

        // copy identifier
        evt.identifier = e.identifier;

        // augment touch event with real coordinates
        Crafty.translatePointerEventCoordinates(e, evt);

        // augment touch event with target entity
        evt.target = this.touchObjs ? Crafty.findPointerEventTargetByComponent("Touch", e) : null;
        // DEPRECATED: remove this in upcoming release
        evt.entity = evt.target;

        return evt;
    },

    // this method will be called by TouchState iff triggerTouch event was valid
    triggerTouchEvent: function(eventName, e) {
        // trigger event on TouchSystem itself
        this.trigger(eventName, e);

        var identifier = e.identifier,
            closest = e.target,
            over = this.overs[identifier];

        if (over) { // if old TouchOver target wasn't null, send TouchOut
            if ((eventName === "TouchMove" && over !== closest) || // if TouchOver target changed
                eventName === "TouchEnd" || eventName === "TouchCancel") { // or TouchEnd occurred

                e.eventName = "TouchOut";
                e.target = over;
                e.entity = over; // DEPRECATED: remove this in upcoming release
                over.trigger("TouchOut", e);
                e.eventName = eventName;
                e.target = closest;
                e.entity = closest; // DEPRECATED: remove this in upcoming release

                // delete old over entity
                delete this.overs[identifier];
            }
        }

        // TODO: move routing of events in future to controls system, make it similar to KeyboardSystem
        // try to find closest element that will also receive touch event, whatever the event is
        if (closest) {
            closest.trigger(eventName, e);
        }

        if (closest) { // if new TouchOver target isn't null, send TouchOver
            if (eventName === "TouchStart" || // if TouchStart occurred
                (eventName === "TouchMove" && over !== closest)) { // or TouchOver target changed

                e.eventName = "TouchOver";
                closest.trigger("TouchOver", e);
                e.eventName = eventName;

                // save new over entity
                this.overs[identifier] = closest;
            }
        }
    },

    dispatchEvent: function (e) {
        var evt, touches = e.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            evt = this.prepareEvent(touches[i], e.type);
            // wrap original event into standard Crafty event object
            evt.originalEvent = e;
            this.triggerTouch(evt.eventName, evt);
        }
    }
}), Crafty.__touchStateTemplate), {}, false);

/**@
 * #Touch
 * @category Input
 * @kind Component
 *
 * Provides the entity with touch point events.
 * Touch point events get dispatched to the closest (visible & `Touch`-enhanced) entity to the source of the event (if available).
 * @note If you do not add this component, touch events will not be triggered on the entity.
 *
 * Triggers all events described in `TouchSystem` and `TouchState`, these are:
 * @trigger TouchOver - when a finger enters the entity - TouchPointEvent
 * @trigger TouchMove - when a finger is over the entity and moves - TouchPointEvent
 * @trigger TouchOut - when a finger leaves the entity - TouchPointEvent
 * @trigger TouchStart - when a finger is pressed on the entity - TouchPointEvent
 * @trigger TouchEnd - when a finger is raised over the entity - TouchPointEvent
 * @trigger TouchCancel - when a touch event has been disrupted in some way whilst over the entity - TouchPointEvent
 *
 * @note By default, touch events are treated as mouse events and are not triggered by this component.
 * To change this behaviour (and enable multitouch) use `Crafty.multitouch`.
 *
 * @example
 * ~~~
 * Crafty.multitouch(true);
 *
 * Crafty.e('2D, Canvas, Color, Touch')
 *   .attr({x: 10, y: 10, w: 40, h: 40})
 *   .color('green')
 *   .bind('TouchOver', function(TouchPoint){
 *     Crafty.log('A finger is over the entity', TouchPoint.identifier);
 *   })
 *   .bind('TouchMove', function(TouchPoint) {
 *     Crafty.log('A finger moves over the entity at { x: ' + TouchPoint.realX + ', y: ' + TouchPoint.realY + ' } coordinates.');
 *   })
 *   .bind('TouchOut', function(TouchPoint){
 *     Crafty.log('A finger is no longer over the entity', TouchPoint.identifier);
 *   });
 * ~~~
 *
 * @example
 * ~~~
 * Crafty.multitouch(true);
 *
 * var myEntity1 = Crafty.e('2D, Canvas, Color, Touch')
 *    .attr({x: 100, y: 100, w:200, h:200, z:1 })
 *    .color('black')
 *    .bind('TouchStart',function(e){ alert('big black box was touched', e); }),
 *  myEntity2 = Crafty.e('2D, Canvas, Color, Touch')
 *    .attr({x: 40, y: 150, w:90, h:300, z:2 })
 *    .color('green')
 *    .bind('TouchStart',function(e){ alert('big green box was touched', e); });
 * ~~~
 *
 * @see TouchState, TouchSystem
 * @see Crafty.multitouch
 */
Crafty.c("Touch", {
    required: "AreaMap",
    init: function () {
        Crafty.s('Touch').touchObjs++;
    },
    remove: function () {
        Crafty.s('Touch').touchObjs--;
    }
});
