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
    
    layerCount: 0,
    _changedObjs: null,

    _dirtyRects: null,
    _dirtyCells: null,
    _viewKeys: null,
    __tempRect: null,
    __tempSearchRect: null,
    __tempScreenRect: null,


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

    events: {
        // Respond to init & remove events
        "LayerInit": "layerInit",
        "LayerRemove": "layerRemove",
        // Bind scene rendering (see drawing.js)
        "RenderScene": "_render",
        // Listen for pixelart changes
        "PixelartSet": "_setPixelart",
        // Handle viewport modifications
        "ViewportResize": "_resize"
    },

    // When the system is first created, create the necessary canvas element and initial state
    // Bind to the necessary events
    layerInit: function () {
        //check if canvas is supported
        if (!Crafty.support.canvas) {
            Crafty.trigger("NoCanvas");
            Crafty.stop();
            return;
        }

        // set referenced objects to initial values -- necessary to avoid shared state between systems
        this._changedObjs = [];
        this._dirtyRects = [];
        this._dirtyCells = {};
        this._viewKeys = { x1: 0, y1: 0, x2: 0, y2: 0 };
        this.__tempRect = { _x: 0, _y: 0, _w: 0, _h: 0 };
        this.__tempSearchRect = { _x: 0, _y: 0, _w: 0, _h: 0 };
        this.__tempScreenRect = { _x: 0, _y: 0, _w: 0, _h: 0 };

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
    },

    // When the system is destroyed, remove related resources
    layerRemove: function() {
        this._canvas.parentNode.removeChild(this._canvas);
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

        // TODO: check if these conditions really make that much sense!
        // if the amount of changed objects is over 60% of the total objects, do the naive method redrawing
        if (l / this.layerCount > 0.6 || dirtyViewport) {
            this._drawAll();
        // otherwise draw dirty cell grid regions
        } else {
            this._drawDirtyCells();
        }

        //Clean up lists etc
        this._clean();
    },

    /**@
     * #._drawDirtyCells
     * @comp CanvasLayer
     * @kind Method
     * @private
     *
     * @sign public ._drawDirtyCells([Object rect])
     * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
     *
     * - If rect is omitted, redraw within the viewport
     * - If rect is provided, redraw within the rect.
     *
     * - Triggered by the "RenderScene" event
     * - This method is invoked if the number of rects is under 60% of the total number of objects
     *  and the total number of objects is greater than 16.
     * - Clear the dirty spatial grid cells, and redraw entities overlapping the dirty spatial grid cells.
     *
     * @see Canvas#.draw
     */
    _drawDirtyCells: function (view) {
        var viewportRect = this._viewportRect(), // this updates the viewportRect for later cached use
            rect = this.__tempRect,
            dirtyRects = this._dirtyRects,
            integerBounds = Crafty.rectManager.integerBounds,
            ctx = this.context;
        var i, l;

        // Canvas works better with integral coordinates where possible
        view = integerBounds(view || viewportRect);

        // Calculate dirty spatial map cells from all changed objects
        // Don't include cells outside rect to be drawn (e.g. viewport)
        this._createDirtyCells(view);
        // Afterwards, calculate dirty rectangles from dirty spatial map cells
        this._createDirtyRects();

        // For each dirty rectangle, find entities near it, and draw the overlapping ones
        for (i = 0, l = dirtyRects.length; i < l; i += 4) { //loop over every dirty rect
            rect._x = dirtyRects[i + 0];
            rect._y = dirtyRects[i + 1];
            rect._w = dirtyRects[i + 2];
            rect._h = dirtyRects[i + 3];

            // Draw the rectangle
            this._drawRect(rect);
        }

        // Draw dirty rectangles for debugging, if that flag is set
        if (this.debugDirty === true) {
            var frame = Crafty.frame(),
                r = (6 * frame + 0) % 255,
                g = (6 * frame + 85) % 255,
                b = (6 * frame + 170) % 255;
            ctx.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
            for (i = 0, l = dirtyRects.length; i < l; i += 4) {
                ctx.strokeRect(dirtyRects[i + 0], dirtyRects[i + 1], dirtyRects[i + 2], dirtyRects[i + 3]);
            }
        }
    },

    /**@
     * #._drawAll
     * @comp CanvasLayer
     * @kind Method
     * @private
     * 
     * @sign public ._drawAll([Object rect])
     * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
     *
     * - If rect is omitted, redraw within the viewport
     * - If rect is provided, redraw within the rect.
     *
     * - Triggered by the "RenderScene" event
     * - This method is invoked if the number of rects is over 60% of the total number of objects.
     * - Clear the whole viewport, and redraw entities overlapping it by default.
     *
     * @see Canvas#.draw
     */
    _drawAll: function (view) {
        var viewportRect = this._viewportRect(); // this updates the viewportRect for later cached use

        // Draw the whole layer rectangle
        this._drawRect(view || viewportRect);
    },

    _drawRect: function(rect) {
        var i, l, q, obj, previousGlobalZ,
            integerBounds = Crafty.rectManager.integerBounds,
            ctx = this.context,
            searchRect = this.__tempSearchRect,
            screenRect = this.__tempScreenRect;

        // Compute the final screen coordinates for the rectangle
        screenRect = this._viewTransformRect(rect, screenRect, true); // use cached viewportRect
        // Find the smallest rectangle with integer coordinates that encloses screenRect
        screenRect = integerBounds(screenRect);

        // Find the smallest rectangle with integer coordinates that encloses rect
        rect = integerBounds(rect);

        // Search for ents under dirty rect.
        //
        // Don't need to search for full entity dimensions!
        // If coordinates are integers, the search area with default _w and _h is (1 px - Number.Epsilon px) too big.
        // Thus trim the search area accordingly.
        // Otherwise unecessary neighboring grid cells would be searched for entities,
        // these additional entities would later be removed because of failing condition rectManager.overlap
        // This is a performance optimization for dirty cell drawing, to only search one grid cell for each rect,
        // else three additional cells would be searched unnecessarily.
        searchRect._x = rect._x;
        searchRect._y = rect._y;
        searchRect._w = rect._w - 1;
        searchRect._h = rect._h - 1;
        q = Crafty.map.search(searchRect);
        // Sort objects by z level, duplicate objs will be ordered next to each other due to same _globalZ
        q.sort(this._sort);


        // save context before drawing, saves e.g. infinite clip region
        ctx.save();

        // Clip and clear works best with default identity transform,
        // but do the actual clipping after restoring viewport transform,
        // as the clipping region would be disgarded otherwise
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Clip drawing region to dirty rectangle
        ctx.beginPath();
        ctx.rect(screenRect._x, screenRect._y, screenRect._w, screenRect._h);
        // Clear the rect from the main canvas
        ctx.clearRect(screenRect._x, screenRect._y, screenRect._w, screenRect._h);
        ctx.restore();
        ctx.clip();

        // Then draw each visible canvas object from this layer in that order, avoiding duplicates
        // No need to check for overlap with drawing area, as it's a single grid cell or the entire viewport
        // -> in both cases all entities returned from collision search overlap that drawing area
        previousGlobalZ = -Infinity;
        for (i = 0, l = q.length; i < l; ++i) {
            obj = q[i];

            if (obj._globalZ > previousGlobalZ && obj._visible && obj._drawLayer === this) {
                obj.draw(ctx);
                obj._changed = false;

                previousGlobalZ = obj._globalZ;
            }
        }

        // restore context after drawing, restores e.g. clip regions
        ctx.restore();
    },

    debug: function() {
        Crafty.log(this._changedObjs);
    },

    /** cleans up current dirty state, stores stale state for future passes */
    _clean: function () {
        var dirtyKeys, staleKeys, obj, i, l;

        var changed = this._changedObjs;
        for (i = 0, l = changed.length; i < l; i++) {
            obj = changed[i];

            // we need to keep track of all stale states, because drawing method can change dynamically
            // track stale grid cell keys for dirty grid cell drawing
            dirtyKeys = obj._entry.keys; // cached computation of Crafty.HashMap.key(obj)
            staleKeys = obj.staleKeys;
            if (staleKeys === undefined) obj.staleKeys = staleKeys = { x1: 0, y1: 0, x2: 0, y2: 0 };
            staleKeys.x1 = dirtyKeys.x1;
            staleKeys.y1 = dirtyKeys.y1;
            staleKeys.x2 = dirtyKeys.x2;
            staleKeys.y2 = dirtyKeys.y2;

            obj._changed = false;
        }
        changed.length = 0;

        this._dirtyCells = {};
        this._dirtyRects.length = 0;

        this._dirtyViewport = false;
    },

    // Takes the current and previous position of changed objects and
    // adds the dirty spatial map cells they are contained in to a set.
    //
    // If a dirty cell doesn't overlap with the area to be drawn (e.g. viewport),
    // don't include it
    //
    _createDirtyCells: function (view) {
        var changed = this._changedObjs,
            dirtyCells = this._dirtyCells;
        var viewKeys = Crafty.HashMap.key(view, this._viewKeys);

        var i, l, j, k, obj, keys;
        for (i = 0, l = changed.length; i < l; i++) {
            obj = changed[i];

            // if object was previously drawn it's old position needs to be redrawn (cleared)
            if ((keys = obj.staleKeys)) { // cached computation of stale keys
                for (j = keys.x1; j <= keys.x2; j++) {
                    for (k = keys.y1; k <= keys.y2; k++) {
                        // if stale cell is inside area to be drawn
                        if (viewKeys.x1 <= j && j <= viewKeys.x2 &&
                            viewKeys.y1 <= k && k <= viewKeys.y2) {

                            // combine two 16 bit unsigned numbers into a unique 32 bit unsigned number
                            dirtyCells[(j << 16) ^ k] = true;
                        }
                    }
                }
            }

            keys = obj._entry.keys; // cached computation of Crafty.HashMap.key(obj)
            for (j = keys.x1; j <= keys.x2; j++) {
                for (k = keys.y1; k <= keys.y2; k++) {
                    // if dirty cell is inside area to be drawn
                    if (viewKeys.x1 <= j && j <= viewKeys.x2 &&
                        viewKeys.y1 <= k && k <= viewKeys.y2) {

                        // combine two 16 bit unsigned numbers into a unique 32 bit unsigned number
                        dirtyCells[(j << 16) ^ k] = true;
                    }
                }
            }
        }
    },

    // Takes all dirty spatial map cells and
    // pushes the corresponding dirty rectangles onto the stack.
    //
    _createDirtyRects: function() {
        var cellsize = Crafty.HashMap.cellsize(),
            dirtyCells = this._dirtyCells,
            dirtyRects = this._dirtyRects;

        var hash, j, k;
        for (var strHash in dirtyCells) {
            hash = +strHash;
            // deconstruct a 32 bit unsigned number into a unique pair of 16 bit unsigned numbers
            k = (hash << 16) >> 16;
            j = (k < 0) ? ~(hash >> 16) : hash >> 16;
            dirtyRects.push(j * cellsize, k * cellsize, cellsize, cellsize);
        }
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
