var Crafty = require('../core/core.js');


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
Crafty.easing = function(duration, easingFn) {
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


Crafty.easing.prototype = {
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







/**@
 * #Tween
 * @category Animation
 * @trigger TweenEnd - when a tween finishes - String - property
 *
 * Component to animate the change in 2D properties over time.
 */
Crafty.c("Tween", {

	init: function(){
		this.tweenGroup = {};
		this.tweenStart = {};
		this.tweens = [];
		this.bind("EnterFrame", this._tweenTick);

	},

	_tweenTick: function(frameData){
		var tween, v, i;
		for ( i = this.tweens.length-1; i>=0; i--){
			tween = this.tweens[i];
			tween.easing.tick(frameData.dt);
			v  = tween.easing.value();
			this._doTween(tween.props, v);
			if (tween.easing.complete) {
				this.tweens.splice(i, 1);
				this._endTween(tween.props);
			}
		}
	},

	_doTween: function(props, v){
		for (var name in props)
			this[name] = (1-v) * this.tweenStart[name] + v * props[name];

	},



	/**@
	* #.tween
	* @comp Tween
	* @sign public this .tween(Object properties, Number duration[, String|function easingFn])
	* @param properties - Object of numeric properties and what they should animate to
	* @param duration - Duration to animate the properties over, in milliseconds.
	* @param easingFn - A string or custom function specifying an easing.  (Defaults to linear behavior.)  See Crafty.easing for more information.
	*
	* This method will animate numeric properties over the specified duration.
	* These include `x`, `y`, `w`, `h`, `alpha` and `rotation`.
	*
	* The object passed should have the properties as keys and the value should be the resulting
	* values of the properties.  The passed object might be modified if later calls to tween animate the same properties.
	*
	* @example
	* Move an object to 100,100 and fade out over 200 ms.
	* ~~~
	* Crafty.e("2D, Tween")
	*    .attr({alpha: 1.0, x: 0, y: 0})
	*    .tween({alpha: 0.0, x: 100, y: 100}, 200)
	* ~~~
	* @example
	* Rotate an object over 2 seconds, using the "smootherStep" easing function.
	* ~~~
	* Crafty.e("2D, Tween")
	*    .attr({rotation:0})
	*    .tween({rotation:180}, 2000, "smootherStep")
	* ~~~
	*
	* @see Crafty.easing
	*
	*/
	tween: function (props, duration, easingFn) {

		var tween = {
			props: props,
			easing: new Crafty.easing(duration, easingFn)
		};

		// Tweens are grouped together by the original function call.
		// Individual properties must belong to only a single group
		// When a new tween starts, if it already belongs to a group, move it to the new one
		// Record the group it currently belongs to, as well as its starting coordinate.
		for (var propname in props){
			if (typeof this.tweenGroup[propname] !== "undefined")
				this.cancelTween(propname);
			this.tweenStart[propname] = this[propname];
			this.tweenGroup[propname] = props;
		}
		this.tweens.push(tween);

		return this;

	},

	/**@
	* #.cancelTween
	* @comp Tween
	* @sign public this .cancelTween(String target)
	* @param target - The property to cancel
	*
	* @sign public this .cancelTween(Object target)
	* @param target - An object containing the properties to cancel.
	*
	* Stops tweening the specified property or properties.
	* Passing the object used to start the tween might be a typical use of the second signature.
	*/
	cancelTween: function(target){
		if (typeof target === "string"){
			if (typeof this.tweenGroup[target] == "object" )
				delete this.tweenGroup[target][target];
		} else if (typeof target === "object") {
			for (var propname in target)
				this.cancelTween(propname);
		}

		return this;

	},

	/*
	* Stops tweening the specified group of properties, and fires the "TweenEnd" event.
	*/
	_endTween: function(properties){
		for (var propname in properties){
			delete this.tweenGroup[propname];
		}
		this.trigger("TweenEnd", properties);
	}
});
