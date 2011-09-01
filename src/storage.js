/**@
 * #Storage
 * @category Utilities
 * Utility to allow data to be saved to a permanent storage solution: IndexedDB, WebSQL, localstorage or cookies
 */
 
Crafty.extend({
	storage: {
		db: null,
		/**@
		 * #.open
		 * @sign .open(String gameName)
		 * @param gameName - a machine-readable string to uniquely identify your game
		 * Opens a connection to the database. If the best they have is localstorage or lower, it does nothing
		 *
		 * @example
		 * Open a database
		 * ---------------
		 * Crafty.storage.open('MyGame');
		 */
		open: function (gameName) {
		},
		
		/**@
		 * #.save
		 * @sign .save(String key, String type, Mixed data)
		 * @param key - A unique key for identifying this piece of data
		 * @param type - 'save' or 'cache'
		 * @param data - Some kind of data. 
		 * Saves a piece of data to the database. Can be anything, although entities are preferred. 
		 * For all storage methods but IndexedDB, the data will be serialized as a string
		 * During serialization, an entity's SaveData event will be triggered.
		 * Components should implement a SaveData handler and attach the necessary information to the passed object
		 *
		 * @example
		 * Saves an entity to the database
		 * ----------------
		 * var ent = Crafty.e("2D, DOM")
		 *		 .attr({x: 20, y: 20, w: 100, h:100});
		 * Crafty.storage.open('MyGame');
		 * Crafty.storage.save('MyEntity', 'save', ent);
		 */
		save: function (key, type, data) {
		},
		
		/**@
		 * #.load
		 * @sign .load(String key, String type)
		 * @param key - A unique key to search for
		 * @param type - 'save' or 'cache'
		 * Loads a piece of data from the database. 
		 * Entities will be reconstructed from the serialized string
		 
		 * @example
		 * Loads an entity from the database
		 * ------------------
		 * Crafty.storage.open('MyGame');
		 * var ent = Crafty.storage.load('MyEntity', 'save');
		 */
		load: function (key, type) {
		},
	}
});