var Crafty = require('../core/core.js');


/**@
 * #Crafty.canvasLayer
 * @category Graphics
 *
 * Collection of mostly private methods to draw entities on a canvas element.
 */
Crafty.extend({
    canvasLayer: {
        _dirtyRects: [],
        _changedObjs: [],
        layerCount: 0,
        _dirtyViewport: false,

        // Sort function for rendering in the correct order
        _sort: function(a, b) {
            return a._globalZ - b._globalZ;
        },

        /**@
         * #Crafty.canvasLayer.add
         * @comp Crafty.canvasLayer
         * @sign public Crafty.canvasLayer.add(ent)
         * @param ent - The entity to add
         *
         * Add an entity to the list of Canvas objects to draw
         */
        add: function add(ent) {
            this._changedObjs.push(ent);
        },
        /**@
         * #Crafty.canvasLayer.context
         * @comp Crafty.canvasLayer
         *
         * This will return the 2D context of the main canvas element.
         * The value returned from `Crafty.canvasLayer._canvas.getContext('2d')`.
         */
        context: null,
        /**@
         * #Crafty.canvasLayer._canvas
         * @comp Crafty.canvasLayer
         *
         * Main Canvas element
         */
         _canvas: null,

        /**@
         * #Crafty.canvasLayer.init
         * @comp Crafty.canvasLayer
         * @sign public void Crafty.canvasLayer.init(void)
         * @trigger NoCanvas - triggered if `Crafty.support.canvas` is false
         *
         * Creates a `canvas` element inside `Crafty.stage.elem`. Must be called
         * before any entities with the Canvas component can be drawn.
         *
         * This method will automatically be called if no `Crafty.canvasLayer.context` is
         * found.
         */
        init: function () {
            //check if canvas is supported
            if (!Crafty.support.canvas) {
                Crafty.trigger("NoCanvas");
                Crafty.stop();
                return;
            }

            // set properties to initial values -- necessary on a restart
            this._dirtyRects = [];
            this._changedObjs = [];
            this.layerCount = 0;

            //create an empty canvas element
            var c;
            c = document.createElement("canvas");
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;
            c.style.position = 'absolute';
            c.style.left = "0px";
            c.style.top = "0px";

            var canvas = Crafty.canvasLayer;

            Crafty.stage.elem.appendChild(c);
            this.context = c.getContext('2d');
            this._canvas = c;

            //Set any existing transformations
            var zoom = Crafty.viewport._scale;
            if (zoom != 1)
                c.scale(zoom, zoom);

            // Set pixelart to current status, and listen for changes
            this._setPixelart(Crafty._pixelartEnabled);
            Crafty.uniqueBind("PixelartSet", this._setPixelart);

            //Bind rendering of canvas context (see drawing.js)
            Crafty.uniqueBind("RenderScene", this._render);
            
            Crafty.uniqueBind("ViewportResize", this._resize);

            Crafty.bind("InvalidateViewport", function () {
                Crafty.canvasLayer._dirtyViewport = true;
            });
        },


        _render: function() {
            var layer = Crafty.canvasLayer,
                dirtyViewport = layer._dirtyViewport,
                l = layer._changedObjs.length,
                ctx = layer.context;
            if (!l && !dirtyViewport) {
                return;
            }

            if (dirtyViewport) {
                var view = Crafty.viewport;
                ctx.setTransform(view._scale, 0, 0, view._scale, Math.round(view._x*view._scale), Math.round(view._y*view._scale) );
            }

            //if the amount of changed objects is over 60% of the total objects
            //do the naive method redrawing
            // TODO: I'm not sure this condition really makes that much sense!
            if (l / layer.layerCount > 0.6 || dirtyViewport) {
                layer._drawAll();
            } else {
                layer._drawDirty();
            }
            //Clean up lists etc
            layer._clean();
        },

        /**@
         * #Crafty.canvasLayer.drawDirty
         * @comp Crafty.canvasLayer
         * @sign public Crafty.canvasLayer.drawDirty()
         *
         * - Triggered by the "RenderScene" event
         * - If the number of rects is over 60% of the total number of objects
         *  do the naive method redrawing `Crafty.canvasLayer.drawAll` instead
         * - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
         *
         * @see Canvas#.draw
         */
        _drawDirty: function () {

            var i, j, q, rect,len, obj, ent,
                changed = this._changedObjs,
                l = changed.length,
                dirty = this._dirtyRects,
                rectManager = Crafty.rectManager,
                overlap = rectManager.overlap,
                ctx = this.context,
                dupes = [],
                objs = [];

            // Calculate _dirtyRects from all changed objects, then merge some overlapping regions together
            for (i = 0; i < l; i++) {
                this._createDirty(changed[i]);
            }
            rectManager.mergeSet(dirty);


            l = dirty.length;

            // For each dirty rectangle, find entities near it, and draw the overlapping ones
            for (i = 0; i < l; ++i) { //loop over every dirty rect
                rect = dirty[i];
                dupes.length = 0;
                objs.length = 0;
                if (!rect) continue;

                // Find the smallest rectangle with integer coordinates that encloses rect
                rect._w = rect._x + rect._w;
                rect._h = rect._y + rect._h;
                rect._x = (rect._x > 0) ? (rect._x|0) : (rect._x|0) - 1;
                rect._y = (rect._y > 0) ? (rect._y|0) : (rect._y|0) - 1;
                rect._w -= rect._x;
                rect._h -= rect._y;
                rect._w = (rect._w === (rect._w|0)) ? rect._w : (rect._w|0) + 1;
                rect._h = (rect._h === (rect._h|0)) ? rect._h : (rect._h|0) + 1;

                //search for ents under dirty rect
                q = Crafty.map.search(rect, false);

                //clear the rect from the main canvas
                ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

                //Then clip drawing region to dirty rectangle
                ctx.save();
                ctx.beginPath();
                ctx.rect(rect._x, rect._y, rect._w, rect._h);
                ctx.clip();

                // Loop over found objects removing dupes and adding visible canvas objects to array
                for (j = 0, len = q.length; j < len; ++j) {
                    obj = q[j];

                    if (dupes[obj[0]] || !obj._visible || !obj.__c.Canvas)
                        continue;
                    dupes[obj[0]] = true;
                    objs.push(obj);
                }

                // Sort objects by z level
                objs.sort(this._sort);

                // Then draw each object in that order
                for (j = 0, len = objs.length; j < len; ++j) {
                    obj = objs[j];
                    var area = obj._mbr || obj;
                    if (overlap(area, rect))
                        obj.draw();
                    obj._changed = false;
                }

                // Close rectangle clipping
                ctx.closePath();
                ctx.restore();

            }

            // Draw dirty rectangles for debugging, if that flag is set
            if (Crafty.canvasLayer.debugDirty === true) {
                ctx.strokeStyle = 'red';
                for (i = 0, l = dirty.length; i < l; ++i) {
                    rect = dirty[i];
                    ctx.strokeRect(rect._x, rect._y, rect._w, rect._h);
                }
            }

        },

        /**@
         * #Crafty.canvasLayer.drawAll
         * @comp Crafty.canvasLayer
         * @sign public Crafty.canvasLayer.drawAll([Object rect])
         * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * - If rect is omitted, redraw within the viewport
         * - If rect is provided, redraw within the rect
         */
        _drawAll: function (rect) {
            rect = rect || Crafty.viewport.rect();
            var q = Crafty.map.search(rect),
                i = 0,
                l = q.length,
                ctx = this.context,
                current;

            ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

            //sort the objects by the global Z
            q.sort(this._sort);
            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.Canvas) {
                    current.draw();
                    current._changed = false;
                }
            }
        },

        debug: function() {
            Crafty.log(this._changedObjs);
        },

        /** cleans up current dirty state, stores stale state for future passes */
        _clean: function () {
            var rect, obj, i, l,
                changed = this._changedObjs;
             for (i = 0, l = changed.length; i < l; i++) {
                 obj = changed[i];
                 rect = obj._mbr || obj;
                 if (typeof obj.staleRect === 'undefined')
                     obj.staleRect = {};
                 obj.staleRect._x = rect._x;
                 obj.staleRect._y = rect._y;
                 obj.staleRect._w = rect._w;
                 obj.staleRect._h = rect._h;

                 obj._changed = false;
             }
             changed.length = 0;
             this._dirtyRects.length = 0;
             this._dirtyViewport = false;

        },

         /** Takes the current and previous position of an object, and pushes the dirty regions onto the stack
          *  If the entity has only moved/changed a little bit, the regions are squashed together */
        _createDirty: function (obj) {

            var rect = obj._mbr || obj,
                dirty = this._dirtyRects,
                rectManager = Crafty.rectManager;

            if (obj.staleRect) {
                //If overlap, merge stale and current position together, then return
                //Otherwise just push stale rectangle
                if (rectManager.overlap(obj.staleRect, rect)) {
                    rectManager.merge(obj.staleRect, rect, obj.staleRect);
                    dirty.push(obj.staleRect);
                    return;
                } else {
                  dirty.push(obj.staleRect);
                }
            }

            // We use the intermediate "currentRect" so it can be modified without messing with obj
            obj.currentRect._x = rect._x;
            obj.currentRect._y = rect._y;
            obj.currentRect._w = rect._w;
            obj.currentRect._h = rect._h;
            dirty.push(obj.currentRect);

        },


        // Resize the canvas element to the current viewport
        _resize: function() {
            var c = Crafty.canvasLayer._canvas;
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;

        },

        _setPixelart: function(enabled) {
            var context = Crafty.canvasLayer.context;
            context.imageSmoothingEnabled = !enabled;
            context.mozImageSmoothingEnabled = !enabled;
            context.webkitImageSmoothingEnabled = !enabled;
            context.oImageSmoothingEnabled = !enabled;
            context.msImageSmoothingEnabled = !enabled;
        }

    }
});