Crafty.extend({
	isometric: {
		_tile: 0,
		_z: 0,
		
		init: function(tile) {
			this._tile = tile;
			return this;
		},
		
		place: function(x,y,z, obj) {
			
			var m = x * this._tile + (y & 1) * (this._tile / 2),
				n = y * this._tile / 4,
				n = n - z * (this._tile / 2);
				
			obj.attr({x: m  + Crafty.viewport._x, y: n  + Crafty.viewport._y}).z += z;
			return this;
		},
		
		zoom: function(tile) {
			this._tile = tile;
			Crafty.trigger("zoom", {tile: tile});
			return this;
		}
	}
});