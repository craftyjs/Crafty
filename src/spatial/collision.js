var Crafty = require('../core/core.js'),
    DEG_TO_RAD = Math.PI / 180,
    EPSILON = 1e-6;

Crafty.extend({
    /**@
     * #Crafty.raycast
     * @category 2D
     * @kind Method
     * 
     * @sign public Array .raycast(Object origin, Object direction[, Number maxDistance][, String comp][, Boolean sort])
     * @param origin - the point of origin from which the ray will be cast. The object must contain the properties `_x` and `_y`.
     * @param direction - the direction the ray will be cast. It must be normalized. The object must contain the properties `x` and `y`.
     * @param maxDistance - the maximum distance up to which intersections will be found.
     *                      This is an optional parameter defaulting to `Infinity`.
     *                      If it's `Infinity` find all intersections.
     *                      If it's negative find only first intersection (if there is one).
     *                      If it's positive find all intersections up to that distance.
     * @param comp - check for intersection with entities that have this component applied to them.
     *               This is an optional parameter that is disabled by default.
     * @param sort - whether to sort the returned array by increasing distance.
     *               May be disabled to slightly improve performance if sorted results are not needed.
     *               Defaults to `true`.
     * @returns an array of raycast-results that may be empty, if no intersection has been found.
     *          Otherwise, each raycast-result looks like `{obj: Entity, distance: Number, x: Number, y: Number}`,
     *          describing which `obj` entity has intersected the ray at intersection point `x`,`y`, `distance` px away from `origin`.
     *
     * Cast a ray from its `origin` in the `direction` and
     * report entities that intersect with it, given the parameter constraints.
     *
     * Raycasting only reports entities, that have the `Collision` component applied to them.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision")
     *       .setName('First entity')
     *       .attr({x: 0, y: 0, w: 10, h: 10});
     *
     * Crafty.e("2D, Collision")
     *       .setName('Second entity')
     *       .attr({x: 20, y: 20, w: 10, h: 10});
     *
     * var origin = {_x: -25, _y: -25};
     * var direction = new Crafty.math.Vector2D(1, 1).normalize();
     *
     * var results = Crafty.raycast(origin, direction, -1); // find only 1st intersection
     * Crafty.log('Intersections found', results.length); // logs '1'
     *
     * var result = results[0];
     * Crafty.log('1st intersection:');
     * Crafty.log('Entity name:', result.obj.getName()); // logs 'First entity'
     * Crafty.log('Distance from origin to intersection point', result.distance); // logs '25 * Math.sqrt(2)'
     * Crafty.log('Intersection point:', result.x, result.y); // logs '0' '0'
     * ~~~
     *
     * @see Crafty.polygon#.intersectRay
     * @see Crafty.map#Crafty.map.traverseRay
     */

    // origin = {_x, _y}
    // direction = {x, y}, must be normalized
    //
    // Add approximate ray intersection with bounding rectangle,
    // before doing exact ray intersection if needed in future.
    // https://gist.github.com/mucaho/77846e9fc0cd3c8b600c
    raycast: function(origin, direction) {
        // default parameters
        var comp = 'obj',
            maxDistance = Infinity,
            sort = true;
        // optional arguments
        var argument, type;
        for (var i = 2, l = arguments.length; i < l; ++i) {
            argument = arguments[i];
            type = typeof argument;
            if (type === 'number') maxDistance = argument + EPSILON; // make it inclusive
            else if (type === 'string') comp = argument;
            else if (type === 'boolean') sort = argument;
        }

        var ox = origin._x,
            oy = origin._y,
            dx = direction.x,
            dy = direction.y;


        var alreadyChecked = {},
            results = [];


        if (maxDistance < 0) { // find first intersection

            var closestObj = null,
                minDistance = Infinity;

            // traverse map
            Crafty.map.traverseRay(origin, direction, function(obj, previousCellDistance) {
                // check if we advanced to next cell
                //      then report closest object from previous cell
                //          if intersection point is in previous cell
                if (closestObj && minDistance < previousCellDistance) {
                    results.push({
                        obj: closestObj,
                        distance: minDistance,
                        x: ox + minDistance * dx,
                        y: oy + minDistance * dy
                    });
                    closestObj = null;
                    minDistance = Infinity;

                    return true;
                }

                // object must contain polygon hitbox, the specified component and must not already be checked
                if (!obj.map || !obj.__c[comp] || alreadyChecked[obj[0]]) return;
                alreadyChecked[obj[0]] = true;

                // do exact intersection test
                var distance = obj.map.intersectRay(origin, direction);
                if (distance < minDistance) {
                    closestObj = obj;
                    minDistance = distance;
                }
            });

            // in case traversal ended and we haven't yet pushed nearest intersecting object
            if (closestObj) {
                results.push({
                    obj: closestObj,
                    distance: minDistance,
                    x: ox + minDistance * dx,
                    y: oy + minDistance * dy
                });
            }

        } else { // find intersections up to max distance

            // traverse map
            Crafty.map.traverseRay(origin, direction, function(obj, previousCellDistance) {
                // check if we advanced to next cell
                //      then cancel traversal if previousCellDistance > maxDistance
                if (previousCellDistance > maxDistance) {
                    return true;
                }

                // object must contain polygon hitbox, the specified component and must not already be checked
                if (!obj.map || !obj.__c[comp] || alreadyChecked[obj[0]]) return;
                alreadyChecked[obj[0]] = true;

                // do exact intersection test
                var distance = obj.map.intersectRay(origin, direction);
                if (distance < maxDistance) {
                    results.push({
                        obj: obj,
                        distance: distance,
                        x: ox + distance * dx,
                        y: oy + distance * dy
                    });
                }
            });
        }


        if (sort) results.sort(function(a, b) { return a.distance - b.distance; });


        return results;
    }
});

/**@
 * #Collision
 * @category 2D
 * @kind Component
 * 
 * @trigger HitOn - Triggered when collisions occur. Will not trigger again until collisions of this type cease, or an event is requested once more (using `resetHitChecks(component)`). - { hitData }
 * @trigger HitOff - Triggered when collision with a specific component type ceases - String - componentName
 *
 * Component to detect collision between any two convex polygons.
 *
 * If collision checks are registered for multiple component and collisions with
 * multiple types occur simultaniously, each collision will cause an individual
 * event to fire.
 *
 * @note All data received from events is only valid for the duration of the event's callback.
 * If you wish to preserve the data, make a copy of it.
 *
 * For a description of collision event data (hitData above), see the documentation for
 * `.hit()`.
 *
 * @see 2D
 */
Crafty.c("Collision", {
    init: function () {
        this.requires("2D");
        this._collisionData = {};

        this.collision();
    },

    // Run by Crafty when the component is removed
    remove: function() {
        this._cbr = null;
        this.unbind("Resize", this._resizeMap);
        this.unbind("Resize", this._checkBounds);
    },

    /**@
     * #.collision
     * @comp Collision
     * @kind Method
     *
     * @trigger NewHitbox - when a new hitbox is assigned - Crafty.polygon
     *
     * @sign public this .collision([Crafty.polygon polygon])
     * @param polygon - Optional Crafty.polygon object that will act as the hit area.
     *
     * @sign public this .collision([Array coordinatePairs])
     * @param coordinatePairs - Optional array of x, y coordinate pairs to generate a hit area polygon.
     *
     * @sign public this .collision([x1, y1,.., xN, yN])
     * @param point# - Optional list of x, y coordinate pairs to generate a hit area polygon.
     *
     * Constructor that takes a polygon, an array of points or a list of points to use as the hit area,
     * with points being relative to the object's position in its unrotated state.
     *
     * The hit area must be a convex shape and not concave for collision detection to work properly.
     *
     * If no parameter is passed, the x, y, w, h properties of the entity will be used, and the hitbox will be resized when the entity is.
     *
     * If a hitbox is set that is outside of the bounds of the entity itself, there will be a small performance penalty as it is tracked separately.
     *
     * In order for your custom hitbox to have any effect, you have to add the `Collision` component to all other entities this entity needs to collide with using this custom hitbox.
     * On the contrary the collisions will be resolved using the default hitbox. See `.hit()` - `MBR` represents default hitbox collision, `SAT` represents custom hitbox collision.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision").collision(
     *     new Crafty.polygon([50, 0,  100, 100,  0, 100])
     * );
     *
     * Crafty.e("2D, Collision").collision([50, 0,  100, 100,  0, 100]);
     *
     * Crafty.e("2D, Collision").collision(50, 0,  100, 100,  0, 100);
     * ~~~
     *
     * @see Crafty.polygon
     */
    collision: function (polygon) {
        // Unbind anything bound to "Resize"
        this.unbind("Resize", this._resizeMap);
        this.unbind("Resize", this._checkBounds);

        if (!polygon) {
            // If no polygon is specified, then a polygon is created that matches the bounds of the entity
            // It will be adjusted on a "Resize" event
            polygon = new Crafty.polygon([0, 0, this._w, 0, this._w, this._h, 0, this._h]);
            this.bind("Resize", this._resizeMap);
            this._cbr = null;
        } else {
            // Otherwise, we set the specified hitbox, converting from a list of arguments to a polygon if necessary
            if (arguments.length > 1) {
                //convert args to array to create polygon
                var args = Array.prototype.slice.call(arguments, 0);
                polygon = new Crafty.polygon(args);
            // Otherwise, we set the specified hitbox, converting from an array of points to a polygon if necessary
            } else if (polygon.constructor === Array) {
                //Clone the array so we don't modify it for anything else that might be using it
                polygon = new Crafty.polygon(polygon.slice());
            // Otherwise, we set the specified hitbox
            } else {
                //Clone the polygon so we don't modify it for anything else that might be using it
                polygon = polygon.clone();
            }
            // Check to see if the polygon sits outside the entity, and set _cbr appropriately
            // On resize, the new bounds will be checked if necessary
            this._findBounds(polygon.points);
        }

        // If the entity is currently rotated, the points in the hitbox must also be rotated
        if (this.rotation) {
            polygon.rotate(
                this.rotation,
                this._origin.x,
                this._origin.y,
                Math.cos(-this.rotation * DEG_TO_RAD),
                Math.sin(-this.rotation * DEG_TO_RAD));
        }

        // Finally, assign the hitbox, and attach it to the "Collision" entity
        this.map = polygon;
        this.attach(this.map);
        this.map.shift(this._x, this._y);
        this.trigger("NewHitbox", polygon);
        return this;
    },

    /**@
     * #.cbr
     * @comp Collision
     * @kind Method
     * 
     * @sign public Object .cbr([Object cbr])
     * @param cbr - an object to use as output
     * @returns an object with `_x`, `_y`, `_w`, and `_h` properties; if an object is passed in, it will be reused rather than creating a new object.
     *
     * Return an object containing a copy of this entity's collision bounding rectangle.
     * The CBR encompasses both the entity's custom collision hitbox and its MBR.
     * If the custom collision hitbox does not sit outside the entity it will return the entity's minimum bounding rectangle (`.mbr()`) instead.
     *
     * @note The keys have an underscore prefix. This is due to the x, y, w, h properties
     * being setters and getters that wrap the underlying properties with an underscore (_x, _y, _w, _h).
     *
     * @see 2D#.mbr
     */
    cbr: function (cbr) {
        cbr = cbr || {};
        if (!this._cbr) {
            return this.mbr(cbr);
        } else {
            cbr._x = (this._cbr._x);
            cbr._y = (this._cbr._y);
            cbr._w = (this._cbr._w);
            cbr._h = (this._cbr._h);
            return cbr;
        }
    },

    // If the hitbox is set by hand, it might extend beyond the entity.
    // In such a case, we need to track this separately.
    // This function finds a (non-minimal) bounding circle around the hitbox.
    //
    // It uses a pretty naive algorithm to do so, for more complicated options see [wikipedia](http://en.wikipedia.org/wiki/Bounding_sphere).
    _findBounds: function(points) {
        var minX = Infinity, maxX = -Infinity, minY=Infinity, maxY=-Infinity;
        var l = points.length;

        // Calculate the MBR of the points by finding the min/max x and y
        for (var i=0; i<l; i+=2) {
            if (points[i] < minX)
                minX = points[i];
            if (points[i] > maxX)
                maxX = points[i];
            if (points[i+1] < minY)
                minY = points[i+1];
            if (points[i+1] > maxY)
                maxY = points[i+1];
        }

        // This describes a circle centered on the MBR of the points, with a diameter equal to its diagonal
        // It will be used to find a rough bounding box round the points, even if they've been rotated
        var cbr = {
            cx: (minX + maxX) / 2,
            cy: (minY + maxY) / 2,
            r: Math.sqrt((maxX - minX)*(maxX - minX) + (maxY - minY)*(maxY - minY)) / 2
        };

        // We need to worry about resizing, but only if resizing could possibly change whether the hitbox is in or out of bounds
        // Thus if the upper-left corner is out of bounds, then there's no need to recheck on resize
        if (minX >= 0 && minY >= 0) {
            this._checkBounds = function() {
                if (this._cbr === null && this._w < maxX || this._h < maxY) {
                   this._cbr = cbr;
                   this._calculateMBR();
                } else if (this._cbr) {
                    this._cbr = null;
                    this._calculateMBR();
                }
            };
            this.bind("Resize", this._checkBounds);
        }

        // If the hitbox is within the entity, _cbr is null
        // Otherwise, set it, and immediately calculate the bounding box.
        if (minX >= 0 && minY >= 0 && maxX <= this._w && maxY <= this._h) {
            this._cbr = null;
            return false;
        } else {
            this._cbr = cbr;
            this._calculateMBR();
            return true;
        }
    },

    // The default behavior is to match the hitbox to the entity.
    // This function will change the hitbox when a "Resize" event triggers.
    _resizeMap: function (e) {
        var dx, dy, rot = this.rotation * DEG_TO_RAD,
            points = this.map.points;

        // Depending on the change of axis, move the corners of the rectangle appropriately
        if (e.axis === 'w') {
            if (rot) {
                dx = e.amount * Math.cos(rot);
                dy = e.amount * Math.sin(rot);
            } else {
                dx = e.amount;
                dy = 0;
            }

            // "top right" point shifts on change of w
            points[2] += dx;
            points[3] += dy;
        } else {
            if (rot) {
                dy = e.amount * Math.cos(rot);
                dx = -e.amount * Math.sin(rot);
            } else {
                dx = 0;
                dy = e.amount;
            }

            // "bottom left" point shifts on change of h
            points[6] += dx;
            points[7] += dy;
        }

        // "bottom right" point shifts on either change
        points[4] += dx;
        points[5] += dy;
    },

    /**@
     * #.hit
     * @comp Collision
     * @kind Method
     * 
     * @sign public Array .hit(String component[, Array results])
     * @param component - Check collision with entities that have this component
     * applied to them.
     * @param results - If a results array is supplied, any collisions will be appended to it 
     * @return `null` if there is no collision. If a collision is detected,
     * returns an Array of collision data objects (see below).
     * If the results parameter was passed, it will be used as the return value.
     *
     * Tests for collisions with entities that have the specified component applied to them.
     * If a collision is detected, data regarding the collision will be present in the array 
     * returned by this method. If no collisions occur, this method returns `null`.
     *
     * When testing for collisions, if both entities have the `Collision` component, then 
     * the collision test will use the Separating Axis Theorem (SAT), and provide more detailed
     * information about the collision.  Otherwise, it will be a simple test of whether the
     * minimal bounding rectangles (MBR) overlap.
     * 
     * Following is a description of a collision data object that this method may
     * return: The returned collision data will be an Array of Objects with the
     * type of collision used, the object collided and if the type used was SAT (a polygon was used as the hitbox) then an amount of overlap.
     * ~~~
     * [{
     *    obj: [entity],
     *    type: ["MBR" or "SAT"],
     *    overlap: [number],
     *    nx: [number],
     *    ny: [number]
     * }]
     * ~~~
     *
     * All collision results will have these properties:
     * - **obj:** The entity with which the collision occured.
     * - **type:** Collision detection method used. One of:
     *   - *MBR:* Standard axis aligned rectangle intersection (`.intersect` in the 2D component).
     *   - *SAT:* Collision between any two convex polygons. Used when both colliding entities have the `Collision` component applied to them.
     * 
     * If the collision result type is **SAT** then there will be three additional properties, which
     * represent the minimum translation vector (MTV) -- the direction and distance of the minimal translation
     * that will result in non-overlapping entities.
     * - **overlap:** The magnitude of the translation vector.
     * - **nx:** The x component of the MTV.
     * - **ny:** The y component of the MTV.
     *
     * These additional properties (returned only when both entities have the "Collision" component)
     * are useful when providing more natural collision resolution.
     *
     * If you want more fine-grained control consider using `Crafty.map.search()`.
     *
     * @example
     * Resolving collisions with static colliders (walls) for moving entity (player).
     * ~~~
     * Crafty.e("2D, Fourway, Collision, player")
     *       .attr({x: 32, y: 32, w: 32, h: 32})
     *       .collision([0, 16, 16, 0, 32, 16, 16, 32])
     *       .fourway()
     *       .bind('Move', function(evt) { // after player moved
     *         var hitDatas, hitData;
     *         if ((hitDatas = this.hit('wall'))) { // check for collision with walls
     *           hitData = hitDatas[0]; // resolving collision for just one collider
     *           if (hitData.type === 'SAT') { // SAT, advanced collision resolution
     *             // move player back by amount of overlap
     *             this.x -= hitData.overlap * hitData.nx;
     *             this.y -= hitData.overlap * hitData.ny;
     *           } else { // MBR, simple collision resolution
     *             // move player to previous position 
     *             this.x = evt._x;
     *             this.y = evt._y;
     *           }
     *         }
     *       });
     * ~~~
     *
     * @see Crafty.map#Crafty.map.search
     */
    _collisionHitDupes: [],
    _collisionHitResults: [],
    hit: function (component, results) {
        var area = this._cbr || this._mbr || this;
        var searchResults = this._collisionHitResults;
        searchResults.length = 0;
        searchResults = Crafty.map.unfilteredSearch(area, searchResults);
        var l = searchResults.length;
        if (!l) {
            return null;
        }
        var  i = 0,
            dupes = this._collisionHitDupes,
            id, obj;

        results = results || [];
        dupes.length = 0;

        for (; i < l; ++i) {
            obj = searchResults[i];

            if (!obj) continue;
            id = obj[0];

            //check if not added to hash and that actually intersects
            if (!dupes[id] && this[0] !== id && obj.__c[component]){
                dupes[id] = obj;
                if (obj.map) {
                    var SAT = this._SAT(this.map, obj.map);
                    if (SAT) {
                        results.push(SAT);
                        SAT.obj = obj;
                        SAT.type = "SAT";
                    }
                } else if (Crafty.rectManager.overlap(area, obj._cbr || obj._mbr || obj)){
                    results.push({
                        obj: obj,
                        type: "MBR"
                    });
                }
            }
        }

        if (!results.length) {
            return null;
        }

        return results;
    },

    /**@
     * #.onHit
     * @comp Collision
     * @kind Method
     * 
     * @sign public this .onHit(String component, Function callbackOn[, Function callbackOff])
     * @param component - Component to check collisions for.
     * @param callbackOn - Callback method to execute upon collision with the component.
     *                     The first argument passed  will be the results of the collision check in the same format documented for `hit()`.
     *                     The second argument passed will be a Boolean indicating whether the collision with a component occurs for the first time.
     * @param callbackOff - Callback method executed once as soon as collision stops.  No arguments are passed.
     *
     * Creates an `UpdateFrame` event calling `.hit()` each frame.  When a collision is detected the `callbackOn` will be invoked.
     *
     * Note that the `callbackOn` will be invoked every frame the collision is active, not just the first time the collision occurs.
     * Use the second argument passed to `callbackOn` to differentiate that, which will be `true` if it's the first time the collision occurs.
     *
     * If you want more fine-grained control consider using `.checkHits()`, `.hit()` or even `Crafty.map.search()`.
     *
     * @example
     * Respond to collisions between player and bullets.
     * ~~~
     * Crafty.e("2D, Collision, player")
     *       .attr({ health: 100 })
     *       .onHit('bullet', function(hitDatas) { // on collision with bullets
     *         for (var i = 0, l = hitDatas.length; i < l; ++i) { // for each bullet hit
     *           hitDatas[i].obj.destroy(); // destroy the bullet
     *           this.health -= 25; // player looses health
     *           if (this.health <= 0) // once player's health depletes
     *             this.destroy(); // player dies
     *         }
     *       });
     * ~~~
     *
     * @see .checkHits
     * @see .hit
     * @see Crafty.map#Crafty.map.search
     */
    onHit: function (component, callbackOn, callbackOff) {
        var justHit = false;
        this.bind("UpdateFrame", function () {
            var hitData = this.hit(component);
            if (hitData) {
                callbackOn.call(this, hitData, !justHit);
                justHit = true;
            } else if (justHit) {
                if (typeof callbackOff === 'function') {
                    callbackOff.call(this);
                }
                justHit = false;
            }
        });
        return this;
    },

    /**
     * This is a helper method for creating collisions handlers set up by `checkHits`. Do not call this directly.
     *
     * @param {String} component - The name of the component for which this handler checks for collisions.
     * @param {Object} collisionData - Collision data object used to track collisions with the specified component.
     *
     * @see .checkHits
     */
    _createCollisionHandler: function(component, collisionData) {
        return function() {
            var hitData = this.hit(component);

            if (collisionData.occurring === true) {
                if (hitData !== null) {
                    // The collision is still in progress
                    return;
                }

                collisionData.occurring = false;
                this.trigger("HitOff", component);
            } else if (hitData !== null) {
                collisionData.occurring = true;
                this.trigger("HitOn", hitData);
            }
        };
    },

    /**@
     * #.checkHits
     * @comp Collision
     * @kind Method
     * 
     * @sign public this .checkHits(String componentList)
     * @param componentList - A comma seperated list of components to check for collisions with.
     * @sign public this .checkHits(String component1[, .., String componentN])
     * @param component# - A component to check for collisions with.
     *
     * Performs collision checks against all entities that have at least one of
     * the components specified when calling this method. If collisions occur,
     * a "HitOn" event containing the collision information will be fired for the
     * entity on which this method was invoked. See the documentation for `.hit()`
     * for a description of collision data contained in the event.
     * When a collision that was reported ends, a corresponding "HitOff" event
     * will be fired.
     *
     * Calling this method more than once for the same component type will not
     * cause redundant hit checks.
     *
     * If you want more fine-grained control consider using `.hit()` or even `Crafty.map.search()`.
     *
     * @note Hit checks are performed on each new frame (using
     * the *UpdateFrame* event). It is entirely possible for object to move in
     * said frame after the checks were performed (even if the more is the
     * result of *UpdateFrame*, as handlers run in no particular order). In such
     * a case, the hit events will not fire until the next check is performed in
     * the following frame.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision")
     *     .checkHits('Solid') // check for collisions with entities that have the Solid component in each frame
     *     .bind("HitOn", function(hitData) {
     *         Crafty.log("Collision with Solid entity occurred for the first time.");
     *     })
     *     .bind("HitOff", function(comp) {
     *         Crafty.log("Collision with Solid entity ended.");
     *     });
     * ~~~
     *
     * @see .hit
     * @see Crafty.map#Crafty.map.search
     */
    checkHits: function () {
        var components = arguments;
        var i = 0;

        if (components.length === 1) {
            components = components[0].split(/\s*,\s*/);
        }

        for (; i < components.length; ++i) {
            var component = components[i];
            var collisionData = this._collisionData[component];

            if (collisionData !== undefined) {
                // There is already a handler for collision with this component
                continue;
            }

            this._collisionData[component] = collisionData = { occurring: false, handler: null };
            collisionData.handler = this._createCollisionHandler(component, collisionData);

            this.bind("UpdateFrame", collisionData.handler);
        }

        return this;
    },

    /**@
     * #.ignoreHits
     * @comp Collision
     * @kind Method
     *
     * @sign public this .ignoreHits()
     *
     * @sign public this .ignoreHits(String componentList)
     * @param componentList - A comma separated list of components to stop checking
     * for collisions with.
     *
     * @sign public this .ignoreHits(String component1[, .., String componentN])
     * @param component# - A component to stop checking for collisions with.
     *
     * Stops checking for collisions with all, or certain, components. If called
     * without arguments, this method will cause all collision checks on the
     * entity to cease. To disable checks for collisions with specific
     * components, specify the components as a comma separated string or as
     * a set of arguments.
     *
     * Calling this method with component names for which there are no collision
     * checks has no effect.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision")
     *     .checkHits('Solid')
     *     ...
     *     .ignoreHits('Solid'); // stop checking for collisions with entities that have the Solid component
     * ~~~
     */
    ignoreHits: function () {
        var components = arguments;
        var i = 0;
        var collisionData;

        if (components.length === 0) {
            for (collisionData in this._collisionData) {
                this.unbind("UpdateFrame", collisionData.handler);
            }

            this._collisionData = {};
        }

        if (components.length === 1) {
            components = components[0].split(/\s*,\s*/);
        }

        for (; i < components.length; ++i) {
            var component = components[i];
            collisionData = this._collisionData[component];

            if (collisionData === undefined) {
                continue;
            }

            this.unbind("UpdateFrame", collisionData.handler);
            delete this._collisionData[component];
        }

        return this;
    },

    /**@
     * #.resetHitChecks
     * @comp Collision
     * @kind Method
     * 
     * @sign public this .resetHitChecks()
     * @sign public this .resetHitChecks(String componentList)
     * @param componentList - A comma seperated list of components to re-check
     * for collisions with.
     * @sign public this .resetHitChecks(String component1[, .., String componentN])
     * @param component# - A component to re-check for collisions with.
     *
     * Causes collision events to be received for collisions that are already
     * taking place (normally, an additional event would not fire before said
     * collisions cease and happen another time).
     * If called without arguments, this method will cause all collision checks on the
     * entity to fire events once more. To re-check for collisions with specific
     * components, specify the components as a comma separated string or as
     * a set of arguments.
     *
     * Calling this method with component names for which there are no collision
     * checks has no effect.
     *
     * @example
     * ~~~
     * // this example fires the HitOn event each frame the collision with the Solid entity is active, instead of just the first time the collision occurs.
     * Crafty.e("2D, Collision")
     *     .checkHits('Solid')
     *     .bind("HitOn", function(hitData) {
     *         Crafty.log("Collision with Solid entity was reported in this frame again!");
     *         this.resetHitChecks('Solid'); // fire the HitOn event in the next frame also, if the collision is still active.
     *     })
     * ~~~
     */
    resetHitChecks: function() {
        var components = arguments;
        var i = 0;
        var collisionData;

        if (components.length === 0) {
            for (collisionData in this._collisionData) {
                this._collisionData[collisionData].occurring = false;
            }
        }

        if (components.length === 1) {
            components = components[0].split(/\s*,\s*/);
        }

        for (; i < components.length; ++i) {
            var component = components[i];
            collisionData = this._collisionData[component];

            if (collisionData === undefined) {
                continue;
            }

            collisionData.occurring = false;
        }

        return this;
    },

    _SAT: function (poly1, poly2) {
        var i = 0,
            points1 = poly1.points, points2 = poly2.points,
            l = points1.length/2,
            j, k = points2.length/2,
            nx=0, ny=0,
            length,
            min1, min2,
            max1, max2,
            interval,
            MTV = -Infinity,
            MNx = null,
            MNy = null,
            dot,
            np;

        //loop through the edges of Polygon 1
        for (; i < l; i++) {
            np = (i === l - 1 ? 0 : i + 1);

            //generate the normal for the current edge
            nx = -(points1[2*i+1] - points1[2*np+1]);
            ny = (points1[2*i] - points1[2*np]);

            //normalize the vector
            length = Math.sqrt(nx * nx + ny * ny);
            nx /= length;
            ny /= length;

            //default min max
            min1 = min2 = Infinity;
            max1 = max2 = -Infinity;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[2*j] * nx + points1[2*j+1] * ny;
                if (dot > max1) max1 = dot;
                if (dot < min1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[2*j] * nx + points2[2*j+1] * ny;
                if (dot > max2) max2 = dot;
                if (dot < min2 ) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
                interval = min2 - max1;
                nx = -nx;
                ny = -ny;
            } else {
                interval = min1 - max2;
            }

            //exit early if positive
            if (interval >= 0) {
                return false;
            }

            if (interval > MTV) {
                MTV = interval;
                MNx = nx;
                MNy = ny;
            }
        }

        //loop through the edges of Polygon 2
        for (i = 0; i < k; i++) {
            np = (i === k - 1 ? 0 : i + 1);

            //generate the normal for the current edge
            nx = -(points2[2*i+1] - points2[2*np+1]);
            ny = (points2[2*i] - points2[2*np]);

            //normalize the vector
            length = Math.sqrt(nx * nx + ny * ny);
            nx /= length;
            ny /= length;

            //default min max
            min1 = min2 = Infinity;
            max1 = max2 = -Infinity;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[2*j] * nx + points1[2*j+1] * ny;
                if (dot > max1) max1 = dot;
                if (dot < min1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[2*j] * nx + points2[2*j+1] * ny;
                if (dot > max2) max2 = dot;
                if (dot < min2) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
                interval = min2 - max1;
                nx = -nx;
                ny = -ny;
            } else {
                interval = min1 - max2;
            }

            //exit early if positive
            if (interval >= 0) {
                return false;
            }

            if (interval > MTV) {
                MTV = interval;
                MNx = nx;
                MNy = ny;
            }
        }

        return {
            overlap: MTV,
            nx: MNx,
            ny: MNy
        };
    }
});
