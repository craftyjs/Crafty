Crafty.math = {
    /**
     * Returns the absolute value.
     * @param x Some value.
     * @return param Absolute value.
     */
    abs: function(x) {
        return x < 0 ? -x : x;
    },

    /**
     * Returns the amount of how much a checkValue is more like minValue (=0)
     * or more like maxValue (=1)
     * @param checkValue Value that should checked with minimum and maximum.
     * @param minValue Minimum value to check.
     * @param maxValue Maximum value to check.
     * @return param Amount of checkValue compared to minValue and maxValue.
     */
    amountOf: function(checkValue, minValue, maxValue) {
        if (minValue < maxValue)
            return (checkValue - minValue) / (maxValue - minValue);
        else
            return (checkValue - maxValue) / (minValue - maxValue);
    },


    /**
     * Restricts a value to be within a specified range.
     * @param value A value.
     * @param max Maximum that value can be.
     * @param min Minimum that value can be.
     * @return param The value between minimum and maximum.
     */
    clamp: function(value, min, max) {
        if (value > max)
            return max;
        else if (value < min)
            return min;
        else
            return value;
    },

    /**
     * Converts angle from degree to radian.
     * @param angleInDeg The angle in degree.
     * @return param The angle in radian.
     */
    degToRad: function(angleInDeg) {
        return angleInDeg * Math.PI / 180;
    },

    /**
     * Distance between two points.
     * @param x1 First x coordinate.
     * @param y1 First y coordinate.
     * @param x2 Second x coordinate.
     * @param y2 Second y coordinate.
     * @return param The distance between the two points.
     */
    distance: function(x1, y1, x2, y2) {
        var squaredDistance = Crafty.math.squaredDistance(x1, y1, x2, y2);
        return Math.sqrt(parseFloat(squaredDistance));
    },

    /**
     * Linear interpolation. Passing amount with a value of 0 will cause value1 to be returned,
     * a value of 1 will cause value2 to be returned.
     * @param value1 One value.
     * @param value2 Another value.
     * @param amount Amount of value2 to value1.
     * @return param Linear interpolated value.
     */
    lerp: function(value1, value2, amount) {
        return value1 + (value2 - value1) * amount;
    },

    /**
     * Returnes "randomly" -1.
     * @param percent If you pass 1 a -1 will be returned. If you pass 0 a 1 will be returned.
     * @return param 1 or -1.
     */
    negate: function(percent) {
        if (Math.random() < percent)
            return -1;
        else
            return 1;
    },

    /**
     * Converts angle from radian to degree.
     * @param angleInRad The angle in radian.
     * @return param The angle in degree.
     */
    radToDeg: function(angleInRad) {
        return angleInRad * 180 / Math.PI;
    },

    /**
     * Returns a random element of a specific array.
     * @param array A specific array.
     * @return param A random element of a specific array.
     */
    randomElementOfArray: function(array) {
        return array[array.length * Math.random()];
    },

    /**
     * Returns a random int in within a specific range.
     * @param start Smallest int value that can be returned.
     * @param end Biggest int value that can be returned.
     * @return param A random int.
     */
    randomInt: function(start, end) {
        return start + Math.floor((1 + end - start) * Math.random());
    },

    /**
     * Returns a random number in within a specific range.
     * @param start Smallest number value that can be returned.
     * @param end Biggest number value that can be returned.
     * @return param A random number.
     */
    randomNumber: function(start, end) {
        return start + (end - start) * Math.random();
    },

    /**
     * Squared distance between two points.
     * @param x1 First x coordinate.
     * @param y1 First y coordinate.
     * @param x2 Second x coordinate.
     * @param y2 Second y coordinate.
     * @return param The squared distance between the two points.
     */
    squaredDistance: function(x1, y1, x2, y2) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    },

    /**
     * Check if a value is within a specific range.
     * @param value The specific value.
     * @param min Minimum value.
     * @param max Maximum value.
     * @return param Returns true if value is within a specific range.
     */
    withinRange: function(value, min, max) {
        return (value >= min && value <= max);
    }

};