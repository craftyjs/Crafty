var Crafty = require('../core/core.js');


/**@
* #SpriteAnimation
* @category Animation
* @trigger StartAnimation - When an animation starts playing, or is resumed from the paused state - {Reel}
* @trigger AnimationEnd - When the animation finishes - { Reel }
* @trigger FrameChange - Each time the frame of the current reel changes - { Reel }
* @trigger ReelChange - When the reel changes - { Reel }
*
* Used to animate sprites by treating a sprite map as a set of animation frames.
* Must be applied to an entity that has a sprite-map component.
*
* To define an animation, see the `reel` method.  To play an animation, see the `animate` method.
*
* A reel is an object that contains the animation frames and current state for an animation.  The reel object has the following properties:
* @param id: (String) - the name of the reel
* @param frames: (Array) - A list of frames in the format [xpos, ypos]
* @param currentFrame: (Number) - The index of the current frame
* @param easing: (Crafty.easing object) - The object that handles the internal progress of the animation.
* @param duration: (Number) - The duration in milliseconds.
*
* Many animation related events pass a reel object as data.  As typical with events, this should be treated as read only data that might be later altered by the entity.  If you wish to preserve the data, make a copy of it.
*
* @see Crafty.sprite
*/
Crafty.c("SpriteAnimation", {
	/*
	*
	* A map in which the keys are the names assigned to animations defined using
	* the component (also known as reelIDs), and the values are objects describing
	* the animation and its state.
	*/
	_reels: null,

	/*
	* The reelID of the currently active reel (which is one of the elements in `this._reels`).
	* This value is `null` if no reel is active. Some of the component's actions can be invoked
	* without specifying a reel, in which case they will work on the active reel.
	*/
	_currentReelId: null,

	/*
	* The currently active reel.
	* This value is `null` if no reel is active.
	*/
	_currentReel: null,

	/*
	* Whether or not an animation is currently playing.
	*/
	_isPlaying: false,

	/**@
	* #.animationSpeed
	* @comp SpriteAnimation
	*
	* The playback rate of the animation.  This property defaults to 1.
	*/
	animationSpeed: 1,


	init: function () {
		this._reels = {};
	},

	/**@
	* #.reel
	* @comp SpriteAnimation
	* Used to define reels, to change the active reel, and to fetch the id of the active reel.
	*
	* @sign public this .reel(String reelId, Duration duration, Number fromX, Number fromY, Number frameCount)
	* Defines a reel by starting and ending position on the sprite sheet.
	* @param reelId - ID of the animation reel being created
	* @param duration - The length of the animation in milliseconds.
	* @param fromX - Starting `x` position on the sprite map (x's unit is the horizontal size of the sprite in the sprite map).
	* @param fromY - `y` position on the sprite map (y's unit is the horizontal size of the sprite in the sprite map). Remains constant through the animation.
	* @param frameCount - The number of sequential frames in the animation.  If negative, the animation will play backwards.
	*
	* @sign public this .reel(String reelId, Duration duration, Array frames)
	* Defines a reel by an explicit list of frames
	* @param reelId - ID of the animation reel being created
	* @param duration - The length of the animation in milliseconds.
	* @param frames - An array of arrays containing the `x` and `y` values of successive frames: [[x1,y1],[x2,y2],...] (the values are in the unit of the sprite map's width/height respectively).
	*
	* @sign public this .reel(String reelId)
	* Switches to the specified reel.  The sprite will be updated to that reel's current frame
	* @param reelID - the ID to switch to
	*
	* @sign public Reel .reel()
	* @return The id of the current reel
	*
	*
	* A method to handle animation reels.  Only works for sprites built with the Crafty.sprite methods.
	* See the Tween component for animation of 2D properties.
	*
	* To setup an animation reel, pass the name of the reel (used to identify the reel later), and either an
	* array of absolute sprite positions or the start x on the sprite map, the y on the sprite map and then the end x on the sprite map.
	*
	*
	* @example
	* ~~~
	* // Define a sprite-map component
	* Crafty.sprite(16, "images/sprite.png", {
	*     PlayerSprite: [0,0]
	* });
	*
	* // Define an animation on the second row of the sprite map (fromY = 1)
	* // from the left most sprite (fromX = 0) to the fourth sprite
	* // on that row (frameCount = 4), with a duration of 1 second
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite").reel('PlayerRunning', 1000, 0, 1, 4);
	*
	* // This is the same animation definition, but using the alternative method
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite").reel('PlayerRunning', 1000, [[0, 1], [1, 1], [2, 1], [3, 1]]);
	* ~~~
	*/
	reel: function (reelId, duration, fromX, fromY, frameCount) {
		// @sign public this .reel()
		if (arguments.length === 0)
			return this._currentReelId;

		// @sign public this .reel(String reelID)
		if (arguments.length === 1 && typeof reelId === "string"){
			if (typeof this._reels[reelId] === "undefined")
				throw("The specified reel " + reelId + " is undefined.");
			this.pauseAnimation();
			if (this._currentReelId !== reelId) {
				this._currentReelId = reelId;
				this._currentReel = this._reels[reelId];
				// Change the visible sprite
				this._updateSprite();
				// Trigger event
				this.trigger("ReelChange", this._currentReel);
			}
			return this;
		}


		var reel, i, y;

		reel = {
			id: reelId,
			frames: [],
			currentFrame: 0,
			easing: new Crafty.easing(duration),
			defaultLoops: 1
		};

		reel.duration = reel.easing.duration;

		// @sign public this .reel(String reelId, Number duration, Number fromX, Number fromY, Number frameDuration)
		if (typeof fromX === "number") {
			i = fromX;
			y = fromY;
			if (frameCount >= 0) {
				for (; i < fromX + frameCount ; i++) {
					reel.frames.push([i, y]);
				}
			}
			else {
				for (; i > fromX + frameCount; i--) {
					reel.frames.push([i, y]);
				}
			}
		}
		// @sign public this .reel(String reelId, Number duration, Array frames)
		else if (arguments.length === 3 && typeof fromX === "object") {
			reel.frames = fromX;
		}
		else {
			throw "Urecognized arguments. Please see the documentation for 'reel(...)'.";
		}

		this._reels[reelId] = reel;

		return this;
	},

	/**@
	* #.animate
	* @comp SpriteAnimation
	* @sign public this .animate([String reelId] [, Number loopCount])
	* @param reelId - ID of the animation reel to play.  Defaults to the current reel if none is specified.
	* @param loopCount - Number of times to repeat the animation. Use -1 to repeat indefinitely.  Defaults to 1.
	*
	* Play one of the reels previously defined through `.reel(...)`. Simply pass the name of the reel. If you wish the
	* animation to play multiple times in succession, pass in the amount of times as an additional parameter.
	* To have the animation repeat indefinitely, pass in `-1`.
	*
	* If another animation is currently playing, it will be paused.
	*
	* This will always play an animation from the beginning.  If you wish to resume from the current state of a reel, use `resumeAnimation()`.
	*
	* Once an animation ends, it will remain at its last frame.
	*
	*
	* @example
	* ~~~
	* // Define a sprite-map component
	* Crafty.sprite(16, "images/sprite.png", {
	*     PlayerSprite: [0,0]
	* });
	*
	* // Play the animation across 20 frames (so each sprite in the 4 sprite animation should be seen for 5 frames) and repeat indefinitely
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite")
	*     .reel('PlayerRunning', 20, 0, 0, 3) // setup animation
	*     .animate('PlayerRunning', -1); // start animation
	* ~~~
	*/
	animate: function(reelId, loopCount) {

		var pos;


		// switch to the specified reel if necessary
		if (typeof reelId === "string")
			this.reel(reelId);

		var currentReel = this._currentReel;

		if (typeof currentReel === "undefined" || currentReel === null)
			throw("No reel is specified, and there is no currently active reel.");

		this.pauseAnimation(); // This will pause the current animation, if one is playing

		// Handle repeats; if loopCount is undefined and reelID is a number, calling with that signature
		if (typeof loopCount === "undefined")
			if (typeof reelId === "number")
				loopCount = reelId;
			else
				loopCount = 1;

		// set the animation to the beginning
		currentReel.easing.reset();


		// user provided loop count.
		this.loops(loopCount);

		// trigger the necessary events and switch to the first frame
		this._setFrame(0);

		// Start the anim
		this.bind("EnterFrame", this._animationTick);
		this._isPlaying = true;

		this.trigger("StartAnimation", currentReel);
		return this;
	},

	/**@
	* #.resumeAnimation
	* @comp SpriteAnimation
	* @sign public this .resumeAnimation()
	*
	* This will resume animation of the current reel from its current state.
	* If a reel is already playing, or there is no current reel, there will be no effect.
	*/
	resumeAnimation: function() {
		if (this._isPlaying === false &&  this._currentReel !== null) {
			this.bind("EnterFrame", this._animationTick);
			this._isPlaying = true;
			this._currentReel.easing.resume();
			this.trigger("StartAnimation", this._currentReel);
		}
		return this;
	},

	/**@
	* #.pauseAnimation
	* @comp SpriteAnimation
	* @sign public this .pauseAnimation(void)
	*
	* Pauses the currently playing animation, or does nothing if no animation is playing.
	*/
	pauseAnimation: function () {
		if (this._isPlaying === true) {
			this.unbind("EnterFrame", this._animationTick);
			this._isPlaying = false;
			this._reels[this._currentReelId].easing.pause();
		}
		return this;
	},

	/**@
	* #.resetAnimation
	* @comp SpriteAnimation
	* @sign public this .resetAnimation()
	*
	* Resets the current animation to its initial state.  Resets the number of loops to the last specified value, which defaults to 1.
	*
	* Neither pauses nor resumes the current animation.
	*/
	resetAnimation: function(){
		var currentReel = this._currentReel;
		if  (currentReel === null)
			throw("No active reel to reset.");
		this.reelPosition(0);
		currentReel.easing.repeat(currentReel.defaultLoops);
		return this;
   },


	/**@
	* #.loops
	* @comp SpriteAnimation
	* @sign public this .loops(Number loopCount)
	* @param loopCount - The number of times to play the animation
	*
	* Sets the number of times the animation will loop for.
	* If called while an animation is in progress, the current state will be considered the first loop.
	*
	* @sign public Number .loops()
	* @returns The number of loops left.  Returns 0 if no reel is active.
	*/
	loops: function(loopCount) {
		if (arguments.length === 0){
			if (this._currentReel !== null)
				return this._currentReel.easing.loops;
			else
				return 0;
		}

		if (this._currentReel !== null){
			if (loopCount < 0)
				loopCount = Infinity;
			this._currentReel.easing.repeat(loopCount);
			this._currentReel.defaultLoops = loopCount;
		}
		return this;

	},

	/**@
	* #.reelPosition
	* @comp SpriteAnimation
	*
	* @sign public this .reelPosition(Integer position)
	* Sets the position of the current reel by frame number.
	* @param position - the frame to jump to.  This is zero-indexed.  A negative values counts back from the last frame.
	*
	* @sign public this .reelPosition(Number position)
	* Sets the position of the current reel by percent progress.
	* @param position - a non-integer number between 0 and 1
	*
	* @sign public this .reelPosition(String position)
	* Jumps to the specified position.  The only currently accepted value is "end", which will jump to the end of the reel.
	*
	* @sign public Number .reelPosition()
	* @returns The current frame number
	*
	*/
	reelPosition: function(position) {
		if (this._currentReel === null)
			throw("No active reel.");

		if (arguments.length === 0)
			return this._currentReel.currentFrame;

		var progress,
			l = this._currentReel.frames.length;
		if (position === "end")
			position = l - 1;

		if (position < 1 && position > 0) {
			progress = position;
			position = Math.floor(l * progress);
		} else {
			if (position !== Math.floor(position))
				throw("Position " + position + " is invalid.");
			if (position < 0)
				position = l - 1 + position;
			progress = position / l;
		}
		// cap to last frame
		position = Math.min(position, l-1);
		position = Math.max(position, 0);
		this._setProgress(progress);
		this._setFrame(position);

		return this;

	},


	// Bound to "EnterFrame".  Progresses the animation by dt, changing the frame if necessary.
	// dt is multiplied by the animationSpeed property
	_animationTick: function(frameData) {
		var currentReel = this._reels[this._currentReelId];
		currentReel.easing.tick(frameData.dt * this.animationSpeed);
		var progress = currentReel.easing.value();
		var frameNumber = Math.min( Math.floor(currentReel.frames.length * progress), currentReel.frames.length - 1);

		this._setFrame(frameNumber);

		if(currentReel.easing.complete === true){
			this.pauseAnimation();
			this.trigger("AnimationEnd", this._currentReel);
		}
	},





	// Set the current frame and update the displayed sprite
	// The actual progress for the animation must be set seperately.
	_setFrame: function(frameNumber) {
		var currentReel = this._currentReel;
		if (frameNumber === currentReel.currentFrame)
			return;
		currentReel.currentFrame = frameNumber;
		this._updateSprite();
		this.trigger("FrameChange", currentReel);
	},

	// Update the displayed sprite.
	_updateSprite: function() {
		var currentReel = this._currentReel;
		var pos = currentReel.frames[currentReel.currentFrame];
		this.sprite(pos[0], pos[1]); // .sprite will trigger redraw

	},


	// Sets the internal state of the current reel's easing object
	_setProgress: function(progress, repeats) {
		this._currentReel.easing.setProgress(progress, repeats);

	},


	/**@
	* #.isPlaying
	* @comp SpriteAnimation
	* @sign public Boolean .isPlaying([String reelId])
	* @param reelId - The reelId of the reel we wish to examine
	* @returns The current animation state
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
	* #.getReel
	* @comp SpriteAnimation
	* @sign public Reel .getReel()
	* @returns The current reel, or null if there is no active reel
	*
	* @sign public Reel .getReel(reelId)
	* @param reelId - The id of the reel to fetch.
	* @returns The specified reel, or `undefined` if no such reel exists.
	*
	*/
	getReel: function (reelId) {
		if (arguments.length === 0){
			if (!this._currentReelId) return null;
			reelId = this._currentReelId;
		}

		return this._reels[reelId];
	}
});
