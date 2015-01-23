var Crafty = require('../core/core.js'),
    document = window.document;



/**@
 * #Crafty.rectManager
 * @category 2D
 *
 * Collection of methods for handling rectangles
 */
Crafty.extend({
    /** recManager: an object for managing dirty rectangles. */
   rectManager: {
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



       /** Checks whether two rectangles overlap */
       overlap: function (a, b) {
           return (a._x < b._x + b._w && a._y < b._y + b._h && a._x + a._w > b._x && a._y + a._h > b._y);
       },

      /**@
      * #Crafty.rectManager.mergeSet
      * @comp Crafty.rectManager
      * @sign public Object Crafty.rectManager.mergeSet(Object set)
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
              if (this.overlap(set[i], set[i + 1])) {
                  this.merge(set[i], set[i + 1], set[i]);
                  set.splice(i + 1, 1);
                  if (i > 0) {
                    i--;
                  }
              } else {
                  i++;
              }
          }

          return set;
      },

   }


});
