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
	gravity: 1.4,
	
	init: function() {
		console.log("inited", this);

		this.bind("enterframe", this.update);
	},
	
	update: function() {
		console.log("enterframe", this);
		this.y *= Math.ceil(this.gravity);
	}
});

/**
{
	"enterframe": {0: [], 1: []},
}
*/