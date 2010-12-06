Crafty.map = new Crafty.HashMap();

Crafty.c("2D", {
	_x: 0,
	_y: 0,
	_w: 0,
	_h: 0,
	_z: 0,
	_entry: null,
	
	init: function() {
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
		
		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);
		
		//when object changes, update HashMap
		this.bind("change", function() {
			this._entry.update(this);
		});
		
		//when object is removed, remove from HashMap
		this.bind("remove", function() {
			Crafty.map.remove(this);
		});
	},
	
	area: function() {
		return this.w * this.h;
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
		
		return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
			   this.y < rect.y + rect.h && this.h + this.y > rect.y;
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
			x: Math.ceil(this.x),
			y: Math.ceil(this.y),
			w: Math.ceil(this.w),
			h: Math.ceil(this.h)
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
	},
	
	_attr: function(name,value) {
		if(arguments.length === 1) return this[name];
		
		var old = this.pos();
		
		this[name] = value;
		this.trigger("change", old);
	},
	
	set x(val) { this._attr("_x",val); },
	set y(val) { this._attr("_y",val); },
	set w(val) { this._attr("_w",val); },
	set h(val) { this._attr("_h",val); },
	set z(val) { this._attr("_z",val); },
	get x() { return this._x; },
	get y() { return this._y; },
	get w() { return this._w; },
	get h() { return this._h; },
	get z() { return this._z; }
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
		
		this._gy = -1 * this._bounce;
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