/**
* Canvas Components and Extensions
*/
Crafty.c("canvas", {
	buffer: 50,
	
	init: function() {
		//increment the amount of canvas objs
		Crafty.DrawManager.total2D++;
		
		this.bind("change", function(e) {
			//if within screen, add to list			
			/**
			* TODO:
			* Optimize so don't redraw if rectangle is out of bounds
			* Register but if already registered, widen RECT
			*/
			
			if(this._changed === false) {
				this._changed = Crafty.DrawManager.add(e || this, this);
			} else {
				if(e) this._changed = Crafty.DrawManager.add(e, this);
			}
		});
		
		this.bind("remove", function() {
			Crafty.DrawManager.total2D--;
			Crafty.DrawManager.add(this,this);
		});
	},
	
	draw: function(ctx,x,y,w,h) {
		if(!this.ready) return; 
		if(arguments.length === 4) {
			h = w;
			w = y;
			y = x;
			x = ctx;
			ctx = Crafty.context;
		}
		
		var pos = { //inlined pos() function, for speed
				_x: (this._x + (x || 0)),
				_y: (this._y + (y || 0)),
				_w: (w || this._w),
				_h: (h || this._h)
			},
			context = ctx || Crafty.context,
			coord = this.__coord || [0,0,0,0],
			co = {
				x: coord[0] + (x || 0),
				y: coord[1] + (y || 0),
				w: w || coord[2],
				h: h || coord[3]
			};
			
		if(this._mbr) {
			context.save();
			
			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;
			
			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		if(this._alpha < 1.0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}
		
		this.trigger("draw", {type: "canvas", pos: pos, co: co, ctx: context});
		
		if(this._mbr) {
			context.restore();
		}
		if(this._alpha < 1.0) {
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
			Crafty.stop();
			return;
		}
		
		this.context = elem.getContext('2d');
		this._canvas = elem;
		
		//set canvas and viewport to the final dimensions
		elem.width = this.viewport.width;
		elem.height = this.viewport.height;
		elem.style.position = "absolute";
		elem.style.left = "0px";
		elem.style.top = "0px";
	}
});