Crafty.map = new Crafty.HashMap();

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
			this._entry.update(this);
			
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
			rad = theta * (Math.PI / 180),
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
		//update coords
		
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
			
			var dx = this.x - e._x,
				dy = this.y - e._y,
				dw = this.w - e._w,
				dh = this.h - e._h;
			
			obj.shift(dx,dy,dw,dh);
		}
		
		//attach obj to this so when this moves, move by same amount
		this.bind("move", callback);
		
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
	
	_attr: function(name,value) {	
		var old = this.mbr() || this.pos();
		
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
		}
		
		this[name] = value;
		
		this.trigger("move", old);
		this.trigger("change", old);
	}
});

Crafty.c("collision", {
	_collided: false,
	
	hit: function(comp) {
		var area = this._mbr || this,
			results = Crafty.map.search(area, false),
			i = 0, l = results.length,
			dupes = {},
			id, obj, key,
			hasMap = ('map' in this && 'containsPoint' in this.map),
			finalresult = [];
		
		if(!l) {
			return false;
		}
		
		for(;i<l;++i) {
			obj = results[i];
			if(!obj) continue;
			id = obj[0];
			
			//check if not added to hash and that actually intersects
			if(!dupes[id] && obj.__c[comp] && obj.x < area.x + area.w && obj.x + obj.w > area.x &&
							 obj.y < area.y + area.h && obj.h + obj.y > area.y) 
			   dupes[id] = obj;
		}
		
		for(key in dupes) {
			obj = dupes[key];
			
			if(hasMap && 'map' in obj) {
				finalresult.push(this.SAT(this.map, obj.map));
			} else {
				finalresult.push(obj);
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
			//console.log(hitdata);
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
			MTV,
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
			if(interval > MTV) MTV = interval;
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
			if(interval > MTV) MTV = interval;
		}
		
		return {overlap: MTV};
	}
});

Crafty.c("physics", {
	
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
	}
};