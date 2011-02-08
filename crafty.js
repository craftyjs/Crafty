/*!
 * Crafty v0.3
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
	interval,
	tick,
	
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
			if(hdl[this[0]]) l = hdl[this[0]].length;
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
			f = 100;
		}
		
		FPS = f || 100;
		
		Crafty.viewport.init(w,h);
		
		//call all arbitrary functions attached to onload
		this.onload();
		this.timer.init();
	},
	
	stop: function() {
		clearInterval(tick);
	},
	
	timer: {
		prev: (+new Date),
		current: (+new Date),
		fps: 0,
		
		init: function() {
			var onEachFrame;
			if (window.webkitRequestAnimationFrame) {
				onEachFrame = function(cb) {
					var _cb = function() { cb(); webkitRequestAnimationFrame(_cb); }
					_cb();
				};
			} else if (window.mozRequestAnimationFrame) {
				onEachFrame = function(cb) {
					var _cb = function() { cb(); mozRequestAnimationFrame(_cb); }
					_cb();
				};
			} else {
				onEachFrame = function(cb) {
					setInterval(cb, 1000 / FPS);
				}
			}

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

				if(loops) Crafty.DrawList.draw();
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
	_offscreen: false,
	
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
			this.x = this._x;
			this.y = this._y;
			this.w = this._w;
			this.h = this._h;
			this.z = this._z;
			this.rotation = this._rotation;
			this.alpha = this._alpha;
			this.visible = this._visible;
			
			this.bind("enterframe", function() {
				//if there are differences
				if(this.x !== this._x || this.y !== this._y ||
				   this.w !== this._w || this.h !== this._h ||
				   this.z !== this._z || this.rotation !== this._rotation ||
				   this.alpha !== this._alpha || this.visible !== this._visible) {
					
					var old = this.mbr() || this.pos();
					
					if(this.rotation !== this._rotation) {
						this._rotate(this.rotation);
					} else {
						var mbr = this._mbr;
						if(mbr) { //check each value to see which has changed
							if(this.x !== this._x) { mbr._x -= this.x - this._x; }
							else if(this.y !== this._y) { mbr._y -= this.y - this._y; }
							else if(this.w !== this._w) { mbr._w -= this.w - this._w; }
							else if(this.h !== this._h) { mbr._h -= this.h - this._h; }
							else if(this.z !== this._z) { mbr._z -= this.z - this._z; }
						}
					}
					
					this._x = this.x;
					this._y = this.y;
					this._w = this.w;
					this._h = this.h;
					this._z = this.z;
					this._rotation = this.rotation;
					this._alpha = this.alpha;
					this._visible = this.visible;
					
					this.trigger("move", old);
					this.trigger("change", old);
				}
			});
		}
		
		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);
		Crafty.DrawList.add(this);
		
		//when object changes, update HashMap
		this.bind("move", function() {
			var area = this._mbr || this;
			this._entry.update(area);
			
			//if completely offscreen, remove from drawlist
			if(this._x + this._w < 0 - this.buffer && 
			   this._y + this._h < 0 - this.buffer && 
			   this._x > Crafty.viewport.width + this.buffer && 
			   this._y > Crafty.viewport.height + this.buffer) {
			   
				Crafty.DrawList.remove(this);
				this._offscreen = true;
			}
			
			//if within screen, add to list
			if(this._offscreen && (this._x + this._w > 0 - this.buffer && 
			   this._y + this._h > 0 - this.buffer && 
			   this._x < Crafty.viewport.width + this.buffer && 
			   this._y < Crafty.viewport.height + this.buffer)) {
				
				Crafty.DrawList.add(this);
				this._offscreen = false;
			}
		});
		
		this.bind("rotate", function(e) {
			var old = this._mbr || this;
			this._entry.update(old);
		});
		
		//when object is removed, remove from HashMap
		this.bind("remove", function() {
			Crafty.map.remove(this);
			Crafty.DrawList.remove(this);
			this.detach();
		});
		
		this.bind("change", function() {
			Crafty.DrawList.change = true;
		});
	},
	
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
		this.trigger("rotate", {cos: Math.cos(drad), sin: Math.sin(drad), deg: difference, rad: drad, o: {x: o.x, y: o.y}});
	},
	
	area: function() {
		return this._w * this._h;
	},
	
	/**
	* Does a rect intersect this
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
	
	pos: function() {
		return {
			_x: Math.floor(this._x),
			_y: Math.floor(this._y),
			_w: Math.floor(this._w),
			_h: Math.floor(this._h)
		};
	},
	
	/**
	* Is object at point
	*/
	isAt: function(x,y) {
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},
	
	move: function(dir, by) {
		if(dir.charAt(0) === 'n') this.y -= by;
		if(dir.charAt(0) === 's') this.y += by;
		if(dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if(dir === 'w' || dir.charAt(1) === 'w') this.x -= by;
		
		return this;
	},
	
	shift: function(x,y,w,h) {
		//shift by amount
		if(x) this.x += x;
		if(y) this.y += y;
		if(w) this.w += w;
		if(h) this.h += h;
		
		return this;
	},
	
	attach: function(obj) {
		function callback(e) {
			if(!e) return; //no change in position
			
			//rotation
			if(e.cos) {
				obj.rotate(e);
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
	
	mbr: function() {
		var mbr = this._mbr;
		if(!mbr) return;
		return {
			_x: mbr._x,
			_y: mbr._y,
			_w: mbr._w,
			_h: mbr._h
		};
	},
	
	rotate: function(e) {
		this._origin.x = e.o.x - this._x;
		this._origin.y = e.o.y - this._y;
		
		this._attr('_rotation', e.theta);
	},
	
	_attr: function(name,value) {	
		var pos = this.pos(),
			old = this.mbr() || pos;
		
		if(name === '_rotation') {
			this._rotate(value);
		} else if(name === '_z') {
			this._global = parseInt(value + Crafty.zeroFill(this[0], 5), 10); //magic number 10e5 is the max num of entities
			this.trigger("reorder");
		} else if(name === '_visible') {
			if(value === false) {
				Crafty.DrawList.remove(this);
			} else if(value === true) {
				Crafty.DrawList.add(this);
			}
		} else if(name !== '_alpha') {
			var mbr = this._mbr;
			if(mbr) {
				mbr[name] -= this[name] - value;
			}
			this[name] = value;
			this.trigger("move", old);
		}
		
		this[name] = value;
		
		
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

		var obj = this, hit = false;
		Crafty(this._anti).each(function() {
			//check for an intersection directly below the player
			if(this.intersect(obj.x,obj.y+1,obj.w,obj.h) && obj !== this) {
				hit = this;
			}
		});

		if(hit) { //stop falling if found
			if(this._falling) this.stopFalling(hit);
		} else {
			this._falling = true; //keep falling otherwise
		}
	},

	stopFalling: function(e) {
		if(e) this.y = e.y - this.h ; //move object

		//this._gy = -1 * this._bounce;
		this._falling = false;
		if(this.__move && this.__move.up) this.__move.up = false;
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

ITERATOR = 0;
Crafty.c("collision", {
	
	collision: function(poly) {
		//if no polygon presented, create a square
		if(!poly) {
			var area = this._mbr || this;
			poly = new Crafty.polygon([0,0],[area._w,0],[area._w,area._h],[0,area._h]);
			poly.shift(area._x, area._y);
		}
		this.map = poly;
		this.attach(this.map);
		
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
	
	onhit: function(comp, fn) {
		this.bind("enterframe", function() {
			var hitdata = this.hit(comp);
			if(hitdata) {
				fn.call(this, hitdata);
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
	
	init: function() {
		this._element = document.createElement("div");
		Crafty.stage.elem.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];
		
		this.bind("remove", this.undraw);
	},
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		this._element.style.position = 'absolute';
		return this;
	},
	
	draw: function() {
		var style = this._element.style, co;
		style.top = Math.floor(this._y) + "px";
		style.left = Math.floor(this._x) + "px";
		style.width = Math.floor(this._w) + "px";
		style.height = Math.floor(this._h) + "px";
		style.zIndex = this._z;
		style.opacity = this._alpha;
		
		if(this._mbr) {
			var rstring = "rotate("+this._rotation+"deg)",
				origin = this._origin.x + "px " + this._origin.y + "px";
			
			style.transformOrigin = origin;
			style.mozTransformOrigin = origin;
			style.webkitTransformOrigin = origin;
			style.oTransformOrigin = origin;
			
			style.transform = rstring;
			style.mozTransform = rstring;
			style.webkitTransform = rstring;
			style.oTransform = rstring;
		}
		
		this.trigger("draw", {style: style, type: "DOM"});
		
		if(this.has("sprite")) {
			co = this.__coord;
			style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
		}
		return this;
	},
	
	undraw: function() {
		Crafty.stage.elem.removeChild(this._element);
		return this;
	},
	
	css: function(obj) {
		var key, elem = this._element, style = elem.style;
		for(key in obj) {
			if(!obj.hasOwnProperty(key)) continue;
			style[key] = obj[key];
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
			result = obj.currentStyle[prop];
		else if(window.getComputedStyle)
			result = document.defaultView.getComputedStyle(obj,null).getPropertyValue(prop);
		return result;
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
				img: img,
				ready: false,
				
				init: function() {
					this.addComponent("sprite");
					
					if(this.has("canvas")) {
						//draw now
						if(this.img.complete && this.img.width > 0) {
							this.ready = true;
							this.trigger("change");
						}
					}
					this.w = this.__coord[2];
					this.h = this.__coord[3];
				},
				
				sprite: function(x,y,w,h) {
					this.__coord = [x*this.__tile+this.__padding[0],y*this.__tile+this.__padding[1],w*this.__tile || this.__tile,h*this.__tile || this.__tile];
					this.trigger("change");
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
		var afn = function(e) { var e = e || window.event; fn.call(ctx,e) };
		if(!this._events[obj+type+fn]) this._events[obj+type+fn] = afn;
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
		var afn = this._events[obj+type+fn];

		if(afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on'+type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[obj+type+fn];
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
			var old = this[axis];
			
			Crafty("2D obj").each(function() {
				var oldposition = this.pos();
				
				this[axis] -= old - v;
				//if no setter available
				if(Crafty.support.setter === false) {
					this[axis.substr(1)] = this[axis]; 
				}
				this.trigger("move",oldposition);
			});
			Crafty.DrawList.change = true;

			this[axis] = v;
		},
		
		rect: function() {
			return {_x: this._x, _y: this._y, _w: this.width, _h: this.height};
		},
		
		init: function(w,h) {
			Crafty.window.init();
			this.width = w || Crafty.window.width;
			this.height = h || Crafty.window.height;
			
			//stop scrollbars
			if(!w && !h) {
				document.body.style.overflow = "hidden";
			}
			
			Crafty.addEvent(this, window, "resize", function() {
				Crafty.window.init();
				var w, h, offset;
				this.width = w = Crafty.window.width;
				this.height = h = Crafty.window.height;
				
				Crafty.stage.elem.style.width = w;
				Crafty.stage.elem.style.width = h;
				if(Crafty._canvas) {
					Crafty._canvas.width = w;
					Crafty._canvas.height = h;
				}
				
				offset = Crafty.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});
			
			//check if stage exists
			var crstage = document.getElementById("cr-stage");
			
			//create stage div to contain everything
			Crafty.stage = {
				x: 0,
				y: 0,
				elem: (crstage ? crstage : document.createElement("div"))
			};
			
			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			elem.position = "relative";
			
			//find out the offset position of the stage
			offset = Crafty.inner(Crafty.stage.elem);
			Crafty.stage.x = offset.x;
			Crafty.stage.y = offset.y;
			
			if('__defineSetter__' in this && '__defineGetter__' in this) {
				//define getters and setters to scroll the viewport
				this.__defineSetter__('x', function(v) { this.scroll('_x', v); });
				this.__defineSetter__('y', function(v) { this.scroll('_y', v); });
				this.__defineGetter__('x', function() { return this._x; });
				this.__defineGetter__('y', function() { return this._y; });
			//IE9
			} else if('defineProperty' in Object) {
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
	keys: {'BSP':8, 'TAB':9, 'ENT':13, 'SHF':16, 'CTR':17, 'ALT':18, 'PAU':19, 'CAP':20, 'ESC':27, 'SP':32, 'PGU':33, 'PGD':34, 'END':35, 'HOM':36, 'LA':37, 'UA':38, 'RA':39, 'DA':40, 'INS':45, 'DEL':46, 'D0':48, 'D1':49, 'D2':50, 'D3':51, 'D4':52, 'D5':53, 'D6':54, 'D7':55, 'D8':56, 'D9':57, 'SEM':59, 'EQL':61, 'A':65, 'B':66, 'C':67, 'D':68, 'E':69, 'F':70, 'G':71, 'H':72, 'I':73, 'J':74, 'K':75, 'L':76, 'M':77, 'N':78, 'O':79, 'P':80, 'Q':81, 'R':82, 'S':83, 'T':84, 'U':85, 'V':86, 'W':87, 'X':88, 'Y':89, 'Z':90, 'LWN':91, 'RWN':92, 'SEL':93, 'N0':96, 'N1':97, 'N2':98, 'N3':99, 'N4':100, 'N5':101, 'N6':102, 'N7':103, 'N8':104, 'N9':105, 'MUL':106, 'ADD':107, 'SUB':109, 'DEC':110, 'DIV':111, 'F1':112, 'F2':113, 'F3':114, 'F4':115, 'F5':116, 'F6':117, 'F7':118, 'F8':119, 'F9':120, 'F10':121, 'F11':122, 'F12':123, 'NUM':144, 'SCR':145, 'COM':188, 'PER':190, 'FSL':191, 'ACC':192, 'OBR':219, 'BSL':220, 'CBR':221, 'QOT':222}
});

/**
* Test support for various javascript and HTML features
*/
Crafty.onload(this, function() {
	Crafty.support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);
	Crafty.support.defineProperty = ('defineProperty' in Object);
	Crafty.support.audio = ('Audio' in window);
});

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
		this.bind("reorder", function() {
			Crafty.DrawList.resort();
		});
	},
	
	draw: function() {
		if(!this.ready) return;
		
		var pos = { //inlined pos() function, for speed
				_x: Math.floor(this._x),
				_y: Math.floor(this._y),
				_w: Math.floor(this._w),
				_h: Math.floor(this._h)
			},
			context = Crafty.context;
			
		if(this._mbr) {
			context.save();
			
			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;
			
			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		if(this._alpha > 0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}
		
		//inline drawing of the sprite
		if(this.__c.sprite) {
			var coord = this.__coord;
			
			//draw the image on the canvas element
			context.drawImage(this.img, //image element
									 coord[0], //x position on sprite
									 coord[1], //y position on sprite
									 coord[2], //width on sprite
									 coord[3], //height on sprite
									 pos._x, //x position on canvas
									 pos._y, //y position on canvas
									 pos._w, //width on canvas
									 pos._h //height on canvas
			);
		} else {
			this.trigger("draw", {type: "canvas", pos: pos});
		}
		
		if(this._mbr) {
			context.restore();
		}
		if(this._alpha > 0) {
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
		var elem = document.createElement("canvas");
		
		this.stage.elem.appendChild(elem);
		
		//check if is an actual canvas element
		if(!('getContext' in elem)) {
			Crafty.trigger("nocanvas");
			return;
		}
		
		this.context = elem.getContext('2d');
		this._canvas = elem;
		
		//set canvas and viewport to the final dimensions
		elem.width = this.viewport.width;
		elem.height = this.viewport.height;
		elem.style.position = "absolute";
	}
});

Crafty.extend({
	down: null, //object mousedown, waiting for up
	over: null, //object mouseover, waiting for out
		
	mouseDispatch: function(e) {
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
			this.trigger(e.type, e);
		}
		
		Crafty.addEvent(this, "keydown", dispatch);
		Crafty.addEvent(this, "keyup", dispatch);
		
		//remove events
		this.bind("remove", function() {
			Crafty.removeEvent(this, "keydown", dispatch);
			Crafty.removeEvent(this, "keyup", dispatch);
		});
	},
	
	preventTypeaheadFind: function(e) {
		if(!(e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) && e.preventDefault){
			e.preventDefault();
		}
		return this;
 	}
});

Crafty.c("fourway", {
	__move: {left: false, right: false, up: false, down: false},	
	_speed: 3,
	
	init: function() {
		if(!this.has("controls")) this.addComponent("controls");
	},
	
	fourway: function(speed) {
		if(speed) this._speed = speed;
		var move = this.__move;
		
		this.bind("enterframe", function() {
			var old = this.pos(),
				changed = false;
			if(move.right) {
				this.x += this._speed;
				changed = true;
			}
			if(move.left) {
				this.x -= this._speed;
				changed = true;
			}
			if(move.up) {
				this.y -= this._speed;
				changed = true;
			}
			if(move.down) {
				this.y += this._speed;
				changed = true;
			}
		}).bind("keydown", function(e) {
			if(e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.D) {
				move.right = true;
			}
			if(e.keyCode === Crafty.keys.LA || e.keyCode === Crafty.keys.A) {
				move.left = true;
			}
			if(e.keyCode === Crafty.keys.UA || e.keyCode === Crafty.keys.W) {
				move.up = true;
			}
			if(e.keyCode === Crafty.keys.DA || e.keyCode === Crafty.keys.S) {
				move.down = true;
			}
			this.preventTypeaheadFind(e);
		}).bind("keyup", function(e) {
			if(e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.D) {
				move.right = false;
			}
			if(e.keyCode === Crafty.keys.LA || e.keyCode === Crafty.keys.A) {
				move.left = false;
			}
			if(e.keyCode === Crafty.keys.UA || e.keyCode === Crafty.keys.W) {
				move.up = false;
			}
			if(e.keyCode === Crafty.keys.DA || e.keyCode === Crafty.keys.S) {
				move.down = false;
			}
			this.preventTypeaheadFind(e);
		});
		
		return this;
	}
});

Crafty.c("twoway", {
	__move: {left: false, right: false, up: false, falling: false},
	_speed: 3,
	
	init: function() {
		if(!this.has("controls")) this.addComponent("controls");
	},
	
	twoway: function(speed,jump) {
		if(speed) this._speed = speed;
		jump = jump || this._speed * 2;
		
		var move = this.__move;
		
		this.bind("enterframe", function() {
			var old = this.pos(),
				changed = false;
			if(move.right) {
				this.x += this._speed;
				changed = true;
			}
			if(move.left) {
				this.x -= this._speed;
				changed = true;
			}
			if(move.up) {
				this.y -= jump;
				this._falling = true;
				changed = true;
			}
		}).bind("keydown", function(e) {
			if(e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.D) {
				move.right = true;
			}
			if(e.keyCode === Crafty.keys.LA || e.keyCode === Crafty.keys.A) {
				move.left = true;
			}
			if(e.keyCode === Crafty.keys.UA || e.keyCode === Crafty.keys.W) {
				move.up = true;
			}
		}).bind("keyup", function(e) {
			if(e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.D) {
				move.right = false;
			}
			if(e.keyCode === Crafty.keys.LA || e.keyCode === Crafty.keys.A) {
				move.left = false;
			}
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
	_reels: {},
	_frame: null,
	_current: null,

	animate: function(id, fromx, y, tox) {
		//play a reel
		if(arguments.length === 2 && typeof fromx === "number") {
			//make sure not currently animating
			this._current = id;
			
			var reel = this._reels[id],
				duration = fromx;
			this._frame = {
				reel: reel, //reel to play
				frameTime: Math.ceil(duration / reel.length), //number of frames inbetween slides
				frame: 0, //current slide/frame
				current: 0
			};
			
			this.bind("enterframe", this.drawFrame);
			return this;
		}
		if(typeof fromx === "number") {
			var frames = tox + 1 - fromx, i = fromx,
				reel = [],
				tile = this.__tile;
			for(;i<=tox;i++) {
				reel.push([i * tile, y * tile]);
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
			this.stop();
			return;
		}
		
		this.trigger("change");
	},
	
	stop: function() {
		this.unbind("enterframe", this.drawFrame);
		this._current = null;
		this._frame = null;
		
		return this;
	},
	
	isPlaying: function(id) {
		if(!id) return !!this._interval;
		return this._current === id; 
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
				if(this._color) Crafty.context.fillStyle = this._color;
				Crafty.context.fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
			}
		});
	},
	
	color: function(color) {
		this._color = color;
		this.trigger("change");
		return this;
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
		this._repeat = repeat || "repeat";
		
		if(this.has("canvas")) {
			this.img = Crafty.assets[url];
			if(!this.img) {
				this.img = new Image();
				Crafty.assets[url] = this.img;
				this.img.src = url;
				var self = this;
				
				this.img.onload = function() {
					self._pattern = Crafty.context.createPattern(self.img, self._repeat);
					self.ready = true;
					self.trigger("change");
				};
				
				return this;
			} else {
				this.ready = true;
				this._pattern = Crafty.context.createPattern(this.img, this._repeat);
					
			}
		}
		this.trigger("change");
		
		return this;
	},
	
	canvasDraw: function(e) {
		//skip if no image
		if(!this.ready || !this._pattern) return;
		
		var context = Crafty.context;
		
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
	}
});

Crafty.DrawList = (function() {
	var list = [];
	
	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(obj, start) {
			for (var i = (start || 0), j = this.length; i < j; i++) {
				if (this[i] == obj) { return i; }
			}
			return -1;
		};
	}
	
	return {
		add: function add(obj) {
			if(list.indexOf(obj) === -1) {
				list.push(obj);
				list.sort(function(a,b) { return a._global - b._global; });
			}
		},
		
		remove: function remove(obj) {
			var index = list.indexOf(obj);
			if(index !== -1) {
				list.splice(index, 1);
			}
		},
		
		draw: function draw() {
			if(!this.change) return; //only draw if something changed
			
			if(Crafty.context) Crafty.context.clearRect(0,0, Crafty._canvas.width, Crafty._canvas.height);
			var i = 0, l = list.length;
			for(;i<l;i++) {
				if(!list[i] || !('draw' in list[i])) {
					this.remove(list[i]);
					continue;
				}
				list[i].draw();
			}
			this.change = false;
		},
		
		resort: function resort() {
			list.sort(function(a,b) { return a._global - b._global; });
		},
		
		debug: function() { return list; },
		
		change: false
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
			if(!Crafty.support.audio) return;
			
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
			this._elems[key] = sounds;
			if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
			
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
				}
			};
		}
	}
});

})(Crafty,window,window.document);

