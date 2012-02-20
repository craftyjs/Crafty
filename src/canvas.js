/**@
* #Canvas
* @category Graphics
* Draws itself onto a canvas. Crafty.canvas.init() must be called before hand to initialize
* the canvas element.
* @trigger Draw - when the entity is ready to be drawn to the stage - {type: "canvas", pos, co, ctx}
* @trigger NoCanvas - if the browser does not support canvas
*/
Crafty.c("Canvas", {

	init: function () {
		if (!Crafty.canvas.context) {
			Crafty.canvas.init();
		}

		//increment the amount of canvas objs
		Crafty.DrawManager.total2D++;

		this.bind("Change", function (e) {
			//if within screen, add to list
			if (this._changed === false) {
				this._changed = Crafty.DrawManager.add(e || this, this);
			} else {
				if (e) this._changed = Crafty.DrawManager.add(e, this);
			}
		});

		this.bind("Remove", function () {
			Crafty.DrawManager.total2D--;
			Crafty.DrawManager.add(this, this);
		});
	},

	/**@
	* #.draw
	* @comp Canvas
	* @sign public this .draw([[Context ctx, ]Number x, Number y, Number w, Number h])
	* @param ctx - Canvas 2D context if drawing on another canvas is required
	* @param x - X offset for drawing a segment
	* @param y - Y offset for drawing a segment
	* @param w - Width of the segement to draw
	* @param h - Height of the segment to draw
	* Method to draw the entity on the canvas element. Can pass rect values for redrawing a segment of the entity.
	*/
	draw: function (ctx, x, y, w, h) {
		if (!this.ready) return;
		if (arguments.length === 4) {
			h = w;
			w = y;
			y = x;
			x = ctx;
			ctx = Crafty.canvas.context;
		}

		var pos = { //inlined pos() function, for speed
			_x: (this._x + (x || 0)),
			_y: (this._y + (y || 0)),
			_w: (w || this._w),
			_h: (h || this._h)
		},
			context = ctx || Crafty.canvas.context,
			coord = this.__coord || [0, 0, 0, 0],
			co = {
			x: coord[0] + (x || 0),
			y: coord[1] + (y || 0),
			w: w || coord[2],
			h: h || coord[3]
		};

		if (this._mbr) {
			context.save();

			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;

			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}

		//draw with alpha
		if (this._alpha < 1.0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}

		this.trigger("Draw", { type: "canvas", pos: pos, co: co, ctx: context });

		if (this._mbr) {
			context.restore();
		}
		if (globalpha) {
			context.globalAlpha = globalpha;
		}
		return this;
	}
});

/**@
* #Crafty.canvas
* @category Graphics
* Collection of methods to draw on canvas.
*/
Crafty.extend({
	canvas: {
	/**@
		* #Crafty.canvas.context
		* @comp Crafty.canvas
		* This will return the 2D context of the main canvas element.
		* The value returned from `Crafty.canvas._canvas.getContext('2d')`.
		*/
		context: null,
		/**@
		* #Crafty.canvas._canvas
		* @comp Crafty.canvas
		* Main Canvas element
		*/

		/**@
		* #Crafty.canvas.init
		* @comp Crafty.canvas
		* @sign public void Crafty.canvas.init(void)
    * @trigger NoCanvas - triggered if `Crafty.support.canvas` is false
		* Creates a `canvas` element inside `Crafty.stage.elem`. Must be called
		* before any entities with the Canvas component can be drawn.
		*
		* This method will automatically be called if no `Crafty.canvas.context` is
		* found.
		*/
		init: function () {
			//check if canvas is supported
			if (!Crafty.support.canvas) {
				Crafty.trigger("NoCanvas");
				Crafty.stop();
				return;
			}

			//create 3 empty canvas elements
			var c;
			c = document.createElement("canvas");
			c.width = Crafty.viewport.width;
			c.height = Crafty.viewport.height;
			c.style.position = 'absolute';
			c.style.left = "0px";
			c.style.top = "0px";

			Crafty.stage.elem.appendChild(c);
			Crafty.canvas.context = c.getContext('2d');
			Crafty.canvas._canvas = c;
		}
	}
});
