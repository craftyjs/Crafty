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

Crafty.math.Vector2D = (function() {
	/**
	 * Vector2D
	 *
	 * @class This is a general purpose 2D vector class
	 *
	 * Vector2D uses the following form:
	 * <x, y>
	 *
	 * @param {Vector2D|Number=0} x
	 * @param {Number=0} y
	 *
	 * @example new Vector2D();
	 * @example new Vector2D(Vector2D);
	 * @example new Vector2D(Number, Number);
	 */
	function Vector2D(x, y) {
		if (x instanceof Vector2D) {
			this.x = x.x;
			this.y = x.y;
		} else if (arguments.length === 2) {
			this.x = x;
			this.y = y;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Vector2D()";
	} // class Vector2D

	Vector2D.prototype.x = 0;
	Vector2D.prototype.y = 0;

	/**
	 * .add( )
	 *
	 * Adds the passed vector to this vector
	 *
	 * @param {vector2D} vecRH
	 * @returns {Vector2D} this after adding
	 *
	 * @example add(Vector2D);
	 */
	Vector2D.prototype.add = function(vecRH) {
		this.x += vecRH.x;
		this.y += vecRH.y;
		return this;
	} // add( )

	/**
	 * .angleBetween( )
	 *
	 * Calculates the angle between the passed vector and this vector, using <0,0> as the point of reference.
	 * Angles returned have the range (−π, π].
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Number} the angle between the two vectors in radians
	 *
	 * @example angleBetween(Vector2D);
	 */
	Vector2D.prototype.angleBetween = function(vecRH) {
		return Math.atan2(this.x * vecRH.y - this.y * vecRH.x, this.x * vecRH.x + this.y * vecRH.y);
	} // angleBetween( )

	/**
	 * .angleTo( )
	 *
	 * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Number} the angle to the passed vector in radians
	 *
	 * @example angleTo(Vector2D);
	 */
	Vector2D.prototype.angleTo = function(vecRH) {
		return Math.atan2(vecRH.y - this.y, vecRH.x - this.x);
	};

	/**
	 * .clone( )
	 *
	 * Creates and exact, numeric copy of this vector
	 *
	 * @returns {Vector2D} the new vector
	 *
	 * @example clone();
	 */
	Vector2D.prototype.clone = function() {
		return new Vector2D(this);
	} // clone( )

	/**
	 * .distance( )
	 *
	 * Calculates the distance from this vector to the passed vector.
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Number} the distance between the two vectors
	 *
	 * @example distance(Vector2D);
	 */
	Vector2D.prototype.distance = function(vecRH) {
		return Math.sqrt((vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y));
	} // distance( )

	/**
	 * .distanceSq( )
	 *
	 * Calculates the squared distance from this vector to the passed vector.
	 * This function avoids calculating the square root, thus being slightly faster than .distance( ).
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Number} the squared distance between the two vectors
	 * @see Vector2D.distance( )
	 *
	 * @example distanceSq(Vector2D);
	 */
	Vector2D.prototype.distanceSq = function(vecRH) {
		return (vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y);
	} // distanceSq( )

	/**
	 * .divide( )
	 *
	 * Divides this vector by the passed vector.
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Vector2D} this vector after dividing
	 *
	 * @example divide(Vector2D);
	 */
	Vector2D.prototype.divide = function(vecRH) {
		this.x /= vecRH.x;
		this.y /= vecRH.y;
		return this;
	} // divide( )

	/**
	 * .dotProduct( )
	 *
	 * Calculates the dot product of this and the passed vectors
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Number} the resultant dot product
	 *
	 * @example dotProduct(Vector2D);
	 */
	Vector2D.prototype.dotProduct = function(vecRH) {
		return this.x * vecRH.x + this.y * vecRH.y;
	} // dotProduct( )

	/**
	 * .equals( )
	 *
	 * Determines if this vector is numerically equivalent to the passed vector.
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Boolean} true if the vectors are equivalent
	 *
	 * @example .equals(Vector2D);
	 */
	Vector2D.prototype.equals = function(vecRH) {
		return vecRH instanceof Vector2D &&
			this.x == vecRH.x && this.y == vecRH.y;
	} // equals( )

	/**
	 * .getNormal( )
	 *
	 * Calculates a new right-handed normal vector for the line created by this and the passed vectors.
	 *
	 * @param {Vector2D=<0,0>} [vecRH]
	 * @returns {Vector2D} the new normal vector
	 *
	 * @example getNormal([Vector2D]);
	 */
	Vector2D.prototype.getNormal = function(vecRH) {
		if (vecRH === undefined)
			return new Vector2D(-this.y, this.x); // assume vecRH is <0, 0>
		return new Vector2D(vecRH.y - this.y, this.x - vecRH.x).normalize();
	} // getNormal( )

	/**
	 * .isZero( )
	 *
	 * Determines if this vector is equal to <0,0>
	 *
	 * @returns {Boolean} true if this vector is equal to <0,0>
	 *
	 * @example isZero();
	 */
	Vector2D.prototype.isZero = function() {
		return this.x === 0 && this.y ===0;
	} // isZero( )

	/**
	 * .magnitude( )
	 *
	 * Calculates the magnitude of this vector.
	 * Note: Function objects in JavaScript already have a 'length' member, hence the use of magnitude instead.
	 *
	 * @returns {Number} the magnitude of this vector
	 *
	 * @example magnitude();
	 */
	Vector2D.prototype.magnitude = function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	} // magnitude( )

	/**
	 * .magnitudeSq( )
	 *
	 * Calculates the square of the magnitude of this vector.
	 * This function avoids calculating the square root, thus being slightly faster than .magnitude( ).
	 *
	 * @returns {Number} the square of the magnitude of this vector
	 * @see Vector2D.magnitude( )
	 *
	 * @example magnitudeSq();
	 */
	Vector2D.prototype.magnitudeSq = function() {
		return this.x * this.x + this.y * this.y;
	} // magnitudeSq( )

	/**
	 * .multiply( )
	 *
	 * Multiplies this vector by the passed vector
	 *
	 * @param {Vector2D} vecRH
	 * @returns {Vector2D} this vector after multiplying
	 *
	 * @example multiply(Vector2D);
	 */
	Vector2D.prototype.multiply = function(vecRH) {
		this.x *= vecRH.x;
		this.y *= vecRH.y;
		return this;
	} // multiply( )

	/**
	 * .negate( )
	 *
	 * Negates this vector (ie. <-x,-y>)
	 *
	 * @returns {Vector2D} this vector after negation
	 *
	 * @example negate();
	 */
	Vector2D.prototype.negate = function() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	} // negate( )

	/**
	 * .normalize( )
	 *
	 * Normalizes this vector (scales the vector so that its new magnitude is 1)
	 * For vectors where magnitude is 0, <1,0> is returned.
	 *
	 * @returns {Vector2D} this vector after normalization
	 *
	 * @example normalize();
	 */
// Vector2D normalize();
	Vector2D.prototype.normalize = function() {
		var lng = Math.sqrt(this.x * this.x + this.y * this.y);

		if (lng === 0) {
			// default due East
			this.x = 1;
			this.y = 0;
		} else {
			this.x /= lng;
			this.y /= lng;
		} // else

		return this;
	} // normalize( )

	/**
	 * .scale( )
	 *
	 * Scales this vector by the passed amount(s)
	 * If scalarY is omitted, scalarX is used for both axes
	 *
	 * @param {Number} scalarX
	 * @param {Number} [scalarY]
	 * @returns {Vector2D} this after scaling
	 *
	 * @example scale(Number[, Number])
	 */
	Vector2D.prototype.scale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.x *= scalarX;
		this.y *= scalarY;

		return this;
	} // scale( )

	/**
	 * .scaleToMagnitude( )
	 *
	 * Scales this vector such that its new magnitude is equal to the passed value.
	 *
	 * @param {Number} mag
	 * @returns {Vector2D} this vector after scaling
	 *
	 * @example scaleToMagnitude(Number);
	 */
	Vector2D.prototype.scaleToMagnitude = function(mag) {
		var k = mag / this.magnitude();
		this.x *= k;
		this.y *= k;
		return this;
	} // scaleToMagnitude( )

	/**
	 * .setValues( )
	 *
	 * Sets the values of this vector using a passed vector or pair of numbers.
	 *
	 * @param {Number|Vector2D} x
	 * @param {Number} y
	 * @returns {Vector2D} this vector after setting of values
	 *
	 * @example setValues(Vector2D);
	 * @example setValues(Number, Number);
	 */
	Vector2D.prototype.setValues = function(x, y) {
		if (x instanceof Vector2D) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		} // else

		return this;
	} // setValues( )

	/**
	 * .subtract( )
	 *
	 * Subtracts the passed vector from this vector.
	 *
	 * @param {Vector2D} vecRH
	 * @returns {vector2D} this vector after subtracting
	 *
	 * @example subtract(Vector2D);
	 */
	Vector2D.prototype.subtract = function(vecRH) {
		this.x -= vecRH.x;
		this.y -= vecRH.y;
		return this;
	} // subtract( )

	/**
	 * .toString( )
	 *
	 * Returns a string representation of this vector.
	 *
	 * @returns {String}
	 *
	 * @example toString();
	 */
	Vector2D.prototype.toString = function() {
		return "Vector2D(" + this.x + ", " + this.y + ")";
	} // toString( )

	/**
	 * .translate( )
	 *
	 * Translates (moves) this vector by the passed amounts.
	 * If dy is omitted, dx is used for both axes.
	 *
	 * @param {Number} dx
	 * @param {Number} [dy]
	 * @returns {Vector2D} this vector after translating
	 *
	 * @example translate(Number[, Number]);
	 */
	Vector2D.prototype.translate = function(dx, dy) {
		if (dy === undefined)
			dy = dx;

		this.x += dx;
		this.y += dy;

		return this;
	} // translate( )

	/**
	 * .tripleProduct( )
	 *
	 * Calculates the triple product of three vectors.
	 * triple vector product = b(a•c) - a(b•c)
	 *
	 * @static
	 * @param {Vector2D} a
	 * @param {Vector2D} b
	 * @param {Vector2D} c
	 * @return {Vector2D} the triple product as a new vector
	 *
	 * @example tripleProduct(Vector2D, Vector2D, Vector2D);
	 */
	Vector2D.tripleProduct = function(a, b, c) {
		var ac = a.dotProduct(c);
		var bc = b.dotProduct(c);
		return new Crafty.math.Vector2D(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
	};

	return Vector2D;
})();

Crafty.math.Matrix2D = (function() {
	/**
	 * Matrix2D
	 *
	 * @class This is a 2D Matrix2D class. It is 3x3 to allow for affine transformations in 2D space.
	 * The third row is always assumed to be [0, 0, 1].
	 *
	 * Matrix2D uses the following form, as per the whatwg.org specifications for canvas.transform():
	 * [a, c, e]
	 * [b, d, f]
	 * [0, 0, 1]
	 *
	 * @param {Matrix2D|Number=1} a
	 * @param {Number=0} b
	 * @param {Number=0} c
	 * @param {Number=1} d
	 * @param {Number=0} e
	 * @param {Number=0} f
	 *
	 * @example new Matrix2D();
	 * @example new Matrix2D(Matrix2D);
	 * @example new Matrix2D(Number, Number, Number, Number, Number, Number);
	 */
	Matrix2D = function(a, b, c, d, e, f) {
		if (a instanceof Matrix2D) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else if (arguments.length === 6) {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Matrix2D()";
	} // class Matrix2D

	Matrix2D.prototype.a = 1;
	Matrix2D.prototype.b = 0;
	Matrix2D.prototype.c = 0;
	Matrix2D.prototype.d = 1;
	Matrix2D.prototype.e = 0;
	Matrix2D.prototype.f = 0;

	/**
	 * .apply( )
	 *
	 * Applies the matrix transformations to the passed object
	 *
	 * @param {Object{x,y}} xy - any object containing x and y members, to be transformed
	 * @returns {Object{x,y}} the passed xy object after transforming
	 *
	 * @example apply(Object{x,y});
	 */
	Matrix2D.prototype.apply = function(xy) {
		// I'm not sure of the best way for this function to be implemented. Ideally
		// support for other objects (rectangles, polygons, etc) should be easily
		// addable in the future. Maybe a function (apply) is not the best way to do
		// this...?

		var tmpX = xy.x;
		xy.x = tmpX * this.a + xy.y * this.c + this.e;
		xy.y = tmpX * this.b + xy.y * this.d + this.f;
		// no need to homogenize since the third row is always [0, 0, 1]

		return xy;
	} // apply( )

	/**
	 * .clone( )
	 *
	 * Creates an exact, numeric copy of the current matrix
	 *
	 * @returns {Matrix2D}
	 *
	 * @example clone();
	 */
	Matrix2D.prototype.clone = function() {
		return new Matrix2D(this);
	} // clone( )

	/**
	 * .combine( )
	 *
	 * Multiplies this matrix with another, overriding the values of this matrix.
	 * The passed matrix is assumed to be on the right-hand side.
	 *
	 * @param {Matrix2D} mtrxRH
	 * @returns {Matrix2D} this matrix after combination
	 *
	 * @example combine(Matrix2D);
	 */
	Matrix2D.prototype.combine = function(mtrxRH) {
		var tmp = this.a;
		this.a = tmp * mtrxRH.a + this.b * mtrxRH.c;
		this.b = tmp * mtrxRH.b + this.b * mtrxRH.d;
		tmp = this.c;
		this.c = tmp * mtrxRH.a + this.d * mtrxRH.c;
		this.d = tmp * mtrxRH.b + this.d * mtrxRH.d;
		tmp = this.e;
		this.e = tmp * mtrxRH.a + this.f * mtrxRH.c + mtrxRH.e;
		this.f = tmp * mtrxRH.b + this.f * mtrxRH.d + mtrxRH.f;
		return this;
	} // combine( )

	/**
	 * .equals( )
	 *
	 * Checks for the numeric equality of this matrix versus another.
	 *
	 * @param {Matrix2D} mtrxRH
	 * @returns {Boolean} true if the two matrices are numerically equal
	 *
	 * @example equals(Matrix2D);
	 */
	// Boolean equals(Matrix2D);
	Matrix2D.prototype.equals = function(mtrxRH) {
		return mtrxRH instanceof Matrix2D &&
			this.a == mtrxRH.a && this.b == mtrxRH.b && this.c == mtrxRH.c &&
			this.d == mtrxRH.d && this.e == mtrxRH.e && this.f == mtrxRH.f;
	} // equals( )

	/**
	 * .determinant( )
	 *
	 * Calculates the determinant of this matrix
	 *
	 * @returns {Number} det(this matrix)
	 *
	 * @example determinant();
	 */
	Matrix2D.prototype.determinant = function() {
		return this.a * this.d - this.b * this.c;
	} // determinant( )

	/**
	 * .invert( )
	 *
	 * Inverts this matrix if possible
	 *
	 * @returns {Matrix2D} this inverted matrix or the original matrix on failure
	 * @see Matrix2D.isInvertible( )
	 *
	 * @example .invert();
	 */
	Matrix2D.prototype.invert = function() {
		var det = this.determinant();

		// matrix is invertible if its determinant is non-zero
		if (det !== 0) {
			var old = {
				a: this.a,
				b: this.b,
				c: this.c,
				d: this.d,
				e: this.e,
				f: this.f
			};
			this.a = old.d / det;
			this.b = -old.b / det;
			this.c = -old.c / det;
			this.d = old.a / det;
			this.e = (old.c * old.f - old.e * old.d) / det;
			this.f = (old.e * old.b - old.a * old.f) / det;
		} // if

		return this;
	} // invert( )

	/**
	 * .isIdentity( )
	 *
	 * Returns true if this matrix is the identity matrix
	 *
	 * @returns {Boolean}
	 *
	 * @example isIdentity();
	 */
	Matrix2D.prototype.isIdentity = function() {
		return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
	} // isIdentity( )

	/**
	 * .isInvertible( )
	 *
	 * Determines is this matrix is invertible.
	 *
	 * @returns {Boolean} true if this matrix is invertible
	 * @see Matrix2D.invert( )
	 *
	 * @example isInvertible();
	 */
	Matrix2D.prototype.isInvertible = function() {
		return this.determinant() !== 0;
	} // isInvertible( )

	/**
	 * .preRotate( )
	 *
	 * Applies a counter-clockwise pre-rotation to this matrix
	 *
	 * @param {number} rads - angle to rotate in radians
	 * @returns {Matrix2D} this matrix after pre-rotation
	 *
	 * @example preRotate(Number);
	 */
	Matrix2D.prototype.preRotate = function(rads) {
		var nCos = Math.cos(rads);
		var nSin = Math.sin(rads);

		var tmp = this.a;
		this.a = nCos * tmp - nSin * this.b;
		this.b = nSin * tmp + nCos * this.b;
		tmp = this.c;
		this.c = nCos * tmp - nSin * this.d;
		this.d = nSin * tmp + nCos * this.d;

		return this;
	} // preRotate( )

	/**
	 * .preScale( )
	 *
	 * Applies a pre-scaling to this matrix
	 *
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix2D} this after pre-scaling
	 *
	 * @example preScale(Number[, Number]);
	 */
	Matrix2D.prototype.preScale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;

		return this;
	} // preScale( )

	/**
	 * .preTranslate( )
	 *
	 * Applies a pre-translation to this matrix
	 *
	 * @param {Number|Vector2D} dx
	 * @param {Number} dy
	 * @returns {Matrix2D} this matrix after pre-translation
	 *
	 * @example preTranslate(Vector2D);
	 * @example preTranslate(Number, Number);
	 */
	Matrix2D.prototype.preTranslate = function(dx, dy) {
		if (dx instanceof Number) {
			this.e += dx;
			this.f += dy;
		} else {
			this.e += dx.x;
			this.f += dx.y;
		} // else

		return this;
	} // preTranslate( )

	/**
	 * .rotate( )
	 *
	 * Applies a counter-clockwise post-rotation to this matrix
	 *
	 * @param {Number} rads - angle to rotate in radians
	 * @returns {Matrix2D} this matrix after rotation
	 *
	 * @example rotate(Number);
	 */
	Matrix2D.prototype.rotate = function(rads) {
		var nCos = Math.cos(rads);
		var nSin = Math.sin(rads);

		var tmp = this.a;
		this.a = nCos * tmp - nSin * this.b;
		this.b = nSin * tmp + nCos * this.b;
		tmp = this.c;
		this.c = nCos * tmp - nSin * this.d;
		this.d = nSin * tmp + nCos * this.d;
		tmp = this.e;
		this.e = nCos * tmp - nSin * this.f;
		this.f = nSin * tmp + nCos * this.f;

		return this;
	} // rotate( )

	/**
	 * .scale( )
	 *
	 * Applies a post-scaling to this matrix
	 *
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix2D} this after post-scaling
	 *
	 * @example scale(Number[, Number]);
	 */
	Matrix2D.prototype.scale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;
		this.e *= scalarX;
		this.f *= scalarY;

		return this;
	} // scale( )

	/**
	 * .setValues( )
	 *
	 * Sets the values of this matrix
	 *
	 * @param {Matrix2D|Number} a
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} e
	 * @param {Number} f
	 * @returns {Matrix2D} this matrix containing the new values
	 *
	 * @example setValues(Matrix2D);
	 * @example setValues(Number, Number, Number, Number, Number, Number);
	 */
	Matrix2D.prototype.setValues = function(a, b, c, d, e, f) {
		if (a instanceof Matrix2D) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} // else

		return this;
	} // setValues( )

	/**
	 * .toString( )
	 *
	 * Returns the string representation of this matrix.
	 *
	 * @returns {String}
	 *
	 * @example toString();
	 */
	Matrix2D.prototype.toString = function() {
		return "Matrix2D([" + this.a + ", " + this.c + ", " + this.e +
			"] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
	} // toString( )

	/**
	 * .translate( )
	 *
	 * Applies a post-translation to this matrix
	 *
	 * @param {Number|Vector2D} dx
	 * @param {Number} dy
	 * @returns {Matrix2D} this matrix after post-translation
	 *
	 * @example translate(Vector2D);
	 * @example translate(Number, Number);
	 */
	Matrix2D.prototype.translate = function(dx, dy) {
		if (dx instanceof Number) {
			this.e += this.a * dx + this.c * dy;
			this.f += this.b * dx + this.d * dy;
		} else {
			this.e += this.a * dx.x + this.c * dx.y;
			this.f += this.b * dx.x + this.d * dx.y;
		} // else

		return this;
	} // translate( )

	return Matrix2D;
})();
