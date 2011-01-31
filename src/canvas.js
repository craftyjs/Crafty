
/**
* Canvas Components and Extensions
*/
Crafty.c("canvas", {
	buffer: 50,
	
	init: function() {
		this.bind("reorder", function() {
			Crafty.DrawList.resort();
		});
	},
	
	draw: function() {
		var pos = { //inlined pos() function, for speed
				_x: Math.floor(this._x),
				_y: Math.floor(this._y),
				_w: Math.floor(this._w),
				_h: Math.floor(this._h)
			},
			context = Crafty.context;
			
		if(this._mbr) {
			context.save();
			
			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;
			
			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		if(this._alpha > 0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}
		
		//inline drawing of the sprite
		if(this.__c.sprite) {
			var coord = this.__coord;
			
			//draw the image on the canvas element
			context.drawImage(this.img, //image element
									 coord[0], //x position on sprite
									 coord[1], //y position on sprite
									 coord[2], //width on sprite
									 coord[3], //height on sprite
									 pos._x, //x position on canvas
									 pos._y, //y position on canvas
									 pos._w, //width on canvas
									 pos._h //height on canvas
			);
		} else this.trigger("draw", {type: "canvas", pos: pos});
		
		if(this._mbr) {
			context.restore();
		}
		if(this._alpha > 0) {
			context.globalAlpha = globalpha;
		}
		return this;
	}
});

Crafty.extend({
	context: null,
	_canvas: null,
	
	/**
	* Set the canvas element and 2D context
	*/
	canvas: function() {
		var elem = document.createElement("canvas");
		
		this.stage.elem.appendChild(elem);
		
		//check if is an actual canvas element
		if(!('getContext' in elem)) {
			Crafty.trigger("nocanvas");
			return;
		}
		
		this.context = elem.getContext('2d');
		this._canvas = elem;
		
		//set canvas and viewport to the final dimensions
		elem.width = this.viewport.width;
		elem.height = this.viewport.height;
		elem.style.position = "absolute";
	}
});