Crafty.extend({
	down: null, //object mousedown, waiting for up
	over: null, //object mouseover, waiting for out
	mouseObjs: 0,
	keydown: {},
		
	mouseDispatch: function(e) {
		if(!this.mouseObjs) return;
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
