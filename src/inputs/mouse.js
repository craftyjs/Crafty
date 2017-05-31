var Crafty = require('../core/core.js');

/**@
 * #MouseWheel
 * @category Input
 * @kind System
 *
 * System which dispatches mouse wheel events received by Crafty.
 * @trigger MouseWheelScroll - when mouse is scrolled - MouseWheelEvent
 *
 * The event callback is triggered with a native [`wheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/wheel) (all newer browsers),
 * a native [`mousewheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel) (old IE and WebKit browsers) or
 * a native [`DOMMouseScroll` event](https://developer.mozilla.org/en-US/docs/Web/Events/DOMMouseScroll) (old Firefox browsers)
 * received by Crafty's stage (`Crafty.stage.elem`), which is wrapped in a standard Crafty event object (see below).
 *
 * These MouseWheel events are triggered on the global Crafty object and thus on every entity and system.
 *
 * The standard `MouseWheelEvent` object:
 * ~~~
 * // event name of mouse wheel event - "MouseWheelScroll"
 * e.eventName
 *
 * // the direction the wheel was scrolled, +1 if wheel was scrolled up, -1 if wheel was scrolled down
 * e.direction
 *
 * // the closest (visible & Mouse-enhanced) entity to the source of the event (if available), otherwise null
 * e.target
 *
 * // (x,y) coordinates of mouse event in world (default viewport) space
 * e.realX
 * e.realY
 *
 * // Original mouse wheel event, containing additional native properties
 * e.originalEvent
 * ~~~
 *
 * @example
 * Zoom the viewport (camera) in response to mouse scroll events.
 * ~~~
 * Crafty.bind("MouseWheelScroll", function(evt) {
 *     Crafty.viewport.scale(Crafty.viewport._scale * (1 + evt.direction * 0.1));
 * });
 * ~~~
 *
 * For more details see [mdn article on wheel events](https://developer.mozilla.org/en-US/docs/Web/Events/wheel#Listening_to_this_event_across_browser).
 * @note The wheel delta properties of the event vary in magnitude across browsers, thus it is recommended to check for `.direction` instead.
 * The `.direction` equals `+1` if wheel was scrolled up, `-1` if wheel was scrolled down
 * (see [details](http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers)).
 *
 * @example
 * Interactive, map-like zooming of the viewport (camera) in response to mouse scroll events.
 * ~~~
 * // sign public void zoomTowards(Number amt, Number posX, Number posY, Number time[, String|function easingFn])
 * // param Number amt - amount to zoom in on the target by (eg. `2`, `4`, `0.5`)
 * // param Number posX - the x coordinate to zoom towards
 * // param Number posY - the y coordinate to zoom towards
 * // param Number time - the duration in ms of the entire zoom operation
 * // param easingFn - A string or custom function specifying an easing.
 * //                   (Defaults to linear behavior.)
 * //                   See `Crafty.easing` for more information.
 * //
 * // Zooms the camera towards a given point, preserving the current center.
 * // `amt > 1` will bring the camera closer to the subject,
 * // `amt < 1` will bring it farther away,
 * // `amt = 0` will reset to the default zoom level.
 * // Zooming is multiplicative. To reset the zoom amount, pass `0`.
 * //
 * // <example>
 * // // Make the entities appear twice as large by zooming in towards (100,100) over the duration of 3 seconds using linear easing behavior
 * // zoomTowards(2, 100, 100, 3000);
 * // </example>
 * //
 * function zoomTowards (amt, posX, posY, time, easingFn) {
 *     var scale = Crafty.viewport._scale,
 *         // current viewport center
 *         centX = -Crafty.viewport._x + Crafty.viewport._width / 2 / scale,
 *         centY = -Crafty.viewport._y + Crafty.viewport._height / 2 / scale,
 *         // direction vector from viewport center to position
 *         deltaX = posX - centX,
 *         deltaY = posY - centY;
 *     var f = amt - 1;
 *
 *     Crafty.viewport.zoom(amt, centX + deltaX * f, centY + deltaY * f, time, easingFn);
 * }
 *
 * // don't restrict panning of viewport in any way
 * Crafty.viewport.clampToEntities = false;
 *
 * // enable panning of viewport by dragging the mouse
 * Crafty.viewport.mouselook(true);
 *
 * // enable interactive map-like zooming by scrolling the mouse
 * Crafty.bind("MouseWheelScroll", function (evt) {
 *     zoomTowards(1 + evt.direction/10, evt.realX, evt.realY, 5);
 * });
 * ~~~
 */

Crafty.s("MouseWheel", Crafty.extend.call(new Crafty.__eventDispatcher(), {
    _evt: { // evt object to reuse
        eventName:'',
        direction: 0,
        target: null,
        clientX: 0, // DEPRECATED: remove in upcoming release
        clientY: 0, // DEPRECATED: remove in upcoming release
        realX: 0,
        realY: 0,
        originalEvent: null
    },
    _mouseSystem: null,

    prepareEvent: function (e) {
        var mouseSystem = this._mouseSystem;
        if (!mouseSystem) this._mouseSystem = mouseSystem = Crafty.s('Mouse');

        var evt = this._evt;

        // normalize eventName
        evt.eventName = "MouseWheelScroll";

        // normalize direction
        evt.direction = (e.detail < 0 || e.wheelDelta > 0 || e.deltaY < 0) ? 1 : -1;

        // copy screen coordinates
        // only browsers supporting `wheel` event contain mouse coordinates
        // DEPRECATED: remove in upcoming release
        evt.clientX = e.clientX !== undefined ? e.clientX : mouseSystem.lastMouseEvent.clientX;
        evt.clientY = e.clientY !== undefined ? e.clientY : mouseSystem.lastMouseEvent.clientY;

        // augment mouse event with real coordinates
        Crafty.translatePointerEventCoordinates(e, evt);

        // augment mouse event with target entity
        evt.target = mouseSystem.mouseObjs ? Crafty.findPointerEventTargetByComponent("Mouse", e) : null;

        // wrap original event into standard Crafty event object
        evt.originalEvent = e;

        return evt;
    },

    dispatchEvent: function (e) {
        var evt = this.prepareEvent(e);
        // trigger event
        Crafty.trigger("MouseWheelScroll", evt);
    }
}), {}, false);


/**@
 * #MouseSystem
 * @category Input
 * @kind System
 *
 * Provides access to mouse events.
 * @note Additional events and methods are inherited from the `MouseState` component.
 *
 * @trigger MouseOver - when the mouse enters an entity - MouseEvent
 * @trigger MouseOut - when the mouse leaves an entity - MouseEvent
 * @trigger Click - when the user clicks - MouseEvent
 * @trigger DoubleClick - when the user double clicks - MouseEvent
 *
 * The event callbacks are triggered with a native [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
 * received by Crafty's stage (`Crafty.stage.elem`), which is wrapped in a standard Crafty event object (as described in `MouseState`).
 *
 * These mouse events are triggered on the MouseSystem itself.
 * Additionally, they are dispatched to the closest (visible & `Mouse`-enhanced) entity to the source of the event (if available).
 *
 * @note If you're targeting mobile, you should know that by default Crafty turns touch events into mouse events,
 * making mouse dependent components work with touch. However, if you need multitouch, you'll have
 * to make use of the Touch component instead, which can break compatibility with things which directly interact with the Mouse component.
 *
 * @example
 * Log the current position of the mouse.
 * ~~~
 * Crafty.s('Mouse').bind('MouseMove', function(e) {
 *     Crafty.log('Mouse pos: <' + e.realX.toFixed(2) + ', ' + e.realY.toFixed(2) + '>');
 * });
 * ~~~
 *
 * @see MouseState, Mouse
 * @see Crafty.multitouch
 */
Crafty.s("Mouse", Crafty.extend.call(Crafty.extend.call(new Crafty.__eventDispatcher(), {
    normedEventNames: {
        "mousedown": "MouseDown",
        "mouseup": "MouseUp",
        "dblclick": "DoubleClick",
        "click": "Click",
        "mousemove": "MouseMove"
    },

    _evt: { // evt object to reuse
        eventName:'',
        mouseButton: -1,
        target: null,
        clientX: 0, // DEPRECATED: remove in upcoming release
        clientY: 0, // DEPRECATED: remove in upcoming release
        realX: 0,
        realY: 0,
        originalEvent: null
    },

    // Indicates how many entities have the Mouse component, for performance optimization
    // Mouse events are still routed to Crafty.s('Mouse') even if there are no entities with Mouse component
    mouseObjs: 0,

    // current entity that is moused over
    over: null,

    prepareEvent: function (e) {
        var evt = this._evt;

        // Normalize event name
        var type = e.type;
        evt.eventName = this.normedEventNames[type] || type;

        // Normalize button according to http://unixpapa.com/js/mouse.html
        if (typeof e.which === 'undefined') {
            evt.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button === 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        } else {
            evt.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which === 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        }

        // copy screen coordinates
        // DEPRECATED: remove in upcoming release
        evt.clientX = e.clientX;
        evt.clientY = e.clientY;

        // augment mouse event with real coordinates
        Crafty.translatePointerEventCoordinates(e, evt);

        // augment mouse event with target entity
        evt.target = this.mouseObjs ? Crafty.findPointerEventTargetByComponent("Mouse", e) : null;

        // wrap original event into standard Crafty event object
        evt.originalEvent = e;

        return evt;
    },

    // this method will be called by MouseState iff triggerMouse event was valid
    triggerMouseEvent: function (eventName, e) {
        // trigger event on MouseSystem itself
        this.trigger(eventName, e);

        // special case: MouseOver & MouseOut
        var over = this.over, closest = e.target;
        if (eventName === "MouseMove" && over !== closest) { // MouseOver target changed
            // if old MouseOver target wasn't null, send MouseOut
            if (over) {
                e.eventName = "MouseOut";
                e.target = over;
                over.trigger("MouseOut", e);
                e.eventName = "MouseMove";
                e.target = closest;
            }

            // save new over entity
            this.over = closest;

            // if new MouseOver target isn't null, send MouseOver
            if (closest) {
                e.eventName = "MouseOver";
                closest.trigger("MouseOver", e);
                e.eventName = "MouseMove";
            }
        }

        // TODO: move routing of events in future to controls system, make it similar to KeyboardSystem
        // try to find closest element that will also receive mouse event, whatever the event is
        if (closest) {
            closest.trigger(eventName, e);
        }
    },

    dispatchEvent: function (e) {
        var evt = this.prepareEvent(e);
        this.triggerMouse(evt.eventName, evt);
    }
}), Crafty.__mouseStateTemplate), {}, false);


/**@
 * #Mouse
 * @category Input
 * @kind Component
 *
 * Provides the entity with mouse events.
 * Mouse events get dispatched to the closest (visible & `Mouse`-enhanced) entity to the source of the event (if available).
 * @note If you do not add this component, mouse events will not be triggered on the entity.
 *
 * Triggers all events described in `MouseSystem` and `MouseState`, these are:
 * @trigger MouseOver - when the mouse enters the entity - MouseEvent
 * @trigger MouseMove - when the mouse is over the entity and moves - MouseEvent
 * @trigger MouseOut - when the mouse leaves the entity - MouseEvent
 * @trigger MouseDown - when a mouse button is pressed on the entity - MouseEvent
 * @trigger MouseUp - when a mouse button is released on the entity - MouseEvent
 * @trigger Click - when the user clicks on the entity - MouseEvent
 * @trigger DoubleClick - when the user double clicks on the entity - MouseEvent
 *
 * @note If you're targeting mobile, you should know that by default Crafty turns touch events into mouse events,
 * making mouse dependent components work with touch. However, if you need multitouch, you'll have
 * to make use of the Touch component instead, which can break compatibility with things which directly interact with the Mouse component.
 *
 * @example
 * ~~~
 * var myEntity = Crafty.e('2D, Canvas, Color, Mouse')
 * .attr({x: 10, y: 10, w: 40, h: 40})
 * .color('red')
 * .bind('Click', function(MouseEvent){
 *   alert('clicked', MouseEvent);
 * });
 *
 * myEntity.bind('MouseUp', function(e) {
 *    if( e.mouseButton == Crafty.mouseButtons.RIGHT )
 *        Crafty.log("Clicked right button");
 * })
 * ~~~
 *
 * @see MouseState, MouseSystem
 * @see Crafty.multitouch
 */
Crafty.c("Mouse", {
    required: "AreaMap",

    init: function () {
        Crafty.s("Mouse").mouseObjs++;
    },
    remove: function() {
        Crafty.s("Mouse").mouseObjs--;
    }
});

/**@
 * #MouseDrag
 * @category Input
 * @kind Component
 *
 * Provides the entity with drag and drop mouse events.
 * @trigger Dragging - is triggered each frame the entity is being dragged - MouseEvent
 * @trigger StartDrag - is triggered when dragging begins - MouseEvent
 * @trigger StopDrag - is triggered when dragging ends - MouseEvent
 *
 * @see Mouse
 */
Crafty.c("MouseDrag", {
    _dragging: false,

    required: "Mouse",
    events: {
        "MouseDown": "_ondown"
    },

    init: function () {
        // TODO: remove this and instead lock on pointer control events in future
        // bind the this object for listeners called with the MouseSystem as the this object
        this._ondown = this._ondown.bind(this);
        this._ondrag = this._ondrag.bind(this);
        this._onup = this._onup.bind(this);
    },

    // When dragging is enabled, this method is bound to the MouseDown crafty event
    _ondown: function (e) {
        if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
        this.startDrag(e);
    },

    // While a drag is occurring, this method is bound to the mousemove DOM event
    _ondrag: function (e) {
        // ignore invalid 0 position - strange problem on ipad
        if (!this._dragging || e.realX === 0 || e.realY === 0) return false;
        this.trigger("Dragging", e);
    },

    // While a drag is occurring, this method is bound to mouseup DOM event
    _onup: function (e) {
        if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
        this.stopDrag(e);
    },

    /**@
     * #.startDrag
     * @comp MouseDrag
     * @kind Method
     *
     * @sign public this .startDrag(void)
     *
     * Make the entity produce drag events, essentially making the entity follow the mouse positions.
     *
     * @see .stopDrag
     */
    startDrag: function (e) {
        if (this._dragging) return;
        this._dragging = true;

        // TODO: remove this and instead lock on pointer control events in future
        Crafty.s("Mouse").bind("MouseMove", this._ondrag);
        Crafty.s("Mouse").bind("MouseUp", this._onup);

        // if event undefined, use the last known position of the mouse
        this.trigger("StartDrag", e || Crafty.s("Mouse").lastMouseEvent);
        return this;
    },

    /**@
     * #.stopDrag
     * @comp MouseDrag
     * @kind Method
     *
     * @sign public this .stopDrag(void)
     *
     * Stop the entity from producing drag events, essentially reproducing the drop.
     *
     * @see .startDrag
     */
    stopDrag: function (e) {
        if (!this._dragging) return;
        this._dragging = false;

        // TODO: remove this and instead lock on pointer control events in future
        Crafty.s("Mouse").unbind("MouseMove", this._ondrag);
        Crafty.s("Mouse").unbind("MouseUp", this._onup);

        // if event undefined, use the last known position of the mouse
        this.trigger("StopDrag", e || Crafty.s("Mouse").lastMouseEvent);
        return this;
    }
});
