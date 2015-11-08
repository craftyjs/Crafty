
var storage = (typeof window !== "undefined" && window.localStorage) || (new require('node-localstorage').LocalStorage('./localStorage'));

/**@
 * #Storage
 * @category Utilities
 * Very simple way to get and set values, which will persist when the browser is closed also.
 * Storage wraps around HTML5 Web Storage, which is well-supported across browsers and platforms, but limited to 5MB total storage per domain.
 * Storage is also available for node, which is permanently persisted to the `./localStorage` folder - take care of removing entries. Note that multiple Crafty instances use the same storage, so care has to be taken not to overwrite existing entries.
 */
/**@
 * #Crafty.storage
 * @comp Storage
 * @sign Crafty.storage(String key)
 * @param key - a key you would like to get from the storage. 
 * @returns The stored value, or `null` if none saved under that key exists
 *
 * @sign Crafty.storage(String key, String value)
 * @param key - the key you would like to save the data under.
 * @param value - the value you would like to save.
 *
 * @sign Crafty.storage(String key, [Object value, Array value, Boolean value])
 * @param key - the key you would like to save the data under.
 * @param value - the value you would like to save, can be an Object or an Array.
 *
 * `Crafty.storage` is used synchronously to either get or set values. 
 *
 * You can store booleans, strings, objects and arrays.
 *
 * @note Because the underlying method is synchronous, it can cause slowdowns if used frequently during gameplay.
 * You should aim to load or save data at reasonable times such as on level load,
 * or in response to specific user actions.
 *
 * @example
 * Get an already stored value
 * ~~~
 * var playername = Crafty.storage('playername');
 * ~~~
 *
 * @example
 * Save a value
 * ~~~
 * Crafty.storage('playername', 'Hero');
 * ~~~
 *
 * @example
 * Test to see if a value is already there.
 * ~~~
 * var heroname = Crafty.storage('name');
 * if(!heroname){
 *   // Maybe ask the player what their name is here
 *   heroname = 'Guest';
 * }
 * // Do something with heroname
 * ~~~
 */

var store = function(key, value){
  var _value = value;

  if(!storage){
    return false;
  }

  if(arguments.length === 1) {
    try {
      return JSON.parse(storage.getItem(key));
    }
    catch (e) {
      return storage.getItem(key);
    }
  } else {
    if(typeof value === "object") {
      _value = JSON.stringify(value);
    }

    storage.setItem(key, _value);
    
  }

};
/**@
 * #Crafty.storage.remove
 * @comp Storage
 * @sign Crafty.storage.remove(String key)
 * @param key - a key where you will like to delete the value of.
 *
 * Generally you do not need to remove values from localStorage, but if you do
 * store large amount of text, or want to unset something you can do that with
 * this function.
 *
 * @example
 * Get an already stored value
 * ~~~
 * Crafty.storage.remove('playername');
 * ~~~
 *
 */
store.remove = function(key){
  storage.removeItem(key);
};

module.exports = store;
