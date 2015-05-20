/**@
 * #Crafty.easing
 * @category Animation
 * 
 *
 * An object for tracking transitions.  Typically used indirectly through "SpriteAnimation", "Tween", or viewport animations.
 * 
 * If a method allows you to specify the type of easing, you can do so by providing a custom function or a string corresponding to the name of a built-in method.
 *
 * Built-in easing functions are "linear", "smoothStep", "smootherStep", "easeInQuad", "easeOutQuad", and "easeInOutQuad".
 *
 * A custom function will be passed a parameter `t` which will vary between 0 and 1, and should return the progress of the animation between 0 and 1.
 * @example
 * Here is how you might use easing functions with the "Tween" component.
 * ~~~~
 * var e = Crafty.e("2D, Tween");
 * // Use built-in easing functions
 * e.tween({x:100}, 1000, "smoothStep");
 * e.tween({y:100}, 1000, "easeInQuad");
 * // Define a custom easing function: 2t^2 - t
 * e.tween({w:0}, 1000, function(t){return 2*t*t - t;});
 * ~~~
 * @see Tween, SpriteAnimation
 */
var easing = function(duration, easingFn) {
	this.timePerFrame = 1000 / Crafty.timer.FPS();
	this.duration = duration;   //default duration given in ms
	if (typeof easingFn === "function"){
		this.easing_function = easingFn;
	} else if (typeof easingFn === "string" && this.standardEasingFunctions[easingFn]){
		this.easing_function = this.standardEasingFunctions[easingFn];
	} else {
		this.easing_function = this.standardEasingFunctions.linear;
	}
	this.reset();
};


easing.prototype = {
	duration: 0,
	clock:0,
	steps: null,
	complete: false,
	paused: false,

	// init values
	reset: function(){
		this.loops = 1;
		this.clock = 0;
		this.complete = false;
		this.paused = false;
	},

	repeat: function(loopCount){
		this.loops = loopCount;
	},

	setProgress: function(progress, loopCount){
		this.clock = this.duration * progress;
		if (typeof loopCount !== "undefined")
			this.loops = loopCount;

	},

	pause: function(){
		this.paused = true;
	},

	resume: function(){
		this.paused = false;
		this.complete = false;
	},

	// Increment the clock by some amount dt
	// Handles looping and sets a flag on completion
	tick: function(dt){
		if (this.paused || this.complete) return;
		this.clock += dt;
		this.frames = Math.floor(this.clock/this.timePerFrame);
		while (this.clock >= this.duration && this.complete === false){
			this.loops--;
			if (this.loops > 0)
				this.clock -= this.duration;
			else
				this.complete = true;
		}
	},

	// same as value for now; with other time value functions would be more useful
	time: function(){
		return ( Math.min(this.clock/this.duration, 1) );

	},

	// Value is where along the tweening curve we are
	value: function(){
		return this.easing_function(this.time());
	},

	// Easing functions, formulas taken from https://gist.github.com/gre/1650294
	//	and https://en.wikipedia.org/wiki/Smoothstep
	standardEasingFunctions: {
		// no easing, no acceleration
		linear: function (t) { return t; },
		// smooth step; starts and ends with v=0
		smoothStep: function(t){ return (3-2*t)*t*t; },
		// smootherstep; starts and ends with v, a=0
		smootherStep: function(t){ return (6*t*t-15*t+10)*t*t*t; },
		// quadratic curve; starts with v=0
		easeInQuad: function (t) { return t*t; },
		// quadratic curve; ends with v=0
		easeOutQuad: function (t) { return t*(2-t); },
		// quadratic curve; starts and ends with v=0
		easeInOutQuad: function (t) { return t<0.5 ? 2*t*t : (4-2*t)*t-1; }
	}
};

module.exports = easing;