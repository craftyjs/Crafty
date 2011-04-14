Crafty.c("Color", {
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

Crafty.c("Tint", {
	_color: null,
	_strength: 1.0,
	
	init: function() {
		this.bind("draw", function d(e) {
			var context = e.ctx || Crafty.context;
			
			context.fillStyle = this._color || "rgb(0,0,0)";
			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
		});
	},
	
	tint: function(color, strength) {
		this._strength = strength;
		this._color = Crafty.toRGB(color, this._strength);
		
		this.trigger("change");
	}
});

Crafty.c("Image", {
	_repeat: "repeat",
	ready: false,
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "canvas") {
				//skip if no image
				if(!this.ready || !this._pattern) return;
				
				var context = e.ctx;
				
				context.fillStyle = this._pattern;
				
				//context.save();
				//context.translate(e.pos._x, e.pos._y);
				context.fillRect(this._x,this._y,this._w, this._h);
				//context.restore();
			} else if(e.type === "DOM") {
				if(this.__image) 
					e.style.background = "url(" + this.__image + ") "+this._repeat;
			}
		});
	},
	
	image: function(url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";
		
		
		this.img = Crafty.assets[url];
		if(!this.img) {
			this.img = new Image();
			Crafty.assets[url] = this.img;
			this.img.src = url;
			var self = this;
			
			this.img.onload = function() {
				if(self.has("Canvas")) self._pattern = Crafty.context.createPattern(self.img, self._repeat);
				self.ready = true;
				
				if(self._repeat === "no-repeat") {
					self.w = self.img.width;
					self.h = self.img.height;
				}
				
				self.trigger("change");
			};
			
			return this;
		} else {
			this.ready = true;
			if(this.has("Canvas")) this._pattern = Crafty.context.createPattern(this.img, this._repeat);
			if(this._repeat === "no-repeat") {
				this.w = this.img.width;
				this.h = this.img.height;
			}
		}
		
		
		this.trigger("change");
		
		return this;
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
	},
	
	rgbLookup:{},
	
	toRGB: function(hex,alpha) {
		var lookup = this.rgbLookup[hex];
		if(lookup) return lookup;
		
		var hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex,
			c = [], result;
			
		c[0] = parseInt(hex.substr(0, 2), 16);
		c[1] = parseInt(hex.substr(2, 2), 16);
		c[2] = parseInt(hex.substr(4, 2), 16);
			
		result = alpha === undefined ? 'rgb('+c.join(',')+')' : 'rgba('+c.join(',')+','+alpha+')';
		lookup = result;
		
		return result;
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
		dom = [];
	
	return {
		/** Quick count of 2D objects */
		total2D: Crafty("2D").length,
		
		onScreen: function(rect) {
			return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
				   Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
		},
		
		merge: function(set) {
			do {
				var newset = [], didMerge = false, i = 0,
					l = set.length, current, next, merger;
				
				while(i < l) {
					current = set[i];
					next = set[i+1];
					
					if(i < l - 1 && current._x < next._x + next._w && current._x + current._w > next._x &&
									current._y < next._y + next._h && current._h + current._y > next._y) {	
						
						merger = {
							_x: ~~Math.min(current._x, next._x),
							_y: ~~Math.min(current._y, next._y),
							_w: Math.max(current._x, next._x) + Math.max(current._w, next._w),
							_h: Math.max(current._y, next._y) + Math.max(current._h, next._h)
						};
						merger._w = merger._w - merger._x;
						merger._h = merger._h - merger._y;
						merger._w = (merger._w == ~~merger._w) ? merger._w : merger._w + 1 | 0;
						merger._h = (merger._h == ~~merger._h) ? merger._h : merger._h + 1 | 0;
						
						newset.push(merger);
					
						i++;
						didMerge = true;
					} else newset.push(current);
					i++;
				}

				set = newset.length ? Crafty.clone(newset) : set;
				
				if(didMerge) i = 0;
			} while(didMerge);
			
			return set;
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
				rect = old.mbr() || old.pos();
			} else {
				rect =  {
					_x: ~~Math.min(before._x, after._x),
					_y: ~~Math.min(before._y, after._y),
					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
				};
				
				rect._w = (rect._w - rect._x);
				rect._h = (rect._h - rect._y);
			}
			
			if(rect._w === 0 || rect._h === 0 || !this.onScreen(rect)) {
				return false;
			}
			
			//floor/ceil
			rect._x = ~~rect._x;
			rect._y = ~~rect._y;
			rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
			rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;
			
			//add to register, check for merging
			register.push(rect);
			
			//if it got merged
			return true;
		},
		
		debug: function() {
			console.log(register, dom);
		},
		
		drawAll: function(rect) {
			var rect = rect || Crafty.viewport.rect(), q,
				i = 0, l, ctx = Crafty.context,
				current;
			
			q = Crafty.map.search(rect);
			l = q.length;
			
			ctx.clearRect(rect._x, rect._y, rect._w, rect._h);
			
			q.sort(function(a,b) { return a._global - b._global; });
			for(;i<l;i++) {
				current = q[i];
				if(current._visible && current.__c.Canvas) {
					current.draw();
					current._changed = false;
				}
			}
		},

		/**
		* Calculate the common bounding rect of multiple canvas entities
		* Returns coords
		*/
		boundingRect: function(set) {
			if (!set || !set.length) return;
			var newset = [], i = 1,
			l = set.length, current, master=set[0], tmp;
			master=[master._x, master._y, master._x + master._w, master._y + master._h];
			while(i < l) {
				current = set[i];
				tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
				if (tmp[0]<master[0]) master[0] = tmp[0];
				if (tmp[1]<master[1]) master[1] = tmp[1];
				if (tmp[2]>master[2]) master[2] = tmp[2];
				if (tmp[3]>master[3]) master[3] = tmp[3];
				i++;
			}
			tmp=master;
			master={_x:tmp[0],_y:tmp[1],_w:tmp[2]-tmp[0],_h:tmp[3]-tmp[1]};

			return master;
		},

		/**
		* Redraw all the dirty regions
		*/
		draw: function draw() {
			//if nothing in register, stop
			if(!register.length && !dom.length) return;
			
			var i = 0, l = register.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [], ctx = Crafty.context;
				
			//loop over all DOM elements needing updating
			for(;i<k;++i) {
				dom[i].draw()._changed = false;
			}
			//reset counter and DOM array
			dom.length = i = 0;
			
			//again, stop if nothing in register
			if(!l) { return; }
			
			//if the amount of rects is over 60% of the total objects
			//do the naive method redrawing
			if(l / this.total2D > 0.6) {
				this.drawAll();
				register.length = 0;
				return;
			}
			
			register = this.merge(register);
			for(;i<l;++i) { //loop over every dirty rect
				rect = register[i];
				if(!rect) continue;
				q = Crafty.map.search(rect); //search for ents under dirty rect
				
				dupes = {};
				
				//loop over found objects removing dupes and adding to obj array
				for(j = 0, len = q.length; j < len; ++j) {
					obj = q[j];
					
					if(dupes[obj[0]] || !obj._visible || !obj.has("Canvas"))
						continue;
					dupes[obj[0]] = true;
					
					objs.push({obj: obj, rect: rect});
				}
				
				//clear the rect from the main canvas
				ctx.clearRect(rect._x, rect._y, rect._w, rect._h);
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
				if(ent.has('Image') || ent._mbr) {
					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x + w, y);
					ctx.lineTo(x + w, h + y);
					ctx.lineTo(x, h + y);
					ctx.lineTo(x, y);
					
					ctx.clip();
					ent.draw();
					ctx.restore();
				//if it is axis-aligned and no pattern, draw subrect
				} else {
					ent.draw(x,y,w,h);
				}
				
				//allow entity to re-register
				ent._changed = false;
			}
			
			//empty register
			register.length = 0;
			//all merged IDs are now invalid
			merged = {};
		}
	};
})();