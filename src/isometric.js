(function(Crafty) {

Crafty.extend({
	isometric: function(tile) {
		return new Isometric(tile);
	}
});

var Isometric = function(tile) {
	this.tile = tile;
};

Isometric.prototype = {
	place: function(x,y,z, obj) {
		
		var m = x * this.tile + (y & 1) * (this.tile / 2),
			n = y * this.tile / 4,
			n = n - z * (this.tile / 2);
			
		obj.attr({x: m, y: n}).z += z;
	}
};

Crafty.Isometric = Isometric;
})(Crafty);