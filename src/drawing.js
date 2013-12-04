var Crafty = require('./core.js'),
    document = window.document;

/**@
 * #Color
 * @category Graphics
 * Draw a solid color for the entity
 */
Crafty.c("Color", {
    _color: "",
    ready: true,

    init: function () {
        this.bind("Draw", function (e) {
            if (e.type === "DOM") {
                e.style.backgroundColor = this._color;
                e.style.lineHeight = 0;
            } else if (e.type === "canvas") {
                if (this._color) e.ctx.fillStyle = this._color;
                e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
            }
        });
    },

    /**@
     * #.color
     * @comp Color
     * @trigger Change - when the color changes
     * @sign public this .color(String color)
     * @sign public String .color()
     * @param color - Color of the rectangle
     * Will create a rectangle of solid color for the entity, or return the color if no argument is given.
     *
     * The argument must be a color readable depending on which browser you
     * choose to support. IE 8 and below doesn't support the rgb() syntax.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color")
     *    .color("#969696");
     * ~~~
     */
    color: function (color) {
        if (!color) return this._color;
        this._color = color;
        this.trigger("Change");
        return this;
    }
});

/**@
 * #Tint
 * @category Graphics
 * Similar to Color by adding an overlay of semi-transparent color.
 *
 * *Note: Currently only works for Canvas*
 */
Crafty.c("Tint", {
    _color: null,
    _strength: 1.0,

    init: function () {
        var draw = function d(e) {
            var context = e.ctx || Crafty.canvas.context;

            context.fillStyle = this._color || "rgba(0,0,0, 0)";
            context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        };

        this.bind("Draw", draw).bind("RemoveComponent", function (id) {
            if (id === "Tint") this.unbind("Draw", draw);
        });
    },

    /**@
     * #.tint
     * @comp Tint
     * @trigger Change - when the tint is applied
     * @sign public this .tint(String color, Number strength)
     * @param color - The color in hexadecimal
     * @param strength - Level of opacity
     *
     * Modify the color and level opacity to give a tint on the entity.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Canvas, Tint")
     *    .tint("#969696", 0.3);
     * ~~~
     */
    tint: function (color, strength) {
        this._strength = strength;
        this._color = Crafty.toRGB(color, this._strength);

        this.trigger("Change");
        return this;
    }
});

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
                  e.style["background-image"] = "url(" + this.__image + ")";
                  e.style["background-repeat"] = this._repeat;
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
     * @trigger Change - when the image is loaded
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

                self.trigger("Change");
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


        this.trigger("Change");

        return this;
    }
});

Crafty.extend({
    _scenes: {},
    _current: null,

    /**@
     * #Crafty.scene
     * @category Scenes, Stage
     * @trigger SceneChange - just before a new scene is initialized - { oldScene:String, newScene:String }
     * @trigger SceneDestroy - just before the current scene is destroyed - { newScene:String  }
     * @sign public void Crafty.scene(String sceneName, Function init[, Function uninit])
     * @param sceneName - Name of the scene to add
     * @param init - Function to execute when scene is played
     * @param uninit - Function to execute before next scene is played, after entities with `2D` are destroyed
     * @sign public void Crafty.scene(String sceneName)
     * @param sceneName - Name of scene to play
     *
     * Method to create scenes on the stage. Pass an ID and function to register a scene.
     *
     * To play a scene, just pass the ID. When a scene is played, all
     * previously-created entities with the `2D` component are destroyed. The
     * viewport is also reset.
     *
     * If you want some entities to persist over scenes (as in, not be destroyed)
     * simply add the component `Persist`.
     *
     * @example
     * ~~~
     * Crafty.scene("loading", function() {
     *     Crafty.background("#000");
     *     Crafty.e("2D, DOM, Text")
     *           .attr({ w: 100, h: 20, x: 150, y: 120 })
     *           .text("Loading")
     *           .css({ "text-align": "center"})
     *           .textColor("#FFFFFF");
     * });
     *
     * Crafty.scene("UFO_dance",
     *              function() {Crafty.background("#444"); Crafty.e("UFO");},
     *              function() {...send message to server...});
     * ~~~
     * This defines (but does not play) two scenes as discussed below.
     * ~~~
     * Crafty.scene("loading");
     * ~~~
     * This command will clear the stage by destroying all `2D` entities (except
     * those with the `Persist` component). Then it will set the background to
     * black and display the text "Loading".
     * ~~~
     * Crafty.scene("UFO_dance");
     * ~~~
     * This command will clear the stage by destroying all `2D` entities (except
     * those with the `Persist` component). Then it will set the background to
     * gray and create a UFO entity. Finally, the next time the game encounters
     * another command of the form `Crafty.scene(scene_name)` (if ever), then the
     * game will send a message to the server.
     */
    scene: function (name, intro, outro) {
        // ---FYI---
        // this._current is the name (ID) of the scene in progress.
        // this._scenes is an object like the following:
        // {'Opening scene': {'initialize': fnA, 'uninitialize': fnB},
        //  'Another scene': {'initialize': fnC, 'uninitialize': fnD}}

        // If there's one argument, play the scene
        if (arguments.length === 1) {
            Crafty.trigger("SceneDestroy", {
                newScene: name
            });
            Crafty.viewport.reset();

            Crafty("2D").each(function () {
                if (!this.has("Persist")) this.destroy();
            });
            // uninitialize previous scene
            if (this._current !== null && 'uninitialize' in this._scenes[this._current]) {
                this._scenes[this._current].uninitialize.call(this);
            }
            // initialize next scene
            var oldScene = this._current;
            this._current = name;
            Crafty.trigger("SceneChange", {
                oldScene: oldScene,
                newScene: name
            });
            this._scenes[name].initialize.call(this);

            return;
        }

        // If there is more than one argument, add the scene information to _scenes
        this._scenes[name] = {};
        this._scenes[name].initialize = intro;
        if (typeof outro !== 'undefined') {
            this._scenes[name].uninitialize = outro;
        }
        return;
    },

    /**@
     * #Crafty.toRGB
     * @category Graphics
     * @sign public String Crafty.scene(String hex[, Number alpha])
     * @param hex - a 6 character hex number string representing RGB color
     * @param alpha - The alpha value.
     *
     * Get a rgb string or rgba string (if `alpha` presents).
     *
     * @example
     * ~~~
     * Crafty.toRGB("ffffff"); // rgb(255,255,255)
     * Crafty.toRGB("#ffffff"); // rgb(255,255,255)
     * Crafty.toRGB("ffffff", .5); // rgba(255,255,255,0.5)
     * ~~~
     *
     * @see Text.textColor
     */
    toRGB: function (hex, alpha) {
        hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex;
        var c = [],
            result;

        c[0] = parseInt(hex.substr(0, 2), 16);
        c[1] = parseInt(hex.substr(2, 2), 16);
        c[2] = parseInt(hex.substr(4, 2), 16);

        result = alpha === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + alpha + ')';

        return result;
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
         * ~~~
         * - If rect is omitted, redraw within the viewport
         * - If rect is provided, redraw within the rect
         * ~~~
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
         * ~~~
         * - Calculate the common bounding rect of multiple canvas entities.
         * - Returns coords
         * ~~~
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
         * ~~~
         * - Triggered by the "RenderScene" event
         * - If the number of rects is over 60% of the total number of objects
         *	do the naive method redrawing `Crafty.DrawManager.drawAll`
         * - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
         * ~~~
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
                ctx.setTransform(view._scale, 0, 0, view._scale, view.x, view.y);

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
         * ~~~
         * When "RenderScene" is triggered, draws all DOM entities that have been flagged
         * ~~~
         *
         * @see DOM.draw
         */
        renderDOM: function () {
            // Adjust the viewport
            if (dirtyViewport) {
                var style = Crafty.stage.inner.style,
                    view = Crafty.viewport;

                style.transform = style[Crafty.support.prefix + "Transform"] = "scale(" + view._scale + ", " + view._scale + ")";
                style.left = view.x + "px";
                style.top = view.y + "px";
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
