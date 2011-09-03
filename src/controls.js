Crafty.extend({
	down: null, //object mousedown, waiting for up
	over: null, //object mouseover, waiting for out
	mouseObjs: 0,
	mousePos: {},
	lastEvent: null,
	keydown: {},
		
	mouseDispatch: function(e) {
		if(!Crafty.mouseObjs) return;
		Crafty.lastEvent = e;
		
		var maxz = -1,
			closest,
			q,
			i = 0, l,
			pos = Crafty.DOM.translate(e.clientX, e.clientY),
			x, y,
			dupes = {},
			tar = e.target?e.target:e.srcElement,
			type = e.type;
			
		if(type === "touchstart") type = "mousedown";
		else if(type === "touchmove") type = "mousemove";
		else if(type === "touchend") type = "mouseup";
		
		e.realX = x = Crafty.mousePos.x = pos.x;
		e.realY = y = Crafty.mousePos.y = pos.y;
		
		if(tar.nodeName != "CANVAS") {
			// we clicked on a dom element
			while (typeof (tar.id) != 'string' && tar.id.indexOf('ent') == -1) {
				tar = tar.parentNode;
			}
			ent = Crafty(parseInt(tar.id.replace('ent', '')))
			if (ent.has('Mouse') && ent.isAt(x,y))
				closest = ent;
		}
		
		if(!closest) {
			//search for all mouse entities
			q = Crafty.map.search({_x: x, _y:y, _w:1, _h:1}, false);
			
			for(l=q.length;i<l;++i) {
				//check if has mouse component
				if(!q[i].__c.Mouse) continue;
				
				var current = q[i],
					flag = false;
					
				//weed out duplicates
				if(dupes[current[0]]) continue;
				else dupes[current[0]] = true;
				
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
					maxz = current._z;
					closest = current;
				}
			}
		}
		
		//found closest object to mouse
		if(closest) {
			//click must mousedown and out on tile
			if(type === "mousedown") {
				this.down = closest;
				this.down.trigger("MouseDown", e);
			} else if(type === "mouseup") {
				closest.trigger("MouseUp", e);
				
				//check that down exists and this is down
				if(this.down && closest === this.down) {
					this.down.trigger("Click", e);
				}
				
				//reset down
				this.down = null;
			} else if(type === "mousemove") {
				if(this.over !== closest) { //if new mousemove, it is over
					if(this.over) {
						this.over.trigger("MouseOut", e); //if over wasn't null, send mouseout
						this.over = null;
					}
					this.over = closest;
					closest.trigger("MouseOver", e);
				}
			} else closest.trigger(type, e); //trigger whatever it is
		} else {
			if(type === "mousemove" && this.over) {
				this.over.trigger("MouseOut", e);
				this.over = null;
			}
		}
		
		if (type === "mousemove") {
			this.lastEvent = e;
		}
	},
	
	keyboardDispatch: function(e) {
		e.key = e.keyCode || e.which;
		if(e.type === "keydown") {
			if(Crafty.keydown[e.key] !== true) {
				Crafty.keydown[e.key] = true;
				Crafty.trigger("KeyDown", e);
			}
		} else if(e.type === "keyup") {
			delete Crafty.keydown[e.key];
			Crafty.trigger("KeyUp", e);
		}
		
		//prevent searchable keys
		/*
		if((e.metaKey || e.altKey || e.ctrlKey) && !(e.key == 8 || e.key >= 112 && e.key <= 135)) {
			console.log(e);
			if(e.preventDefault) e.preventDefault();
			else e.returnValue = false;
			return false;
		}*/
	}
});

//initialize the input events onload
Crafty.bind("Load", function() {
	Crafty.addEvent(this, "keydown", Crafty.keyboardDispatch);
	Crafty.addEvent(this, "keyup", Crafty.keyboardDispatch);
        
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
		this.bind("Remove", function() {
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
		this._ondrag = function(e) {
			var pos = Crafty.DOM.translate(e.clientX, e.clientY);
			this.x = pos.x - this._startX;
			this.y = pos.y - this._startY;
			
			this.trigger("Dragging", e);
		};
		
		this._ondown = function(e) {
			if(e.button !== 0) return;
			
			//start drag
			this._startX = e.realX - this._x;
			this._startY = e.realY - this._y;
			this._dragging = true;
			
			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
			this.trigger("StartDrag", e);
		};
		
		this._onup = function upper(e) {
			Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);
			this._dragging = false;
			this.trigger("StopDrag", e);
		};
		
		this.enableDrag();
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
		this.bind("MouseDown", this._ondown);
		
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
		this.unbind("MouseDown", this._ondown);
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
* #Multiway
* @category Input
* Used to bind keys to directions and have the entity move acordingly 
*/
Crafty.c("Multiway", {	
	_speed: 3,
        
	init: function() {
            this._keyDirection = {};
            this._keys = {};
            this._movement= { x: 0, y: 0};
	},
	
	/**@
	* #.multiway
	* @comp Multiway
	* @sign public this .multiway([Number speed,] Object keyBindings )
	* @param speed - Amount of pixels to move the entity whilst a key is down
	* @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
	* Constructor to initialize the speed and keyBindings. Component will listen for key events and move the entity appropriately. 
	*
	* When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
	* When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
	* @example
	* ~~~
	* this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
	* this.multiway({W: -90, S: 90, D: 0, A: 180});
	* ~~~
	*/
	multiway: function(speed, keys) {
		if(keys){
			this._speed = speed;
		} else {
			keys = speed;
		}
		
		this._keyDirection = keys;
		this.speed(this._speed);

		this.bind("KeyDown", function(e) {
			if(this._keys[e.key]) {
				this._movement.x = Math.round((this._movement.x + this._keys[e.key].x)*1000)/1000;
				this._movement.y = Math.round((this._movement.y + this._keys[e.key].y)*1000)/1000;
				this.trigger('NewDirection', this._movement);
			}
		})
		.bind("KeyUp", function(e) {
			if(this._keys[e.key]) {
				this._movement.x = Math.round((this._movement.x - this._keys[e.key].x)*1000)/1000;
				this._movement.y = Math.round((this._movement.y - this._keys[e.key].y)*1000)/1000;
				this.trigger('NewDirection', this._movement);
			}
		})
		.bind("EnterFrame",function() {
			if (this.disableControls) return;
	
			if(this._movement.x !== 0) {
				this.x += this._movement.x;
				this.trigger('Moved', {x: this.x - this._movement.x, y: this.y});
			}
			if(this._movement.y !== 0) {
				this.y += this._movement.y;
				this.trigger('Moved', {x: this.x, y: this.y - this._movement.y});
			}
		});

        //Apply movement if key is down when created
        for(var k in keys) {
            if(Crafty.keydown[Crafty.keys[k]]) {
                this.trigger("KeyDown", {key: Crafty.keys[k] });
            }
        }
		
		return this;
	},
        
    speed: function(speed) {
        for(var k in this._keyDirection) {
            var keyCode = Crafty.keys[k] || k;
            this._keys[keyCode] = { 
                x: Math.round(Math.cos(this._keyDirection[k]*(Math.PI/180))*1000 * speed)/1000,
                y: Math.round(Math.sin(this._keyDirection[k]*(Math.PI/180))*1000 * speed)/1000
            };
        }
        return this;
    }
});

/**@
* #Fourway
* @category Input
* Move an entity in four directions by using the
* arrow keys or `W`, `A`, `S`, `D`.
*/
Crafty.c("Fourway", {	
	
	init: function() {
		this.requires("Multiway");
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
		this.multiway(speed, { 
            UP_ARROW: -90, 
            DOWN_ARROW: 90, 
            RIGHT_ARROW: 0, 
            LEFT_ARROW: 180,
            W: -90, 
            S: 90, 
            D: 0, 
            A: 180
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
		
		this.bind("EnterFrame", function() {
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
		}).bind("KeyDown", function() {
			if(this.isDown("UP_ARROW") || this.isDown("W")) this._up = true;
		});
		
		return this;
	}
});
