var Crafty = require('./core.js'),
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
     * @trigger CameraAnimationDone - when a camera animation comes reaches completion
     *
     * Viewport is essentially a 2D camera looking at the stage. Can be moved or zoomed, which
     * in turn will react just like a camera moving in that direction.
     * 
     * Tip: At any given moment, the stuff that you can see is...
     * 
     * `x` between `(-Crafty.viewport._x)` and `(-Crafty.viewport._x + (Crafty.viewport._width / Crafty.viewport._scale))`
     * 
     * `y` between `(-Crafty.viewport._y)` and `(-Crafty.viewport._y + (Crafty.viewport._height / Crafty.viewport._scale))` 
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
         * @sign public void Crafty.viewport.pan(Number dx, Number dy, Number time)
         * @param Number dx - The distance along the x axis
         * @param Number dy - The distance along the y axis
         * @param Number time - The duration in ms for the entire camera movement
         *
         * Pans the camera a given number of pixels over the specified time
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

            Crafty.bind("StopCamera", stopPan);

            return function (dx, dy, time) {
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

                easing = new Crafty.easing(time);

                // bind to event, using uniqueBind prevents multiple copies from being bound
                Crafty.uniqueBind("EnterFrame", enterFrame);
                       
            };
        })(),

        /**@
         * #Crafty.viewport.follow
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.follow(Object target, Number offsetx, Number offsety)
         * @param Object target - An entity with the 2D component
         * @param Number offsetx - Follow target should be offsetx pixels away from center
         * @param Number offsety - Positive puts target to the right of center
         *
         * Follows a given entity with the 2D component. If following target will take a portion of
         * the viewport out of bounds of the world, following will stop until the target moves away.
         *
         * @example
         * ~~~
         * var ent = Crafty.e('2D, DOM').attr({w: 100, h: 100:});
         * Crafty.viewport.follow(ent, 0, 0);
         * ~~~
         */
        follow: (function () {
            var oldTarget, offx, offy;

            function change() {
                Crafty.viewport.scroll('_x', -(this.x + (this.w / 2) - (Crafty.viewport.width / 2) - offx));
                Crafty.viewport.scroll('_y', -(this.y + (this.h / 2) - (Crafty.viewport.height / 2) - offy));
                Crafty.viewport._clamp();
            }

            function stopFollow(){
                if (oldTarget)
                    oldTarget.unbind('Move', change);
            }

            Crafty.bind("StopCamera", stopFollow);

            return function (target, offsetx, offsety) {
                if (!target || !target.has('2D'))
                    return;
                Crafty.trigger("StopCamera");

                oldTarget = target;
                offx = (typeof offsetx != 'undefined') ? offsetx : 0;
                offy = (typeof offsety != 'undefined') ? offsety : 0;

                target.bind('Move', change);
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
         */
        centerOn: function (targ, time) {
            var x = targ.x + Crafty.viewport.x,
                y = targ.y + Crafty.viewport.y,
                mid_x = targ.w / 2,
                mid_y = targ.h / 2,
                cent_x = Crafty.viewport.width / 2,
                cent_y = Crafty.viewport.height / 2,
                new_x = x + mid_x - cent_x,
                new_y = y + mid_y - cent_y;

            Crafty.viewport.pan(new_x, new_y, time);
        },

        /**@
         * #Crafty.viewport.zoom
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.zoom(Number amt, Number cent_x, Number cent_y, Number time)
         * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
         * @param Number cent_x - the center to zoom on
         * @param Number cent_y - the center to zoom on
         * @param Number time - the duration in ms of the entire zoom operation
         *
         * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
         * amt < 1 will bring it farther away. amt = 0 will reset to the default zoom level
         * Zooming is multiplicative. To reset the zoom amount, pass 0.
         */
        zoom: (function () {
            

            function stopZoom(){
                Crafty.unbind("EnterFrame", enterFrame);
            }
            Crafty.bind("StopCamera", stopZoom);

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

            return function (amt, cent_x, cent_y, time){
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

                easing = new Crafty.easing(time);

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
            var bound = this.bounds || Crafty.map.boundaries();
            bound.max.x *= this._scale;
            bound.min.x *= this._scale;
            bound.max.y *= this._scale;
            bound.min.y *= this._scale;
            if (bound.max.x - bound.min.x > Crafty.viewport.width) {
                if (Crafty.viewport.x < -bound.max.x + Crafty.viewport.width) {
                    Crafty.viewport.x = -bound.max.x + Crafty.viewport.width;
                } else if (Crafty.viewport.x > -bound.min.x) {
                    Crafty.viewport.x = -bound.min.x;
                }
            } else {
                Crafty.viewport.x = -1 * (bound.min.x + (bound.max.x - bound.min.x) / 2 - Crafty.viewport.width / 2);
            }
            if (bound.max.y - bound.min.y > Crafty.viewport.height) {
                if (Crafty.viewport.y < -bound.max.y + Crafty.viewport.height) {
                    Crafty.viewport.y = -bound.max.y + Crafty.viewport.height;
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
         * Initialize the viewport. If the arguments 'width' or 'height' are missing, use Crafty.DOM.window.width and Crafty.DOM.window.height (full screen model).
         *
         * The argument 'stage_elem' is used to specify a stage element other than the default, and can be either a string or an HTMLElement.  If a string is provided, it will look for an element with that id and, if none exists, create a div.  If an HTMLElement is provided, that is used directly.  Omitting this argument is the same as passing an id of 'cr-stage'.
         *
         * @see Crafty.device, Crafty.DOM, Crafty.stage
         */
        init: function (w, h, stage_elem) {
            Crafty.DOM.window.init();

            // setters+getters for the viewport
            this._defineViewportProperties();
            // If no width or height is defined, the width and height is set to fullscreen
            this._width = (!w) ? Crafty.DOM.window.width : w;
            this._height = (!h) ? Crafty.DOM.window.height : h;


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
             * #Crafty.stage.inner
             * @comp Crafty.stage
             * `Crafty.stage.inner` is a div inside the `#cr-stage` div that holds all DOM entities.
             * If you use canvas, a `canvas` element is created at the same level in the dom
             * as the the `Crafty.stage.inner` div. So the hierarchy in the DOM is
             *  
             * ~~~
             * Crafty.stage.elem
             *  - Crafty.stage.inner (a div HTMLElement)
             *  - Crafty.canvas._canvas (a canvas HTMLElement)
             * ~~~
             */

            //create stage div to contain everything
            Crafty.stage = {
                x: 0,
                y: 0,
                fullscreen: false,
                elem: (crstage ? crstage : document.createElement("div")),
                inner: document.createElement("div")
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

            Crafty.stage.elem.appendChild(Crafty.stage.inner);
            Crafty.stage.inner.style.position = "absolute";
            Crafty.stage.inner.style.zIndex = "1";
            Crafty.stage.inner.style.transformStyle = "preserve-3d"; // Seems necessary for Firefox to preserve zIndexes?

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


            } else {
                elem.position = "relative";
                //find out the offset position of the stage
                offset = Crafty.DOM.inner(Crafty.stage.elem);
                Crafty.stage.x = offset.x;
                Crafty.stage.y = offset.y;
            }

            
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
            Crafty.DOM.window.init();
            var w = Crafty.DOM.window.width,
                h = Crafty.DOM.window.height,
                offset;


            if (Crafty.stage.fullscreen) {
                this._width = w;
                this._height = h;
                Crafty.trigger("ViewportResize");
            }

            offset = Crafty.DOM.inner(Crafty.stage.elem);
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
            Crafty.viewport.scale(1);
        }
    }
});
