/**@
* #SpriteAnimation
* @category Animation
* @trigger AnimationEnd - When the animation finishes - { reelID }
* @trigger Change - On each frame { reelID, frameNumber }
*
* Used to animate sprites by treating a sprite map as a set of animation frames.
* Must be applied to an entity that has a sprite-map component.
*
* @see crafty.sprite
*/
Crafty.c("SpriteAnimation", {
	/**@
	* #._reels
	* @comp SpriteAnimation
	*
	* A map in which the keys are the names assigned to animations defined using
	* the component (also known as reelIDs), and the values are objects describing
	* the animation and its state.
	*/
	_reels: null,

	/**@
	* #._currentReelId
	* @comp SpriteAnimation
	*
	* The reelID of the currently playing reel (which is one of the elements in `this._reels`).
	* This value is `null` if no reel is playing.
	*/
	_currentReelId: null,

	init: function () {
		this._reels = {};
	},

	/**@
	* #.animate
	* @comp SpriteAnimation
	* @sign public this .animate(String reelId, Number fromX, Number y, Number toX)
	* @param reelId - ID of the animation reel being created
	* @param fromX - Starting `x` position on the sprite map (x's unit is the horizontal size of the sprite in the sprite map).
	* @param y - `y` position on the sprite map (y's unit is the horizontal size of the sprite in the sprite map). Remains constant through the animation.
	* @param toX - End `x` position on the sprite map. This can be smaller than `fromX`, in which case the frames will play in descending order.
	* @sign public this .animate(String reelId, Array frames)
	* @param reelId - ID of the animation reel being created
	* @param frames - Array of arrays containing the `x` and `y` values of successive frames: [[x1,y1],[x2,y2],...] (the values are in the unit of the sprite map's width/height respectively).
	*
	* Method to setup animation reels. Animation works by changing the sprites over
	* a duration. Only works for sprites built with the Crafty.sprite methods.
	* See the Tween component for animation of 2D properties.
	*
	* To setup an animation reel, pass the name of the reel (used to identify the reel and play it later), and either an
	* array of absolute sprite positions or the start x on the sprite map, the y on the sprite map and then the end x on the sprite map.
	*
	* @example
	* ~~~
	*\/\/ Define a sprite-map component
	* Crafty.sprite(16, "images/sprite.png", {
	*     PlayerSprite: [0,0]
	* });
	*
	* \/\/ Define an animation on the second row of the sprite map (y=1) from the left most sprite (fromX = 0) to the fourth sprite on that row (toX = 3)
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite").animate('PlayerRunning', 0, 1, 3);
	*
	* \/\/ This is the same animation definition, but using the alternative method
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite").animate('PlayerRunning', [[0, 1], [3, 1]]);
	* ~~~
	*/
	animate: function (reelId, fromX, y, toX) {
		var reel, i, tile, tileh, pos;

		// Get the dimensions of a single frame, as defind in Sprite component.
		tile = this.__tile + parseInt(this.__padding[0] || 0, 10);
		tileh = this.__tileh + parseInt(this.__padding[1] || 0, 10);

		reel = {
			frames = [],
			cyclesPerFrame: undefined, // This gets defined when calling play(...)
			currentFrameNumber: 0,
			cycleNumber: 0,
			repeatInfinitly: false,
			repeatsRemaining: 0
		}

		// @sign public this .animate(String reelId, Number fromX, Number y, Number toX)
		if (typeof fromX === "number") {
			i = fromX;
			if (toX > fromX) {
				for (; i <= toX; i++) {
					reel.frames.push([i * tile, y * tileh]);
				}
			}
			else {
				for (; i >= toX; i--) {
					reel.frames.push([i * tile, y * tileh]);
				}
			}
		}
		// @sign public this .animate(String reelId, Array frames)
		else {
			i = 0;
			toX = fromX.length - 1;

			for (; i <= toX; i++) {
				pos = fromX[i];
				reel.frames.push([pos[0] * tile, pos[1] * tileh]);
			}
		}

		this._reels[reelId] = reel;
		return this;
	},

	/**@
	* @sign public this .play(String reelId, Number duration[, Number repeatCount])
	* @param reelId - ID of the animation reel to play
	* @param duration - Play the animation within a duration (in frames)
	* @param repeatCount - number of times to repeat the animation. Use -1 to repeat indefinitely.
	*
	* Play one of the reels previously defined by calling `.animate(...)`. Simply pass the name of the reel
	* and the amount of frames the animations should take to play from start to finish. If you wish the
	* animation to play multiple times in succession, pass in the amount of times as an additional parameter.
	* To have the animation repeat indefinitely, pass in `-1`.
	*
	* If another animation is currently playing, it will be paused.
	*
	* If you simply wish to resume a previously paused animation without having to specify the duration again,
	* supply `null` as the duration.
	*
	* @example
	* ~~~
	*\/\/ Define a sprite-map component
	* Crafty.sprite(16, "images/sprite.png", {
	*     PlayerSprite: [0,0]
	* });
	*
	* \/\/ Play the animation across 20 frame (so each sprite in the 4 sprite animation should be seen for 5 frames) and repeat indefinitely
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite")
	*     .animate('PlayerRunning', 0, 0, 3) // setup animation
	*     .play('PlayerRunning', 15, -1); // start animation
	* ~~~
	*/
	play: function(reelId, duration, repeatCount) {
		var reel, i, tile, tileh, duration, pos;

		this.pause(); // This will pause the current animation, if one is playing

		this._currentReelId = reelId;
		currentReel = this._reels[reelId];

		if (duration !== null) {
			currentReel.cyclesPerFrame = Math.ceil(duration / currentReel.length);
		}

		if (arguments.length === 3) {
			// User provided repetition count
			if (y === -1) {
				currentReel.repeatInfinitly = true;
			}
			else {
				currentReal.repeatsRemaining = y;
			}
		}

		pos = currentReel.frames[0];
		this.__coord[0] = pos[0];
		this.__coord[1] = pos[1];

		this.bind("EnterFrame", this.updateSprite);
		return this;
	},

	/**@
	* #.resume
	* @comp SpriteAnimation
	* @sign public this .resume(String reelId)
	* @param reelId - ID of the animation to continue playing
	*
	* This is simply a convenience method and is identical to calling `.play(reelId, null)`.
	*/
	resume: function(reelId) {
		return this.play(reelId, null);
	},

	/**@
	* #.updateSprite
	* @comp SpriteAnimation
	* @sign private void .updateSprite()
	*
	* This is called at every `EnterFrame` event when `.animate()` enables animation. It update the SpriteAnimation component when the slide in the sprite should be updated.
	*
	* @example
	* ~~~
	* this.bind("EnterFrame", this.updateSprite);
	* ~~~
	*
	* @see crafty.sprite
	*/
	updateSprite: function () {
		var data = this._frame;
		if (!data) {
			return;
		}

		if (this._frame.frameNumberBetweenSlides++ === data.numberOfFramesBetweenSlides) {
			var pos = data.currentReel[data.currentSlideNumber++];

			this.__coord[0] = pos[0];
			this.__coord[1] = pos[1];
			this._frame.frameNumberBetweenSlides = 0;
		}


		if (data.currentSlideNumber === data.currentReel.length) {
			
			if (this._frame.repeatInfinitly === true || this._frame.repeat > 0) {
				if (this._frame.repeat) this._frame.repeat--;
				this._frame.frameNumberBetweenSlides = 0;
				this._frame.currentSlideNumber = 0;
			} else {
				if (this._frame.frameNumberBetweenSlides === data.numberOfFramesBetweenSlides) {
				    this.trigger("AnimationEnd", { reel: data.currentReel });
				    this.stop();
				    return;
                }
			}

		}

		this.trigger("Change");
	},

	/**@
	* #.stop
	* @comp SpriteAnimation
	* @sign public this .stop(void)
	*
	* Stop any animation currently playing.
	*/
	stop: function () {
		this.unbind("EnterFrame", this.updateSprite);
		this.unbind("AnimationEnd");
		this._currentReelId = null;
		this._frame = null;

		return this;
	},

	/**@
	* #.reset
	* @comp SpriteAnimation
	* @sign public this .reset(void)
	*
	* Method will reset the entities sprite to its original.
	*/
	reset: function () {
		if (!this._frame) return this;

		var co = this._frame.currentReel[0];
		this.__coord[0] = co[0];
		this.__coord[1] = co[1];
		this.stop();

		return this;
	},

	/**@
	* #.isPlaying
	* @comp SpriteAnimation
	* @sign public Boolean .isPlaying([String reelId])
	* @param reelId - Determine if the animation reel with this reelId is playing.
	*
	* Determines if an animation is currently playing. If a reel is passed, it will determine
	* if the passed reel is playing.
	*
	* @example
	* ~~~
	* myEntity.isPlaying() //is any animation playing
	* myEntity.isPlaying('PlayerRunning') //is the PlayerRunning animation playing
	* ~~~
	*/
	isPlaying: function (reelId) {
		if (!reelId) return !!this._currentReelId;
		return this._currentReelId === reelId;
	}
});

/**@
* #Tween
* @category Animation
* @trigger TweenEnd - when a tween finishes - String - property
*
* Component to animate the change in 2D properties over time.
*/
Crafty.c("Tween", {
	_step: null,
	_numProps: 0,

	/**@
	* #.tween
	* @comp Tween
	* @sign public this .tween(Object properties, Number duration)
	* @param properties - Object of 2D properties and what they should animate to
	* @param duration - Duration to animate the properties over (in frames)
	*
	* This method will animate a 2D entities properties over the specified duration.
	* These include `x`, `y`, `w`, `h`, `alpha` and `rotation`.
	*
	* The object passed should have the properties as keys and the value should be the resulting
	* values of the properties.
	*
	* @example
	* Move an object to 100,100 and fade out in 200 frames.
	* ~~~
	* Crafty.e("2D, Tween")
	*    .attr({alpha: 1.0, x: 0, y: 0})
	*    .tween({alpha: 0.0, x: 100, y: 100}, 200)
	* ~~~
	*/
	tween: function (props, duration) {
		this.each(function () {
			if (this._step == null) {
				this._step = {};
				this.bind('EnterFrame', tweenEnterFrame);
				this.bind('RemoveComponent', function (c) {
					if (c == 'Tween') {
						this.unbind('EnterFrame', tweenEnterFrame);
					}
				});
			}

			for (var prop in props) {
				this._step[prop] = { prop: props[prop], val: (props[prop] - this[prop]) / duration, rem: duration };
				this._numProps++;
			}
		});
		return this;
	}
});

function tweenEnterFrame(e) {
	if (this._numProps <= 0) return;

	var prop, k;
	for (k in this._step) {
		prop = this._step[k];
		this[k] += prop.val;
		if (--prop.rem == 0) {
			// decimal numbers rounding fix
			this[k] = prop.prop;
			this.trigger("TweenEnd", k);
			// make sure the duration wasn't changed in TweenEnd
			if (this._step[k].rem <= 0) {
				delete this._step[k];
			}
			this._numProps--;
		}
	}

	if (this.has('Mouse')) {
		var over = Crafty.over,
			mouse = Crafty.mousePos;
		if (over && over[0] == this[0] && !this.isAt(mouse.x, mouse.y)) {
			this.trigger('MouseOut', Crafty.lastEvent);
			Crafty.over = null;
		}
		else if ((!over || over[0] != this[0]) && this.isAt(mouse.x, mouse.y)) {
			Crafty.over = this;
			this.trigger('MouseOver', Crafty.lastEvent);
		}
	}
}
