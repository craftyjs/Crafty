(function(window, undefined) {

/**@
* #Crafty
* @category Core
* Select a set of or single entities by components or an entity's ID.
*
* Crafty uses syntax similar to jQuery by having a selector engine to select entities by their components.
*
* @example
* ~~~
*    Crafty("MyComponent")
*    Crafty("Hello 2D Component")
*    Crafty("Hello, 2D, Component")
* ~~~
* The first selector will return all entities that has the component `MyComponent`. The second will return all entities that has `Hello` and `2D` and `Component` whereas the last will return all entities that has at least one of those components (or).
* ~~~
*   Crafty(1)
* ~~~
* Passing an integer will select the entity with that `ID`.
*
* Finding out the `ID` of an entity can be done by returning the property `0`.
* ~~~
*    var ent = Crafty.e("2D");
*    ent[0]; //ID
* ~~~
*/
var Crafty = function(selector) {
		return new Crafty.fn.init(selector);
	},
	
	GUID = 1, //GUID for entity IDs
	FPS = 50,
	frame = 1,
	
	components = {}, //map of components and their functions
	entities = {}, //map of entities and their data
	handlers = {}, //global event handlers
	onloads = [], //temporary storage of onload handlers
	tick,
	tickID,

	noSetter,
	
	loops = 0, 
	skipTicks = 1000 / FPS,
	nextGameTick = (new Date).getTime(),
	
	slice = Array.prototype.slice,
	rlist = /\s*,\s*/,
	rspace = /\s+/;

/**@
* #Crafty Core
* @category Core
* Set of methods added to every single entity.
*/
Crafty.fn = Crafty.prototype = {

	init: function(selector) {
		//select entities by component
		if(typeof selector === "string") {
			var elem = 0, //index elements
				e, //entity forEach
				current,
				and = false, //flags for multiple
				or = false,
				del,
                comps,
                score,
                i, l;
			
			if(selector === '*') {
				for(e in entities) {
					this[+e] = entities[e];
					elem++;
				}
				this.length = elem;
				return this;
			}
			
			//multiple components OR
			if(selector.indexOf(',') !== -1) {
				or = true;
				del = rlist;
			//deal with multiple components AND
			} else if(selector.indexOf(' ') !== -1) {
				and = true;
				del = rspace;
			}
			
			//loop over entities
			for(e in entities) {
				if(!entities.hasOwnProperty(e)) continue; //skip
				current = entities[e];
				
				if(and || or) { //multiple components
					comps = selector.split(del); 
                    i = 0;
                    l = comps.length;
                    score = 0;
					
					for(;i<l;i++) //loop over components
						if(current.__c[comps[i]]) score++; //if component exists add to score 
					
					//if anded comps and has all OR ored comps and at least 1
					if(and && score === l || or && score > 0) this[elem++] = +e;
					
				} else if(current.__c[selector]) this[elem++] = +e; //convert to int
			}
			
			//extend all common components
			if(elem > 0 && !and && !or) this.extend(components[selector]);
			if(comps && and) for(i=0;i<l;i++) this.extend(components[comps[i]]);
			
			this.length = elem; //length is the last index (already incremented)
			
		} else { //Select a specific entity
			
			if(!selector) { //nothin passed creates God entity
				selector = 0;
				if(!(selector in entities)) entities[selector] = this;
			}
			
			//if not exists, return undefined
			if(!(selector in entities)) {
				this.length = 0;
				return this;
			}
			
			this[0] = selector;
			this.length = 1;
			
			//update from the cache
			if(!this.__c) this.__c = {};
			
			//update to the cache if NULL
			if(!entities[selector]) entities[selector] = this; 
			return entities[selector]; //return the cached selector
		}
		
		return this;
	},
	
	/**@
	* #.addComponent
	* @comp Crafty Core
	* @sign public this .addComponent(String componentList)
	* @param componentList - A string of components to add seperated by a comma `,`
	* @sign public this .addComponent(String Component1[, .., String ComponentN])
	* @param Component# - Component ID to add.
	* Adds a component to the selected entities or entity. 
	*
	* Components are used to extend the functionality of entities. 
	* This means it will copy properties and assign methods to 
	* augment the functionality of the entity.
	* 
	* There are multiple methods of adding components. Passing a 
	* string with a list of component names or passing multiple 
	* arguments with the component names.
	*
	* @example
	* ~~~
	* this.addComponent("2D, Canvas");
	* this.addComponent("2D", "Canvas");
	* ~~~
	*/
	addComponent: function(id) {
		var uninit = [], c = 0, ul, //array of components to init
            i = 0, l, comps;
		
		//add multiple arguments
		if(arguments.length > 1) {
            l = arguments.length;
			for(;i<l;i++) {
				this.__c[arguments[i]] = true;
				uninit.push(arguments[i]);
			}
		//split components if contains comma
		} else if(id.indexOf(',') !== -1) {
			comps = id.split(rlist);
            l = comps.length;
			for(;i<l;i++) {
				this.__c[comps[i]] = true;
				uninit.push(comps[i]);
			}
		//single component passed
		} else {
			this.__c[id] = true;
			uninit.push(id);
		}
		
		//extend the components
		ul = uninit.length;
		for(;c<ul;c++) {
			comp = components[uninit[c]];
			this.extend(comp);
			
			//if constructor, call it
			if(comp && "init" in comp) {
				comp.init.call(this);
			}
		}
		
		this.trigger("NewComponent", ul);
		return this;
	},
	
	/**@
	* #.requires
	* @comp Crafty Core
	* @sign public this .requires(String componentList)
	* @param componentList - List of components that must be added
	* Makes sure the entity has the components listed. If the entity does not
	* have the component, it will add it.
	* @see .addComponent
	*/
	requires: function(list) {
		var comps = list.split(rlist),
			i = 0, l = comps.length,
			comp;
		
		//loop over the list of components and add if needed
		for(;i<l;++i) {
			comp = comps[i];
			if(!this.has(comp)) this.addComponent(comp);
		}

        return this;
	},
	
	/**@
	* #.removeComponent
	* @comp Crafty Core
	* @sign public this .removeComponent(String Component[, soft])
	* @param component - Component to remove
	* @param soft - Whether to soft remove it (defaults to `true`)
	* Removes a component from an entity. A soft remove will only 
	* refrain `.has()` from returning true. Hard will remove all
	* associated properties and methods.
	*/
	removeComponent: function(id, soft) {
		if(soft === false) {
			var props = components[id], prop;
			for(prop in props) {
				delete this[prop];
			}
		}
		delete this.__c[id];
		
		this.trigger("RemoveComponent", id);
		return this;
	},
	
	/**@
	* #.has
	* @comp Crafty Core
	* @sign public Boolean .has(String component)
	* Returns `true` or `false` depending on if the 
	* entity has the given component.
	*
	* For better performance, simply use the `.__c` object 
	* which will be `true` if the entity has the component or 
	* will not exist (or be `false`).
	*/
	has: function(id) {
		return !!this.__c[id];
	},
	
	/**@
	* #.attr
	* @comp Crafty Core
	* @sign public this .attr(String property, * value)
	* @param property - Property of the entity to modify
	* @param value - Value to set the property to
	* @sign public this .attr(Object map)
	* @param map - Object where the key is the property to modify and the value as the property value
	* @triggers Change {key: value}
	* Use this method to set any property of the entity.
	* @example
	* ~~~
	* this.attr({key: "value", prop: 5});
	* this.key; //value
	* this.prop; //5
	*
	* this.attr("key", "newvalue");
	* this.key; //newvalue
	* ~~~
	*/
	attr: function(key, value) {
		if(arguments.length === 1) {
			//if just the key, return the value
			if(typeof key === "string") {
				return this[key];
			}
			
			//extend if object
			this.extend(key);
			this.trigger("Change", key); //trigger change event
			return this;
		}
		//if key value pair
		this[key] = value;

		var change = {};
		change[key] = value;
		this.trigger("Change", change ); //trigger change event
		return this;
	},
	
	/**@
	* #.toArray
	* @comp Crafty Core
	* @sign public this .toArray(void)
	* This method will simply return the found entities as an array.
	*/
	toArray: function() {
		return slice.call(this, 0);
	},
	
	/**@
	* #.delay
	* @comp Crafty Core
	* @sign public this .delay(Function callback, Number delay)
	* @param callback - Method to execute after given amount of milliseconds
	* @param delay - Amount of milliseconds to execute the method
	* The delay method will execute a function after a given amount of time in milliseconds.
	*
	* Essentially a wrapper for `setTimeout`.
	*
	* @example
    * Destroy itself after 100 milliseconds
	* ~~~
	* this.delay(function() {
	     this.destroy();
	* }, 100);
	* ~~~
	*/
	delay: function(fn, duration) {
		this.each(function() {
			var self = this;
			setTimeout(function() {
				fn.call(self);
			}, duration);
		});
        return this;
	},
	
	/**@
	* #.bind
	* @comp Crafty Core
	* @sign public this .bind(String eventName, Function callback)
	* @param eventName - Name of the event to bind to
	* @param callback - Method to execute when the event is triggered
	* Attach the current entity (or entities) to listen for an event.
	*
	* Callback will be invoked when an event with the event name passed 
	* is triggered. Depending on the event, some data may be passed 
	* via an argument to the callback function.
	*
	* The first argument is the event name (can be anything) whilst the 
	* second argument is the callback. If the event has data, the 
	* callback should have an argument.
	*
	* Events are arbitrary and provide communication between components. 
	* You can trigger or bind an event even if it doesn't exist yet.
	* @example
	* ~~~
	* this.attr("triggers", 0); //set a trigger count
	* this.bind("myevent", function() {
	*     this.triggers++; //whenever myevent is triggered, increment
	* });
	* this.bind("EnterFrame", function() {
	*     this.trigger("myevent"); //trigger myevent on every frame
	* });
	* ~~~
	* @see .trigger, .unbind
	*/
	bind: function(event, fn) {
		//optimization for 1 entity
		if(this.length === 1) {
			if(!handlers[event]) handlers[event] = {};
			var h = handlers[event];
			
			if(!h[this[0]]) h[this[0]] = []; //init handler array for entity
			h[this[0]].push(fn); //add current fn
			return this;
		}
		
		this.each(function() {
			//init event collection
			if(!handlers[event]) handlers[event] = {};
			var h = handlers[event];
			
			if(!h[this[0]]) h[this[0]] = []; //init handler array for entity
			h[this[0]].push(fn); //add current fn
		});
		return this;
	},
	
	/**@
	* #.unbind
	* @comp Crafty Core
	* @sign public this .unbind(String eventName[, Function callback])
	* @param eventName - Name of the event to unbind
	* @param callback - Function to unbind
	* Removes binding with an event from current entity. 
	*
	* Passing an event name will remove all events binded to 
	* that event. Passing a reference to the callback will 
	* unbind only that callback.
	* @see .bind, .trigger
	*/
	unbind: function(event, fn) {
		this.each(function() {
			var hdl = handlers[event], i = 0, l, current;
			//if no events, cancel
			if(hdl && hdl[this[0]]) l = hdl[this[0]].length;
			else return this;
			
			//if no function, delete all
			if(!fn) {
				delete hdl[this[0]];
				return this;
			}
			//look for a match if the function is passed
			for(;i<l;i++) {
				current = hdl[this[0]];
				if(current[i] == fn) {
					current.splice(i,1);
					i--;
				}
			}
		});
		
		return this;
	},
	
	/**@
	* #.trigger
	* @comp Crafty Core
	* @sign public this .trigger(String eventName[, Object data])
	* @param eventName - Event to trigger
	* @param data - Arbitrary data that will be passed into every callback as an argument
	* Trigger an event with arbitrary data. Will invoke all callbacks with 
	* the context (value of `this`) of the current entity object.
	*
	* *Note: This will only execute callbacks within the current entity, no other entity.*
	*
	* The first argument is the event name to trigger and the optional 
	* second argument is the arbitrary event data. This can be absolutely anything.
	*/
	trigger: function(event, data) {
		if(this.length === 1) {
			//find the handlers assigned to the event and entity
			if(handlers[event] && handlers[event][this[0]]) {
				var fns = handlers[event][this[0]], i = 0, l = fns.length;
				for(;i<l;i++) {
					fns[i].call(this, data);
				}
			}
			return this;
		}
		
		this.each(function() {
			//find the handlers assigned to the event and entity
			if(handlers[event] && handlers[event][this[0]]) {
				var fns = handlers[event][this[0]], i = 0, l = fns.length;
				for(;i<l;i++) {
					fns[i].call(this, data);
				}
			}
		});
		return this;
	},
	
	/**@
	* #.each
	* @sign public this .each(Function method)
	* @param method - Method to call on each iteration
	* Iterates over found entities, calling a function for every entity. 
	*
	* The function will be called for every entity and will pass the index 
	* in the iteration as an argument. The context (value of `this`) of the 
	* function will be the current entity in the iteration.
	* @example
	* Destroy every second 2D entity
	* ~~~
	* Crafty("2D").each(function(i) {
	*     if(i % 2 === 0) {
	*         this.destroy();
	*     }
	* });
	* ~~~
	*/
	each: function(fn) {
		var i = 0, l = this.length;
		for(;i<l;i++) {
			//skip if not exists
			if(!entities[this[i]]) continue;
			fn.call(entities[this[i]],i);
		}
		return this;
	},
	
	/**@
	* #.clone
	* @comp Crafty Core
	* @sign public Entity .clone(void)
	* @returns Cloned entity of the current entity
	* Method will create another entity with the exact same
	* properties, components and methods as the current entity.
	*/
	clone: function() {
		var comps = this.__c,
			comp,
			prop,
			clone = Crafty.e();
			
		for(comp in comps) {
			clone.addComponent(comp);
		}
		for(prop in this) {
			clone[prop] = this[prop];
		}
		
		return clone;
	},
	
	/**@
	* #.setter
	* @comp Crafty Core
	* @sign public this .setter(String property, Function callback)
	* @param property - Property to watch for modification
	* @param callback - Method to execute if the property is modified
	* Will watch a property waiting for modification and will then invoke the
	* given callback when attempting to modify.
	*
	* *Note: Support in IE<9 is slightly different. The method will be executed
	* after the property has been set*
	*/
	setter: function(prop, fn) {
		if(Crafty.support.setter) {
			this.__defineSetter__(prop, fn);
		} else if(Crafty.support.defineProperty) {
			Object.defineProperty(this, prop, {
                set: fn,
                configurable : true
			});
		} else {
			noSetter.push({
				prop: prop,
				obj: this,
				fn: fn
			});
		}
        return this;
	},
	
	/**@
	* #.destroy
	* @comp Crafty Core
	* @sign public this .destroy(void)
	* @triggers Remove
	* Will remove all event listeners and delete all properties as well as removing from the stage
	*/
	destroy: function() {
		//remove all event handlers, delete from entities
		this.each(function() {
			this.trigger("Remove");
			for(var e in handlers) {
				this.unbind(e);
			}
			delete entities[this[0]];
		});
	}
};

//give the init instances the Crafty prototype
Crafty.fn.init.prototype = Crafty.fn;

/**
* Extension method to extend the namespace and
* selector instances
*/
Crafty.extend = Crafty.fn.extend = function(obj) {
	var target = this, key;
	
	//don't bother with nulls
	if(!obj) return target;
	
	for(key in obj) {
		if(target === obj[key]) continue; //handle circular reference
		target[key] = obj[key];
	}
	
	return target;
};

/**@
* #Crafty.extend
* @category Core
* Used to extend the Crafty namespace.
*/
Crafty.extend({
/**@
	* #Crafty.init
	* @category Core
	* @sign public this Crafty.init([Number width, Number height])
	* @param width - Width of the stage
	* @param height - Height of the stage
	* Starts the `EnterFrame` interval. This will call the `EnterFrame` event for every frame.
	*
	* Can pass width and height values for the stage otherwise will default to window size (see `Crafty.DOM.window`).
	*
	* All `Load` events will be executed.
	*
	* Uses `requestAnimationFrame` to sync the drawing with the browser but will default to `setInterval` if the browser does not support it.
	* @see Crafty.stop
	*/
	init: function (w, h) {
		Crafty.viewport.init(w, h);

		//call all arbitrary functions attached to onload
		this.trigger("Load");
		this.timer.init();

		return this;
	},

	/**@
	* #Crafty.stop
	* @category Core
	* @sign public this Crafty.stop(void)
	* Stops the EnterFrame interval and removes the stage element.
	*
	* To restart, use `Crafty.init()`.
	* @see Crafty.init
	*/
	stop: function () {
		this.timer.stop();
		Crafty.stage.elem.parentNode.removeChild(Crafty.stage.elem);

		return this;
	},

	/**@
	* #Crafty.pause
	* @comp Core
	* @sign public this Crafty.pause(void)
	* Pauses the game by stoping the EnterFrame event from firing. If the game is already paused it is unpaused.
	* You can pass a boolean parameter if you want to pause or unpause mo matter what the current state is.
	* Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
	* to be triggered when that happens you can enable autoPause in `Crafty.settings`.
	* @example
	* Have an entity pause the game when it is clicked.
	* ~~~
	* button.bind("click", function() {
	* 	Crafty.pause();
	* });
	* ~~~
	*/
	pause: function (toggle) {
		if (arguments.length == 1 ? toggle : !this._paused) {
			this.trigger('Pause');
			this._paused = true;

			Crafty.timer.stop();
			Crafty.keydown = {};
		} else {
			this.trigger('Unpause');
			this._paused = false;

			Crafty.timer.init();
		}
		return this;
	},
	/**@
	* #Crafty.timer
	* @category Internal
	* Handles game ticks
	*/
	timer: {
		prev: (+new Date),
		current: (+new Date),
        curTime:Date.now(),

        init: function () {
			var onFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					null;

			if (onFrame) {
				tick = function () {
					Crafty.timer.step();
					tickID = onFrame(tick);
				}

				tick();
			} else {
				tick = setInterval(Crafty.timer.step, 1000 / FPS);
			}
		},

		stop: function () {
			Crafty.trigger("CraftyStop");

			if (typeof tick === "number") clearInterval(tick);

			var onFrame = window.cancelRequestAnimationFrame ||
					window.webkitCancelRequestAnimationFrame ||
					window.mozCancelRequestAnimationFrame ||
					window.oCancelRequestAnimationFrame ||
					window.msCancelRequestAnimationFrame ||
					null;

			if (onFrame) onFrame(tickID);
			tick = null;
		},

		/**@
		* #Crafty.timer.step
		* @comp Crafty.timer
		* @sign public void Crafty.timer.step()
		* Advances the game by triggering `EnterFrame` and calls `Crafty.DrawManager.draw` to update the stage.
		*/
		step: function () {
			loops = 0;
			this.curTime = Date.now();
			if (this.curTime - nextGameTick > 60 * skipTicks) {
				nextGameTick = this.curTime - skipTicks;
			}
			while (this.curTime > nextGameTick) {
				Crafty.trigger("EnterFrame", { frame: frame++ });
				nextGameTick += skipTicks;
				loops++;
			}
			if (loops) {
				Crafty.DrawManager.draw();
			}
		},
		/**@
		* #Crafty.timer.getFPS
		* @comp Crafty.timer
		* @sign public void Crafty.timer.getFPS()
		* Returns the target frames per second. This is not an actual frame rate.
		*/
		getFPS: function () {
			return FPS;
		},
		/**@
		* #Crafty.timer.simulateFrames
		* @comp Crafty.timer
		* Advances the game state by a number of frames and draws the resulting stage at the end. Useful for tests and debugging.
		* @sign public this Crafty.timer.simulateFrames(Number frames)
		* @param frames - number of frames to simulate
		*/
		simulateFrames: function (frames) {
			while (frames-- > 0) {
				Crafty.trigger("EnterFrame", { frame: frame++ });
			}
			Crafty.DrawManager.draw();
		}

	},

	/**@
	* #Crafty.e
	* @category Core
	* @sign public Entity Crafty.e(String componentList)
	* @param componentList - List of components to assign to new entity
	* @sign public Entity Crafty.e(String component1[, .., String componentN])
	* @param component# - Component to add
	* @triggers NewEntity
	* Creates an entity. Any arguments will be applied in the same
	* way `.addComponent()` is applied as a quick way to add components.
	*
	* Any component added will augment the functionality of
	* the created entity by assigning the properties and methods from the component to the entity.
	* ~~~
	* var myEntity = Crafty.e("2D, DOM, Color");
	* ~~~
	* @see Crafty.c
	*/
	e: function () {
		var id = UID(), craft;

		entities[id] = null; //register the space
		entities[id] = craft = Crafty(id);

		if (arguments.length > 0) {
			craft.addComponent.apply(craft, arguments);
		}
		craft.addComponent("obj"); //every entity automatically assumes obj

		Crafty.trigger("NewEntity", { id: id });

		return craft;
	},

	/**@
	* #Crafty.c
	* @category Core
	* @sign public void Crafty.c(String name, Object component)
	* @param name - Name of the component
	* @param component - Object with the components properties and methods
	* Creates a component where the first argument is the ID and the second
	* is the object that will be inherited by entities.
	*
	* There is a convention for writing components. Properties or
	* methods that start with an underscore are considered private.
	* A method called `init` will automatically be called as soon as the
	* component is added to an entity.
	* A method with the same name as the component is considered to be a constructor
	* and is generally used when data is needed before executing.
	*
	* ~~~
	* Crafty.c("Annoying", {
	*     _message: "HiHi",
	*     init: function() {
	*         this.bind("EnterFrame", function() { alert(this.message); });
	*     },
	*     annoying: function(message) { this.message = message; }
	* });
	*
	* Crafty.e("Annoying").annoying("I'm an orange...");
	* ~~~
	* @see Crafty.e
	*/
	c: function (id, fn) {
		components[id] = fn;
	},

	/**@
	* #Crafty.trigger
	* @category Core, Events
	* @sign public void Crafty.trigger(String eventName, * data)
	* @param eventName - Name of the event to trigger
	* @param data - Arbitrary data to pass into the callback as an argument
	* This method will trigger every single callback attached to the event name. This means
	* every global event and every entity that has a callback.
	* @see Crafty.bind
	*/
	trigger: function (event, data) {
		var hdl = handlers[event], h, i, l;
		//loop over every object bound
		for (h in hdl) {
			if (!hdl.hasOwnProperty(h)) continue;

			//loop over every handler within object
			for (i = 0, l = hdl[h].length; i < l; i++) {
				if (hdl[h] && hdl[h][i]) {
					//if an entity, call with that context
					if (entities[h]) {
						hdl[h][i].call(Crafty(+h), data);
					} else { //else call with Crafty context
						hdl[h][i].call(Crafty, data);
					}
				}
			}
		}
	},

	/**@
	* #Crafty.bind
	* @category Core, Events
	* @sign public Number bind(String eventName, Function callback)
	* @param eventName - Name of the event to bind to
	* @param callback - Method to execute upon event triggered
	* @returns ID of the current callback used to unbind
	* Binds to a global event. Method will be executed when `Crafty.trigger` is used
	* with the event name.
	* @see Crafty.trigger, Crafty.unbind
	*/
	bind: function (event, callback) {
		if (!handlers[event]) handlers[event] = {};
		var hdl = handlers[event];

		if (!hdl.global) hdl.global = [];
		return hdl.global.push(callback) - 1;
	},

	/**@
	* #Crafty.unbind
	* @category Core, Events
	* @sign public Boolean Crafty.unbind(String eventName, Function callback)
	* @param eventName - Name of the event to unbind
	* @param callback - Function to unbind
	* @sign public Boolean Crafty.unbind(String eventName, Number callbackID)
	* @param callbackID - ID of the callback
	* @returns True or false depending on if a callback was unbound
	* Unbind any event from any entity or global event.
	*/
	unbind: function (event, callback) {
		var hdl = handlers[event], h, i, l;

		//loop over every object bound
		for (h in hdl) {
			if (!hdl.hasOwnProperty(h)) continue;

			//if passed the ID
			if (typeof callback === "number") {
				delete hdl[h][callback];
				return true;
			}

			//loop over every handler within object
			for (i = 0, l = hdl[h].length; i < l; i++) {
				if (hdl[h][i] === callback) {
					delete hdl[h][i];
					return true;
				}
			}
		}

		return false;
	},

	/**@
	* #Crafty.frame
	* @category Core
	* @sign public Number Crafty.frame(void)
	* Returns the current frame number
	*/
	frame: function () {
		return frame;
	},

	components: function () {
		return components;
	},

	isComp: function (comp) {
		return comp in components;
	},

	debug: function () {
		return entities;
	},

	/**@
	* #Crafty.settings
	* @category Core
	* Modify the inner workings of Crafty through the settings.
	*/
	settings: (function () {
		var states = {},
			callbacks = {};

		return {
		/**@
			* #Crafty.settings.register
			* @comp Crafty.settings
			* @sign public void Crafty.settings.register(String settingName, Function callback)
			* @param settingName - Name of the setting
			* @param callback - Function to execute when use modifies setting
			* Use this to register custom settings. Callback will be executed when `Crafty.settings.modify` is used.
			* @see Crafty.settings.modify
			*/
			register: function (setting, callback) {
				callbacks[setting] = callback;
			},

			/**@
			* #Crafty.settings.modify
			* @comp Crafty.settings
			* @sign public void Crafty.settings.modify(String settingName, * value)
			* @param settingName - Name of the setting
			* @param value - Value to set the setting to
			* Modify settings through this method.
			* @see Crafty.settings.register, Crafty.settings.get
			*/
			modify: function (setting, value) {
				if (!callbacks[setting]) return;
				callbacks[setting].call(states[setting], value);
				states[setting] = value;
			},

			/**@
			* #Crafty.settings.get
			* @comp Crafty.settings
			* @sign public * Crafty.settings.get(String settingName)
			* @param settingName - Name of the setting
			* @returns Current value of the setting
			* Returns the current value of the setting.
			* @see Crafty.settings.register, Crafty.settings.get
			*/
			get: function (setting) {
				return states[setting];
			}
		};
	})(),

	clone: clone
});

/**
* Return a unique ID
*/
function UID() {
	var id = GUID++;
	//if GUID is not unique
	if(id in entities) {
		return UID(); //recurse until it is unique
	}
	return id;
}

/**
* Clone an Object
*/
function clone(obj){
	if(obj === null || typeof(obj) != 'object')
		return obj;

	var temp = obj.constructor(); // changed

	for(var key in obj)
		temp[key] = clone(obj[key]);
	return temp;
}

Crafty.bind("Load", function() {
	if(!Crafty.support.setter && Crafty.support.defineProperty) {
		noSetter = [];
		Crafty.bind("EnterFrame", function() {
			var i = 0, l = noSetter.length, current;
			for(;i<l;++i) {
				current = noSetter[i];
				if(current.obj[current.prop] !== current.obj['_'+current.prop]) {
					current.fn.call(current.obj, current.obj[current.prop]);
				}
			}
		});
	}
});

//make Crafty global
window.Crafty = Crafty;
})(window);