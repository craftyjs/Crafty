Crafty.map = new Crafty.HashMap();

Crafty.c("2D", {
	_x: 0,
	_y: 0,
	_w: 0,
	_h: 0,
	_z: 0,
	_entry: null,
	
	init: function() {
		if('__defineSetter__' in this && '__defineGetter__' in this) {
			//create getters and setters on x,y,w,h,z
			this.__defineSetter__('x', function(v) { this._attr('_x',v); });
			this.__defineSetter__('y', function(v) { this._attr('_y',v); });
			this.__defineSetter__('w', function(v) { this._attr('_w',v); });
			this.__defineSetter__('h', function(v) { this._attr('_h',v); });
			this.__defineSetter__('z', function(v) { this._attr('_z',v); });
			
			this.__defineGetter__('x', function() { return this._x; });
			this.__defineGetter__('y', function() { return this._y; });
			this.__defineGetter__('w', function() { return this._w; });
			this.__defineGetter__('h', function() { return this._h; });
			this.__defineGetter__('z', function() { return this._z; });
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
		});
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
		if(Crafty.settings.setter !== false) {
			if(dir.charAt(0) === 'n') this.y -= by;
			if(dir.charAt(0) === 's') this.y += by;
			if(dir === 'e' || dir.charAt(1) === 'e') this.x += by;
			if(dir === 'w' || dir.charAt(1) === 'w') this.x -= by;
		} else {
			var old = this.pos();
			if(dir.charAt(0) === 'n') this.y(this._y - by);
			if(dir.charAt(0) === 's') this.y(this._y + by);
			if(dir === 'e' || dir.charAt(1) === 'e') this.x(this._x + by);
			if(dir === 'w' || dir.charAt(1) === 'w') this.x(this._x - by);
			this.trigger("move", old);
			this.trigger("change", old);
		}
	},
	
	shift: function(x,y,w,h) {
		//shift by amount
		if(x) this.x += x;
		if(y) this.y += y;
		if(w) this.w += w;
		if(h) this.h += h;
	},
	
	attatch: function(obj) {
		//attach obj to this so when this moves, move by same amount
		this.bind("move", function(e) {
			if(!e) return; //no change in position
			
			var dx = this.x - e._x,
				dy = this.y - e._y,
				dw = this.w - e._w,
				dh = this.h - e._h;
			
			obj.shift(dx,dy,dw,dh);
		});
	},
	
	_attr: function(name,value) {	
		var old = this.pos();
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
		this._anti = comp;
		
		this.bind("enterframe", function() {
			if(this._falling) {
				//if falling, move the players Y
				this._gy += this._gravity * 2;
				this.y += this._gy;
			} else {
				this._gy = 0; //reset change in y
			}
			
			var obj = this, hit = false;
			Crafty(comp).each(function() {
				//check for an intersection directly below the player
				if(this.intersect(obj.x,obj.y+1,obj.w,obj.h)) {
					hit = this;
				}
			});
			
			if(hit) { //stop falling if found
				if(this._falling) this.stopFalling(hit);
			} else {
				this._falling = true; //keep falling otherwise
			}
		});
		
		return this;
	},
	
	stopFalling: function(e) {
		if(e) this.y = e.y - this.h ; //move object
		
		//this._gy = -1 * this._bounce;
		this._falling = false;
		if(this.__move && this.__move.up) this.__move.up = false;
		this.trigger("hit");
	}
});

Crafty.c("collision", {
	collision: function(comp, fn) {
		var obj = this;
		//on change, check for collision
		this.bind("enterframe", function() {
			//for each collidable entity
			if(typeof comp === "string") {
				Crafty(comp).each(function() {
					if(this.intersect(obj)) { //check intersection
						fn.call(obj,this);
					}
				});
			} else if(typeof comp === "object") {
				if(comp.intersect(obj)) {
					fn.call(obj,comp);
				}
			}
		});
		
		return this;
	}
});