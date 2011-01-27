Crafty.c("color", {
	_color: "",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if(e.type === "canvas") {
				if(this._color) Crafty.context[this.bucket].fillStyle = this._color;
				Crafty.context[this.bucket].fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
			}
		});
	},
	
	color: function(color) {
		this._color = color;
		this.trigger("change");
		return this;
	}
});

Crafty.c("image", {
	_repeat: "repeat",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "canvas") {
				this.canvasDraw(e);
			} else if(e.type === "DOM") {
				if(this.__image) 
					e.style.background = "url(" + this.__image + ") "+this._repeat;
			}
		});
	},
	
	image: function(url, repeat) {
		this.__image = url;
		this._repeat = repeat || "repeat";
		
		if(this.has("canvas")) {
			this.img = new Image();
			this.img.src = url;
			
			//draw when ready
			var self = this;
			this.img.onload = function() {
				DrawBucket.draw(self.bucket);
			};
		} else {
			this.trigger("change");
		}
		
		return this;
	},
	
	canvasDraw: function(e) {
		//skip if no image
		if(!this.img) return;
		
		var i = 0, l, j, k, 
			obj = e.pos || this,
			xoffcut = this._w % this.img.width || this.img.width,
			yoffcut = this._h % this.img.height || this.img.height,
			width = this._w < this.img.width ? xoffcut : this.img.width,
			height = this._h < this.img.height ? yoffcut : this.img.height,
			context =  Crafty.context[this.bucket];
		
		if(this._repeat === "no-repeat") {
			//draw once with no repeat
			context.drawImage(this.img, 0,0, width, height, obj._x, obj._y, width, height);
		} else if(this._repeat === "repeat-x") {
			//repeat along the x axis
			for(l = Math.ceil(this._w / this.img.width); i < l; i++) {
				if(i === l-1) width = xoffcut;
				
				context.drawImage(this.img, 0, 0, width, height, obj._x + this.img.width * i, obj._y, width, height);
			}
		} else if(this._repeat === "repeat-y") {
			//repeat along the y axis
			for(l = Math.ceil(this._h / this.img.height); i < l; i++) {
				//if the last image, determin how much to offcut
				if(i === l-1) height = yoffcut;
				
				context.drawImage(this.img, 0,0, width, height, obj._x, obj._y + this.img.height * i, width, height);
			}
		} else {
			//repeat all axis
			for(l = Math.ceil(this._w / this.img.width); i < l; i++) {
				if(i === l-1) width = xoffcut;
				context.drawImage(this.img, 0,0, width, height, obj._x + this.img.width * i, obj._y, width, height);
				height = this._h < this.img.height ? yoffcut : this.img.height;
				
				for(j = 0, k = Math.ceil(this._h / this.img.height); j < k; j++) {
					if(j === k-1) height = yoffcut;
					context.drawImage(this.img, 0,0, width, height, obj._x + this.img.width * i, obj._y + this.img.height * j, width, height);
				}
			}
		}
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,
	
	scene: function(name, fn) {
		//play scene
		if(arguments.length === 1) {
			Crafty("2D").destroy(); //clear screen
			this._scenes[name].call(this);
			this._current = name;
			return;
		}
		//add scene
		this._scenes[name] = fn;
		return;
	}
});