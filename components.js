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
	}
});

Crafty.c("gravity", {
	gravity: 1.1,
	
	init: function() {
		console.log("inited", this);
		if(!this.has("2D")) this.addComponent("2D");
		this.bind("enterframe", function() {
			if(this.y > 2000) this.y = 1;
			this.y *= this.gravity;
		});
	}
});

Crafty.c("DOMDraw", {
	element: null,
	
	DOMDraw: function(elem) {
		this.element = elem;
		elem.style.position = 'absolute';
		this.bind("enterframe", function() {
			elem.style.top = Math.ceil(this.y) + "px";
			elem.style.left = Math.ceil(this.x) + "px";
		});
	}
});