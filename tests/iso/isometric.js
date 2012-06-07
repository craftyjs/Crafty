Crafty.extend({
    isoLayer:{
        create:function(){
            
        },
        get:function(){
            
        }
    }
})
Crafty.extend({
    /**@
     * #Crafty.isometric
     * @category 2D
     * Place entities in a 45deg isometric fashion.
     */
    isometric: {
        _tile: {
            width: 0,
            height: 0,
            ratio:0
        },
        _staggered:true,
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
        init: function (width, height,staggered) {
            this._tile.width = width;
            this._tile.height = height > 0 ? height : width/2; //Setup width/2 if height doesnt set
            this._tile.ratio = this._tile.height/this._tile.width;
            this._staggered = staggered || true;
            return this;
        },
        /**@
         * #Crafty.isometric.place
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.size(Number x, Number y, Number z, Entity tile)
         * @param x - The `x` position to place the tile
         * @param y - The `y` position to place the tile
         * @param l - The `l` map layer
         * @param tile - The entity that should be position in the isometric fashion
         * Use this method to place an entity in an isometric grid. Z index will be calculated automaticly
         * ~~~
         * var iso = Crafty.isometric.size(128);
         * isos.place(2, 1, 0, Crafty.e('2D, DOM, Color').color('red').attr({w:128, h:128}));
         * ~~~
         * @see Crafty.isometric.size
         */
        place: function (x, y, l, obj) {
            var offset = this._tile.height -obj.h;
            var pos = this.pos2px(x,y)
            obj.attr({
                x: pos.left,
                y: pos.top+offset,
                z:z
            });
            return this;
        },
        staggered:function(){
            
        },
        /**@
         * #Crafty.isometric.pos2px
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.pos2px(Number x,Number y)
         * @param x
         * @param y
         * @return Object {left Number,top Number}
         * This method calculate the X and Y Coordiantes to Pixel Positions including Viewport
         * ~~~
         * var iso = Crafty.isometric.size(128,96);
         * var position = iso.pos2px(100,100);
         * console.log(position); //Object { left=6736, top=2652}
         * ~~~
         */
        pos2px:function(x,y){
            return {
                left:~~(x * this._tile.width  + (y & 1) * this._tile.width*this._tile.ratio),
                top:~~(y * this._tile.height*this._tile.ratio )
            }
        },
        /**@
         * #Crafty.isometric.px2pos
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.px2pos(Number left,Number top)
         * @param top
         * @param left
         * @return Object {x Number,y Number}
         * This method calculate pixel top,left positions to x,y coordiantes including Viewport
         * ~~~
         * var iso = Crafty.isometric.size(128,96);
         * var px = iso.pos2px(6736,2652);
         * console.log(px); //Object { x=100, y=100}
         * ~~~
         */
        px2pos:function(left,top){
            
            return {
                x:~~(left / this._tile.width-(top & 1) /this._tile.width/this._tile.ratio),
                y:~~(top/ this._tile.height / this._tile.ratio)
            };
        },
        /**@
         * #Crafty.isometric.centerAt
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.centerAt(Number x,Number y)
         * @param top
         * @param left
         * This method center the Viewport at x/y location
         * ~~~
         * var iso = Crafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * ~~~
         */
        centerAt:function(x,y){
            if(typeof x == "number" && typeof y == "number"){
                var center = this.pos2px(x,y);
                Crafty.viewport.x = Crafty.viewport.width/2-this._tile.width*this._tile.ratio-center.left;
                Crafty.viewport.y = Crafty.viewport.height/2-this._tile.height-center.top;
            }
          
            return this;
        },
        /**@
         * #Crafty.isometric.area
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.area()
         * @param offsetX offset on the X axis in Tiles
         * @param offsetY offset on the Y axis in Tiles
         * @return Object {x:{start Number,end Number},y:{start Number,end Number}}
         * This method get the Area surounding by the centerpoint depends on viewport height and width
         * ~~~
         * var iso = Crafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * var area = iso.area(1,1); //get the area + 1 tile on all sides
         *for(var y = area.y.start;y <= area.y.end;y++){
         *for(var x = area.x.start ;x <= area.x.end;x++){
         * iso.place(x,y,0,Crafty.e("2D,DOM,gras")); //Display tiles in the Screen layer 0
         * }
         *}
         * ~~~
         */
        area:function(){
 
            var vp = {
                x:{
                    start:-Crafty.viewport.x-this._tile.width*this._tile.ratio,
                    end:-Crafty.viewport.x+Crafty.viewport.width+this._tile.width*this._tile.ratio
                },
                y:{
                    start:-Crafty.viewport.y-this._tile.height*this._tile.ratio,
                    end:-Crafty.viewport.y+Crafty.viewport.height+this._tile.height*this._tile.ratio
                }
            }
           
            //Get the center Point in the viewport
            var start = this.px2pos(vp.x.start,vp.y.start);
            var end = this.px2pos(vp.x.end,vp.y.end);
       
            return {
                x:{
                    start : start.x,
                    end : end.x
                },
                y:{
                    start : start.y,
                    end : end.y
                }
            };
        },
        /**@
         * #Crafty.isometric.slice
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.slice()
         * Method to slice Entities into Parts depends on tile width/height and setup different z-index
         * ~~~
         * var iso = Crafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * iso.slice(10,10,1,Crafty.e("2D, DOM, building")); //Display a building on X:10,Y:10 layer 1
         * ~~~
         */
        slice:function(x,y,ent){
            var clone = {},cloneX,cloneY,parts=[];
        
  
            for(var _y = 0;_y < ent._h / this._tile.height*2;_y++){
                for(var _x = 0; _x < ent._w /this._tile.width ;_x++){
                    
                    cloneY = y+_y;                 
                    cloneX = x+_x; 
                  
                    if(_y % 2 == 0){
                        clone = ent.clone();
                        clone.crop(_x *  this._tile.width,_y * this._tile.height/2,this._tile.width,this._tile.height);
                        parts.push({
                            x:cloneX,
                            y:cloneY,
                            ent:clone
                        });
                    }
                    
                }
            }
            ent.destroy(); //Undraw original
            return parts;
        },
        /**@
         * #Crafty.isometric.polygon
         * @comp Crafty.isometric
         * @sign public this Crafty.isometric.polygon()
         * Method to get the Polygon for a Tile
         * ~~~
         * var iso = Crafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * var gras = Crafty.e("2D","DOM","gras","Solid","Collision").collision(new Crafty.polygon(iso.polygon())); //The Tile has the right collision points now
         * ~~~
         */
        polygon:function(){
            return [[this._tile.width*this._tile.ratio,0],[this._tile.width,this._tile.height*this._tile.ratio],[this._tile.width*this._tile.ratio,this._tile.height],[0,this._tile.height*this._tile.ratio]]
        }
        
    }
});
