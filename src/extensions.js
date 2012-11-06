/**@
* #Crafty.support
* @category Misc, Core
* Determines feature support for what Crafty can do.
*/

(function testSupport() {
    var support = Crafty.support = {},
        ua = navigator.userAgent.toLowerCase(),
        match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                /(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
                /(ms)ie ([\w.]+)/.exec(ua) ||
                /(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [],
        mobile = /iPad|iPod|iPhone|Android|webOS|IEMobile/i.exec(ua);

    /**@
    * #Crafty.mobile
    * @comp Crafty.device
    * 
    * Determines if Crafty is running on mobile device.
    * 
    * If Crafty.mobile is equal true Crafty does some things under hood:
    * ~~~
    * - set viewport on max device width and height
    * - set Crafty.stage.fullscreen on true
    * - hide window scrollbars
    * ~~~
    * 
    * @see Crafty.viewport
    */
    if (mobile) Crafty.mobile = mobile[0];

    /**@
    * #Crafty.support.setter
    * @comp Crafty.support
    * Is `__defineSetter__` supported?
    */
    support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);

    /**@
    * #Crafty.support.defineProperty
    * @comp Crafty.support
    * Is `Object.defineProperty` supported?
    */
    support.defineProperty = (function () {
        if (!'defineProperty' in Object) return false;
        try { Object.defineProperty({}, 'x', {}); }
        catch (e) { return false };
        return true;
    })();

    /**@
    * #Crafty.support.audio
    * @comp Crafty.support
    * Is HTML5 `Audio` supported?
    */
    support.audio = ('Audio' in window);

    /**@
    * #Crafty.support.prefix
    * @comp Crafty.support
    * Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`).
    */
    support.prefix = (match[1] || match[0]);

    //browser specific quirks
    if (support.prefix === "moz") support.prefix = "Moz";
    if (support.prefix === "o") support.prefix = "O";

    if (match[2]) {
        /**@
        * #Crafty.support.versionName
        * @comp Crafty.support
        * Version of the browser
        */
        support.versionName = match[2];

        /**@
        * #Crafty.support.version
        * @comp Crafty.support
        * Version number of the browser as an Integer (first number)
        */
        support.version = +(match[2].split("."))[0];
    }

    /**@
    * #Crafty.support.canvas
    * @comp Crafty.support
    * Is the `canvas` element supported?
    */
    support.canvas = ('getContext' in document.createElement("canvas"));

    /**@
    * #Crafty.support.webgl
    * @comp Crafty.support
    * Is WebGL supported on the canvas element?
    */
    if (support.canvas) {
        var gl;
        try {
            gl = document.createElement("canvas").getContext("experimental-webgl");
            gl.viewportWidth = support.canvas.width;
            gl.viewportHeight = support.canvas.height;
        }
        catch (e) { }
        support.webgl = !!gl;
    }
    else {
        support.webgl = false;
    }

    /**@
    * #Crafty.support.css3dtransform
    * @comp Crafty.support
    * Is css3Dtransform supported by browser.
    */
    support.css3dtransform = (typeof document.createElement("div").style["Perspective"] !== "undefined")
                            || (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined");

    /**@
    * #Crafty.support.deviceorientation
    * @comp Crafty.support
    * Is deviceorientation event supported by browser.
    */
    support.deviceorientation = (typeof window.DeviceOrientationEvent !== "undefined") || (typeof window.OrientationEvent !== "undefined");

    /**@
    * #Crafty.support.devicemotion
    * @comp Crafty.support
    * Is devicemotion event supported by browser.
    */
    support.devicemotion = (typeof window.DeviceMotionEvent !== "undefined");

})();
Crafty.extend({

    zeroFill: function (number, width) {
        width -= number.toString().length;
        if (width > 0)
            return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
        return number.toString();
    },

    /**@
    * #Crafty.sprite
    * @category Graphics
    * @sign public this Crafty.sprite([Number tile], String url, Object map[, Number paddingX[, Number paddingY]])
    * @param tile - Tile size of the sprite map, defaults to 1
    * @param url - URL of the sprite image
    * @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
    * @param paddingX - Horizontal space in between tiles. Defaults to 0.
    * @param paddingY - Vertical space in between tiles. Defaults to paddingX.
    * Generates components based on positions in a sprite image to be applied to entities.
    *
    * Accepts a tile size, URL and map for the name of the sprite and it's position.
    *
    * The position must be an array containing the position of the sprite where index `0`
    * is the `x` position, `1` is the `y` position and optionally `2` is the width and `3`
    * is the height. If the sprite map has padding, pass the values for the `x` padding
    * or `y` padding. If they are the same, just add one value.
    *
    * If the sprite image has no consistent tile size, `1` or no argument need be
    * passed for tile size.
    *
    * Entities that add the generated components are also given a component called `Sprite`.
    * 
    * @see Sprite
    */
    sprite: function (tile, tileh, url, map, paddingX, paddingY) {
        var spriteName, temp, x, y, w, h, img;

        //if no tile value, default to 1
        if (typeof tile === "string") {
            paddingY = paddingX;
            paddingX = map;
            map = tileh;
            url = tile;
            tile = 1;
            tileh = 1;
        }

        if (typeof tileh == "string") {
            paddingY = paddingX;
            paddingX = map;
            map = url;
            url = tileh;
            tileh = tile;
        }

        //if no paddingY, use paddingX
        if (!paddingY && paddingX) paddingY = paddingX;
        paddingX = parseInt(paddingX || 0, 10); //just incase
        paddingY = parseInt(paddingY || 0, 10);

        img = Crafty.asset(url);
        if (!img) {
            img = new Image();
            img.src = url;
            Crafty.asset(url, img);
            img.onload = function () {
                //all components with this img are now ready
                for (spriteName in map) {
                    Crafty(spriteName).each(function () {
                        this.ready = true;
                        this.trigger("Change");
                    });
                }
            };
        }

        for (spriteName in map) {
            if (!map.hasOwnProperty(spriteName)) continue;

            temp = map[spriteName];
            x = temp[0] * (tile + paddingX);
            y = temp[1] * (tileh + paddingY);
            w = temp[2] * tile || tile;
            h = temp[3] * tileh || tileh;

            //generates sprite components for each tile in the map
            Crafty.c(spriteName, {
                ready: false,
                __coord: [x, y, w, h],

                init: function () {
                    this.requires("Sprite");
                    this.__trim = [0, 0, 0, 0];
                    this.__image = url;
                    this.__coord = [this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]];
                    this.__tile = tile;
                    this.__tileh = tileh;
                    this.__padding = [paddingX, paddingY];
                    this.img = img;

                    //draw now
                    if (this.img.complete && this.img.width > 0) {
                        this.ready = true;
                        this.trigger("Change");
                    }

                    //set the width and height to the sprite size
                    this.w = this.__coord[2];
                    this.h = this.__coord[3];
                }
            });
        }

        return this;
    },

    _events: {},

    /**@
    * #Crafty.addEvent
    * @category Events, Misc
    * @sign public this Crafty.addEvent(Object ctx, HTMLElement obj, String event, Function callback)
    * @param ctx - Context of the callback or the value of `this`
    * @param obj - Element to add the DOM event to
    * @param event - Event name to bind to
    * @param callback - Method to execute when triggered
    * 
    * Adds DOM level 3 events to elements. The arguments it accepts are the call
    * context (the value of `this`), the DOM element to attach the event to,
    * the event name (without `on` (`click` rather than `onclick`)) and
    * finally the callback method.
    *
    * If no element is passed, the default element will be `window.document`.
    *
    * Callbacks are passed with event data.
    * 
    * @see Crafty.removeEvent
    */
    addEvent: function (ctx, obj, type, callback) {
        if (arguments.length === 3) {
            callback = type;
            type = obj;
            obj = window.document;
        }

        //save anonymous function to be able to remove
        var afn = function (e) { 
                var e = e || window.event; 

                if (typeof callback === 'function') {
                    callback.call(ctx, e);
                }
            },
            id = ctx[0] || "";

        if (!this._events[id + obj + type + callback]) this._events[id + obj + type + callback] = afn;
        else return;

        if (obj.attachEvent) { //IE
            obj.attachEvent('on' + type, afn);
        } else { //Everyone else
            obj.addEventListener(type, afn, false);
        }
    },

    /**@
    * #Crafty.removeEvent
    * @category Events, Misc
    * @sign public this Crafty.removeEvent(Object ctx, HTMLElement obj, String event, Function callback)
    * @param ctx - Context of the callback or the value of `this`
    * @param obj - Element the event is on
    * @param event - Name of the event
    * @param callback - Method executed when triggered
    * 
    * Removes events attached by `Crafty.addEvent()`. All parameters must
    * be the same that were used to attach the event including a reference
    * to the callback method.
    * 
    * @see Crafty.addEvent
    */
    removeEvent: function (ctx, obj, type, callback) {
        if (arguments.length === 3) {
            callback = type;
            type = obj;
            obj = window.document;
        }

        //retrieve anonymous function
        var id = ctx[0] || "",
            afn = this._events[id + obj + type + callback];

        if (afn) {
            if (obj.detachEvent) {
                obj.detachEvent('on' + type, afn);
            } else obj.removeEventListener(type, afn, false);
            delete this._events[id + obj + type + callback];
        }
    },

    /**@
    * #Crafty.background
    * @category Graphics, Stage
    * @sign public void Crafty.background(String value)
    * @param style - Modify the background with a color or image
    * 
    * This method is essentially a shortcut for adding a background
    * style to the stage element.
    */
    background: function (style) {
        Crafty.stage.elem.style.background = style;
    },

    /**@
    * #Crafty.viewport
    * @category Stage
    * 
    * Viewport is essentially a 2D camera looking at the stage. Can be moved which
    * in turn will react just like a camera moving in that direction.
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
        width: 0,
        height: 0,
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
         * #Crafty.viewport.bounds
         * @comp Crafty.viewport
         *
		 * A rectangle which defines the bounds of the viewport. If this 
		 * variable is null, Crafty uses the bounding box of all the items
		 * on the stage.
         */
        bounds:null,

        /**@
         * #Crafty.viewport.scroll
         * @comp Crafty.viewport
         * @sign Crafty.viewport.scroll(String axis, Number v)
         * @param axis - 'x' or 'y'
         * @param v - The new absolute position on the axis
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
        scroll: function (axis, v) {
            v = Math.floor(v);
            var change = v - this[axis], //change in direction
                context = Crafty.canvas.context,
                style = Crafty.stage.inner.style,
                canvas;

            //update viewport and DOM scroll
            this[axis] = v;
			if (context) {
				if (axis == '_x') {
					context.translate(change, 0);
				} else {
					context.translate(0, change);
				}
				Crafty.DrawManager.drawAll();
			}
            style[axis == '_x' ? "left" : "top"] = v + "px";
        },

        rect: function () {
            return { _x: -this._x, _y: -this._y, _w: this.width, _h: this.height };
        },

        /**@
         * #Crafty.viewport.pan
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.pan(String axis, Number v, Number time)
         * @param String axis - 'x' or 'y'. The axis to move the camera on
         * @param Number v - the distance to move the camera by
         * @param Number time - The duration in frames for the entire camera movement
         *
         * Pans the camera a given number of pixels over a given number of frames
         */
        pan: (function () {
            var tweens = {}, i, bound = false;

            function enterFrame(e) {
                var l = 0;
                for (i in tweens) {
                    var prop = tweens[i];
                    if (prop.remTime > 0) {
                        prop.current += prop.diff;
                        prop.remTime--;
                        Crafty.viewport[i] = Math.floor(prop.current);
                        l++;
                    }
                    else {
                        delete tweens[i];
                    }
                }
                if (l) Crafty.viewport._clamp();
            }

            return function (axis, v, time) {
                Crafty.viewport.follow();
                if (axis == 'reset') {
                    for (i in tweens) {
                        tweens[i].remTime = 0;
                    }
                    return;
                }
                if (time == 0) time = 1;
                tweens[axis] = {
                    diff: -v / time,
                    current: Crafty.viewport[axis],
                    remTime: time
                };
                if (!bound) {
                    Crafty.bind("EnterFrame", enterFrame);
                    bound = true;
                }
            }
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

            return function (target, offsetx, offsety) {
                if (oldTarget)
                    oldTarget.unbind('Change', change);
                if (!target || !target.has('2D'))
                    return;
                Crafty.viewport.pan('reset');

                oldTarget = target;
                offx = (typeof offsetx != 'undefined') ? offsetx : 0;
                offy = (typeof offsety != 'undefined') ? offsety : 0;

                target.bind('Change', change);
                change.call(target);
            }
        })(),

        /**@
         * #Crafty.viewport.centerOn
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.centerOn(Object target, Number time)
         * @param Object target - An entity with the 2D component
         * @param Number time - The number of frames to perform the centering over
         *
         * Centers the viewport on the given entity
         */
        centerOn: function (targ, time) {
            var x = targ.x,
                    y = targ.y,
                    mid_x = targ.w / 2,
                    mid_y = targ.h / 2,
                    cent_x = Crafty.viewport.width / 2,
                    cent_y = Crafty.viewport.height / 2,
                    new_x = x + mid_x - cent_x,
                    new_y = y + mid_y - cent_y;

            Crafty.viewport.pan('reset');
            Crafty.viewport.pan('x', new_x, time);
            Crafty.viewport.pan('y', new_y, time);
        },
        /**@
        * #Crafty.viewport._zoom
        * @comp Crafty.viewport
        * 
        * This value keeps an amount of viewport zoom, required for calculating mouse position at entity
        */
        _zoom : 1,

        /**@
         * #Crafty.viewport.zoom
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.zoom(Number amt, Number cent_x, Number cent_y, Number time)
         * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
         * @param Number cent_x - the center to zoom on
         * @param Number cent_y - the center to zoom on
         * @param Number time - the duration in frames of the entire zoom operation
         *
         * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
         * amt < 1 will bring it farther away. amt = 0 will do nothing.
         * Zooming is multiplicative. To reset the zoom amount, pass 0.
         */
        zoom: (function () {
            var zoom = 1,
                zoom_tick = 0,
                dur = 0,
                prop = Crafty.support.prefix + "Transform",
                bound = false,
                act = {},
                prct = {};
            // what's going on:
            // 1. Get the original point as a percentage of the stage
            // 2. Scale the stage
            // 3. Get the new size of the stage
            // 4. Get the absolute position of our point using previous percentage
            // 4. Offset inner by that much

            function enterFrame() {
                if (dur > 0) {
					if (isFinite(Crafty.viewport._zoom)) zoom = Crafty.viewport._zoom;
                    var old = {
                        width: act.width * zoom,
                        height: act.height * zoom
                    };
                    zoom += zoom_tick;
                    Crafty.viewport._zoom = zoom;
                    var new_s = {
                        width: act.width * zoom,
                        height: act.height * zoom
                    },
                    diff = {
                        width: new_s.width - old.width,
                        height: new_s.height - old.height
                    };
                    Crafty.stage.inner.style[prop] = 'scale(' + zoom + ',' + zoom + ')';
                    if (Crafty.canvas._canvas) {
						var czoom = zoom / (zoom - zoom_tick);
						Crafty.canvas.context.scale(czoom, czoom);
                        Crafty.DrawManager.drawAll();
                    }
                    Crafty.viewport.x -= diff.width * prct.width;
                    Crafty.viewport.y -= diff.height * prct.height;
                    dur--;
                }
            }

            return function (amt, cent_x, cent_y, time) {
                var bounds = this.bounds || Crafty.map.boundaries(),
                    final_zoom = amt ? zoom * amt : 1;
				if (!amt) {	// we're resetting to defaults
					zoom = 1;
					this._zoom = 1;
				}

                act.width = bounds.max.x - bounds.min.x;
                act.height = bounds.max.y - bounds.min.y;

                prct.width = cent_x / act.width;
                prct.height = cent_y / act.height;

                if (time == 0) time = 1;
                zoom_tick = (final_zoom - zoom) / time;
                dur = time;

                Crafty.viewport.pan('reset');
                if (!bound) {
                    Crafty.bind('EnterFrame', enterFrame);
                    bound = true;
                }
            }
        })(),
        /**@
         * #Crafty.viewport.scale
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.scale(Number amt)
         * @param Number amt - amount to zoom/scale in on the element on the viewport by (eg. 2, 4, 0.5)
         *
         * Zooms/scale the camera. amt > 1 increase all entities on stage 
         * amt < 1 will reduce all entities on stage. amt = 0 will reset the zoom/scale.
         * Zooming/scaling is multiplicative. To reset the zoom/scale amount, pass 0.
         *
         * @example
         * ~~~
         * Crafty.viewport.scale(2); //to see effect add some entities on stage.
         * ~~~
         */
        scale: (function () {
            var prop = Crafty.support.prefix + "Transform",
                act = {};
            return function (amt) {
                var bounds = this.bounds || Crafty.map.boundaries(),
                    final_zoom = amt ? this._zoom * amt : 1,
					czoom = final_zoom / this._zoom;

                this._zoom = final_zoom;
                act.width = bounds.max.x - bounds.min.x;
                act.height = bounds.max.y - bounds.min.y;
                var new_s = {
                    width: act.width * final_zoom,
                    height: act.height * final_zoom
                }
                Crafty.viewport.pan('reset');
                Crafty.stage.inner.style['transform'] = 
				Crafty.stage.inner.style[prop] = 'scale(' + this._zoom + ',' + this._zoom + ')';

                if (Crafty.canvas._canvas) {
                    Crafty.canvas.context.scale(czoom, czoom);
                    Crafty.DrawManager.drawAll();
                }
                //Crafty.viewport.width = new_s.width;
                //Crafty.viewport.height = new_s.height;
            }
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
         */
        mouselook: (function () {
            var active = false,
                dragging = false,
                lastMouse = {}
            old = {};


            return function (op, arg) {
                if (typeof op == 'boolean') {
                    active = op;
                    if (active) {
                        Crafty.mouseObjs++;
                    }
                    else {
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

                        Crafty.viewport.x += diff.x;
                        Crafty.viewport.y += diff.y;
                        Crafty.viewport._clamp(); 
                    case 'start':
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
			bound.max.x *= this._zoom;
			bound.min.x *= this._zoom;
			bound.max.y *= this._zoom;
			bound.min.y *= this._zoom;
            if (bound.max.x - bound.min.x > Crafty.viewport.width) {
                bound.max.x -= Crafty.viewport.width;

                if (Crafty.viewport.x < -bound.max.x) {
                    Crafty.viewport.x = -bound.max.x;
                }
                else if (Crafty.viewport.x > -bound.min.x) {
                    Crafty.viewport.x = -bound.min.x;
                }
            }
            else {
                Crafty.viewport.x = -1 * (bound.min.x + (bound.max.x - bound.min.x) / 2 - Crafty.viewport.width / 2);
            }
            if (bound.max.y - bound.min.y > Crafty.viewport.height) {
                bound.max.y -= Crafty.viewport.height;

                if (Crafty.viewport.y < -bound.max.y) {
                    Crafty.viewport.y = -bound.max.y;
                }
                else if (Crafty.viewport.y > -bound.min.y) {
                    Crafty.viewport.y = -bound.min.y;
                }
            }
            else {
                Crafty.viewport.y = -1 * (bound.min.y + (bound.max.y - bound.min.y) / 2 - Crafty.viewport.height / 2);
            }
        },

        /**@
         * #Crafty.viewport.init
         * @comp Crafty.viewport
         * @sign public void Crafty.viewport.init([Number width, Number height])
         * @param width - Width of the viewport
         * @param height - Height of the viewport
         *
         * Initialize the viewport. If the arguments 'width' or 'height' are missing, or Crafty.mobile is true, use Crafty.DOM.window.width and Crafty.DOM.window.height (full screen model).
         * Create a div with id `cr-stage`, if there is not already an HTMLElement with id `cr-stage` (by `Crafty.viewport.init`).
         *
         * @see Crafty.device, Crafty.DOM, Crafty.stage
         */
        init: function (w, h) {
            Crafty.DOM.window.init();

            //fullscreen if mobile or not specified
            this.width = (!w || Crafty.mobile) ? Crafty.DOM.window.width : w;
            this.height = (!h || Crafty.mobile) ? Crafty.DOM.window.height : h;

            //check if stage exists
            var crstage = document.getElementById("cr-stage");

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
             * `Crafty.stage.elem`
             * <!-- not sure how to do indentation in the document-->
             *
             *     - `Crafty.stage.inner` (a div HTMLElement)
             *
             *     - `Crafty.canvas._canvas` (a canvas HTMLElement) 
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
            if ((!w && !h) || Crafty.mobile) {
                document.body.style.overflow = "hidden";
                Crafty.stage.fullscreen = true;
            }

            Crafty.addEvent(this, window, "resize", Crafty.viewport.reload);

            Crafty.addEvent(this, window, "blur", function () {
                if (Crafty.settings.get("autoPause")) {
                    if(!Crafty._paused) Crafty.pause();
                }
            });
            Crafty.addEvent(this, window, "focus", function () {
                if (Crafty._paused && Crafty.settings.get("autoPause")) {
                    Crafty.pause();
                }
            });

            //make the stage unselectable
            Crafty.settings.register("stageSelectable", function (v) {
                Crafty.stage.elem.onselectstart = v ? function () { return true; } : function () { return false; };
            });
            Crafty.settings.modify("stageSelectable", false);

            //make the stage have no context menu
            Crafty.settings.register("stageContextMenu", function (v) {
                Crafty.stage.elem.oncontextmenu = v ? function () { return true; } : function () { return false; };
            });
            Crafty.settings.modify("stageContextMenu", false);

            Crafty.settings.register("autoPause", function (){ });
            Crafty.settings.modify("autoPause", false);

            //add to the body and give it an ID if not exists
            if (!crstage) {
                document.body.appendChild(Crafty.stage.elem);
                Crafty.stage.elem.id = "cr-stage";
            }

            var elem = Crafty.stage.elem.style,
                offset;

            Crafty.stage.elem.appendChild(Crafty.stage.inner);
            Crafty.stage.inner.style.position = "absolute";
            Crafty.stage.inner.style.zIndex = "1";

            //css style
            elem.width = this.width + "px";
            elem.height = this.height + "px";
            elem.overflow = "hidden";

            if (Crafty.mobile) {
                elem.position = "absolute";
                elem.left = "0px";
                elem.top = "0px";

                // remove default gray highlighting after touch
                if (typeof elem.webkitTapHighlightColor != undefined) {
                    elem.webkitTapHighlightColor = "rgba(0,0,0,0)";
                }

                var meta = document.createElement("meta"),
                    head = document.getElementsByTagName("HEAD")[0];

                //stop mobile zooming and scrolling
                meta.setAttribute("name", "viewport");
                meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
                head.appendChild(meta);

                //hide the address bar
                meta = document.createElement("meta");
                meta.setAttribute("name", "apple-mobile-web-app-capable");
                meta.setAttribute("content", "yes");
                head.appendChild(meta);
                setTimeout(function () { window.scrollTo(0, 1); }, 0);

                Crafty.addEvent(this, window, "touchmove", function (e) {
                    e.preventDefault();
                });

                Crafty.stage.x = 0;
                Crafty.stage.y = 0;

            } else {
                elem.position = "relative";
                //find out the offset position of the stage
                offset = Crafty.DOM.inner(Crafty.stage.elem);
                Crafty.stage.x = offset.x;
                Crafty.stage.y = offset.y;
            }

            if (Crafty.support.setter) {
                //define getters and setters to scroll the viewport
                this.__defineSetter__('x', function (v) { this.scroll('_x', v); });
                this.__defineSetter__('y', function (v) { this.scroll('_y', v); });
                this.__defineGetter__('x', function () { return this._x; });
                this.__defineGetter__('y', function () { return this._y; });
                //IE9
            } else if (Crafty.support.defineProperty) {
                Object.defineProperty(this, 'x', { set: function (v) { this.scroll('_x', v); }, get: function () { return this._x; } });
                Object.defineProperty(this, 'y', { set: function (v) { this.scroll('_y', v); }, get: function () { return this._y; } });
            } else {
                //create empty entity waiting for enterframe
                this.x = this._x;
                this.y = this._y;
                Crafty.e("viewport");
            }
        },

        /**@
         * #Crafty.viewport.reload
         * @comp Crafty.stage
         * 
         * @sign public Crafty.viewport.reload()
         * 
         * Recalculate and reload stage width, height and position.
         * Useful when browser return wrong results on init (like safari on Ipad2).
         * 
         */
        reload : function () {
            Crafty.DOM.window.init();
            var w = Crafty.DOM.window.width,
                h = Crafty.DOM.window.height,
                offset;


            if (Crafty.stage.fullscreen) {
                this.width = w;
                this.height = h;
                Crafty.stage.elem.style.width = w + "px";
                Crafty.stage.elem.style.height = h + "px";

                if (Crafty.canvas._canvas) {
                    Crafty.canvas._canvas.width = w;
                    Crafty.canvas._canvas.height = h;
                    Crafty.DrawManager.drawAll();
                }
            }

            offset = Crafty.DOM.inner(Crafty.stage.elem);
            Crafty.stage.x = offset.x;
            Crafty.stage.y = offset.y;
        },
		
		/**@
		 * #Crafty.viewport.reset
		 * @comp Crafty.stage
		 *
		 * @sign public Crafty.viewport.reset()
		 *
		 * Resets the viewport to starting values
		 * Called when scene() is run.
		 */
		reset: function () {
			Crafty.viewport.pan('reset');
			Crafty.viewport.follow();
			Crafty.viewport.mouselook('stop');
			Crafty.viewport.scale();
		}
    },

    /**@
    * #Crafty.keys
    * @category Input
    * Object of key names and the corresponding key code.
    * 
    * ~~~
    * BACKSPACE: 8,
    * TAB: 9,
    * ENTER: 13,
    * PAUSE: 19,
    * CAPS: 20,
    * ESC: 27,
    * SPACE: 32,
    * PAGE_UP: 33,
    * PAGE_DOWN: 34,
    * END: 35,
    * HOME: 36,
    * LEFT_ARROW: 37,
    * UP_ARROW: 38,
    * RIGHT_ARROW: 39,
    * DOWN_ARROW: 40,
    * INSERT: 45,
    * DELETE: 46,
    * 0: 48,
    * 1: 49,
    * 2: 50,
    * 3: 51,
    * 4: 52,
    * 5: 53,
    * 6: 54,
    * 7: 55,
    * 8: 56,
    * 9: 57,
    * A: 65,
    * B: 66,
    * C: 67,
    * D: 68,
    * E: 69,
    * F: 70,
    * G: 71,
    * H: 72,
    * I: 73,
    * J: 74,
    * K: 75,
    * L: 76,
    * M: 77,
    * N: 78,
    * O: 79,
    * P: 80,
    * Q: 81,
    * R: 82,
    * S: 83,
    * T: 84,
    * U: 85,
    * V: 86,
    * W: 87,
    * X: 88,
    * Y: 89,
    * Z: 90,
    * NUMPAD_0: 96,
    * NUMPAD_1: 97,
    * NUMPAD_2: 98,
    * NUMPAD_3: 99,
    * NUMPAD_4: 100,
    * NUMPAD_5: 101,
    * NUMPAD_6: 102,
    * NUMPAD_7: 103,
    * NUMPAD_8: 104,
    * NUMPAD_9: 105,
    * MULTIPLY: 106,
    * ADD: 107,
    * SUBSTRACT: 109,
    * DECIMAL: 110,
    * DIVIDE: 111,
    * F1: 112,
    * F2: 113,
    * F3: 114,
    * F4: 115,
    * F5: 116,
    * F6: 117,
    * F7: 118,
    * F8: 119,
    * F9: 120,
    * F10: 121,
    * F11: 122,
    * F12: 123,
    * SHIFT: 16,
    * CTRL: 17,
    * ALT: 18,
    * PLUS: 187,
    * COMMA: 188,
    * MINUS: 189,
    * PERIOD: 190,
    * PULT_UP: 29460,
    * PULT_DOWN: 29461,
    * PULT_LEFT: 4,
    * PULT_RIGHT': 5
    * ~~~
    */
    keys: {
        'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190,
        'PULT_UP': 29460,
        'PULT_DOWN': 29461,
        'PULT_LEFT': 4,
        'PULT_RIGHT': 5

    },

    /**@
    * #Crafty.mouseButtons
    * @category Input
    * Object of mouseButton names and the corresponding button ID.
    * In all mouseEvents we add the e.mouseButton property with a value normalized to match e.button of modern webkit
    * 
    * ~~~
    * LEFT: 0,
    * MIDDLE: 1,
    * RIGHT: 2
    * ~~~
    */
    mouseButtons: {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
    }
});



/**
* Entity fixes the lack of setter support
*/
Crafty.c("viewport", {
    init: function () {
        this.bind("EnterFrame", function () {
            if (Crafty.viewport._x !== Crafty.viewport.x) {
                Crafty.viewport.scroll('_x', Crafty.viewport.x);
            }

            if (Crafty.viewport._y !== Crafty.viewport.y) {
                Crafty.viewport.scroll('_y', Crafty.viewport.y);
            }
        });
    }
});
