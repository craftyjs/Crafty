Crafty.extend({
	isometric: function(tile) {
		return new Isometric(tile);
	}
});

var Isometric = function(tile) {
	this.tile = tile;
	this.z = 0;
};

Isometric.prototype = {
	place: function(x,y,z, obj) {
		
		var m = x * this.tile + (y & 1) * (this.tile / 2),
			n = y * this.tile / 4,
			n = n - z * (this.tile / 2);
			
		obj.attr({x: m  + Crafty.viewport._x, y: n  + Crafty.viewport._y}).z += z;
	}
};

Crafty.Isometric = Isometric;