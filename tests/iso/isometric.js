
Crafty.extend({
    /**@
     * #Crafty.isometric
     * @category 2D
     * Place entities in a 45deg isometric fashion.
     */
    isometric: {      
        _iso:null,
        /**@
         * #Crafty.isometric.size
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.size(Number tileSize)
         * @param tileSize - The size of the tiles to place.
         * Method used to initialize the size of the isometric placement.
         * Recommended to use a size alues in the power of `2` (128, 64 or 32).
         * This makes it easy to calculate positions and implement zooming.
         * ~~~
         * var iso = Crafty.isometric.init(128);
         * ~~~
         * @see Crafty.isometric.place
         */
        init: function (width, height,orientation) {
            var w = width;h = height || width/2;
            switch(orientation){
                case 'staggered':{
                     
                        break;
                }
                default:{
                        this._iso = Crafty.diamond.init(w,h);
                }
            }
         
            return this;
        },
        place:function(x,y,z){
            this._iso.place(x,y,z);
        }
    }
});
