Crafty.c("color", {
	_color: "",
	ready: true,
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if(e.type === "canvas") {
				if(this._color) e.ctx.fillStyle = this._color;
				e.ctx.fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
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
					
					if(repeat === "no-repeat") {
						self.w = self.img.width;
						self.h = self.img.height;
					}
					
					self.trigger("change");
				};
				
				return this;
			} else {
				this.ready = true;
				this._pattern = Crafty.context.createPattern(this.img, this._repeat);
				if(repeat === "no-repeat") {
					this.w = this.img.width;
					this.h = this.img.height;
				}
			}
		}
		
		this.trigger("change");
		
		return this;
	},
	
	canvasDraw: function(e) {
		//skip if no image
		if(!this.ready || !this._pattern) return;
		
		var context = e.ctx;
		
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

/**
* Draw Manager will manage objects to be drawn and implement
* the best method of drawing in both DOM and canvas
*/
Crafty.DrawManager = (function() {
	/** array of dirty rects on screen */
	var register = [],
	/** array of DOMs needed updating */
		dom = [],
	/** temporary canvas object */
		canv = document.createElement("canvas"),
	/** context of canvas object */
		ctx = canv.getContext('2d');
	
	return {
		/** Quick count of 2D objects */
		total2D: Crafty("2D").length,
		
		grow: function(i, before, after) {
			var rect = register[i];
			if(!rect) {
				return this.add(before, after);
			}
			
			before = before._mbr || before;
			after = after._mbr || after;
			
			rect._x = Math.min(rect._x, before._x, after._x);
			rect._y = Math.min(rect._y, before._y, after._y);
			rect._w = Math.max(rect._w, before._w, after._w) + Math.max(rect._x, before._x, after._x) - rect._x;
			rect._h = Math.max(rect._h, before._h, after._h) + Math.max(rect._y, before._y, after._y) - rect._y;
			
			if(!this.onScreen(rect)) {
				delete register[i];
				return false;
			}
			return i;
		},
		
		onScreen: function(rect) {
			return rect._x + rect._w > 0 && rect._y + rect._h > 0 &&
				   rect._x < Crafty.viewport.width && rect._y < Crafty.viewport.height;
		},
		
		/**
		* Calculate the bounding rect of dirty data
		* and add to the register
		*/
		add: function add(old,current) {
			if(!current) {
				dom.push(old);
				return;
			}
			
			var rect,
				before = old._mbr || old,
				after = current._mbr || current;
				
			if(old === current) {
				rect = old;
			} else {
				rect =  {
					_x: ~~Math.min(before._x, after._x),
					_y: ~~Math.min(before._y, after._y),
					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
				};
				
				rect._w = (rect._w - rect._x);
				rect._h = (rect._h - rect._y);
				rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
				rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;
			}
			
			if(rect._w === 0 || rect._h === 0) {
				current._changed = false;
				return;
			}
			if(!this.onScreen(rect)) {
				current._changed = false;
				return;
			}
			
			return register.push(rect);
		},
		
		debug: function() {
			console.log(register, dom);
		},
		
		drawAll: function() {
			var q = Crafty.map.search(Crafty.viewport.rect()),
				i = 0, l = q.length,
				current;
			
			Crafty.context.clearRect(0,0, Crafty._canvas.width, Crafty._canvas.height);
			
			q.sort(function(a,b) { return a._global - b._global; });
			for(;i<l;i++) {
				current = q[i];
				if(current._visible && current.has("canvas")) {
					current.draw();
					current._changed = false;
				}
			}
		},
		
		/**
		* Redraw all the dirty regions
		*/
		draw: function draw() {
			//if nothing in register, stop
			if(!register.length && !dom.length) return;
			
			var i = 0, l = register.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [];
				
			//loop over all DOM elements needing updating
			for(;i<k;++i) {
				dom[i].draw()._changed = false;
			}
			//reset counter and DOM array
			dom.length = i = 0;
			
			//again, stop if nothing in register
			if(!l) { console.log("NO REGISTERED"); return; }
			
			//if the amount of rects is over 60% of the total objects
			//do the naive method redrawing
			if(l / this.total2D > 0.6) {
				this.drawAll();
				register.length = 0;
				return;
			}
				
			for(;i<l;++i) { //loop over every dirty rect
				rect = register[i];
				if(!rect) continue;
				q = Crafty.map.search(rect); //search for ents under dirty rect
				
				dupes = {};
				
				//loop over found objects removing dupes and adding to obj array
				for(j = 0, len = q.length; j < len; ++j) {
					obj = q[j];
					//TODO: Add rectangle intersection check
					if(dupes[obj[0]] || !obj._visible || !obj.has("canvas"))
						continue;
					dupes[obj[0]] = true;
					
					objs.push({obj: obj, rect: rect});
				}
				
				//clear the rect from the main canvas
				Crafty.context.clearRect(rect._x, rect._y, rect._w, rect._h);
			}
			
			//sort the objects by the global Z
			objs.sort(function(a,b) { return a.obj._global - b.obj._global; });
			if(!objs.length){  return; }
			
			//loop over the objects
			for(i = 0, l = objs.length; i < l; ++i) {
				obj = objs[i];
				rect = obj.rect;
				ent = obj.obj;
				
				var area = ent._mbr || ent, 
					x = (rect._x - area._x <= 0) ? 0 : ~~(rect._x - area._x),
					y = (rect._y - area._y < 0) ? 0 : ~~(rect._y - area._y),
					w = ~~Math.min(area._w - x, rect._w - (area._x - rect._x), rect._w, area._w),
					h = ~~Math.min(area._h - y, rect._h - (area._y - rect._y), rect._h, area._h);
				
				
				//no point drawing with no width or height
				if(h === 0 || w === 0) continue;
				
				//if it is a pattern or has some rotation, draw it on the temp canvas
				if(ent.has('image') || ent._mbr) {
					canv.width = area._w;
					canv.height = area._h;
					
					ctx.save();
					ctx.translate(-area._x, -area._y);
					ent.draw(ctx);
					Crafty.context.drawImage(canv, x, y, w, h, area._x + x, area._y + y, w, h);
					ctx.restore();
					ctx.clearRect(0,0,canv.width, canv.height);
				//if it is axis-aligned and no pattern, draw subrect
				} else ent.draw(x,y,w,h);
				
				//allow entity to re-register
				ent._changed = false;
			}
			
			//empty register
			register.length = 0;
		}
	};
})();
	
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
			
			if(Crafty.context) Crafty.context.clearRect(0,0, Crafty._canvas.width, Crafty._canvas.height);
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