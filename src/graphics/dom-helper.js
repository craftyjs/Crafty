var Crafty = require('../core/core.js'),
    document = window.document;

Crafty.extend({
    /**@
     * #Crafty.domHelper
     * @kind Property
     * @category Graphics
     *
     * Collection of utilities for using the DOM.
     */
    domHelper: {
        /**@
         * #Crafty.domHelper.innerPosition
         * @comp Crafty.domHelper
         * @sign public Object Crafty.domHelper.innerPosition(HTMLElement obj[, Object out])
         * @param obj - HTML element to calculate the position
         * @param out - optional object to save result in
         * @returns Object with `x` key being the `x` position, `y` being the `y` position
         *
         * Find a DOM elements position including
         * padding and border.
         */
        innerPosition: function (obj, out) {
            out = out || {};
            var rect = obj.getBoundingClientRect(),
                x = rect.left + (window.pageXOffset ? window.pageXOffset : document.body.scrollLeft),
                y = rect.top + (window.pageYOffset ? window.pageYOffset : document.body.scrollTop),
                //border left
                borderX = parseInt(this.getStyle(obj, 'border-left-width') || 0, 10) || parseInt(this.getStyle(obj, 'borderLeftWidth') || 0, 10) || 0,
                borderY = parseInt(this.getStyle(obj, 'border-top-width') || 0, 10) || parseInt(this.getStyle(obj, 'borderTopWidth') || 0, 10) || 0;

            out.x = x + borderX;
            out.y = y + borderY;
            return out;
        },

        /**@
         * #Crafty.domHelper.getStyle
         * @comp Crafty.domHelper
         * @kind Method
         * 
         * @sign public Object Crafty.domHelper.getStyle(HTMLElement obj, String property)
         * @param obj - HTML element to find the style
         * @param property - Style to return
         *
         * Determine the value of a style on an HTML element. Notation can be
         * in either CSS or JS.
         */
        getStyle: function (obj, prop) {
            var result;
            if (obj.currentStyle)
                result = obj.currentStyle[this.camelize(prop)];
            else if (window.getComputedStyle)
                result = document.defaultView.getComputedStyle(obj, null).getPropertyValue(this.csselize(prop));
            return result;
        },

        /**
         * Used in the Zepto framework
         *
         * Converts CSS notation to JS notation
         */
        camelize: function (str) {
            return str.replace(/-+(.)?/g, function (match, chr) {
                return chr ? chr.toUpperCase() : '';
            });
        },

        /**
         * Converts JS notation to CSS notation
         */
        csselize: function (str) {
            return str.replace(/[A-Z]/g, function (chr) {
                return chr ? '-' + chr.toLowerCase() : '';
            });
        },

        /**@
         * #Crafty.domHelper.translate
         * @comp Crafty.domHelper
         * @kind Method
         * 
         * @sign public Object Crafty.domHelper.translate(Number clientX, Number clientY[, DrawLayer layer[, Object out]])
         * @param clientX - clientX position in the browser screen
         * @param clientY - clientY position in the browser screen
         * @param layer - a Crafty draw layer
         * @param out - an optional object to save result in
         * @return Object `{x: ..., y: ...}` with Crafty coordinates.
         * 
         * The parameters clientX and clientY are pixel coordinates within the visible
         * browser window. This function translates those to Crafty coordinates (i.e.,
         * the coordinates that you might apply to an entity), by taking into account
         * where the stage is within the screen, what the current viewport is, etc.
         * 
         * If a draw layer is specified, the returned object will take into account any special scaling rules for that object.
         */
        translate: function (clientX, clientY, layer, out) {
            out = out || {};
            var doc = document.documentElement;
            var body = document.body;
            var view;
            // The branch here is to deal with the fact that the viewport position is the distance TO the origin, not from
            // But the _viewportRect is the opposite -- it uses the same convention as a rectangle that matches the viewport in that layer
            // At some point this should be simplified, probably by altering the viewport to use the more intuitive coordinates
            if (layer) {
                view = layer._viewportRect();
                out.x = (clientX - Crafty.stage.x + (doc && doc.scrollLeft || body && body.scrollLeft || 0)) / view._scale + view._x;
                out.y = (clientY - Crafty.stage.y + (doc && doc.scrollTop || body && body.scrollTop || 0)) / view._scale + view._y;
            } else {
                view = Crafty.viewport;
                out.x = (clientX - Crafty.stage.x + (doc && doc.scrollLeft || body && body.scrollLeft || 0)) / view._scale - view._x;
                out.y = (clientY - Crafty.stage.y + (doc && doc.scrollTop || body && body.scrollTop || 0)) / view._scale - view._y;
            }
            return out;
        }
    }
});