Crafty.c("color", {
	_color: "",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if(e.type === "canvas") {
				if(this._color) Crafty.context.fillStyle = this._color;
				Crafty.context.fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
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
				this.canvasDraw();
			} else if(e.type === "DOM") {
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
			Crafty.addEvent(this, this.img, 'load', function() {
				DrawBuffer.add(this); //send to buffer to keep Z order
			});
		}
		this.trigger("change");
		return this;
	},
	
	canvasDraw: function() {
		//skip if no image
		if(!this.img) return;
		
		var i = 0, l, j = 0, k;
		
		if(this._repeat === "no-repeat") {
			
		} else if(this._repeat === "repeat-x") {
			if(this.img.width === 0) return;
			
			for(l = Math.floor(this._w / this.img.width); i < l; i++) {
				Crafty.context.drawImage(this.img, this._x + this.img.width * i, this._y);
			}
		} else if(this._repeat === "repeat-y") {
			if(this.img.height === 0) return;
			
			for(l = Math.floor(this._h / this.img.height); i <= l; i++) {
				Crafty.context.drawImage(this.img, this._x, this._y + this.img.height * i);
			}
		} else {
			if(this.img.width === 0 || this.img.height === 0) return;
			
			for(l = Math.floor(this._w / this.img.width); i < l; i++) {
				Crafty.context.drawImage(this.img, this._x + this.img.width * i, this._y);
				for(j = 0, k = Math.floor(this._h / this.img.height); j <= k; j++) {
					Crafty.context.drawImage(this.img, this._x + this.img.width * i, this._y + this.img.height * j);
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