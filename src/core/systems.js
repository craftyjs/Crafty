var Crafty = require('../core/core.js');


// Dictionary of existing systems
Crafty._systems = {};

/**@
 * #Crafty.s
 * @category Core
 *
 * Registers a system.
 *
 * @trigger SystemLoaded - When the system has initialized itself - obj - system object
 * @trigger SystemDestroyed - Right before the system is destroyed - obj - system object
 *
 * @sign void Crafty.s(String name, Obj template[, Boolean lazy])
 * Register a system
 * @param name - The name of the system
 * @param template - an object whose methods and properties will be copied to the new system
 * @param lazy - a flag that indicates whether the system should be initialized right away or the first time it is referenced
 *
 * @sign System Crafty.s(String name)
 * Access the named system
 * @param name - The system to return
 * @returns The referenced system.  If the system has not been initialized, it will be before it is returned.
 *
 * Objects which handle entities might want to subscribe to the event system without being entities themselves.  
 * When you declare a system with a template object, all the methods and properties of that template are copied to a new object.
 * This new system will automatically have the following event related methods, which function like those of components: `.bind()`, `unbind()`, `trigger()`, `one()`, `uniqueBind()`, `destroy()`.
 * Much like components, you can also provide `init()` and `remove()` methods, as well as an `events` parameter for automatically binding to events.
 *
 * *Note*: The `init()` method is for setting up the internal state of the system -- if you create entities in it that then reference the system, that'll create an infinite loop.
 */
Crafty.s = function(name, obj, lazy) {
	if (obj) {
		if (lazy === false ) {
			Crafty._systems[name] = new Crafty.CraftySystem(name, obj);
			Crafty.trigger("SystemLoaded", name);
		} else {
			Crafty._registerLazySystem(name, obj);
		}
	} else {
		return Crafty._systems[name];
	}
};



Crafty._registerLazySystem = function(name, obj) {
	// This is a bit of magic to only init a system if it's requested at least once.
	// We define a getter for _systems[name] that will first initialize the system, 
	// and then redefine _systems[name] to ` that getter.
	Object.defineProperty(Crafty._systems, name, {
		get: function() {
			Object.defineProperty(Crafty._systems, name, { 
				value: new Crafty.CraftySystem(name, obj),
				writable: true,
				enumerable: true,
				configurable: true
			});
			Crafty.trigger("SystemLoaded", name);
			return Crafty._systems[name];
		},
		configurable: true
	});

};

// Each system has its properties and methods copied onto an object of this type
Crafty.CraftySystem = (function(){
	systemID = 1;
	return function(name, template) {
		this.name = name;
		if (!template) return this;
		this._systemTemplate = template;
		this.extend(template);

		// Add the "low leveL" callback methods
		Crafty._addCallbackMethods(this);

		// Give this object a global ID.  Used for event handlers.
		this[0] = "system" + (systemID++);
		// Run any instantiation code
		if (typeof this.init === "function") {
			this.init(name);
		}
		// If an events object is provided, bind the listed event handlers
		if ("events" in template){
			var auto = template.events;
			for (var eventName in auto){
				var fn = typeof auto[eventName] === "function" ? auto[eventName] : template[auto[eventName]];
				this.bind(eventName, fn);
			}
		}
	};
})();



Crafty.CraftySystem.prototype = {
	extend: function(obj) {
		// Copy properties and methods of obj
		for (var key in obj) {
			if (typeof this[key] === "undefined") {
				this[key] = obj[key];
			}
		}
	},

	// Event methods
	bind: function(event, callback) {
		this._bindCallback(event, callback);
		return this;
	},

	trigger: function(event, data) {
		this._runCallbacks(event, data);
		return this;
	},

	unbind: function(event, callback) {
		this._unbindCallbacks(event, callback);
		return this;
	},

	one: function (event, callback) {
		var self = this;
		var oneHandler = function (data) {
			callback.call(self, data);
			self.unbind(event, oneHandler);
		};
		return self.bind(event, oneHandler);
	},

	uniqueBind: function(event, callback) {
		this.unbind(event, callback);
		return this.bind(event, callback);
	},

	destroy: function() {
		Crafty.trigger("SystemDestroyed", this);
		// Check the template itself
		if (typeof this.remove === "function") {
			this.remove();
		}
		this._unbindAll();
		delete Crafty._systems[this.name];
	}

};