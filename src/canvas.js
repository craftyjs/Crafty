
/**
* Canvas Components and Extensions
*/
Crafty.c("canvas", {
	isCanvas: true,
	buffer: 50,
	bucket: 0,
	changeCount: 0,
	
	init: function() {
		DrawBucket.add(this);
		
		this.bind("reorder", function() {
			DrawBucket.move(this);
		});
		
		this.bind("change", function() {
			this.changeCount++;
		});
		
		//on change, redraw
		this.bind("repaint", function() {
			//add to the DrawBuffer if visible
			if(this._x + this._w > 0 - this.buffer && 
			   this._y + this._h > 0 - this.buffer && 
			   this._x < Crafty.viewport.width + this.buffer && 
			   this._y < Crafty.viewport.height + this.buffer) {
				DrawBucket.draw(this.bucket);
			}
		});
		
		this.bind("remove", function() {
			DrawBucket.remove(this);
		});
	},
	
	draw: function() {	
		var co = {}, //cached obj of position in sprite with offset
			pos = { //inlined pos() function, for speed
				_x: Math.floor(this._x),
				_y: Math.floor(this._y),
				_w: Math.floor(this._w),
				_h: Math.floor(this._h)
			},
			coord = this.__coord || [],
			context = Crafty.context[this.bucket];

		//if offset
		co.x = coord[0];
		co.y = coord[1];
		co.w = coord[2];
		co.h = coord[3];
			
		if(this._mbr) {
			context.save();
			
			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;
			
			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		var globalpha = context.globalAlpha;
		context.globalAlpha = this._alpha;
		
		this.trigger("draw", {type: "canvas", pos: pos});
		
		//inline drawing of the sprite
		if(this.__c.sprite) {
			//don't draw if not loaded
			if(!this.img.width) return;
			
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
		}
		
		if(this._mbr) {
			context.restore();
		}
		context.globalAlpha = globalpha;
		return this;
	}
});

Crafty.extend({
	context: [],
	_canvas: [],
	
	/**
	* Set the canvas element and 2D context
	*/
	canvas: function(buckets) {
		var elem, i = 0;
		buckets = buckets || 3; //default to 3
		DrawBucket.init(buckets);
		
		for(;i<buckets;i++) {
			elem = document.createElement("canvas");
			this.stage.elem.appendChild(elem);
			
			//check if is an actual canvas element
			if(!('getContext' in elem)) {
				Crafty.trigger("nocanvas");
				return;
			}
			
			this.context[i] = elem.getContext('2d');
			this._canvas[i] = elem;
			
			//set canvas and viewport to the final dimensions
			elem.width = this.viewport.width;
			elem.height = this.viewport.height;
			elem.style.position = "absolute";
		}
	}
});

/**
* Custom algorithm for canvas optimization 
* using frequency buckets
*/
DrawBucket = {
	buckets: [],
	ents: [],
	
	init: function(size) {
		var i = 0, z = 0;
		for(;i<size;i++) {
			this.buckets[i] = {
				minZ: null,
				maxZ: null
			};
			this.ents[i] = [];
		}
	},
	
	add: function(obj) {
		var buckets = this.buckets,
			bucket = buckets[1], //choose middle bucket first
			z = obj._global;
			
		if(z < bucket.minZ || bucket.minZ === null) {
			bucket.minZ = z;
		}
		if(z > bucket.maxZ || bucket.maxZ === null) {
			bucket.maxZ = z;
		}
		obj.bucket = 1;
		this.ents[1].push(obj);
	},

	draw: function(bucket) {
		if(bucket === undefined) return;
		
		var ents = this.ents[bucket] || [],
			i = 0, l = ents.length;
		
		Crafty.context[bucket].clearRect(0, 0, Crafty.viewport.width, Crafty.viewport.height);
		ents.sort(function(a,b) { return a._global - b._global });
		
		for(;i<l;i++) {
			ents[i].draw();
		}
	},
	
	remove: function(obj) {
		var bucket = obj.bucket;
		this.seekAndDestroy(bucket, obj);
		this.draw(bucket);
	},
	
	move: function(obj) {
		this.seekAndDestroy(obj.bucket, obj);
		this.add(obj);
	},
	
	seekAndDestroy: function(b, obj) {
		var bucket = this.ents[b],
			i = 0, l = bucket.length,
			current;
			
		for(;i<l;i++) {
			current = bucket[i];
			if(current[0] === obj[0]) {
				bucket.splice(i, 1);
				return;
			}
		}
	}
};

