var Crafty = require('../core/core.js');

/**@
 * #TouchState
 * @category Input
 * @kind Component
 *
 * Handles valid touch related events and touch points for the entity.
 * @note This is an internally used component, automatically included in the `TouchSystem`.
 *
 * @trigger TouchStart - when a finger is pressed - TouchPointEvent
 * @trigger TouchMove - when a pressed finger is moved - TouchPointEvent
 * @trigger TouchEnd - when a finger is raised - TouchPointEvent
 * @trigger TouchCancel - when a touch event has been disrupted in some way - TouchPointEvent
 *
 * The standard Crafty `TouchPointEvent` object:
 * ~~~
 * // event name of touch event
 * e.eventName
 *
 * // identifier for this touch point, unique over the duration the finger is on the touch surface
 * e.identifier
 *
 * // the closest (visible & Touch-enhanced) entity to the source of the event (if available), otherwise null
 * e.target
 *
 * // (x,y) coordinates of the touch point in world (default viewport) space
 * e.realX
 * e.realY
 *
 * // Original touch event, containing additional native properties
 * e.originalEvent
 * ~~~
 *
 * In addition to binding to these events, the current touch points can also be queried using the `.touchPoints` property.
 *
 * @see Touch, TouchSystem
 */
Crafty.__touchStateTemplate = {
    /**@
     * #.touchPoints
     * @comp TouchState
     * @kind Property
     *
     * Holds data of all currently pressed touch points (useful for determining positions of fingers in every frame).
     * Data of a touch point is lost when the respective finger is raised.
     *
     * @example
     * ~~~
     * var touchPoint, touchPoints = Crafty.s('Touch').touchPoints;
     * for (var i = 0, l = touchPoints.length; i < l; i++) {
     *   touchPoint = touchPoints[i];
     *   Crafty.log(touchPoint.realX, touchPoint.realY); // logs coordinates in Crafty's world space
     * }
     * ~~~
     *
     * @see .resetTouchPoints
     */
    touchPoints: null,

    _touchPointsPool: null,

    init: function() {
        this.touchPoints = [];
        this._touchPointsPool = [];
        // use custom trigger method if specified
        this.triggerTouchEvent = this.triggerTouchEvent || this.trigger;
    },

    /**@
     * #.resetTouchPoints
     * @comp TouchState
     * @kind Method
     *
     * @sign public this .resetTouchPoints()
     *
     * Reset all current touch points. Triggers appropriate "TouchCancel" events.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @see .touchPoints
     */
    resetTouchPoints: function () {
        // Tell all touch points they're no longer held down
        var touchPoints = this.touchPoints, touchPoint,
            i = touchPoints.length;
        while (i--) { // iterate backwards to avoid conflicts with removal of array elements
            touchPoint = touchPoints[i];
            touchPoint.eventName = "TouchCancel";
            this.triggerTouch("TouchCancel", touchPoint);
        }

        return this;
    },

    /**@
     * #.triggerTouch
     * @comp TouchState
     * @kind Method
     *
     * @sign public this triggerTouch(String eventName, Object eventData)
     * @param eventName - Name of the touch event to trigger ("TouchStart", "TouchMove", "TouchEnd", "TouchCancel", ...)
     * @param eventData - The touch event to trigger
     *
     * Try to trigger a touch event on this entity and persist the touch point.
     * This method prevents inconsistent touch state.
     * e.g. If this entity didn't receive a "TouchStart" of a identifier previously, it won't fire a "TouchEnd" event for that identifier.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @example
     * ~~~
     * var wasTriggered = false;
     *
     * ent.requires('TouchState')
     *    .bind('TouchEnd', function(evt) {
     *       wasTriggered = true;
     *    })
     *    .triggerTouch('TouchEnd', { identifier: 0 });
     *
     * Crafty.log(wasTriggered); // prints false
     * ~~~
     */
    triggerTouch: function (eventName, eventData) {
        switch (eventName) {
            case "TouchStart":
                this._handleStart(eventData);
                break;
            case "TouchMove":
                this._handleMove(eventData);
                break;
            case "TouchCancel":
            case "TouchEnd":
                this._handleEnd(eventData);
                break;
            default:
                this.triggerTouchEvent(eventName, eventData); // trigger the event otherwise
        }
        return this;
    },

    _indexOfTouchPoint: function (identifier) {
        var touchPoints = this.touchPoints;
        for (var i = 0, l = touchPoints.length; i < l; i++) {
            if (touchPoints[i].identifier === identifier) {
                return i;
            }
        }
        return -1;
    },

    _setTouchPoint: function (touchPointDest, touchPointSrc) {
        touchPointDest.eventName = touchPointSrc.eventName;
        touchPointDest.identifier = touchPointSrc.identifier;
        touchPointDest.target = touchPointSrc.target;
        touchPointDest.entity = touchPointSrc.entity; // DEPRECATED: remove this in upcoming release
        touchPointDest.realX = touchPointSrc.realX;
        touchPointDest.realY = touchPointSrc.realY;
        touchPointDest.originalEvent = touchPointSrc.originalEvent;
    },

    _handleStart: function (touchPoint) {
        var oldIndex = this._indexOfTouchPoint(touchPoint.identifier),
            oldTouchPoint = oldIndex >= 0 ? this.touchPoints[oldIndex] : null;
        if (!oldTouchPoint) { // ignore TouchStart due to inconsistent state caused by loosing focus
            // allocate touch point
            var newTouchPoint = this._touchPointsPool.pop() || {};
            this._setTouchPoint(newTouchPoint, touchPoint);
            this.touchPoints.push(newTouchPoint);

            this.triggerTouchEvent(newTouchPoint.eventName, newTouchPoint);
        }
    },

    _handleMove: function (touchPoint) {
        var oldIndex = this._indexOfTouchPoint(touchPoint.identifier),
            oldTouchPoint = oldIndex >= 0 ? this.touchPoints[oldIndex] : null;
        if (oldTouchPoint) { // ignore TouchMove due to inconsistent state caused by loosing focus
            // update touch point
            this._setTouchPoint(oldTouchPoint, touchPoint);

            this.triggerTouchEvent(oldTouchPoint.eventName, oldTouchPoint);
        }
    },

    _handleEnd: function (touchPoint) {
        var oldIndex = this._indexOfTouchPoint(touchPoint.identifier),
            oldTouchPoint = oldIndex >= 0 ? this.touchPoints[oldIndex] : null;
        if (oldTouchPoint) { // ignore TouchEnd due to inconsistent state caused by loosing focus
            this._setTouchPoint(oldTouchPoint, touchPoint);
            this.triggerTouchEvent(oldTouchPoint.eventName, oldTouchPoint);

            // free touch point
            this.touchPoints.splice(oldIndex, 1);
            oldTouchPoint.target = null; // release reference for possible GC
            oldTouchPoint.entity = null; // DEPRECATED: remove this in upcoming release
            oldTouchPoint.originalEvent = null; // release reference for possible GC
            this._touchPointsPool.push(oldTouchPoint);
        }
    }
};
Crafty.c("TouchState", Crafty.__touchStateTemplate);

// define a basic Touch system for headless mode
// will be substituted with proper one in browser mode
Crafty.s("Touch", Crafty.extend.call({
    // this method will be called by TouchState iff triggerTouch event was valid
    triggerTouchEvent: function (eventName, e) {
        Crafty.trigger(eventName, e);
    }
}, Crafty.__touchStateTemplate), {}, false);
