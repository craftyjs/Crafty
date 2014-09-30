var Crafty = require('./core.js'),
    document = window.document;

/**@
 * #Storage
 * @category Utilities
 * Very simple way to get and set values, which will persist when the browser is closed also. Storage wraps around HTML5 Web Storage, which is well-supported across browsers and platforms, but limited to 5MB total storage per domain.
 */
/**@
 * #.storage
 * @comp Storage
 * @sign .storage(String key)
 * @param key - a key you would like to get from the storage. It will return null if the key does not exists.
 * @sign .storage(String key, String value)
 * @param key - the key you would like to save the data under.
 * @param value - the value you would like to save.
 * @sign .storage(String key, [Object value, Array value, Boolean value])
 * @param key - the key you would like to save the data under.
 * @param value - the value you would like to save, can be an Object or an Array.
 *
 * Storage function is very simple and can be used to either get or set values. 
 * You can store both booleans, strings, objects and arrays.
 *
 * Please note: You should not store data, while the game is playing, as it can cause the game to slow down. You should load data when you start the game, or when the user for an example click a "Save gameprocess" button.
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
Crafty.storage = function(key, value){
  var storage = window.localStorage,
      _value = value;

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
    } else if (typeof value === "string") {
      _value = Crafty.storage.helperJsonNumericCheck(value);  
    }   

    storage.setItem(key, _value);
    
  }

};

/**@
 * 
 * @param {type} string
 * @returns {String}#.storage.helperJsonNumericCheck
 * @comp Storage
 * @sign .storage.helperJsonNumericCheck(String string|JSON)
 * @param string - a String of JSON or JSON object
 *
 * When inserting a given location in the storage times the numbers may come as a string for convenience and is best saved them as numbers.
 * 
 * @example
 * Saving string JSON object string with numbers
 * ~~~
 * Crafty.storage("json", '{"a":"4","b":"8.4", "c": { "ca" : "4", "cb" : "8.4", "cc" : { "a" : "4", "b" : "8.4" } }}');
 * ~~~
 *
 */
Crafty.storage.helperJsonNumericCheck = function(string) {
  
  var value;
  
  try {
    value = JSON.parse(string);
  } catch (e) {
    value = string;
  }
  
  if (typeof value === "object") {
  
    for (var v in value) {

      if (typeof value[v] === "string") {
        if (!isNaN(parseFloat(value[v]))) {
          value[v] = parseFloat(value[v]);    
        }     
      } else if (typeof value[v] === "object") {
        Crafty.storage.helperJsonNumericCheck(value[v]);
      }

    }
    
  }
  
  return JSON.stringify(value);
  
};

/**@
 * #.storage.remove
 * @comp Storage
 * @sign .storage.remove(String key)
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
Crafty.storage.remove = function(key){
  window.localStorage.removeItem(key);
};
