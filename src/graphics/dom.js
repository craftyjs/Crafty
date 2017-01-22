var Crafty = require('../core/core.js'),
    document = window.document;

/**@
 * #DOM
 * @category Graphics
 * @kind Component
 *
 * A component which renders entities as DOM nodes, specifically `<div>`s.
 */
Crafty.c("DOM", {
    /**@
     * #._element
     * @comp DOM
     * @kind Property
     * The DOM element used to represent the entity.
     */
    _element: null,
    //holds current styles, so we can check if there are changes to be written to the DOM
    _cssStyles: null,

    /**@
     * #.avoidCss3dTransforms
     * @comp DOM
     * @kind Property
     * 
     * Avoids using of CSS 3D Transform for positioning when true. Default value is false.
     */
    avoidCss3dTransforms: false,

    init: function () {
        this.requires("Renderable");
        
        this._cssStyles = {
            visibility: '',
            left: '',
            top: '',
            width: '',
            height: '',
            zIndex: '',
            opacity: '',
            transformOrigin: '',
            transform: ''
        };
        this._element = document.createElement("div");

        // Attach the entity to the dom layer
        if (!this._customLayer){
            this._attachToLayer( Crafty.s("DefaultDOMLayer") );
        }

        this.bind("NewComponent", this._updateClass);
        this.bind("RemoveComponent", this._removeClass);
    },

    remove: function(){
        this._detachFromLayer();
        this.unbind("NewComponent", this._updateClass);
        this.unbind("RemoveComponent", this._removeClass);
    },

    /**@
     * #.getDomId
     * @comp DOM
     * @kind Method
     * 
     * @sign public this .getDomId()
     *
     * Get the Id of the DOM element used to represent the entity.
     */
    getDomId: function () {
        return this._element.id;
    },

    // removes a component on RemoveComponent events
    _removeClass: function(removedComponent) {
        var comp,
            c = this.__c,
            str = "";
        for (comp in c) {
            if (comp !== removedComponent) {
                str += ' ' + comp;
            }
        }
        str = str.substr(1);
        this._element.className = str;
    },

    // adds a class on NewComponent events
    _updateClass: function() {
        var comp,
            c = this.__c,
            str = "";
        for (comp in c) {
            str += ' ' + comp;
        }
        str = str.substr(1);
        this._element.className = str;
    },

    /**@
     * #.DOM
     * @comp DOM
     * @kind Method
     * 
     * @trigger Draw - when the entity is ready to be drawn to the stage - { style:String, type:"DOM", co}
     * @sign public this .DOM(HTMLElement elem)
     * @param elem - HTML element that will replace the dynamically created one
     *
     * Pass a DOM element to use rather than one created. Will set `._element` to this value. Removes the old element.
     * 
     * Will reattach the entity to the current draw layer
     */
    DOM: function (elem) {
        if (elem && elem.nodeType) {
            var layer = this._drawLayer;
            this._detachFromLayer();
            this._element = elem;
            this._attachToLayer(layer);
        }
        return this;
    },

    /**@
     * #.draw
     * @comp DOM
     * @kind Method
     * @private
     * 
     * @sign public this .draw(void)
     *
     * Updates the CSS properties of the node to draw on the stage.
     */
    draw: function () {
        var style = this._element.style,
            coord = this.__coord || [0, 0, 0, 0],
            co = {
                x: coord[0],
                y: coord[1],
                w: coord[2],
                h: coord[3]
            },
            prefix = Crafty.support.prefix,
            trans = [];

        if (this._cssStyles.visibility !== this._visible) {
            this._cssStyles.visibility = this._visible;
            if (!this._visible) {
                style.visibility = "hidden";
            } else {
                style.visibility = "visible";
            }
        }

        //utilize CSS3 if supported
        if (Crafty.support.css3dtransform && !this.avoidCss3dTransforms) {
            trans.push("translate3d(" + (~~this._x) + "px," + (~~this._y) + "px,0)");
        } else {
            if (this._cssStyles.left !== this._x) {
                this._cssStyles.left = this._x;
                style.left = ~~ (this._x) + "px";
            }
            if (this._cssStyles.top !== this._y) {
                this._cssStyles.top = this._y;
                style.top = ~~ (this._y) + "px";
            }
        }

        if (this._cssStyles.width !== this._w) {
            this._cssStyles.width = this._w;
            style.width = ~~ (this._w) + "px";
        }
        if (this._cssStyles.height !== this._h) {
            this._cssStyles.height = this._h;
            style.height = ~~ (this._h) + "px";
        }
        if (this._cssStyles.zIndex !== this._z) {
            this._cssStyles.zIndex = this._z;
            style.zIndex = this._z;
        }

        if (this._cssStyles.opacity !== this._alpha) {
            this._cssStyles.opacity = this._alpha;
            style.opacity = this._alpha;
            style[prefix + "Opacity"] = this._alpha;
        }

        if (this._mbr) {
            var origin = this._origin.x + "px " + this._origin.y + "px";
            style.transformOrigin = origin;
            style[prefix + "TransformOrigin"] = origin;
            if (Crafty.support.css3dtransform) trans.push("rotateZ(" + this._rotation + "deg)");
            else trans.push("rotate(" + this._rotation + "deg)");
        }

        if (this._flipX) {
            trans.push("scaleX(-1)");
        }

        if (this._flipY) {
            trans.push("scaleY(-1)");
        }

        if (this._cssStyles.transform !== trans.join(" ")) {
            this._cssStyles.transform = trans.join(" ");
            style.transform = this._cssStyles.transform;
            style[prefix + "Transform"] = this._cssStyles.transform;
        }

        this.trigger("Draw", {
            style: style,
            type: "DOM",
            co: co
        });

        return this;
    },

    _setCssProperty: function(style, key, val) {
        key = Crafty.domHelper.camelize(key);
        if (typeof val === "number") val += 'px';
        style[key] = val;
        this.trigger("SetStyle", key);
    },

    /**@
     * #.css
     * @comp DOM
     * @kind Method
     * @trigger SetStyle - for each style that is set - string - propertyName
     * 
     * @sign public css(String property, String value)
     * @param property - CSS property to modify
     * @param value - Value to give the CSS property
     *
     * @sign public  css(Object map)
     * @param map - Object where the key is the CSS property and the value is CSS value
     *
     * Apply CSS styles to the element.
     *
     * Can pass an object where the key is the style property and the value is style value.
     *
     * For setting one style, simply pass the style as the first argument and the value as the second.
     *
     * The notation can be CSS or JS (e.g. `border-radius` or `borderRadius`).
     *
     * To return a value, pass the property.
     *
     * Note: For entities with "Text" component, some css properties are controlled by separate functions
     * `.textFont()`, `.textAlign()` and `.textColor()`.  When possible, prefer text-specific methods, since
     * they will work for non-DOM text.
     * See the Text component for details.
     *
     * @example
     * ~~~
     * this.css({'border': '1px solid black', 'text-decoration': 'line-through'});
     * this.css("textDecoration", "line-through");
     * this.css("text-Decoration"); //returns line-through
     * ~~~
     */
    css: function (obj, value) {
        var key,
            elem = this._element,
            val,
            style = elem.style;

        //if an object passed
        if (typeof obj === "object") {
            for (key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                val = obj[key];
                this._setCssProperty(style, key, val);
            }
        } else {
            //if a value is passed, set the property
            if (value) {
                this._setCssProperty(style, obj, value);
            } else { //otherwise return the computed property
                return Crafty.domHelper.getStyle(elem, obj);
            }
        }

        this.trigger("Invalidate");
        

        return this;
    }
});
