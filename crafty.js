/*!
 * Crafty v0.3.1
 * http://craftyjs.com
 *
 * Copyright 2010, Louis Stowasser
 * Dual licensed under the MIT or GPL licenses.
 */

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

//wrap around components
(function(Crafty, window, document) {


/**
* Spatial HashMap for broad phase collision
*
* @author Louis Stowasser
*/
(function(parent) {

var cellsize,
	HashMap = function(cell) {
		cellsize = cell || 64;
		this.map = {};
	},
	M = Math,
	Mathfloor = M.floor,
	Mathceil = M.ceil,
	SPACE = " ";

HashMap.prototype = {
	insert: function(obj) {
		var keys = HashMap.key(obj),
			entry = new Entry(keys,obj,this),
			i = 0,
			j,
			hash;
			
		//insert into all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash =  i + SPACE + j;
				if(!this.map[hash]) this.map[hash] = [];
				this.map[hash].push(obj);
			}
		}
		
		return entry;
	},
	
	search: function(rect,filter) {
		var keys = HashMap.key(rect),
			i,j,
			hash,
			obj,
			id,
			results = [],
			finalresult = [],
			found = {};
			if(filter === undefined) filter = true; //default filter to true
			
		
		//search in all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash =  i + SPACE + j;
				
				if(this.map[hash]) {
					results = results.concat(this.map[hash]);
				}
			}
		}
		
		if(filter) {
			//add unique elements to lookup table with the entity ID as unique key
			for(i=0,l=results.length;i<l;i++) {
				obj = results[i];
				if(!obj) continue; //skip if deleted
				id = obj[0]; //unique ID
				
				//check if not added to hash and that actually intersects
				if(!found[id] && obj.x < rect._x + rect._w && obj._x + obj._w > rect._x &&
								 obj.y < rect._y + rect._h && obj._h + obj._y > rect._y) 
				   found[id] = results[i];
			}
			
			//loop over lookup table and copy to final array
			for(obj in found) finalresult.push(found[obj]);
			
			return finalresult;
		} else {
			return results;
		}
	},
	
	remove: function(keys,obj) {
		var i = 0, j, hash;
			
		if(arguments.length == 1) {
			obj = keys;
			keys = HashMap.key(obj);
		}	
		
		//search in all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash = i + SPACE + j;
				
				if(this.map[hash]) {
					var cell = this.map[hash], m = 0, n = cell.length;
					//loop over objs in cell and delete
					for(;m<n;m++) if(cell[m] && cell[m][0] === obj[0]) 
						cell.splice(m,1);
				}
			}
		}
	}
};

HashMap.key = function(obj) {
	var x1 = Mathfloor(obj._x / cellsize),
		y1 = Mathfloor(obj._y / cellsize),
		x2 = Mathfloor((obj._w + obj._x) / cellsize),
		y2 = Mathfloor((obj._h + obj._y) / cellsize);
	return {x1: x1, y1: y1, x2: x2, y2: y2};
};

HashMap.hash = function(keys) {
	return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
};

function Entry(keys,obj,map) {
	this.keys = keys;
	this.map = map;
	this.obj = obj;
}

Entry.prototype = {
	update: function(rect) {
		//check if buckets change
		if(HashMap.hash(HashMap.key(rect)) != HashMap.hash(this.keys)) {
			this.map.remove(this.keys, this.obj);
			var e = this.map.insert(this.obj);
			this.keys = e.keys;
		}
	}
};

parent.HashMap = HashMap;
})(Crafty);

Crafty.map = new Crafty.HashMap();
var M = Math,
	Mc = M.cos,
	Ms = M.sin,
	PI = M.PI,
	DEG_TO_RAD = PI / 180;


Crafty.c("2D", {
	_x: 0,
	_y: 0,
	_w: 0,
	_h: 0,
	_z: 0,
	_rotation: 0,
	_alpha: 1.0,
	_visible: true,
	_global: null,
	
	_origin: null,
	_mbr: null,
	_entry: null,
	_attachy: [],
	_changed: false,
	
	init: function() {
		this._global = this[0];
		this._origin = {x: 0, y: 0};
		
		if(Crafty.support.setter) {
			//create getters and setters on x,y,w,h,z
			this.__defineSetter__('x', function(v) { this._attr('_x',v); });
			this.__defineSetter__('y', function(v) { this._attr('_y',v); });
			this.__defineSetter__('w', function(v) { this._attr('_w',v); });
			this.__defineSetter__('h', function(v) { this._attr('_h',v); });
			this.__defineSetter__('z', function(v) { this._attr('_z',v); });
			this.__defineSetter__('rotation', function(v) { this._attr('_rotation', v); });
			this.__defineSetter__('alpha', function(v) { this._attr('_alpha',v); });
			this.__defineSetter__('visible', function(v) { this._attr('_visible',v); });
			
			this.__defineGetter__('x', function() { return this._x; });
			this.__defineGetter__('y', function() { return this._y; });
			this.__defineGetter__('w', function() { return this._w; });
			this.__defineGetter__('h', function() { return this._h; });
			this.__defineGetter__('z', function() { return this._z; });
			this.__defineGetter__('rotation', function() { return this._rotation; });
			this.__defineGetter__('alpha', function() { return this._alpha; });
			this.__defineGetter__('visible', function() { return this._visible; });
			
		//IE9 supports Object.defineProperty
		} else if(Crafty.support.defineProperty) {
			
			Object.defineProperty(this, 'x', { set: function(v) { this._attr('_x',v); }, get: function() { return this._x; } });
			Object.defineProperty(this, 'y', { set: function(v) { this._attr('_y',v); }, get: function() { return this._y; } });
			Object.defineProperty(this, 'w', { set: function(v) { this._attr('_w',v); }, get: function() { return this._w; } });
			Object.defineProperty(this, 'h', { set: function(v) { this._attr('_h',v); }, get: function() { return this._h; } });
			Object.defineProperty(this, 'z', { set: function(v) { this._attr('_z',v); }, get: function() { return this._z; } });
			
			Object.defineProperty(this, 'rotation', { 
				set: function(v) { this._attr('_rotation',v); }, get: function() { return this._rotation; } 
			});
			
			Object.defineProperty(this, 'alpha', { 
				set: function(v) { this._attr('_alpha',v); }, get: function() { return this._alpha; } 
			});
			
			Object.defineProperty(this, 'visible', { 
				set: function(v) { this._attr('_visible',v); }, get: function() { return this._visible; } 
			});
			
		} else {
			/*
			if no setters, check on every frame for a difference 
			between this._(x|y|w|h|z...) and this.(x|y|w|h|z)
			*/
			
			//set the public properties to the current private properties
			this.x = this._x;
			this.y = this._y;
			this.w = this._w;
			this.h = this._h;
			this.z = this._z;
			this.rotation = this._rotation;
			this.alpha = this._alpha;
			this.visible = this._visible;
			
			//on every frame check for a difference in any property
			this.bind("enterframe", function() {
				//if there are differences between the public and private properties
				if(this.x !== this._x || this.y !== this._y ||
				   this.w !== this._w || this.h !== this._h ||
				   this.z !== this._z || this.rotation !== this._rotation ||
				   this.alpha !== this._alpha || this.visible !== this._visible) {
					
					//save the old positions
					var old = this.mbr() || this.pos();
					
					//if rotation has changed, use the private rotate method
					if(this.rotation !== this._rotation) {
						this._rotate(this.rotation);
					} else {
						//update the MBR
						var mbr = this._mbr, moved = false;
						if(mbr) { //check each value to see which has changed
							if(this.x !== this._x) { mbr._x -= this.x - this._x; moved = true; }
							else if(this.y !== this._y) { mbr._y -= this.y - this._y; moved = true; }
							else if(this.w !== this._w) { mbr._w -= this.w - this._w; moved = true; }
							else if(this.h !== this._h) { mbr._h -= this.h - this._h; moved = true; }
							else if(this.z !== this._z) { mbr._z -= this.z - this._z; moved = true; }
						}
						
						//if the moved flag is true, trigger a move
						if(moved) this.trigger("move", old);
					}
					
					//set the public properties to the private properties
					this._x = this.x;
					this._y = this.y;
					this._w = this.w;
					this._h = this.h;
					this._z = this.z;
					this._rotation = this.rotation;
					this._alpha = this.alpha;
					this._visible = this.visible;
					
					//trigger the changes
					this.trigger("change", old);
				}
			});
		}
		
		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);
		
		//when object changes, update HashMap
		this.bind("move", function() {
			var area = this._mbr || this;
			this._entry.update(area);
		});
		
		this.bind("rotate", function(e) {
			var old = this._mbr || this;
			this._entry.update(old);
		});
		
		//when object is removed, remove from HashMap
		this.bind("remove", function() {
			Crafty.map.remove(this);
			
			this.detach();
		});
	},
	
	/**
	* Calculates the MBR when rotated with an origin point
	*
	* @private
	*/
	_rotate: function(v) {
		var theta = -1 * (v % 360), //angle always between 0 and 359
			rad = theta * DEG_TO_RAD,
			ct = Math.cos(rad), //cache the sin and cosine of theta
			st = Math.sin(rad),
			o = {x: this._origin.x + this._x, 
				 y: this._origin.y + this._y}; 
		
		//if the angle is 0 and is currently 0, skip
		if(!theta) {
			this._mbr = null;
			if(!this._rotation % 360) return;
		}
		
		var x0 = o.x + (this._x - o.x) * ct + (this._y - o.y) * st,
			y0 = o.y - (this._x - o.x) * st + (this._y - o.y) * ct,
			x1 = o.x + (this._x + this._w - o.x) * ct + (this._y - o.y) * st,
			y1 = o.y - (this._x + this._w - o.x) * st + (this._y - o.y) * ct,
			x2 = o.x + (this._x + this._w - o.x) * ct + (this._y + this._h - o.y) * st,
			y2 = o.y - (this._x + this._w - o.x) * st + (this._y + this._h - o.y) * ct,
			x3 = o.x + (this._x - o.x) * ct + (this._y + this._h - o.y) * st,
			y3 = o.y - (this._x - o.x) * st + (this._y + this._h - o.y) * ct,
			minx = Math.floor(Math.min(x0,x1,x2,x3)),
			miny = Math.floor(Math.min(y0,y1,y2,y3)),
			maxx = Math.ceil(Math.max(x0,x1,x2,x3)),
			maxy = Math.ceil(Math.max(y0,y1,y2,y3));
			
		this._mbr = {_x: minx, _y: miny, _w: maxx - minx, _h: maxy - miny};
		
		//trigger rotation event
		var difference = this._rotation - v,
			drad = difference * DEG_TO_RAD;
			
		this.trigger("rotate", {
			cos: Math.cos(drad), 
			sin: Math.sin(drad), 
			deg: difference, 
			rad: drad, 
			o: {x: o.x, y: o.y},
			matrix: {M11: ct, M12: st, M21: -st, M22: ct}
		});
	},
	
	/**
	* Calculates the area of the entity
	*/
	area: function() {
		return this._w * this._h;
	},
	
	/**
	* Checks if this entity intersects a rect
	*
	* @param x X position of the rect or a Rect object
	* @param y Y position of the rect
	* @param w Width of the rect
	* @param h Height of the rect
	*/
	intersect: function(x,y,w,h) {
		var rect, obj = this._mbr || this;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return obj._x < rect.x + rect.w && obj._x + obj._w > rect.x &&
			   obj._y < rect.y + rect.h && obj._h + obj._y > rect.y;
	},
	
	/**
	* Checks if the entity is within a rect
	*
	* @param x X position of the rect or a Rect object
	* @param y Y position of the rect
	* @param w Width of the rect
	* @param h Height of the rect
	*/
	within: function(x,y,w,h) {
		var rect;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return rect.x >= this.x && rect.x + rect.w <= this.x + this.w &&
			   rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
	},
	
	/**
	* Returns an object containing the x and y position
	* as well as width and height as w and h.
	*/
	pos: function() {
		return {
			_x: (this._x),
			_y: (this._y),
			_w: (this._w),
			_h: (this._h)
		};
	},
	
	/**
	* Returns the minimum bounding rectangle. If there is no rotation
	* on the entity it will return the rect.
	*/
	mbr: function() {
		if(!this._mbr) return this.pos();
		return {
			_x: (this._mbr._x),
			_y: (this._mbr._y),
			_w: (this._mbr._w),
			_h: (this._mbr._h)
		};
	},
	
	/**
	* Is a point within an entity
	*
	* @param x X position of the point
	* @param y Y position of the point
	*/
	isAt: function(x,y) {
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},
	
	/**
	* Move an object by direction in terms of n,s,e,w or a combination
	*
	* @param dir Direction to move (n,s,e,w,ne,nw,se,sw)
	* @param by Amount to move in the specified direction
	*/
	move: function(dir, by) {
		if(dir.charAt(0) === 'n') this.y -= by;
		if(dir.charAt(0) === 's') this.y += by;
		if(dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if(dir === 'w' || dir.charAt(1) === 'w') this.x -= by;
		
		return this;
	},
	
	/**
	* Shift or move the entity by an amount. Use negative values
	* for an opposite direction.
	*
	* @param x Amount to move X by. 
	* @param y Amount to move Y
	* @param w Amount to widen
	* @param h Amount to increase height
	*/
	shift: function(x,y,w,h) {
		//shift by amount
		if(x) this.x += x;
		if(y) this.y += y;
		if(w) this.w += w;
		if(h) this.h += h;
		
		return this;
	},
	
	/**
	* Attach an entity to replicate any movement or rotation
	* of this entity
	*
	* @param obj Entity to attach
	*/
	attach: function(obj) {
		function callback(e) {
			if(!e) return; //no change in position
			
			//rotation
			if(e.cos) {
				if('rotate' in obj) obj.rotate(e);
			} else { //move
				//use MBR or current
				var rect = this._mbr || this;
					dx = rect._x - e._x,
					dy = rect._y - e._y,
					dw = rect._w - e._w,
					dh = rect._h - e._h;
				
				obj.shift(dx,dy,dw,dh);
			}
		}
		
		//attach obj to this so when this moves, move by same amount
		this.bind("move", callback);
		this.bind("rotate", callback);
		
		this._attachy[obj[0]] = callback;
		
		return this;
	},
	
	/**
	* Detach an object from following
	*
	* @param obj The entity to detach. Left blank will remove all attached entities
	*/
	detach: function(obj) {
		//if nothing passed, remove all attached objects
		if(!obj) {
			var key, a = this._attachy;
			for(key in a) {
				if(!a.hasOwnProperty(key)) continue;
				this.unbind("move", a[key]);
				
				this._attachy[key] = null;
				delete this._attachy[key];
			}
			
			return this;
		}
		//if obj passed, find the handler and unbind
		var handle = this._attachy[obj[0]];
		this.unbind("move", handle);
		this._attachy[obj[0]] = null;
		delete this._attachy[obj[0]];
		
		return this;
	},
	
	/**
	* Set the origin point of an entity for it to rotate around
	*
	* @param x Pixel value or string based representation with combination of 
	*		   center, bottom, middle, left and right
	* @param y Pixel value of origin offset on the Y axis
	*/
	origin: function(x,y) {
		//text based origin
		if(typeof x === "string") {
			if(x === "centre" || x === "center" || x.indexOf(' ') === -1) {
				x = this._w / 2;
				y = this._h / 2;
			} else {
				var cmd = x.split(' ');
				if(cmd[0] === "top") y = 0;
				else if(cmd[0] === "bottom") y = this._h;
				else if(cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this._h / 2;
				
				if(cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this._w / 2;
				else if(cmd[1] === "left") x = 0;
				else if(cmd[1] === "right") x = this._w;
			}
			
			
		} else if(x > this._w || y > this._h || x < 0 || y < 0) return this;
		
		this._origin.x = x;
		this._origin.y = y;
		
		return this;
	},
	
	/**
	* Method for rotation rather than through a setter
	*
	* @param e Rotation event data
	*/
	rotate: function(e) {
		//assume event data origin
		this._origin.x = e.o.x - this._x;
		this._origin.y = e.o.y - this._y;
		
		//modify through the setter method
		this._attr('_rotation', e.theta);
	},
	
	/**
	* Setter method for all 2D properties including 
	* x, y, w, h, alpha, rotation and visible.
	*
	* @private
	* @param name Name of property
	* @param value Value of property
	*/
	_attr: function(name,value) {	
		//keep a reference of the old positions
		var pos = this.pos(),
			old = this.mbr() || pos;
		
		//if rotation, use the rotate method
		if(name === '_rotation') {
			this._rotate(value);
		//set the global Z and trigger reorder just incase
		} else if(name === '_z') {
			this._global = parseInt(value + Crafty.zeroFill(this[0], 5), 10); //magic number 10e5 is the max num of entities
			this.trigger("reorder");
		//if the rect bounds change, update the MBR and trigger move
		} else if(name == '_x' || name === '_y' || name === '_w' || name === '_h') {
			var mbr = this._mbr;
			if(mbr) {
				mbr[name] -= this[name] - value;
			}
			this[name] = value;
			this.trigger("move", old);
		}
		
		//everything will assume the value
		this[name] = value;
		
		//trigger a change
		this.trigger("change", old);
	}
});

Crafty.c("gravity", {
	_gravity: 0.2,
	_gy: 0,
	_falling: true,
	_anti: null,

	init: function() {
		if(!this.has("2D")) this.addComponent("2D");		
	},

	gravity: function(comp) {
		if(comp) this._anti = comp;

		this.bind("enterframe", this._enterframe);

		return this;
	},

	_enterframe: function() {
		if(this._falling) {
			//if falling, move the players Y
			this._gy += this._gravity * 2;
			this.y += this._gy;
		} else {
			this._gy = 0; //reset change in y
		}

		var obj, hit = false, pos = this.pos(),
			q, i = 0, l;

		//Increase by 1 to make sure map.search() finds the floor
		pos._y++;

		//map.search wants _x and intersect wants x...
		pos.x = pos._x;
		pos.y = pos._y;
		pos.w = pos._w;
		pos.h = pos._h;

		q = Crafty.map.search(pos);
		l = q.length;

		for(;i<l;++i) {
			obj = q[i];
			//check for an intersection directly below the player
			if(obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
				hit = obj;
				break;
			}
		}

		if(hit) { //stop falling if found
			if(this._falling) this.stopFalling(hit);
		} else { 	
			this._falling = true; //keep falling otherwise
		}
	},

	stopFalling: function(e) {
		if(e) this.y = e._y - this._h ; //move object

		//this._gy = -1 * this._bounce;
		this._falling = false;
		if(this._up) this._up = false;
		this.trigger("hit");
	},

	antigravity: function() {
		this.unbind("enterframe", this._enterframe);
	}
});

/**
* Polygon Object
*/
Crafty.polygon = function(poly) {
	if(arguments.length > 1) {
		poly = Array.prototype.slice.call(arguments, 0);
	}
	this.points = poly;
};

Crafty.polygon.prototype = {
	containsPoint: function(x, y) {
		var p = this.points, i, j, c = false;

		for (i = 0, j = p.length - 1; i < p.length; j = i++) {
			if (((p[i][1] > y) != (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) {
				c = !c;
			}
		}

		return c;
	},
	
	shift: function(x,y) {
		var i = 0, l = this.points.length, current;
		for(;i<l;i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},
	
	rotate: function(e) {
		var i = 0, l = this.points.length, 
			current, x, y;
			
		for(;i<l;i++) {
			current = this.points[i];
			
			x = e.o.x + (current[0] - e.o.x) * e.cos + (current[1] - e.o.y) * e.sin;
			y = e.o.y - (current[0] - e.o.x) * e.sin + (current[1] - e.o.y) * e.cos;
			
			current[0] = Math.floor(x);
			current[1] = Math.floor(y);
		}
		//this.draw();
	},
	
	draw: function(e) {
		var i = 0, l = this.points.length, 
			current, x, y;
			
		for(;i<l;i++) {
			current = this.points[i];
			
			Crafty.e("2D, DOM, color").attr({x: current[0], y: current[1], w:5, h: 5}).color("red");
		}
	}
};

Crafty.c("collision", {
	
	collision: function(poly) {
		var area = this._mbr || this;
		
		//if no polygon presented, create a square
		if(!poly) {
			poly = new Crafty.polygon([0,0],[area._w,0],[area._w,area._h],[0,area._h]);
		}
		this.map = poly;
		this.attach(this.map);
		this.map.shift(area._x, area._y);
		
		return this;
	},
	
	hit: function(comp) {
		var area = this._mbr || this,
			results = Crafty.map.search(area, false),
			i = 0, l = results.length,
			dupes = {},
			id, obj, oarea, key,
			hasMap = ('map' in this && 'containsPoint' in this.map),
			finalresult = [];
		
		if(!l) {
			return false;
		}
		
		for(;i<l;++i) {
			obj = results[i];
			oarea = obj._mbr || obj; //use the mbr
			
			if(!obj) continue;
			id = obj[0];
			
			//check if not added to hash and that actually intersects
			if(!dupes[id] && this[0] !== id && obj.__c[comp] && 
							 oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
							 oarea._y < area._y + area._h && oarea._h + oarea._y > area._y) 
			   dupes[id] = obj;
		}
		
		for(key in dupes) {
			obj = dupes[key];

			if(hasMap && 'map' in obj) {
				var SAT = this.SAT(this.map, obj.map);
				SAT.obj = obj;
				SAT.type = "SAT";
				if(SAT) finalresult.push(SAT);
			} else {
				finalresult.push({obj: obj, type: "MBR"});
			}
		}
		
		if(!finalresult.length) {
			return false;
		}
		
		return finalresult;
	},
	
	onhit: function(comp, fn, fnOff) {
		var justHit = false;
		this.bind("enterframe", function() {
			var hitdata = this.hit(comp);
			if(hitdata) {
				justHit = true;
				fn.call(this, hitdata);
			} else if(justHit) {
				if (typeof fnOff == 'function') {
					fnOff.call(this);
				}
				justHit = false;
			}
		});
		return this;
	},
	
	SAT: function(poly1, poly2) {
		var points1 = poly1.points,
			points2 = poly2.points,
			i = 0, l = points1.length,
			j, k = points2.length,
			normal = {x: 0, y: 0},
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = null,
			dot,
			nextPoint,
			currentPoint;
		
		//loop through the edges of Polygon 1
		for(;i<l;i++) {
			nextPoint = points1[(i==l-1 ? 0 : i+1)];
			currentPoint = points1[i];
			
			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);
			
			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;
			
			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;
			
			//project all vertices from poly1 onto axis
			for(j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if(dot > max1 || max1 === -1) max1 = dot;
				if(dot < min1 || min1 === -1) min1 = dot;
			}
			
			//project all vertices from poly2 onto axis
			for(j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if(dot > max2 || max2 === -1) max2 = dot;
				if(dot < min2 || min2 === -1) min2 = dot;
			}
			
			//calculate the minimum translation vector should be negative
			interval = (min1 < min2) ? min2 - max1 : min1 - max2;
			
			//exit early if positive
			if(interval > 0) {
				return false;
			}
			if(interval > MTV || MTV === null) MTV = interval;
		}
		
		//loop through the edges of Polygon 1
		for(i=0;i<k;i++) {
			nextPoint = points2[(i==k-1 ? 0 : i+1)];
			currentPoint = points2[i];
			
			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);
			
			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;
			
			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;
			
			//project all vertices from poly1 onto axis
			for(j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if(dot > max1 || max1 === -1) max1 = dot;
				if(dot < min1 || min1 === -1) min1 = dot;
			}
			
			//project all vertices from poly2 onto axis
			for(j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if(dot > max2 || max2 === -1) max2 = dot;
				if(dot < min2 || min2 === -1) min2 = dot;
			}
			
			//calculate the minimum translation vector should be negative
			interval = (min1 < min2) ? min2 - max1 : min1 - max2;
			
			//exit early if positive
			if(interval > 0) {
				return false;
			}
			if(interval > MTV || MTV === null) MTV = interval;
		}
		
		return {overlap: MTV};
	}
});

Crafty.c("DOM", {
	_element: null,
	_filters: {},
	
	init: function() {
		this._element = document.createElement("div");
		Crafty.stage.inner.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];
		
		this.bind("change", function() {
			if(!this._changed) {
				this._changed = true;
				Crafty.DrawManager.add(this);
			}
		});
		
		if(Crafty.support.prefix === "ms" && Crafty.support.version < 9) {
			this.bind("rotate", function(e) {
				var m = e.matrix,
					elem = this._element.style,
					M11 = m.M11.toFixed(8),
					M12 = m.M12.toFixed(8),
					M21 = m.M21.toFixed(8),
					M22 = m.M22.toFixed(8);
				
				
				this._filters.rotation = "progid:DXImageTransform.Microsoft.Matrix(M11="+M11+", M12="+M12+", M21="+M21+", M22="+M22+", sizingMethod='auto expand')";
			});
		}
		
		this.bind("remove", this.undraw);
	},
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		this._element.style.position = 'absolute';
		return this;
	},
	
	draw: function() {
		var style = this._element.style,
			coord = this.__coord || [0,0,0,0],
			co = {x: coord[0], y: coord[1] },
			prefix = Crafty.support.prefix;
			
		style.top = ~~(this._y) + "px";
		style.left = ~~(this._x) + "px";
		style.width = ~~(this._w) + "px";
		style.height = ~~(this._h) + "px";
		style.zIndex = this._z;
		
		style.opacity = this._alpha;
		style[prefix+"Opacity"] = this._alpha;
		
		//if not version 9 of IE
		if(Crafty.support.prefix === "ms" && Crafty.support.version < 9) {
			//for IE version 8, use ImageTransform filter
			if(Crafty.support.version === 8) {
				this._filters.alpha = "progid:DXImageTransform.Microsoft.Alpha(Opacity="+(this._alpha * 100)+")"; // first!
			//all other versions use filter
			} else {
				this._filters.alpha = "alpha(opacity="+(this._alpha*100)+")";
			}
		}
		this.applyFilters();
		
		if(this._mbr) {
			var rstring = "rotate("+this._rotation+"deg)",
				origin = this._origin.x + "px " + this._origin.y + "px";
			
			style.transformOrigin = origin;
			style[prefix+"TransformOrigin"] = origin;
			
			style.transform = rstring;
			style[prefix+"Transform"] = rstring;
		}
		
		this.trigger("draw", {style: style, type: "DOM", co: co});
		
		return this;
	},
	
	applyFilters: function() {
		this._element.style.filter = "";
		for(var filter in this._filters) {
			if(!this._filters.hasOwnProperty(filter)) continue;
			this._element.style.filter += this._filters[filter] + " ";
		}
	},
	
	undraw: function() {
		Crafty.stage.inner.removeChild(this._element);
		return this;
	},
	
	css: function(obj, value) {
		var key,
			elem = this._element, 
			val,
			style = elem.style;
		
		//if an object passed
		if(typeof obj === "object") {
			for(key in obj) {
				if(!obj.hasOwnProperty(key)) continue;
				val = obj[key];
				if(typeof val === "number") val += 'px';
				
				style[Crafty.camelize(key)] = val;
			}
		} else {
			//if a value is passed, set the property
			if(value) {
				if(typeof value === "number") value += 'px';
				style[Crafty.camelize(obj)] = value;
			} else { //otherwise return the computed property
				return Crafty.getStyle(elem, obj);
			}
		}
		
		this.trigger("change");
		
		return this;
	}
});

/**
* Fix IE6 background flickering
*/
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch(e) {}


Crafty.extend({
	window: {
		init: function() {
			this.width = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
			this.height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
		},
		
		width: 0,
		height: 0
	},
	
	/**
	* Find a DOM elements position including
	* padding and border
	*/
	inner: function(obj) { 
		var rect = obj.getBoundingClientRect(),
			x = rect.left,
			y = rect.top,
			borderX,
			borderY;
		
		//border left
		borderX = parseInt(this.getStyle(obj, 'border-left-width') || 0, 10);
		borderY = parseInt(this.getStyle(obj, 'border-top-width') || 0, 10);
		if(!borderX || !borderY) { //JS notation for IE
			borderX = parseInt(this.getStyle(obj, 'borderLeftWidth') || 0, 10);
			borderY = parseInt(this.getStyle(obj, 'borderTopWidth') || 0, 10);
		}
		
		x += borderX;
		y += borderY;
		
		return {x: x, y: y}; 
	},
	
	getStyle: function(obj,prop) {
		var result;
		if(obj.currentStyle)
			result = obj.currentStyle[Crafty.camelize(prop)];
		else if(window.getComputedStyle)
			result = document.defaultView.getComputedStyle(obj,null).getPropertyValue(Crafty.csselize(prop));
		return result;
	},
	
	/**
	* Used in the Zepto framework
	*
	* Converts CSS notation to JS notation
	*/
	camelize: function(str) { 
		return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
	},
	
	/**
	* Converts JS notation to CSS notation
	*/
	csselize: function(str) {
		return str.replace(/[A-Z]/g, function(chr){ return chr ? '-' + chr.toLowerCase() : '' });
	}
});

Crafty.extend({
	
	randRange: function(from, to) {
		return Math.round(Math.random() * (to - from) + from);
	},
	
	zeroFill: function(number, width) {
		width -= number.toString().length;
		if (width > 0)
			return new Array(width + (/\./.test( number ) ? 2 : 1)).join( '0' ) + number;
		return number.toString();
	},
	
	/**
	* Sprite generator.
	*
	* Extends Crafty for producing components
	* based on sprites and tiles
	*/
	sprite: function(tile, url, map, paddingX, paddingY) {
		var pos, temp, x, y, w, h, img;
		
		//if no tile value, default to 16
		if(typeof tile === "string") {
			map = url;
			url = tile;
			tile = 1;
		}
		
		//if no paddingY, use paddingX
		if(!paddingY && paddingX) paddingY = paddingX;
		paddingX = parseInt(paddingX || 0, 10); //just incase
		paddingY = parseInt(paddingY || 0, 10);
		
		img = Crafty.assets[url];
		if(!img) {
			img = new Image();
			img.src = url;
			Crafty.assets[url] = img;
			img.onload = function() {
				//all components with this img are now ready
				for(var pos in map) {
					Crafty(pos).each(function() {
						this.ready = true;
						this.trigger("change");
					});
				}
			};
		}
		
		for(pos in map) {
			if(!map.hasOwnProperty(pos)) continue;
			
			temp = map[pos];
			x = temp[0] * tile + paddingX;
			y = temp[1] * tile + paddingY;
			w = temp[2] * tile || tile;
			h = temp[3] * tile || tile;
			
			//create a component for the sprite
			Crafty.c(pos, {
				__image: url,
				__coord: [x,y,w,h],
				__tile: tile,
				__padding: [paddingX, paddingY],
				__trim: null,
				img: img,
				ready: false,
				
				init: function() {
					this.addComponent("sprite");
					this.__trim = [0,0,0,0];
		
					//draw now
					if(this.img.complete && this.img.width > 0) {
						this.ready = true;
						this.trigger("change");
					}

					//set the width and height to the sprite size
					this.w = this.__coord[2];
					this.h = this.__coord[3];
					
					this.bind("draw", function(e) {
						var co = e.co,
							pos = e.pos,
							context = e.ctx;
							
						if(e.type === "canvas") {
							//draw the image on the canvas element
							context.drawImage(this.img, //image element
											 co.x, //x position on sprite
											 co.y, //y position on sprite
											 co.w, //width on sprite
											 co.h, //height on sprite
											 pos._x, //x position on canvas
											 pos._y, //y position on canvas
											 pos._w, //width on canvas
											 pos._h //height on canvas
							);
						} else if(e.type === "DOM") {
							this._element.style.background = "url('" + this.__image + "') no-repeat -" + co.x + "px -" + co.y + "px";
						}
					});
				},
				
				sprite: function(x,y,w,h) {
					this.__coord = [x * this.__tile + this.__padding[0] + this.__trim[0],
									y * this.__tile + this.__padding[1] + this.__trim[1],
									this.__trim[2] || w * this.__tile || this.__tile,
									this.__trim[3] || h * this.__tile || this.__tile];
					this.trigger("change");
				},
				
				crop: function(x,y,w,h) {
					var old = this._mbr || this.pos();
					this.__trim = [];
					this.__trim[0] = x;
					this.__trim[1] = y;
					this.__trim[2] = w;
					this.__trim[3] = h;
					
					this.__coord[0] += x;
					this.__coord[1] += y;
					this.__coord[2] = w;
					this.__coord[3] = h;
					this._w = w;
					this._h = h;
					
					this.trigger("change", old);
					return this;
				}
			});
		}
		
		return this;
	},
	
	_events: {},

	/**
	* Window Events credited to John Resig
	* http://ejohn.org/projects/flexible-javascript-events
	*/
	addEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//save anonymous function to be able to remove
		var afn = function(e) { var e = e || window.event; fn.call(ctx,e) },
			id = ctx[0] || "";

		if(!this._events[id+obj+type+fn]) this._events[id+obj+type+fn] = afn;
		else return;

		if (obj.attachEvent) { //IE
			obj.attachEvent('on'+type, afn);
		} else { //Everyone else
			obj.addEventListener(type, afn, false);
		}
	},

	removeEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//retrieve anonymouse function
		var id = ctx[0] || "",
			afn = this._events[id+obj+type+fn];

		if(afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on'+type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[id+obj+type+fn];
		}
	},
	
	background: function(color) {
		Crafty.stage.elem.style.background = color;
	},
	
	viewport: {
		width: 0, 
		height: 0,
		_x: 0,
		_y: 0,
		
		scroll: function(axis, v) {
			var change = (v - this[axis]), //change in direction
				context = Crafty.context,
				style = Crafty.stage.inner.style,
				canvas;
			
			//update viewport and DOM scroll
			this[axis] = v;
			if(axis == '_x') {
				if(context) context.translate(change, 0);
			} else {
				if(context) context.translate(0, change);
			}
			if(context) Crafty.DrawManager.drawAll();
			style[axis == '_x' ? "left" : "top"] = ~~v + "px";
		},
		
		rect: function() {
			return {_x: -this._x, _y: -this._y, _w: this.width, _h: this.height};
		},
		
		init: function(w,h) {
			Crafty.window.init();
			this.width = w || Crafty.window.width;
			this.height = h || Crafty.window.height;
				
			//check if stage exists
			var crstage = document.getElementById("cr-stage");
			
			//create stage div to contain everything
			Crafty.stage = {
				x: 0,
				y: 0,
				fullscreen: false,
				elem: (crstage ? crstage : document.createElement("div")),
				inner: document.createElement("div")
			};
			
			//fullscreen, stop scrollbars
			if(!w && !h) {
				document.body.style.overflow = "hidden";
				Crafty.stage.fullscreen = true;
			}
			
			Crafty.addEvent(this, window, "resize", function() {
				Crafty.window.init();
				var w = Crafty.window.width;
					h = Crafty.window.height,
					offset;
				
				
				if(Crafty.stage.fullscreen) {
					this.width = w;
					this.height = h;
					Crafty.stage.elem.style.width = w;
					Crafty.stage.elem.style.width = h;
					
					if(Crafty._canvas) {
						Crafty._canvas.width = w;
						Crafty._canvas.height = h;
						Crafty.DrawManager.drawAll();
					}
				}
				
				offset = Crafty.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});
			
			Crafty.addEvent(this, window, "blur", function() {
				if (!Crafty.dontPauseOnBlur) Crafty.pause();
			});
			Crafty.addEvent(this, window, "focus", function() {
				if (Crafty._paused) Crafty.pause();
			});

			
			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			Crafty.stage.elem.appendChild(Crafty.stage.inner);
			Crafty.stage.inner.style.position = "absolute";
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			elem.position = "relative";
			
			//find out the offset position of the stage
			offset = Crafty.inner(Crafty.stage.elem);
			Crafty.stage.x = offset.x;
			Crafty.stage.y = offset.y;
			
			if(Crafty.support.setter) {
				//define getters and setters to scroll the viewport
				this.__defineSetter__('x', function(v) { this.scroll('_x', v); });
				this.__defineSetter__('y', function(v) { this.scroll('_y', v); });
				this.__defineGetter__('x', function() { return this._x; });
				this.__defineGetter__('y', function() { return this._y; });
			//IE9
			} else if(Crafty.support.defineProperty) {
				Object.defineProperty(this, 'x', {set: function(v) { this.scroll('_x', v); }, get: function() { return this._x; }});
				Object.defineProperty(this, 'y', {set: function(v) { this.scroll('_y', v); }, get: function() { return this._y; }});
			} else {
				//create empty entity waiting for enterframe
				this.x = this._x;
				this.y = this._y;
				Crafty.e("viewport"); 
			}
		}
	},
	
	support: {},
	
	/**
	* Map key names to key codes
	*/
	keys: {
		'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190 
	}
});

/**
* Test support for various javascript and HTML features
*/
(function testSupport() {
	var support = Crafty.support,
		ua = navigator.userAgent.toLowerCase(),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) || 
				/(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) || 
				/(ms)ie ([\w.]+)/.exec(ua) || 
				/(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [];
	
	//start tests
	support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);
	support.defineProperty = (function() {
		if(!'defineProperty' in Object) return false;
		try { Object.defineProperty({},'x',{}); }
		catch(e) { return false };
		return true;
	})();
	support.audio = ('Audio' in window);
	
	support.prefix = (match[1] || match[0]);
	//browser specific quirks
	if(support.prefix === "moz") support.prefix = "Moz";
	
	//record the version name an integer
	if(match[2]) {
		support.versionName = match[2];
		support.version = +(match[2].split("."))[0];
	}
	
	support.canvas = ('getContext' in document.createElement("canvas"));
})();

/**
* Entity fixes the lack of setter support
*/
Crafty.c("viewport", {
	init: function() {
		this.bind("enterframe", function() {
			if(Crafty.viewport._x !== Crafty.viewport.x) {
				Crafty.viewport.scroll('_x', Crafty.viewport.x);
			}
			
			if(Crafty.viewport._y !== Crafty.viewport.y) {
				Crafty.viewport.scroll('_y', Crafty.viewport.y);
			}
		});
	}
});


/**
* Canvas Components and Extensions
*/
Crafty.c("canvas", {
	buffer: 50,
	
	init: function() {
		//increment the amount of canvas objs
		Crafty.DrawManager.total2D++;
		
		this.bind("change", function(e) {
			//if within screen, add to list			
			/**
			* TODO:
			* Optimize so don't redraw if rectangle is out of bounds
			* Register but if already registered, widen RECT
			*/
			
			if(this._changed === false) {
				this._changed = Crafty.DrawManager.add(e || this, this);
			} else {
				if(e) this._changed = Crafty.DrawManager.add(e, this);
			}
		});
		
		this.bind("remove", function() {
			Crafty.DrawManager.total2D--;
			Crafty.DrawManager.add(this,this);
		});
	},
	
	draw: function(ctx,x,y,w,h) {
		if(!this.ready) return; 
		if(arguments.length === 4) {
			h = w;
			w = y;
			y = x;
			x = ctx;
			ctx = Crafty.context;
		}
		
		var pos = { //inlined pos() function, for speed
				_x: (this._x + (x || 0)),
				_y: (this._y + (y || 0)),
				_w: (w || this._w),
				_h: (h || this._h)
			},
			context = ctx || Crafty.context,
			coord = this.__coord || [0,0,0,0],
			co = {
				x: coord[0] + (x || 0),
				y: coord[1] + (y || 0),
				w: w || coord[2],
				h: h || coord[3]
			};
			
		if(this._mbr) {
			context.save();
			
			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;
			
			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		if(this._alpha < 1.0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}
		
		this.trigger("draw", {type: "canvas", pos: pos, co: co, ctx: context});
		
		if(this._mbr) {
			context.restore();
		}
		if(this._alpha < 1.0) {
			context.globalAlpha = globalpha;
		}
		return this;
	}
});

Crafty.extend({
	context: null,
	_canvas: null,
	
	/**
	* Set the canvas element and 2D context
	*/
	canvas: function() {
		//check if canvas is supported
		if(!Crafty.support.canvas) {
			Crafty.trigger("nocanvas");
			Crafty.stop();
			return;
		}
		
		//create 3 empty canvas elements
		var c;
		c = document.createElement("canvas");
		c.width = Crafty.viewport.width;
		c.height = Crafty.viewport.height;
		c.style.position = 'absolute';
		c.style.left = "0px";
		c.style.top = "0px";
		
		Crafty.stage.elem.appendChild(c);
		Crafty.context = c.getContext('2d');
		Crafty._canvas = c;
	}
});

Crafty.extend({
	down: null, //object mousedown, waiting for up
	over: null, //object mouseover, waiting for out
	mouseObjs: 0,
	keydown: {},
		
	mouseDispatch: function(e) {
		if(!Crafty.mouseObjs) return;

		if(e.type === "touchstart") e.type = "mousedown";
		else if(e.type === "touchmove") e.type = "mousemove";
		else if(e.type === "touchend") e.type = "mouseup";
		
		var maxz = -1,
			closest,
			q,
			i = 0, l;
		
		//search for all mouse entities
		q = Crafty.map.search(Crafty.viewport.rect());
		
		for(l=q.length;i<l;++i) {
			//check if has mouse component
			if(!q[i].has("mouse")) continue;
			
			var current = q[i],
				flag = false,
				x = e.clientX - Crafty.stage.x + document.body.scrollLeft + document.documentElement.scrollLeft,
				y = e.clientY - Crafty.stage.y + document.body.scrollTop + document.documentElement.scrollTop;
			
			if(current.map) {
				if(current.map.containsPoint(x, y)) {
					flag = true;
				}
			} else if(current.isAt(x, y)) flag = true;
			
			if(flag && (current._z >= maxz || maxz === -1)) {
				//if the Z is the same, select the closest GUID
				if(current._z === maxz && current[0] < closest[0]) {
					continue;
				}
				maxz = current._z
				closest = current;
			}
		}
		
		//found closest object to mouse
		if(closest) {
			
			//click must mousedown and out on tile
			if(e.type === "mousedown") {
				this.down = closest;
			}
			if(e.type === "mouseup") {
				//check that down exists and this is down
				if(this.down && closest === this.down) {
					this.down.trigger("click", e);
					this.down = null;
					return; //exit early
				}
				//reset down
				this.down = null;
			}
			
			if(e.type === "mousemove") {
				if(this.over !== closest) { //if new mousemove, it is over
					if(this.over) {
						this.over.trigger("mouseout", e); //if over wasn't null, send mouseout
						this.over = null;
					}
					this.over = closest;
					closest.trigger("mouseover", e);
					return;
				}
			}
			closest.trigger(e.type, e);
		} else {
			if(e.type === "mousemove" && this.over) {
				this.over.trigger("mouseout", e);
				this.over = null;
			}
		}
	}
});

//initialize the mouse events onload
Crafty.onload(this, function() {
	Crafty.addEvent(this, Crafty.stage.elem, "mousedown", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mouseup", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mousemove", Crafty.mouseDispatch);
	
	Crafty.addEvent(this, Crafty.stage.elem, "touchstart", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchmove", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchend", Crafty.mouseDispatch);
});

Crafty.c("mouse", {
	init: function() {
		Crafty.mouseObjs++;
		this.bind("remove", function() {
			Crafty.mouseObjs--;
		});
	},
	
	areaMap: function(poly) {
		//create polygon
		if(arguments.length > 1) {
			//convert args to array to create polygon
			var args = Array.prototype.slice.call(arguments, 0);
			poly = new Crafty.polygon(args);
		}
		
		poly.shift(this._x, this._y);
		this.map = poly;
		
		this.attach(this.map);
		return this;
	}
});

Crafty.c("draggable", {
	_startX: 0,
	_startY: 0,
	
	init: function() {
		if(!this.has("mouse")) this.addComponent("mouse");
		
		function drag(e) {
			this.x = e.clientX - this._startX;
			this.y = e.clientY - this._startY;
		}
				
		this.bind("mousedown", function(e) {
			//start drag
			this._startX = (e.clientX - Crafty.stage.x) - this._x;
			this._startY = (e.clientY - Crafty.stage.y) - this._y;
			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", drag);
		});
		
		Crafty.addEvent(this, Crafty.stage.elem, "mouseup", function() {
			Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", drag);
		});
	},
	
	disable: function() {
		this.unbind("mousedown");
	}
});

Crafty.c("controls", {
	init: function() {
		function dispatch(e) {
			e.key = e.keyCode || e.which;
			if(e.type === "keydown") {
				Crafty.keydown[e.key] = true;
			} else if(e.type === "keyup") {
				delete Crafty.keydown[e.key];
			}
			if (this.disableControls) return;
			this.trigger(e.type, e);
				
			//prevent searchable keys
			if(!(e.metaKey || e.altKey || e.ctrlKey) && !(e.key == 8 || e.key >= 112 && e.key <= 135)) {
				if(e.preventDefault) e.preventDefault();
				else e.returnValue = false;
				return false;
			}
		}
		
		Crafty.addEvent(this, "keydown", dispatch);
		Crafty.addEvent(this, "keyup", dispatch);
		
		//remove events
		this.bind("remove", function() {
			Crafty.removeEvent(this, "keydown", dispatch);
			Crafty.removeEvent(this, "keyup", dispatch);
		});
	},
	
	/**
	* Check if key is down
	*
	* @param key Key code or string representation
	*/
	isDown: function(key) {
		if(typeof key === "string") {
			key = Crafty.keys[key];
		}
		return !!Crafty.keydown[key];
	}
});

Crafty.c("fourway", {	
	_speed: 3,
	
	init: function() {
		this.requires("controls");
	},
	
	fourway: function(speed) {
		if(speed) this._speed = speed;
		
		this.bind("enterframe", function() {
			if(this.isDown("RIGHT_ARROW") || this.isDown("D")) {
				this.x += this._speed;
			}
			if(this.isDown("LEFT_ARROW") || this.isDown("A")) {
				this.x -= this._speed;
			}
			if(this.isDown("UP_ARROW") || this.isDown("W")) {
				this.y -= this._speed;
			}
			if(this.isDown("DOWN_ARROW") || this.isDown("S")) {
				this.y += this._speed;
			}
		});
		
		return this;
	}
});

Crafty.c("twoway", {
	_speed: 3,
	_up: false,
	
	init: function() {
		this.requires("controls");
	},
	
	twoway: function(speed,jump) {
		if(speed) this._speed = speed;
		jump = jump || this._speed * 2;
		
		this.bind("enterframe", function() {
			if(this.isDown("RIGHT_ARROW") || this.isDown("D")) {
				this.x += this._speed;
			}
			if(this.isDown("LEFT_ARROW") || this.isDown("A")) {
				this.x -= this._speed;
			}
			if(this._up) {
				this.y -= jump;
				this._falling = true;
			}
		}).bind("keydown", function() {
			if(this.isDown("UP_ARROW") || this.isDown("W")) this._up = true;
		});
		
		return this;
	}
});


/**
* Animation component
*
* Crafty(player).animate("walk_left", 0, 1, 4, 100);
* Crafty(player).animate("walk_left");
* Crafty(player).stop();
*/
Crafty.c("animate", {
	_reels: null,
	_frame: null,
	_current: null,
	
	init: function() {
		this._reels = {};
	},

	animate: function(id, fromx, y, tox) {
		//play a reel
		if(arguments.length < 4 && typeof fromx === "number") {
			//make sure not currently animating
			this._current = id;
			
			var reel = this._reels[id],
				duration = fromx;
			this._frame = {
				reel: reel, //reel to play
				frameTime: Math.ceil(duration / reel.length), //number of frames inbetween slides
				frame: 0, //current slide/frame
				current: 0,
				repeat: 0
			};
			if (arguments.length === 3 && typeof y === "number") {
				//User provided repetition count
				if (y === -1) this._frame.repeatInfinitly = true;
				else this._frame.repeat = y;
			}
			this.bind("enterframe", this.drawFrame);
			return this;
		}
		if(typeof fromx === "number") {
			var i = fromx,
				reel = [],
				tile = this.__tile;
				
			if (tox > fromx) {
				for(;i<=tox;i++) {
					reel.push([i * tile, y * tile]);
				}
			} else {
				for(;i>=tox;i--) {
					reel.push([i * tile, y * tile]);
				}
			}
			
			this._reels[id] = reel;
		} else if(typeof fromx === "object") {
			this._reels[id] = fromx;
		}
		
		return this;
	},
	
	drawFrame: function(e) {
		var data = this._frame;
		
		if(this._frame.current++ === data.frameTime) {
			var pos = data.reel[data.frame++];
			
			this.__coord[0] = pos[0];
			this.__coord[1] = pos[1];
			this._frame.current = 0;
		}
		
		
		if(data.frame === data.reel.length && this._frame.current === data.frameTime) {
			data.frame = 0;
			if (this._frame.repeatInfinitly === true || this._frame.repeat > 0) {
				if (this._frame.repeat) this._frame.repeat--;
				this._frame.current = 0;
				this._frame.frame = 0;
			} else {
				this.trigger("animationend", {reel: data.reel});
				this.stop();
				return;
			}
		}
		
		this.trigger("change");
	},
	
	stop: function() {
		this.unbind("enterframe", this.drawFrame);
		this.unbind("animationend");
		this._current = null;
		this._frame = null;
		
		return this;
	},
	
	reset: function() {
		if(!this._frame) return this;
		
		var co = this._frame.reel[0];
		this.__coord[0] = co[0];
		this.__coord[1] = co[1];
		this.stop();
		
		return this;
	},
	
	isPlaying: function(id) {
		if(!id) return !!this._interval;
		return this._current === id; 
	}
});

Crafty.c("tween", {
	tween: function(props, duration) {
		var prop,
			old = {},
			step = {},
			startFrame = Crafty.frame(),
			endFrame = startFrame + duration;
		
		//store the old properties
		for(prop in props) {
			old[prop] = this['_'+prop];
			step[prop] = (props[prop] - old[prop]) / duration;
		}
		console.log(step);
		
		this.bind("enterframe", function d(e) {
			if(e.frame >= endFrame) {
				this.unbind("enterframe", d);
				return;
			}
			for(prop in props) {
				this[prop] += step[prop];
			}
		});
	}
});

Crafty.c("color", {
	_color: "",
	ready: true,
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if(e.type === "canvas") {
				if(this._color) e.ctx.fillStyle = this._color;
				e.ctx.fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
			}
		});
	},
	
	color: function(color) {
		this._color = color;
		this.trigger("change");
		return this;
	}
});

Crafty.c("tint", {
	_color: null,
	_strength: 1.0,
	
	init: function() {
		this.bind("draw", function d(e) {
			var context = e.ctx || Crafty.context;
			
			context.fillStyle = this._color || "rgb(0,0,0)";
			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
		});
	},
	
	tint: function(color, strength) {
		this._strength = strength;
		this._color = Crafty.toRGB(color, this._strength);
		
		this.trigger("change");
	}
});

Crafty.c("image", {
	_repeat: "repeat",
	ready: false,
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "canvas") {
				this.canvasDraw(e);
			} else if(e.type === "DOM") {
				if(this.__image) 
					e.style.background = "url(" + this.__image + ") "+this._repeat;
			}
		});
	},
	
	image: function(url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";
		
		
		this.img = Crafty.assets[url];
		if(!this.img) {
			this.img = new Image();
			Crafty.assets[url] = this.img;
			this.img.src = url;
			var self = this;
			
			this.img.onload = function() {
				if(self.has("canvas")) self._pattern = Crafty.context.createPattern(self.img, self._repeat);
				self.ready = true;
				
				if(self._repeat === "no-repeat") {
					self.w = self.img.width;
					self.h = self.img.height;
				}
				
				self.trigger("change");
			};
			
			return this;
		} else {
			this.ready = true;
			if(this.has("canvas")) this._pattern = Crafty.context.createPattern(this.img, this._repeat);
			if(this._repeat === "no-repeat") {
				this.w = this.img.width;
				this.h = this.img.height;
			}
		}
		
		
		this.trigger("change");
		
		return this;
	},
	
	canvasDraw: function(e) {
		//skip if no image
		if(!this.ready || !this._pattern) return;
		
		var context = e.ctx;
		
		context.fillStyle = this._pattern;
		
		context.save();
		context.translate(e.pos._x, e.pos._y);
		context.fillRect(0,0,e.pos._w,e.pos._h);
		context.restore();
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,
	
	scene: function(name, fn) {
		//play scene
		if(arguments.length === 1) {
			Crafty("2D").each(function() {
				if(!this.has("persist")) this.destroy();
			}); //clear screen of all 2D objects except persist
			this._scenes[name].call(this);
			this._current = name;
			return;
		}
		//add scene
		this._scenes[name] = fn;
		return;
	},
	
	rgbLookup:{},
	
	toRGB: function(hex,alpha) {
		var lookup = this.rgbLookup[hex];
		if(lookup) return lookup;
		
		var hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex,
			c = [], result;
			
		c[0] = parseInt(hex.substr(0, 2), 16);
		c[1] = parseInt(hex.substr(2, 2), 16);
		c[2] = parseInt(hex.substr(4, 2), 16);
			
		result = alpha === undefined ? 'rgb('+c.join(',')+')' : 'rgba('+c.join(',')+','+alpha+')';
		lookup = result;
		
		return result;
	}
});

/**
* Draw Manager will manage objects to be drawn and implement
* the best method of drawing in both DOM and canvas
*/
Crafty.DrawManager = (function() {
	/** array of dirty rects on screen */
	var register = [],
	/** array of DOMs needed updating */
		dom = [],
	/** temporary canvas object */
		canv,
	/** context of canvas object */
		ctx;
	
	canv = document.createElement("canvas");
	if('getContext' in canv) ctx = canv.getContext('2d');
	
	return {
		/** Quick count of 2D objects */
		total2D: Crafty("2D").length,
		
		onScreen: function(rect) {
			return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
				   Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
		},
		
		merge: function(set) {
			do {
				var newset = [], didMerge = false, i = 0,
					l = set.length, current, next, merger;
				
				while(i < l) {
					current = set[i];
					next = set[i+1];
					
					if(i < l - 1 && current._x < next._x + next._w && current._x + current._w > next._x &&
									current._y < next._y + next._h && current._h + current._y > next._y) {	
						
						merger = {
							_x: ~~Math.min(current._x, next._x),
							_y: ~~Math.min(current._y, next._y),
							_w: Math.max(current._x, next._x) + Math.max(current._w, next._w),
							_h: Math.max(current._y, next._y) + Math.max(current._h, next._h)
						};
						merger._w = merger._w - merger._x;
						merger._h = merger._h - merger._y;
						merger._w = (merger._w == ~~merger._w) ? merger._w : merger._w + 1 | 0;
						merger._h = (merger._h == ~~merger._h) ? merger._h : merger._h + 1 | 0;
						
						newset.push(merger);
					
						i++;
						didMerge = true;
					} else newset.push(current);
					i++;
				}

				set = newset.length ? Crafty.clone(newset) : set;
				
				if(didMerge) i = 0;
			} while(didMerge);
			
			return set;
		},
		
		/**
		* Calculate the bounding rect of dirty data
		* and add to the register
		*
		* Opacity error: Clears same area, redraws one section, redraws OVER the same area.
		*/
		add: function add(old,current) {
			if(!current) {
				dom.push(old);
				return;
			}
			
			var rect,
				before = old._mbr || old,
				after = current._mbr || current;
				
			if(old === current) {
				rect = old.mbr() || old.pos();
			} else {
				rect =  {
					_x: ~~Math.min(before._x, after._x),
					_y: ~~Math.min(before._y, after._y),
					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
				};
				
				rect._w = (rect._w - rect._x);
				rect._h = (rect._h - rect._y);
			}
			
			if(rect._w === 0 || rect._h === 0 || !this.onScreen(rect)) {
				return false;
			}
			
			//floor/ceil
			rect._x = ~~rect._x;
			rect._y = ~~rect._y;
			rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
			rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;
			
			//add to register, check for merging
			register.push(rect);
			
			//if it got merged
			return true;
		},
		
		debug: function() {
			console.log(register, dom);
		},
		
		drawAll: function(rect) {
			var rect = rect || Crafty.viewport.rect(), q,
				i = 0, l, ctx = Crafty.context,
				current;
			
			q = Crafty.map.search(rect);
			l = q.length;
			
			ctx.clearRect(rect._x, rect._y, rect._w, rect._h);
			
			q.sort(function(a,b) { return a._global - b._global; });
			for(;i<l;i++) {
				current = q[i];
				if(current._visible && current.__c.canvas) {
					current.draw();
					current._changed = false;
				}
			}
		},

		/**
		* Calculate the common bounding rect of multiple canvas entities
		* Returns coords
		*/
		boundingRect: function(set) {
			if (!set || !set.length) return;
			var newset = [], i = 1,
			l = set.length, current, master=set[0], tmp;
			master=[master._x, master._y, master._x + master._w, master._y + master._h];
			while(i < l) {
				current = set[i];
				tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
				if (tmp[0]<master[0]) master[0] = tmp[0];
				if (tmp[1]<master[1]) master[1] = tmp[1];
				if (tmp[2]>master[2]) master[2] = tmp[2];
				if (tmp[3]>master[3]) master[3] = tmp[3];
				i++;
			}
			tmp=master;
			master={_x:tmp[0],_y:tmp[1],_w:tmp[2]-tmp[0],_h:tmp[3]-tmp[1]};

			return master;
		},

		/**
		* Redraw all the dirty regions
		*/
		draw: function draw() {
			//if nothing in register, stop
			if(!register.length && !dom.length) return;
			
			var i = 0, l = register.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [];
				
			//loop over all DOM elements needing updating
			for(;i<k;++i) {
				dom[i].draw()._changed = false;
			}
			//reset counter and DOM array
			dom.length = i = 0;
			
			//again, stop if nothing in register
			if(!l) { return; }
			
			//if the amount of rects is over 60% of the total objects
			//do the naive method redrawing
			if(l / this.total2D > 0.6) {
				console.log("DRAW ALL");
				this.drawAll();
				register.length = 0;
				return;
			}
			
			register = this.merge(register);
			for(;i<l;++i) { //loop over every dirty rect
				rect = register[i];
				if(!rect) continue;
				q = Crafty.map.search(rect); //search for ents under dirty rect
				
				dupes = {};
				
				//loop over found objects removing dupes and adding to obj array
				for(j = 0, len = q.length; j < len; ++j) {
					obj = q[j];
					
					if(dupes[obj[0]] || !obj._visible || !obj.has("canvas"))
						continue;
					dupes[obj[0]] = true;
					
					objs.push({obj: obj, rect: rect});
				}
				
				//clear the rect from the main canvas
				Crafty.context.clearRect(rect._x, rect._y, rect._w, rect._h);
			}
			
			//sort the objects by the global Z
			objs.sort(function(a,b) { return a.obj._global - b.obj._global; });
			if(!objs.length){  return; }
			
			//loop over the objects
			for(i = 0, l = objs.length; i < l; ++i) {
				obj = objs[i];
				rect = obj.rect;
				ent = obj.obj;
				
				var area = ent._mbr || ent, 
					x = (rect._x - area._x <= 0) ? 0 : ~~(rect._x - area._x),
					y = (rect._y - area._y < 0) ? 0 : ~~(rect._y - area._y),
					w = ~~Math.min(area._w - x, rect._w - (area._x - rect._x), rect._w, area._w),
					h = ~~Math.min(area._h - y, rect._h - (area._y - rect._y), rect._h, area._h);
				
				//no point drawing with no width or height
				if(h === 0 || w === 0) continue;
				
				//if it is a pattern or has some rotation, draw it on the temp canvas
				if(ent.has('image') || ent._mbr) {
					canv.width = area._w;
					canv.height = area._h;
					
					ctx.save();
					ctx.translate(-area._x, -area._y);
					ent.draw(ctx);
					Crafty.context.drawImage(canv, x, y, w, h, area._x + x, area._y + y, w, h);
					ctx.restore();
					ctx.clearRect(0,0,canv.width, canv.height);
				//if it is axis-aligned and no pattern, draw subrect
				} else {
					ent.draw(x,y,w,h);
				}
				
				//allow entity to re-register
				ent._changed = false;
			}
			
			//empty register
			register.length = 0;
			//all merged IDs are now invalid
			merged = {};
		}
	};
})();

Crafty.c("group", {
	_children: [],
	
	group: function(children) {
		this._children = children;
		
		this.bind("move", function(e) {
			//when parent is changed, affect children
			var dx = e._x - this.x,
				dy = e._y - this.y,
				dw = e._w - this.w,
				dh = e._h - this.h,
				i = 0, l = this._children.length,
				current;
				
			for(;i<l;i++) {
				current = this._children[i];
				if(dx)  current.x -= dx;
				if(dy)  current.y -= dy;
				if(dw)  current.w -= dw;
				if(dh)  current.h -= dh;
			}
		});
		
		this.bind("remove", function() {
			var i = 0, l = this._children.length,
				current;
				
			for(;i<l;i++) {
				current.destroy();
			}
		});
		
		return this;
	}
});

Crafty.extend({
	group: function() {
		var parent = Crafty.e("2D, group"), //basic parent entity
			args = Array.prototype.slice.call(arguments), //turn args into array
			i = 0, l = args.length,
			minX, maxW, minY, maxH,
			current;
		
		for(;i<l;i++) {
			current = args[i];
			current.removeComponent("obj"); //no longer an obj
			
			//create MBR
			if(current.x < minX || !minX) minX = current.x;
			if(current.x + current.w > minX + maxW || !maxW) maxW = current.x + current.w - minX;
			if(current.y < minY || !minY) minY = current.y;
			if(current.y + current.h < minY + maxH || !maxH) maxH = current.y + current.h - minY;
		}
		
		//set parent to the minimum bounding rectangle
		parent.attr({x: minX, y: minY, w: maxW, h: maxH}).group(args);
		
		return parent;
	}
});

Crafty.extend({
	isometric: {
		_tile: 0,
		_z: 0,
		
		init: function(tile) {
			this._tile = tile;
			return this;
		},
		
		place: function(x,y,z, obj) {
			
			var m = x * this._tile + (y & 1) * (this._tile / 2),
				n = y * this._tile / 4,
				n = n - z * (this._tile / 2);
				
			obj.attr({x: m  + Crafty.viewport._x, y: n  + Crafty.viewport._y}).z += z;
			return this;
		},
		
		zoom: function(tile) {
			this._tile = tile;
			Crafty.trigger("zoom", {tile: tile});
			return this;
		}
	}
});

//Particle component
//Based on Parcycle by Mr. Speaker, licensed under the MIT,
//Ported by Leo Koppelkamm
//**This is canvas only & won't do anything if the browser doesn't support it!**

Crafty.c("particles", {
	init: function () {
		//nothing to do here...
	},
	particles: function (options) {

		if (!Crafty.support.canvas) return this;

		//If we drew on the main canvas, we'd have to redraw 
		//potentially huge sections of the screen every frame
		//So we create a separate canvas, where we only have to redraw 
		//the changed particles.
		var c, ctx, relativeX, relativeY, bounding;

		c = document.createElement("canvas");
		c.width = Crafty.viewport.width;
		c.height = Crafty.viewport.height;
		c.style.position = 'absolute';

		Crafty.stage.elem.appendChild(c);

		ctx = c.getContext('2d');

		this._Particles.init(options);

		relativeX = this.x + Crafty.viewport.x;
		relativeY = this.y + Crafty.viewport.y;
		this._Particles.position = this._Particles.vectorHelpers.create(relativeX, relativeY);

		var oldViewport = {x: Crafty.viewport.x, y:Crafty.viewport.y};
		
		this.bind('enterframe', function () {
			relativeX = this.x + Crafty.viewport.x;
			relativeY = this.y + Crafty.viewport.y;
			this._Particles.viewportDelta = {x: Crafty.viewport.x - oldViewport.x, y: Crafty.viewport.y - oldViewport.y};

			oldViewport = {x: Crafty.viewport.x, y:Crafty.viewport.y};
				
			this._Particles.position = this._Particles.vectorHelpers.create(relativeX, relativeY);

			//Selective clearing
			if (typeof Crafty.DrawManager.boundingRect == 'function') {
				bounding = Crafty.DrawManager.boundingRect(this._Particles.register);
				if (bounding) ctx.clearRect(bounding._x, bounding._y, bounding._w, bounding._h);
			} else {
				ctx.clearRect(0, 0, Crafty.viewport.width, Crafty.viewport.height);
			}

			//This updates all particle colors & positions
			this._Particles.update();

			//This renders the updated particles
			this._Particles.render(ctx);
		});
		return this;
	},
	_Particles: {
		presets: {
			maxParticles: 150,
			size: 18,
			sizeRandom: 4,
			speed: 1,
			speedRandom: 1.2,
			// Lifespan in frames
			lifeSpan: 29,
			lifeSpanRandom: 7,
			// Angle is calculated clockwise: 12pm is 0deg, 3pm is 90deg etc.
			angle: 65,
			angleRandom: 34,
			startColour: [255, 131, 0, 1],
			startColourRandom: [48, 50, 45, 0],
			endColour: [245, 35, 0, 0],
			endColourRandom: [60, 60, 60, 0],
			// Only applies when fastMode is off, specifies how sharp the gradients are drawn
			sharpness: 20,
			sharpnessRandom: 10,
			// Random spread from origin
			spread: 10,
			// How many frames should this last
			duration: -1,
			// Will draw squares instead of circle gradients
			fastMode: false,
			gravity:{x: 0, y: 0.1},
			// sensible values are 0-3
			jitter: 0,
			
			//Don't modify the following
			particles: [],
			active: true,
			particleCount: 0,
			elapsedFrames: 0,
			emissionRate: 0,
			emitCounter: 0,
			particleIndex: 0
		},


		init: function (options) {
			this.position = this.vectorHelpers.create(0, 0);
			if (typeof options == 'undefined') var options = {};

			//Create current config by mergin given options and presets.
			for (key in this.presets) {
				if (typeof options[key] != 'undefined') this[key] = options[key];
				else this[key] = this.presets[key];
			}

			this.emissionRate = this.maxParticles / this.lifeSpan;
			this.positionRandom = this.vectorHelpers.create(this.spread, this.spread);
		},

		addParticle: function () {
			if (this.particleCount == this.maxParticles) {
				return false;
			}

			// Take the next particle out of the particle pool we have created and initialize it	
			var particle = new this.particle(this.vectorHelpers);
			this.initParticle(particle);
			this.particles[this.particleCount] = particle;
			// Increment the particle count
			this.particleCount++;

			return true;
		},
		RANDM1TO1: function() {
			return Math.random() * 2 - 1;
		},		
		initParticle: function (particle) {
			particle.position.x = this.position.x + this.positionRandom.x * this.RANDM1TO1();
			particle.position.y = this.position.y + this.positionRandom.y * this.RANDM1TO1();

			var newAngle = (this.angle + this.angleRandom * this.RANDM1TO1()) * (Math.PI / 180); // convert to radians
			var vector = this.vectorHelpers.create(Math.sin(newAngle), -Math.cos(newAngle)); // Could move to lookup for speed
			var vectorSpeed = this.speed + this.speedRandom * this.RANDM1TO1();
			particle.direction = this.vectorHelpers.multiply(vector, vectorSpeed);

			particle.size = this.size + this.sizeRandom * this.RANDM1TO1();
			particle.size = particle.size < 0 ? 0 : ~~particle.size;
			particle.timeToLive = this.lifeSpan + this.lifeSpanRandom * this.RANDM1TO1();

			particle.sharpness = this.sharpness + this.sharpnessRandom * this.RANDM1TO1();
			particle.sharpness = particle.sharpness > 100 ? 100 : particle.sharpness < 0 ? 0 : particle.sharpness;
			// internal circle gradient size - affects the sharpness of the radial gradient
			particle.sizeSmall = ~~ ((particle.size / 200) * particle.sharpness); //(size/2/100)
			var start = [
				this.startColour[0] + this.startColourRandom[0] * this.RANDM1TO1(),
				this.startColour[1] + this.startColourRandom[1] * this.RANDM1TO1(),
				this.startColour[2] + this.startColourRandom[2] * this.RANDM1TO1(),
				this.startColour[3] + this.startColourRandom[3] * this.RANDM1TO1()
				];

			var end = [
				this.endColour[0] + this.endColourRandom[0] * this.RANDM1TO1(),
				this.endColour[1] + this.endColourRandom[1] * this.RANDM1TO1(),
				this.endColour[2] + this.endColourRandom[2] * this.RANDM1TO1(),
				this.endColour[3] + this.endColourRandom[3] * this.RANDM1TO1()
				];

			particle.colour = start;
			particle.deltaColour[0] = (end[0] - start[0]) / particle.timeToLive;
			particle.deltaColour[1] = (end[1] - start[1]) / particle.timeToLive;
			particle.deltaColour[2] = (end[2] - start[2]) / particle.timeToLive;
			particle.deltaColour[3] = (end[3] - start[3]) / particle.timeToLive;
		},
		update: function () {
			if (this.active && this.emissionRate > 0) {
				var rate = 1 / this.emissionRate;
				this.emitCounter++;
				while (this.particleCount < this.maxParticles && this.emitCounter > rate) {
					this.addParticle();
					this.emitCounter -= rate;
				}
				this.elapsedFrames++;
				if (this.duration != -1 && this.duration < this.elapsedFrames) {
					this.stop();
				}
			}

			this.particleIndex = 0;
			this.register = [];
			var draw;
			while (this.particleIndex < this.particleCount) {

				var currentParticle = this.particles[this.particleIndex];

				// If the current particle is alive then update it
				if (currentParticle.timeToLive > 0) {

					// Calculate the new direction based on gravity
					currentParticle.direction = this.vectorHelpers.add(currentParticle.direction, this.gravity);
					currentParticle.position = this.vectorHelpers.add(currentParticle.position, currentParticle.direction);
					currentParticle.position = this.vectorHelpers.add(currentParticle.position, this.viewportDelta);
					if (this.jitter) {
						currentParticle.position.x += this.jitter * this.RANDM1TO1(); 
						currentParticle.position.y += this.jitter * this.RANDM1TO1();
					}
					currentParticle.timeToLive--;

					// Update colours
					var r = currentParticle.colour[0] += currentParticle.deltaColour[0];
					var g = currentParticle.colour[1] += currentParticle.deltaColour[1];
					var b = currentParticle.colour[2] += currentParticle.deltaColour[2];
					var a = currentParticle.colour[3] += currentParticle.deltaColour[3];

					// Calculate the rgba string to draw.
					draw = [];
					draw.push("rgba(" + (r > 255 ? 255 : r < 0 ? 0 : ~~r));
					draw.push(g > 255 ? 255 : g < 0 ? 0 : ~~g);
					draw.push(b > 255 ? 255 : b < 0 ? 0 : ~~b);
					draw.push((a > 1 ? 1 : a < 0 ? 0 : a.toFixed(2)) + ")");
					currentParticle.drawColour = draw.join(",");

					if (!this.fastMode) {
						draw[3] = "0)";
						currentParticle.drawColourEnd = draw.join(",");
					}

					this.particleIndex++;
				} else {
					// Replace particle with the last active 
					if (this.particleIndex != this.particleCount - 1) {
						this.particles[this.particleIndex] = this.particles[this.particleCount - 1];
					}
					this.particleCount--;
				}
				var rect = {};
				rect._x = ~~currentParticle.position.x;
				rect._y = ~~currentParticle.position.y;
				rect._w = currentParticle.size;
				rect._h = currentParticle.size;

				this.register.push(rect);
			}
		},

		stop: function () {
			this.active = false;
			this.elapsedFrames = 0;
			this.emitCounter = 0;
		},

		render: function (context) {

			for (var i = 0, j = this.particleCount; i < j; i++) {
				var particle = this.particles[i];
				var size = particle.size;
				var halfSize = size >> 1;

				if (particle.position.x + size < 0 
					|| particle.position.y + size < 0 
					|| particle.position.x - size > Crafty.viewport.width 
					|| particle.position.y - size > Crafty.viewport.height) {
					//Particle is outside
					continue;
				}
				var x = ~~particle.position.x;
				var y = ~~particle.position.y;

				if (this.fastMode) {
					context.fillStyle = particle.drawColour;
				} else {
					var radgrad = context.createRadialGradient(x + halfSize, y + halfSize, particle.sizeSmall, x + halfSize, y + halfSize, halfSize);
					radgrad.addColorStop(0, particle.drawColour);
					//0.9 to avoid visible boxing
					radgrad.addColorStop(0.9, particle.drawColourEnd);
					context.fillStyle = radgrad;
				}
				context.fillRect(x, y, size, size);
			}
		},
		particle: function (vectorHelpers) {
			this.position = vectorHelpers.create(0, 0);
			this.direction = vectorHelpers.create(0, 0);
			this.size = 0;
			this.sizeSmall = 0;
			this.timeToLive = 0;
			this.colour = [];
			this.drawColour = "";
			this.deltaColour = [];
			this.sharpness = 0;
		},
		vectorHelpers: {
			create: function (x, y) {
				return {
					"x": x,
					"y": y
				};
			},
			multiply: function (vector, scaleFactor) {
				vector.x *= scaleFactor;
				vector.y *= scaleFactor;
				return vector;
			},
			add: function (vector1, vector2) {
				vector1.x += vector2.x;
				vector1.y += vector2.y;
				return vector1;
			}
		}
	}
});

Crafty.extend({
	audio: {
		_elems: {},
		MAX_CHANNELS: 5,
		
		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},
		
		add: function(id, url) {
			if(!Crafty.support.audio) return this;
			
			var elem, 
				key, 
				audio = new Audio(),
				canplay,
				i = 0,
				sounds = [];
						
			//if an object is passed
			if(arguments.length === 1 && typeof id === "object") {
				for(key in id) {
					if(!id.hasOwnProperty(key)) continue;
					
					//if array passed, add fallback sources
					if(typeof id[key] !== "string") {	
						var sources = id[key], i = 0, l = sources.length,
							source;
						
						for(;i<l;++i) {
							source = sources[i];
							//get the file extension
							ext = source.substr(source.lastIndexOf('.')+1).toLowerCase();
							canplay = audio.canPlayType(this.type[ext]);
							
							//if browser can play this type, use it
							if(canplay !== "" && canplay !== "no") {
								url = source;
								break;
							}
						}
					} else {
						url = id[key];
					}
					
					for(;i<this.MAX_CHANNELS;i++) {
						audio = new Audio(url);
						audio.preload = "auto";
						audio.load();
						sounds.push(audio);
					}
					this._elems[key] = sounds;
					if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
				}
				
				return this;
			} 
			//standard method
			if(typeof url !== "string") { 
				var i = 0, l = url.length,
					source;
				
				for(;i<l;++i) {
					source = url[i];
					//get the file extension
					ext = source.substr(source.lastIndexOf('.')+1);
					canplay = audio.canPlayType(this.type[ext]);
					
					//if browser can play this type, use it
					if(canplay !== "" && canplay !== "no") {
						url = source;
						break;
					}
				}
			}
			
			//create a new Audio object and add it to assets
			for(;i<this.MAX_CHANNELS;i++) {
				audio = new Audio(url);
				audio.preload = "auto";
				audio.load();
				sounds.push(audio);
			}
			this._elems[id] = sounds;
			if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[id][0];
			
			return this;		
		},
		
		play: function(id) {
			if(!Crafty.support.audio) return;
			
			var sounds = this._elems[id],
				sound,
				i = 0, l = sounds.length;
			
			for(;i<l;i++) {
				sound = sounds[i];
				//go through the channels and play a sound that is stopped
				if(sound.ended || !sound.currentTime) {
					sound.play();
					break;
				} else if(i === l-1) { //if all sounds playing, try stop the last one
					sound.currentTime = 0;
					sound.play();
				}
			}
			
			return this;
		},
		
		settings: function(id, settings) {
			//apply to all
			if(!settings) {
				for(var key in this._elems) {
					this.settings(key, id);
				}
				return this;
			}
			
			var sounds = this._elems[id],
				sound,
				setting,
				i = 0, l = sounds.length;
			
			for(var setting in settings) {
				for(;i<l;i++) {
					sound = sounds[i];
					sound[setting] = settings[setting];
				}
			}
			
			return this;
		}
	}
});

Crafty.c("text", {
	_text: "",
	_font: "",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				var el = this._element, style = el.style;
				el.innerHTML = this._text;
				style.font = this._font;
			} else {
				
			}
		});
	},
	
	text: function(text) {
		if(!text) return this._text;
		this._text = text;
		this.trigger("change");
		return this;
	},
	
	font: function(font) {
		this._font = font;
		this.trigger("change");
		return this;
	}
});


Crafty.c("health", {
	_mana: 100,
	
	health: function(mana) {
		this._mana = mana;
		return this;
	},
	
	hurt: function(by) {
		this._mana -= by;
		
		this.trigger("hurt", {by: by, mana: this._mana});
		if(this._mana <= 0) {
			this.trigger("die");
		}
		return this;
	},
	
	heal: function(by) {
		this._mana += by;
		this.trigger("heal");
		return this;
	}
});

Crafty.c("score", {
	_score: 0,
	
	incrementScore: function(by) {
		this._score += by;
		
		return this;
	},
	
	decrementScore: function(by) {
		this._score -= by;
		
		return this;
	}
});

/**
* Loader to load assets
*/
Crafty.extend({
	assets: {},
	
	load: function(data, oncomplete, onprogress, onerror) {
		var i = 0, l = data.length, current, obj, total = l, j = 0;
		for(;i<l;++i) {
			current = data[i];
			ext = current.substr(current.lastIndexOf('.')+1).toLowerCase();

			if(Crafty.support.audio && (ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4")) {
				obj = new Audio(current);
				//Chrome doesn't trigger onload on audio, see http://code.google.com/p/chromium/issues/detail?id=77794
				if (navigator.userAgent.indexOf('Chrome') != -1) j++;
			} else if(ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "png") {
				obj = new Image();
				obj.src = current;
			} else {
				total--;
				continue; //skip if not applicable
			}
			
			//add to global asset collection
			this.assets[current] = obj;
			
			obj.onload = function() {
				++j;
				
				//if progress callback, give information of assets loaded, total and percent
				if(onprogress) {
					onprogress.call(this, {loaded: j, total: total, percent: (j / total * 100)});
				}
				if(j === total) {
					if(oncomplete) oncomplete();
				}
			};
			
			//if there is an error, pass it in the callback (this will be the object that didn't load)
			obj.onerror = function() {
				if(onerror) {
					onerror.call(this, {loaded: j, total: total, percent: (j / total * 100)});
				} else {
					console.log('Failed to load ' + this.src);
					j++;
					if(j === total) {
						if(oncomplete) oncomplete();
					}
				}
			};
		}
	}
});

})(Crafty,window,window.document);

