/*************************************
Native Components for Crafty Library

TODO:
	- Collision
	- Inventory
	- Items
	- Lighting
	- Particles
	- TerrainGen
	- Map
	- Animation
	- Sound
	
*************************************/
(function(Crafty) {

Crafty.c("2D", {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	z: 0,
	
	area: function() {
		return this.w * this.h;
	},
	
	/**
	* Does a rect intersect this
	*/
	intersect: function(rect) {
		//rect must have x,y,w,h
		return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
			   this.y < rect.y + rect.h && this.h + this.y > rect.y;
	},
	
	/**
	* Is object at point
	*/
	isAt: function(x,y) {
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},
	
	move: function(dir, by) {
		this.trigger("change");
		if(dir.charAt(0) === 'n') this.y -= by;
		if(dir.charAt(0) === 's') this.y += by;
		if(dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if(dir === 'w' || dir.charAt(1) === 'w') this.x -= by;
	}
});

Crafty.c("gravity", {
	_gravity: 0.2,
	_gy: 0,
	
	init: function() {
		if(!this.has("2D")) this.addComponent("2D");
		this.bind("enterframe", function() {
			this.trigger("change");
			this._gy += this._gravity * 2;
			this.y += this._gy;
		});
	}
});

Crafty.c("DOM", {
	_element: null,
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		this._element.style.position = 'absolute';
		return this;
	},
	
	draw: function() {
		this._element.style.top = Math.ceil(this.y) + "px";
		this._element.style.left = Math.ceil(this.x) + "px";
	}
});

/********************
* UTILITY EXTENSIONS
*********************/
Crafty.extend({
	tile: 16,
	
	/**
	* Sprite generator.
	*
	* Extends Crafty for producing components
	* based on sprites and tiles
	*/
	sprite: function(tile, url, map) {
		var pos, temp, x, y, w, h;
		
		//if no tile value, default to 16
		if(typeof tile === "string") {
			map = url;
			url = tile;
			tile = 16;
		}
		this.tile = tile;
		
		for(pos in map) {
			if(!map.hasOwnProperty(pos)) continue;
			
			temp = map[pos];
			x = temp[0] * tile;
			y = temp[1] * tile;
			w = temp[2] * tile || tile;
			h = temp[3] * tile || tile;
			
			//create a component
			Crafty.c(pos, {
				__image: url,
				__coord: [x,y,w,h]
			});
		}
		
		return this;
	},
	
	/**
	* Window Events credited to John Resig
	* http://ejohn.org/projects/flexible-javascript-events
	*/
	addEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window;
		}
		if (obj.attachEvent ) {
			obj['e'+type+fn] = fn;
			obj[type+fn] = function(){ obj['e'+type+fn]( obj.event );}
			obj.attachEvent( 'on'+type, obj[type+fn] );
		} else obj.addEventListener( type, function(e) { fn.call(ctx,e) }, false );
	},
	
	removeEvent: function(obj, type, fn) {
		if (obj.detachEvent) {
			obj.detachEvent('on'+type, obj[type+fn]);
			obj[type+fn] = null;
		} else obj.removeEventListener(type, fn, false);
	},
	
	window: {
		width: window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth),
		height: window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight)
	},
	
	/**
	* Map key names to key codes
	*/
	keys: {'BSP':8, 'TAB':9, 'ENT':13, 'SHF':16, 'CTR':17, 'ALT':18, 'PAU':19, 'CAP':20, 'ESC':27, 'SP':32, 'PGU':33, 'PGD':34, 'END':35, 'HOM':36, 'LA':37, 'UA':38, 'RA':39, 'DA':40, 'INS':45, 'DEL':46, 'D0':48, 'D1':49, 'D2':50, 'D3':51, 'D4':52, 'D5':53, 'D6':54, 'D7':55, 'D8':56, 'D9':57, 'SEM':59, 'EQL':61, 'A':65, 'B':66, 'C':67, 'D':68, 'E':69, 'F':70, 'G':71, 'H':72, 'I':73, 'J':74, 'K':75, 'L':76, 'M':77, 'N':78, 'O':79, 'P':80, 'Q':81, 'R':82, 'S':83, 'T':84, 'U':85, 'V':86, 'W':87, 'X':88, 'Y':89, 'Z':90, 'LWN':91, 'RWN':92, 'SEL':93, 'N0':96, 'N1':97, 'N2':98, 'N3':99, 'N4':100, 'N5':101, 'N6':102, 'N7':103, 'N8':104, 'N9':105, 'MUL':106, 'ADD':107, 'SUB':109, 'DEC':110, 'DIV':111, 'F1':112, 'F2':113, 'F3':114, 'F4':115, 'F5':116, 'F6':117, 'F7':118, 'F8':119, 'F9':120, 'F10':121, 'F11':122, 'F12':123, 'NUM':144, 'SCR':145, 'COM':188, 'PER':190, 'FSL':191, 'ACC':192, 'OBR':219, 'BSL':220, 'CBR':221, 'QOT':222}
});

/**
* Canvas Components and Extensions
*/
Crafty.c("canvas", {
	drawn: false,
	entry: null,
	
	init: function() {
		this.img = new Image();
		this.img.src = this.__image;
		//draw when ready
		Crafty.addEvent(this, this.img, 'load', function() {
			DrawBuffer.add(this); //send to buffer to keep Z order
		});
		this.w = this.__coord[2];
		this.h = this.__coord[3];
		
		//add the object to the RTree
		this.entry = tree.put(this);
		
		//on change, redraw
		this.bind("change", function(e) {
			e = e || this;
			//clear self
			Crafty.context.clearRect(e.x, e.y, e.w, e.h);
			
			//update position in RTree
			var pos = this.pos();
			this.entry.update(pos.x,pos.y,pos.w,pos.h);
			
			//add to the DrawBuffer
			DrawBuffer.add(this,e);
		});
	},
	
	pos: function() {
		return {
			x: Math.ceil(this.x),
			y: Math.ceil(this.y),
			w: Math.ceil(this.w),
			h: Math.ceil(this.h)
		};
	},
	
	draw: function(x,y,w,h) {
		var co = {},
			coord = this.__coord,
			pos = this.pos();
		
		//if offset
		co.x = coord[0];
		if(x && typeof x === "number") {
			co.x = coord[0] + x;
			pos.x += x;
		}
		co.y = coord[1];
		if(y && typeof y === "number") {
			co.y = coord[1] + y;
			pos.y += y;
		}
		co.w = coord[2];
		if(w) {
			co.w = w;
			pos.w = w;
		}
		co.h = coord[3];
		if(h) {
			co.h = h
			pos.h = h;
		}
		//console.log(co.x, co.y, co.w,co.h);
		//draw the image on the canvas element
		Crafty.context.drawImage(this.img, //image element
								 co.x, //x position on sprite
								 co.y, //y position on sprite
								 co.w, //width on sprite
								 co.h, //height on sprite
								 pos.x, //x position on canvas
								 pos.y, //y position on canvas
								 pos.w, //width on canvas
								 pos.h //height on canvas
		);
	}
});

Crafty.extend({
	context: null,
	
	/**
	* Set the canvas element and 2D context
	*/
	canvas: function(elem) {
		if(!('getContext' in elem)) return;
		this.context = elem.getContext('2d');
	},
});

var DrawBuffer = {

	/**
	* Find all objects intersected by this
	* and redraw them in order of Z
	*/
	add: function add(obj,e) {
		var q, 
			i = 0, 
			j = 0, 
			keylength,
			zlength,
			box, 
			z, 
			layer,
			total = 0,
			keys = [],
			sorted = {}; //bucket sort
		
		e = e || obj;
		
		//sort the query results with bucket sort
		Crafty("canvas").each(function() {
			box = this;//q[i];
			
			if(box.intersect(e)) {
				if(!sorted[box.z]) sorted[box.z] = [];
				sorted[box.z].push(box);
				total++;
			}
		});
		
		//for each z index, draw
		for(z in sorted) {
			if(!sorted.hasOwnProperty(z)) continue;
			keys.push(+z);
		}
		keylength = keys.length;
		keys.sort(function(a,b) {return a-b;}); //FFS!
		
		for(i=0;i<keylength;i++) {	
			layer = sorted[keys[i]];
			zlength = layer.length;
			
			for(j=0;j<zlength;j++) {
				var todraw = layer[j];
				//only draw visible area
				if(todraw[0] !== obj[0]) {
					var x = (e.x - todraw.x < 0) ? 0 : (e.x - todraw.x),
						y = (e.y - todraw.y < 0) ? 0 : (e.y - todraw.y),
						w = Math.min(todraw.w - x, e.w, e.w - (todraw.x - e.x)),
						h = Math.min(todraw.h - y, e.h, e.h - (todraw.y - Math.max(obj.y, e.y)));
					
					//console.log(todraw[0],x,y,w,h);
					layer[j].draw(x,y,w,h);
					
				} else {
					//console.log(obj[0],todraw[0]);
					layer[j].draw();
				}
			}
		}
	}	
};

Crafty.c("controls", {
		
	init: function() {
		
		Crafty.addEvent(this, "keydown", function(e) {
			this.trigger("keydown", e);
		});
		
		Crafty.addEvent(this, "keyup", function(e) {
			//console.log(this,e);
			this.trigger("keyup", e);
		});
		
		return this;
	}
});

Crafty.c("fourway", {
	__move: {left: false, right: false, up: false, down: false},
	
	fourway: function(speed) {
		var move = this.__move;
		
		this.bind("enterframe", function() {
			var old = {x: this.x, y: this.y, w: this.w, h: this.h},
				changed = false;
			if(move.right) {
				this.x += speed;
				changed = true;
			}
			if(move.left) {
				this.x -= speed;
				changed = true;
			}
			if(move.up) {
				this.y -= speed;
				changed = true;
			}
			if(move.down) {
				this.y += speed;
				changed = true;
			}
			
			if(changed) this.trigger("change", old);
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
		});
		
		return this;
	}
});

Crafty.c("twoway", {
	__move: {left: false, right: false, up: false, falling: false},
	
	twoway: function(speed) {
		var move = this.__move;
		
		this.bind("enterframe", function() {
			var old = {x: this.x, y: this.y, w: this.w, h: this.h},
				changed = false;
			if(move.right) {
				this.x += speed;
				changed = true;
			}
			if(move.left) {
				this.x -= speed;
				changed = true;
			}
			if(move.up) {
				this.y -= speed;
				changed = true;
			}
			
			if(changed) this.trigger("change", old);
		}).bind("keydown", function(e) {
			if(e.keyCode === Crafty.keys.RA) {
				move.right = true;
			}
			if(e.keyCode === Crafty.keys.LA) {
				move.left = true;
			}
			if(e.keyCode === Crafty.keys.UA) {
				move.up = true;
			}
		}).bind("keyup", function(e) {
			if(e.keyCode === Crafty.keys.RA) {
				move.right = false;
			}
			if(e.keyCode === Crafty.keys.LA) {
				move.left = false;
			}
			if(e.keyCode === Crafty.keys.UA) {
				move.up = false;
			}
		});
		
		return this;
	}
});



var tree = new Crafty.RTree();

/**
* Collection of objects to be drawn on each
* frame
*/
window.DrawBuffer = DrawBuffer;
window.tree = tree;
})(Crafty);