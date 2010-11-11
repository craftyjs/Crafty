/*************************************
Native Components for Crafty Library

TODO:
	- Collision
	- Inventory
	- Items
	- Canvas
	- Lighting
	- Controls
	- Particles
	- TerrainGen
	- Map
	- Animation
	- Sound
	
*************************************/
Crafty.c("2D", {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	
	area: function() {
		return this.w * this.h;
	},
	
	/**
	* Does a rect intersect this
	*/
	intersect: function(rect) {
		//rect must have x,y,w,h
		if(!rect.x || !rect.y || !rect.w || !rect.h) return undefined;
		
		return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
			   this.y < rect.y + rect.h && this.h + this.y > rect.y;
	},
	
	/**
	* Is object at point
	*/
	isAt: function(x,y) {
		return this.x <= x && this.x + this.w >= x 
			   this.y <= y && this.y + this.h >= y;
	},
	
	/**
	* Basic collision for rects. Can be used on
	* large collection of elements.
	*/
	hit: function(obj, fn) {
		this.each(function() {
			console.log("init", this[0]);
			this.bind("hit", fn);
			this.bind("enterframe", function() {
				if(this.intersect(Crafty(obj))) {
					this.trigger("hit");
				}
			});
		});
	}
});

Crafty.c("gravity", {
	_gravity: 1.1,
	
	init: function() {
		if(!this.has("2D")) this.addComponent("2D");
		this.bind("enterframe", function() {
			this.y *= this._gravity;
		});
	}
});

Crafty.c("DOM", {
	_element: null,
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		return this;
	}
});

Crafty.c("DOMDraw", {
	
	DOMDraw: function() {
		if(!this.has("DOM")) this.addComponent("DOM");
		this._element.style.position = 'absolute';
		this.bind("enterframe", function() {
			this._element.style.top = Math.ceil(this.y) + "px";
			this._element.style.left = Math.ceil(this.x) + "px";
		});
	}
});


Crafty.extend({
	tile: 16,
	context: null,
	
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
	* Set the canvas element and 2D context
	*/
	canvas: function(elem) {
		if(!('getContext' in elem)) return;
		this.context = elem.getContext('2d');
	}
});

Crafty.c("canvas", {
	init: function() {
		this.img = new Image();
		this.img.src = this.__image;
		this.w = this.__coord[2];
		this.h = this.__coord[3];
	},
	
	draw: function() {
		var co = this.__coord;
		console.log(co);
		//draw the image on the canvas element
		Crafty.context.drawImage(this.img, //image element
								 co[0], //x position on sprite
								 co[1], //y position on sprite
								 co[2], //width on sprite
								 co[3], //height on sprite
								 this.x, //x position on canvas
								 this.y, //y position on canvas
								 this.w, //width on canvas
								 this.h //height on canvas
		);
	}
});