(function(window, undefined) {

var Crafty = function(selector) {
		return new Crafty.fn.init(selector);
	},
	
	GUID = 1, //GUID for entity IDs
	FPS = 50,
	components = {}, //map of components and their functions
	entities = {}, //map of entities and their data
	layers = [],
	handlers = {}, //global handlers
	interval,
	
	slice = Array.prototype.slice,
	rlist = /\s*,\s*/;

Crafty.fn = Crafty.prototype = {

	init: function(selector) {
		//select entities by component
		if(typeof selector === "string") {
			var elem = 0, //index elements
				e, //entity forEach
				and = false, //flags for multiple
				or = false,
				del;
			
			//multiple components OR
			if(selector.indexOf(',') !== -1) {
				or = true;
				del = rlist;
			//deal with multiple components AND
			} else if(selector.indexOf(' ') !== -1) {
				and = true;
				del = ' ';
			}
			
			//loop over entities
			for(e in entities) {
				if(!entities.hasOwnProperty(e)) continue; //skip
				
				if(and || or) { //multiple components
					var comps = selector.split(del), i = 0, l = comps.length, score = 0;
					
					for(;i<l;i++) //loop over components
						if(Crafty(+e).has(comps[i])) score++; //if component exists add to score 
					
					//if anded comps and has all OR ored comps and at least 1
					console.log(and, or, score);
					if(and && score === l || or && score > 0) this[elem++] = +e;
					
				} else if(Crafty(+e).has(selector)) this[elem++] = +e; //convert to int
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
			this.extend(entities[selector]);
			if(!this.__c) this.__c = [];
			
			entities[selector] = this; //update to the cache
		}
		
		return this;
	},
	
	addComponent: function(id) {
		//add multiple arguments
		if(arguments.length > 1) {
			var i = 0, l = arguments.length;
			for(;i<l;i++) {
				this.__c.push(arguments[i]);
			}
		} else if(id.indexOf(',') !== -1) {
			var comps = id.split(rlist), i = 0, l = comps.length;
			for(;i<l;i++) {
				this.__c.push(comps[i]);
			}
		} else this.__c.push(id);
		
		return this;
	},
	
	inherit: function() {
		var i = 0, l = this.__c.length, comp, inits = [];
		for(;i<l;i++) {
			comp = components[this.__c[i]];
			//extend the prototype with the components functions
			this.extend(comp);
			
			//if constructor, add to init stack
			if(comp && "init" in comp) {
				inits.push(comp.init);	
			}
		}
		
		l = inits.length;
		for(i=0;i<l;i++) {
			inits[i].call(this);
		}
	},
	
	has: function(id) {
		var ent = entities[this[0]].__c, i = 0, l = ent.length;
		//loop over components
		for(;i<l;i++) {
			//if component equals component
			if(ent[i] === id) return true;
		}
		return false;
	},
	
	attr: function(key, value) {
		if(arguments.length === 1) {
			//if just the key, return the value
			if(typeof key === "string") {
				return this[key];
			}
			
			//extend if object
			this.extend(key);
			return this;
		}
		//if key value pair
		this[key] = value;
		return this;
	},
	
	toArray: function() {
		return slice.call(this, 0);
	},
	
	bind: function(event, fn) {
		this.each(function() {
			//init event collection
			if(!handlers[event]) handlers[event] = {};
			var h = handlers[event];
			
			if(!h[this[0]]) h[this[0]] = []; //init handler array for entity
			h[this[0]].push(fn); //add current fn
		});
		return this;
	},
	
	trigger: function(event) {
		this.each(function() {
			//find the handlers assigned to the event and entity
			if(handlers[event] && handlers[event][this[0]]) {
				var fns = handlers[event][this[0]], i = 0, l = fns.length;
				for(;i<l;i++) {
					fns[i].call(this);
				}
			}
		});
		return this;
	},
	
	each: function(fn) {
		var i = 0, l = this.length;
		for(;i<l;i++) {
			fn.call(Crafty(this[i]),i);
		}
		return this;
	},
	
	destroy: function() {
		//remove all event handlers, delete from entries
		this.each(function() {
			delete entries[this[0]];
			delete this;
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
	var target = this;
	//don't bother with nulls
	if(!obj) return target;
	
	for(key in obj) {
		if(target === obj[key]) continue; //handle circular reference
		target[key] = obj[key];
	}
	return target;
};

Crafty.extend({
	init: function(f) {
		if(f) FPS = f;
		interval = setInterval(function() {
			Crafty.trigger("enterframe");
		}, 1000 / FPS);
	},
	
	stop: function() {
		clearInterval(interval);
	},
	
	e: function() {
		var id = UID(), craft;
		
		entities[id] = null; //register the space
		entities[id] = craft = Crafty(id);
		
		if(arguments.length > 0) {
			craft.addComponent.apply(craft, arguments);
		}
		craft.inherit();
		return id;
	},
	
	c: function(id, fn) {
		components[id] = fn;
	},
	
	addLayer: function() {
	
	},
	
	trigger: function(event) {
		var hdl = handlers[event], h, i, l;
		for(h in hdl) {
			if(!hdl.hasOwnProperty(h)) continue;
			l = hdl[h].length;
			for(i=0;i<l;i++) {
				hdl[h][i].call(Crafty(+h));
			}
		}
	},
	
	debug: function() {
		if(console) {
			console.log("Entities: ", entities);
			console.log("Components: ", components);
			console.log("Handlers: ", handlers);
		}
	}
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


//make Crafty global
window.Crafty = Crafty;
})(window);
//DELETE THIS
if(!console) window.console = {log: function() {}};
