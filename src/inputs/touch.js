var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.multitouch
     * @category Input
     * @kind Method
     * @sign public this .multitouch(Boolean bool)
     * @param bool - Turns multitouch on and off.  The initial state is off (false).
     *
     * @sign public Boolean .multitouch()
     * @returns Whether multitouch is currently enabled;
     *
     * Enables/disables support for multitouch feature.
     *
     * If this is set to true, it is expected that your entities have the Touch component instead of Mouse component.
     * If false (default), then only entities with the Mouse component will respond to touch.
     *
     * If no boolean is passed to the function call, it will just return whether multitouch is on or not.
     *
     * @note The Touch component (and thus the multitouch feature) is currently incompatible with the Draggable component.
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
     *    .bind('TouchStart',function(e){ alert('big GREEN box was touched', e); });
     *
     * Crafty.log("multitouch is "+Crafty.multitouch());
     * ~~~
     * @see TouchSystem
     * @see Touch
     */
    multitouch: function (bool) {
        if (typeof bool !== "boolean") return this._multitouch;
        this._multitouch = bool;
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
 * Provides access to touch events.
 *
 * This system dispatches touch events received by Crafty (crafty.stage.elem).
 * The touch events get dispatched to the closest entity to the source of the event (if available).
 *
 * By default, touch events are treated as mouse events. To change this behaviour (and enable multitouch)
 * you must use Crafty.multitouch.
 *
 * If using multitouch feature, this method sets the array Crafty.touchHandler.fingers, which holds data
 * of the most recent touches that occured (useful for determining positions of fingers in every frame)
 * as well as last entity touched by each finger. Data is lost as soon as the finger is raised.
 *
 * You can read about the MouseEvent, which is the parameter passed to the Mouse entity's callback.
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 *
 * You can also read about the TouchEvent.
 * https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
 *
 * And about the touch point interface, which is the parameter passed to the Touch entity's callback.
 * http://www.w3.org/TR/touch-events/#dfn-active-touch-point
 *
 * @see Crafty.multitouch
 * @see Touch
 */
Crafty.s("Touch", Crafty.extend.call(new Crafty.__eventDispatcher(), {
    // Indicates how many entities have the Touch component, for performance optimization
    touchObjs: 0,

    // TODO: move routing of events in future to controls system
    // and change it so that touch events are always triggered on TouchSystem
    dispatchEvent: function (e) {
        if (!this.touchObjs) return;

        switch (e.type) {
            case "touchstart":
                this._touchHandler.handleStart(e);
                break;
            case "touchmove":
                this._touchHandler.handleMove(e);
                break;
            case "touchleave": // touchleave is treated as touchend
            case "touchcancel": // touchcancel is treated as touchend, but triggers a TouchCancel event
            case "touchend":
                this._touchHandler.handleEnd(e);
                break;
        }
    },

    _touchHandler: {
        fingers: [], // keeps track of touching fingers

        handleStart: function (e) {
            var touches = e.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                var idx = false,
                    closest;
                closest = this.findClosestTouchEntity(touches[i]);

                if (closest) {
                    closest.trigger("TouchStart", touches[i]);
                    // In case the entity was already being pressed, get the finger index
                    idx = this.fingerDownIndexByEntity(closest);
                }
                var touch = this.setTouch(touches[i], closest);
                if (idx !== false && idx >= 0) {
                    // Recycling finger...
                    this.fingers[idx] = touch;
                } else {
                    this.fingers.push(touch);
                }
            }
        },

        handleMove: function (e) {
            var touches = e.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                var idx = this.fingerDownIndexById(touches[i].identifier);
                var closest = this.findClosestTouchEntity(touches[i]);

                if (idx >= 0) {
                    var finger = this.fingers[idx];
                    if(typeof finger.entity !== "undefined")
                        if (finger.entity === closest) {
                            finger.entity.trigger("TouchMove", touches[i]);
                        } else {
                            if (typeof closest === "object") closest.trigger("TouchStart", touches[i]);
                            finger.entity.trigger("TouchEnd");
                        }
                    finger.entity = closest;
                    finger.realX = touches[i].realX;
                    finger.realY = touches[i].realY;
                }
            }
        },

        handleEnd: function (e) {
            var touches = e.changedTouches,
                eventName = e.type === "touchcancel" ? "TouchCancel" : "TouchEnd";
            for (var i = 0, l = touches.length; i < l; i++) {
                var idx = this.fingerDownIndexById(touches[i].identifier);

                if (idx >= 0) {
                    if (this.fingers[idx].entity)
                        this.fingers[idx].entity.trigger(eventName);
                    this.fingers.splice(idx, 1);
                }
            }
        },

        setTouch: function (touch, entity) {
            return { identifier: touch.identifier, realX: touch.realX, realY: touch.realY, entity: entity };
        },

        findClosestTouchEntity: function (touchEvent) {
            Crafty.augmentPointerEvent(touchEvent);
            return Crafty.findPointerEventTargetByComponent("Touch", touchEvent);
        },

        fingerDownIndexById: function (idToFind) {
            for (var i = 0, l = this.fingers.length; i < l; i++) {
                var id = this.fingers[i].identifier;
                if (id === idToFind) {
                    return i;
                }
            }
            return -1;
        },

        fingerDownIndexByEntity: function (entityToFind) {
            for (var i = 0, l = this.fingers.length; i < l; i++) {
                var ent = this.fingers[i].entity;

                if (ent === entityToFind) {
                    return i;
                }
            }
            return -1;
        }
    }
}), {}, false);

/**@
 * #Touch
 * @category Input
 * @kind Component
 *
 * Provides the entity with touch related events
 * @note If you do not add this component, touch events will not be triggered on the entity.
 *
 * @trigger TouchStart - when entity is touched - TouchPoint
 * @trigger TouchMove - when finger is moved over entity - TouchPoint
 * @trigger TouchCancel - when a touch event has been disrupted in some way - TouchPoint
 * @trigger TouchEnd - when the finger is raised over the entity, or when finger leaves entity.  (Passes no data) - null
 *
 * To be able to use multitouch, you must enable it with  `Crafty.multitouch(true)`.
 *
 * If you don't need multitouch, you can probably use the Mouse component instead, since by default Crafty will trigger mouse events for touch input.
 *
 * You can read more about the TouchEvent.
 * - [TouchEvent.touches and TouchEvent.changedTouches](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent)
 * - [TouchPoint](http://www.w3.org/TR/touch-events/#dfn-active-touch-point) is the parameter passed to the event callback in the related touch.
 *
 * The passed TouchPoints are augmented by properties which correspond to the coordinates of the TouchEvent in world (default viewport) space,
 * namely `TouchPoint.realX` and `TouchPoint.realY`.
 *
 * @example
 * ~~~
 * Crafty.multitouch(true);
 *
 * var myEntity = Crafty.e('2D, Canvas, Color, Touch')
 * .attr({x: 10, y: 10, w: 40, h: 40})
 * .color('green')
 * .bind('TouchStart', function(TouchPoint){
 *   Crafty.log('myEntity has been touched', TouchPoint);
 * }).bind('TouchMove', function(TouchPoint) {
 *   Crafty.log('Finger moved over myEntity at the { x: ' + TouchPoint.realX + ', y: ' + TouchPoint.realY + ' } coordinates.');
 * }).bind('TouchEnd', function() {
 *   Crafty.log('Touch over myEntity has finished.');
 * });
 * ~~~
 * @see Crafty.multitouch
 * @see TouchSystem
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
