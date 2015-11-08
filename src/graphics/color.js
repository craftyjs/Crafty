var Crafty = require('../core/core.js'),
    document = window.document;




/**@
 * #Crafty.assignColor
 * @category Graphics
 * @sign Crafty.assignColor(color[, assignee])
 * @param color - a string represenation of the color to assign, in any valid HTML format
 * @param assignee - an object to use instead of creating one from scratch
 * @returns  An object with `_red`, `_green`, and `_blue` properties assigned.
 *           Potentially with `_strength` representing the alpha channel.
 *           If the assignee parameter is passed, that object will be assigned those values and returned.
 */
Crafty.extend({
    assignColor: (function(){
        
        // Create phantom element to assess color
        var element = document.createElement("div");
        element.style.display = "none";
        // Can't attach it til later on, so we need a flag!
        var element_attached = false;
        var dictionary = {
            "aqua":     "#00ffff",
            "black":    "#000000",
            "blue":     "#0000ff",
            "fuchsia":  "#ff00ff",
            "gray":     "#808080",
            "green":    "#00ff00",
            "lime":     "#00ff00",
            "maroon":   "#800000",
            "navy":     "#000080",
            "olive":    "#808000",
            "orange":   "#ffa500",
            "purple":   "#800080",
            "red":      "#ff0000",
            "silver":   "#c0c0c0",
            "teal":     "#008080",
            "white":    "#ffffff",
            "yellow":   "#ffff00"
        };

        function default_value(c){
            c._red = c._blue = c._green = 0;
            return c;
        }

        function hexComponent(component) {
            var hex = component.toString(16);
            if (hex.length==1)
                hex = "0" + hex;
            return hex;
        }

        function rgbToHex(r, g, b){
            return "#" + hexComponent(r) + hexComponent(g) + hexComponent(b);
        }

        function parseHexString(hex, c) {
            var l;
            if (hex.length === 7){
                l=2;
            } else if (hex.length === 4){
                l=1;
            } else {
                return default_value(c);
            }
            c._red = parseInt(hex.substr(1, l), 16);
            c._green = parseInt(hex.substr(1+l, l), 16);
            c._blue = parseInt(hex.substr(1+2*l, l), 16);
            return c;
        }

        var rgb_regex = /rgba?\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,?\s*([0-9.]+)?\)/;

        function parseRgbString(rgb, c) {
            var values = rgb_regex.exec(rgb);
            if( values===null || (values.length != 4 && values.length != 5)) {
                return default_value(c); // return bad result?         
            }
            c._red = Math.round(parseFloat(values[1]));
            c._green = Math.round(parseFloat(values[2]));
            c._blue = Math.round(parseFloat(values[3]));
            if (values[4]) {
                c._strength = parseFloat(values[4]);
            }
            return c;
        }

        function parseColorName(key, c){
            if (typeof dictionary[key] === "undefined"){
                if (element_attached === false){
                    window.document.body.appendChild(element);
                    element_attached = true;
                }
                element.style.color = key;
                var rgb = window.getComputedStyle(element).color;
                parseRgbString(rgb, c);
                dictionary[key] = rgbToHex(c._red, c._green, c._blue);
                //window.document.body.removeChild(element);
            } else {
                parseHexString(dictionary[key], c);
            }
            return c;
        }

        function rgbaString(c){
            return "rgba(" + c._red + ", " + c._green + ", " + c._blue + ", " + c._strength + ")";
        }

        // The actual assignColor function
        return function(color, c){
            c = c || {};
            color = color.trim().toLowerCase();
            var ret = null;
            if (color[0] === '#'){
                ret = parseHexString(color, c);
            } else if (color[0] === 'r' && color[1] === 'g' && color[2] === 'b'){
                ret = parseRgbString(color, c);
            } else {
                ret = parseColorName(color, c);
            }
            c._strength = c._strength || 1.0;
            c._color = rgbaString(c);
        };

    })()
});





// Define some variables required for webgl
var fs = require('fs');
var COLOR_VERTEX_SHADER = fs.readFileSync(__dirname + '/shaders/color.vert', 'utf8');
var COLOR_FRAGMENT_SHADER = fs.readFileSync(__dirname + '/shaders/color.frag', 'utf8');
var COLOR_ATTRIBUTE_LIST = [
    {name:"aPosition", width: 2},
    {name:"aOrientation", width: 3},
    {name:"aLayer", width:2},
    {name:"aColor",  width: 4}
];



/**@
 * #Color
 * @category Graphics
 * Draw a colored rectangle.
 */
Crafty.c("Color", {
    _red: 0,
    _green: 0,
    _blue: 0,
    _strength: 1.0,
    _color: "",
    ready: true,

    init: function () {
        this.bind("Draw", this._drawColor);
        if (this.has("WebGL")){
            this._establishShader("Color", COLOR_FRAGMENT_SHADER, COLOR_VERTEX_SHADER, COLOR_ATTRIBUTE_LIST);
        }
        this.trigger("Invalidate");
    },

    remove: function(){
        this.unbind("Draw", this._drawColor);
        if (this.has("DOM")){
            this._element.style.backgroundColor = "transparent";
        }
        this.trigger("Invalidate");
    },

    // draw function for "Color"
    _drawColor: function(e){
        if (!this._color) { return; }
        if (e.type === "DOM") {
            e.style.backgroundColor = this._color;
            e.style.lineHeight = 0;
        } else if (e.type === "canvas") {
            e.ctx.fillStyle = this._color;
            e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        } else if (e.type === "webgl"){
            e.program.writeVector("aColor",
                this._red/255,
                this._green/255,
                this._blue/255,
                this._strength
            );
        }
    },

    /**@
     * #.color
     * @comp Color
     * @trigger Invalidate - when the color changes
     *
     * Will assign the color and opacity, either through a string shorthand, or through explicit rgb values.
     * @sign public this .color(String color[, Float strength])
     * @param color - Color of the rectangle
     * @param strength - the opacity of the rectangle
     *
     * @sign public this .color(r, g, b[, strength])
     * @param r - value for the red channel
     * @param g - value for the green channel
     * @param b - value for the blue channel
     * @param strength - the opacity of the rectangle 
     *
     * @sign public String .color()
     * @return A string representing the current color as a CSS property.
     *
     * @example
     * ```
     * var c = Crafty.e("2D, DOM, Color");
     * c.color("#FF0000");
     * c.color("red");
     * c.color(255, 0, 0);
     * c.color("rgb(255, 0, 0")
     * ```
     * Three different ways of assign the color red.
     * ```
     * var c = Crafty.e("2D, DOM, Color");
     * c.color("#00FF00", 0.5);
     * c.color("rgba(0, 255, 0, 0.5)");
     * ```
     * Two ways of assigning a transparent green color.
     */
    color: function (color) {
        if (arguments.length === 0 ){
            return this._color;
        } else if (arguments.length>=3){
            this._red = arguments[0];
            this._green = arguments[1];
            this._blue = arguments[2];
            if (typeof arguments[3] === "number")
                this._strength = arguments[3];
        } else {
            // First argument is color name
            Crafty.assignColor(color, this);
            // Second argument, if present, is strength of color
            // Note that assignColor will give a default strength of 1.0 if none exists.
            if (typeof arguments[1] == "number")
                this._strength = arguments[1];
        }
        this._color = "rgba(" + this._red + ", " + this._green + ", " + this._blue + ", " + this._strength + ")";
        this.trigger("Invalidate");
        return this;
    }
});

