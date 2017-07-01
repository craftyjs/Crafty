var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.findPointerEventTargetByComponent
     * @category Input
     * @kind Method
     *
     * @sign public Object .findPointerEventTargetByComponent(String comp, Number clientX, Number clientY)
     * Finds closest entity with certain component at a given position.
     * @param comp - Component name
     * @param clientX - x coordinate in client space, usually taken from a pointer event
     * @param clientY - y coordinate in client space, usually taken from a pointer event
     * @returns The found entity, or null if no entity was found.
     *
     * @sign public Object .findPointerEventTargetByComponent(String comp, Event e)
     * Finds closest entity with certain component at a given event.
     * @param comp - Component name
     * @param e - The pointer event, containing the target and the required properties `clientX` & `clientY`, which will be used as the query point
     * @returns The found entity, or null if no entity was found.
     *
     * This method is used internally by the .mouseDispatch and .touchDispatch methods, but can be used otherwise for
     * Canvas entities.
     *
     * Finds the top most entity (with the highest z) with a given component at a given point (x, y).
     * For having a detection area specified for the enity, add the AreaMap component to the entity expected to be found.
     *
     */
    findPointerEventTargetByComponent: function (comp, x, y) {
        var tar = x.target || x.srcElement || Crafty.stage.elem;
        y = typeof y !== 'undefined' ? y : x.clientY;
        x = typeof x.clientX !== 'undefined' ? x.clientX : x;

        var closest = null, current, q, l, i, pos, maxz = -Infinity;

        //if it's a DOM element with component we are done
        if (tar.nodeName !== "CANVAS") {
            while (typeof (tar.id) !== 'string' && tar.id.indexOf('ent') === -1) {
                tar = tar.parentNode;
            }
            var ent = Crafty(parseInt(tar.id.replace('ent', ''), 10));
            pos = Crafty.domHelper.translate(x, y, ent._drawLayer);
            if (ent.__c[comp] && ent.isAt(pos.x, pos.y)) {
                closest = ent;
            }
        }

        //else we search for an entity with component
        if (!closest) {

            // Loop through each layer
            for (var layerIndex in Crafty._drawLayers) {
                var layer = Crafty._drawLayers[layerIndex];

                // Skip a layer if it has no entities listening for pointer events
                if (layer._pointerEntities <= 0) continue;

                // Get the position in this layer
                pos = Crafty.domHelper.translate(x, y, layer);
                q = Crafty.map.unfilteredSearch({
                    _x: pos.x,
                    _y: pos.y,
                    _w: 1,
                    _h: 1
                });

                for (i = 0, l = q.length; i < l; ++i) {
                    current = q[i];
                    if (current._visible && current._drawLayer === layer && current._globalZ > maxz &&
                        current.__c[comp] && current.isAt(pos.x, pos.y)) {
                        maxz = current._globalZ;
                        closest = current;
                    }
                }
            }
        }

        return closest;
    },

    /**@
     * #Crafty.translatePointerEventCoordinates
     * @category Input
     * @kind Method
     *
     * @sign public Object .translatePointerEventCoordinates(PointerEvent e[, PointerEvent out])
     * @param e - Any pointer event with `clientX` and `clientY` properties, usually a `MouseEvent` or `Touch` object
     * @param out - Optional pointer event to augment with coordinates instead
     * @returns The pointer event, augmented with additional `realX` and `realY` properties
     *
     * Updates the passed event object to have two additional properties, `realX` and `realY`,
     * which correspond to the point in actual world space the event happened.
     *
     * This method is used internally by the .mouseDispatch and .touchDispatch methods,
     * but may be used for custom events.
     *
     * @see Crafty.domHelper#Crafty.domHelper.translate
     */
    translatePointerEventCoordinates: function (e, out) {
        out = out || e;

        // Find the Crafty position in the default coordinate set,
        // disregard the fact that the pointer event was related to a specific layer.
        var pos = Crafty.domHelper.translate(e.clientX, e.clientY, undefined, this.__pointerPos);

        // Set the mouse position based on standard viewport coordinates
        out.realX = pos.x;
        out.realY = pos.y;
    },
    __pointerPos: {x: 0, y: 0} // object to reuse
});

/**@
 * #AreaMap
 * @category Input
 * @kind Component
 *
 * Component used by Mouse and Touch.
 * Can be added to other entities for use with the Crafty.findPointerEventTargetByComponent method.
 *
 * @see Button
 * @see Crafty.polygon
 * @see Crafty.findPointerEventTargetByComponent
 */
Crafty.c("AreaMap", {
    init: function () {
        if (this.has("Renderable") && this._drawLayer) {
            this._drawLayer._pointerEntities++;
        }
    },

    remove: function (isDestruction) {
        if (!isDestruction && this.has("Renderable") && this._drawLayer) {
            this._drawLayer._pointerEntities--;
        }
    },

    events: {
        "LayerAttached": function (layer) {
            layer._pointerEntities++;
        },
        "LayerDetached": function (layer) {
            layer._pointerEntities--;
        }
    },

    /**@
     * #.areaMap
     * @comp AreaMap
     * @kind Method
     *
     * @trigger NewAreaMap - when a new areaMap is assigned - Crafty.polygon
     *
     * @sign public this .areaMap(Crafty.polygon polygon)
     * @param polygon - Instance of Crafty.polygon used to check if the mouse coordinates are inside this region
     *
     * @sign public this .areaMap(Array coordinatePairs)
     * @param coordinatePairs - Array of `x`, `y` coordinate pairs to generate a polygon
     *
     * @sign public this .areaMap(x1, y1,.., xN, yN)
     * @param point# - List of `x`, `y` coordinate pairs to generate a polygon
     *
     * Assign a polygon to the entity so that pointer (mouse or touch) events will only be triggered if
     * the coordinates are inside the given polygon.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Mouse")
     *     .color("red")
     *     .attr({ w: 100, h: 100 })
     *     .bind('MouseOver', function() {Crafty.log("over")})
     *     .areaMap(0, 0, 50, 0, 50, 50, 0, 50);
     *
     * Crafty.e("2D, Mouse")
     *     .areaMap([0, 0, 50, 0, 50, 50, 0, 50]);
     *
     * Crafty.e("2D, Mouse").areaMap(
     *     new Crafty.polygon([0, 0, 50, 0, 50, 50, 0, 50])
     * );
     * ~~~
     *
     * @see Crafty.polygon
     */
    areaMap: function (poly) {
        //create polygon
        if (arguments.length > 1) {
            //convert args to array to create polygon
            var args = Array.prototype.slice.call(arguments, 0);
            poly = new Crafty.polygon(args);
        } else if (poly.constructor === Array) {
            poly = new Crafty.polygon(poly.slice());
        } else {
            poly = poly.clone();
        }

        poly.shift(this._x, this._y);
        this.mapArea = poly;
        this.attach(this.mapArea);
        this.trigger("NewAreaMap", poly);
        return this;
    }
});

/**@
 * #Button
 * @category Input
 * @kind Component
 *
 * Provides the entity with touch or mouse functionality, depending on whether this is a pc
 * or mobile device, and also on multitouch configuration.
 *
 * @see Mouse
 * @see Touch
 * @see Crafty.multitouch
 */
Crafty.c("Button", {
    init: function () {
        var req = (!Crafty.mobile || (Crafty.mobile && !Crafty.multitouch())) ? "Mouse" : "Touch";
        this.requires(req);
    }
});
