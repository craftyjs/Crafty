var Crafty = require('../core/core.js');


/**@
 * #Text
 * @category Graphics
 * @trigger Invalidate - when the text is changed
 * @requires Canvas or DOM
 * Component to make a text entity.
 *
 * By default, text will have the style "10px sans-serif".
 *
 * @note An entity with the text component is just text! If you want to write text
 * inside an image, you need one entity for the text and another entity for the image.
 * More tips for writing text inside an image: (1) Use the z-index (from 2D component)
 * to ensure that the text is on top of the image, not the other way around; (2)
 * use .attach() (from 2D component) to glue the text to the image so they move and
 * rotate together.
 *
 * @note For DOM (but not canvas) text entities, various font settings (like
 * text-decoration and text-align) can be set using `.css()` (see DOM component). But
 * you cannot use `.css()` to set the properties which are controlled by `.textFont()`
 * or `.textColor()` -- the settings will be ignored.
 *
 * @note If you use canvas text with glyphs that are taller than standard letters, portions of the glyphs might be cut off.
 */
Crafty.c("Text", {
    _text: "",
    defaultSize: "10px",
    defaultFamily: "sans-serif",
    defaultVariant: "normal",
    defaultLineHeight: "normal",
    ready: true,

    init: function () {
        this.requires("2D");
        this._textFont = {
            "type": "",
            "weight": "",
            "size": this.defaultSize,
            "lineHeight":this.defaultLineHeight,
            "family": this.defaultFamily,
            "variant": this.defaultVariant
        };

        this.bind("Draw", function (e) {
            var font = this._fontString();

            if (e.type === "DOM") {
                var el = this._element,
                    style = el.style;

                style.color = this._textColor;
                style.font = font;
                el.innerHTML = this._text;
            } else if (e.type === "canvas") {
                var context = e.ctx;

                context.save();

                context.textBaseline = "top";
                context.fillStyle = this._textColor || "rgb(0,0,0)";
                context.font = font;

                context.fillText(this._text, e.pos._x, e.pos._y);

                context.restore();
            }
        });
    },

    // takes a CSS font-size string and gets the height of the resulting font in px
    _getFontHeight: (function(){
        // regex for grabbing the first string of letters
        var re = /([a-zA-Z]+)\b/;
        // From the CSS spec.  "em" and "ex" are undefined on a canvas.
        var multipliers = {
            "px": 1,
            "pt": 4/3,
            "pc": 16,
            "cm": 96/2.54,
            "mm": 96/25.4,
            "in": 96,
            "em": undefined,
            "ex": undefined
        };
        return function (font){
            var number = parseFloat(font);
            var match = re.exec(font);
            var unit =  match ? match[1] : "px";
            if (multipliers[unit] !== undefined)
                return Math.ceil(number * multipliers[unit]);
            else
                return Math.ceil(number);
        };
    })(),

    /**@
     * #.text
     * @comp Text
     * @sign public this .text(String text)
     * @param text - String of text that will be inserted into the DOM or Canvas element.
     *
     * @sign public this .text(Function textGenerator)
     * @param textGenerator - A function that returns a string.  
     *        It will be immediately invoked in the context of the entity, with the result used as the text to display.
     *
     * This method will update the text inside the entity.
     *
     * If you need to reference attributes on the entity itself you can pass a function instead of a string.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 }).text("Look at me!!");
     *
     * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 })
     *     .text(function () { return "My position is " + this._x });
     *
     * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 }).text("Look at me!!");
     *
     * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 })
     *     .text(function () { return "My position is " + this._x });
     * ~~~
     */
    text: function (text) {
        if (!(typeof text !== "undefined" && text !== null)) return this._text;
        if (typeof (text) == "function")
            this._text = text.call(this);
        else
            this._text = text;

        if (this.has("Canvas") )
            this._resizeForCanvas();

        this.trigger("Invalidate");
        return this;
    },

    // Calculates the height and width of text on the canvas
    // Width is found by using the canvas measureText function
    // Height is only estimated -- it calculates the font size in pixels, and sets the height to 110% of that.
    _resizeForCanvas: function(){
        var ctx = this._drawContext;
        ctx.font = this._fontString();
        this.w = ctx.measureText(this._text).width;

        var size = (this._textFont.size || this.defaultSize);
        this.h = 1.1 * this._getFontHeight(size);
    },

    // Returns the font string to use
    _fontString: function(){
        return this._textFont.type + ' ' + this._textFont.variant  + ' ' + this._textFont.weight + ' ' + this._textFont.size  + ' / ' + this._textFont.lineHeight + ' ' + this._textFont.family;
    },
    /**@
     * #.textColor
     * @comp Text
     * @sign public this .textColor(String color)
     * @param color - The color in name, hex, rgb or rgba
     *
     * Change the color of the text. You can use HEX, rgb and rgba colors. 
     *
     * If you want the text to be transparent, you should use rgba where you can define alphaChannel.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 }).text("Look at me!!")
     *   .textColor('#FF0000');
     *
     * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 }).text('Look at me!!')
     *   .textColor('rgba(0, 255, 0, 0.5)');
     *
     * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 }).text('Look at me!!')
     *   .textColor('white');
     * ~~~
     * @see Crafty.assignColor
     */
    textColor: function (color) {
        Crafty.assignColor(color, this);
        this._textColor = "rgba(" + this._red + ", " + this._green + ", " + this._blue + ", " + this._strength + ")";
        this.trigger("Invalidate");
        return this;
    },

    /**@
     * #.textFont
     * @comp Text
     * @triggers Invalidate
     * @sign public this .textFont(String key, * value)
     * @param key - Property of the entity to modify
     * @param value - Value to set the property to
     *
     * @sign public this .textFont(Object map)
     * @param map - Object where the key is the property to modify and the value as the property value
     *
     * Use this method to set font property of the text entity.  Possible values are: type, weight, size, family, lineHeight, and variant.
     *
     * When rendered by the canvas, lineHeight and variant will be ignored.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Text").textFont({ type: 'italic', family: 'Arial' });
     * Crafty.e("2D, Canvas, Text").textFont({ size: '20px', weight: 'bold' });
     *
     * Crafty.e("2D, Canvas, Text").textFont("type", "italic");
     * Crafty.e("2D, Canvas, Text").textFont("type"); // italic
     * ~~~
     */
    textFont: function (key, value) {
        if (arguments.length === 1) {
            //if just the key, return the value
            if (typeof key === "string") {
                return this._textFont[key];
            }

            if (typeof key === "object") {
                for (var propertyKey in key) {
                    if(propertyKey == 'family'){
                        this._textFont[propertyKey] = "'" + key[propertyKey] + "'";
                    } else {
                        this._textFont[propertyKey] = key[propertyKey];
                    }
                }
            }
        } else {
            this._textFont[key] = value;
        }

        if (this.has("Canvas") )
            this._resizeForCanvas();

        this.trigger("Invalidate");
        return this;
    },
    /**@
     * #.unselectable
     * @comp Text
     * @triggers Invalidate
     * @sign public this .unselectable()
     *
     * This method sets the text so that it cannot be selected (highlighted) by dragging.
     * (Canvas text can never be highlighted, so this only matters for DOM text.)
     * Works by changing the css property "user-select" and its variants.
     * 
     * Likewise, this sets the mouseover cursor to be "default" (arrow), not "text" (I-beam)
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Text").text('This text cannot be highlighted!').unselectable();
     * ~~~
     */
    unselectable: function () {
        // http://stackoverflow.com/questions/826782/css-rule-to-disable-text-selection-highlighting
        if (this.has("DOM")) {
            this.css({
                '-webkit-touch-callout': 'none',
                '-webkit-user-select': 'none',
                '-khtml-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
                'user-select': 'none',
                'cursor': 'default'
            });
            this.trigger("Invalidate");
        }
        return this;
    }

});