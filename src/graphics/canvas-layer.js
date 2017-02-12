var Crafty = require('../core/core.js');


/**@
 * #CanvasLayer
 * @category Graphics
 * @kind System
 *
 * An object for creating the canvas layer system.
 *
 * Mostly contains private methods to draw entities on a canvas element.
 */
Crafty._registerLayerTemplate("Canvas", {
    type: "Canvas",
    
    options: {
        xResponse: 1,
        yResponse: 1,
        scaleResponse: 1,
        z: 0
    },
    
    _dirtyRects: [],
    _changedObjs: [],
    layerCount: 0,
    _dirtyViewport: false,

    // Sort function for rendering in the correct order
    _sort: function(a, b) {
        return a._globalZ - b._globalZ;
    },

    /**@
     * #.dirty
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public .dirty(ent)
     * @param ent - The entity to add
     *
     * Add an entity to the list of Canvas objects that need redrawing
     */
    dirty: function dirty(ent) {
        this._changedObjs.push(ent);
    },
    
    /**@
     * #.attach
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public .attach(ent)
     * @param ent - The entity to add
     *
     * Sets the entity's draw context to this layer
     */
    attach: function attach(ent) {
        ent._drawContext = this.context;
        //increment the number of canvas objs
        this.layerCount++;
    },
    
    /**@
     * #.detach
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public .detach(ent)
     * @param ent - The entity to detach
     *
     * Removes an entity to the list of Canvas objects to draw
     */
    detach: function detach(ent) {
        this.dirty(ent);
        ent._drawContext = null;
        //decrement the number of canvas objs
        this.layerCount--;
    },
    

    /**@
     * #.context
     * @comp CanvasLayer
     * @kind Property
     *
     * This will return the 2D context associated with the canvas layer's canvas element.
     */
    context: null,

    /**@
     * #._canvas
     * @comp CanvasLayer
     * @kind Property
     * @private
     *
     * The canvas element associated with the canvas layer.
     */
     _canvas: null,

    // When the system is first created, create the necessary canvas element and initial state
    // Bind to the necessary events
    init: function () {
        //check if canvas is supported
        if (!Crafty.support.canvas) {
            Crafty.trigger("NoCanvas");
            Crafty.stop();
            return;
        }

        // set referenced objects to initial values -- necessary to avoid shared state between systems
        this._dirtyRects = [];
        this._changedObjs = [];

        //create an empty canvas element
        var c;
        c = document.createElement("canvas");
        c.width = Crafty.viewport.width;
        c.height = Crafty.viewport.height;
        c.style.position = 'absolute';
        c.style.left = "0px";
        c.style.top = "0px";
        c.style.zIndex = this.options.z;

        Crafty.stage.elem.appendChild(c);
        this.context = c.getContext('2d');
        this._canvas = c;

        //Set any existing transformations
        var zoom = Crafty.viewport._scale;
        if (zoom !== 1)
            this.context.scale(zoom, zoom);

        // Set pixelart to current status, and listen for changes
        this._setPixelart(Crafty._pixelartEnabled);
        this.uniqueBind("PixelartSet", this._setPixelart);

        //Bind rendering of canvas context (see drawing.js)
        this.uniqueBind("RenderScene", this._render);
        
        this.uniqueBind("ViewportResize", this._resize);

        this.bind("InvalidateViewport", function () {
            this._dirtyViewport = true;
        });
        
        Crafty._addDrawLayerInstance(this);
    },

    // When the system is destroyed, remove related resources
    remove: function() {

        this._canvas.parentNode.removeChild(this._canvas);
        Crafty._removeDrawLayerInstance(this);
    },

    _render: function() {
        var dirtyViewport = this._dirtyViewport,
            l = this._changedObjs.length,
            ctx = this.context;
        if (!l && !dirtyViewport) {
            return;
        }
        
        // Set the camera transforms from the combination of the current viewport parameters and this layers 
        var cameraOptions = this.options;
        if (dirtyViewport && cameraOptions) {
            var view = this._viewportRect();
            var scale = view._scale; 
            var dx = -view._x * scale;
            var dy = -view._y * scale;
            ctx.setTransform(scale, 0, 0, scale, Math.round(dx), Math.round(dy) );
        }

        //if the amount of changed objects is over 60% of the total objects
        //do the naive method redrawing
        // TODO: I'm not sure this condition really makes that much sense!
        if (l / this.layerCount > 0.6 || dirtyViewport) {
            this._drawAll();
        } else {
            this._drawDirty();
        }
        //Clean up lists etc
        this._clean();
    },

    /**@
     * #._drawDirty
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public ._drawDirty()
     *
     * - Triggered by the "RenderScene" event
     * - If the number of rects is over 60% of the total number of objects
     *  do the naive method redrawing `CanvasLayer.drawAll` instead
     * - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
     *
     * @see Canvas#.draw
     */
    _drawDirty: function (view) {
        view = view || this._viewportRect();
        var i, j, q, rect,len, obj,
            changed = this._changedObjs,
            l = changed.length,
            dirty = this._dirtyRects,
            rectManager = Crafty.rectManager,
            overlap = rectManager.overlap,
            ctx = this.context,
            dupes = [],
            objs = [];
        
        // Canvas works better with integral coordinates where possible
        view = rectManager.integerBounds(view);
        
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
            rect = rectManager.integerBounds(rect);

            // If a dirty rect doesn't overlap with the viewport, skip to the next one
            if (!overlap(rect, view)) continue;

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

                if (dupes[obj[0]] || !obj._visible || (obj._drawLayer !== this) )
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
        if (this.debugDirty === true) {
            ctx.strokeStyle = 'red';
            for (i = 0, l = dirty.length; i < l; ++i) {
                rect = dirty[i];
                ctx.strokeRect(rect._x, rect._y, rect._w, rect._h);
            }
        }

    },

    /**@
     * #._drawAll
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public CanvasLayer.drawAll([Object rect])
     * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
     *
     * - If rect is omitted, redraw within the viewport
     * - If rect is provided, redraw within the rect
     */
    _drawAll: function (rect) {
        rect = rect || this._viewportRect();
        rect = Crafty.rectManager.integerBounds(rect);
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
            if (current._visible && current._drawContext === this.context) {
                current.draw(this.context);
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
        var c = this._canvas;
        c.width = Crafty.viewport.width;
        c.height = Crafty.viewport.height;

    },

    _setPixelart: function(enabled) {
        var context = this.context;
        context.imageSmoothingEnabled = !enabled;
        context.mozImageSmoothingEnabled = !enabled;
        context.webkitImageSmoothingEnabled = !enabled;
        context.oImageSmoothingEnabled = !enabled;
        context.msImageSmoothingEnabled = !enabled;
    }

});
