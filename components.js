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
	
	hit: function(obj, fn) {
		this.each(function() {
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

Crafty.c("map", {
	_maps: {},
	
	add: function(key, value) {
	
	},
	
	
});