(function(window, undefined) {

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

Crafty.fn = Crafty.prototype = {

	init: function(selector) {
		//select entities by component
		if(typeof selector === "string") {
			var elem = 0, //index elements
				e, //entity forEach
				current,
				and = false, //flags for multiple
				or = false,
				del;
			
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
					var comps = selector.split(del), i = 0, l = comps.length, score = 0;
					
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
	
	addComponent: function(id) {
		var uninit = [], c = 0, ul; //array of components to init
		
		//add multiple arguments
		if(arguments.length > 1) {
			var i = 0, l = arguments.length;
			for(;i<l;i++) {
				this.__c[arguments[i]] = true;
				uninit.push(arguments[i]);
			}
		//split components if contains comma
		} else if(id.indexOf(',') !== -1) {
			var comps = id.split(rlist), i = 0, l = comps.length;
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
			//Backward compat
			if (typeof comp == 'undefined'){
				comp = components[uninit[c].substr(0, 1).toUpperCase() + uninit[c].substr(1)];
			} 
			this.extend(comp);
			
			//if constructor, call it
			if(comp && "init" in comp) {
				comp.init.call(this);
			}
		}
		
		this.trigger("component");
		return this;
	},
	
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
	
	removeComponent: function(id) {
		delete this.__c[id];
		return this;
	},
	
	has: function(id) {
		return !!this.__c[id];
	},
	
	attr: function(key, value) {
		if(arguments.length === 1) {
			//if just the key, return the value
			if(typeof key === "string") {
				return this[key];
			}
			
			//extend if object
			this.extend(key);
			this.trigger("change"); //trigger change event
			return this;
		}
		//if key value pair
		this[key] = value;
		
		this.trigger("change"); //trigger change event
		return this;
	},
	
	toArray: function() {
		return slice.call(this, 0);
	},
	
	delay: function(fn, duration) {
		this.each(function() {
			var self = this;
			setTimeout(function() {
				fn.call(self);
			}, duration);
		});
        return this;
	},
	
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
	
	unbind: function(event, fn) {
		this.each(function() {
			var hdl = handlers[event], i = 0, l, current;
			//if no events, cancel
			if(hdl && hdl[this[0]]) l = hdl[this[0]].length;
			else return this;
			
			//if only one event logged or no function, delete all
			if(l === 1 || !fn) {
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
	
	each: function(fn) {
		var i = 0, l = this.length;
		for(;i<l;i++) {
			//skip if not exists
			if(!entities[this[i]]) continue;
			fn.call(entities[this[i]],i);
		}
		return this;
	},
	
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
	
	destroy: function() {
		//remove all event handlers, delete from entities
		this.each(function() {
			this.trigger("remove");
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
	init: function(f, w, h) {
		//two arguments equals the width and height
		if(arguments.length === 2) {			
			h = w;
			w = f;
			f = 60;
		}
		
		FPS = f || 60;
		
		Crafty.viewport.init(w,h);
		
		//call all arbitrary functions attached to onload
		this.trigger("Load");
		this.timer.init();
		
		return this;
	},
	
	stop: function() {
		this.timer.stop();
		Crafty.stage.elem.parentNode.removeChild(Crafty.stage.elem);
		
		return this;
	},
	
	/**@
	* #Crafty.pause
	* Unbinds all enterframe handlers and stores them away
	* Calling .pause() again will restore previously deactivated handlers.
	* 
	* @sign public this Crafty.pause()
	* @example
	* Have an entity pause the game when it is clicked.
	* ~~~
	* button.bind("click", function() {
	* 	Crafty.pause(); 
	* });
	* ~~~
	*/
	pause: function() {
		if(!this._paused) {
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
	
	timer: {
		prev: (+new Date),
		current: (+new Date),
		fps: 0,
		
		init: function() {
			var onFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					null;
			
			if(onFrame) {
				function tick() { 
					Crafty.timer.step();
					tickID = onFrame(tick); 
				}
				
				tick();
			} else {
				tick = setInterval(Crafty.timer.step, 1000 / FPS);
			}
		},
		
		stop: function() {
			if(typeof tick === "number") clearInterval(tick);
		
			var onFrame = window.cancelRequestAnimationFrame ||
					window.webkitCancelRequestAnimationFrame ||
					window.mozCancelRequestAnimationFrame ||
					window.oCancelRequestAnimationFrame ||
					window.msCancelRequestAnimationFrame ||
					null;
						
			if(onFrame) onFrame(tickID);
			tick = null;
		},
		
		step: function() {
			loops = 0;
			while((new Date).getTime() > nextGameTick) {
				Crafty.trigger("enterframe", {frame: frame++});
				nextGameTick += skipTicks;
				loops++;
			}
			if(loops) {
				Crafty.DrawManager.draw();
			}
		},

		getFPS: function() {
			return this.fps;
		}
	},

	e: function() {
		var id = UID(), craft;
		
		entities[id] = null; //register the space
		entities[id] = craft = Crafty(id);
		
		if(arguments.length > 0) {
			craft.addComponent.apply(craft, arguments);
		}
		craft.addComponent("obj"); //every entity automatically assumes obj
		
		return craft;
	},
	
	c: function(id, fn) {
		components[id] = fn;
	},
	
	trigger: function(event, data) {
		var hdl = handlers[event], h, i, l;
		//loop over every object bound
		for(h in hdl) {
			if(!hdl.hasOwnProperty(h)) continue;
			
			//loop over every handler within object
			for(i = 0, l = hdl[h].length; i < l; i++) {
				if(hdl[h] && hdl[h][i]) {
					//if an entity, call with that context
					if(entities[h]) {
						hdl[h][i].call(Crafty(+h), data);
					} else { //else call with Crafty context
						hdl[h][i].call(Crafty, data);
					}
				}
			}
		}
	},
	
	bind: function(event, callback) {
		if(!handlers[event]) handlers[event] = {};
		var hdl = handlers[event];
		
		if(!hdl.global) hdl.global = [];
		return hdl.global.push(callback) - 1;
	},
	
	unbind: function(event, callback) {
		var hdl = handlers[event], h, i, l;
		
		//loop over every object bound
		for(h in hdl) {
			if(!hdl.hasOwnProperty(h)) continue;
			
			//if passed the ID
			if(typeof callback === "number") {
				delete hdl[h][callback];
				return true;
			}
			
			//loop over every handler within object
			for(i = 0, l = hdl[h].length; i < l; i++) {
				if(hdl[h][i] === callback) {
					delete hdl[h][i];
					return true;
				}
			}
		}
		
		return false;
	},
	
	frame: function() {
		return frame;
	},
	
	components: function() {
		return components;
	},
	
	settings: (function() {
		var states = {},
			callbacks = {};
		
		return {
			register: function(setting, callback) {
				callbacks[setting] = callback;
			},
			
			modify: function(setting, value) {
				if(!callbacks[setting]) return;
				callbacks[setting].call(states[setting], value);
				states[setting] = value;
			},
			
			get: function(setting) {
				return states[setting];
			}
		}
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
	if(obj == null || typeof(obj) != 'object')
		return obj;

	var temp = obj.constructor(); // changed

	for(var key in obj)
		temp[key] = clone(obj[key]);
	return temp;
}

Crafty.bind("Load", function() {
	if(!Crafty.support.setter && Crafty.support.defineProperty) {
		noSetter = [];
		Crafty.bind("enterframe", function() {
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