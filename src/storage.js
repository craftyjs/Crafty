/**@
 * #Storage
 * @category Utilities
 * Utility to allow data to be saved to a permanent storage solution: IndexedDB, WebSql, localstorage or cookies
 */
/**@
 * #.open
 * @comp Storage
 * @sign .open(String gameName)
 * @param gameName - a machine readable string to uniquely identify your game
 *
 * Opens a connection to the database. If the best they have is localstorage or lower, it does nothing
 *
 * @example
 * Open a database
 * ~~~
 * Crafty.storage.open('MyGame');
 * ~~~
 */

/**@
 * #.save
 * @comp Storage
 * @sign .save(String key, String type, Mixed data)
 * @param key - A unique key for identifying this piece of data
 * @param type - 'save' or 'cache'
 * @param data - Some kind of data.
 *
 * Saves a piece of data to the database. Can be anything, although entities are preferred.
 * For all storage methods but IndexedDB, the data will be serialized as a string
 * During serialization, an entity's SaveData event will be triggered.
 * Components should implement a SaveData handler and attach the necessary information to the passed object
 *
 * @example
 * Saves an entity to the database
 * ~~~
 * var ent = Crafty.e("2D, DOM")
 *                     .attr({x: 20, y: 20, w: 100, h:100});
 * Crafty.storage.open('MyGame');
 * Crafty.storage.save('MyEntity', 'save', ent);
 * ~~~
 */

/**@
 * #.load
 * @comp Storage
 * @sign .load(String key, String type)
 * @param key - A unique key to search for
 * @param type - 'save' or 'cache'
 * @param callback - Do things with the data you get back
 *
 * Loads a piece of data from the database.
 * Entities will be reconstructed from the serialized string
 * @example
 * Loads an entity from the database
 * ~~~
 * Crafty.storage.open('MyGame');
 * Crafty.storage.load('MyEntity', 'save', function (data) { // do things });
 * ~~~
 */

/**@
 * #.getAllKeys
 * @comp Storage
 * @sign .getAllKeys(String type)
 * @param type - 'save' or 'cache'
 * Gets all the keys for a given type
 * @example
 * Gets all the save games saved
 * ~~~
 * Crafty.storage.open('MyGame');
 * var saves = Crafty.storage.getAllKeys('save');
 * ~~~
 */

/**@
 * #.external
 * @comp Storage
 * @sign .external(String url)
 * @param url - URL to an external to save games too
 *
 * Enables and sets the url for saving games to an external server
 *
 * @example
 * Save an entity to an external server
 * ~~~
 * Crafty.storage.external('http://somewhere.com/server.php');
 * Crafty.storage.open('MyGame');
 * var ent = Crafty.e('2D, DOM')
 *                     .attr({x: 20, y: 20, w: 100, h:100});
 * Crafty.storage.save('save01', 'save', ent);
 * ~~~
 */

/**@
 * #SaveData event
 * @comp Storage
 * @param data - An object containing all of the data to be serialized
 * @param prepare - The function to prepare an entity for serialization
 *
 * Any data a component wants to save when it's serialized should be added to this object.
 * Straight attribute should be set in data.attr.
 * Anything that requires a special handler should be set in a unique property.
 *
 * @example
 * Saves the innerHTML of an entity
 * ~~~
 * Crafty.e("2D DOM").bind("SaveData", function (data, prepare) {
 *     data.attr.x = this.x;
 *     data.attr.y = this.y;
 *     data.dom = this.element.innerHTML;
 * });
 * ~~~
 */

/**@
 * #LoadData event
 * @param data - An object containing all the data that been saved
 * @param process - The function to turn a string into an entity
 *
 * Handlers for processing any data that needs more than straight assignment
 *
 * Note that data stored in the .attr object is automatically added to the entity.
 * It does not need to be handled here
 *
 * @example
 * ~~~
 * Sets the innerHTML from a saved entity
 * Crafty.e("2D DOM").bind("LoadData", function (data, process) {
 *     this.element.innerHTML = data.dom;
 * });
 * ~~~
 */

Crafty.storage = (function() {
   var dbs = null,
      timestamps = {},
      url, gameName, revisions = {}, transactionType = {
         READ: 'readonly',
         READ_WRITE: 'readwrite'
      }, isSaving = false;

   /*
    * Processes a retrieved object.
    * Creates an entity if it is one
    */

   function process(obj) {
      if (obj.c) {
         var d = Crafty.e(obj.c)
            .attr(obj.attr)
            .trigger('LoadData', obj, process);
         return d;
      } else if (typeof obj == 'object') {
         for (var prop in obj) {
            obj[prop] = process(obj[prop]);
         }
      }
      return obj;
   }

   function unserialize(str) {
      if (typeof str != 'string') return str;
      var data = (JSON ? JSON.parse(str) : eval('(' + str + ')'));
      return process(data);
   }

   function serialize(e) {
      if (JSON) {
         var data = prep(e);
         return JSON.stringify(data);
      } else {
         alert("Crafty does not support saving on your browser. Please upgrade to a newer browser.");
         return false;
      }
   }

   /* recursive function
    * searches for entities in an object and processes them for serialization
    */

   function prep(obj) {
      if (obj.__c) {
         // object is entity
         var data = {
            c: [],
            attr: {}
         };
         obj.trigger("SaveData", data, prep);
         for (var i in obj.__c) {
            data.c.push(i);
         }
         data.c = data.c.join(', ');
         obj = data;
      } else if (typeof obj == 'object') {
         // recurse and look for entities
         for (var prop in obj) {
            obj[prop] = prep(obj[prop]);
         }
      }
      return obj;
   }

   /**
    * Get current timestamp
    */

   function ts() {
      var d = new Date();
      return d.getTime();
   }

   function getTimestamps() {
      allDocs("save", function(docs) {
         for (var i = 0; i < docs.length; i++) {
            timestamps[docs[i]["key"]] = docs[i]["timestamp"];
         }
      });
   }

   // for saving a game to a remote server

   function external(setUrl) {
      url = setUrl;
   }


   function saveExternal(key, data, ts) {
      if (1 && typeof url == "undefined") return;

      Pouch.replicate(dbs.save, url, function(err, changes) {});
   }

   function openExternal() {
      // Synchronizes the remote saves on the server with the local saves
      if (1 && typeof url == "undefined") return;

      loadExternal();
   }

   function loadExternal(callback) {
      if (1 && typeof url == "undefined") return;
      Pouch.replicate(url, dbs.save, function(err, changes) {
         if (typeof(callback) === 'function') {
            callback(err, changes);
         }
      });
   }

   // open(gameName)
   // save(key, type, data)
   // load(key, type, callback)

   // check(key, timestamp) return true if this key is a later rev than timstamp

   // The keys are stored are documents in the two PouchDbs


   // Init and load the local PouchDB 'save' and 'cache'

   function createStores() {
      dbs = {
         save: null,
         cache: null
      };

      // Create the save and cache pouches
      Pouch(gameName + '-save', function(err, db) {
         dbs.save = db;
      });

      Pouch(gameName + '-cache', function(err, db) {
         dbs.cache = db;
      });
   }

   var open = function(gameName_n) {
      if (isSaving) {
         setTimeout(open(gameName_n), 1);
      }
      gameName = gameName_n;
      createStores();
      getTimestamps();
      openExternal();
   }

   var save = function(key, type, data) {
      if (dbs === null || dbs[type] === null) {
         setTimeout(function() {
            Crafty.storage.save(key, type, data);
         }, 1);
         return;
      }
      isSaving = true;

      var str = serialize(data),
         t = ts();

      dbs[type].get(key, function(err, doc) {
         var newDoc = {
            _id: key,
            timestamp: t,
            data: str
         };

         // Only update the _rev field if an existing doc exists
         if (doc) {
            newDoc._rev = doc._rev;
         }

         dbs[type].put(newDoc, function(err, response) {

            isSaving = false;
            if (type == 'save') {
               saveExternal(key, str, t);
               timestamps[key] = t;
            }
         });
      });
   }

   var load = function(key, type, callback) {

      // All loading is blocked until the db is initialised and no saving is in progress
      if (dbs === null || dbs[type] === null || isSaving) {
         setTimeout(function() {
            Crafty.storage.load(key, type, callback);
         }, 1);
         return;
      }

      loadExternal(

      function() {
         dbs[type].get(key, function(err, doc) {
            callback(unserialize(doc.data));
         });
      });


   }

   var allDocs = function(type, callback) {
      if (dbs === null || dbs[type] === null) {
         setTimeout(function() {
            allDocs(type, callback);
         }, 1);
         return;
      }

      dbs[type].allDocs({
         include_docs: true
      }, function(err, response) {
         callback(response["rows"]);
      });
   }

   var getAllKeys = function(type, callback) {
      allDocs(type, function(docs) {
         var keys = [];
         for (var i = 0; i < docs.length; i++) {
            keys.push(docs[i]["key"]);
         }
         callback(keys);
      })
   }

   var check = function(key, timestamp) {
      return timestamps[key] > timestamp;
   }

   return {
      open: open,
      save: save,
      load: load,
      getAllKeys: getAllKeys,
      check: check,
      external: external
   };
})();