/**@
* #Crafty.math
* @category 2D
* Static functions.
*/
Crafty.math = {
    /**@
	 * #Crafty.math.abs
	 * @comp Crafty.math
     * @sign public this Crafty.math.abs(Number n)
     * @param n - Some value.
     * @return Absolute value.
	 * Returns the absolute value.
     */
    abs: function(x) {
        return x < 0 ? -x : x;
    },

    /**@
     * #Crafty.math.amountOf
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.amountOf(Number checkValue, Number minValue, Number maxValue)
     * @param checkValue - Value that should checked with minimum and maximum.
     * @param minValue - Minimum value to check.
     * @param maxValue - Maximum value to check.
     * @return Amount of checkValue compared to minValue and maxValue.
	 * Returns the amount of how much a checkValue is more like minValue (=0)
     * or more like maxValue (=1)
     */
    amountOf: function(checkValue, minValue, maxValue) {
        if (minValue < maxValue)
            return (checkValue - minValue) / (maxValue - minValue);
        else
            return (checkValue - maxValue) / (minValue - maxValue);
    },


    /**@
     * #Crafty.math.clamp
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.clamp(Number value, Number min, Number max)
     * @param value - A value.
     * @param max - Maximum that value can be.
     * @param min - Minimum that value can be.
     * @return The value between minimum and maximum.
	 * Restricts a value to be within a specified range.
     */
    clamp: function(value, min, max) {
        if (value > max)
            return max;
        else if (value < min)
            return min;
        else
            return value;
    },

    /**@
     * Converts angle from degree to radian.
	 * @comp Crafty.math
     * @param angleInDeg - The angle in degree.
     * @return The angle in radian.
     */
    degToRad: function(angleInDeg) {
        return angleInDeg * Math.PI / 180;
    },

    /**@
     * #Crafty.math.distance
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.distance(Number x1, Number y1, Number x2, Number y2)
     * @param x1 - First x coordinate.
     * @param y1 - First y coordinate.
     * @param x2 - Second x coordinate.
     * @param y2 - Second y coordinate.
     * @return The distance between the two points.
	 * Distance between two points.
     */
    distance: function(x1, y1, x2, y2) {
        var squaredDistance = Crafty.math.squaredDistance(x1, y1, x2, y2);
        return Math.sqrt(parseFloat(squaredDistance));
    },

    /**@
     * #Crafty.math.lerp
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.lerp(Number value1, Number value2, Number amount)
     * @param value1 - One value.
     * @param value2 - Another value.
     * @param amount - Amount of value2 to value1.
     * @return Linear interpolated value.
	 * Linear interpolation. Passing amount with a value of 0 will cause value1 to be returned,
     * a value of 1 will cause value2 to be returned.
     */
    lerp: function(value1, value2, amount) {
        return value1 + (value2 - value1) * amount;
    },

    /**@
     * #Crafty.math.negate
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.negate(Number percent)
     * @param percent - If you pass 1 a -1 will be returned. If you pass 0 a 1 will be returned.
     * @return 1 or -1.
	 * Returnes "randomly" -1.
     */
    negate: function(percent) {
        if (Math.random() < percent)
            return -1;
        else
            return 1;
    },

    /**@
     * #Crafty.math.radToDeg
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.radToDeg(Number angle)
     * @param angleInRad - The angle in radian.
     * @return The angle in degree.
	 * Converts angle from radian to degree.
     */
    radToDeg: function(angleInRad) {
        return angleInRad * 180 / Math.PI;
    },

    /**@
     * #Crafty.math.randomElementOfArray
	 * @comp Crafty.math
	 * @sign public Object Crafty.math.randomElementOfArray(Array array)
     * @param array - A specific array.
     * @return A random element of a specific array.
	 * Returns a random element of a specific array.
     */
    randomElementOfArray: function(array) {
        return array[array.length * Math.random()];
    },

    /**@
     * #Crafty.math.randomInt
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.randomInt(Number start, Number end)
     * @param start - Smallest int value that can be returned.
     * @param end - Biggest int value that can be returned.
     * @return A random int.
	 * Returns a random int in within a specific range.
     */
    randomInt: function(start, end) {
        return start + Math.floor((1 + end - start) * Math.random());
    },

    /**@
     * #Crafty.math.randomNumber
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.randomInt(Number start, Number end)
     * @param start - Smallest number value that can be returned.
     * @param end - Biggest number value that can be returned.
     * @return A random number.
	 * Returns a random number in within a specific range.
     */
    randomNumber: function(start, end) {
        return start + (end - start) * Math.random();
    },

    /**@
	 * #Crafty.math.squaredDistance
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.squaredDistance(Number x1, Number y1, Number x2, Number y2)
     * @param x1 - First x coordinate.
     * @param y1 - First y coordinate.
     * @param x2 - Second x coordinate.
     * @param y2 - Second y coordinate.
     * @return The squared distance between the two points.
	 * Squared distance between two points.
     */
    squaredDistance: function(x1, y1, x2, y2) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    },

    /**@
     * #Crafty.math.squaredDistance
	 * @comp Crafty.math
	 * @sign public Boolean Crafty.math.withinRange(Number value, Number min, Number max)
     * @param value - The specific value.
     * @param min - Minimum value.
     * @param max - Maximum value.
     * @return Returns true if value is within a specific range.
	 * Check if a value is within a specific range.
     */
    withinRange: function(value, min, max) {
        return (value >= min && value <= max);
    }
};

/**
 * Vector2D
 *
 * A vector class for basic vector calculations.
 * @param x The x value of the vector (default: 0).
 * @param y The y value of the vector (default: 0).
 */
Crafty.math.Vector2D = (function() {
    // place vor private attributes/methodes

    // return constructor
    return function Vector2D(x, y) {
        if (arguments.length === 1)
            y = 0;
        else if (arguments.length === 0)
            x = y = 0;

        this.x = x;
        this.y = y;
    };
})();

/**
 * Public functions.
 */

/**
 * Normalize vector. (Set length to 1.)
 * @return This vector.
 */
Crafty.math.Vector2D.prototype.normalize = function() {
    var l = this.getLength();
    if (l === 0)
        this.x = 1;
    else {
        this.x = this.x / l;
        this.y = this.y / l;
    }
    return this;
};

/**
 * Get vector length.
 * @return Length of Vector.
 */
Crafty.math.Vector2D.prototype.getLength = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * Set vector length.
 * @param length New length of Vector.
 */
Crafty.math.Vector2D.prototype.setLength = function(length) {
    this.normalize().multiply(length);
};

/**
 * Calculate the dot product of this vector and another.
 * @param vector Another vector.
 * @return The dot product.
 */
Crafty.math.Vector2D.prototype.dotProduct = function(vector) {
    return this.x * vector.x + this.y * vector.y;
};

/**
 * Calculate normal of line between this vector and another and
 * returns righthand normal vector (-dy, dx).
 * (Lefthand would be (dy, -dx). dy first because normal is rotated in 90° to vector.)
 * @param vector Another vector. If no vector is passed, a zero-vector will be used.
 * @return Normal vector.
 */
Crafty.math.Vector2D.prototype.getNormal = function(vector) {
    if (arguments.length === 0) vector = new Crafty.math.Vector2D();
    return new Crafty.math.Vector2D(-(this.y - vector.y), this.x - vector.x);	// (-dy, dx) == right or (dy, -dx) == left
};

/**
 * Get angle between this vector and another in rad.
 * Math.acos( a * b / ( |a| * |b| ) );
 * @param vector Another vector.
 * @return The angle between this vector and another in rad.
 */
Crafty.math.Vector2D.prototype.getAngle = function(vector) {
    var tempV = this.to(vector);
    return Math.atan2(tempV.y , tempV.x);
};

/**
 * Checks if x and y are 0.
 * @return A boolean which specifies if this vector is a zero-vector.
 */
Crafty.math.Vector2D.prototype.isZero = function() {
    return this.x === 0 && this.y === 0;
};

/**
 * Negates this vector (-x, -y).
 * @return Returns this vector.
 */
Crafty.math.Vector2D.prototype.negate = function() {
    this.x *= -1;
    this.y *= -1;
    return this;
};

/**
 * Calculates distance between this vector and another.
 * @param vector Another vector.
 * @return Returns distance.
 */
Crafty.math.Vector2D.prototype.distance = function(vector) {
    return Math.sqrt(this.squaredDistance(vector));
};

/**
 * Multiply this vector with a scalar.
 * @param scalar A scalar which will be multiplied to this vector.
 * @return This vector.
 */
Crafty.math.Vector2D.prototype.multiply = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
};

/**
 * Calculates squared distance between this vector and another.
 * @param vector Another vector.
 * @return Returns squared distance.
 */
Crafty.math.Vector2D.prototype.squaredDistance = function(vector) {
    return (this.x - vector.x) * (this.x - vector.x) + (this.y - vector.y) * (this.y - vector.y);
};

/**
 * Subtracts another vector from this vector.
 * @param vector Another vector.
 * @return This vector.
 */
Crafty.math.Vector2D.prototype.subtract = function(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
};

/**
 * Adds another vector to this vector.
 * @param vector Another vector.
 * @return This vector.
 */
Crafty.math.Vector2D.prototype.add = function(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
};

/**
 * Creates a copy of this vector.
 * @return Copy of this vector.
 */
Crafty.math.Vector2D.prototype.getCopy = function() {
    return new Crafty.math.Vector2D(this.x, this.y);
};

/**
 * Creates a new vector wich is the negative vector of this one.
 * @return New vector, which is the negative of this one.
 */
Crafty.math.Vector2D.prototype.getNegative = function() {
    return new Crafty.math.Vector2D(-this.x, -this.y);
};

/**
 * Get new vector from this vector to another.
 * @param vector Another vector.
 * @return New vector which points form this vector to antoher..
 */
Crafty.math.Vector2D.prototype.to = function(vector) {
    return new Crafty.math.Vector2D(vector.x - this.x, vector.y - this.y);
};

/**
 * Set x and y values of this vector
 * @param vector Holds the new x and y values.
 */
Crafty.math.Vector2D.prototype.setValues = function(vector) {
    this.x = vector.x;
    this.y = vector.y;
};

/**
 * Static public functions.
 */

/**
 * Create a triple product.
 * @param a Vecvtor1.
 * @param b Vecvtor2.
 * @param c Vecvtor3.
 * @return Returns the triple product of three vectors as a new vector.
 */
Crafty.math.Vector2D.tripleProduct = function(a, b, c) {
    var v = new Crafty.math.Vector2D();
    var ac = a.dotProduct(c);
    var bc = b.dotProduct(c);
    v.x = b.x * ac - a.x * bc;
    v.y = b.y * ac - a.y * bc;
    return v;
};