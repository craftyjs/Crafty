/**
 * Spatial HashMap for broad phase collision
 *
 * @author Louis Stowasser
 */

    /**@
     * #Crafty.HashMap.constructor
     * @comp Crafty.HashMap
     * @kind Class
     * 
     * @sign public void Crafty.HashMap([cellsize])
     * @param cellsize - the cell size. If omitted, `cellsize` is 64.
     *
     * Set `cellsize`.
     * And create `this.map`.
     */
    var cellsize,

        HashMap = function (cell) {
            cellsize = cell || 64;
            this.map = {};

            this.boundsDirty = false;
            this.boundsHash = {
                max: {
                    x: -Infinity,
                    y: -Infinity
                },
                min: {
                    x: Infinity,
                    y: Infinity
                }
            };
            this.boundsCoords = {
                max: {
                    x: -Infinity,
                    y: -Infinity
                },
                min: {
                    x: Infinity,
                    y: Infinity
                }
            };
        },

        SPACE = " ",
        keyHolder = {};

    HashMap.prototype = {
        /**@
         * #Crafty.map.insert
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public Object Crafty.map.insert(Object obj)
         * @param obj - An entity to be inserted.
         * @returns An object representing this object's entry in the HashMap
         * 
         * `obj` is inserted in '.map' of the corresponding broad phase cells. An object of the following fields is returned.
         * ~~~
         * {
         *   keys: the object that keep track of cells
         *   obj: The inserted object
         *   map: the HashMap object
         * }
         * ~~~
         */
        insert: function (obj) {
            var keys = HashMap.key(obj),
                entry = new Entry(keys, obj, this),
                i = 0,
                j,
                hash;

            //insert into all x buckets
            for (i = keys.x1; i <= keys.x2; i++) {
                //insert into all y buckets
                for (j = keys.y1; j <= keys.y2; j++) {
                    hash = (i << 16) ^ j;
                    if (!this.map[hash]) this.map[hash] = [];
                    this.map[hash].push(obj);
                }
            }

            //mark map boundaries as dirty
            this.boundsDirty = true;

            return entry;
        },

        /**@
         * #Crafty.map.search
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public Object Crafty.map.search(Object rect[, Boolean filter])
         * @param rect - the rectangular region to search for entities.
         *               This object must contain the properties `_x`,`_y`,`_w`,`_h`.
         * @param filter - If `false`, only performs a broad-phase collision check.  The default value is `true`.
         * @return an (possibly empty) array of entities that have been found in the given region
         *
         * Search for entities in the given region, using their broadphase bounding rectangles.
         *
         * - If `filter` is `false`, just search for all the entries in the give `rect` region by broad phase collision. Entity may be returned duplicated.
         * - If `filter` is `true`, filter the above results by checking that they actually overlap `rect`.
         *
         * The easier usage is with `filter == true`. For performance reason, you may use `filter == false`, and filter the result yourself. See examples in drawing.js and collision.js.
         *
         * @example
         * ~~~
         * // search for entities located in the current visible region of the viewport
         * var results = Crafty.map.search(Crafty.viewport.rect());
         * // iterate over all those entities
         * var ent;
         * for (var i = 0, l = results.length; i < l; ++i) {
         *     // do something with an entity
         *     ent = results[i];
         *     Crafty.log('Found entity with id', ent.getId());
         * }
         * ~~~
         */

        search: function (rect, filter) {
            var keys = HashMap.key(rect, keyHolder),
                i, j, k, l, cell,
                results = [];

            if (filter === undefined) filter = true; //default filter to true

            //search in all x buckets
            for (i = keys.x1; i <= keys.x2; i++) {
                //insert into all y buckets
                for (j = keys.y1; j <= keys.y2; j++) {
                    if ((cell = this.map[(i << 16) ^ j])) {
                        for (k = 0; k < cell.length; k++)
                            results.push(cell[k]);
                    }
                }
            }

            if (filter) {
                var obj, id, finalresult = [],
                    found = {};
                //add unique elements to lookup table with the entity ID as unique key
                for (i = 0, l = results.length; i < l; i++) {
                    obj = results[i];
                    if (!obj) continue; //skip if deleted
                    id = obj[0]; //unique ID
                    obj = obj._cbr || obj._mbr || obj;
                    //check if not added to hash and that actually intersects
                    if (!found[id] && obj._x < rect._x + rect._w && obj._x + obj._w > rect._x &&
                                      obj._y < rect._y + rect._h && obj._y + obj._h > rect._y)
                        found[id] = results[i];
                }

                //loop over lookup table and copy to final array
                for (obj in found) finalresult.push(found[obj]);

                return finalresult;
            } else {
                return results;
            }
        },

        /**@
         * #Crafty.map.remove
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public void Crafty.map.remove(Entry entry)
         * @param entry - An entry to remove from the hashmap
         *
         * Remove an entry from the broad phase map.
         *
         * @example
         * ~~~
         * Crafty.map.remove(e);
         * ~~~
         */
        remove: function (entry) {
            var keys = entry.keys;
            var obj = entry.obj;
            var i = 0,
                j, hash;

            //search in all x buckets
            for (i = keys.x1; i <= keys.x2; i++) {
                //insert into all y buckets
                for (j = keys.y1; j <= keys.y2; j++) {
                    hash = (i << 16) ^ j;

                    if (this.map[hash]) {
                        var cell = this.map[hash],
                            m, n = cell.length;
                        //loop over objs in cell and delete
                        for (m = 0; m < n; m++)
                            if (cell[m] && cell[m][0] === obj[0])
                                cell.splice(m, 1);
                    }
                }
            }

            //mark map boundaries as dirty
            this.boundsDirty = true;
        },

        /**@
         * #Crafty.map.refresh
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public void Crafty.map.refresh(Entry entry)
         * @param entry - An entry to update
         *
         * Update an entry's keys, and its position in the broad phrase map.
         *
         * @example
         * ~~~
         * Crafty.map.refresh(e);
         * ~~~
         */
        refresh: function (entry) {
            var keys = entry.keys;
            var obj = entry.obj;
            var cell, i, j, m, n;

            //First delete current object from appropriate cells
            for (i = keys.x1; i <= keys.x2; i++) {
                for (j = keys.y1; j <= keys.y2; j++) {
                    cell = this.map[(i << 16) ^ j];
                    if (cell) {
                        n = cell.length;
                        //loop over objs in cell and delete
                        for (m = 0; m < n; m++)
                            if (cell[m] && cell[m][0] === obj[0])
                                cell.splice(m, 1);
                    }
                }
            }

            //update keys
            HashMap.key(obj, keys);

            //insert into all rows and columns
            for (i = keys.x1; i <= keys.x2; i++) {
                for (j = keys.y1; j <= keys.y2; j++) {
                    cell = this.map[(i << 16) ^ j];
                    if (!cell) cell = this.map[(i << 16) ^ j] = [];
                    cell.push(obj);
                }
            }

            //mark map boundaries as dirty
            this.boundsDirty = true;

            return entry;
        },


        /**@
         * #Crafty.map.boundaries
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public Object Crafty.map.boundaries()
         * @returns An object with the following structure, which represents an MBR which contains all entities
         *
         * Note that the returned object is a reference to the internally used object.
         * Use `Crafty.clone` to get a copy instead.
         *
         * ~~~
         * {
         *   min: {
         *     x: val_x,
         *     y: val_y
         *   },
         *   max: {
         *     x: val_x,
         *     y: val_y
         *   }
         * }
         * ~~~
         */
        boundaries: function() {
            this._updateBoundaries();
            return this.boundsCoords;
        },

        /**
         * #Crafty.map._keyBoundaries
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign private Object Crafty.map._keyBoundaries()
         * @returns An object with the following structure, which represents an MBR which contains all hash keys
         *
         * Find boundaries of row/col cell grid keys instead of actual x/y pixel coordinates.
         *
         * ~~~
         * {
         *   min: {
         *     x: val_x,
         *     y: val_y
         *   },
         *   max: {
         *     x: val_x,
         *     y: val_y
         *   }
         * }
         * ~~~
         */
        _keyBoundaries: function() {
            this._updateBoundaries();
            return this.boundsHash;
        },

        _updateBoundaries: function() {
            // update map boundaries if they were changed
            if (!this.boundsDirty) return;

            var hash = this.boundsHash;
            hash.max.x = -Infinity;
            hash.max.y = -Infinity;
            hash.min.x = Infinity;
            hash.min.y = Infinity;

            var coords = this.boundsCoords;
            coords.max.x = -Infinity;
            coords.max.y = -Infinity;
            coords.min.x = Infinity;
            coords.min.y = Infinity;

            var k, ent;
            //Using broad phase hash to speed up the computation of boundaries.
            for (var h in this.map) {
                if (!this.map[h].length) continue;

                //broad phase coordinate
                var i = h >> 16,
                    j = (h << 16) >> 16;
                if (j < 0) {
                    i = i ^ -1;
                }
                if (i >= hash.max.x) {
                    hash.max.x = i;
                    for (k in this.map[h]) {
                        ent = this.map[h][k];
                        //make sure that this is a Crafty entity
                        if (typeof ent === 'object' && 'requires' in ent) {
                            coords.max.x = Math.max(coords.max.x, ent.x + ent.w);
                        }
                    }
                }
                if (i <= hash.min.x) {
                    hash.min.x = i;
                    for (k in this.map[h]) {
                        ent = this.map[h][k];
                        if (typeof ent === 'object' && 'requires' in ent) {
                            coords.min.x = Math.min(coords.min.x, ent.x);
                        }
                    }
                }
                if (j >= hash.max.y) {
                    hash.max.y = j;
                    for (k in this.map[h]) {
                        ent = this.map[h][k];
                        if (typeof ent === 'object' && 'requires' in ent) {
                            coords.max.y = Math.max(coords.max.y, ent.y + ent.h);
                        }
                    }
                }
                if (j <= hash.min.y) {
                    hash.min.y = j;
                    for (k in this.map[h]) {
                        ent = this.map[h][k];
                        if (typeof ent === 'object' && 'requires' in ent) {
                            coords.min.y = Math.min(coords.min.y, ent.y);
                        }
                    }
                }
            }

            // mark map boundaries as clean
            this.boundsDirty = false;
        },


        /**@
         * #Crafty.map.traverseRay
         * @comp Crafty.map
         * @kind Method
         * 
         * @sign public void Crafty.map.traverseRay(Object origin, Object direction, Function callback)
         * @param origin - the point of origin from which the ray will be cast. The object must contain the properties `_x` and `_y`.
         * @param direction - the direction the ray will be cast. It must be normalized. The object must contain the properties `x` and `y`.
         * @param callback - a callback that will be called for each object that is encountered along the ray.
         *                   This function is called with two arguments: The first one represents the object encountered;
         *                   the second one represents the distance up to which all objects have been reported so far.
         *                   The callback can return a truthy value in order to stop the traversal early.
         *
         * Traverse the spatial map in the direction of the supplied ray.
         *
         * Given the `origin` and `direction` the ray is cast and the `callback` is called
         * for each object encountered in map cells traversed by the ray.
         *
         * The callback is called for each object that may be intersected by the ray.
         * Whether an actual intersection occurs shall be determined by the callback's implementation.
         *
         * @example
         * ~~~
         * Crafty.e("2D")
         *       .setName('First entity')
         *       .attr({x: 0, y: 0, w: 10, h: 10});
         *
         * Crafty.e("2D")
         *       .setName('Second entity')
         *       .attr({x: 20, y: 20, w: 10, h: 10});
         *
         * var origin = {_x: -25, _y: -25};
         * var direction = new Crafty.math.Vector2D(1, 1).normalize();
         *
         * Crafty.map.traverseRay(origin, direction, function(ent, processedDistance) {
         *   Crafty.log('Encountered entity named', ent.getName()); // logs 'First entity'
         *   Crafty.log('All entities up to', processedDistance, 'px away have been reported thus far.');
         *   Crafty.log('Stopping traversal after encountering the first entity.');
         *   return true;
         * });
         * ~~~
         */

        // See [this tutorial](http://www.flipcode.com/archives/Raytracing_Topics_Techniques-Part_4_Spatial_Subdivisions.shtml) and linked materials
        // Segment-segment intersection is described here: http://stackoverflow.com/a/565282/3041008
        //
        // origin = {_x, _y}
        // direction = {x, y}, must be normalized
        //
        //
        // # Let
        //  edge = end - start
        //  edge x edge == 0
        //
        // # Segment - segment intersection equation
        //  origin + d * direction = start + e * edge
        //
        // # Solving for d
        //  (origin + d * direction) x edge = (start + e * edge) x edge
        //  d = (start − origin) × edge / (direction × edge)
        //
        //      (start.x - origin.x) * edge.y - (start.y - origin.y) * edge.x
        //  d = --------------------------------------------------------------
        //               direction.x * edge.y - direction.y * edge.x
        //
        //
        // # In case ray intersects vertical cell grid edge
        // start = (x, 0)
        // edge = (0, 1)
        //
        //      start.x - origin.x
        //  d = -------------------
        //         direction.x
        //
        // # In case ray intersects horizontal cell grid edge
        // start = (0, y)
        // edge = (1, 0)
        //
        //      start.y - origin.y
        //  d = -------------------
        //         direction.y
        //
        traverseRay: function(origin, direction, callback) {
            var dirX = direction.x,
                dirY = direction.y;
            // copy input data
            // TODO maybe allow HashMap.key search with point only
            origin = {
                _x: origin._x,
                _y: origin._y,
                _w: 0,
                _h: 0
            };


            var keyBounds = this._keyBoundaries();
            var keys = HashMap.key(origin, keyHolder);

            // calculate col & row cell indices
            var currentCol = keys.x1,
                currentRow = keys.y1;
            var minCol = keyBounds.min.x,
                minRow = keyBounds.min.y,
                maxCol = keyBounds.max.x,
                maxRow = keyBounds.max.y;
            // direction to traverse cells
            var stepCol = dirX > 0 ? 1 : (dirX < 0 ? -1 : 0),
                stepRow = dirY > 0 ? 1 : (dirY < 0 ? -1 : 0);


            // first, next cell edge in absolute coordinates
            var firstCellEdgeX = (dirX >= 0) ? (currentCol + 1) * cellsize : currentCol * cellsize,
                firstCellEdgeY = (dirY >= 0) ? (currentRow + 1) * cellsize : currentRow * cellsize;

            // distance from origin to previous cell edge
            var previousDistance = -Infinity;

            // distances to next horizontal and vertical cell edge
            var deltaDistanceX = 0, // distance for the ray to be advanced to cross a whole cell horizontally
                deltaDistanceY = 0, // distance for the ray to be advanced to cross a whole cell vertically
                nextDistanceX = Infinity, // distance we can advance(increase magnitude) ray until we advance to next horizontal cell
                nextDistanceY = Infinity; // distance we can advance(increase magnitude) ray until we advance to next vertical cell

            var norm;
            if (dirX !== 0) {
                norm = 1.0 / dirX;
                nextDistanceX = (firstCellEdgeX - origin._x) * norm;
                deltaDistanceX = (cellsize * stepCol) * norm;
            }
            if (dirY !== 0) {
                norm = 1.0 / dirY;
                nextDistanceY = (firstCellEdgeY - origin._y) * norm;
                deltaDistanceY = (cellsize * stepRow) * norm;
            }


            // advance starting cell to be inside of map bounds
            while ((stepCol === 1 && currentCol < minCol && minCol !== Infinity) || (stepCol === -1 && currentCol > maxCol && maxCol !== -Infinity) ||
                   (stepRow === 1 && currentRow < minRow && minRow !== Infinity) || (stepRow === -1 && currentRow > maxRow && maxRow !== -Infinity)) {

                // advance to closest cell
                if (nextDistanceX < nextDistanceY) {
                    previousDistance = nextDistanceX;

                    currentCol += stepCol;
                    nextDistanceX += deltaDistanceX;
                } else {
                    previousDistance = nextDistanceY;

                    currentRow += stepRow;
                    nextDistanceY += deltaDistanceY;
                }
            }

            var cell;
            // traverse over cells
            // TODO: maybe change condition to `while (currentCol !== endX) || (currentRow !== endY)`
            while ((minCol <= currentCol && currentCol <= maxCol) &&
                   (minRow <= currentRow && currentRow <= maxRow)) {

                // process cell
                if ((cell = this.map[(currentCol << 16) ^ currentRow])) {
                    // check each object inside this cell
                    for (var k = 0; k < cell.length; k++) {
                        // if supplied callback returns true, abort traversal
                        if (callback(cell[k], previousDistance))
                            return;
                    }
                }

                // advance to closest cell
                if (nextDistanceX < nextDistanceY) {
                    previousDistance = nextDistanceX;

                    currentCol += stepCol;
                    nextDistanceX += deltaDistanceX;
                } else {
                    previousDistance = nextDistanceY;

                    currentRow += stepRow;
                    nextDistanceY += deltaDistanceY;
                }
            }
        }

    };

    /**@
     * #Crafty.HashMap
     * @category 2D
     * @kind Class
     * 
     * Broad-phase collision detection engine. See background information at
     *
     * - [N Tutorial B - Broad-Phase Collision](http://www.metanetsoftware.com/technique/tutorialB.html)
     * - [Broad-Phase Collision Detection with CUDA](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch32.html)
     * @see Crafty.map
     */

    /**@
     * #Crafty.HashMap.key
     * @comp Crafty.HashMap
     * @kind Method
     * 
     * @sign public Object Crafty.HashMap.key(Object obj)
     * @param obj - an Object that has .mbr() or _x, _y, _w and _h.
     *
     * Get the rectangular region (in terms of the grid, with grid size `cellsize`), where the object may fall in. This region is determined by the object's bounding box.
     * The `cellsize` is 64 by default.
     *
     * @see Crafty.HashMap.constructor
     */
    HashMap.key = function (obj, keys) {
        obj = obj._cbr || obj._mbr || obj;
        keys = keys || {};

        keys.x1 = Math.floor(obj._x / cellsize);
        keys.y1 = Math.floor(obj._y / cellsize);
        keys.x2 = Math.floor((obj._w + obj._x) / cellsize);
        keys.y2 = Math.floor((obj._h + obj._y) / cellsize);
        return keys;
    };

    HashMap.hash = function (keys) {
        return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
    };

    function Entry(keys, obj, map) {
        this.keys = keys;
        this.map = map;
        this.obj = obj;
    }

    Entry.prototype = {
        update: function (rect) {
            //check if buckets change
            if (HashMap.hash(HashMap.key(rect, keyHolder)) !== HashMap.hash(this.keys)) {
                this.map.refresh(this);
            }
        }
    };

    module.exports = HashMap;
