var Crafty = require('../core/core.js');
var document = (typeof window !== "undefined") && window.document;

/**@
 * #Crafty.support
 * @category Misc, Core
 * @kind CoreObject
 * 
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
     * @kind Property
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
     * @kind Property
     * 
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
     * @kind Property
     * 
     * Is HTML5 `Audio` supported?
     */
    support.audio = (typeof window !== "undefined") && ('canPlayType' in document.createElement('audio'));

    /**@
     * #Crafty.support.prefix
     * @comp Crafty.support
     * @kind Property
     * 
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
         * @kind Property
         * 
         * Version of the browser
         */
        support.versionName = match[2];

        /**@
         * #Crafty.support.version
         * @comp Crafty.support
         * @kind Property
         * 
         * Version number of the browser as an Integer (first number)
         */
        support.version = +(match[2].split("."))[0];
    }

    /**@
     * #Crafty.support.canvas
     * @comp Crafty.support
     * @kind Property
     * 
     * Is the `canvas` element supported?
     */
    support.canvas = (typeof window !== "undefined") && ('getContext' in document.createElement("canvas"));

    /**@
     * #Crafty.support.webgl
     * @comp Crafty.support
     * @kind Property
     * 
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
     * @kind Property
     * 
     * Is css3Dtransform supported by browser.
     */
    support.css3dtransform = (typeof window !== "undefined") && ((typeof document.createElement("div").style.Perspective !== "undefined") || (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined"));

    /**@
     * #Crafty.support.deviceorientation
     * @comp Crafty.support
     * @kind Property
     * Is deviceorientation event supported by browser.
     */
    support.deviceorientation = (typeof window !== "undefined") && ((typeof window.DeviceOrientationEvent !== "undefined") || (typeof window.OrientationEvent !== "undefined"));

    /**@
     * #Crafty.support.devicemotion
     * @comp Crafty.support
     * @kind Property
     * 
     * Is devicemotion event supported by browser.
     */
    support.devicemotion = (typeof window !== "undefined") && (typeof window.DeviceMotionEvent !== "undefined");

})();
