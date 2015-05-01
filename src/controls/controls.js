var Crafty = require('../core/core.js'),
    document = window.document;

Crafty.extend({
    over: null, //object mouseover, waiting for out
    mouseObjs: 0,
    mousePos: {},
    lastEvent: null,
    touchObjs: 0,
    keydown: {},
    selected: false,

    /**@
     * #Crafty.keydown
     * @category Input
     * Remembering what keys (referred by Unicode) are down.
     *
     * @example
     * ~~~
     * Crafty.c("Keyboard", {
     *   isDown: function (key) {
     *     if (typeof key === "string") {
     *       key = Crafty.keys[key];
     *     }
     *     return !!Crafty.keydown[key];
     *   }
     * });
     * ~~~
     * @see Keyboard, Crafty.keys
     */
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
     * @sign public this .multitouch([Boolean bool])
     * @param bool - Turns multitouch on and off (default is off - false)
     * @sign public this .multitouch()
     * Enables/disables support for multitouch feature.
     * 
     * If this is set to true, it is expected that your entities have the Touch component instead of Mouse component.
     * If false (default), then only entities with the Mouse component will respond to touch.
     * If no boolean is passed to the function call, it will just return whether multitouch is on or not.
     * 
     * Notice that the Touch component (and multitouch feature) is incompatible with the Draggable component or other 
     * mouse dependent stuff.
     * 
     * ~~~
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
     * console.log("multitouch is "+Crafty.multitouch());
     * ~~~
     * @see Crafty.touchDispatch
     */
    multitouch: function (bool) {
        if (typeof bool !== "boolean") return this._touchHandler.multitouch;
        this._touchHandler.multitouch = bool;
    },
    
    resetKeyDown: function() {
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
     *
     * Internal method which dispatches mouse events received by Crafty (crafty.stage.elem).
     * The mouse events get dispatched to the closest entity to the source of the event (if available).
     *
     * You can read more about the MouseEvent, which is the parameter passed to the callback.
     * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     *
     * This method also sets a global property Crafty.lastEvent, which holds the most recent event that
     * occured (useful for determining mouse position in every frame).
     * 
     * ~~~
     * @example
     * ~~~
     * var newestX = Crafty.lastEvent.realX,
     *     newestY = Crafty.lastEvent.realY;
     * ~~~
     * 
     * Notable properties of a MouseEvent e:
     * ~~~
     * //(x,y) coordinates of mouse event in web browser screen space
     * e.clientX, e.clientY
     * //(x,y) coordinates of mouse event in world/viewport space
     * e.realX, e.realY
     * // Normalized mouse button according to Crafty.mouseButtons
     * e.mouseButton
     * ~~~
     * @see Crafty.touchDispatch
     * @see Crafty.multitouch
     */
    mouseDispatch: function (e) {

        if (!Crafty.mouseObjs) return;
        Crafty.lastEvent = e;

        var maxz = -1,
            tar = e.target ? e.target : e.srcElement,
            closest,
            q,
            i = 0,
            l,
            pos = Crafty.domHelper.translate(e.clientX, e.clientY),
            x, y,
            dupes = {},
            type = e.type;     

        //Normalize button according to http://unixpapa.com/js/mouse.html
        if (typeof e.which === 'undefined') {
            e.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button == 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        } else {
            e.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which == 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
        }

        e.realX = x = Crafty.mousePos.x = pos.x;
        e.realY = y = Crafty.mousePos.y = pos.y;

        closest = Crafty.findClosestEntityByComponent("Mouse", x, y, tar);

        //found closest object to mouse
        if (closest) {
            //click must mousedown and out on tile
            if (type === "mousedown") {
                closest.trigger("MouseDown", e);
            } else if (type === "mouseup") {
                closest.trigger("MouseUp", e);
            } else if (type == "dblclick") {
                closest.trigger("DoubleClick", e);
            } else if (type == "click") {
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
            } else if (type == "mouseup") {
                Crafty.viewport.mouselook('stop');
            }
        }

        if (type === "mousemove") {
            this.lastEvent = e;
        }

    },


    /**@
     * #Crafty.touchDispatch
     * @category Input
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
     * @see Crafty.mouseDispatch
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
                  pos = Crafty.domHelper.translate(touches[i].clientX, touches[i].clientY),
                  tar = e.target ? e.target : e.srcElement,
                  x, y, closest;
                touches[i].realX = x = pos.x;
                touches[i].realY = y = pos.y;
                closest = this.findClosestTouchEntity(x, y, tar);
                
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
                  pos = Crafty.domHelper.translate(touches[i].clientX, touches[i].clientY),
                  tar = e.target ? e.target : e.srcElement,
                  x, y, closest;
                touches[i].realX = x = pos.x;
                touches[i].realY = y = pos.y;
                closest = this.findClosestTouchEntity(x, y, tar);
            
                if (idx >= 0) {
                    if(typeof this.fingers[idx].entity !== "undefined")
                        if (this.fingers[idx].entity == closest) {
                            this.fingers[idx].entity.trigger("TouchMove", touches[i]);
                        } else {
                            if (typeof closest === "object") closest.trigger("TouchStart", touches[i]);
                            this.fingers[idx].entity.trigger("TouchEnd");
                        }
                    this.fingers[idx].entity = closest;
                    this.fingers[idx].realX = x;
                    this.fingers[idx].realY = y;
                }
            }
        },
        
        handleEnd: function (e) {
            var touches = e.changedTouches, 
                eventName = e.type == "touchcancel" ? "TouchCancel" : "TouchEnd";
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
            
        findClosestTouchEntity: function (x, y, tar) {
            return Crafty.findClosestEntityByComponent("Touch", x, y, tar);
        },
           
        fingerDownIndexById: function(idToFind) {
            for (var i = 0, l = this.fingers.length; i < l; i++) {
                var id = this.fingers[i].identifier;
                
                   if (id == idToFind) {
                       return i;
                   }
                }
            return -1;
        },
            
        fingerDownIndexByEntity: function(entityToFind) {
            for (var i = 0, l = this.fingers.length; i < l; i++) {
                var ent = this.fingers[i].entity;
                
                if (ent == entityToFind) {
                    return i;
                }
            }
            return -1;
        },

        mimicMouse: function (e) {
            var type,
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
            if (lastEvent !== null && lastEvent.type == 'mousedown' && type == 'mouseup') {
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
     * #Crafty.findClosestEntityByComponent
     * @category Input
     * 
     * @sign public this .findClosestEntityByComponent(String comp, Number x, Number y[, Object target])
     * Finds closest entity with certain component at given coordinates.
     * @param comp - Component name
     * @param x - `x` position where to look for entities
     * @param y - `y` position where to look for entities
     * @param target - Target element wherein to look for entities 
     * 
     * This method is used internally by the .mouseDispatch and .touchDispatch methods, but can be used otherwise for 
     * Canvas entities.
     * 
     * Finds the top most entity (with the highest z) with a given component at a given point (x, y).
     * For having a detection area specified for the enity, add the AreaMap component to the entity expected to be found.
     * 
     * The 'target' argument is only meant to be used by .mouseDispatch and touchDispatch; defaults to Crafty.stage.elem, 
     * thus using this function directly is only worth anything for canvas entities.
     * 
     * Returns the found entity, or undefined if no entity was found.
     * 
     * @example
     * ~~~
     * var coords = { x: 455, y: 267 },
     *     closestText = Crafty.findClosestEntityByComponent("Text", coords.x, coords.y);
     * ~~~
     */
    findClosestEntityByComponent: function (comp, x, y, target) { 
        var tar = target ? target : Crafty.stage.elem,
            closest, q, l, i = 0, maxz = -1, dupes = {};
            
        //if it's a DOM element with component we are done
        if (tar.nodeName != "CANVAS") {
            while (typeof (tar.id) != 'string' && tar.id.indexOf('ent') == -1) {
                tar = tar.parentNode;
            }
            var ent = Crafty(parseInt(tar.id.replace('ent', ''), 10));
            if (ent.__c[comp] && ent.isAt(x, y)){
                closest = ent;
            }
        }
            //else we search for an entity with component
        if (!closest) {
            q = Crafty.map.search({
                _x: x,
                _y: y,
                _w: 1,
                _h: 1
            }, false);

            for (l = q.length; i < l; ++i) {
                
                if (!q[i].__c[comp] || !q[i]._visible){ continue; }

                    var current = q[i],
                        flag = false;

                    //weed out duplicates
                    if (dupes[current[0]]){  continue; }
                    else dupes[current[0]] = true;

                    if (current.mapArea) {
                        if (current.mapArea.containsPoint(x, y)) {
                            flag = true;
                        }
                    } else if (current.isAt(x, y)) flag = true;

                    if (flag && (current._z >= maxz || maxz === -1)) {
                        //if the Z is the same, select the closest GUID
                        if (current._z === maxz && current[0] < closest[0]) {
                            continue; 
                    }
                    maxz = current._z;
                    closest = current;
                }
            }
        }
            
        return closest;
    },


    /**@
     * #KeyboardEvent
     * @category Input
     * Keyboard Event triggered by Crafty Core
     * @trigger KeyDown - is triggered for each entity when the DOM 'keydown' event is triggered.
     * @trigger KeyUp - is triggered for each entity when the DOM 'keyup' event is triggered.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color")
     *   .attr({x: 100, y: 100, w: 50, h: 50})
     *   .color("red")
     *   .bind('KeyDown', function(e) {
     *     if(e.key == Crafty.keys.LEFT_ARROW) {
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
     */

    /**@
     * #Crafty.eventObject
     * @category Input
     *
     * Event Object used in Crafty for cross browser compatibility
     */

    /**@
     * #.key
     * @comp Crafty.eventObject
     *
     * Unicode of the key pressed
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
        if (Crafty.selected && !(e.key == 8 || e.key >= 112 && e.key <= 135)) {
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
Crafty.bind("Load", function () {
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
});

Crafty.bind("CraftyStop", function () {
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
    }

    Crafty.removeEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.removeEvent(this, window, "blur", Crafty.resetKeyDown);
});

/**@
 * #Mouse
 * @category Input
 * Provides the entity with mouse related events
 * @trigger MouseOver - when the mouse enters - MouseEvent
 * @trigger MouseOut - when the mouse leaves - MouseEvent
 * @trigger MouseDown - when the mouse button is pressed on - MouseEvent
 * @trigger MouseUp - when the mouse button is released on - MouseEvent
 * @trigger Click - when the user clicks - MouseEvent
 * @trigger DoubleClick - when the user double clicks - MouseEvent
 * @trigger MouseMove - when the mouse is over and moves - MouseEvent
 *
 * To be able to use the events on a entity, you have to remember to include the Mouse component, 
 * else the events will not get triggered.
 *
 * You can read more about the MouseEvent, which is the parameter passed to the callback.
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 *
 * Crafty adds the mouseButton property to MouseEvents that match one of
 *
 * - Crafty.mouseButtons.LEFT
 * - Crafty.mouseButtons.RIGHT
 * - Crafty.mouseButtons.MIDDLE
 *
 * If you're targeting mobiles, you must know that by default Crafty turns touch events into mouse events, 
 * making mouse dependent components work with touch. However, in case you need multitouch, you'll have 
 * to make use of the Touch component instead, thus losing compatibility with Mouse dependent stuff.
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
 *        console.log("Clicked right button");
 * })
 * ~~~
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
 * Provides the entity with touch related events
 * @trigger TouchStart - when entity is touched - TouchPoint
 * @trigger TouchMove - when finger is moved over entity - TouchPoint
 * @trigger TouchCancel - when a touch event has been disrupted in some way - TouchPoint
 * @trigger TouchEnd - when the finger is raised over the entity, or when finger leaves entity - won't send touch point
 *
 * To be able to use multitouch, you must do Crafty.multitouch(true), and also you have to remember to include 
 * the Touch component in your entity, else the events will not get triggered. 
 * 
 * If you don't need multitouch, you can use the Mouse component instead.
 *
 * You can read more about the TouchEvent. See TouchEvent.touches and TouchEvent.changedTouches.
 * https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
 * TouchPoint is the parameter passed to the event callback in the related touch.
 * http://www.w3.org/TR/touch-events/#dfn-active-touch-point
 *
 * @example
 * ~~~
 * Crafty.multitouch(true);
 * 
 * var myEntity = Crafty.e('2D, Canvas, Color, Touch')
 * .attr({x: 10, y: 10, w: 40, h: 40})
 * .color('green')
 * .bind('TouchStart', function(TouchPoint){
 *   console.log('myEntity has been touched', TouchPoint);
 * }).bind('TouchMove', function(TouchPoint) {
 *   console.log('Finger moved over myEntity at the { x: ' + TouchPoint.realX + ', y: ' + TouchPoint.realY + ' } coordinates.');
 * }).bind('TouchEnd', function() {
 *   console.log('Touch over myEntity has finished.');
 * });
 * ~~~
 * @see Crafty.multitouch
 * @see Crafty.touchDispatch
 * @see Crafty.mouseDispatch
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
 * Component used by Mouse and Touch.
 * Can be added to other entities for use with the Crafty.findClosestEntityByComponent method.
 * 
 * @see Crafty.mouseDispatch
 * @see Crafty.touchDispatch
 * @see Crafty.polygon
 */
Crafty.c("AreaMap", {
    init: function () {
    },

    /**@
     * #.areaMap
     * @comp AreaMap
     * @sign public this .areaMap(Crafty.polygon polygon)
     * @param polygon - Instance of Crafty.polygon used to check if the mouse coordinates are inside this region
     * @sign public this .areaMap(Array point1, .., Array pointN)
     * @param point# - Array with an `x` and `y` position to generate a polygon
     *
     * Assign a polygon to the entity so that pointer (mouse or touch) events will only be triggered if
     * the coordinates are inside the given polygon.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Mouse")
     *     .color("red")
     *     .attr({ w: 100, h: 100 })
     *     .bind('MouseOver', function() {console.log("over")})
     *     .areaMap([0, 0, 50, 0, 50, 50, 0, 50) 
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
        }

        poly.shift(this._x, this._y);
        //this.map = poly;
        this.mapArea = poly;

        this.attach(this.mapArea);
        return this;
    }
});

/**@
 * #Button
 * @category Input
 * Provides the entity with touch or mouse functionality, depending on whether this is a pc 
 * or mobile device, and also on multitouch configuration.
 * 
 * @see Crafty.multitouch
 */
Crafty.c("Button", {
    init: function () {
        var req = (!Crafty.mobile || (Crafty.mobile && !Crafty.multitouch())) ? "Mouse" : "Touch";
        this.requires(req);
    }
});

/**@
 * #Draggable
 * @category Input
 * Enable drag and drop of the entity.
 * @trigger Dragging - is triggered each frame the entity is being dragged - MouseEvent
 * @trigger StartDrag - is triggered when dragging begins - MouseEvent
 * @trigger StopDrag - is triggered when dragging ends - MouseEvent
 */
Crafty.c("Draggable", {
    _origMouseDOMPos: null,
    _oldX: null,
    _oldY: null,
    _dragging: false,
    _dir: null,

    //Note: the code is not tested with zoom, etc., that may distort the direction between the viewport and the coordinate on the canvas.
    init: function () {
        this.requires("Mouse");
        this.enableDrag();
    },

    _ondrag: function (e) {
        // While a drag is occurring, this method is bound to the mousemove DOM event
        var pos = Crafty.domHelper.translate(e.clientX, e.clientY);

        // ignore invalid 0 0 position - strange problem on ipad
        if (pos.x === 0 || pos.y === 0) {
            return false;
        }

        if (this._dir) {
            if (this._dir.x !== 0 || this._dir.y !== 0) {
                var len = (pos.x - this._origMouseDOMPos.x) * this._dir.x + (pos.y - this._origMouseDOMPos.y) * this._dir.y;
                this.x = this._oldX + len * this._dir.x;
                this.y = this._oldY + len * this._dir.y;
            }
        } else {
            this.x = this._oldX + (pos.x - this._origMouseDOMPos.x);
            this.y = this._oldY + (pos.y - this._origMouseDOMPos.y);
        }

        this.trigger("Dragging", e);
    },

    _ondown: function (e) {
        // When dragging is enabled, this method is bound to the MouseDown crafty event
        if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
        this._startDrag(e);
    },

    _onup: function (e) {
        // While a drag is occurring, this method is bound to mouseup DOM event
        if (e.mouseButton === Crafty.mouseButtons.LEFT && this._dragging === true) {
            Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
            Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);
            this._dragging = false;
            this.trigger("StopDrag", e);
        }
    },

    /**@
     * #.dragDirection
     * @comp Draggable
     * @sign public this .dragDirection()
     * Remove any previously specified direction.
     *
     * @sign public this .dragDirection(vector)
     * @param vector - Of the form of {x: valx, y: valy}, the vector (valx, valy) denotes the move direction.
     *
     * @sign public this .dragDirection(degree)
     * @param degree - A number, the degree (clockwise) of the move direction with respect to the x axis.
     * Specify the dragging direction.
     *
     * @example
     * ~~~
     * this.dragDirection()
     * this.dragDirection({x:1, y:0}) //Horizontal
     * this.dragDirection({x:0, y:1}) //Vertical
     * // Note: because of the orientation of x and y axis,
     * // this is 45 degree clockwise with respect to the x axis.
     * this.dragDirection({x:1, y:1}) //45 degree.
     * this.dragDirection(60) //60 degree.
     * ~~~
     */
    dragDirection: function (dir) {
        if (typeof dir === 'undefined') {
            this._dir = null;
        } else if (("" + parseInt(dir, 10)) == dir) { //dir is a number
            this._dir = {
                x: Math.cos(dir / 180 * Math.PI),
                y: Math.sin(dir / 180 * Math.PI)
            };
        } else {
            if (dir.x === 0 && dir.y === 0) {
                this._dir = { x: 0, y: 0 };
            } else {
                var r = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                this._dir = {
                    x: dir.x / r,
                    y: dir.y / r
                };
            }
        }
    },


    /**@
     * #._startDrag
     * @comp Draggable
     * Internal method for starting a drag of an entity either programatically or via Mouse click
     *
     * @param e - a mouse event
     */
    _startDrag: function (e) {
        this._origMouseDOMPos = Crafty.domHelper.translate(e.clientX, e.clientY);
        this._oldX = this._x;
        this._oldY = this._y;
        this._dragging = true;

        Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
        Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
        this.trigger("StartDrag", e);
    },

    /**@
     * #.stopDrag
     * @comp Draggable
     * @sign public this .stopDrag(void)
     * @trigger StopDrag - Called right after the mouse listeners are removed
     *
     * Stop the entity from dragging. Essentially reproducing the drop.
     *
     * @see .startDrag
     */
    stopDrag: function () {
        Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
        Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);

        this._dragging = false;
        this.trigger("StopDrag");
        return this;
    },

    /**@
     * #.startDrag
     * @comp Draggable
     * @sign public this .startDrag(void)
     *
     * Make the entity follow the mouse positions.
     *
     * @see .stopDrag
     */
    startDrag: function () {
        if (!this._dragging) {
            //Use the last known position of the mouse
            this._startDrag(Crafty.lastEvent);
        }
        return this;
    },

    /**@
     * #.enableDrag
     * @comp Draggable
     * @sign public this .enableDrag(void)
     *
     * Rebind the mouse events. Use if `.disableDrag` has been called.
     *
     * @see .disableDrag
     */
    enableDrag: function () {
        this.bind("MouseDown", this._ondown);

        Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
        return this;
    },

    /**@
     * #.disableDrag
     * @comp Draggable
     * @sign public this .disableDrag(void)
     *
     * Stops entity from being draggable. Reenable with `.enableDrag()`.
     *
     * @see .enableDrag
     */
    disableDrag: function () {
        this.unbind("MouseDown", this._ondown);
        if (this._dragging) {
            this.stopDrag();
        }
        return this;
    }
});

/**@
 * #Keyboard
 * @category Input
 * Give entities keyboard events (`keydown` and `keyup`).
 *
 * In particular, changes to the key state are broadcasted by `KeyboardEvent`s; interested entities can bind to these events.
 * The current state (pressed/released) of a key can also be queried using the `.isDown` method.
 * All available key codes are described in `Crafty.keys`.
 *
 * @see KeyboardEvent
 * @see Keyboard.isDown
 * @see Crafty.keys
 */
Crafty.c("Keyboard", {
    /**@
     * #.isDown
     * @comp Keyboard
     * @sign public Boolean isDown(String keyName)
     * @param keyName - Name of the key to check. See `Crafty.keys`.
     * @sign public Boolean isDown(Number keyCode)
     * @param keyCode - Key code in `Crafty.keys`.
     *
     * Determine if a certain key is currently down.
     *
     * @example
     * ~~~
     * entity.requires('Keyboard').bind('KeyDown', function () { if (this.isDown('SPACE')) jump(); });
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

/**@
 * #Multiway
 * @category Input
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 *
 * Used to bind keys to directions and have the entity move accordingly.
 *
 * @see Motion
 */
Crafty.c("Multiway", {
    init: function () {
        this.requires("Motion");

        this._keyDirection = {}; // keyCode -> direction
        this._activeDirections = {}; // direction -> # of keys pressed for that direction
        this._directionSpeed = {}; // direction -> {x: x_speed, y: y_speed}
        this._speed = { x: 3, y: 3 };

        this.bind("KeyDown", this._keydown)
            .bind("KeyUp", this._keyup);
    },

    remove: function() {
        this.unbind("KeyDown", this._keydown)
            .unbind("KeyUp", this._keyup);

        // unapply movement of pressed keys
        this.__unapplyActiveDirections();
    },

    _keydown: function (e) {
        var direction = this._keyDirection[e.key];
        if (direction !== undefined) { // if this is a key we are interested in
            if (this._activeDirections[direction] === 0 && !this.disableControls) { // if key is first one pressed for this direction
                this.vx += this._directionSpeed[direction].x;
                this.vy += this._directionSpeed[direction].y;
            }
            this._activeDirections[direction]++;
        }
    },

    _keyup: function (e) {
        var direction = this._keyDirection[e.key];
        if (direction !== undefined) { // if this is a key we are interested in
            this._activeDirections[direction]--;
            if (this._activeDirections[direction] === 0 && !this.disableControls) { // if key is last one unpressed for this direction
                this.vx -= this._directionSpeed[direction].x;
                this.vy -= this._directionSpeed[direction].y;
            }
        }
    },


    /**@
     * #.multiway
     * @comp Multiway
     * @sign public this .multiway([Number speed,] Object keyBindings )
     * @param speed - Amount of pixels to move the entity whilst a key is down
     * @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
     *
     * Constructor to initialize the speed and keyBindings. Component will listen to key events and move the entity appropriately.
     * Can be called while a key is pressed to change direction & speed on the fly.
     *
     * @example
     * ~~~
     * this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
     * this.multiway({W: -90, S: 90, D: 0, A: 180});
     * ~~~
     *
     * @see Motion
     */
    multiway: function (speed, keys) {
        if (keys) {
            if (speed.x !== undefined && speed.y !== undefined) {
                this._speed.x = speed.x;
                this._speed.y = speed.y;
            } else {
                this._speed.x = speed;
                this._speed.y = speed;
            }
        } else {
            keys = speed;
        }


        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }

        this._updateKeys(keys);
        this._updateSpeed(this._speed);

        if (!this.disableControls) {
            this.__applyActiveDirections();
        }

        return this;
    },

    /**@
     * #.speed
     * @comp Multiway
     * @sign public this .speed(Object speed)
     * @param speed - New speed the entity has, for x and y axis.
     *
     * Change the speed that the entity moves with. 
     * Can be called while a key is pressed to change speed on the fly.
     *
     * @example
     * ~~~
     * this.speed({ x: 3, y: 1 });
     * ~~~
     */
    speed: function (speed) {
        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }

        this._updateSpeed(speed);

        if (!this.disableControls) {
            this.__applyActiveDirections();
        }

        return this;
    },

    _updateKeys: function(keys) {
        // reset data
        this._keyDirection = {};
        this._activeDirections = {};

        for (var k in keys) {
            var keyCode = Crafty.keys[k] || k;
            // add new data
            var direction = this._keyDirection[keyCode] = keys[k];
            this._activeDirections[direction] = this._activeDirections[direction] || 0;
            if (Crafty.keydown[keyCode]) // add directions of already pressed keys
                this._activeDirections[direction]++;
        }
    },

    _updateSpeed: function(speed) {
        // reset data
        this._directionSpeed = {};

        var direction;
        for (var keyCode in this._keyDirection) {
            direction = this._keyDirection[keyCode];
            // add new data
            this._directionSpeed[direction] = {
                x: Math.round(Math.cos(direction * (Math.PI / 180)) * 1000 * speed.x) / 1000,
                y: Math.round(Math.sin(direction * (Math.PI / 180)) * 1000 * speed.y) / 1000
            };
        }
    },

    __applyActiveDirections: function() {
        for (var direction in this._activeDirections) {
            if (this._activeDirections[direction] > 0) {
                this.vx += this._directionSpeed[direction].x;
                this.vy += this._directionSpeed[direction].y;
            }
        }
    },

    __unapplyActiveDirections: function() {
        for (var direction in this._activeDirections) {
            if (this._activeDirections[direction] > 0) {
                this.vx -= this._directionSpeed[direction].x;
                this.vy -= this._directionSpeed[direction].y;
            }
        }
    },

    /**@
     * #.enableControl
     * @comp Multiway
     * @sign public this .enableControl()
     *
     * Enable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.enableControl();
     * ~~~
     */
    enableControl: function () {
        if (this.disableControls) {
            this.__applyActiveDirections();
        }
        this.disableControls = false;

        return this;
    },

    /**@
     * #.disableControl
     * @comp Multiway
     * @sign public this .disableControl()
     *
     * Disable the component to listen to key events.
     *
     * @example
     * ~~~
     * this.disableControl();
     * ~~~
     */

    disableControl: function () {
        if (!this.disableControls) {
            this.__unapplyActiveDirections();
        }
        this.disableControls = true;

        return this;
    }
});

/**@
 * #Fourway
 * @category Input
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 *
 * Move an entity in four directions by using the
 * arrow keys or `W`, `A`, `S`, `D`.
 *
 * @see Multiway, Motion
 */
Crafty.c("Fourway", {

    init: function () {
        this.requires("Multiway");
    },

    /**@
     * #.fourway
     * @comp Fourway
     * @sign public this .fourway([Number speed])
     * @param speed - Amount of pixels to move the entity whilst a key is down
     *
     * Constructor to initialize the speed. Component will listen for key events and move the entity appropriately.
     * This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
     *
     * The key presses will move the entity in that direction by the speed passed in the argument.
     *
     * @see Multiway, Motion
     */
    fourway: function (speed) {
        this.multiway(speed || this._speed, {
            UP_ARROW: -90,
            DOWN_ARROW: 90,
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            W: -90,
            S: 90,
            D: 0,
            A: 180,
            Z: -90,
            Q: 180
        });

        return this;
    }
});

/**@
 * #Twoway
 * @category Input
 * @trigger NewDirection - When entity has changed direction due to velocity on either x or y axis a NewDirection event is triggered. The event is triggered once, if direction is different from last frame. - { x: -1 | 0 | 1, y: -1 | 0 | 1 } - New direction
 * @trigger Moved - When entity has moved due to velocity/acceleration on either x or y axis a Moved event is triggered. If the entity has moved on both axes for diagonal movement the event is triggered twice. - { axis: 'x' | 'y', oldValue: Number } - Old position
 * @trigger CheckJumping - When entity is about to jump. This event is triggered with the object the entity is about to jump from (if it exists). Third parties can respond to this event and enable the entity to jump.
 *
 * Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
 *
 * @see Gravity, Multiway, Fourway, Motion
 */
Crafty.c("Twoway", {
    _jumpSpeed: 6,
    _jumpKeys: false,

    /**@
     * #.canJump
     * @comp Twoway
     *
     * The canJump function determines if the entity is allowed to jump or not (e.g. perhaps the entity should be able to double jump).
     * The Twoway component will trigger a "CheckJumping" event. 
     * Interested parties can listen to this event and enable the entity to jump by setting `canJump` to true.
     *
     * @example
     * ~~~
     * var player = Crafty.e("2D, Twoway");
     * player.hasDoubleJumpPowerUp = true; // allow player to double jump by granting him a powerup
     * player.bind("CheckJumping", function(ground) {
     *     if (!ground && player.hasDoubleJumpPowerUp) { // allow player to double jump by using up his double jump powerup
     *         player.canJump = true;
     *         player.hasDoubleJumpPowerUp = false;
     *     }
     * });
     * player.bind("LandedOnGround", function(ground) {
     *     player.hasDoubleJumpPowerUp = true; // give player new double jump powerup upon landing
     * });
     * ~~~
     */
    canJump: true,

    init: function () {
        this.requires("Fourway, Motion, Supportable");
    },

    remove: function() {
        this.unbind("KeyDown", this._keydown_twoway);
    },

    _keydown_twoway: function (e) {
        if (this.disableControls) return;

        if (this._jumpKeys.indexOf(e.key) !== -1) {
            var ground = this.ground;
            this.canJump = !!ground;
            this.trigger("CheckJumping", ground);
            if (this.canJump) {
                this.vy = -this._jumpSpeed;
            }
        }
    },

    /**@
     * #.twoway
     * @comp Twoway
     * @sign public this .twoway([Number speed[, Number jump, {Number|Array} jumpKeys]])
     * @param speed - Amount of pixels to move left or right
     * @param jump - Vertical jump speed
     * @param jumpKeys - Defines one or more additional entity jump keys
     *
     * Constructor to initialize the speed and power of jump. Component will
     * listen for key events and move the entity appropriately. This includes
     * `Up Arrow`, `Right Arrow`, `Left Arrow` as well as `W`, `A`, `D`. Used with the
     * `gravity` component to simulate jumping.
     *
     * The key presses will move the entity in that direction by the speed passed in
     * the argument. Pressing the `Up Arrow` or `W` will cause the entity to jump.
     *
     * @see Gravity, Multiway, Fourway, Motion
     */
    twoway: function (speed, jump, jumpKeys) {
        this._jumpKeys = [Crafty.keys.UP_ARROW, Crafty.keys.W];

        this.multiway(speed || this._speed, {
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            D: 0,
            A: 180,
            Q: 180
        });

        if (arguments.length < 2) {
          this._jumpSpeed = this._speed.y * 2;
        } else {
          this._jumpSpeed = jump;
          if (typeof jumpKeys === 'number') {
            this._jumpKeys.push(jumpKeys);
          } else if (jumpKeys) {
            // Assume an array, although this could bite us :(
            // We do, however (probably), save some type check speed
            this._jumpKeys = this._jumpKeys.concat(jumpKeys);
          }
        }
        this.uniqueBind("KeyDown", this._keydown_twoway);

        return this;
    }
});
