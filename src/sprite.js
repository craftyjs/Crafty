var Crafty = require('./core.js'),
    document = window.document;

Crafty.extend({

    /**@
     * #Crafty.sprite
     * @category Graphics
     * @sign public this Crafty.sprite([Number tile, [Number tileh]], String url, Object map[, Number paddingX[, Number paddingY[, Boolean paddingAroundBorder]]])
     * @param tile - Tile size of the sprite map, defaults to 1
     * @param tileh - Height of the tile; if provided, tile is interpreted as the width
     * @param url - URL of the sprite image
     * @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
     * @param paddingX - Horizontal space in between tiles. Defaults to 0.
     * @param paddingY - Vertical space in between tiles. Defaults to paddingX.
     * @param paddingAroundBorder - If padding should be applied around the border of the sprite sheet. If enabled the first tile starts at (paddingX,paddingY) instead of (0,0). Defaults to false.
     * Generates components based on positions in a sprite image to be applied to entities.
     *
     * Accepts a tile size, URL and map for the name of the sprite and its position.
     *
     * The position must be an array containing the position of the sprite where index `0`
     * is the `x` position, `1` is the `y` position and optionally `2` is the width and `3`
     * is the height. If the sprite map has padding, pass the values for the `x` padding
     * or `y` padding. If they are the same, just add one value.
     *
     * If the sprite image has no consistent tile size, `1` or no argument need be
     * passed for tile size.
     *
     * Entities that add the generated components are also given the `2D` component, and
     * a component called `Sprite`.
     *
     * @example
     * ~~~
     * Crafty.sprite("imgs/spritemap6.png", {flower:[0,0,20,30]});
     * var flower_entity = Crafty.e("2D, DOM, flower");
     * ~~~
     * The first line creates a component called `flower` associated with the sub-image of
     * spritemap6.png with top-left corner (0,0), width 20 pixels, and height 30 pixels.
     * The second line creates an entity with that image. (Note: The `2D` is not really
     * necessary here, because adding the `flower` component automatically also adds the
     * `2D` component.)
     * ~~~
     * Crafty.sprite(50, "imgs/spritemap6.png", {flower:[0,0], grass:[0,1,3,1]});
     * ~~~
     * In this case, the `flower` component is pixels 0 <= x < 50, 0 <= y < 50, and the
     * `grass` component is pixels 0 <= x < 150, 50 <= y < 100. (The `3` means grass has a
     * width of 3 tiles, i.e. 150 pixels.)
     * ~~~
     * Crafty.sprite(50, 100, "imgs/spritemap6.png", {flower:[0,0], grass:[0,1]}, 10);
     * ~~~
     * In this case, each tile is 50x100, and there is a spacing of 10 pixels between
     * consecutive tiles. So `flower` is pixels 0 <= x < 50, 0 <= y < 100, and `grass` is
     * pixels 0 <= x < 50, 110 <= y < 210.
     *
     * @see Sprite
     */
    sprite: function (tile, tileh, url, map, paddingX, paddingY, paddingAroundBorder) {
        var spriteName, temp, x, y, w, h, img;

        //if no tile value, default to 1.
        //(if the first passed argument is a string, it must be the url.)
        if (typeof tile === "string") {
            paddingY = paddingX;
            paddingX = map;
            map = tileh;
            url = tile;
            tile = 1;
            tileh = 1;
        }

        if (typeof tileh == "string") {
            paddingY = paddingX;
            paddingX = map;
            map = url;
            url = tileh;
            tileh = tile;
        }

        //if no paddingY, use paddingX
        if (!paddingY && paddingX) paddingY = paddingX;
        paddingX = parseInt(paddingX || 0, 10); //just incase
        paddingY = parseInt(paddingY || 0, 10);

        var markSpritesReady = function() {
            this.ready = true;
            this.trigger("Invalidate");
        };

        img = Crafty.asset(url);
        if (!img) {
            img = new Image();
            img.src = url;
            Crafty.asset(url, img);
            img.onload = function () {
                //all components with this img are now ready
                for (var spriteName in map) {
                    Crafty(spriteName).each(markSpritesReady);
                }
            };
        }

        var sharedSpriteInit = function() {
            this.requires("2D, Sprite");
            this.__trim = [0, 0, 0, 0];
            this.__image = url;
            this.__coord = [this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]];
            this.__tile = tile;
            this.__tileh = tileh;
            this.__padding = [paddingX, paddingY];
            this.__padBorder = paddingAroundBorder;
            this.sprite(this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]);
            
            this.img = img;
            //draw now
            if (this.img.complete && this.img.width > 0) {
                this.ready = true;
                this.trigger("Invalidate");
            }

            //set the width and height to the sprite size
            this.w = this.__coord[2];
            this.h = this.__coord[3];
        };

        for (spriteName in map) {
            if (!map.hasOwnProperty(spriteName)) continue;

            temp = map[spriteName];

            //generates sprite components for each tile in the map
            Crafty.c(spriteName, {
                ready: false,
                __coord: [temp[0], temp[1], temp[2] || 1, temp[3] || 1],

                init: sharedSpriteInit
            });
        }

        return this;
    }
});

/**@
 * #Sprite
 * @category Graphics
 * @trigger Invalidate - when the sprites change
 * Component for using tiles in a sprite map.
 */
Crafty.c("Sprite", {
    __image: '',
    /*
     * #.__tile
     * @comp Sprite
     *
     * Horizontal sprite tile size.
     */
    __tile: 0,
    /*
     * #.__tileh
     * @comp Sprite
     *
     * Vertical sprite tile size.
     */
    __tileh: 0,
    __padding: null,
    __trim: null,
    img: null,
    //ready is changed to true in Crafty.sprite
    ready: false,

    init: function () {
        this.__trim = [0, 0, 0, 0];

        var draw = function (e) {
            var co = e.co,
                pos = e.pos,
                context = e.ctx;

            if (e.type === "canvas") {
                //draw the image on the canvas element
                context.drawImage(this.img, //image element
                    co.x, //x position on sprite
                    co.y, //y position on sprite
                    co.w, //width on sprite
                    co.h, //height on sprite
                    pos._x, //x position on canvas
                    pos._y, //y position on canvas
                    pos._w, //width on canvas
                    pos._h //height on canvas
                );
            } else if (e.type === "DOM") {
                // Get scale (ratio of entity dimensions to sprite's dimensions)
                // If needed, we will scale up the entire sprite sheet, and then modify the position accordingly
                var vscale = this._h / co.h,
                    hscale = this._w / co.w,
                    style = this._element.style;

                style.background = style.backgroundColor + " url('" + this.__image + "') no-repeat";
                style.backgroundPosition = "-" + co.x * hscale + "px -" + co.y * vscale + "px";
                // style.backgroundSize must be set AFTER style.background!
                if (vscale != 1 || hscale != 1) {
                    style.backgroundSize = (this.img.width * hscale) + "px" + " " + (this.img.height * vscale) + "px";
                }
            }
        };

        this.bind("Draw", draw).bind("RemoveComponent", function (id) {
            if (id === "Sprite") this.unbind("Draw", draw);
        });
    },

    /**@
     * #.sprite
     * @comp Sprite
     * @sign public this .sprite(Number x, Number y[, Number w, Number h])
     * @param x - X cell position
     * @param y - Y cell position
     * @param w - Width in cells. Optional.
     * @param h - Height in cells. Optional.
     *
     * Uses a new location on the sprite map as its sprite. If w or h are ommitted, the width and height are not changed.
     *
     * Values should be in tiles or cells (not pixels).
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Sprite")
     *   .sprite(0, 0, 2, 2);
     * ~~~
     */

    /**@
     * #.__coord
     * @comp Sprite
     *
     * The coordinate of the slide within the sprite in the format of [x, y, w, h].
     */
    sprite: function (x, y, w, h) {
        this.__coord = this.__coord || [0, 0, 0, 0];

        this.__coord[0] = x * (this.__tile + this.__padding[0]) + (this.__padBorder ? this.__padding[0] : 0) + this.__trim[0];
        this.__coord[1] = y * (this.__tileh + this.__padding[1]) + (this.__padBorder ? this.__padding[1] : 0) + this.__trim[1];
        if (typeof(w)!=='undefined' && typeof(h)!=='undefined') {
            this.__coord[2] = this.__trim[2] || w * this.__tile || this.__tile;
            this.__coord[3] = this.__trim[3] || h * this.__tileh || this.__tileh;
        }

        this.trigger("Invalidate");
        return this;
    },

    /**@
     * #.crop
     * @comp Sprite
     * @sign public this .crop(Number x, Number y, Number w, Number h)
     * @param x - Offset x position
     * @param y - Offset y position
     * @param w - New width
     * @param h - New height
     *
     * If the entity needs to be smaller than the tile size, use this method to crop it.
     *
     * The values should be in pixels rather than tiles.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Sprite")
     *   .crop(40, 40, 22, 23);
     * ~~~
     */
    crop: function (x, y, w, h) {
        var old = this._mbr || this.pos();
        this.__trim = [];
        this.__trim[0] = x;
        this.__trim[1] = y;
        this.__trim[2] = w;
        this.__trim[3] = h;

        this.__coord[0] += x;
        this.__coord[1] += y;
        this.__coord[2] = w;
        this.__coord[3] = h;
        this._w = w;
        this._h = h;

        this.trigger("Invalidate", old);
        return this;
    }
});