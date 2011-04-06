/**
* Animation component
*
* Crafty(player).animate("walk_left", 0, 1, 4, 100);
* Crafty(player).animate("walk_left");
* Crafty(player).stop();
*/
Crafty.c("Animate", {
	_reels: null,
	_frame: null,
	_current: null,
	
	init: function() {
		this._reels = {};
	},

	animate: function(id, fromx, y, tox) {
		//play a reel
		if(arguments.length < 4 && typeof fromx === "number") {
			//make sure not currently animating
			this._current = id;
			
			var reel = this._reels[id],
				duration = fromx;
			this._frame = {
				reel: reel, //reel to play
				frameTime: Math.ceil(duration / reel.length), //number of frames inbetween slides
				frame: 0, //current slide/frame
				current: 0,
				repeat: 0
			};
			if (arguments.length === 3 && typeof y === "number") {
				//User provided repetition count
				if (y === -1) this._frame.repeatInfinitly = true;
				else this._frame.repeat = y;
			}
			this.bind("enterframe", this.drawFrame);
			return this;
		}
		if(typeof fromx === "number") {
			var i = fromx,
				reel = [],
				tile = this.__tile;
				
			if (tox > fromx) {
				for(;i<=tox;i++) {
					reel.push([i * tile, y * tile]);
				}
			} else {
				for(;i>=tox;i--) {
					reel.push([i * tile, y * tile]);
				}
			}
			
			this._reels[id] = reel;
		} else if(typeof fromx === "object") {
			this._reels[id] = fromx;
		}
		
		return this;
	},
	
	drawFrame: function(e) {
		var data = this._frame;
		
		if(this._frame.current++ === data.frameTime) {
			var pos = data.reel[data.frame++];
			
			this.__coord[0] = pos[0];
			this.__coord[1] = pos[1];
			this._frame.current = 0;
		}
		
		
		if(data.frame === data.reel.length && this._frame.current === data.frameTime) {
			data.frame = 0;
			if (this._frame.repeatInfinitly === true || this._frame.repeat > 0) {
				if (this._frame.repeat) this._frame.repeat--;
				this._frame.current = 0;
				this._frame.frame = 0;
			} else {
				this.trigger("AnimationEnd", {reel: data.reel});
				this.stop();
				return;
			}
		}
		
		this.trigger("change");
	},
	
	stop: function() {
		this.unbind("enterframe", this.drawFrame);
		this.unbind("AnimationEnd");
		this._current = null;
		this._frame = null;
		
		return this;
	},
	
	reset: function() {
		if(!this._frame) return this;
		
		var co = this._frame.reel[0];
		this.__coord[0] = co[0];
		this.__coord[1] = co[1];
		this.stop();
		
		return this;
	},
	
	isPlaying: function(id) {
		if(!id) return !!this._interval;
		return this._current === id; 
	}
});

Crafty.c("Tween", {
	tween: function(props, duration) {
		var prop,
			old = {},
			step = {},
			startFrame = Crafty.frame(),
			endFrame = startFrame + duration;
		
		//store the old properties
		for(prop in props) {
			old[prop] = this['_'+prop];
			step[prop] = (props[prop] - old[prop]) / duration;
		}
		
		this.bind("enterframe", function d(e) {
			if(e.frame >= endFrame) {
				this.unbind("enterframe", d);
				return;
			}
			for(prop in props) {
				this[prop] += step[prop];
			}
		});
	}
});