var Crafty = require('../common/core.js'),
    document = window.document;

/**@
 * #Sprite
 * @category Graphics
 * @trigger Change - when the sprites change
 * Component for using tiles in a sprite map.
 */
Crafty.c("Sprite", {
    __image: '',
    /*
     * #.__tile
     * @comp Sprite
     *
     * Horizontal sprite tile size.
     */
    __tile: 0,
    /*
     * #.__tileh
     * @comp Sprite
     *
     * Vertical sprite tile size.
     */
    __tileh: 0,
    __padding: null,
    __trim: null,
    img: null,
    //ready is changed to true in Crafty.sprite
    ready: false,

    init: function () {
        this.__trim = [0, 0, 0, 0];

        var draw = function (e) {
            var co = e.co,
                pos = e.pos,
                context = e.ctx;

            if (e.type === "canvas") {
                //draw the image on the canvas element
                context.drawImage(this.img, //image element
                    co.x, //x position on sprite
                    co.y, //y position on sprite
                    co.w, //width on sprite
                    co.h, //height on sprite
                    pos._x, //x position on canvas
                    pos._y, //y position on canvas
                    pos._w, //width on canvas
                    pos._h //height on canvas
                );
            } else if (e.type === "DOM") {
                // Get scale (ratio of entity dimensions to sprite's dimensions)
                // If needed, we will scale up the entire sprite sheet, and then modify the position accordingly
                var vscale = this._h / co.h,
                    hscale = this._w / co.w,
                    style = this._element.style;

                style.background = style.backgroundColor + " url('" + this.__image + "') no-repeat -" + co.x * hscale + "px -" + co.y * vscale + "px";
                // style.backgroundSize must be set AFTER style.background!
                if (vscale != 1 || hscale != 1) {
                    style.backgroundSize = (this.img.width * hscale) + "px" + " " + (this.img.height * vscale) + "px";
                }
            }
        };

        this.bind("Draw", draw).bind("RemoveComponent", function (id) {
            if (id === "Sprite") this.unbind("Draw", draw);
        });
    },

    /**@
     * #.sprite
     * @comp Sprite
     * @sign public this .sprite(Number x, Number y, Number w, Number h)
     * @param x - X cell position
     * @param y - Y cell position
     * @param w - Width in cells
     * @param h - Height in cells
     *
     * Uses a new location on the sprite map as its sprite.
     *
     * Values should be in tiles or cells (not pixels).
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Sprite")
     *   .sprite(0, 0, 2, 2);
     * ~~~
     */

    /**@
     * #.__coord
     * @comp Sprite
     *
     * The coordinate of the slide within the sprite in the format of [x, y, w, h].
     */
    sprite: function (x, y, w, h) {
        this.__coord = [x * (this.__tile + this.__padding[0]) + this.__trim[0],
            y * (this.__tileh + this.__padding[1]) + this.__trim[1],
            this.__trim[2] || w * this.__tile || this.__tile,
            this.__trim[3] || h * this.__tileh || this.__tileh
        ];

        this.trigger("Change");
        return this;
    },

    /**@
     * #.crop
     * @comp Sprite
     * @sign public this .crop(Number x, Number y, Number w, Number h)
     * @param x - Offset x position
     * @param y - Offset y position
     * @param w - New width
     * @param h - New height
     *
     * If the entity needs to be smaller than the tile size, use this method to crop it.
     *
     * The values should be in pixels rather than tiles.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Sprite")
     *   .crop(40, 40, 22, 23);
     * ~~~
     */
    crop: function (x, y, w, h) {
        var old = this._mbr || this.pos();
        this.__trim = [];
        this.__trim[0] = x;
        this.__trim[1] = y;
        this.__trim[2] = w;
        this.__trim[3] = h;

        this.__coord[0] += x;
        this.__coord[1] += y;
        this.__coord[2] = w;
        this.__coord[3] = h;
        this._w = w;
        this._h = h;

        this.trigger("Change", old);
        return this;
    }
});

/**@
 * #SpriteAnimation
 * @category Animation
 * @trigger AnimationEnd - When the animation finishes - { reelId: <reelID> }
 * @trigger FrameChange - Each frame change - { reelId: <reelID>, frameNumber: <New frame's number> }
 *
 * Used to animate sprites by treating a sprite map as a set of animation frames.
 * Must be applied to an entity that has a sprite-map component.
 *
 * Note: All data recieved from events is only valid until the next event of that
 * type takes place. If you wish to preserve the data, make a copy of it.
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

    /**@
     * #._frameChangeInfo
     * @comp SpriteAnimation
     *
     * Contains information about the latest frame change event.
     */
    _frameChangeInfo: {
        reelId: undefined,
        frameNumber: undefined
    },

    /**@
     * #._animationEndInfo
     * @comp SpriteAnimation
     *
     * Contains information about the latest animation end event.
     */
    _animationEndInfo: {
        reelId: undefined
    },

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
     * \/\/ Define an animation on the second row of the sprite map (y = 1)
     * \/\/ from the left most sprite (fromX = 0) to the fourth sprite
     * \/\/ on that row (toX = 3)
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
            cyclesPerFrame: undefined, // This gets defined when calling play(...), and indicates the amount of actual frames each individual reel frame is displayed
            currentFrameNumber: 0,
            cycleNumber: 0,
            repeatsRemaining: 0
        };

        // @sign public this .animate(String reelId, Number fromX, Number y, Number toX)
        if (typeof fromX === "number") {
            i = fromX;
            if (toX > fromX) {
                for (; i <= toX; i++) {
                    reel.frames.push([i * tile, y * tileh]);
                }
            } else {
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
        } else {
            throw "Urecognized arguments. Please see the documentation for 'animate(...)'.";
        }

        this._reels[reelId] = reel;
        return this;
    },

    /**@
     * #.playAnimation
     * @comp SpriteAnimation
     * @sign public this .playAnimation(String reelId, Number duration[, Number repeatCount, Number fromFrame])
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
     * Once an animation ends, it will remain at its last frame. Call `.resetAnimation(...)` to reset a reel to its first
     * frame, or play the reel from a specific frame. Attempting to play the reel again otherwise will result in
     * the animation ending immediately.
     *
     * If you play the animation from a certain frame and specify a repeat count, the animation will reset to its
     * first frame when repeating (and not to the frame you started the animation at).
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
     *     .playAnimation('PlayerRunning', 20, -1); // start animation
     * ~~~
     */
    playAnimation: function (reelId, duration, repeatCount, fromFrame) {
        var pos;

        currentReel = this._reels[reelId];

        if (currentReel === undefined) {
            throw "The supplied reelId, " + reelId + ", is not recognized.";
        }

        this.pauseAnimation(); // This will pause the current animation, if one is playing

        this._currentReelId = reelId;

        if (duration !== undefined && duration !== null) {
            currentReel.cyclesPerFrame = Math.ceil(duration / currentReel.frames.length);
        }

        if (repeatCount === undefined || repeatCount === null) {
            currentReel.repeatsRemaining = 0;
        } else {
            // User provided repetition count
            if (repeatCount === -1) {
                currentReel.repeatsRemaining = Infinity;
            } else {
                currentReel.repeatsRemaining = repeatCount;
            }
        }

        if (fromFrame !== undefined && fromFrame !== null) {
            if (fromFrame >= currentReel.frames.length) {
                throw "The request frame exceeds the reel length.";
            } else {
                currentReel.currentFrameNumber = fromFrame;
                currentReel.cycleNumber = 0;
            }
        }

        this._frameChangeInfo.reelId = this._currentReelId;
        this._frameChangeInfo.frameNumber = currentReel.currentFrameNumber;
        this.trigger("FrameChange", this._frameChangeInfo);
        this.trigger("Change"); // Needed to trigger a redraw

        pos = currentReel.frames[currentReel.currentFrameNumber];
        this.__coord[0] = pos[0];
        this.__coord[1] = pos[1];

        this.bind("EnterFrame", this.updateSprite);
        this._isPlaying = true;
        return this;
    },

    /**@
     * #.resumeAnimation
     * @comp SpriteAnimation
     * @sign public this .resumeAnimation([String reelId])
     * @param reelId - ID of the animation to continue playing
     *
     * This is simply a convenience method and is identical to calling `.playAnimation(reelId, null)`.
     * You can call this method with no arguments to resume the last animation that played.
     */
    resumeAnimation: function (reelId) {
        if (reelId === undefined || reelId === null) {
            if (this._currentReelId !== null) {
                return this.playAnimation(this._currentReelId, null);
            } else {
                throw "There is no animation to resume.";
            }
        }

        return this.playAnimation(reelId, null);
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
                if (currentReel.repeatsRemaining > 0) {
                    currentReel.repeatsRemaining--;
                    currentReel.currentFrameNumber = 0;
                } else {
                    currentReel.currentFrameNumber = currentReel.frames.length - 1;
                    this.pauseAnimation();
                    this._animationEndInfo.reelId = this._currentReelId;
                    this.trigger("AnimationEnd", this._animationEndInfo);
                    return;
                }
            }

            this._frameChangeInfo.reelId = this._currentReelId;
            this._frameChangeInfo.frameNumber = currentReel.currentFrameNumber;
            this.trigger("FrameChange", this._frameChangeInfo);
            this.trigger("Change"); // Needed to trigger a redraw
        }

        // Update the displayed sprite
        var pos = currentReel.frames[currentReel.currentFrameNumber];

        this.__coord[0] = pos[0];
        this.__coord[1] = pos[1];
    },

    /**@
     * #.pauseAnimation
     * @comp SpriteAnimation
     * @sign public this .pauseAnimation(void)
     *
     * Pauses the currently playing animation, or does nothing if no animation is playing.
     */
    pauseAnimation: function () {
        this.unbind("EnterFrame", this.updateSprite);
        this._isPlaying = false;

        return this;
    },

    /**@
     * #.resetAnimation
     * @comp SpriteAnimation
     * @sign public this .resetAnimation([String reelId, Number frameToDisplay])
     * @param reelId - ID of the animation to reset
     * @param frameToDisplay - The frame to show after resetting the animation. 0 based.
     *
     * Resets the specified animation and displays one of its frames. If no reelId is specified,
     * resets the currently playing animation (or does nothing if no animation is playing).
     *
     * By default, will have the animation display its first frame. When playing an animation, it
     * will continue from the frame it was reset to.
     *
     * Specify null as the reelId if you only want to specify the frame on the
     * current animation.
     *
     * If an animation ends up being reset and an animation was playing, the animation that was
     * playing will be paused.
     *
     * Keep in mind that resetting an animation will set the animation's state to the one it had
     * just after defining it using `animate(...)`.
     */
    resetAnimation: function (reelId, frameToDisplay) {
        var reelToReset = this._reels[reelId];

        if (reelId === undefined || reelId === null) {
            if (this._currentReelId !== null) {
                reelToReset = this._reels[this._currentReelId];
            } else {
                return this;
            }
        }

        if (frameToDisplay === undefined || frameToDisplay === null) {
            frameToDisplay = 0;
        }

        if (reelToReset === undefined) {
            throw "The supplied reelId, " + reelId + ", is not recognized.";
        }
        if (frameToDisplay >= reelToReset.frames.length) {
            throw "The request frame exceeds the reel length.";
        }

        this.pauseAnimation();

        reelToReset.cyclesPerFrame = undefined;
        reelToReset.currentFrameNumber = frameToDisplay;
        reelToReset.cycleNumber = 0;
        reelToReset.repeatsRemaining = 0;

        this.trigger("Change"); // Needed to trigger a redraw

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
     * Returns information about the active reel, the one methods will work on when the reel ID is
     * not specified.
     * Returns an object containing the reel's ID and the number of the frame displayed at
     * the time this method was called. If no reel is active, returns an object with a reel ID
     * of null (this will only happen if no animation has been played yet).
     */
    getActiveReel: function () {
        if (!this._currentReelId) return {
            id: null,
            frame: 0
        };

        return {
            id: this._currentReelId,
            frame: this._reels[this._currentReelId].currentFrameNumber
        };
    }
});