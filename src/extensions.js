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
        try {
            Object.defineProperty({}, 'x', {});
        } catch (e) {
            return false
        };
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
        } catch (e) {}
        support.webgl = !! gl;
    } else {
        support.webgl = false;
    }

    /**@
     * #Crafty.support.css3dtransform
     * @comp Crafty.support
     * Is css3Dtransform supported by browser.
     */
    support.css3dtransform = (typeof document.createElement("div").style["Perspective"] !== "undefined") || (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined");

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
     * @sign public this Crafty.sprite([Number tile, [Number tileh]], String url, Object map[, Number paddingX[, Number paddingY]])
     * @param tile - Tile size of the sprite map, defaults to 1
     * @param tileh - Height of the tile; if provided, tile is interpreted as the width
     * @param url - URL of the sprite image
     * @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
     * @param paddingX - Horizontal space in between tiles. Defaults to 0.
     * @param paddingY - Vertical space in between tiles. Defaults to paddingX.
     * Generates components based on positions in a sprite image to be applied to entities.
     *
     * Accepts a tile size, URL and map for the name of the sprite and its position.
     *
     * The position must be an array containing the position of the sprite where index `0`
     * is the `x` position, `1` is the `y` position and optionally `2` is the width and `3`
     * is the height. If the sprite map has padding, pass the values for the `x` padding
     * or `y` padding. If they are the same, just add one value.
     *
     * If the sprite image has no consistent tile size, `1` or no argument need be
     * passed for tile size.
     *
     * Entities that add the generated components are also given the `2D` component, and
     * a component called `Sprite`.
     *
     * @example
     * ~~~
     * Crafty.sprite("imgs/spritemap6.png", {flower:[0,0,20,30]});
     * var flower_entity = Crafty.e("2D, DOM, flower");
     * ~~~
     * The first line creates a component called `flower` associated with the sub-image of
     * spritemap6.png with top-left corner (0,0), width 20 pixels, and height 30 pixels.
     * The second line creates an entity with that image. (Note: The `2D` is not really
     * necessary here, because adding the `flower` component automatically also adds the
     * `2D` component.)
     * ~~~
     * Crafty.sprite(50, "imgs/spritemap6.png", {flower:[0,0], grass:[0,1,3,1]});
     * ~~~
     * In this case, the `flower` component is pixels 0 <= x < 50, 0 <= y < 50, and the
     * `grass` component is pixels 0 <= x < 150, 50 <= y < 100. (The `3` means grass has a
     * width of 3 tiles, i.e. 150 pixels.)
     * ~~~
     * Crafty.sprite(50, 100, "imgs/spritemap6.png", {flower:[0,0], grass:[0,1]}, 10);
     * ~~~
     * In this case, each tile is 50x100, and there is a spacing of 10 pixels between
     * consecutive tiles. So `flower` is pixels 0 <= x < 50, 0 <= y < 100, and `grass` is
     * pixels 0 <= x < 50, 110 <= y < 210.
     *
     * @see Sprite
     */
    sprite: function (tile, tileh, url, map, paddingX, paddingY) {
        var spriteName, temp, x, y, w, h, img;

        //if no tile value, default to 1.
        //(if the first passed argument is a string, it must be the url.)
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
                    this.requires("2D, Sprite");
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
     * @example
     * Will add a stage-wide MouseDown event listener to the player. Will log which button was pressed
     * & the (x,y) coordinates in viewport/world/game space.
     * ~~~
     * var player = Crafty.e("2D");
     *     player.onMouseDown = function(e) {
     *         console.log(e.mouseButton, e.realX, e.realY);
     *     };
     * Crafty.addEvent(player, Crafty.stage.elem, "mousedown", player.onMouseDown);
     * ~~~
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