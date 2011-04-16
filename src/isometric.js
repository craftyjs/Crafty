Crafty.extend({
	/**@
	* #Crafty.isometric
	* @category 2D
	* Place entities in a 45deg isometric fashion.
	*/
	isometric: {
		_tile: 0,
		_z: 0,
		
		/**@
		* #Crafty.isometric.size
		* @comp Crafty.isometric
		* @sign public this Crafty.isometric.size(Number tileSize)
		* @param tileSize - The size of the tiles to place.
		* Method used to initialize the size of the isometric placement.
		* Recommended to use a size alues in the power of `2` (128, 64 or 32). 
		* This makes it easy to calculate positions and implement zooming.
		* @see Crafty.isometric.place
		*/
		size: function(tile) {
			this._tile = tile;
			return this;
		},
		
		/**@
		* #Crafty.isometric.place
		* @comp Crafty.isometric
		* @sign public this Crafty.isometric.size(Number x, Number y, Number z, Entity tile)
		* @param x - The `x` position to place the tile
		* @param y - The `y` position to place the tile
		* @param z - The `z` position or height to place the tile
		* @param tile - The entity that should be position in the isometric fashion
		* Use this method to place an entity in an isometric grid.
		* @see Crafty.isometric.size
		*/
		place: function(x,y,z, obj) {
			var m = x * this._tile + (y & 1) * (this._tile / 2),
				n = y * this._tile / 4,
				n = n - z * (this._tile / 2);
				
			obj.attr({x: m  + Crafty.viewport._x, y: n  + Crafty.viewport._y}).z += z;
			return this;
		}
	}
});