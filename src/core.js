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

//FIXME
Crafty.clone2 = function (obj){
	if(obj == null || typeof(obj) != 'object')
		return obj;
		
	if (obj.constructor) {
		var temp = obj.constructor(); // changed
	} else {
		var temp = obj;
	}
	for(var key in obj)
		temp[key] = Crafty.clone2(obj[key]);
	return temp;
};

/**
* Extension method to extend the namespace and
* selector instances
*/
Crafty.extend = Crafty.fn.extend = function(obj) {
	var target = this;
	//don't bother with nulls
	if(!obj) return target;
	
	for(key in obj) {
		//FIXME
		if(target === obj[key]) continue; //handle circular reference
		if (typeof obj[key] == 'object' && key=="_Particles") {
			target[key] = Crafty.clone2(obj[key]);
		} else {
			target[key] = obj[key];
		}
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
		this.onload();
		this.timer.init();
		
		return this;
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
		
		return this;
	},
	
	//Unbinds all enterframe handlers and stores them away
	//Calling .pause() again will restore previously deactivated handlers.
	pause: function() {
		if (!this._paused){
			this.trigger('pause');
			this._paused = true;
			Crafty._pausedEvents = {};
			
			for (handler in handlers['enterframe']){
				Crafty._pausedEvents[handler] = handlers['enterframe'][handler];
				delete handlers['enterframe'][handler];
			};
			Crafty.keydown={};
		} else {
			this.trigger('unpause');
			this._paused = false;
			
			for (handler in Crafty._pausedEvents){
				handlers['enterframe'][handler] = Crafty._pausedEvents[handler];
			};
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
					null,
			
				onEachFrame = function(cb) {
					if(onFrame) {
						tick = function() { cb(); tickID = onFrame(tick); }
						tick();
					} else {
						tick = setInterval(cb, 1000 / FPS);
					}
				};
			
			onEachFrame(Crafty.timer.step);
		},
		
		step: (function() {
			var loops = 0, 
				skipTicks = 1000 / FPS,
				nextGameTick = (new Date).getTime();
			
			return function() {
				loops = 0;
				this.prev = this.current;
				this.current = (+new Date);

				while((new Date).getTime() > nextGameTick) {
					Crafty.trigger("enterframe", {frame: frame++});
					nextGameTick += skipTicks;
					loops++;
					this.fps = loops / this.fpsUpdateFrequency;
				}

				if(loops) {
					Crafty.DrawManager.draw();
				}
			};
		})(),
		
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
		for(h in hdl) {
			if(!hdl.hasOwnProperty(h)) continue;
			l = hdl[h].length;
			for(i=0;i<l;i++) {
				if(hdl[h] && hdl[h][i])
					hdl[h][i].call(Crafty(+h),data);
			}
		}
	},
	
	frame: function() {
		return frame;
	},
	
	onload: function(ctx,fn) {
		if(!arguments.length) {
			var i = 0, l = onloads.length,
				current;
			for(;i<l;++i) {
				current = onloads[i];
				if(current)
					current.fn.call(current.ctx);
			}
			return this;
		}
		onloads.push({ctx: ctx, fn: fn});
		return this;
	},
	
	components: function() {
		return components;
	},
	
	clone: function clone(obj){
		if(obj == null || typeof(obj) != 'object')
			return obj;

		var temp = obj.constructor(); // changed

		for(var key in obj)
			temp[key] = clone(obj[key]);
		return temp;
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