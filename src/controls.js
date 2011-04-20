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
			i = 0, l,
			pos = Crafty.DOM.translate(e.clientX, e.clientY),
			x, y;
		
		e.realX = x = pos.x;
		e.realY = y = pos.y;
		
		//search for all mouse entities
		q = Crafty.map.search({_x: x, _y:y, _w:1, _h:1});
		
		for(l=q.length;i<l;++i) {
			//check if has mouse component
			if(!q[i].has("Mouse")) continue;
			
			var current = q[i],
				flag = false;
			
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
				this.down.trigger('mousedown', e);
			} else if(e.type === "mouseup") {
				closest.trigger("mouseup", e);
				
				//check that down exists and this is down
				if(this.down && closest === this.down) {
					this.down.trigger("click", e);
				}
				
				//reset down
				this.down = null;
			} else if(e.type === "mousemove") {
				if(this.over !== closest) { //if new mousemove, it is over
					if(this.over) {
						this.over.trigger("mouseout", e); //if over wasn't null, send mouseout
						this.over = null;
					}
					this.over = closest;
					closest.trigger("mouseover", e);
				}
			} else closest.trigger(e.type, e); //trigger whatever it is
		} else {
			if(e.type === "mousemove" && this.over) {
				this.over.trigger("mouseout", e);
				this.over = null;
			}
		}
	}
});

//initialize the mouse events onload
Crafty.bind("Load", function() {
	Crafty.addEvent(this, Crafty.stage.elem, "mousedown", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mouseup", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mousemove", Crafty.mouseDispatch);
	
	Crafty.addEvent(this, Crafty.stage.elem, "touchstart", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchmove", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchend", Crafty.mouseDispatch);
});

/**@
* #Mouse
* @category Input
* Give entities mouse events such as 
* `mouseover`, `mousedown`, `mouseout`, `mouseup` and `click`.
*/
Crafty.c("Mouse", {
	init: function() {
		Crafty.mouseObjs++;
		this.bind("remove", function() {
			Crafty.mouseObjs--;
		});
	},
	
	/**@
	* #.areaMap
	* @comp Mouse
	* @sign public this .areaMap(Crafty.Polygon polygon)
	* @param polygon - Instance of Crafty.Polygon used to check if the mouse coordinates are inside this region
	* @sign public this .areaMap(Array point1, .., Array pointN)
	* @param point# - Array with an `x` and `y` position to generate a polygon
	* Assign a polygon to the entity so that mouse events will only be triggered if
	* the coordinates are inside the given polygon.
	* @see Crafty.Polygon
	*/
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

/**@
* #Draggable
* @category Input
* Give the ability to drag and drop the entity.
*/
Crafty.c("Draggable", {
	_startX: 0,
	_startY: 0,
	_dragging: false,
	
	_ondrag: null,
	_ondown: null,
	_onup: null,
	
	init: function() {
		this.requires("Mouse");
		this._ondrag = function() {
			var pos = Crafty.DOM.translate(e.clientX, e.clientY);
			this.x = pos.x - this._startX;
			this.y = pos.y - this._startY;
			
			this.trigger("Dragging", e);
		};
		
		this._ondown = function(e) {
			//start drag
			this._startX = e.realX - this._x;
			this._startY = e.realY - this._y;
			this._dragging = true;
			
			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			this.trigger("StartDrag", e);
		};
		
		this._onup = function upper(e) {
			Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);
			this._dragging = false;
			this.trigger("StopDrag", e);
		}
		
		this.startDrag();
	},
	
	/**@
	* #.stopDrag
	* @comp Draggable
	* @sign public this .stopDrag(void)
	* Stop the entity from dragging. Essentially reproducing the drop.
	* @see .startDrag
	*/
	stopDrag: function() {
		Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
		Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);
		
		this._dragging = false;
		this.trigger("StopDrag");
		return this;
	},
	
	/**@
	* #.startDrag
	* @comp Draggable
	* @sign public this .startDrag(void)
	* Make the entity follow the mouse positions.
	* @see .stopDrag
	*/
	startDrag: function() {
		if(!this._dragging) {
			this._dragging = true;
			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
		}
	},
	
	/**@
	* #.enableDrag
	* @comp Draggable
	* @sign public this .enableDrag(void)
	* Rebind the mouse events. Use if `.disableDrag` has been called.
	* @see .disableDrag
	*/
	enableDrag: function() {		
		this.bind("mousedown", this._ondown);
		
		Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
		return this;
	},
	
	/**@
	* #.disableDrag
	* @comp Draggable
	* @sign public this .disableDrag(void)
	* Stops entity from being draggable. Reenable with `.enableDrag()`.
	* @see .enableDrag
	*/
	disableDrag: function() {
		this.unbind("mousedown", this._ondown);
		this.stopDrag();
		return this;
	}
});

/**@
* #Keyboard
* @category Input
* Give entities keyboard events (`keydown` and `keyup`).
*/
Crafty.c("Keyboard", {
	init: function() {
		function dispatch(e) {
			e.key = e.keyCode || e.which;
			if(e.type === "keydown") {
				Crafty.keydown[e.key] = true;
				this.trigger("KeyDown", e);
			} else if(e.type === "keyup") {
				delete Crafty.keydown[e.key];
				this.trigger("KeyUp", e);
			}
			
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
	
	/**@
	* #.isDown
	* @comp Keyboard
	* @sign public Boolean isDown(String keyName)
	* @param keyName - Name of the key to check. See `Crafty.keys`.
	* @sign public Boolean isDown(Number keyCode)
	* @param keyCode - Key code in `Crafty.keys`.
	* Determine if a certain key is currently down.
	*/
	isDown: function(key) {
		if(typeof key === "string") {
			key = Crafty.keys[key];
		}
		return !!Crafty.keydown[key];
	}
});

/**@
* #Fourway
* @category Input
* Move an entity in four directions by using the
* arrow keys or `W`, `A`, `S`, `D`.
*/
Crafty.c("Fourway", {	
	_speed: 3,
	
	init: function() {
		this.requires("Keyboard");
	},
	
	/**@
	* #.fourway
	* @comp Fourway
	* @sign public this .fourway(Number speed)
	* @param speed - Amount of pixels to move the entity whilst a key is down
	* Constructor to initialize the speed. Component will listen for key events and move the entity appropriately. 
	* This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
	*
	* The key presses will move the entity in that direction by the speed passed in the argument.
	*/
	fourway: function(speed) {
		if(speed) this._speed = speed;
		
		this.bind("enterframe", function() {
			if (this.disableControls) return;
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

/**@
* #Twoway
* @category Input
* Move an entity in two directions: left or right as well as
* jump.
*/
Crafty.c("Twoway", {
	_speed: 3,
	_up: false,
	
	init: function() {
		this.requires("Keyboard");
	},
	
	/**@
	* #.twoway
	* @comp Twoway
	* @sign public this .twoway(Number speed[, Number jumpSpeed])
	* @param speed - Amount of pixels to move left or right
	* @param jumpSpeed - How high the entity should jump
	* Constructor to initialize the speed and power of jump. Component will 
	* listen for key events and move the entity appropriately. This includes 
	* `Up Arrow`, `Right Arrow`, `Left Arrow` as well as W, A, D. Used with the 
	* `gravity` component to simulate jumping.
	*
	* The key presses will move the entity in that direction by the speed passed in 
	* the argument. Pressing the `Up Arrow` or `W` will cause the entiy to jump.
	* @see Gravity, Fourway
	*/
	twoway: function(speed,jump) {
		if(speed) this._speed = speed;
		jump = jump || this._speed * 2;
		
		this.bind("enterframe", function() {
			if (this.disableControls) return;
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
