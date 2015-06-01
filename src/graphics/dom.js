var Crafty = require('../core/core.js'),
    document = window.document;

/**@
 * #DOM
 * @category Graphics
 *
 * A component which renders entities as DOM nodes, specifically `<div>`s.
 */
Crafty.c("DOM", {
    /**@
     * #._element
     * @comp DOM
     * The DOM element used to represent the entity.
     */
    _element: null,
    //holds current styles, so we can check if there are changes to be written to the DOM
    _cssStyles: null,

    /**@
     * #.avoidCss3dTransforms
     * @comp DOM
     * Avoids using of CSS 3D Transform for positioning when true. Default value is false.
     */
    avoidCss3dTransforms: false,

    init: function () {
        var domLayer = Crafty.domLayer;
        if (!domLayer._div) {
            domLayer.init();
        }
        this._drawLayer = domLayer;

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
        domLayer._div.appendChild(this._element);
        this._element.style.position = "absolute";
        this._element.id = "ent" + this[0];

        this.bind("Invalidate", this._invalidateDOM);
        this.bind("NewComponent", this._updateClass);
        this.bind("RemoveComponent", this._removeClass);

        this._invalidateDOM();

    },

    remove: function(){
        this.undraw();
        this.unbind("NewComponent", this._updateClass);
        this.unbind("RemoveComponent", this._removeClass);
        this.unbind("Invalidate", this._invalidateDOM);
    },

    /**@
     * #.getDomId
     * @comp DOM
     * @sign public this .getId()
     *
     * Get the Id of the DOM element used to represent the entity.
     */
    getDomId: function () {
        return this._element.id;
    },

    // removes a component on RemoveComponent events
    _removeClass: function(removedComponent) {
        var i = 0,
            c = this.__c,
            str = "";
        for (i in c) {
          if(i != removedComponent) {
            str += ' ' + i;
          }
        }
        str = str.substr(1);
        this._element.className = str;
    },

    // adds a class on NewComponent events
    _updateClass: function() {
        var i = 0,
            c = this.__c,
            str = "";
        for (i in c) {
            str += ' ' + i;
        }
        str = str.substr(1);
        this._element.className = str;
    },

    _invalidateDOM: function(){
        if (!this._changed) {
                this._changed = true;
                this._drawLayer.add(this);
            }
    },

    /**@
     * #.DOM
     * @comp DOM
     * @trigger Draw - when the entity is ready to be drawn to the stage - { style:String, type:"DOM", co}
     * @sign public this .DOM(HTMLElement elem)
     * @param elem - HTML element that will replace the dynamically created one
     *
     * Pass a DOM element to use rather than one created. Will set `._element` to this value. Removes the old element.
     */
    DOM: function (elem) {
        if (elem && elem.nodeType) {
            this.undraw();
            this._element = elem;
            this._element.style.position = 'absolute';
        }
        return this;
    },

    /**@
     * #.draw
     * @comp DOM
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

        if (this._cssStyles.transform != trans.join(" ")) {
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

    /**@
     * #.undraw
     * @comp DOM
     * @sign public this .undraw(void)
     *
     * Removes the element from the stage.
     */
    undraw: function () {
        var el = this._element;
        if (el && el.parentNode !== null) {
            el.parentNode.removeChild(el);
        }
        return this;
    },

    /**@
     * #.css
     * @comp DOM
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
     * The notation can be CSS or JS (e.g. `text-align` or `textAlign`).
     *
     * To return a value, pass the property.
     *
     * Note: For entities with "Text" component, some css properties are controlled by separate functions
     * `.textFont()` and `.textColor()`, and ignore `.css()` settings. See Text component for details.
     *
     * @example
     * ~~~
     * this.css({'text-align': 'center', 'text-decoration': 'line-through'});
     * this.css("textAlign", "center");
     * this.css("text-align"); //returns center
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
                if (typeof val === "number") val += 'px';

                style[Crafty.domHelper.camelize(key)] = val;
            }
        } else {
            //if a value is passed, set the property
            if (value) {
                if (typeof value === "number") value += 'px';
                style[Crafty.domHelper.camelize(obj)] = value;
            } else { //otherwise return the computed property
                return Crafty.domHelper.getStyle(elem, obj);
            }
        }

        this.trigger("Invalidate");

        return this;
    }
});
