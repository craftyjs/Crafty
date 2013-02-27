/**@
* #SpriteAnimation
* @category Animation
* @trigger AnimationEnd - When the animation finishes - { reelId: <reelID> }
* @trigger FrameChange - Each frame change - { reelId: <reelID>, frameNumber: <New frame's number> }
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
	* The reelID of the currently active reel (which is one of the elements in `this._reels`).
	* This value is `null` if no reel is active. Some of the component's actions can be invoked
	* without specifying a reel, in which case they will work on the active reel.
	*/
	_currentReelId: null,

	/**@
	* #._isPlaying
	* @comp SpriteAnimation
	*
	* Whether or not an animation is currently playing.
	*/
	_isPlaying: false,

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
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite").animate('PlayerRunning', [[0, 1], [1, 1], [2, 1], [3, 1]]);
	* ~~~
	*/
	animate: function (reelId, fromX, y, toX) {
		var reel, i, tile, tileh, pos;

		// Get the dimensions of a single frame, as defind in Sprite component.
		tile = this.__tile + parseInt(this.__padding[0] || 0, 10);
		tileh = this.__tileh + parseInt(this.__padding[1] || 0, 10);

		reel = {
			frames: [],
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
		else if (arguments.length === 2) {
			i = 0;
			toX = fromX.length - 1;

			for (; i <= toX; i++) {
				pos = fromX[i];
				reel.frames.push([pos[0] * tile, pos[1] * tileh]);
			}
		}
		else {
			throw "Urecognized arguments. Please see the documentation for 'animate(...)'.";
		}

		this._reels[reelId] = reel;
		return this;
	},

	/**@
	* #.play
	* @sign public this .play(String reelId, Number duration[, Number repeatCount, Number fromFrame])
	* @param reelId - ID of the animation reel to play
	* @param duration - Play the animation within a duration (in frames)
	* @param repeatCount - Number of times to repeat the animation (it will play repeatCount + 1 times). Use -1 to repeat indefinitely.
	* @param fromFrame - Frame to start the animation at. If not specified, resumes from the current reel position.
	*
	* Play one of the reels previously defined by calling `.animate(...)`. Simply pass the name of the reel
	* and the amount of frames the animations should take to play from start to finish. If you wish the
	* animation to play multiple times in succession, pass in the amount of times as an additional parameter.
	* To have the animation repeat indefinitely, pass in `-1`. Finally, you can start the animation at a specific
	* frame by supplying an additional optional argument.
	*
	* If another animation is currently playing, it will be paused.
	*
	* If you simply wish to resume a previously paused animation without having to specify the duration again,
	* supply `null` as the duration.
	*
	* Once an animation ends, it will remain at its last frame. Call `.reset(...)` to reset a reel to its first
	* frame, or play the reel from a specific frame. Attempting to play the reel again otherwise will result in
	* the animation ending immediately.
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
	*     .play('PlayerRunning', 20, -1); // start animation
	* ~~~
	*/
	play: function(reelId, duration, repeatCount, fromFrame) {
		var pos;

		currentReel = this._reels[reelId];

		if (currentReel === undefined) {
			throw "The supplied reelId, " + reelId + ", is not recognized.";
		}

		this.pause(); // This will pause the current animation, if one is playing

		this._currentReelId = reelId;

		if (duration !== null) {
			currentReel.cyclesPerFrame = Math.ceil(duration / currentReel.frames.length);
		}

		if (repeatCount == null) {
			currentReel.repeatsRemaining = 0;
		}
		else {
			// User provided repetition count
			if (repeatCount === -1) {
				currentReel.repeatInfinitly = true;
			}
			else {
				currentReel.repeatsRemaining = repeatCount;
			}
		}

		if (fromFrame != null) {
			if (fromFrame >= currentReel.frames.length) {
				throw "The request frame exceeds the reel length.";
			}
			else {
				currentReel.currentFrameNumber = fromFrame;
			}
		}

		pos = currentReel.frames[currentReel.currentFrameNumber];
		this.__coord[0] = pos[0];
		this.__coord[1] = pos[1];

		this.bind("EnterFrame", this.updateSprite);
		this._isPlaying = true;
		return this;
	},

	/**@
	* #.resume
	* @comp SpriteAnimation
	* @sign public this .resume([String reelId])
	* @param reelId - ID of the animation to continue playing
	*
	* This is simply a convenience method and is identical to calling `.play(reelId, null)`.
	* You can call this method with no arguments to resume the last animation that played.
	*/
	resume: function(reelId) {
		if (arguments.length === 0) {
			if (this._currentReelId !== null) {
				return this.play(this._currentReelId, null);
			}
			else {
				throw "There is no animation to resume.";
			}
		}

		return this.play(reelId, null);
	},

	/**@
	* #.updateSprite
	* @comp SpriteAnimation
	* @sign private void .updateSprite()
	*
	* This method is called at every `EnterFrame` event when an animation is playing. It manages the animation
	* as time progresses.
	*
	* You shouldn't call this method directly.
	*/
	updateSprite: function () {
		var currentReel = this._reels[this._currentReelId];

		// Track the amount of update cycles a frame is displayed
		currentReel.cycleNumber++;

		if (currentReel.cycleNumber === currentReel.cyclesPerFrame) {
			currentReel.currentFrameNumber++;
			currentReel.cycleNumber = 0;

			// If we went through the reel, loop the animation or end it
			if (currentReel.currentFrameNumber >= currentReel.frames.length) {
				if (currentReel.repeatInfinitly === true || currentReel.repeatsRemaining > 0) {
					currentReel.repeatsRemaining--;
					currentReel.currentFrameNumber = 0;
				}
				else {
					currentReel.currentFrameNumber = currentReel.frames.length - 1;
					this.trigger("AnimationEnd", { reelId: this._currentReelId });
					this.pause();
					return;
				}
			}

			this.trigger("FrameChange", { reelId: this._currentReelId, frameNumber: currentReel.currentFrameNumber });
			this.trigger("Change"); // Needed to trigger a redraw
		}

		// Update the displayed sprite
		var pos = currentReel.frames[currentReel.currentFrameNumber];

		this.__coord[0] = pos[0];
		this.__coord[1] = pos[1];
	},

	/**@
	* #.pause
	* @comp SpriteAnimation
	* @sign public this .pause(void)
	*
	* Pauses the currently playing animation, or does nothing if no animation is playing.
	*/
	pause: function () {
		this.unbind("EnterFrame", this.updateSprite);
		this._isPlaying = false;

		return this;
	},

	/**@
	* #.reset
	* @comp SpriteAnimation
	* @sign public this .reset([String reelId, Number frameToDisplay])
	* @param reelId - ID of the animation to reset
	* @param frameToDisplay - The frame to show after resetting the animation. 0 based.
	*
	* Resets the specified animation and displays one of its frames. If no reelId is specified,
	* resets the currently playing animation (or does nothing if no animation is playing).
	*
	* By default, will have the animation display its first frame. When playing an animation, it
	* will continue from the frame it was reset to.
	*
	* If an animation ends up being reset and an animation was playing, the animation that was
	* playing will be paused.
	*
	* Keep in mind that resetting an animation will set the animation's state to the one it had
	* just after defining it using `animate(...)`.
	*/
	reset: function (reelId, frameToDisplay) {
		var reelToReset = this._reels[reelId];

		if (reelId == null) {
			if (this._currentReelId !== null) {
				reelToReset = this._reels[this._currentReelId];
			}
			else {
				return this;
			}
		}

		if (frameToDisplay == null) {
			frameToDisplay = 0;
		}

		if (reelToReset === undefined) {
			throw "The supplied reelId, " + reelId + ", is not recognized.";
		}
		if (frameToDisplay >= reelToReset.frames.length) {
			throw "The request frame exceeds the reel length.";
		}

		this.pause();

		reelToReset.cyclesPerFrame = undefined;
		reelToReset.currentFrameNumber = frameToDisplay;
		reelToReset.cycleNumber = 0;
		reelToReset.repeatInfinitly = false;
		reelToReset.repeatsRemaining = 0;

		var pos = reelToReset.frames[frameToDisplay];
		this.__coord[0] = pos[0];
		this.__coord[1] = pos[1];

		return this;
	},

	/**@
	* #.isPlaying
	* @comp SpriteAnimation
	* @sign public Boolean .isPlaying([String reelId])
	* @param reelId - The reelId of the reel we wish to examine
	*
	* Determines if the specified animation is currently playing. If no reelId is specified,
	* checks if any animation is playing.
	*
	* @example
	* ~~~
	* myEntity.isPlaying() // is any animation playing
	* myEntity.isPlaying('PlayerRunning') // is the PlayerRunning animation playing
	* ~~~
	*/
	isPlaying: function (reelId) {
		if (!this._isPlaying) return false;

		if (!reelId) return !!this._currentReelId;
		return this._currentReelId === reelId;
	},

	/**@
	* #.getActiveReel
	* @comp SpriteAnimation
	* @sign public { id: String, frame: Number } .getActiveReel()
	*
	* Returns information about the active reel, the one currently being displayed.
	* Returns an object containing the reel's ID and the number of the frame displayed at
	* the time this method was called. If no reel is active, returns an object with a reel ID
	* of null.
	*/
	getActiveReel: function () {
		if (!this._currentReelId) return { id: null, frame: 0 };

		return { id: this._currentReelId, frame: this._reels[this._currentReelId].currentFrameNumber };
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
