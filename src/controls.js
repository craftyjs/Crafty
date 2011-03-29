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
