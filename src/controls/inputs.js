var Crafty = require('../core/core.js'),
    document = window.document;

Crafty.extend({
    over: null, //object mouseover, waiting for out
    mouseObjs: 0,
    mousePos: {},   
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
     * @see Crafty.stage#Crafty.stage.elem
     */
    selected: false,

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
        if (typeof bool !== "boolean") return this._touchHandler.multitouch;
        this._touchHandler.multitouch = bool;
    },

    resetKeyDown: function () {
        // Tell all the keys they're no longer held down
        for (var k in Crafty.keys) {
            if (Crafty.keydown[Crafty.keys[k]]) {
                this.trigger("KeyUp", {
                    key: Crafty.keys[k]
                });
            }
        }

        Crafty.keydown = {};
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
    mouseButtonsDown: {    },
    mouseDispatch: function (e) {
        if (!Crafty.mouseObjs) return;
        Crafty.lastEvent = e;

        var tar = e.target ? e.target : e.srcElement,
            closest,
            pos = Crafty.domHelper.translate(e.clientX, e.clientY),
            type = e.type;

        //Normalize button according to http://unixpapa.com/js/mouse.html
        if (typeof e.which === 'undefined') {
            e.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button === 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        } else {
            e.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which === 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        }

        // Set the mouse position based on standard viewport coordinates
        Crafty.mousePos.x = pos.x;
        Crafty.mousePos.y = pos.y;

        // Track button state
        if (type === "mousedown") {
            this.mouseButtonsDown[e.mouseButton] = true;
        }
        if (type === "mouseup") {
            delete this.mouseButtonsDown[e.mouseButton];
        }

        closest = Crafty.findPointerEventTargetByComponent("Mouse", e, tar);
        //found closest object to mouse
        if (closest) {
            //click must mousedown and out on tile
            if (type === "mousedown") {
                closest.trigger("MouseDown", e);
            } else if (type === "mouseup") {
                closest.trigger("MouseUp", e);
            } else if (type === "dblclick") {
                closest.trigger("DoubleClick", e);
            } else if (type === "click") {
                closest.trigger("Click", e);
            } else if (type === "mousemove") {
                closest.trigger("MouseMove", e);
                if (this.over !== closest) { //if new mousemove, it is over
                    if (this.over) { 
                        this.over.trigger("MouseOut", e); //if over wasn't null, send mouseout
                        this.over = null;
                    }
                    this.over = closest;
                    closest.trigger("MouseOver", e);
                }
            } else closest.trigger(type, e); //trigger whatever it is
        } else {
            if (type === "mousemove" && this.over) {
                this.over.trigger("MouseOut", e);
                this.over = null;
            }
            if (type === "mousedown") {
                Crafty.viewport.mouselook('start', e);
            } else if (type === "mousemove") {
                Crafty.viewport.mouselook('drag', e);
            } else if (type === "mouseup") {
                Crafty.viewport.mouselook('stop');
            }

            // If nothing in particular was clicked, the controls system should get fed the event
            if (type === "mousedown") {
                Crafty.s("Controls").trigger("MouseDown", e);
            } else if (type === "mouseup") {
                Crafty.s("Controls").trigger("MouseUp", e);
            } else if (type === "dblclick") {
                Crafty.s("Controls").trigger("DoubleClick", e);
            } else if (type === "click") {
                Crafty.s("Controls").trigger("Click", e);
            }
        }

        if (type === "mousemove") {
            this.lastEvent = e;
        }

    },


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
    touchDispatch: function (e) {
        if (!Crafty.touchObjs && !Crafty.mouseObjs) return;

        if (this._touchHandler.multitouch)
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
        else
            this._touchHandler.mimicMouse(e);

        //Don't prevent default actions if target node is input or textarea.
        if (e.target && e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA')
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
    },

    _touchHandler: {
        fingers: [], // keeps track of touching fingers
        multitouch: false,

        handleStart: function (e) {
            var touches = e.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                var idx = false,
                    tar = e.target ? e.target : e.srcElement,
                    closest;
                closest = this.findClosestTouchEntity(touches[i], tar);

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
                var idx = this.fingerDownIndexById(touches[i].identifier),
                    tar = e.target ? e.target : e.srcElement;
                var closest = this.findClosestTouchEntity(touches[i], tar);

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

        findClosestTouchEntity: function (touchEvent, tar) {
            return Crafty.findPointerEventTargetByComponent("Touch", touchEvent, tar);
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
        },

        mimicMouse: function (e) {
            var type, first,
                lastEvent = Crafty.lastEvent;
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
            if (lastEvent !== null && lastEvent.type === 'mousedown' && type === 'mouseup') {
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
        },
    },

    /**@
     * #Crafty.findPointerEventTargetByComponent
     * @category Input
     * @kind Method
     * @private
     * 
     * @sign public this .findPointerEventTargetByComponent(String comp, Event e[, Object target])
     * Finds closest entity with certain component at a given event.
     * @param comp - Component name
     * @param e - The pointer event, which will be modifed to add `realX` and `realY` properties 
     * @param target - Target element wherein to look for entities 
     * 
     * This method is used internally by the .mouseDispatch and .touchDispatch methods, but can be used otherwise for 
     * Canvas entities.
     * 
     * Finds the top most entity (with the highest z) with a given component at a given point (x, y) associated with the event.
     * For having a detection area specified for the enity, add the AreaMap component to the entity expected to be found.
     * 
     * The 'target' argument is only meant to be used by .mouseDispatch and touchDispatch; defaults to Crafty.stage.elem, 
     * thus using this function directly is only worth anything for canvas entities.
     * 
     * Returns the found entity, or undefined if no entity was found.  
     * Updates the event object to have two additional properties, `realX` and `realY`, which correspond to the point in the Crafty layer that the event targeted.
     * 
     */
    findPointerEventTargetByComponent: function (comp, e, target) {
        var tar = target ? target : Crafty.stage.elem,
            closest, current, q, l, i, pos, layerPos, maxz = -Infinity;
        var x = e.clientX;
        var y = e.clientY;

        //if it's a DOM element with component we are done
        if (tar.nodeName !== "CANVAS") {
            while (typeof (tar.id) !== 'string' && tar.id.indexOf('ent') === -1) {
                tar = tar.parentNode;
            }
            var ent = Crafty(parseInt(tar.id.replace('ent', ''), 10));
            pos = Crafty.domHelper.translate(x, y, ent._drawLayer);
            if (ent.__c[comp] && ent.isAt(pos.x, pos.y)) {
                closest = ent;
                layerPos = pos;
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
                        layerPos = pos;
                    }
                }
            }
        }
        
        // If the pointer event isn't related to a specific layer, 
        // find the Crafty position in the default coordinate set
        if (!layerPos) {
            layerPos = Crafty.domHelper.translate(x, y);
        }

        // Update the event coordinates and return the event target
        e.realX = layerPos.x;
        e.realY = layerPos.y;
            
        return closest;
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
     * This method processes a native [`mousewheel` event](https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel) (all browsers except Firefox)
     * or a native [`DOMMouseScroll` event](https://developer.mozilla.org/en-US/docs/Web/Events/DOMMouseScroll) (Firefox only) received by `Crafty.stage.elem`,
     * augments it with the additional `.direction` property (see below) and dispatches it to the global Crafty object and thus to every entity.
     *
     * Note that the wheel delta properties of the event vary in magnitude across browsers, thus it is recommended to check for `.direction` instead.
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
    mouseWheelDispatch: function (e) {
        e.direction = (e.detail < 0 || e.wheelDelta > 0) ? 1 : -1;
        Crafty.trigger("MouseWheelScroll", e);
    },

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
    keyboardDispatch: function (e) {
        // Use a Crafty-standard event object to avoid cross-browser issues
        var original = e,
            evnt = {},
            props = "char charCode keyCode type shiftKey ctrlKey metaKey timestamp".split(" ");
        for (var i = props.length; i;) {
            var prop = props[--i];
            evnt[prop] = original[prop];
        }
        evnt.which = original.charCode !== null ? original.charCode : original.keyCode;
        evnt.key = original.keyCode || original.which;
        evnt.originalEvent = original;
        e = evnt;

        if (e.type === "keydown") {
            if (Crafty.keydown[e.key] !== true) {
                Crafty.keydown[e.key] = true;
                Crafty.trigger("KeyDown", e);
            }
        } else if (e.type === "keyup") {
            delete Crafty.keydown[e.key];
            Crafty.trigger("KeyUp", e);
        }

        //prevent default actions for all keys except backspace and F1-F12 and except actions in INPUT and TEXTAREA.
        //prevent bubbling up for all keys except backspace and F1-F12.
        //Among others this prevent the arrow keys from scrolling the parent page
        //of an iframe hosting the game
        if (Crafty.selected && !(e.key === 8 || e.key >= 112 && e.key <= 135)) {
            if (original.stopPropagation) original.stopPropagation();
            else original.cancelBubble = true;

            //Don't prevent default actions if target node is input or textarea.
            if (original.target && original.target.nodeName !== 'INPUT' && original.target.nodeName !== 'TEXTAREA') {
                if (original.preventDefault) {
                    original.preventDefault();
                } else {
                    original.returnValue = false;
                }
            }
            return false;
        }
    }
});

//initialize the input events onload
Crafty._preBind("Load", function () {
    Crafty.addEvent(this, "keydown", Crafty.keyboardDispatch);
    Crafty.addEvent(this, "keyup", Crafty.keyboardDispatch);

    Crafty.addEvent(this, Crafty.stage.elem, "mousedown", Crafty.mouseDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "mouseup", Crafty.mouseDispatch);
    Crafty.addEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.addEvent(this, window, "blur", Crafty.resetKeyDown);
    Crafty.addEvent(this, Crafty.stage.elem, "mousemove", Crafty.mouseDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "click", Crafty.mouseDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "dblclick", Crafty.mouseDispatch);

    Crafty.addEvent(this, Crafty.stage.elem, "touchstart", Crafty.touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchmove", Crafty.touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchend", Crafty.touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchcancel", Crafty.touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchleave", Crafty.touchDispatch);

    if (Crafty.support.prefix === "Moz") // mouse wheel event for firefox
        Crafty.addEvent(this, Crafty.stage.elem, "DOMMouseScroll", Crafty.mouseWheelDispatch);
    else // mouse wheel event for rest of browsers
        Crafty.addEvent(this, Crafty.stage.elem, "mousewheel", Crafty.mouseWheelDispatch);
});

Crafty._preBind("CraftyStop", function () {
    Crafty.removeEvent(this, "keydown", Crafty.keyboardDispatch);
    Crafty.removeEvent(this, "keyup", Crafty.keyboardDispatch);

    if (Crafty.stage) {
        Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", Crafty.mouseDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", Crafty.mouseDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", Crafty.mouseDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "click", Crafty.mouseDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "dblclick", Crafty.mouseDispatch);

        Crafty.removeEvent(this, Crafty.stage.elem, "touchstart", Crafty.touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchmove", Crafty.touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchend", Crafty.touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchcancel", Crafty.touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchleave", Crafty.touchDispatch);

        if (Crafty.support.prefix === "Moz") // mouse wheel event for firefox
            Crafty.removeEvent(this, Crafty.stage.elem, "DOMMouseScroll", Crafty.mouseWheelDispatch);
        else // mouse wheel event for rest of browsers
            Crafty.removeEvent(this, Crafty.stage.elem, "mousewheel", Crafty.mouseWheelDispatch);
    }

    Crafty.removeEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.removeEvent(this, window, "blur", Crafty.resetKeyDown);
});

/**@
 * #Mouse
 * @category Input
 * @kind Component
 *
 * Provides the entity with mouse related events.
 *
 * If you do not add this component, mouse events will not be triggered on the entity.
 *
 * @trigger MouseOver - when the mouse enters - MouseEvent
 * @trigger MouseOut - when the mouse leaves - MouseEvent
 * @trigger MouseDown - when the mouse button is pressed on - MouseEvent
 * @trigger MouseUp - when the mouse button is released on - MouseEvent
 * @trigger Click - when the user clicks - MouseEvent
 * @trigger DoubleClick - when the user double clicks - MouseEvent
 * @trigger MouseMove - when the mouse is over and moves - MouseEvent
 *
 * The event callbacks are triggered with a native [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) parameter,
 * which is further augmented with additional properties:
 * ~~~
 * //(x,y) coordinates of mouse event in web-browser (screen) space
 * e.clientX
 * e.clientY
 *
 * //(x,y) coordinates of mouse event in world (default viewport) space
 * e.realX
 * e.realY
 *
 * // Normalized mouse button according to Crafty.mouseButtons:
 * // Crafty.mouseButtons.LEFT, Crafty.mouseButtons.RIGHT or Crafty.mouseButtons.MIDDLE
 * e.mouseButton
 * ~~~
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
 * @see Crafty.mouseButtons
 * @see Crafty.mouseDispatch
 * @see Crafty.multitouch
 * @see Crafty.touchDispatch
 */
Crafty.c("Mouse", {
    init: function () {
        Crafty.mouseObjs++;
        this.requires("AreaMap")
            .bind("Remove", function () {
                Crafty.mouseObjs--;
            });
    }
});

/**@
 * #Touch
 * @category Input
 * @kind Component
 * Provides the entity with touch related events
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
    init: function () {
        Crafty.touchObjs++;
        this.requires("AreaMap")
            .bind("Remove", function () {
                Crafty.touchObjs--;
            });
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

    init: function () {
        this.requires("Mouse");
        this.bind("MouseDown", this._ondown);
    },

    remove: function () {
        this.unbind("MouseDown", this._ondown);
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

        Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
        Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);

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
 * @trigger KeyDown - is triggered for each entity when the DOM 'keydown' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
 * @trigger KeyUp - is triggered for each entity when the DOM 'keyup' event is triggered. - { key: `Crafty.keys` keyCode (Number), originalEvent: original KeyboardEvent } - Crafty's KeyboardEvent
 *
 * In addition to binding to these events, the current state (pressed/released) of a key can also be queried using the `.isDown` method.
 *
 * @example
 * ~~~
 * Crafty.e("2D, DOM, Color, Keyboard")
 *   .attr({x: 100, y: 100, w: 50, h: 50})
 *   .color("red")
 *   .bind('KeyDown', function(e) {
 *     if (e.key == Crafty.keys.LEFT_ARROW) {
 *       this.x = this.x-1;
 *     } else if (e.key == Crafty.keys.RIGHT_ARROW) {
 *       this.x = this.x+1;
 *     } else if (e.key == Crafty.keys.UP_ARROW) {
 *       this.y = this.y-1;
 *     } else if (e.key == Crafty.keys.DOWN_ARROW) {
 *       this.y = this.y+1;
 *     }
 *   });
 * ~~~
 *
 * @see Crafty.keys
 * @see Crafty.keydown
 * @see Crafty.keyboardDispatch
 */
Crafty.c("Keyboard", {
    /**@
     * #.isDown
     * @comp Keyboard
     * @kind Method
     * 
     * @sign public Boolean isDown(String keyName)
     * @param keyName - Name of the key to check. See `Crafty.keys`.
     * @sign public Boolean isDown(Number keyCode)
     * @param keyCode - Key code in `Crafty.keys`.
     *
     * Determine if a certain key is currently down.
     *
     * @example
     * ~~~
     * ent.requires('Keyboard')
     *    .bind('EnterFrame', function() {
     *       if (this.isDown('SPACE'))
     *          this.y--;
     *    });
     * ~~~
     *
     * @see Crafty.keys
     */
    isDown: function (key) {
        if (typeof key === "string") {
            key = Crafty.keys[key];
        }
        return !!Crafty.keydown[key];
    }
});