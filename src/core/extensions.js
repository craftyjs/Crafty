var Crafty = require('./core');
var document = (typeof window !== "undefined") && window.document;

/**@
 * #Crafty.support
 * @category Misc, Core
 * Determines feature support for what Crafty can do.
 */
(function testSupport() {
    var support = Crafty.support = {},
        ua = (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase()) || (typeof process !== "undefined" && process.version),
        match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
            /(ms)ie ([\w.]+)/.exec(ua) ||
            /(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) ||
            /(v)\d+\.(\d+)/.exec(ua) || [],
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
     * #Crafty.support.defineProperty
     * @comp Crafty.support
     * Is `Object.defineProperty` supported?
     */
    support.defineProperty = (function () {
        if (!('defineProperty' in Object)) return false;
        try {
            Object.defineProperty({}, 'x', {});
        } catch (e) {
            return false;
        }
        return true;
    })();

    /**@
     * #Crafty.support.audio
     * @comp Crafty.support
     * Is HTML5 `Audio` supported?
     */
    support.audio = (typeof window !== "undefined") && ('canPlayType' in document.createElement('audio'));

    /**@
     * #Crafty.support.prefix
     * @comp Crafty.support
     * Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`, `node`).
     */
    support.prefix = (match[1] || match[0]);

    //browser specific quirks
    if (support.prefix === "moz") support.prefix = "Moz";
    if (support.prefix === "o") support.prefix = "O";
    if (support.prefix === "v") support.prefix = "node";

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
    support.canvas = (typeof window !== "undefined") && ('getContext' in document.createElement("canvas"));

    /**@
     * #Crafty.support.webgl
     * @comp Crafty.support
     * Is WebGL supported on the canvas element?
     */
    if (support.canvas) {
        var gl;
        try {
            var c = document.createElement("canvas");
            gl = c.getContext("webgl") || c.getContext("experimental-webgl");
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
    support.css3dtransform = (typeof window !== "undefined") && ((typeof document.createElement("div").style.Perspective !== "undefined") || (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined"));

    /**@
     * #Crafty.support.deviceorientation
     * @comp Crafty.support
     * Is deviceorientation event supported by browser.
     */
    support.deviceorientation = (typeof window !== "undefined") && ((typeof window.DeviceOrientationEvent !== "undefined") || (typeof window.OrientationEvent !== "undefined"));

    /**@
     * #Crafty.support.devicemotion
     * @comp Crafty.support
     * Is devicemotion event supported by browser.
     */
    support.devicemotion = (typeof window !== "undefined") && (typeof window.DeviceMotionEvent !== "undefined");

})();

module.exports = {
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
     * @note This is related to DOM events only,  not Crafty's own event system.  
     * Of course, you can trigger Crafty events in the callback function!
     *
     * @example
     * Normally you'd use Crafty's built-in mouse component, but for the sake of an example let's pretend that doesn't exist.  
     * The following code will add a stage-wide MouseDown event listener to the player, and log both which button was pressed
     * and the (x,y) coordinates in viewport/world/game space.
     * ~~~
     * var player = Crafty.e("2D");
     *     player.onMouseDown = function(e) {
     *         Crafty.log(e.mouseButton, e.realX, e.realY);
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
            callback.call(ctx, e);
        },
            id = ctx[0] || "";

        if (!this._events[id + obj + type + callback]) 
            this._events[id + obj + type + callback] = afn;
        else  {
            return;
        }

        obj.addEventListener(type, afn, false);
        
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
            obj.removeEventListener(type, afn, false);
            delete this._events[id + obj + type + callback];
        }
    },

    /**@
     * #Crafty.background
     * @category Graphics, Stage
     * @sign public void Crafty.background(String style)
     * @param style - Modify the background with a color or image
     *
     * This method is a shortcut for adding a background
     * style to the stage element, i.e.
     * `Crafty.stage.elem.style.background = ...`
     * 
     * For example, if you want the background to be white,
     * with an image in the center, you might use:
     * ~~~
     * Crafty.background('#FFFFFF url(landscape.png) no-repeat center center');
     * ~~~
     *  
     */
    background: function (style) {
        Crafty.stage.elem.style.background = style;
    }
};
