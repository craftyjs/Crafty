/**@
* #SpriteAnimation
* @category Animation
* Used to animate sprites by changing the sprites in the sprite map.
*/
Crafty.c("SpriteAnimation", {
	_reels: null,
	_frame: null,
	_current: null,
	
	init: function() {
		this._reels = {};
	},

	/**@
	* #.animate
	* @comp SpriteAnimation
	* @sign public this .animate(String id, Number fromX, Number y, Number toX)
	* @param id - ID of the animation reel being created
	* @param fromX - Starting `x` position on the sprite map
	* @param y - `y` position on the sprite map. Will remain constant through the animation.
	* @param toX - End `x` position on the sprite map
	* @sign public this .animate(String id, Array frames)
	* @param frames - Array of containing an array with the `x` and `y` values
	* @sign public this .animate(String id, Number duration[, Number repeatCount])
	* @param duration - Play the animation with a duration (in frames)
	* Method to setup animation reels or play pre-made reels. Animation works by changing the sprites over 
	* a duration. Only works for sprites built with the Crafty.sprite methods. See the Tween component for animation of 2D properties.
	*
	* To setup an animation reel, pass the name of the reel (used to identify the reel and play it later), and either an 
	* array of absolute sprite positions or the start x on the sprite map, the y on the sprite map and then the end x on the sprite map.
	*
	* To play a reel, pass the name of the reel and the duration it should play for (in frames). If you need
	* to repeat the animation, simply pass in the amount of times the animation should repeat. To repeat
	* forever, pass in `-1`.
	*
	* @triggers AnimationEnd - When the animation finishes
	*/
	animate: function(id, fromx, y, tox) {
		var reel, i, tile, duration;
        
        //play a reel
		if(arguments.length < 4 && typeof fromx === "number") {
			//make sure not currently animating
			this._current = id;
			
			reel = this._reels[id];
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
                        var pos = this._frame.reel[0];
                        this.__coord[0] = pos[0];
                        this.__coord[1] = pos[1];

			this.bind("enterframe", this.drawFrame);
			return this;
		}
		if(typeof fromx === "number") {
			i = fromx;
			reel = [];
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
	
	/**@
	* #.stop
	* @comp SpriteAnimation
	* @sign public this .stop(void)
	* @triggers AnimationEnd - Animation is ended
	* Stop any animation currently playing.
	*/
	stop: function() {
		this.unbind("enterframe", this.drawFrame);
		this.unbind("AnimationEnd");
		this._current = null;
		this._frame = null;
		
		return this;
	},
	
	/**@
	* #.reset
	* @comp SpriteAnimation
	* @sign public this .reset(void)
	* Method will reset the entities sprite to its original.
	*/
	reset: function() {
		if(!this._frame) return this;
		
		var co = this._frame.reel[0];
		this.__coord[0] = co[0];
		this.__coord[1] = co[1];
		this.stop();
		
		return this;
	},
	
	/**@
	* #.isPlaying
	* @comp SpriteAnimation
	* @sign public Boolean .isPlaying([String reel])
	* @reel reel - Determine if this reel is playing
	* Determines if an animation is currently playing. If a reel is passed, it will determine
	* if the passed reel is playing.
	*/
	isPlaying: function(id) {
		if(!id) return !!this._interval;
		return this._current === id; 
	}
});

/**@
* #Tween
* @category Animation
* Component to animate the change in 2D properties over time.
*/
Crafty.c("Tween", {
	/**@
	* #.tween
	* @comp Tween
	* @sign public this .tween(Object properties, Number duration)
	* @param properties - Object of 2D properties and what they should animate to
	* @param duration - Duration to animate the properties over (in frames)
	* This method will animate a 2D entities properties over the specified duration.
	* These include `x`, `y`, `w`, `h`, `alpha` and `rotation`.
	*
	* The object passed should have the properties as keys and the value should be the resulting
	* values of the properties.
	* @example
	* Move an object to 100,100 and fade out in 200 frames.
	* ~~~
	* Crafty.e("2D")
	*    .attr({alpha: 1.0, x: 0, y: 0})
	*    .tween({alpha: 0.0, x: 100, y: 100}, 200)
	* ~~~
	*/
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
            var prop;
            if(e.frame >= endFrame) {
				this.unbind("enterframe", d);
				return;
			}
			for(prop in props) {
				this[prop] += step[prop];
			}
		});
		
		return this;
	}
});