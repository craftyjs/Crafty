var Crafty = require('../core/core.js'),
    document = window.document;

//TODO fix documentation
//TODO trigger FocusChange events and add that to documentation
//TODO test all this

// common base functionality for all EventDispatchers
function EventDispatcher() {
    this._focusedElement = null;
}
// this method should be setup as the entry callback for DOM events
EventDispatcher.prototype.processEvent = function (e) {
    this.dispatchEvent(e, this._focusedElement);
    return this.preventBubbling(e);
};

// let all events be routed to the passed element
EventDispatcher.prototype.lockFocus = function (elem) {
    if (this._focusedElement === null) {
        this._focusedElement = elem;
        this.changeFocus(null, elem);
        return true;
    } else {
        return false;
    }
};
// release the focused element, so that event routing goes into default mode
EventDispatcher.prototype.releaseFocus = function (elem) {
    if (this._focusedElement === elem) {
        this._focusedElement = null;
        this.changeFocus(elem, null);
        return true;
    } else {
        return false;
    }
};
EventDispatcher.prototype.getFocus = function () {
    return this._focusedElement;
};

// take action if focus changed
// to be implemented by instances
EventDispatcher.prototype.changeFocus = function (oldFocusElem, newFocusElem) {
};

// prevents interaction with page (e.g. scrolling of page), if DOM events target Crafty's stage
// automatically called for all incoming DOM events
EventDispatcher.prototype.preventBubbling = function (e) {
    //prevent default actions for all events except key events backspace and F1-F12 and except actions in INPUT and TEXTAREA.
    //prevent bubbling up for all events except key events backspace and F1-F12.
    //Among others this prevent the arrow keys from scrolling the parent page
    //of an iframe hosting the game
    if (!(e.key === 8 || e.key >= 112 && e.key <= 135)) { // do we need a "Crafty.selected" condition here?
        if (e.stopPropagation) e.stopPropagation();
        else e.cancelBubble = true;

        //Don't prevent default actions if target node is input or textarea.
        if (!e.target || (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA')) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            return false;
        }
        return true;
    }
};

// main method that handles logic of incoming DOM events
// to be implemented by instances
EventDispatcher.prototype.dispatchEvent = function (e, focusedElem) {
    // normalize the event and prepare it for dispatching to Crafty, a system or entities
    // set e.eventName to proper event to be triggered

    // dispatch the element to Crafty, the proper system or entities
    // if a element requires focus, it will be passed as 2nd argument, probably dispatch the event to the focused element
    // otherwise find the entity to dispatch to (e.g. mouse events) or dispatch it globally (e.g. key events)
};

/**@
 * #MouseSystem
 * @category Input
 * @kind System
 *
 * Provides access to unconsumed mouse events.
 * Mouse events get dispatched to the closest (visible & `Mouse`-enhanced) entity to the source of the event (if available).
 * If there is no such entity, the MouseSystem receives the event instead.
 *
 * Inherits methods and events from the `MouseState` component.
 *
 * Additionally, this system can provide exclusive access to MouseEvents.
 * If the events are locked onto this entity, no other entity or system will receive MouseEvents.
 *
 * @note If you're targeting mobile, you should know that by default Crafty turns touch events into mouse events,
 * making mouse dependent components work with touch. However, if you need multitouch, you'll have
 * to make use of the Touch component instead, which can break compatibility with things which directly interact with the Mouse component.
 *
 * @see MouseState, Mouse
 * @see Crafty.mouseDispatch
 * @see Crafty.multitouch
 * @see Crafty.touchDispatch
 */
Crafty.s("Mouse", Crafty.extend.call({
    _focusedElement: Crafty.e('MouseState').attr({
        _wrappedElem: null,
        trigger: function(event, data) {
            if (this._wrappedElem) this._wrappedElem.trigger(event, data);
        }
    }),

    /**@
     * #.lockMouse
     * @comp MouseSystem
     * @kind Method
     *
     * @sign public Boolean .lockMouse(System target)
     * @param target - Target system which would like exclusive access to MouseEvents
     * @returns A boolean indicating whether the lock has been acquired
     *
     * Make all mouse events be received by target system exclusively.
     * Locking may fail if another entity or system acquired the lock already. In that case `false` will be returned.
     *
     * @example
     * ~~~
     * // This system will lock mouse events to itself when the mouse is clicked or dragged on the viewport.
     * // No other entities, including e.g. "Draggable" entities, can interfere accidentally while a lock is in effect
     * Crafty.s("Instructor", {
     *     init: function() {
     *         // register this system's "MouseDown" callback for when user clicks on the background / viewport
     *         Crafty.s('Mouse').bind('MouseDown', this.events["MouseDown"].bind(this));
     *     },
     *
     *     events: {
     *         "MouseDown": function (e) {
     *             // acquire the lock
     *             Crafty.s('Mouse').lockMouse(this);
     *             // do something while lock is in effect
     *             this.events["MouseMove"].call(this, e);
     *         },
     *         "MouseMove": function (e) {
     *             // do something while lock is in effect
     *             Crafty.trigger("MoveTo", { x: e.realX, y: e.realY });
     *         },
     *         "MouseUp": function (e) {
     *             // release the lock
     *             Crafty.s('Mouse').releaseMouse(this);
     *         }
     *     }
     * }, {}, false);
     * ~~~
     *
     * @see .releaseMouse
     */
    lockMouse: function(elem) {
        var success = Crafty._mouseDispatcher.lockFocus(this._focusedElement);
        if (success) this._focusedElement._wrappedElem = elem;
        return success;
    },

    /**@
     * #.releaseMouse
     * @comp MouseSystem
     * @kind Method
     *
     * @sign public Boolean .releaseMouse(System target)
     * @param target - Target system which would like to relinquish exclusive access to MouseEvents
     * @returns A boolean indicating whether the lock has been released
     *
     * Stop all mouse events from being received by target system exclusively.
     * Releasing may fail if another entity or system acquired the lock. In that case `false` will be returned.
     *
     * @see .lockMouse
     */
    releaseMouse: function(elem) {
        var success = Crafty._mouseDispatcher.releaseFocus(this._focusedElement);
        if (success) this._focusedElement._wrappedElem = null;
        return success;
    }
}, Crafty.__mouseStateTemplate), {}, false);

/**@
 * #KeyboardSystem
 * @category Input
 * @kind System
 *
 * Provides access to key events.
 * Keyboard events get dispatched to all entities that have the Keyboard component and to the KeyboardSystem itself.
 *
 * Inherits methods and events from the `KeyboardState` component.
 *
 * Additionally, this system can provide exclusive access to KeyEvents.
 * If the events are locked onto this entity, no other entity or system will receive KeyEvents.
 *
 * @see KeyboardState, Keyboard
 * @see Crafty.keyboardDispatch
 */
Crafty.s("Keyboard", Crafty.extend.call({
    _focusedElement: Crafty.e('KeyboardState').attr({
        _wrappedElem: null,
        trigger: function(event, data) {
            if (this._wrappedElem) this._wrappedElem.trigger(event, data);
        }
    }),

    /**@
     * #.lockKeyboard
     * @comp KeyboardSystem
     * @kind Method
     *
     * @sign public Boolean .lockKeyboard(System target)
     * @param target - Target system which would like exclusive access to KeyEvents
     * @returns A boolean indicating whether the lock has been acquired
     *
     * Make all keyboard events be received by target system exclusively.
     * Locking may fail if another entity or system acquired the lock already. In that case `false` will be returned.
     *
     * @example
     * ~~~
     * var started = false;
     *
     * // This entity moves randomly and bounces off viewport borders.
     * // It will acquire the lock once the Mouse is pointed over it.
     * // However, if you fail to keep the Mouse pointed at it, it will loose focus and release the lock.
     * //
     * Crafty.e("2D, DOM, Color, Keyboard, Mouse, Motion")
     *     .attr({ // place it in the middle of viewport
     *         x: Crafty.viewport._width / 2 - 32, w: 64,
     *         y: Crafty.viewport._height / 2 - 32, h: 64,
     *         lastMoveDT: 0
     *     })
     *     .color('blue')
     *     .bind('Moved', function() { // bounce off borders
     *         if (this.x < 0) {
     *             this.vx = Crafty.math.abs(this.vx);
     *         } else if (this.x + this.w > Crafty.viewport._width) {
     *             this.vx = -Crafty.math.abs(this.vx);
     *         }
     *
     *         if (this.y < 0) {
     *             this.vy = Crafty.math.abs(this.vy);
     *         } else if (this.y + this.h > Crafty.viewport._height) {
     *             this.vy = -Crafty.math.abs(this.vy);
     *         }
     *     })
     *     .bind('EnterFrame', function(frame) { // after a random amount of time, set a random direction for the entity to move
     *         if (this.lastMoveDT > Crafty.math.randomInt(1000, 3000)) {
     *             this.vx = Crafty.math.randomInt(-150, 150);
     *             this.vy = Crafty.math.randomInt(-150, 150);
     *             this.lastMoveDT = 0;
     *         }
     *         this.lastMoveDT += frame.dt;
     *     })
     *     .bind('MouseOver', function() {
     *         this.lockKeyboard(); // once the mouse points over entity, acquire the lock
     *         started = true; // let the game of concentration begin!
     *     })
     *     .bind('MouseOut', function() {
     *         this.releaseKeyboard(); // once the mouse no longer points at the entity, release the lock
     *     });
     *
     * // This system will try to steal the lock in each frame, resulting in an explosion!
     * Crafty.s("HotWire", {
     *     events: {
     *         "EnterFrame": function() {
     *             if (started && Crafty.s('Keyboard').lockKeyboard(this)) {
     *                 alert('Kaboom!');
     *             }
     *         }
     *     }
     * }, {}, false);
     * ~~~
     *
     * @see .releaseKeyboard
     */
    lockKeyboard: function(elem) {
        var success = Crafty._keyboardDispatcher.lockFocus(this._focusedElement);
        if (success) this._focusedElement._wrappedElem = elem;
        return success;
    },

    /**@
     * #.releaseKeyboard
     * @comp KeyboardSystem
     * @kind Method
     *
     * @sign public Boolean .releaseKeyboard(System target)
     * @param target - Target system which would like to relinquish exclusive access to KeyEvents
     * @returns A boolean indicating whether the lock has been released
     *
     * Stop all keyboard events from being received by target system exclusively.
     * Releasing may fail if another entity or system acquired the lock. In that case `false` will be returned.
     *
     * @see .lockKeyboard
     */
    releaseKeyboard: function(elem) {
        var success = Crafty._keyboardDispatcher.releaseFocus(this._focusedElement);
        if (success) this._focusedElement._wrappedElem = null;
        return success;
    }
}, Crafty.__keyboardStateTemplate), {}, false);

Crafty.extend({
    // Indicates how many entities have the Mouse component, for performance optimization
    // Mouse events are still routed to Crafty.s('Mouse') even if there are no entities with Mouse component
    mouseObjs: 0,

    // Indicates how many entities have the Touch component, for performance optimization
    touchObjs: 0,

    /**@
     * #Crafty.lastEvent
     * @category Input
     * @kind Property
     * Check which mouse event occured most recently (useful for determining mouse position in every frame).
     *
     * The native [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) is augmented with additional properties.
     * @example
     * ~~~
     * // (x,y) coordinates of newest mouse event in web-browser (screen) space
     * Crafty.lastEvent.clientX
     * Crafty.lastEvent.clientY
     *
     * //(x,y) coordinates of newest mouse event in world (default viewport) space
     * Crafty.lastEvent.realX
     * Crafty.lastEvent.realY
     *
     * // Normalized mouse button according to Crafty.mouseButtons:
     * // Crafty.mouseButtons.LEFT, Crafty.mouseButtons.RIGHT or Crafty.mouseButtons.MIDDLE
     * Crafty.lastEvent.mouseButton
     * ~~~
     * @see Mouse, Crafty.mouseButtons, Crafty.mouseDispatch
     */
    lastEvent: null,

    /**@
     * #Crafty.keydown
     * @category Input
     * @kind Property
     * Check which keys (referred by `Crafty.keys` key codes) are currently down.
     *
     * @example
     * ~~~
     * // is "Shift" currently pressed?
     * var shiftDown = !!Crafty.keydown[Crafty.keys.SHIFT];
     * ~~~
     * @see Keyboard, Crafty.keys, Crafty.keyboardDispatch
     */
    keydown: {},

    /**@
     * #Crafty.selected
     * @category Input
     * @kind Property
     * @trigger CraftyFocus - is triggered when Crafty's stage gets selected
     * @trigger CraftyBlur - is triggered when Crafty's stage is no longer selected
     *
     * Check whether Crafty's stage (`Crafty.stage.elem`) is currently selected.
     *
     * After a click occurs inside Crafty's stage, this property is set to `true`.
     * After a click occurs outside Crafty's stage, this property is set to `false`.
     *
     * Defaults to true.
     *
     * @see Crafty.stage#Crafty.stage.elem
     */
    selected: true,

    detectBlur: function (e) {
        var selected = ((e.clientX > Crafty.stage.x && e.clientX < Crafty.stage.x + Crafty.viewport.width) &&
            (e.clientY > Crafty.stage.y && e.clientY < Crafty.stage.y + Crafty.viewport.height));

        if (!Crafty.selected && selected) {
            Crafty.trigger("CraftyFocus");
        }

        if (Crafty.selected && !selected) {
            Crafty.trigger("CraftyBlur");
        }

        Crafty.selected = selected;
    },

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
     * @see Crafty.touchDispatch
     * @see Touch
     */
    multitouch: function (bool) {
        if (typeof bool !== "boolean") return this._touchDispatcher._touchHandler.multitouch;
        this._touchDispatcher._touchHandler.multitouch = bool;
    },

    resetKeyDown: function () {
        // Tell all the keys they're no longer held down
        var focusedElem = Crafty._keyboardDispatcher.getFocus();
        var evt = { key: 0, eventName: "KeyUp" };

        var keydowns = this.keydown;
        for (var k in keydowns) {
            if (keydowns[k] === true) {
                evt.key = +k; // convert k propertyString to number!
                // TODO once keyboard comp iteration fast and separate KeyboardStates per entity:
                // * trigger KeyUp event on all objs, not just focusedElem
                // * call .resetKeyDown on every focusChange
                if (focusedElem) {
                    focusedElem.trigger("KeyUp", evt);
                } else {
                    // TODO tigger on KeySystem and all Keyboard comps
                    this.trigger("KeyUp", evt);
                }

                keydowns[k] = false;
            }
        }
    },

    /**@
     * #Crafty.mouseButtonsDown
     * @category Input
     * @kind Property
     * Check which mouse buttons (referred by `Crafty.mouseButtons` button ids) are currently down.
     *
     * @example
     * ~~~
     * // is "Left Mouse Button" currently pressed?
     * var lmb = !!Crafty.mouseButtonsDown[Crafty.mouseButtons.LEFT];
     * ~~~
     * @see Mouse, Crafty.mouseButtons, Crafty.mouseDispatch
     */
    mouseButtonsDown: {},

    resetMouseDown: function () {
        // Tell all buttons they're no longer held down
        var focusedElem = Crafty._mouseDispatcher.getFocus();
        var lastEvent = Crafty.lastEvent;

        var buttonsDown = Crafty.mouseButtonsDown;
        for (var button in buttonsDown) {
            if (buttonsDown[button] === true) {
                // TODO once mouse comp iteration fast and separate MouseStates per entity:
                // * trigger MouseUp event on all objs, not just focusedElem
                // * call .resetMouseButtonDown on every focusChange
                // * in this method, use _triggerHintButtonUp from MouseState (doesn't trigger if it doesn't need Up event)
                // * everytime ButtonDown sent to focusedElem, track with _focusedNeedsUp,
                // on triggering check if each entity and system != focusedElem, only send Up to focusedElement if _focusedNeedsUp
                if (focusedElem) {
                    lastEvent.mouseButton = +button; // convert button propertyString to number!
                    lastEvent.eventName = "MouseUp";
                    focusedElem.trigger("MouseUp", lastEvent);
                }

                buttonsDown[button] = false;
            }
        }
    },


    /**@
     * #Crafty.mouseDispatch
     * @category Input
     * @private
     * @kind Method
     *
     * Internal method which dispatches mouse events received by Crafty.
     *
     * This method processes a native [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) received by `Crafty.stage.elem`,
     * augments it with additional properties and
     * dispatches it to the closest (visible & `Mouse`-enhanced) entity to the source of the event (if available).
     *
     * This method also updates `Crafty.lastEvent`.
     *
     * @see Crafty.mouseButtons, Crafty.lastEvent, Mouse
     */
    _mouseDispatcher: (function () {
        var mouseSystem = Crafty.s('Mouse');

        var dispatcher = new EventDispatcher();
        Crafty.extend.call(dispatcher, {
            over: null, // current object that is moused over

            normedEventNames: {
                "mousedown": "MouseDown",
                "mouseup": "MouseUp",
                "dblclick": "DoubleClick",
                "click": "Click",
                "mousemove": "MouseMove"
            },

            prepareEvent: function (e) {
                // Normalize event name
                var type = e.type,
                    eventName = e.eventName = this.normedEventNames[type] || type,
                    mouseButton;

                // Normalize button according to http://unixpapa.com/js/mouse.html
                if (typeof e.which === 'undefined') {
                    mouseButton = e.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button === 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
                } else {
                    mouseButton = e.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which === 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
                }

                // augment mouse event with real coordinates
                Crafty.augmentPointerEvent(e);

                // Track last mouse event and button state
                Crafty.lastEvent = e;
                if (eventName === "MouseDown") {
                    // ignore MouseDown due to inconsistent state caused by loosing focus
                    if (Crafty.mouseButtonsDown[mouseButton] !== true)
                        Crafty.mouseButtonsDown[mouseButton] = true;
                    else
                        return null;
                } else if (eventName === "MouseUp") {
                    // ignore MouseUp due to inconsistent state caused by loosing focus
                    if (Crafty.mouseButtonsDown[mouseButton] === true)
                        Crafty.mouseButtonsDown[mouseButton] = false;
                    else
                        return null;
                }

                return e;
            },

            changeFocus: function (oldFocusElem, newFocusElem) {
                if (this.over && this.over !== newFocusElem) { // old mouseover target wasn't null and is not current focus
                    var lastEvent = Crafty.lastEvent;
                    lastEvent.eventName = "MouseOut";
                    this.over.trigger("MouseOut", lastEvent); // send mouseout
                    this.over = null;
                }

                // TODO enable these once component iteration improved
                //Crafty.s('Mouse').trigger('FocusChange', newFocusElem);
                //Crafty('Mouse').trigger('FocusChange', newFocusElem);
            },

            sendEvent: function (e, focusedElem) {
                var eventName = e.eventName;
                var closest;

                if (focusedElem) {
                    focusedElem.trigger(eventName, e);
                    return;
                }

                // Try to find closest element that will consume mouse event
                if (Crafty.mouseObjs && (closest = Crafty.findPointerEventTargetByComponent("Mouse", e))) {
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
                // If nothing in particular was clicked, the Mouse system should get fed the event
                else {
                    if (eventName === "MouseMove" && this.over) { // if there is still a mouseover target
                        this.over.trigger("MouseOut", e); // send mouseout
                        this.over = null;
                    }

                    // trigger whatever it is
                    mouseSystem.trigger(eventName, e);
                }
            },

            dispatchEvent: function (e, focusedElem) {
                var evt = this.prepareEvent(e);
                if (evt) this.sendEvent(evt, focusedElem);
            }
        });
        return dispatcher;
    })(),


    /**@
     * #Crafty.touchDispatch
     * @category Input
     * @kind Method
     * @private
     *
     * Internal method which dispatches touch events received by Crafty (crafty.stage.elem).
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
    _touchDispatcher: (function () {
        var dispatcher = new EventDispatcher();
        Crafty.extend.call(dispatcher, {

            dispatchEvent: function (e, focusedElem) {
                var touchHandler = this._touchHandler;
                if (touchHandler.multitouch) {
                    if (!Crafty.touchObjs) return;
                    switch (e.type) {
                        case "touchstart":
                            touchHandler.handleStart(e);
                            break;
                        case "touchmove":
                            touchHandler.handleMove(e);
                            break;
                        case "touchleave": // touchleave is treated as touchend
                        case "touchcancel": // touchcancel is treated as touchend, but triggers a TouchCancel event
                        case "touchend":
                            touchHandler.handleEnd(e);
                            break;
                    }
                } else {
                    this.mimicMouse(e);
                }
            },

            _startX: 0, // keeps track of start touch location
            _startY: 0, // keeps track of start touch location

            _touchHandler: {
                fingers: [], // keeps track of touching fingers
                multitouch: false,

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
            },

            mimicMouse: function (e) {
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
                    this._startX = first.clientX;
                    this._startY = first.clientY;
                } else if (type === 'mouseup') {
                    var diffX = first.clientX - this._startX,
                        diffY = first.clientY - this._startY;

                    // make sure that distance between touchstart and touchend smaller than some threshold,
                    // e.g. <= 16 px
                    if ((diffX * diffX + diffY * diffY) <= 256) {
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
        });
        return dispatcher;
    })(),


    /**@
     * #Crafty.findPointerEventTargetByComponent
     * @category Input
     * @kind Method
     *
     * @sign public Object .findPointerEventTargetByComponent(String comp, Number clientX, Number clientY)
     * Finds closest entity with certain component at a given position.
     * @param comp - Component name
     * @param clientX - x coordinate in client space, usually taken from a pointer event
     * @param clientY - y coordinate in client space, usually taken from a pointer event
     * @returns The found entity, or undefined if no entity was found.
     *
     * @sign private Object .findPointerEventTargetByComponent(String comp, Event e)
     * Finds closest entity with certain component at a given event.
     * @param comp - Component name
     * @param e - The pointer event, containing the target and the required properties `clientX` & `clientY`, which will be used as the query point
     * @returns The found entity, or undefined if no entity was found.
     * 
     * This method is used internally by the .mouseDispatch and .touchDispatch methods, but can be used otherwise for 
     * Canvas entities.
     * 
     * Finds the top most entity (with the highest z) with a given component at a given point (x, y).
     * For having a detection area specified for the enity, add the AreaMap component to the entity expected to be found.
     * 
     */
    findPointerEventTargetByComponent: function (comp, x, y) {
        var tar = x.target || x.srcElement || Crafty.stage.elem;
        y = typeof y !== 'undefined' ? y : x.clientY;
        x = typeof x.clientX !== 'undefined' ? x.clientX : x;

        var closest, current, q, l, i, pos, maxz = -Infinity;

        //if it's a DOM element with component we are done
        if (tar.nodeName !== "CANVAS") {
            while (typeof (tar.id) !== 'string' && tar.id.indexOf('ent') === -1) {
                tar = tar.parentNode;
            }
            var ent = Crafty(parseInt(tar.id.replace('ent', ''), 10));
            pos = Crafty.domHelper.translate(x, y, ent._drawLayer);
            if (ent.__c[comp] && ent.isAt(pos.x, pos.y)) {
                closest = ent;
            }
        }

        //else we search for an entity with component
        if (!closest) {

            // Loop through each layer
            for (var layerIndex in Crafty._drawLayers) {
                var layer = Crafty._drawLayers[layerIndex];

                // Skip a layer if it has no entities listening for pointer events
                if (layer._pointerEntities <= 0) continue;

                // Get the position in this layer
                pos = Crafty.domHelper.translate(x, y, layer);
                q = Crafty.map.search({
                    _x: pos.x,
                    _y: pos.y,
                    _w: 1,
                    _h: 1
                }, false);

                for (i = 0, l = q.length; i < l; ++i) {
                    current = q[i];
                    if (current._visible && current._drawLayer === layer && current._globalZ > maxz &&
                        current.__c[comp] && current.isAt(pos.x, pos.y)) {
                        maxz = current._globalZ;
                        closest = current;
                    }
                }
            }
        }

        return closest;
    },

    /**@
     * #Crafty.augmentPointerEvent
     * @category Input
     * @kind Method
     *
     * @sign public Object .augmentPointerEvent(PointerEvent e)
     * @param e - Any pointer event with `clientX` and `clientY` properties, usually a `MouseEvent` or `Touch` object
     * @returns The same event object, augmented with additional `realX` and `realY` properties
     *
     * Updates the passed event object to have two additional properties, `realX` and `realY`,
     * which correspond to the point in actual world space the event happened.
     *
     * This method is used internally by the .mouseDispatch and .touchDispatch methods,
     * but may be used for custom events.
     *
     * @see Crafty.domHelper.translate
     */
    augmentPointerEvent: function (e) {
        // Find the Crafty position in the default coordinate set,
        // disregard the fact that the pointer event was related to a specific layer.
        var pos = Crafty.domHelper.translate(e.clientX, e.clientY);

        // Set the mouse position based on standard viewport coordinates
        e.realX = pos.x;
        e.realY = pos.y;
    },


    /**@
     * #Crafty.mouseWheelDispatch
     * @category Input
     * @kind Method
     * @private
     *
     * Internal method which dispatches mouse wheel events received by Crafty.
     * @trigger MouseWheelScroll - is triggered when mouse is scrolled on stage - { direction: +1 | -1} - Scroll direction (up | down)
     *
     * @note This method processes a native [`wheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/wheel) (all newer browsers),
     * a native [`mousewheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel) (old IE and WebKit browsers) or
     * a native [`DOMMouseScroll` event](https://developer.mozilla.org/en-US/docs/Web/Events/DOMMouseScroll) (old Firefox browsers)
     * received by `Crafty.stage.elem`, augments it with the additional `.direction` property (see below) and
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
    _mouseWheelDispatcher: (function () {
        var dispatcher = new EventDispatcher();
        Crafty.extend.call(dispatcher, {
            dispatchEvent: function (e, focusedElem) {
                // normalize eventName
                e.eventName = "MouseWheelScroll";
                // normalize direction
                e.direction = (e.detail < 0 || e.wheelDelta > 0 || e.deltaY < 0) ? 1 : -1;
                // augment event with real coordinates
                Crafty.augmentPointerEvent(e);

                // trigger event
                Crafty.trigger("MouseWheelScroll", e);
            }
        });
        return dispatcher;
    })(),

    /**@
     * #Crafty.keyboardDispatch
     * @category Input
     * @kind Method
     * @private
     *
     * Internal method which dispatches keyboard events received by Crafty.
     * @trigger KeyDown - is triggered for each entity when the DOM 'keydown' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
     * @trigger KeyUp - is triggered for each entity when the DOM 'keyup' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
     *
     * This method processes a native [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) received by `window.document`,
     * wraps it in a custom event object (for cross-browser compatibility) and dispatches it to the global Crafty object and thus to every entity.
     *
     * This method also updates `Crafty.keydown`.
     *
     * @example
     * ~~~
     * Crafty.bind('KeyDown', function(e) {
     *     if (e.key === Crafty.keys.LEFT_ARROW) {
     *       Crafty.viewport.x++;
     *     } else if (e.key === Crafty.keys.RIGHT_ARROW) {
     *       Crafty.viewport.x--;
     *     } else if (e.key === Crafty.keys.UP_ARROW) {
     *       Crafty.viewport.y++;
     *     } else if (e.key === Crafty.keys.DOWN_ARROW) {
     *       Crafty.viewport.y--;
     *     }
     *   });
     * ~~~
     *
     * @see Crafty.keys, Crafty.keydown, Keyboard
     */
    _keyboardDispatcher: (function () {
        var dispatcher = new EventDispatcher();
        Crafty.extend.call(dispatcher, {
            // evt object to reuse
            _evt: { key: 0, which: 0, originalEvent: null },

            prepareEvent: function (e) {
                // Normalize event name
                var type = e.type,
                    eventName = type === "keydown" ? "KeyDown" :
                            type === "keyup" ? "KeyUp" : type;

                // Normalize key to avoid cross-browser issues
                // Original key event's properties are read-only, use Crafty-standard wrapping event object
                var evt = this._evt;
                evt.originalEvent = e;
                evt.eventName = eventName;
                evt.which = e.charCode !== null ? e.charCode : e.keyCode;
                var key = evt.key = e.keyCode || e.which;

                // Track key state
                if (eventName === "KeyDown") {
                    // ignore KeyDown due to inconsistent state caused by loosing focus
                    if (Crafty.keydown[key] !== true)
                        Crafty.keydown[key] = true;
                    else
                        return null;
                } else if (eventName === "KeyUp") {
                    // ignore KeyUp due to inconsistent state caused by loosing focus
                    if (Crafty.keydown[key] === true)
                        Crafty.keydown[key] = false;
                    else
                        return null;
                }

                return evt;
            },

            changeFocus: function (oldFocusElem, newFocusElem) {
                // TODO enable these once component iteration improved
                //Crafty.s('Keyboard').trigger('FocusChange', newFocusElem);
                //Crafty('Keyboard').trigger('FocusChange', newFocusElem);
            },

            sendEvent: function (e, focusedElem) {
                var eventName = e.eventName;

                if (focusedElem) {
                    focusedElem.trigger(eventName, e);
                } else {
                    // TODO instead of global trigger, trigger on KeySystem and all entities with Keyboard component
                    Crafty.trigger(eventName, e);
                }
            },

            dispatchEvent: function (e, focusedElem) {
                var evt = this.prepareEvent(e);
                if (evt) this.sendEvent(evt, focusedElem);
            }
        });
        return dispatcher;
    })()
});

// figure out which eventName to listen to for mousewheel events
var mouseWheelEvent = typeof document.onwheel !== 'undefined' ? 'wheel' : // modern browsers
                        typeof document.onmousewheel !== 'undefined' ? 'mousewheel' : // old Webkit and IE
                        'DOMMouseScroll'; // old Firefox

//initialize the input events onload
Crafty._preBind("Load", function () {
    Crafty.addEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.addEvent(this, window, "blur", Crafty.resetKeyDown);
    Crafty.addEvent(this, window, "mouseup", Crafty.resetMouseDown);

    Crafty.addEvent(this._keyboardDispatcher, "keydown", this._keyboardDispatcher.processEvent);
    Crafty.addEvent(this._keyboardDispatcher, "keyup", this._keyboardDispatcher.processEvent);

    Crafty.addEvent(this._mouseDispatcher, Crafty.stage.elem, "mousedown", this._mouseDispatcher.processEvent);
    Crafty.addEvent(this._mouseDispatcher, Crafty.stage.elem, "mouseup", this._mouseDispatcher.processEvent);
    Crafty.addEvent(this._mouseDispatcher, Crafty.stage.elem, "mousemove", this._mouseDispatcher.processEvent);
    Crafty.addEvent(this._mouseDispatcher, Crafty.stage.elem, "click", this._mouseDispatcher.processEvent);
    Crafty.addEvent(this._mouseDispatcher, Crafty.stage.elem, "dblclick", this._mouseDispatcher.processEvent);

    Crafty.addEvent(this._touchDispatcher, Crafty.stage.elem, "touchstart", this._touchDispatcher.processEvent);
    Crafty.addEvent(this._touchDispatcher, Crafty.stage.elem, "touchmove", this._touchDispatcher.processEvent);
    Crafty.addEvent(this._touchDispatcher, Crafty.stage.elem, "touchend", this._touchDispatcher.processEvent);
    Crafty.addEvent(this._touchDispatcher, Crafty.stage.elem, "touchcancel", this._touchDispatcher.processEvent);
    Crafty.addEvent(this._touchDispatcher, Crafty.stage.elem, "touchleave", this._touchDispatcher.processEvent);

    Crafty.addEvent(this._mouseWheelDispatcher, Crafty.stage.elem, mouseWheelEvent, this._mouseWheelDispatcher.processEvent);
});

Crafty.bind("Pause", function () {
    // Reset pressed keys and buttons
    Crafty.resetKeyDown();
    Crafty.resetMouseDown();
});

Crafty._preBind("CraftyStop", function () {
    // Reset pressed keys and buttons
    Crafty.resetKeyDown();
    Crafty.resetMouseDown();
});

Crafty._preBind("CraftyStop", function () {
    Crafty.removeEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.removeEvent(this, window, "blur", Crafty.resetKeyDown);
    Crafty.removeEvent(this, window, "mouseup", Crafty.resetMouseDown);

    Crafty.removeEvent(this._keyboardDispatcher, "keydown", this._keyboardDispatcher.processEvent);
    Crafty.removeEvent(this._keyboardDispatcher, "keyup", this._keyboardDispatcher.processEvent);

    if (Crafty.stage) {
        Crafty.removeEvent(this._mouseDispatcher, Crafty.stage.elem, "mousedown", this._mouseDispatcher.processEvent);
        Crafty.removeEvent(this._mouseDispatcher, Crafty.stage.elem, "mouseup", this._mouseDispatcher.processEvent);
        Crafty.removeEvent(this._mouseDispatcher, Crafty.stage.elem, "mousemove", this._mouseDispatcher.processEvent);
        Crafty.removeEvent(this._mouseDispatcher, Crafty.stage.elem, "click", this._mouseDispatcher.processEvent);
        Crafty.removeEvent(this._mouseDispatcher, Crafty.stage.elem, "dblclick", this._mouseDispatcher.processEvent);

        Crafty.removeEvent(this._touchDispatcher, Crafty.stage.elem, "touchstart", this._touchDispatcher.processEvent);
        Crafty.removeEvent(this._touchDispatcher, Crafty.stage.elem, "touchmove", this._touchDispatcher.processEvent);
        Crafty.removeEvent(this._touchDispatcher, Crafty.stage.elem, "touchend", this._touchDispatcher.processEvent);
        Crafty.removeEvent(this._touchDispatcher, Crafty.stage.elem, "touchcancel", this._touchDispatcher.processEvent);
        Crafty.removeEvent(this._touchDispatcher, Crafty.stage.elem, "touchleave", this._touchDispatcher.processEvent);

        Crafty.removeEvent(this._mouseWheelDispatcher, Crafty.stage.elem, mouseWheelEvent, this._mouseWheelDispatcher.processEvent);
    }
});





/**@
 * #Mouse
 * @category Input
 * @kind Component
 *
 * Provides the entity with mouse events.
 * Mouse events get dispatched to the closest (visible & `Mouse`-enhanced) entity to the source of the event (if available).
 * If there is no such entity, the MouseSystem receives the event instead.
 * @note If you do not add this component, mouse events will not be triggered on the entity.
 *
 * Inherits methods and events from the `MouseState` component.
 *
 * Additionally, this component can provide exclusive access to MouseEvents.
 * If the events are locked onto this entity, no other entity or system will receive MouseEvents.
 *
 * @note If you're targeting mobile, you should know that by default Crafty turns touch events into mouse events, 
 * making mouse dependent components work with touch. However, if you need multitouch, you'll have 
 * to make use of the Touch component instead, which can break compatibility with things which directly interact with the Mouse component.
 *
 * @see MouseState, MouseSystem
 * @see Crafty.mouseDispatch
 * @see Crafty.multitouch
 * @see Crafty.touchDispatch
 */
Crafty.c("Mouse", {
    required: "MouseState, AreaMap",
    init: function () {
        Crafty.mouseObjs++;
    },
    remove: function() {
        Crafty.mouseObjs--;
    },

    /**@
     * #.lockMouse
     * @comp Mouse
     * @kind Method
     *
     * @sign public Boolean .lockMouse()
     * @returns A boolean indicating whether the lock has been acquired
     *
     * Make all mouse events be received by the entity exclusively.
     * Locking may fail if another entity or system acquired the lock already. In that case `false` will be returned.
     *
     * @example
     * ~~~
     * // Create a component that allows painting with the mouse inside the entity
     * // This component will lock mouse events to itself when the mouse is clicked or dragged inside the entity
     * // No other entities, including e.g. "Draggable" entities, can interfere accidentally while a lock is in effect
     * Crafty.c("Paint", {
     *     required: "2D, Canvas, Mouse",
     *
     *     _points: null,
     *
     *     ready: false,
     *
     *     events: {
     *         // see https://github.com/craftyjs/Crafty/wiki/Crafty-FAQ-(draft)
     *         // for details on Canvas drawing
     *         "Draw": function (e) { // paint the path
     *             var points = this._points;
     *             if (points.length < 2*2) return;
     *
     *             var ctx = e.ctx;
     *             ctx.lineWidth = 2;
     *             ctx.strokeStyle = "orange";
     *             ctx.beginPath();
     *
     *             ctx.moveTo(points[0], points[1]);
     *             for (var i = 2, l = points.length; i < l; i += 2) {
     *                 ctx.lineTo(points[i], points[i + 1]);
     *             }
     *
     *             ctx.stroke();
     *         },
     *
     *         "MouseDown": function (e) {
     *             // process LMB clicks only
     *             if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
     *
     *             // start the painting process
     *             if (!this.ready && this.lockMouse()) { // painting procedure was not already started and lock is successfully acquired
     *                 this._points = []; // reset path to be painted
     *                 this.ready = true; // notify the render code that this component is ready to be drawn
     *             }
     *         },
     *         "MouseMove": function (e) {
     *             // continue only if paiting procedure started
     *             if (!this.ready) return;
     *
     *             // painting process
     *             this._points.push(e.realX, e.realY); // add points to the path to be painted
     *             this.trigger("Invalidate");  // notify the render code that this component's appearance changed
     *         },
     *         "MouseUp": function (e) {
     *             // process LMB clicks only
     *             if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
     *
     *             // stop the painting process
     *             if (this.ready && this.releaseMouse()) { // painting procedure was not already started and lock is successfully acquired
     *                 this.one('PostRender', function() { // notify the render code that this component requires no drawing, but do this not before next render
     *                     this.ready = false;
     *                 });
     *             }
     *         }
     *     }
     * });
     *
     * // Make an entity with the Paint component
     * // span it across the whole viewport
     * Crafty.e("Paint").attr({
     *     w: Crafty.viewport._width,
     *     h: Crafty.viewport._height
     * });
     * ~~~
     *
     * @see .releaseMouse
     */
    lockMouse: function() {
        return Crafty._mouseDispatcher.lockFocus(this);
    },

    /**@
     * #.releaseMouse
     * @comp Mouse
     * @kind Method
     *
     * @sign public Boolean .releaseMouse()
     * @returns A boolean indicating whether the lock has been released
     *
     * Stop all mouse events from being received by the entity exclusively.
     * Releasing may fail if another entity or system acquired the lock. In that case `false` will be returned.
     *
     * @see .lockMouse
     */
    releaseMouse: function() {
        return Crafty._mouseDispatcher.releaseFocus(this);
    }
});

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
 * @see Crafty.touchDispatch
 */
Crafty.c("Touch", {
    required: "AreaMap",
    init: function () {
        Crafty.touchObjs++;
    },
    remove: function () {
        Crafty.touchObjs--;
    }
});

/**@
 * #AreaMap
 * @category Input
 * @kind Component
 * 
 * Component used by Mouse and Touch.
 * Can be added to other entities for use with the Crafty.findClosestEntityByComponent method.
 * 
 * @see Button
 * @see Crafty.polygon
 */
Crafty.c("AreaMap", {
    init: function () {
        if (this.has("Renderable") && this._drawLayer) {
            this._drawLayer._pointerEntities++;
        }
    },

    remove: function () {
        if (this.has("Renderable") && this._drawLayer) {
            this._drawLayer._pointerEntities--;
        }
    },

    events: {
        "LayerAttached": function (layer) {
            layer._pointerEntities++;
        },
        "LayerDetached": function (layer) {
            layer._pointerEntities--;
        }
    },

    /**@
     * #.areaMap
     * @comp AreaMap
     * @kind Method
     *
     * @trigger NewAreaMap - when a new areaMap is assigned - Crafty.polygon
     *
     * @sign public this .areaMap(Crafty.polygon polygon)
     * @param polygon - Instance of Crafty.polygon used to check if the mouse coordinates are inside this region
     *
     * @sign public this .areaMap(Array coordinatePairs)
     * @param coordinatePairs - Array of `x`, `y` coordinate pairs to generate a polygon
     *
     * @sign public this .areaMap(x1, y1,.., xN, yN)
     * @param point# - List of `x`, `y` coordinate pairs to generate a polygon
     *
     * Assign a polygon to the entity so that pointer (mouse or touch) events will only be triggered if
     * the coordinates are inside the given polygon.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Mouse")
     *     .color("red")
     *     .attr({ w: 100, h: 100 })
     *     .bind('MouseOver', function() {Crafty.log("over")})
     *     .areaMap(0, 0, 50, 0, 50, 50, 0, 50);
     *
     * Crafty.e("2D, Mouse")
     *     .areaMap([0, 0, 50, 0, 50, 50, 0, 50]);
     *
     * Crafty.e("2D, Mouse").areaMap(
     *     new Crafty.polygon([0, 0, 50, 0, 50, 50, 0, 50])
     * );
     * ~~~
     *
     * @see Crafty.polygon
     */
    areaMap: function (poly) {
        //create polygon
        if (arguments.length > 1) {
            //convert args to array to create polygon
            var args = Array.prototype.slice.call(arguments, 0);
            poly = new Crafty.polygon(args);
        } else if (poly.constructor === Array) {
            poly = new Crafty.polygon(poly.slice());
        } else {
            poly = poly.clone();
        }

        poly.shift(this._x, this._y);
        this.mapArea = poly;
        this.attach(this.mapArea);
        this.trigger("NewAreaMap", poly);
        return this;
    }
});

/**@
 * #Button
 * @category Input
 * @kind Component
 * 
 * Provides the entity with touch or mouse functionality, depending on whether this is a pc 
 * or mobile device, and also on multitouch configuration.
 *
 * @see Mouse
 * @see Touch
 * @see Crafty.multitouch
 */
Crafty.c("Button", {
    init: function () {
        var req = (!Crafty.mobile || (Crafty.mobile && !Crafty.multitouch())) ? "Mouse" : "Touch";
        this.requires(req);
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
        "MouseDown": function (e) {
            if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
            if (this.lockMouse()) this.startDrag(e);
        },
        "MouseMove": function (e) {
            // ignore invalid 0 position - strange problem on ipad
            if (!this._dragging || e.realX === 0 || e.realY === 0) return false;
            this.trigger("Dragging", e);
        },
        "MouseUp": function (e) {
            if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
            if (this.releaseMouse()) this.stopDrag(e);
        }
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

        // if event undefined, use the last known position of the mouse
        this.trigger("StartDrag", e || Crafty.lastEvent);
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

        // if event undefined, use the last known position of the mouse
        this.trigger("StopDrag", e || Crafty.lastEvent);
        return this;
    }
});



/**@
 * #Keyboard
 * @category Input
 * @kind Component
 *
 * Provides entity with keyboard events.
 * Keyboard events get dispatched to all entities that have the Keyboard component and to the KeyboardSystem itself.
 * @note If you do not add this component, key events will not be triggered on the entity.
 *
 * Inherits methods and events from the `KeyboardState` component.
 *
 * Additionally, this component can provide exclusive access to KeyEvents.
 * If the events are locked onto this entity, no other entity or system will receive KeyEvents.
 *
 * @see KeyboardState, KeyboardSystem
 * @see Crafty.keyboardDispatch
 */
Crafty.c("Keyboard", {
    required: "KeyboardState",

    /**@
     * #.lockKeyboard
     * @comp Keyboard
     * @kind Method
     *
     * @sign public Boolean .lockKeyboard()
     * @returns A boolean indicating whether the lock has been acquired
     *
     * Make all keyboard events be received by the entity exclusively.
     * Locking may fail if another entity or system acquired the lock already. In that case `false` will be returned.
     *
     * @example
     * ~~~
     * var started = false;
     *
     * // This entity moves randomly and bounces off viewport borders.
     * // It will acquire the lock once the Mouse is pointed over it.
     * // However, if you fail to keep the Mouse pointed at it, it will loose focus and release the lock.
     * //
     * Crafty.e("2D, DOM, Color, Keyboard, Mouse, Motion")
     *     .attr({ // place it in the middle of viewport
     *         x: Crafty.viewport._width / 2 - 32, w: 64,
     *         y: Crafty.viewport._height / 2 - 32, h: 64,
     *         lastMoveDT: 0
     *     })
     *     .color('blue')
     *     .bind('Moved', function() { // bounce off borders
     *         if (this.x < 0) {
     *             this.vx = Crafty.math.abs(this.vx);
     *         } else if (this.x + this.w > Crafty.viewport._width) {
     *             this.vx = -Crafty.math.abs(this.vx);
     *         }
     *
     *         if (this.y < 0) {
     *             this.vy = Crafty.math.abs(this.vy);
     *         } else if (this.y + this.h > Crafty.viewport._height) {
     *             this.vy = -Crafty.math.abs(this.vy);
     *         }
     *     })
     *     .bind('EnterFrame', function(frame) { // after a random amount of time, set a random direction for the entity to move
     *         if (this.lastMoveDT > Crafty.math.randomInt(1000, 3000)) {
     *             this.vx = Crafty.math.randomInt(-150, 150);
     *             this.vy = Crafty.math.randomInt(-150, 150);
     *             this.lastMoveDT = 0;
     *         }
     *         this.lastMoveDT += frame.dt;
     *     })
     *     .bind('MouseOver', function() {
     *         this.lockKeyboard(); // once the mouse points over entity, acquire the lock
     *         started = true; // let the game of concentration begin!
     *     })
     *     .bind('MouseOut', function() {
     *         this.releaseKeyboard(); // once the mouse no longer points at the entity, release the lock
     *     });
     *
     * // This system will try to steal the lock in each frame, resulting in an explosion!
     * Crafty.s("HotWire", {
     *     events: {
     *         "EnterFrame": function() {
     *             if (started && Crafty.s('Keyboard').lockKeyboard(this)) {
     *                 alert('Kaboom!');
     *             }
     *         }
     *     }
     * }, {}, false);
     * ~~~
     *
     * @see .releaseKeyboard
     */
    lockKeyboard: function() {
        return Crafty._keyboardDispatcher.lockFocus(this);
    },

    /**@
     * #.releaseKeyboard
     * @comp Keyboard
     * @kind Method
     *
     * @sign public Boolean .releaseKeyboard()
     * @returns A boolean indicating whether the lock has been released
     *
     * Stop all keyboard events from being received by the entity exclusively.
     * Releasing may fail if another entity or system acquired the lock. In that case `false` will be returned.
     *
     * @see .lockKeyboard
     */
    releaseKeyboard: function() {
        return Crafty._keyboardDispatcher.releaseFocus(this);
    }
});
