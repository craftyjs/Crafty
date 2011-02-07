Crafty.c("color", {
	_color: "",
	ready: true,
	
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
	ready: false,
	
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
			this.img = Crafty.assets[url];
			if(!this.img) {
				this.img = new Image();
				Crafty.assets[url] = this.img;
				this.img.src = url;
				var self = this;
				
				this.img.onload = function() {
					self._pattern = Crafty.context.createPattern(self.img, self._repeat);
					self.ready = true;
					self.trigger("change");
				};
				
				return this;
			} else {
				this.ready = true;
				this._pattern = Crafty.context.createPattern(this.img, this._repeat);
					
			}
		}
		this.trigger("change");
		
		return this;
	},
	
	canvasDraw: function(e) {
		//skip if no image
		if(!this.ready || !this._pattern) return;
		
		var context = Crafty.context;
		
		context.fillStyle = this._pattern;
		
		context.save();
		context.translate(e.pos._x, e.pos._y);
		context.fillRect(0,0,e.pos._w,e.pos._h);
		context.restore();
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,
	
	scene: function(name, fn) {
		//play scene
		if(arguments.length === 1) {
			Crafty("2D").each(function() {
				if(!this.has("persist")) this.destroy();
			}); //clear screen of all 2D objects except persist
			this._scenes[name].call(this);
			this._current = name;
			return;
		}
		//add scene
		this._scenes[name] = fn;
		return;
	}
});

Crafty.DrawList = (function() {
	var list = [];
	
	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(obj, start) {
			for (var i = (start || 0), j = this.length; i < j; i++) {
				if (this[i] == obj) { return i; }
			}
			return -1;
		};
	}
	
	return {
		add: function add(obj) {
			if(list.indexOf(obj) === -1) {
				list.push(obj);
				list.sort(function(a,b) { return a._global - b._global; });
			}
		},
		
		remove: function remove(obj) {
			var index = list.indexOf(obj);
			if(index !== -1) {
				list.splice(index, 1);
			}
		},
		
		draw: function draw() {
			if(!this.change) return; //only draw if something changed
			
			Crafty.context.clearRect(0,0, Crafty._canvas.width, Crafty._canvas.height);
			var i = 0, l = list.length;
			for(;i<l;i++) {
				if(!list[i] || !('draw' in list[i])) {
					this.remove(list[i]);
					continue;
				}
				list[i].draw();
			}
			this.change = false;
		},
		
		resort: function resort() {
			list.sort(function(a,b) { return a._global - b._global; });
		},
		
		debug: function() { return list; },
		
		change: false
	};
})();