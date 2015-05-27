var Crafty = require('../core/core.js');


// 
// Define some variables required for webgl
var fs = require('fs');
var IMAGE_VERTEX_SHADER = fs.readFileSync(__dirname + '/shaders/sprite.vert', 'utf8');
var IMAGE_FRAGMENT_SHADER = fs.readFileSync(__dirname + '/shaders/sprite.frag', 'utf8');
var IMAGE_ATTRIBUTE_LIST = [
    {name:"aPosition", width: 2},
    {name:"aOrientation", width: 3},
    {name:"aLayer", width:2},
    {name:"aTextureCoord",  width: 2}
];

/**@
 * #Image
 * @category Graphics
 * Draw an image with or without repeating (tiling).
 */
Crafty.c("Image", {
    _repeat: "repeat",
    ready: false,

    init: function () {
        this.bind("Draw", this._drawImage);
    },

    remove: function() {
        this.unbind("Draw", this._drawImage);
        // Unregister webgl entities
        if (this.program) {
            this.program.unregisterEntity(this);
        }
    },

    /**@
     * #.image
     * @comp Image
     * @trigger Invalidate - when the image is loaded
     * @sign public this .image(String url[, String repeat])
     * @param url - URL of the image
     * @param repeat - If the image should be repeated to fill the entity.
     *
     * Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
     *
     * *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
     *
     * If the width and height are `0` and repeat is set to `no-repeat` the width and
     * height will automatically assume that of the image. This is an
     * easy way to create an image without needing sprites.
     *
     * If set to `no-repeat` and given dimensions larger than that of the image, the exact appearance will depend on what renderer (WebGL, DOM, or Canvas) is used.
     *
     * @example
     * Will default to no-repeat. Entity width and height will be set to the images width and height
     * ~~~
     * var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
     * ~~~
     * Create a repeating background.
     * ~~~
     * var bg = Crafty.e("2D, DOM, Image")
     *              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
     *              .image("bg.png", "repeat");
     * ~~~
     *
     * @see Crafty.sprite
     */
    image: function (url, repeat) {
        this.__image = url;
        this._repeat = repeat || "no-repeat";

        this.img = Crafty.asset(url);
        if (!this.img) {
            this.img = new Image();
            Crafty.asset(url, this.img);
            this.img.src = url;
            var self = this;

            this.img.onload = function () {
                self._onImageLoad();
            };
        } else {
            this._onImageLoad();
        }


        this.trigger("Invalidate");

        return this;
    },

    _onImageLoad: function(){
        
        if (this.has("Canvas")) {
            this._pattern = this._drawContext.createPattern(this.img, this._repeat);
        } else if (this.has("WebGL")) {
            this._establishShader("image:" + this.__image, IMAGE_FRAGMENT_SHADER, IMAGE_VERTEX_SHADER, IMAGE_ATTRIBUTE_LIST);
            this.program.setTexture( this.webgl.makeTexture(this.__image, this.img, (this._repeat!=="no-repeat")));
        }

        if (this._repeat === "no-repeat") {
            this.w = this.w || this.img.width;
            this.h = this.h || this.img.height;
        }

        
        
        this.ready = true;
        this.trigger("Invalidate");
    },

    _drawImage: function(e){
        if (e.type === "canvas") {
            //skip if no image
            if (!this.ready || !this._pattern) return;

            var context = e.ctx;

            context.fillStyle = this._pattern;

            context.save();
            context.translate(e.pos._x, e.pos._y);
            context.fillRect(0, 0, e.pos._w, e.pos._h);
            context.restore();
        } else if (e.type === "DOM") {
            if (this.__image) {
              e.style.backgroundImage = "url(" + this.__image + ")";
              e.style.backgroundRepeat = this._repeat;
            }
        } else if (e.type === "webgl") {
            var pos = e.pos;
            // Write texture coordinates
            e.program.writeVector("aTextureCoord",
                0, 0,
                0, pos._h,
                pos._w, 0,
                pos._w, pos._h
            );
        }

    }
});