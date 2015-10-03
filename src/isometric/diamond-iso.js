var Crafty = require('../core/core.js');


Crafty.extend({
    /**@
     * #Crafty.diamondIso
     * @category 2D
     * Place entities in a 45deg diamond isometric fashion. It is similar to isometric but has another grid locations
     * In this mode, the x axis and y axis are aligned to the edges of tiles with x increasing being down and to the
     * right and y being down and to the left.
     */
    diamondIso: {
        _tile: {
            width: 0,
            height: 0
        },
        getTileDimensions: function(){
            return {w:this._tile.width,h:this._tile.height};
        },
        _map: {
            width: 0,
            height: 0
        },
        _origin: {
            x: 0,
            y: 0
        },
        _tiles: [],
        getTile: function(x,y,z){
            return this._tiles[x][y][z];
        },
        /**@
         * #Crafty.diamondIso.init
         * @comp Crafty.diamondIso
         * @sign public this Crafty.diamondIso.init(Number tileWidth,Number tileHeight,Number mapWidth,Number mapHeight)
         * @param tileWidth - The size of base tile width's grid space in Pixel
         * @param tileHeight - The size of base tile height grid space in Pixel
         * @param mapWidth - The width of whole map in Tiles
         * @param mapHeight - The height of whole map in Tiles
         * @param x - the x coordinate of the TOP corner of the 0,0 tile
         * @param y - the y coordinate of the TOP corner of the 0,0, tile
         *
         * Method used to initialize the size of the isometric placement.
         * Recommended to use a size alues in the power of `2` (128, 64 or 32).
         * This makes it easy to calculate positions and implement zooming.
         *
         * @example
         * ~~~
         * var iso = Crafty.diamondIso.init(64,128,20,20);
         * ~~~
         *
         * @see Crafty.diamondIso.place
         */
        init: function (tw, th, mw, mh, x, y) {
            this._tile.width = parseInt(tw, 10);
            this._tile.height = parseInt(th, 10) || parseInt(tw, 10) / 2;
            this._tile.r = this._tile.width / this._tile.height;

            this._map.width = parseInt(mw, 10);
            this._map.height = parseInt(mh, 10) || parseInt(mw, 10);
            for (var i=0; i<mw; i++) {
                this._tiles[i]=Array();
                for (var j=0; j<mh; j++){
                this._tiles[i][j]=Array();
                }
            }
            this.x = parseInt(x,10) || 0;
            this.y = parseInt(y,10) || 0;
            this.layerZLevel= (mw+mh+1);
            return this;
        },
        /**@
         * #Crafty.diamondIso.place
         * @comp Crafty.diamondIso
         * @sign public this Crafty.diamondIso.place(Entity tile,Number x, Number y, Number layer)
         * @param x - The `x` position to place the tile
         * @param y - The `y` position to place the tile
         * @param layer - The `z` position to place the tile
         * @param tile - The entity that should be position in the isometric fashion
         *
         * Use this method to place an entity in an isometric grid.
         *
         * @example
         * ~~~
         * var iso = Crafty.diamondIso.init(64,128,20,20);
         * isos.place(Crafty.e('2D, DOM, Color').color('red').attr({w:128, h:128}),1,1,2);
         * ~~~
         *
         * @see Crafty.diamondIso.size
         */
        place: function (obj, x, y, layer) {
            var pos = this.pos2px(x, y);
            //this calculation is weird because tile sprites are h*2
            //for tiles of size h in isometric
            var objHeight = obj.tileHeight;
            var spriteHeight =obj.h/this._tile.height;
            obj.x = pos.x;
            obj.y = pos.y - (spriteHeight-2)*this._tile.height - this._tile.height*layer;
            obj.z = this.getZAtLoc(x,y,layer);
            for (var i=0; i<=spriteHeight-2; i++) {
                var prevTile = this._tiles[x][y][layer+i];
                if (prevTile && prevTile !== obj){
                    prevTile.destroy();
                }
                this._tiles[x][y][layer+i] = obj;
            }
            return this;

        },
        detachTile: function(obj){
            for (var _x=0; _x<this._map.width; _x++){
                for (var _y=0; _y<this._map.height; _y++){
                    var len = this._tiles[_x][_y].length;
                    for(var _z=0; _z<len; _z++){
                        if (this._tiles[_x][_y][_z] && obj === this._tiles[_x][_y][_z]){
                            tHeight=obj.h/this._tile.height;
                            for (var i=0; i<tHeight; i++){
                                this._tiles[_x][_y][_z+i] = undefined;
                            }
                            return {
                                x:_x,
                                y:_y,
                                z:_z
                            };
                        }

                    }
                }
            }
            return false;
        },
        centerAt: function (x, y) {
            var pos = this.pos2px(x, y);
            Crafty.viewport.x = -pos.x + Crafty.viewport.width / 2 - this._tile.width;
            Crafty.viewport.y = -pos.y + Crafty.viewport.height / 2;

        },
        getZAtLoc: function(x,y,layer){
            return this.layerZLevel * layer + x+y;
        },
        pos2px: function (x, y) {
        /* This returns the correct coordinates to place the 
        object's top and left to fit inside the grid, which is
        NOT inside of the tile for an isometric grid.  IF you
        want the top corner of the diamond add tile width/2 */
            return {
                x: this.x + ((x - y - 1) * this._tile.width / 2),
                y: this.y + ((x + y) * this._tile.height / 2)
            };
        },
        px2pos: function (left, top) {
        /* This returns the x/y coordinates on z level 0.
        @TODO add a specifying z level
        */
            var v1 = (top - this.y)/this._tile.height;
            var v2 = (left - this.x)/this._tile.width;
            var x = v1+v2;
            var y = v1-v2;
            inX = x>0 && x<this._map.width;
            inY = y>0 && y<this._map.height;
            if (!inX || !inY){
                return undefined;
            }
            return {
                x: ~~x,
                y: ~~y
            };
        },
        getOverlappingTiles: function(x,y){
        /* This will find all of the tiles that might be at a given x/y in pixels */
                var pos = this.px2pos(x,y);
                var tiles = [];
                var _x = ~~pos.x;
                var _y = ~~pos.y;
                var maxX = this._map.width - _x;
                var maxY = this._map.height - _y;
                var furthest = Math.min(maxX, maxY);
                var obj = this._tiles[_x][_y][1];
                if (obj){
                    tiles.push(obj);
                }
                for (var i=1; i<furthest; i++){
                    var _obj= this._tiles[_x+i][_y+i][i];
                    if (_obj){
                        tiles.push(_obj);
                    }
                }
                return tiles;
        },
        polygon: function (obj) {
            /*I don't know what this is trying to do...*/
            obj.requires("Collision");
            var marginX = 0,
                marginY = 0;
            var points = [
                marginX - 0, obj.h - marginY - this._tile.height / 2,
                marginX - this._tile.width / 2, obj.h - marginY - 0,
                marginX - this._tile.width, obj.h - marginY - this._tile.height / 2,
                marginX - this._tile.width / 2, obj.h - marginY - this._tile.height
            ];
            var poly = new Crafty.polygon(points);
            return poly;

        }
    }

});
