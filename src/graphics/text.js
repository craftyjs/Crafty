var Crafty = require('../core/core.js');


/**@
 * #Text
 * @category Graphics
 * @kind Component
 * 
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
 * @note For DOM (but not canvas) text entities, various font settings (such as
 * text-decoration) can be set using `.css()` (see DOM component). If you 
 * use `.css()` to set the *individual* properties which are controlled by `.textFont()`,
 *  `.textColor()`, or `.textAlign()`, the text component will set these properties internally as well.
 * However, if you use `.css()` to set shorthand properties such as `font`, these will be ignored by the text component.
 *
 * @note If you use canvas text with glyphs that are taller than standard letters, portions of the glyphs might be cut off.
 */
Crafty.c("Text", {
    _text: "",
    defaultSize: "10px",
    defaultFamily: "sans-serif",
    defaultVariant: "normal",
    defaultLineHeight: "normal",
    defaultTextAlign: "left",
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
        this._textAlign = this.defaultTextAlign;
    },

    events: {
        "Draw": function (e) {
            var font = this._fontString();

            if (e.type === "DOM") {
                var el = this._element,
                    style = el.style;

                style.color = this._textColor;
                style.font = font;
                style.textAlign = this._textAlign;
                el.innerHTML = this._text;
            } else if (e.type === "canvas") {
                var context = e.ctx;

                context.save();

                context.textBaseline = "top";
                context.fillStyle = this._textColor || "rgb(0,0,0)";
                context.font = font;
                context.textAlign = this._textAlign;

                context.fillText(this._text, e.pos._x, e.pos._y);

                context.restore();
            }
        },

        // type, weight, size, family, lineHeight, and variant.
        // For a few hardcoded css properties, set the internal definitions
        "SetStyle": function(propertyName) {
            // could check for DOM component, but this event should only be fired by such an entity!
            // Rather than triggering Invalidate on each of these, we rely on css() triggering that event 
            switch(propertyName) {
                case "textAlign": 
                    this._textAlign = this._element.style.textAlign;
                    break;
                case "color":
                    // Need to set individual color components, so use method
                    this.textColor(this._element.style.color);
                    break;
                case "fontType":
                    this._textFont.type = this._element.style.fontType;
                    break;
                case "fontWeight":
                    this._textFont.weight = this._element.style.fontWeight;
                    break;
                case "fontSize":
                    this._textFont.size = this._element.style.fontSize;
                    break;
                case "fontFamily":
                    this._textFont.family = this._element.style.fontFamily;
                    break;
                case "fontVariant":
                    this._textFont.variant = this._element.style.fontVariant;
                    break;
                case "lineHeight":
                    this._textFont.lineHeight = this._element.style.lineHeight;
                    break;
            }
           
        }
    },

    remove: function(){
        // Clean up the dynamic text update
        this.unbind(this._textUpdateEvent, this._dynamicTextUpdate);
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
     * @kind Method
     * 
     * @sign public this .text(String text)
     * @param text - String of text that will be inserted into the DOM or Canvas element.
     *
     * @sign public this .text(Function textGenerator[, Any eventData])
     * @param textGenerator - A function that returns a string.  
     *        It will be immediately invoked with the optional eventData in the context of the entity,
     *        with the result used as the text to display.
     * @param [eventData] - Optional parameter to invoke the function with.
     *
     * This method will update the text inside the entity.
     *
     * If you need to reference attributes on the entity itself you can pass a function instead of a string.
     * 
     * If dynamic text generation is turned on, the function will then be reevaluated as necessary.
     * 
     * @see .dynamicTextGeneration
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
    _textGenerator: null,
    text: function (text, eventData) {
        if (!(typeof text !== "undefined" && text !== null)) return this._text;
        if (typeof (text) === "function"){
            this._text = text.call(this, eventData);
            this._textGenerator = text;
        } else {
            this._text = text;
            this._textGenerator = null;
        }

        if (this.has("Canvas") )
            this._resizeForCanvas();

        this.trigger("Invalidate");
        return this;
    },

    /**@
     * #.dynamicTextGeneration
     * @comp Text
     * @kind Method
     * 
     * @sign public this .dynamicTextGeneration(bool dynamicTextOn[, string textUpdateEvent])
     * @param dynamicTextOn - A flag that indicates whether dyanamic text should be on or off.
     * @param textUpdateEvent - The name of the event which will trigger text to be updated.  Defaults to "UpdateFrame".  (This parameter does nothing if dynamicTextOn is false.)
     *
     * Turns on (or off) dynamic text generation for this entity.  While dynamic text generation is on, 
     * if the `.text()` method is called with a text generating function, the text will be updated each frame.
     * 
     * If textUpdateEvent is provided, text generation will be bound to that event instead of "UpdateFrame".
     *
     * The text generating function is invoked with the event object parameter, which the event was triggered with.
     * 
     * @note Dynamic text generation could cause performance issues when the entity is attached to a Canvas layer.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Text, Motion").attr({ x: 100, y: 100, vx: 10 })
     *     .text(function () { return "My position is " + this._x })
     *     .dynamicTextGeneration(true)
     * ~~~
     * The above example will update the text with the entities position as it changes.
     */
    _dynamicTextOn: false,
    _textUpdateEvent: null,
    _dynamicTextUpdate: function(eventData) {
        if (!this._textGenerator) return;
        this.text(this._textGenerator, eventData);
    },
    dynamicTextGeneration: function(dynamicTextOn, textUpdateEvent) {
        this.unbind(this._textUpdateEvent, this._dynamicTextUpdate);
        if (dynamicTextOn) {
            this._textUpdateEvent = textUpdateEvent || "UpdateFrame";
            this.bind(this._textUpdateEvent, this._dynamicTextUpdate);
        }
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

        /* Offset the MBR for text alignment*/
        if (this._textAlign === 'left' || this._textAlign === 'start') {
            this.offsetBoundary(0, 0, 0, 0);
        } else if (this._textAlign === 'center') {
            this.offsetBoundary(this.w/2, 0, -this.w/2, 0);
        } else if (this._textAlign === 'end' || this._textAlign === 'right') {
            this.offsetBoundary(this.w, 0, -this.w, 0);
        }
    },

    // Returns the font string to use
    _fontString: function(){
        return this._textFont.type + ' ' + this._textFont.variant  + ' ' + this._textFont.weight + ' ' + this._textFont.size  + ' / ' + this._textFont.lineHeight + ' ' + this._textFont.family;
    },
    /**@
     * #.textColor
     * @comp Text
     * @kind Method
     * 
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
     * #.textAlign
     * @comp Text
     * @kind Method
     * 
     * @sign public this .textAlign(String alignment)
     * @param alignment - The new alignment of the text.
     *
     * Change the alignment of the text. Valid values are 'start', 'end, 'left', 'center', or 'right'.
     */
    textAlign: function(alignment) {
        this._textAlign = alignment;
        if (this.has("Canvas"))
            this._resizeForCanvas();
        this.trigger("Invalidate");
        return this;
    },

    /**@
     * #.textFont
     * @comp Text
     * @kind Method
     * 
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
                    if(propertyKey === 'family'){
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
     * @kind Method
     * 
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
