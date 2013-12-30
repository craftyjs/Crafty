var Crafty = require('./core.js'),
    document = window.document,
    DEG_TO_RAD = Math.PI / 180;

/**@
 * #Collision
 * @category 2D
 * Component to detect collision between any two convex polygons.
 */
Crafty.c("Collision", {
    /**@
     * #.init
     * @comp Collision
     * Create a rectangle polygon based on the x, y, w, h dimensions.
     *
     * By default, the collision hitbox will match the dimensions (x, y, w, h) and rotation of the object.
     */
    init: function () {
        this.requires("2D");
        var area = this._mbr || this;

        this.collision();
    },

    /**@
     * #.collision
     * @comp Collision
     *
     * @trigger NewHitbox - when a new hitbox is assigned - Crafty.polygon
     *
     * @sign public this .collision([Crafty.polygon polygon])
     * @param polygon - Crafty.polygon object that will act as the hit area
     *
     * @sign public this .collision(Array point1, .., Array pointN)
     * @param point# - Array with an `x` and `y` position to generate a polygon
     *
     * Constructor takes a polygon or array of points to use as the hit area.
     *
     * The hit area (polygon) must be a convex shape and not concave
     * for the collision detection to work.
     *
     * Points are relative to the object's position and its unrotated state.
     *
     * If no parameter is passed, the x, y, w, h properties of the entity will be used, and the hitbox will be resized when the entity is.
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
        this.unbind("Resize", this._resizeMap);
        if (!poly) {
            poly = new Crafty.polygon([0, 0], [this._w, 0], [this._w, this._h], [0, this._h]);
            this.bind("Resize", this._resizeMap);
        }

        if (arguments.length > 1) {
            //convert args to array to create polygon
            var args = Array.prototype.slice.call(arguments, 0);
            poly = new Crafty.polygon(args);
        }

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

        this.map = poly;
        this.attach(this.map);
        this.map.shift(this._x, this._y);
        this.trigger("NewHitbox", poly);
        return this;
    },


    // Change the hitbox when a "Resize" event triggers.
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
     * @param component - Check collision with entities that has this component
     * @return `false` if no collision. If a collision is detected, returns an Array of objects that are colliding.
     *
     * Takes an argument for a component to test collision for. If a collision is found, an array of
     * every object in collision along with the amount of overlap is passed.
     *
     * If no collision, will return false. The return collision data will be an Array of Objects with the
     * type of collision used, the object collided and if the type used was SAT (a polygon was used as the hitbox) then an amount of overlap.\
     * ~~~
     * [{
     *    obj: [entity],
     *    type: "MBR" or "SAT",
     *    overlap: [number]
     * }]
     * ~~~
     * `MBR` is your standard axis aligned rectangle intersection (`.intersect` in the 2D component).
     * `SAT` is collision between any convex polygon.
     *
     * @see .onHit, 2D
     */
    hit: function (comp) {
        var area = this._mbr || this,
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
            oarea = obj._mbr || obj; //use the mbr

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
     * @param component - Component to check collisions for
     * @param hit - Callback method to execute upon collision with component.  Will be passed the results of the collision check in the same format documented for hit().
     * @param noHit - Callback method executed once as soon as collision stops
     *
     * Creates an EnterFrame event calling .hit() each frame.  When a collision is detected the callback will be invoked.
     *
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
            min1 = min2 = -1;
            max1 = max2 = -1;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                if (dot > max1 || max1 === -1) max1 = dot;
                if (dot < min1 || min1 === -1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                if (dot > max2 || max2 === -1) max2 = dot;
                if (dot < min2 || min2 === -1) min2 = dot;
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
            min1 = min2 = -1;
            max1 = max2 = -1;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
                dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                if (dot > max1 || max1 === -1) max1 = dot;
                if (dot < min1 || min1 === -1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
                dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                if (dot > max2 || max2 === -1) max2 = dot;
                if (dot < min2 || min2 === -1) min2 = dot;
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
