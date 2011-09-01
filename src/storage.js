/**@
 * #Storage
 * @category Utilities
 * Utility to allow data to be saved to a permanent storage solution: IndexedDB, WebSQL, localstorage or cookies
 */
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
	 
	/**@
	 * SaveData event
	 * @param data - An object containing all of the data to be serialized
	 * Any data a component wants to save should be added to this object.
	 * Straight attribute should be set in data.attr.
	 * Anything that requires a special handler should be set in a unique property.
	 * 
	 * @example
	 * Saves the innerHTML of an entity
	 * ---------
	 * Crafty.e("2D DOM").bind("SaveData", function (data) {
	 * 		data.attr.x = this.x;
	 *		data.attr.y = this.y;
	 *		data.dom = this.element.innerHTML;
	 * });
	 */
	 
	/**@
	 * LoadData event
	 * @param data - An object containing all the data that been saved
	 * Handlers for processing any data that needs more than straight assignment
	 *
	 * Note that data stord in the .attr object is automatically added to the entity. 
	 * It does not need to be handled here
	 *
	 * @example
	 * ---------
	 * Sets the innerHTML from a saved entity
	 * Crafty.e("2D DOM").bind("LoadData", function (data) {
	 * 		this.element.innerHTML = data.dom;
	 * });
	 */
 
Crafty.storage = (function () {
	var db = null, external = '', gameName;
	
	function process(obj) {
		if (obj.c) {
			var d = Crafty.e(obj.c)
						.attr(obj.attr)
						.trigger('LoadData', obj);
			return d;
		}
		else if (typeof obj == 'object') {
			for (var prop in obj) {
				obj[prop] = process(obj[prop]);
			}
		}
		return obj;
	}
	
	function unserialize(str) {
		var data = (JSON?JSON.parse(str):eval('('+str+')'));
		return process(data);
	}
	
	/* recursive function
	 * searches for entities in an object and processes them for serialization
	 */ 
	function prep(obj) {
		if (obj.__c) {
			// object is entity
			var data = {c: [], attr: {}};
			obj.trigger("SaveData", data);
			for (var i in obj.__c) {
				data.c.push(i);
			}
			data.c = data.c.join(', ');
			obj = data;
		}
		else if (typeof obj == 'object') {
			// recurse and look for entities
			for (var prop in obj) {
				obj[prop] = prep(obj[prop]);
			}
		}
		return obj;
	}
	
	function serialize(e) {
		if (JSON) {
			var data = prep(e);
			return JSON.stringify(data);
		}
		else {
			alert("Crafty does not support saving on your browser. Please upgrade to a newer browser.");
			return false;
		}
	}
	
	if (0) {
	}
	else {
		// default fallback to cookies
		return {
			open: function (gameName_n) {
				gameName = gameName_n;
			},
			
			save: function (key, type, data) {
				// cookies are very limited in space. we can only keep saves there
				if (type != 'save') return;
				var str = serialize(data);
				document.cookie = gameName+'_'+key+'='+str+'; expires=Thur, 31 Dec 2099 23:59:59 UTC; path=/';
			},
			
			load: function (key, type) {
				if (type != 'save') return;
				var reg = new RegExp(gameName+'_'+key+'=[^;]*'),
					result = reg.exec(document.cookie);
					data = unserialize(result[0].replace(gameName+'_'+key+'=', ''));
					
				return data;
			},
		};
	}
	/* template
	return {
		open: function (gameName) {
		},
		save: function (key, type, data) {
		},
		load: function (key, type) {
		},
	}*/
})();