var Crafty = require('../core/core.js'),
    document = window.document;

Crafty.extend({
    /**@
     * #Crafty.viewport
     * @category Stage
     * @trigger ViewportScroll - when the viewport's x or y coordinates change
     * @trigger ViewportScale - when the viewport's scale changes
     * @trigger ViewportResize - when the viewport's dimension's change
     * @trigger InvalidateViewport - when the viewport changes
     * @trigger StopCamera - when any camera animations should stop, such as at the start of a new animation.
     * @trigger CameraAnimationDone - when a camera animation reaches completion
     *
     * Viewport is essentially a 2D camera looking at the stage. Can be moved or zoomed, which
     * in turn will react just like a camera moving in that direction.
     *
     * There are multiple camera animation methods available - these are the viewport methods with an animation time parameter and the `follow` method.
     * Only one animation can run at a time. Starting a new animation will cancel the previous one and the appropriate events will be fired.
     * 
     * Tip: At any given moment, the stuff that you can see is...
     * 
     * `x` between `(-Crafty.viewport._x)` and `(-Crafty.viewport._x + (Crafty.viewport._width / Crafty.viewport._scale))`
     * 
     * `y` between `(-Crafty.viewport._y)` and `(-Crafty.viewport._y + (Crafty.viewport._height / Crafty.viewport._scale))`
     *
     *
     * @example
     * Prevent viewport from adjusting itself when outside the game world.
     * Scale the viewport so that entities appear twice as large.
     * Then center the viewport on an entity over the duration of 3 seconds.
     * After that animation finishes, start following the entity.
     * ~~~
     * var ent = Crafty.e('2D, DOM').attr({x: 250, y: 250, w: 100, h: 100});
     *
     * Crafty.viewport.clampToEntities = false;
     * Crafty.viewport.scale(2);
     * Crafty.one("CameraAnimationDone", function() {
     *     Crafty.viewport.follow(ent, 0, 0);
     * });
     * Crafty.viewport.centerOn(ent, 3000);
     * ~~~
     */
    viewport: {
        /**@
         * #Crafty.viewport.clampToEntities
         * @comp Crafty.viewport
         *
         * Decides if the viewport functions should clamp to game entities.
         * When set to `true` functions such as Crafty.viewport.mouselook() will not allow you to move the
         * viewport over areas of the game that has no entities.
         * For development it can be useful to set this to false.
         */
        clampToEntities: true,
        _width: 0,
        _height: 0,
        /**@
         * #Crafty.viewport.x
         * @comp Crafty.viewport
         *
         * Will move the stage and therefore every visible entity along the `x`
         * axis in the opposite direction.
         *
         * When this value is set, it will shift the entire stage. This means that entity
         * positions are not exactly where they are on screen. To get the exact position,
         * simply add `Crafty.viewport.x` onto the entities `x` position.
         */
        _x: 0,
        /**@
         * #Crafty.viewport.y
         * @comp Crafty.viewport
         *
         * Will move the stage and therefore every visible entity along the `y`
         * axis in the opposite direction.
         *
         * When this value is set, it will shift the entire stage. This means that entity
         * positions are not exactly where they are on screen. To get the exact position,
         * simply add `Crafty.viewport.y` onto the entities `y` position.
         */
        _y: 0,

        /**@
         * #Crafty.viewport._scale
         * @comp Crafty.viewport
         *
         * This value is the current scale (zoom) of the viewport. When the value is bigger than 1, everything
         * looks bigger (zoomed in). When the value is less than 1, everything looks smaller (zoomed out). This
         * does not alter the size of the stage itself, just the magnification of what it shows.
         * 
         * This is a read-only property: Do not set it directly. Instead, use `Crafty.viewport.scale(...)`
         * or `Crafty.viewport.zoom(...)`
         */

        _scale: 1,

        /**@
         * #Crafty.viewport.bounds
         * @comp Crafty.viewport
         *
         * A rectangle which defines the bounds of the viewport.
         * It should be an object with two properties, `max` and `min`,
         * which are each an object with `x` and `y` properties.
         *
         * If this property is null, Crafty uses the bounding box of all the items
         * on the stage.  This is the initial value.  (To prevent this behavior, set `Crafty.viewport.clampToEntities` to `false`)
         *
         * If you wish to bound the viewport along one axis but not the other, you can use `-Infinity` and `+Infinity` as bounds.
         *
         * @see Crafty.viewport.clampToEntities
         *
         * @example
         * Set the bounds to a 500 by 500 square:
         *
         * ~~~
         * Crafty.viewport.bounds = {min:{x:0, y:0}, max:{x:500, y:500}};
         * ~~~
         */
        bounds: null,

        /**@
         * #Crafty.viewport.scroll
         * @comp Crafty.viewport
         * @sign Crafty.viewport.scroll(String axis, Number val)
         * @param axis - 'x' or 'y'
         * @param val - The new absolute position on the axis
         *
         * Will move the viewport to the position given on the specified axis
         *
         * @example
         * Will move the camera 500 pixels right of its initial position, in effect
         * shifting everything in the viewport 500 pixels to the left.
         *
         * ~~~
         * Crafty.viewport.scroll('_x', 500);
         * ~~~
         */
        scroll: function (axis, val) {
            this[axis] = val;
            Crafty.trigger("ViewportScroll");
            Crafty.trigger("InvalidateViewport");
        },

        rect_object: { _x: 0, _y: 0, _w: 0, _h: 0},

        rect: function () {
            this.rect_object._x = -this._x;
            this.rect_object._y = -this._y;
            this.rect_object._w = this._width / this._scale;
            this.rect_object._h = this._height / this._scale;
            return this.rect_object;
        },

        /**@ 

         * #Crafty.viewport.pan
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.pan(Number dx, Number dy, Number time[, String|function easingFn])
         * @param Number dx - The distance along the x axis
         * @param Number dy - The distance along the y axis
         * @param Number time - The duration in ms for the entire camera movement
         * @param easingFn - A string or custom function specifying an easing.  (Defaults to linear behavior.)  See Crafty.easing for more information.
         *
         * Pans the camera a given number of pixels over the specified time
         *
         * @example
         * ~~~
         * // pan the camera 100 px right and down over the duration of 2 seconds using linear easing behaviour
         * Crafty.viewport.pan(100, 100, 2000);
         * ~~~
         */
        pan: (function () {
            var tweens = {}, i, bound = false;
            var targetX, targetY, startingX, startingY, easing;

            function enterFrame(e) {
                easing.tick(e.dt);
                var v = easing.value();
                Crafty.viewport.x = (1-v) * startingX + v * targetX;
                Crafty.viewport.y = (1-v) * startingY + v * targetY;
                Crafty.viewport._clamp();

                if (easing.complete){
                    stopPan();
                    Crafty.trigger("CameraAnimationDone");
                }
            }

            function stopPan(){
                Crafty.unbind("EnterFrame", enterFrame);
            }

            Crafty._preBind("StopCamera", stopPan);

            return function (dx, dy, time, easingFn) {
                // Cancel any current camera control
                Crafty.trigger("StopCamera");

                // Handle request to reset
                if (dx == 'reset') {
                   return;
                }

                startingX = Crafty.viewport._x;
                startingY = Crafty.viewport._y;
                targetX = startingX - dx;
                targetY = startingY - dy;

                easing = new Crafty.easing(time, easingFn);

                // bind to event, using uniqueBind prevents multiple copies from being bound
                Crafty.uniqueBind("EnterFrame", enterFrame);
                       
            };
        })(),

        /**@
         * #Crafty.viewport.follow
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.follow(Object target, Number offsetx, Number offsety)
         * @param Object target - An entity with the 2D component
         * @param Number offsetx - Follow target's center should be offsetx pixels away from viewport's center. Positive values puts target to the right of the screen.
         * @param Number offsety - Follow target's center should be offsety pixels away from viewport's center. Positive values puts target to the bottom of the screen.
         *
         * Follows a given entity with the 2D component. If following target will take a portion of
         * the viewport out of bounds of the world, following will stop until the target moves away.
         *
         * @example
         * ~~~
         * var ent = Crafty.e('2D, DOM').attr({w: 100, h: 100});
         * Crafty.viewport.follow(ent, 0, 0);
         * ~~~
         */
        follow: (function () {
            var oldTarget, offx, offy;

            function change() {
                var scale = Crafty.viewport._scale;
                Crafty.viewport.scroll('_x', -(this.x + (this.w / 2) - (Crafty.viewport.width / 2 / scale) - offx * scale));
                Crafty.viewport.scroll('_y', -(this.y + (this.h / 2) - (Crafty.viewport.height / 2 / scale) - offy * scale));
                Crafty.viewport._clamp();
            }

            function stopFollow(){
                if (oldTarget) {
                    oldTarget.unbind('Move', change);
                    oldTarget.unbind('ViewportScale', change);
                    oldTarget.unbind('ViewportResize', change);
                }
            }

            Crafty._preBind("StopCamera", stopFollow);

            return function (target, offsetx, offsety) {
                if (!target || !target.has('2D'))
                    return;
                Crafty.trigger("StopCamera");

                oldTarget = target;
                offx = (typeof offsetx != 'undefined') ? offsetx : 0;
                offy = (typeof offsety != 'undefined') ? offsety : 0;

                target.bind('Move', change);
                target.bind('ViewportScale', change);
                target.bind('ViewportResize', change);
                change.call(target);
            };
        })(),

        /**@
         * #Crafty.viewport.centerOn
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.centerOn(Object target, Number time)
         * @param Object target - An entity with the 2D component
         * @param Number time - The duration in ms of the camera motion
         *
         * Centers the viewport on the given entity.
         *
         * @example
         * ~~~
         * var ent = Crafty.e('2D, DOM').attr({x: 250, y: 250, w: 100, h: 100});
         * Crafty.viewport.centerOn(ent, 3000);
         * ~~~
         */
        centerOn: function (targ, time) {
            var x = targ.x + Crafty.viewport.x,
                y = targ.y + Crafty.viewport.y,
                mid_x = targ.w / 2,
                mid_y = targ.h / 2,
                cent_x = Crafty.viewport.width / 2 / Crafty.viewport._scale,
                cent_y = Crafty.viewport.height / 2 / Crafty.viewport._scale,
                new_x = x + mid_x - cent_x,
                new_y = y + mid_y - cent_y;

            Crafty.viewport.pan(new_x, new_y, time);
        },

        /**@
         * #Crafty.viewport.zoom
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.zoom(Number amt, Number cent_x, Number cent_y, Number time[, String|function easingFn])
         * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
         * @param Number cent_x - the center to zoom on
         * @param Number cent_y - the center to zoom on
         * @param Number time - the duration in ms of the entire zoom operation
         * @param easingFn - A string or custom function specifying an easing.  (Defaults to linear behavior.)  See Crafty.easing for more information.
         *
         * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
         * amt < 1 will bring it farther away. amt = 0 will reset to the default zoom level
         * Zooming is multiplicative. To reset the zoom amount, pass 0.
         *
         * @example
         * ~~~
         * // Make the entities appear twice as large by zooming in on the specified coordinates over the duration of 3 seconds using linear easing behavior
         * Crafty.viewport.zoom(2, 100, 100, 3000);
         * ~~~
         */
        zoom: (function () {
            

            function stopZoom(){
                Crafty.unbind("EnterFrame", enterFrame);
            }
            Crafty._preBind("StopCamera", stopZoom);

            var startingZoom, finalZoom, finalAmount, startingX, finalX, startingY, finalY, easing;

            function enterFrame(e){
                var amount, v;

                easing.tick(e.dt);

                // The scaling should happen smoothly -- start at 1, end at finalAmount, and at half way scaling should be by finalAmount^(1/2)
                // Since value goes smoothly from 0 to 1, this fufills those requirements
                amount = Math.pow(finalAmount, easing.value() );

                // The viewport should move in such a way that no point reverses
                // If a and b are the top left/bottom right of the viewport, then the below can be derived from
                //      (a_0-b_0)/(a-b) = amount,
                // and the assumption that both a and b have the same form
                //      a = a_0 * (1-v) + a_f * v,
                //      b = b_0 * (1-v) + b_f * v.
                // This is just an arbitrary parameterization of the only sensible path for the viewport corners to take.
                // And by symmetry they should be parameterized in the same way!  So not much choice here.
                if (finalAmount === 1)
                    v = easing.value();  // prevent NaN!  If zoom is used this way, it'll just become a pan.
                else
                    v = (1/amount - 1 ) / (1/finalAmount - 1);

                // Set new scale and viewport position
                Crafty.viewport.scale( amount * startingZoom );
                Crafty.viewport.scroll("_x", startingX * (1-v) + finalX * v );
                Crafty.viewport.scroll("_y", startingY * (1-v) + finalY * v );
                Crafty.viewport._clamp();

                if (easing.complete){
                    stopZoom();
                    Crafty.trigger("CameraAnimationDone");
                }


            }

            return function (amt, cent_x, cent_y, time, easingFn){
                if (!amt) { // we're resetting to defaults
                    Crafty.viewport.scale(1);
                    return;
                }

                if (arguments.length <= 2) {
                    time = cent_x;
                    cent_x = Crafty.viewport.x - Crafty.viewport.width;
                    cent_y = Crafty.viewport.y - Crafty.viewport.height;
                }

                Crafty.trigger("StopCamera");
                startingZoom = Crafty.viewport._scale;
                finalAmount = amt;
                finalZoom = startingZoom * finalAmount;
                

                startingX = Crafty.viewport.x;
                startingY = Crafty.viewport.y;
                finalX = - (cent_x - Crafty.viewport.width  / (2 * finalZoom) );
                finalY = - (cent_y - Crafty.viewport.height / (2 * finalZoom) );

                easing = new Crafty.easing(time, easingFn);

                Crafty.uniqueBind("EnterFrame", enterFrame);
            };

            
        })(),
        /**@
         * #Crafty.viewport.scale
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.scale(Number amt)
         * @param Number amt - amount to zoom/scale in on the elements
         *
         * Adjusts the scale (zoom). When `amt` is 1, it is set to the normal scale,
         * e.g. an entity with `this.w == 20` would appear exactly 20 pixels wide.
         * When `amt` is 10, that same entity would appear 200 pixels wide (i.e., zoomed in
         * by a factor of 10), and when `amt` is 0.1, that same entity would be 2 pixels wide
         * (i.e., zoomed out by a factor of `(1 / 0.1)`).
         * 
         * If you pass an `amt` of 0, it is treated the same as passing 1, i.e. the scale is reset.
         *
         * This method sets the absolute scale, while `Crafty.viewport.zoom` sets the scale relative to the existing value.
         * @see Crafty.viewport.zoom
         *
         * @example
         * ~~~
         * Crafty.viewport.scale(2); // Zoom in -- all entities will appear twice as large.
         * ~~~
         */
        scale: (function () {
            return function (amt) {
                this._scale = amt ? amt : 1;
                Crafty.trigger("InvalidateViewport");
                Crafty.trigger("ViewportScale");

            };
        })(),
        /**@
         * #Crafty.viewport.mouselook
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.mouselook(Boolean active)
         * @param Boolean active - Activate or deactivate mouselook
         *
         * Toggle mouselook on the current viewport.
         * Simply call this function and the user will be able to
         * drag the viewport around.
         *
         * If the user starts a drag, "StopCamera" will be triggered, which will cancel any existing camera animations.
         */
        mouselook: (function () {
            var active = false,
                dragging = false,
                lastMouse = {};
            old = {};
            function stopLook(){
                dragging = false;
            }


            return function (op, arg) {
                if (typeof op == 'boolean') {
                    active = op;
                    if (active) {
                        Crafty.mouseObjs++;
                    } else {
                        Crafty.mouseObjs = Math.max(0, Crafty.mouseObjs - 1);
                    }
                    return;
                }
                if (!active) return;
                switch (op) {
                case 'move':
                case 'drag':
                    if (!dragging) return;
                    diff = {
                        x: arg.clientX - lastMouse.x,
                        y: arg.clientY - lastMouse.y
                    };

                    lastMouse.x = arg.clientX;
                    lastMouse.y = arg.clientY;

                    Crafty.viewport.x += diff.x;
                    Crafty.viewport.y += diff.y;
                    Crafty.viewport._clamp();
                    break;
                case 'start':
                    Crafty.trigger("StopCamera");
                    lastMouse.x = arg.clientX;
                    lastMouse.y = arg.clientY;
                    dragging = true;
                    break;
                case 'stop':
                    dragging = false;
                    break;
                }
            };
        })(),
        _clamp: function () {
            // clamps the viewport to the viewable area
            // under no circumstances should the viewport see something outside the boundary of the 'world'
            if (!this.clampToEntities) return;
            var bound = Crafty.clone(this.bounds) || Crafty.map.boundaries();
            bound.max.x *= this._scale;
            bound.min.x *= this._scale;
            bound.max.y *= this._scale;
            bound.min.y *= this._scale;
            if (bound.max.x - bound.min.x > Crafty.viewport.width) {
                if (Crafty.viewport.x < (-bound.max.x + Crafty.viewport.width) / this._scale) {
                    Crafty.viewport.x = (-bound.max.x + Crafty.viewport.width) / this._scale;
                } else if (Crafty.viewport.x > -bound.min.x) {
                    Crafty.viewport.x = -bound.min.x;
                }
            } else {
                Crafty.viewport.x = -1 * (bound.min.x + (bound.max.x - bound.min.x) / 2 - Crafty.viewport.width / 2);
            }
            if (bound.max.y - bound.min.y > Crafty.viewport.height) {
                if (Crafty.viewport.y < (-bound.max.y + Crafty.viewport.height) / this._scale) {
                    Crafty.viewport.y = (-bound.max.y + Crafty.viewport.height) / this._scale;
                } else if (Crafty.viewport.y > -bound.min.y) {
                    Crafty.viewport.y = -bound.min.y;
                }
            } else {
                Crafty.viewport.y = -1 * (bound.min.y + (bound.max.y - bound.min.y) / 2 - Crafty.viewport.height / 2);
            }
        },

        /**@
         * #Crafty.viewport.init
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.init([Number width, Number height, String stage_elem])
         * @sign public void Crafty.viewport.init([Number width, Number height, HTMLElement stage_elem])
         * @param Number width - Width of the viewport
         * @param Number height - Height of the viewport
         * @param String or HTMLElement stage_elem - the element to use as the stage (either its id or the actual element).
         *
         * Initialize the viewport. If the arguments 'width' or 'height' are missing, use `window.innerWidth` and `window.innerHeight` (full screen model).
         *
         * The argument 'stage_elem' is used to specify a stage element other than the default, and can be either a string or an HTMLElement.  If a string is provided, it will look for an element with that id and, if none exists, create a div.  If an HTMLElement is provided, that is used directly.  Omitting this argument is the same as passing an id of 'cr-stage'.
         *
         * @see Crafty.device, Crafty.domHelper, Crafty.stage
         */
        init: function (w, h, stage_elem) {
            // setters+getters for the viewport
            this._defineViewportProperties();

            // Set initial values -- necessary on restart
            this._x = 0;
            this._y = 0;
            this._scale = 1;
            this.bounds = null;

            // If no width or height is defined, the width and height is set to fullscreen
            this._width = w || window.innerWidth;
            this._height = h || window.innerHeight;

            //check if stage exists
            if (typeof stage_elem === 'undefined')
                stage_elem = "cr-stage";

            var crstage;
            if (typeof stage_elem === 'string')
                crstage = document.getElementById(stage_elem);
            else if (typeof HTMLElement !== "undefined" ? stage_elem instanceof HTMLElement : stage_elem instanceof Element)
                crstage = stage_elem;
            else
                throw new TypeError("stage_elem must be a string or an HTMLElement");

            /**@
             * #Crafty.stage
             * @category Core
             * The stage where all the DOM entities will be placed.
             */

            /**@
             * #Crafty.stage.elem
             * @comp Crafty.stage
             * The `#cr-stage` div element.
             */

            /**@
             * #Crafty.domLayer._div
             * @comp Crafty.domLayer
             * `Crafty.domLayer._div` is a div inside the `#cr-stage` div that holds all DOM entities.
             * If you use canvas, a `canvas` element is created at the same level in the dom
             * as the the `Crafty.domLayer._div` div. So the hierarchy in the DOM is
             *  
             * ~~~
             * Crafty.stage.elem
             *  - Crafty.domLayer._div (a div HTMLElement)
             *  - Crafty.canvasLayer._canvas (a canvas HTMLElement)
             * ~~~
             */

            //create stage div to contain everything
            Crafty.stage = {
                x: 0,
                y: 0,
                fullscreen: false,
                elem: (crstage ? crstage : document.createElement("div")),
            };

            //fullscreen, stop scrollbars
            if (!w && !h) {
                document.body.style.overflow = "hidden";
                Crafty.stage.fullscreen = true;
            }

            Crafty.addEvent(this, window, "resize", Crafty.viewport.reload);

            Crafty.addEvent(this, window, "blur", function () {
                if (Crafty.settings.get("autoPause")) {
                    if (!Crafty._paused) Crafty.pause();
                }
            });
            Crafty.addEvent(this, window, "focus", function () {
                if (Crafty._paused && Crafty.settings.get("autoPause")) {
                    Crafty.pause();
                }
            });

            //make the stage unselectable
            Crafty.settings.register("stageSelectable", function (v) {
                Crafty.stage.elem.onselectstart = v ? function () {
                    return true;
                } : function () {
                    return false;
                };
            });
            Crafty.settings.modify("stageSelectable", false);

            //make the stage have no context menu
            Crafty.settings.register("stageContextMenu", function (v) {
                Crafty.stage.elem.oncontextmenu = v ? function () {
                    return true;
                } : function () {
                    return false;
                };
            });
            Crafty.settings.modify("stageContextMenu", false);

            Crafty.settings.register("autoPause", function () {});
            Crafty.settings.modify("autoPause", false);

            //add to the body and give it an ID if not exists
            if (!crstage) {
                document.body.appendChild(Crafty.stage.elem);
                Crafty.stage.elem.id = stage_elem;
            }

            var elem = Crafty.stage.elem.style,
                offset;

            //css style
            elem.width = this.width + "px";
            elem.height = this.height + "px";
            elem.overflow = "hidden";


            // resize events
            Crafty.bind("ViewportResize", function(){Crafty.trigger("InvalidateViewport");});

            if (Crafty.mobile) {

                // remove default gray highlighting after touch
                if (typeof elem.webkitTapHighlightColor !== undefined) {
                    elem.webkitTapHighlightColor = "rgba(0,0,0,0)";
                }

                var meta = document.createElement("meta"),
                    head = document.getElementsByTagName("head")[0];

                //hide the address bar
                meta = document.createElement("meta");
                meta.setAttribute("name", "apple-mobile-web-app-capable");
                meta.setAttribute("content", "yes");
                head.appendChild(meta);

                Crafty.addEvent(this, Crafty.stage.elem, "touchmove", function (e) {
                    e.preventDefault();
                });


            }
            
            elem.position = "relative";
            //find out the offset position of the stage
            offset = Crafty.domHelper.innerPosition(Crafty.stage.elem);
            Crafty.stage.x = offset.x;
            Crafty.stage.y = offset.y;

            Crafty.uniqueBind("ViewportResize", this._resize);
        },

        _resize: function(){
            Crafty.stage.elem.style.width = Crafty.viewport.width + "px";
            Crafty.stage.elem.style.height = Crafty.viewport.height + "px";
        },

        // Create setters/getters for x, y, width, height
        _defineViewportProperties: function(){
            Object.defineProperty(this, 'x', {
                set: function (v) {
                    this.scroll('_x', v);
                },
                get: function () {
                    return this._x;
                },
                configurable : true
            });
            Object.defineProperty(this, 'y', {
                set: function (v) {
                    this.scroll('_y', v);
                },
                get: function () {
                    return this._y;
                },
                configurable : true
            });
            Object.defineProperty(this, 'width', {
                set: function (v) {
                    this._width = v;
                    Crafty.trigger("ViewportResize");
                },
                get: function () {
                    return this._width;
                },
                configurable : true
            });
            Object.defineProperty(this, 'height', {
                set: function (v) {
                    this._height = v;
                    Crafty.trigger("ViewportResize");
                },
                get: function () {
                    return this._height;
                },
                configurable : true
            });
        },

        /**@
         * #Crafty.viewport.reload
         * @comp Crafty.stage
         *
         * @sign public Crafty.viewport.reload()
         *
         * Recalculate and reload stage width, height and position.
         * Useful when browser return wrong results on init (like safari on Ipad2).
         * You should also call this method if you insert custom DOM elements that affect Crafty's stage offset.
         *
         */
        reload: function () {
            var w = window.innerWidth,
                h= window.innerHeight,
                offset;


            if (Crafty.stage.fullscreen) {
                this._width = w;
                this._height = h;
                Crafty.trigger("ViewportResize");
            }

            offset = Crafty.domHelper.innerPosition(Crafty.stage.elem);
            Crafty.stage.x = offset.x;
            Crafty.stage.y = offset.y;
        },

        /**@
         * #Crafty.viewport.reset
         * @comp Crafty.stage
         * @trigger StopCamera - called to cancel camera animations
         *
         * @sign public Crafty.viewport.reset()
         *
         * Resets the viewport to starting values, and cancels any existing camera animations.
         * Called when scene() is run.
         */
        reset: function () {
            Crafty.viewport.mouselook("stop");
            Crafty.trigger("StopCamera");
            // Reset viewport position and scale
            Crafty.viewport.scroll("_x", 0);
            Crafty.viewport.scroll("_y", 0);
            Crafty.viewport.scale(1);
        },

        /**@
         * #Crafty.viewport.onScreen
         * @comp Crafty.viewport
         * @sign public Crafty.viewport.onScreen(Object rect)
         * @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * Test if a rectangle is completely in viewport
         */
        onScreen: function (rect) {
            return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
                Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
        },
    }
});
