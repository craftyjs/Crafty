/**@
* #DiamondIsometric
* @category 2D
* Place entities in a 45deg diamond isometric grid.
*/
Crafty.c("DiamondIsometric", {
  _tile: 0,
  _z: 0,
  
  /**@
  * #.DiamondIsometric
  * @comp DiamondIsometric
  * @sign public this .DiamondIsometric(Number tile)
  * @param tile -  Size of the isometric tiles
  * Place entities in a 45deg isometric fashion.
  */
  DiamondIsometric: function(tile, z) {
    this._tile = tile;
    
    return this;
  },
    
  /**@
  * #.size
  * @comp DiamondIsometric
  * @sign public this .size(Number tileSize)
  * @param tileSize - The size of the tiles to place.
  * Method used to initialize the size of the isometric placement.
  * Recommended to use a size alues in the power of `2` (128, 64 or 32). 
  * This makes it easy to calculate positions and implement zooming.
  * @see .place
  */
  size: function(tile) {
    this._tile = tile;
    return this;
  },

  /**@
  * #.place
  * @comp DiamondIsometric
  * @sign public this .place(Number x, Number y, Number z)
  * @param x - The `x` position to place the tile
  * @param y - The `y` position to place the tile
  * @param z - The `z` position or height to place the tile
  * Use this method to place itself in an isometric grid.
  * @see .size
  */
  place: function(x,y,z) {
    var xPos = .5 * (x * this._tile) + (y * .5 * this._tile);
    var yPos = ((.25 * this._tile) * (y - x)) + this._tile + (-1 * .5 * z * this._tile);

    this.attr({ x: xPos,  y: yPos }).z += z;
    return this;
  }
});

