var Crafty = require('./core.js'),
    document = window.document,
    DEG_TO_RAD = Math.PI / 180;

/**@
 * #Collision
 * @category 2D
 * @trigger HitOn - Triggered when collisions occur. Will not trigger again until collisions of this type cease, or an event is requested once more (using `resetHitChecks(component)`). - { hitData }
 * @trigger HitOff - Triggered when collision with a specific component type ceases - { componentName }
 *
 * Component to detect collision between any two convex polygons.
 *
 * If collision checks are registered for multiple component and collisions with
 * multiple types occur simultaniously, each collision will cause an individual
 * event to fire.
 *
 * **Note:** All data received from events is only valid for the duration of the event's callback.
 * If you wish to preserve the data, make a copy of it.
 *
 * For a description of collision event data (hitData above), see the documentation for
 * `.hit()`.
 *
 * @see .hit, .checkHits, .onHit
 */
Crafty.c("Collision", {
    /**@
     * #.init
     * @comp Collision
     * Set up collision handling.
     *
     * By default, the collision hitbox will match the dimensions (x, y, w, h) and rotation of the object.
     *
     * **Note:** If the entity this component is applied to does not have its
     * dimensions set the default hit area will not be set properly.
     */
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
     *
     * @trigger NewHitbox - when a new hitbox is assigned - Crafty.polygon
     *
     * @sign public this .collision([Crafty.polygon polygon])
     * @param polygon - Crafty.polygon object that will act as the hit area.
     *
     * @sign public this .collision(Array point1, .., Array pointN)
     * @param point# - Array of [x, y] coordinate pairs to generate a hit area polygon.
     *
     * Constructor that takes a polygon or array of points to use as the hit area,
     * with points being relative to the object's position in its unrotated state.
     *
     * The hit area must be a convex shape and not concave for collision detection to work properly.
     *
     * If no parameter is passed, the x, y, w, h properties of the entity will be used, and the hitbox will be resized when the entity is.
     *
     * If a hitbox is set that is outside of the bounds of the entity itself, there will be a small performance penalty as it is tracked separately.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision").collision(
     *     new Crafty.polygon([50,0], [100,100], [0,100])
     * );
     *
     * Crafty.e("2D, Collision").collision([50,0], [100,100], [0,100]);
     * ~~~
     *
     * @see Crafty.polygon
     */
    collision: function (poly) {
        // Unbind anything bound to "Resize"
        this.unbind("Resize", this._resizeMap);
        this.unbind("Resize", this._checkBounds);



        if (!poly) {
            // If no polygon is specified, then a polygon is created that matches the bounds of the entity
            // It will be adjusted on a "Resize" event
            poly = new Crafty.polygon([0, 0], [this._w, 0], [this._w, this._h], [0, this._h]);
            this.bind("Resize", this._resizeMap);
            this._cbr = null;
        } else {
            // Otherwise, we set the specified hitbox, converting from a list of arguments to a polygon if necessary
            if (arguments.length > 1) {
                //convert args to array to create polygon
                var args = Array.prototype.slice.call(arguments, 0);
                poly = new Crafty.polygon(args);
            }
            // Check to see if the polygon sits outside the entity, and set _cbr appropriately
            // On resize, the new bounds will be checked if necessary
            this._findBounds(poly.points);
        }

        // If the entity is currently rotated, the points in the hitbox must also be rotated
        if (this.rotation) {
            poly.rotate({
                cos: Math.cos(-this.rotation * DEG_TO_RAD),
                sin: Math.sin(-this.rotation * DEG_TO_RAD),
                o: {
                    x: this._origin.x,
                    y: this._origin.y
                }
            });
        }

        // Finally, assign the hitbox, and attach it to the "Collision" entity
        this.map = poly;
        this.attach(this.map);
        this.map.shift(this._x, this._y);
        this.trigger("NewHitbox", poly);
        return this;
    },


    // If the hitbox is set by hand, it might extend beyond the entity.
    // In such a case, we need to track this separately.
    // This function finds a (non-minimal) bounding circle around the hitbox.
    //
    // It uses a pretty naive algorithm to do so, for more complicated options see [wikipedia](http://en.wikipedia.org/wiki/Bounding_sphere).
    _findBounds: function(points) {
        var minX = Infinity, maxX = -Infinity, minY=Infinity, maxY=-Infinity;
        var p;

        // Calculate the MBR of the points by finding the min/max x and y
        for (var i=0; i<points.length; ++i){
            p = points[i];
            if (p[0] < minX)
                minX = p[0];
            if (p[0] > maxX)
                maxX = p[0];
            if (p[1] < minY)
                minY = p[1];
            if (p[1] > maxY)
                maxY = p[1];
        }

        // This describes a circle centered on the MBR of the points, with a diameter equal to its diagonal
        // It will be used to find a rough bounding box round the points, even if they've been rotated
        var cbr = {
                cx: (minX + maxX) / 2,
                cy: (minY + maxY) / 2,
                r: Math.sqrt( (maxX - minX)*(maxX - minX) + (maxY - minY)*(maxY - minY))/2,
        };

        // We need to worry about resizing, but only if resizing could possibly change whether the hitbox is in or out of bounds
        // Thus if the upper-left corner is out of bounds, then there's no need to recheck on resize
        if (minX >= 0 && minY >= 0) {
            this._checkBounds = function() {
                if (this._cbr === null && this._w < maxX || this._h < maxY ){
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
        if (minX >= 0 && minY >= 0 && maxX <= this._w && maxY <= this._h){
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
            points[1][0] += dx;
            points[1][1] += dy;
        } else {
            if (rot) {
                dy = e.amount * Math.cos(rot);
                dx = -e.amount * Math.sin(rot);
            } else {
                dx = 0;
                dy = e.amount;
            }

            // "bottom left" point shifts on change of h
            points[3][0] += dx;
            points[3][1] += dy;
        }

        // "bottom right" point shifts on either change
        points[2][0] += dx;
        points[2][1] += dy;
    },

    /**@
     * #.hit
     * @comp Collision
     * @sign public Boolean/Array hit(String component)
     * @param component - Check collision with entities that have this component
     * applied to them.
     * @return `false` if there is no collision. If a collision is detected,
     * returns an Array of collision data objects (see below).
     *
     * Tests for collisions with entities that have the specified component
     * applied to them.
     * If a collision is detected, data regarding the collision will be present in
     * the array returned by this method.
     * If no collisions occur, this method returns false.
     *
     * Following is a description of a collision data object that this method may
     * return: The returned collision data will be an Array of Objects with the
     * type of collision used, the object collided and if the type used was SAT (a polygon was used as the hitbox) then an amount of overlap.
     * ~~~
     * [{
     *    obj: [entity],
     *    type: ["MBR" or "SAT"],
     *    overlap: [number]
     * }]
     * ~~~
     * **obj:** The entity with which the collision occured.
     * **type:** Collision detection method used. One of:
     * + *MBR:* Standard axis aligned rectangle intersection (`.intersect` in the 2D component).
     * + *SAT:* Collision between any two convex polygons. Used when both colliding entities have the `Collision` component applied to them.
     * **overlap:** If SAT collision was used, this will signify the overlap percentage between the colliding entities.
     *
     * @see 2D
     */
    hit: function (comp) {
        var area = this._cbr || this._mbr || this,
            results = Crafty.map.search(area, false),
            i = 0,
            l = results.length,
            dupes = {},
            id, obj, oarea, key,
            hasMap = ('map' in this && 'containsPoint' in this.map),
            finalresult = [];

        if (!l) {
            return false;
        }

        for (; i < l; ++i) {
            obj = results[i];
            oarea = obj._cbr || obj._mbr || obj; //use the mbr

            if (!obj) continue;
            id = obj[0];

            //check if not added to hash and that actually intersects
            if (!dupes[id] && this[0] !== id && obj.__c[comp] &&
                oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
                oarea._y < area._y + area._h && oarea._h + oarea._y > area._y)
                dupes[id] = obj;
        }

        for (key in dupes) {
            obj = dupes[key];

            if (hasMap && 'map' in obj) {
                var SAT = this._SAT(this.map, obj.map);
                SAT.obj = obj;
                SAT.type = "SAT";
                if (SAT) finalresult.push(SAT);
            } else {
                finalresult.push({
                    obj: obj,
                    type: "MBR"
                });
            }
        }

        if (!finalresult.length) {
            return false;
        }

        return finalresult;
    },

    /**@
     * #.onHit
     * @comp Collision
     * @sign public this .onHit(String component, Function hit[, Function noHit])
     * @param component - Component to check collisions for.
     * @param hit - Callback method to execute upon collision with component. Will be passed the results of the collision check in the same format documented for hit().
     * @param noHit - Callback method executed once as soon as collision stops.
     *
     * Creates an EnterFrame event calling .hit() each frame.  When a collision is detected the callback will be invoked.
     * Note that the `hit` callback will be invoked every frame the collision is active, not just the first time the collision occurs.
     * If you want more fine-grained control consider using `.checkHits` or `.hit`.
     *
     * @see .checkHits
     * @see .hit
     */
    onHit: function (comp, callback, callbackOff) {
        var justHit = false;
        this.bind("EnterFrame", function () {
            var hitdata = this.hit(comp);
            if (hitdata) {
                justHit = true;
                callback.call(this, hitdata);
            } else if (justHit) {
                if (typeof callbackOff == 'function') {
                    callbackOff.call(this);
                }
                justHit = false;
            }
        });
        return this;
    },


    /**@
     * #._createCollisionHandler
     * @comp Collision
     * @sign public void .checkHits(String component, Object collisionData)
     * @param component - The name of the component for which this handler
     * checks for collisions.
     * @param collisionData - Collision data object used to track collisions with
     * the specified component.
     *
     * This is a helper method for creating collisions handlers set up by
     * `.checkHits(...)`. Do not call this directly.
     *
     * @see .checkHits
     */
    _createCollisionHandler: function(component, collisionData) {
      return function() {
        var hitData = this.hit(component);

        if (collisionData.occurring === true) {
          if (hitData !== false) {
            // The collision is still in progress
            return;
          }

          collisionData.occurring = false;
          this.trigger("HitOff", component);
        }
        else if (hitData !== false) {
          collisionData.occurring = true;
          this.trigger("HitOn", hitData);
        }
      };
    },

    /**@
     * #.checkHits
     * @comp Collision
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
     * **Note:** Hit checks are performed upon entering each new frame (using
     * the *EnterFrame* event). It is entirely possible for object to move in
     * said frame after the checks were performed (even if the more is the
     * result of *EnterFrame*, as handlers run in no particular order). In such
     * a case, the hit events will not fire until the next check is performed in
     * the following frame.
     *
     * @example
     * ~~~
     * Crafty.e("2D, Collision")
     *     .checkHits('Solid') // check for collisions with entities that have the Solid component in each frame
     *     .bind("HitOn", function(hitData) {
     *         console.log("Collision with Solid entity occurred for the first time.");
     *     })
     *     .bind("HitOff", function(comp) {
     *         console.log("Collision with Solid entity ended.");
     *     });
     * ~~~
     *
     * @see .hit
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

        this.bind("EnterFrame", collisionData.handler);
      }

      return this;
    },

    /**@
     * #.ignoreHits
     * @comp Collision
     * @sign public this .ignoreHits()
     * @sign public this .ignoreHits(String componentList)
     * @param componentList - A comma seperated list of components to stop checking
     * for collisions with.
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
          this.unbind("EnterFrame", collisionData.handler);
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

        this.unbind("EnterFrame", collisionData.handler);
        delete this._collisionData[component];
      }

      return this;
    },

    /**@
     * #.resetHitChecks
     * @comp Collision
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
     *         console.log("Collision with Solid entity was reported in this frame again!");
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
        var points1 = poly1.points,
            points2 = poly2.points,
            i = 0,
            l = points1.length,
            j, k = points2.length,
            normal = {
                x: 0,
                y: 0
            },
            length,
            min1, min2,
            max1, max2,
            interval,
            MTV = null,
            MTV2 = null,
            MN = null,
            dot,
            nextPoint,
            currentPoint;

        //loop through the edges of Polygon 1
        for (; i < l; i++) {
            nextPoint = points1[(i == l - 1 ? 0 : i + 1)];
            currentPoint = points1[i];

            //generate the normal for the current edge
            normal.x = -(nextPoint[1] - currentPoint[1]);
            normal.y = (nextPoint[0] - currentPoint[0]);

            //normalize the vector
            length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            normal.x /= length;
            normal.y /= length;

            //default min max
            min1 = min2 = Infinity;
            max1 = max2 = -Infinity;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                if (dot > max1) max1 = dot;
                if (dot < min1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                if (dot > max2) max2 = dot;
                if (dot < min2 ) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
                interval = min2 - max1;

                normal.x = -normal.x;
                normal.y = -normal.y;
            } else {
                interval = min1 - max2;
            }

            //exit early if positive
            if (interval >= 0) {
                return false;
            }

            if (MTV === null || interval > MTV) {
                MTV = interval;
                MN = {
                    x: normal.x,
                    y: normal.y
                };
            }
        }

        //loop through the edges of Polygon 2
        for (i = 0; i < k; i++) {
            nextPoint = points2[(i == k - 1 ? 0 : i + 1)];
            currentPoint = points2[i];

            //generate the normal for the current edge
            normal.x = -(nextPoint[1] - currentPoint[1]);
            normal.y = (nextPoint[0] - currentPoint[0]);

            //normalize the vector
            length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            normal.x /= length;
            normal.y /= length;

            //default min max
            min1 = min2 = Infinity;
            max1 = max2 = -Infinity;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                if (dot > max1) max1 = dot;
                if (dot < min1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                if (dot > max2) max2 = dot;
                if (dot < min2) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
                interval = min2 - max1;

                normal.x = -normal.x;
                normal.y = -normal.y;
            } else {
                interval = min1 - max2;
            }

            //exit early if positive
            if (interval >= 0) {
                return false;
            }

            if (MTV === null || interval > MTV) MTV = interval;
            if (interval > MTV2 || MTV2 === null) {
                MTV2 = interval;
                MN = {
                    x: normal.x,
                    y: normal.y
                };
            }
        }

        return {
            overlap: MTV2,
            normal: MN
        };
    }
});
