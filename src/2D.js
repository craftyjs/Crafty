Crafty.map = new Crafty.HashMap();

Crafty.c("2D", {
	_x: 0,
	_y: 0,
	_w: 0,
	_h: 0,
	_z: 0,
	_rotation: 0,
	_origin: {x: 0, y: 0},
	_mbr: null,
	_entry: null,
	_attachy: [],
	
	init: function() {
		if(Crafty.support.setter) {
			//create getters and setters on x,y,w,h,z
			this.__defineSetter__('x', function(v) { this._attr('_x',v); });
			this.__defineSetter__('y', function(v) { this._attr('_y',v); });
			this.__defineSetter__('w', function(v) { this._attr('_w',v); });
			this.__defineSetter__('h', function(v) { this._attr('_h',v); });
			this.__defineSetter__('z', function(v) { this._attr('_z',v); });
			
			this.__defineSetter__('rotation', function(v) { this._attr('_rotation', v); });
			
			this.__defineGetter__('x', function() { return this._x; });
			this.__defineGetter__('y', function() { return this._y; });
			this.__defineGetter__('w', function() { return this._w; });
			this.__defineGetter__('h', function() { return this._h; });
			this.__defineGetter__('z', function() { return this._z; });
			this.__defineGetter__('rotation', function() { return this._rotation; });
		} else {
			/*
			if no setters, check on every frame for a difference 
			between this._(x|y|w|h|z) and this.(x|y|w|h|z)
			*/
			this.x = this._x;
			this.y = this._y;
			this.w = this._w;
			this.h = this._h;
			this.z = this._z;
			
			this.bind("enterframe", function() {
				if(this.x !== this._x || this.y !== this._y ||
				   this.w !== this._w || this.h !== this._h ||
				   this.z !== this._z) {
					
					var old = this.pos();
					this._x = this.x;
					this._y = this.y;
					this._w = this.w;
					this._h = this.h;
					this._z = this.z;
					
					this.trigger("move", old);
					this.trigger("change", old);
				}
			});
		}
		
		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);
		
		//when object changes, update HashMap
		this.bind("move", function() {
			this._entry.update(this);
		});
		
		//when object is removed, remove from HashMap
		this.bind("remove", function() {
			Crafty.map.remove(this);
			this.detach();
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
		var rect;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return this._x < rect.x + rect.w && this._x + this._w > rect.x &&
			   this._y < rect.y + rect.h && this._h + this._y > rect.y;
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
			
			
		} else if(x > this._w || y > this._h || x < 0 || y < 0) return;
		
		var o = this._origin;
		o.x = x;
		o.y = y;
		
		return this;
	},
	
	_attr: function(name,value) {	
		var old = this._mbr || this.pos();
		
		if(name === '_rotation') {
			this._rotate(value);
		} else {
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

Crafty.c("gravity", {
	_gravity: 0.2,
	_gy: 0,
	_bounce: 0.8,
	_friction: 0.8,
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
		
		return this;
	},
	
	antigravity: function() {
		this.unbind("enterframe", this._enterframe);
		return this;
	}
});

Crafty.c("collision", {
	_collided: false,
	
	collision: function(comp, fn, fnoff) {
		var obj = this,
			found = false;
			
		//on change, check for collision
		this.bind("enterframe", function() {
			//for each collidable entity
			if(typeof comp === "string") {
				found = false;
				
				Crafty(comp).each(function() {
					if(this.intersect(obj)) { //check intersection
						obj._collided = true;
						found = this;
					}
				});
				
				if(found) {
					fn.call(this, found);
				} else {
					if(fnoff && this._collided) {
						fnoff.call(this);
					}
				}
			} else if(typeof comp === "object") {
				if(comp.intersect(obj)) {
					fn.call(obj,comp);
				}
			}
		});
		
		return this;
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
	}
};