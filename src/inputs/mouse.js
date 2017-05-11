var Crafty = require('../core/core.js');

/**@
 * #MouseWheel
 * @category Input
 * @kind System
 *
 * System which dispatches mouse wheel events received by Crafty.
 * @trigger MouseWheelScroll - is triggered when mouse is scrolled on stage - { direction: +1 | -1} - Scroll direction (up | down)
 *
 * @note This system processes a native [`wheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/wheel) (all newer browsers),
 * a native [`mousewheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel) (old IE and WebKit browsers) or
 * a native [`DOMMouseScroll` event](https://developer.mozilla.org/en-US/docs/Web/Events/DOMMouseScroll) (old Firefox browsers)
 * received by `Crafty.stage.elem`, wraps it into a standard Crafty event object with additional `.direction`, `.realX`, `.realY` properties (see below) and
 * dispatches it to the global Crafty object and thus to every entity.
 * See [mdn details on wheel events](https://developer.mozilla.org/en-US/docs/Web/Events/wheel#Listening_to_this_event_across_browser).
 *
 * @note The wheel delta properties of the event vary in magnitude across browsers, thus it is recommended to check for `.direction` instead.
 * The `.direction` equals `+1` if wheel was scrolled up, `-1` if wheel was scrolled down
 * (see [details](http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers)).
 *
 * @example
 * Zoom the viewport (camera) in response to mouse scroll events.
 * ~~~
 * Crafty.bind("MouseWheelScroll", function(evt) {
 *     Crafty.viewport.scale(Crafty.viewport._scale * (1 + evt.direction * 0.1));
 * });
 * ~~~
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
 *     var pos = Crafty.domHelper.translate(evt.clientX, evt.clientY);
 *     zoomTowards(1 + evt.direction/10, pos.x, pos.y, 5);
 * });
 * ~~~
 */

Crafty.s("MouseWheel", Crafty.extend.call(new Crafty.__eventDispatcher(), {
    dispatchEvent: function (e) {
        // normalize eventName
        e.eventName = "MouseWheelScroll";
        // normalize direction
        e.direction = (e.detail < 0 || e.wheelDelta > 0 || e.deltaY < 0) ? 1 : -1;
        // wrap original event into standard Crafty event object
        // (no current impact, but could be changed in future)
        e.originalEvent = e;

        // augment event with real coordinates
        Crafty.augmentPointerEvent(e);

        // trigger event
        Crafty.trigger("MouseWheelScroll", e);
    }
}), {}, false);


/**@
 * #MouseSystem
 * @category Input
 * @kind System
 *
 * Provides access to mouse events.
 *
 * Events and methods are inherited from the `MouseState` component.
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

    // Indicates how many entities have the Mouse component, for performance optimization
    // Mouse events are still routed to Crafty.s('Mouse') even if there are no entities with Mouse component
    mouseObjs: 0,

    // current object that is moused over
    over: null,

    prepareEvent: function (e) {
        // Normalize event name
        var type = e.type;
        e.eventName = this.normedEventNames[type] || type;

        // Normalize button according to http://unixpapa.com/js/mouse.html
        var mouseButton;
        if (typeof e.which === 'undefined') {
            mouseButton = e.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button === 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        } else {
            mouseButton = e.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which === 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        }

        // wrap original event into standard Crafty event object
        // (no current impact, but could be changed in future)
        e.originalEvent = e;

        // augment mouse event with real coordinates
        Crafty.augmentPointerEvent(e);

        return e;
    },

    // this method will be called by MouseState iff triggerMouse event was valid
    triggerMouseEvent: function (eventName, e) {
        // trigger event on MouseSystem itself
        this.trigger(eventName, e);

        // TODO: move routing of events in future to controls system
        // make it similar to KeyboardSystem and Keyboard implementation
        if (!this.mouseObjs) return;

        // Try to find closest element that will also receive mouse event
        var closest = Crafty.findPointerEventTargetByComponent("Mouse", e.originalEvent);
        if (closest) {
            // trigger whatever it is
            closest.trigger(eventName, e);

            if (eventName === "MouseMove") {
                if (this.over !== closest) { // new mouseover target
                    if (this.over) {
                        this.over.trigger("MouseOut", e); // if old mouseover target wasn't null, send mouseout
                        this.over = null;
                    }

                    this.over = closest;
                    closest.trigger("MouseOver", e);
                }
            }
        }
        // If nothing in particular was clicked
        else {
            if (eventName === "MouseMove" && this.over) { // if there is still a mouseover target
                this.over.trigger("MouseOut", e); // send mouseout
                this.over = null;
            }
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
 * Triggers all events described in the `MouseState` component.
 *
 * @note If you're targeting mobile, you should know that by default Crafty turns touch events into mouse events,
 * making mouse dependent components work with touch. However, if you need multitouch, you'll have
 * to make use of the Touch component instead, which can break compatibility with things which directly interact with the Mouse component.
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

        Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
        Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);

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

        Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
        Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);

        // if event undefined, use the last known position of the mouse
        this.trigger("StopDrag", e || Crafty.s("Mouse").lastMouseEvent);
        return this;
    }
});
