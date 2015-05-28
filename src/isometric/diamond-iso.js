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
        _map: {
            width: 0,
            height: 0
        },
        _origin: {
            x: 0,
            y: 0
        },
        _grid: [],
        //false if there is no collision in this square
        _collisionMap: [],
        _tileLocations: {},
        _tileZSpacing: 6,
        /**@
         * #Crafty.diamondIso.init
         * @comp Crafty.diamondIso
         * @sign public this Crafty.diamondIso.init(Number tileWidth,Number tileHeight,Number mapWidth,Number mapHeight, Number x, Number Y)
         * @param tileWidth - The size of base tile width's grid space in Pixel
         * @param tileHeight - The size of base tile height grid space in Pixel
         * @param mapWidth - The width of whole map in Tiles
         * @param mapHeight - The height of whole map in Tiles
         * @param x - the x coordinate of the TOP corner of the 0,0 tile
         * @param y - the y coordinate of the TOP corner of the 0,0,tile
         *
         * Method used to initialize the size of the isometric placement.
         * Recommended to use a size alues in the power of `2` (128, 64 or 32).
         * This makes it easy to calculate positions and implement zooming.
         * If TH isn't equal to TW*2, this won't work.
         *
         * @example
         * ~~~
         * var iso = Crafty.diamondIso.init(64,128,20,20,0,0);
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
                this._grid[i]=Array();
                this._collisionMap[i]= Array();
                for (var j=0; j<mh; j++){
                    this._grid[i][j]=Array();
                    this._collisionMap[i][j] = true;
                    for (var k=0; k<2; k++){
                        this._grid[i][j][k] = Array();
                    }
                }

            }
            this.x = parseInt(x,10) || 0;
            this.y = parseInt(y,10) || 0;
            this.layerZLevel= (mw+mh+1)*this._tileZSpacing;
            return this;
        },
        /**@
         * #Crafty.diamondIso.place
         * @comp Crafty.diamondIso
         * @sign public this Crafty.diamondIso.place(Entity obj,Number x, Number y, Number layer)
         * @param obj - The entity that will be placed in.
         * @param x - The `x` position to place the tile
         * @param y - The `y` position to place the tile
         * @param layer - The `z` position to place the tile (only level 0 and 1 are supported)
         * @param keepOldPosition - If true, the code will place the code in the grid but not update its X/Y
         * Use this method to place an entity in an isometric grid.
         *
         * @example
         * ~~~
         * var iso = Crafty.diamondIso.init(64,128,20,20,0,0);
         * isos.place(Crafty.e('2D, DOM, Color').color('red').attr({w:128, h:128}),1,1,2,false);
         * This will slot this tile into the grid
         * ~~~
         *
         * @see Crafty.diamondIso.size
         */
        place: function (obj, x, y, layer,keepOldPosition) {
            var spriteHeight =obj.h/(2*this._tile.height);
            var pos = this.pos2px(x, y, layer, spriteHeight);

            //leave
            if (!keepOldPosition){
                obj.x = pos.x;
                obj.y = pos.y;
                obj.z = this.getZAtLoc(x,y,layer);
            }
            var index, prevTiles = this._grid[x][y][layer];
            //indicates the square is empty
            if (!prevTiles || !prevTiles.length) {
                this._grid[x][y][layer] = [obj];
                index = 0;
            //indicates that the placing tile and the previous one
            //can't coexist.
            } else if (prevTiles[0].has("Obstacle") || obj.has("Obstacle")) {
                prevTiles.map(function(el){el.destroy();});
                this._grid[x][y][layer] = [obj];
                index = 0;
            //otherwise, it's some entity that can cohabit a square.
            } else {
                index = this._grid[x][y][layer].push(obj) - 1;
            }

            if (layer === 0 || layer === 1){
                this._updateCollisionMap(x,y);
            }
            obj._gridLoc = [x,y];
            this._tileLocations[obj[0]]={x:x,y:y,z:layer,index:index};
            var self=this;
            obj.uniqueBind("Remove",function(){
                self.detachTile(obj);
                delete self._tileLocations[obj[0]];
            });
            return this;

        },
        /**@
         * #Crafty.diamondIso._updateCollisionMap
         * @comp Crafty.diamondIso
         * @sign private this Crafty.diamondIso._updateCollisionMap(Number x, Number y,)
         * @param x - The x coordinate to check
         * @param y - The y coordinate to check
         * The component calls this method when the contents of an X/Y pair change on the level where
         * collision happens.  It updates the cached collsion map so that entities performing pathfinding
         * know which groups of tiles are off limits.
         */
        _updateCollisionMap: function(x,y){
            var hasGroundLevelTile = this._grid[x][y][0].length > 0;
            var hasTopLevelTile = this._grid[x][y][1].length >0;
            if (hasTopLevelTile){
                topTileIsObstacle = this._grid[x][y][1][0].has("Obstacle");
            } else {
                topTileIsObstacle = false;
            }
            var impassable = !hasGroundLevelTile || topTileIsObstacle;
            this._collisionMap[x][y] = impassable;
        },
        /**@
         * #Crafty.diamondIso.detachTile
         * @comp Crafty.diamondIso
         * @sign private this Crafty.diamondIso.detachTile(Entity obj)
         * @param obj - the object to remove
         * When passed an entity, removes that entity from the grid and returns its previous location.
         * Does not delete the tile.
         */
        detachTile: function(obj){
            var loc = this._tileLocations[obj[0]];
            if (loc){
                var posItems = this._grid[loc.x][loc.y][loc.z];
                posItems.splice(loc.index,1);
                for (var i=loc.index; i<posItems.length; i++){
                    this._tileLocations[posItems[i][0]].index--;
                }
                if (loc.z === 1 || loc.z === 0){
                    this._updateCollisionMap(loc.x,loc.y);
                }
                obj._gridLoc = undefined;
                delete this._tileLocations[obj[0]];
                return loc;
            }
            return false;
        },
        /**@
         * #Crafty.diamondIso.centerAt
         * @comp Crafty.centerAt
         * @sign private this Crafty.centerAt(number x, number y)
         * @param x - tile X coordinate
         * @param Y - tile Y coordinate
         * Centers the grid on the tile at X,Y (not screen pixes, tile coordinates.)
         */
        centerAt: function (x, y) {
            var pos = this.pos2px(x, y);
            Crafty.viewport.x = -pos.x + Crafty.viewport.width / 2 - this._tile.width;
            Crafty.viewport.y = -pos.y + Crafty.viewport.height / 2;

        },
        /**@
         * #Crafty.diamondIso.getZAtLoc
         * @comp Crafty.centerAt
         * @sign private this Crafty.centerAt.getZAtLoc(number x, number y)
         * @param x - tile X coordinate
         * @param Y - tile Y coordinate
         @ @param layer - tile layr
         * Gets the correct Z coordinate to place this tile on so that it renders
         * properly in front of and behind other grid entities.
         * You might call this method if you are having an entity move across the top of the 
         * grid and need to interpolate between two sides.  This is the motivation behind the
         * tileZSpacing property:  tweens need to interpolate between values but have to round to 
         * the nearest integer.
         */
        getZAtLoc: function(x,y,layer){
            return this.layerZLevel * layer + this._tileZSpacing *(x+y);
        },
        pos2px: function (x, y, layer,height) {
        /* This returns the correct coordinates to place the 
        object's top and left to fit inside the grid, which is
        NOT inside of the tile for an isometric grid.  IF you
        want the top corner of the diamond add tile width/2 */
        layer = layer || 0;
        height= height || 0;
        offset = -1*(this._tile.height * (2*(height-1) + layer));
            return {
                x: this.x + ((x - y - 1) * this._tile.width / 2),
                y: this.y + ((x + y) * this._tile.height / 2) + offset
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
        getTileDimensions: function(){
            return {w:this._tile.width,h:this._tile.height};
        },
        getTiles: function(x,y,z){
            return this._grid[x][y][z];
        },
        _getTraversableNeighbors: function(p){
            var points = [];
            for (var i=-1; i<=1; i++){
                for (var j=-1; j<=1; j++){
                    var newX = p[0] + i;
                    var newY = p[1] + j;
                    //if it's inside the grid and also not itsself, and no obstacle there
                    if (0 <= newX && newX < this._map.width &&
                        0 <= newY && newY < this._map.height &&
                        (Math.abs(i)+Math.abs(j) ==1) && !this._collisionMap[newX][newY]){
                        points.push([newX,newY]);
                }
                }
            }
            return points;
        },
        findPath: function(start,end){
            if (this._collisionMap[end[0]][end[1]]){
                return undefined;
            }
            var openNodes = [];
            var closedNodes = {};
            var gScore = {};
            var fScore = {};
            var paths = {};
            gScore[start] = 0;
            fScore[start] = Crafty.math.distance(start[0],start[1],end[0],end[1]);
            openNodes.push(start);
            intCompare = function(a,b){
                    return fScore[a] < fScore[b];
            };
            while (openNodes.length !==0){
                var curNode = openNodes.pop();
                closedNodes[curNode] = true;
                if (curNode[0] == end[0] && curNode[1] == end[1]){
                    return this._showPath(paths,end);
                }
                var nearNodes = this._getTraversableNeighbors(curNode);
                for (var i=0; i<nearNodes.length; i++){
                    var nearNode = nearNodes[i];
                    if (closedNodes[nearNode]){
                        continue;
                    }
                    //1 should become distance (cur,near) if you ever decide to do diagonals
                    var tentativeGSscore = gScore[curNode] + 1;
                    if (!gScore[nearNode] || tentativeGSscore < gScore[nearNode]){
                        var isNewNode = !gScore[nearNode];
                        paths[nearNode] = curNode;
                        gScore[nearNode] = tentativeGSscore;
                        fScore[nearNode] = tentativeGSscore + Crafty.math.distance(nearNode[0],nearNode[1],end[0],end[1]);
                        if (isNewNode){
                            openNodes.push(nearNode);
                        }
                    }
                }
                openNodes.sort(intCompare);
            }
            return undefined;

        },
        _showPath: function(paths,current){
            var bestPath = [current];
            while(paths[current]){
                current = paths[current];
                bestPath.push(current);
            }
            return bestPath;
        }
    }

});