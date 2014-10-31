var Crafty = require('./core.js'),
    document = window.document;


/**@
 * #Image
 * @category Graphics
 * Draw an image with or without repeating (tiling).
 */
Crafty.c("Image", {
    _repeat: "repeat",
    ready: false,

    init: function () {
        var draw = function (e) {
            if (e.type === "canvas") {
                //skip if no image
                if (!this.ready || !this._pattern) return;

                var context = e.ctx;

                context.fillStyle = this._pattern;

                context.save();
                context.translate(e.pos._x, e.pos._y);
                context.fillRect(0, 0, this._w, this._h);
                context.restore();
            } else if (e.type === "DOM") {
                if (this.__image) {
                  e.style.backgroundImage = "url(" + this.__image + ")";
                  e.style.backgroundRepeat = this._repeat;
                }
            }
        };

        this.bind("Draw", draw).bind("RemoveComponent", function (id) {
            if (id === "Image") this.unbind("Draw", draw);
        });
    },

    /**@
     * #.image
     * @comp Image
     * @trigger Invalidate - when the image is loaded
     * @sign public this .image(String url[, String repeat])
     * @param url - URL of the image
     * @param repeat - If the image should be repeated to fill the entity.
     *
     * Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
     *
     * *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
     *
     * If the width and height are `0` and repeat is set to `no-repeat` the width and
     * height will automatically assume that of the image. This is an
     * easy way to create an image without needing sprites.
     *
     * @example
     * Will default to no-repeat. Entity width and height will be set to the images width and height
     * ~~~
     * var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
     * ~~~
     * Create a repeating background.
     * ~~~
     * var bg = Crafty.e("2D, DOM, Image")
     *              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
     *              .image("bg.png", "repeat");
     * ~~~
     *
     * @see Crafty.sprite
     */
    image: function (url, repeat) {
        this.__image = url;
        this._repeat = repeat || "no-repeat";

        this.img = Crafty.asset(url);
        if (!this.img) {
            this.img = new Image();
            Crafty.asset(url, this.img);
            this.img.src = url;
            var self = this;

            this.img.onload = function () {
                if (self.has("Canvas")) self._pattern = Crafty.canvas.context.createPattern(self.img, self._repeat);
                self.ready = true;

                if (self._repeat === "no-repeat") {
                    self.w = self.img.width;
                    self.h = self.img.height;
                }

                self.trigger("Invalidate");
            };

            return this;
        } else {
            this.ready = true;
            if (this.has("Canvas")) this._pattern = Crafty.canvas.context.createPattern(this.img, this._repeat);
            if (this._repeat === "no-repeat") {
                this.w = this.img.width;
                this.h = this.img.height;
            }
        }


        this.trigger("Invalidate");

        return this;
    }
});


/**@
 * #Crafty.DrawManager
 * @category Graphics
 * @sign Crafty.DrawManager
 *
 * An internal object manage objects to be drawn and implement
 * the best method of drawing in both DOM and canvas
 */
Crafty.DrawManager = (function () {
    /** Helper function to sort by globalZ */
    function zsort(a, b) {
        return a._globalZ - b._globalZ;
    }

    /** array of dirty rects on screen */
    var dirty_rects = [],
        changed_objs = [],
        /** array of DOMs needed updating */
        dom = [],

        dirtyViewport = false,


        /** recManager: an object for managing dirty rectangles. */
        rectManager = {
            /** Finds smallest rectangles that overlaps a and b, merges them into target */
            merge: function (a, b, target) {
                if (typeof target === 'undefined')
                    target = {};
                // Doing it in this order means we can use either a or b as the target, with no conflict
                target._h = Math.max(a._y + a._h, b._y + b._h);
                target._w = Math.max(a._x + a._w, b._x + b._w);
                target._x = Math.min(a._x, b._x);
                target._y = Math.min(a._y, b._y);
                target._w -= target._x;
                target._h -= target._y;

                return target;
            },

            /** cleans up current dirty state, stores stale state for future passes */
            clean: function () {
                var rect, obj, i;
                for (i = 0, l = changed_objs.length; i < l; i++) {
                    obj = changed_objs[i];
                    rect = obj._mbr || obj;
                    if (typeof obj.staleRect === 'undefined')
                        obj.staleRect = {};
                    obj.staleRect._x = rect._x;
                    obj.staleRect._y = rect._y;
                    obj.staleRect._w = rect._w;
                    obj.staleRect._h = rect._h;

                    obj._changed = false;
                }
                changed_objs.length = 0;
                dirty_rects.length = 0;

            },

            /** Takes the current and previous position of an object, and pushes the dirty regions onto the stack
             *  If the entity has only moved/changed a little bit, the regions are squashed together */
            createDirty: function (obj) {
                var rect = obj._mbr || obj;
                if (obj.staleRect) {
                    //If overlap, merge stale and current position together, then return
                    //Otherwise just push stale rectangle
                    if (rectManager.overlap(obj.staleRect, rect)) {
                        rectManager.merge(obj.staleRect, rect, obj.staleRect);
                        dirty_rects.push(obj.staleRect);
                        return;
                    } else {
                        dirty_rects.push(obj.staleRect);
                    }
                }

                // We use the intermediate "currentRect" so it can be modified without messing with obj
                obj.currentRect._x = rect._x;
                obj.currentRect._y = rect._y;
                obj.currentRect._w = rect._w;
                obj.currentRect._h = rect._h;
                dirty_rects.push(obj.currentRect);

            },

            /** Checks whether two rectangles overlap */
            overlap: function (a, b) {
                return (a._x < b._x + b._w && a._y < b._y + b._h && a._x + a._w > b._x && a._y + a._h > b._y);
            }

        };

    Crafty.bind("InvalidateViewport", function () {
        dirtyViewport = true;
    });
    Crafty.bind("PostRender", function () {
        dirtyViewport = false;
    });

    return {
        /**@
         * #Crafty.DrawManager.total2D
         * @comp Crafty.DrawManager
         *
         * Total number of the entities that have the `2D` component.
         */
        total2D: Crafty("2D").length,

        /**@
         * #Crafty.DrawManager.onScreen
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.onScreen(Object rect)
         * @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * Test if a rectangle is completely in viewport
         */
        onScreen: function (rect) {
            return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
                Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
        },

        /**@
         * #Crafty.DrawManager.mergeSet
         * @comp Crafty.DrawManager
         * @sign public Object Crafty.DrawManager.mergeSet(Object set)
         * @param set - an array of rectangular regions
         *
         * Merge any consecutive, overlapping rects into each other.
         * Its an optimization for the redraw regions.
         *
         * The order of set isn't strictly meaningful,
         * but overlapping objects will often cause each other to change,
         * and so might be consecutive.
         */
        mergeSet: function (set) {
            var i = 0;
            while (i < set.length - 1) {
                // If current and next overlap, merge them together into the first, removing the second
                // Then skip the index backwards to compare the previous pair.
                // Otherwise skip forward
                if (rectManager.overlap(set[i], set[i + 1])) {
                    rectManager.merge(set[i], set[i + 1], set[i]);
                    set.splice(i + 1, 1);
                    if (i > 0) i--;
                } else
                    i++;
            }

            return set;
        },

        /**@
         * #Crafty.DrawManager.addCanvas
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.addCanvas(ent)
         * @param ent - The entity to add
         *
         * Add an entity to the list of Canvas objects to draw
         */
        addCanvas: function addCanvas(ent) {
            changed_objs.push(ent);
        },

        /**@
         * #Crafty.DrawManager.addDom
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.addDom(ent)
         * @param ent - The entity to add
         *
         * Add an entity to the list of DOM object to draw
         */
        addDom: function addDom(ent) {
            dom.push(ent);
        },

        /**@
         * #Crafty.DrawManager.debug
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.debug()
         */
        debug: function () {
            console.log(changed_objs, dom);
        },

        /**@
         * #Crafty.DrawManager.drawAll
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.drawAll([Object rect])
         * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * - If rect is omitted, redraw within the viewport
         * - If rect is provided, redraw within the rect
         */
        drawAll: function (rect) {
            rect = rect || Crafty.viewport.rect();
            var q = Crafty.map.search(rect),
                i = 0,
                l = q.length,
                ctx = Crafty.canvas.context,
                current;

            ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

            //sort the objects by the global Z
            q.sort(zsort);
            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.Canvas) {
                    current.draw();
                    current._changed = false;
                }
            }
        },

        /**@
         * #Crafty.DrawManager.boundingRect
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.boundingRect(set)
         * @param set - Undocumented
         *
         * - Calculate the common bounding rect of multiple canvas entities.
         * - Returns coords
         */
        boundingRect: function (set) {
            if (!set || !set.length) return;
            var newset = [],
                i = 1,
                l = set.length,
                current, master = set[0],
                tmp;
            master = [master._x, master._y, master._x + master._w, master._y + master._h];
            while (i < l) {
                current = set[i];
                tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
                if (tmp[0] < master[0]) master[0] = tmp[0];
                if (tmp[1] < master[1]) master[1] = tmp[1];
                if (tmp[2] > master[2]) master[2] = tmp[2];
                if (tmp[3] > master[3]) master[3] = tmp[3];
                i++;
            }
            tmp = master;
            master = {
                _x: tmp[0],
                _y: tmp[1],
                _w: tmp[2] - tmp[0],
                _h: tmp[3] - tmp[1]
            };

            return master;
        },



        /**@
         * #Crafty.DrawManager.renderCanvas
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.renderCanvas()
         *
         * - Triggered by the "RenderScene" event
         * - If the number of rects is over 60% of the total number of objects
         *	do the naive method redrawing `Crafty.DrawManager.drawAll`
         * - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
         *
         * @see Canvas.draw
         */

        renderCanvas: function () {
            var l = changed_objs.length;
            if (!l && !dirtyViewport) {
                return;
            }

            var i = 0,
                rect, q,
                j, len, obj, ent, ctx = Crafty.canvas.context,
                DM = Crafty.DrawManager;


            if (dirtyViewport) {
                var view = Crafty.viewport;
                ctx.setTransform(view._scale, 0, 0, view._scale, Math.round(view._x*view._scale), Math.round(view._y*view._scale) );

            }
            //if the amount of changed objects is over 60% of the total objects
            //do the naive method redrawing
            // TODO: I'm not sure this condition really makes that much sense!
            if (l / DM.total2D > 0.6 || dirtyViewport) {
                DM.drawAll();
                rectManager.clean();
                return;
            }

            // Calculate dirty_rects from all changed objects, then merge some overlapping regions together
            for (i = 0; i < l; i++) {
                rectManager.createDirty(changed_objs[i]);
            }
            dirty_rects = DM.mergeSet(dirty_rects);


            l = dirty_rects.length;
            var dupes = [],
                objs = [];
            // For each dirty rectangle, find entities near it, and draw the overlapping ones
            for (i = 0; i < l; ++i) { //loop over every dirty rect
                rect = dirty_rects[i];
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
                objs.sort(zsort);

                // Then draw each object in that order
                for (j = 0, len = objs.length; j < len; ++j) {
                    obj = objs[j];
                    var area = obj._mbr || obj;
                    if (rectManager.overlap(area, rect))
                        obj.draw();
                    obj._changed = false;
                }

                // Close rectangle clipping
                ctx.closePath();
                ctx.restore();

            }

            // Draw dirty rectangles for debugging, if that flag is set
            if (Crafty.DrawManager.debugDirty === true) {
                ctx.strokeStyle = 'red';
                for (i = 0, l = dirty_rects.length; i < l; ++i) {
                    rect = dirty_rects[i];
                    ctx.strokeRect(rect._x, rect._y, rect._w, rect._h);
                }
            }
            //Clean up lists etc
            rectManager.clean();

        },

        /**@
         * #Crafty.DrawManager.renderDOM
         * @comp Crafty.DrawManager
         * @sign public Crafty.DrawManager.renderDOM()
         *
         * When "RenderScene" is triggered, draws all DOM entities that have been flagged
         *
         * @see DOM.draw
         */
        renderDOM: function () {
            // Adjust the viewport
            if (dirtyViewport) {
                var style = Crafty.stage.inner.style,
                    view = Crafty.viewport;

                style.transform = style[Crafty.support.prefix + "Transform"] = "scale(" + view._scale + ", " + view._scale + ")";
                style.left = Math.round(view._x * view._scale) + "px";
                style.top = Math.round(view._y * view._scale) + "px";
                style.zIndex = 10;
            }

            //if no objects have been changed, stop
            if (!dom.length) return;

            var i = 0,
                k = dom.length;
            //loop over all DOM elements needing updating
            for (; i < k; ++i) {
                dom[i].draw()._changed = false;
            }

            //reset DOM array
            dom.length = 0;

        }


    };
})();

Crafty.extend({
    /**@
     * #Crafty.pixelart
     * @category Graphics
     * @sign public void Crafty.pixelart(Boolean enabled)
     *
     * Sets the image smoothing for drawing images (for both DOM and Canvas).
     * Setting this to true disables smoothing for images, which is the preferred
     * way for drawing pixel art. Defaults to false.
     *
     * This feature is experimental and you should be careful with cross-browser compatibility. 
     * The best way to disable image smoothing is to use the Canvas render method and the Sprite component for drawing your entities.
     *
     * If you want to switch modes in the middle of a scene, 
     * be aware that canvas entities won't be drawn in the new style until something else invalidates them. 
     * (You can manually invalidate all canvas entities with `Crafty("Canvas").trigger("Invalidate");`)
     *
     * Note that Firefox_26 currently has a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=696630) 
     * which prevents disabling image smoothing for Canvas entities that use the Image component. Use the Sprite
     * component instead.
     * Note that Webkit (Chrome & Safari) currently has a bug [link1](http://code.google.com/p/chromium/issues/detail?id=134040) 
     * [link2](http://code.google.com/p/chromium/issues/detail?id=106662) that prevents disabling image smoothing
     * for DOM entities.
     *
     * @example
     * This is the preferred way to draw pixel art with the best cross-browser compatibility.
     * ~~~
     * Crafty.canvas.init();
     * Crafty.pixelart(true);
     * 
     * Crafty.sprite(imgWidth, imgHeight, "spriteMap.png", {sprite1:[0,0]});
     * Crafty.e("2D, Canvas, sprite1");
     * ~~~
     */
    _pixelartEnabled: false,
    pixelart: function(enabled) {
        Crafty._pixelartEnabled = enabled;
        Crafty.trigger("PixelartSet", enabled);
    }
});
