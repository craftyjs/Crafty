var Crafty = require('../core/core.js');


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

      /**@
       * #Crafty.rectManager.overlap
       * @comp Crafty.rectManager
       * @sign public Boolean Crafty.rectManager.overlap(Object rectA, Object rectA)
       * @param rectA - An object that must have the `_x, _y, _w, _h` values as properties
       * @param rectB - An object that must have the `_x, _y, _w, _h` values as properties
       * @return true if the rectangles overlap; false otherwise
       *
       * Checks whether two rectangles overlap.
       */
      overlap: function (rectA, rectB) {
        return (rectA._x < rectB._x + rectB._w && rectA._x + rectA._w > rectB._x &&
                rectA._y < rectB._y + rectB._h && rectA._y + rectA._h > rectB._y);
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

      /**@
       * #Crafty.rectManager.boundingRect
       * @comp Crafty.rectManager
       * @sign public Crafty.rectManager.boundingRect(set)
       * @param set - An array of rectangles
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

      // Crafty.rectManager._rectPool
      //
      // This is a private object used internally by 2D methods
      // Cascade and _attr need to keep track of an entity's old position,
      // but we want to avoid creating temp objects every time an attribute is set.
      // The solution is to have a pool of objects that can be reused.
      //
      // The current implementation makes a BIG ASSUMPTION:  that if multiple rectangles are requested,
      // the later one is recycled before any preceding ones.  This matches how they are used in the code.
      // Each rect is created by a triggered event, and will be recycled by the time the event is complete.
      _pool: (function () {
          var pool = [],
              pointer = 0;
          return {
              get: function (x, y, w, h) {
                  if (pool.length <= pointer)
                      pool.push({});
                  var r = pool[pointer++];
                  r._x = x;
                  r._y = y;
                  r._w = w;
                  r._h = h;
                  return r;
              },

              copy: function (o) {
                  if (pool.length <= pointer)
                      pool.push({});
                  var r = pool[pointer++];
                  r._x = o._x;
                  r._y = o._y;
                  r._w = o._w;
                  r._h = o._h;
                  return r;
              },

              recycle: function (o) {
                  pointer--;
              }
          };
      })(),

   }


});
