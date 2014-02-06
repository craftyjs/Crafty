var Crafty = require('./core.js'),
	document = window.document;

Crafty.easing = function(duration) {
	this.timePerFrame = 1000 / Crafty.timer.FPS();
	this.duration = duration;   //default duration given in ms
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
	// For now it's simply linear; but we can easily add new types
	value: function(){
		return this.time();
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
	* @sign public this .tween(Object properties, Number|String duration)
	* @param properties - Object of numeric properties and what they should animate to
	* @param duration - Duration to animate the properties over, in milliseconds.
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
	* Rotate an object over 2 seconds
	* ~~~
	* Crafty.e("2D, Tween")
	*    .attr({rotate:0})
	*    .tween({rotate:180}, 2000)
	* ~~~
	*
	*/
	tween: function (props, duration) {

		var tween = {
			props: props,
			easing: new Crafty.easing(duration)
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


/*
* Utility prototype that can be iterated: each iteration calls the function on the specified context with a group of parameters
*/
(function() {
	Crafty._iterate = function(context, shouldLoop, func, paramGroups) {
		this.context = context;
		this.func = func;
		this.paramGroups = paramGroups;
		this.looping = shouldLoop;
	};
	Crafty._iterate.prototype.idx = 0;
	Crafty._iterate.prototype.iterate = function () {
		var notAtEnd = true;
		if (this.idx >= this.paramGroups.length) {
			notAtEnd = false;
			if (this.looping)
				this.idx = 0;
			else
				return notAtEnd;
		}
		this.func.apply(this.context, this.paramGroups[this.idx]);
		this.idx++;

		return notAtEnd;
	};
	Crafty._iterate.prototype.constructor = Crafty._iterate;
}) ();


/**@
 * #TweenChain
 * @category Animation
 * @trigger TweenChainEnd - when all tweens in the chain finished animating (will also be called when the chain starts looping again)
 * Component that chains multiple Tween calls together sequentially.
 *
 * @see Tween
 */
Crafty.c("TweenChain", {
	init: function(entity) {
		this.requires("Tween");
	},
	/**@
	* #.tweenChain
	* @comp TweenChain
	* @sign public this .tween(Boolean shouldLoop, Boolean isRelative, Array tweens)
	* @param shouldLoop - Boolean indicating whether the TweenChain should loop or not once it reaches its end
	* @param isRelative - Boolean indicating whether the properties are given as offsets to the current properties
	* @param tweens - Array which holds the tweens that are to be chained one after another
	* @return this
	*
	* Method for setting up a tween chain.
	*
	* The array passed should consist of sub-arrays, each representing a tween that is to be animated sequentially.
	* Each sub-array's first element should be an Object of numeric properties and what these should animate to.
	* Each sub-array's second element should be a Number indicating the duration to animate the properties over, in milliseconds.
	* The aforementioned first and second element map directly to the first and second argument of the Tween constructor, respectively.
	* For further details, refer to the Tween constructor.
	*
	* @example
	* Move an object in a quadratic fashion.
	* ~~~
	* Crafty.e("2D, DOM, Color, TweenChain")
    *	.attr({x: 0, y: 0, w: 50, h: 50})
    *	.color("rgb(0,255,0)")
	*	.tweenChain(true, true, [ // chain should loop, properties given as offsets
    *		[{x: 100}, 700], // move entity to top-right corner over 700ms
    *		[{y: 100}, 700], // move entity to bottom-right corner over 700ms
    *		[{x: 0}, 700], // move entity to bottom-left corner over 700ms
    *		[{y: 0}, 700] // move entity to top-left corner over 700ms
    *	])
    *	.startTweenChain(); // start the animation
	* ~~~
	* @see Tween
	*/
	tweenChain: function (shouldLoop, isRelative, array) {
		if (isRelative) {
			var props;
			for (var i=0; i<array.length; ++i) {
				props = array[i][0];

				if (props.x !== undefined) props.x += this._x;
				if (props.y !== undefined) props.y += this._y;
				if (props.w !== undefined) props.w += this._w;
				if (props.h !== undefined) props.h += this._h;
				if (props.alpha !== undefined) props.alpha += this._alpha;
				if (props.rotation !== undefined) props.rotation += this._rotation;
			}
		}


		if (this.tweenIterator) // already another tween iterator
			this.pauseTweenChain();

		this.tweenIterator = new Crafty._iterate(this, shouldLoop, function(properties, duration) {
			this.tweenIterator.tweenEndCallback = function tweenEndCallback (props) {
				if (props === properties) {
					this.unbind("TweenEnd", this.tweenIterator.tweenEndCallback);
					if (!this.tweenIterator.iterate()) // if we are at end of tween chain -> trigger event
						this.trigger("TweenChainEnd");
				}
			};
			this.bind("TweenEnd", this.tweenIterator.tweenEndCallback); // iterator will be iterated each time the current iteration ends
			this.tween(properties, duration); // actual tweening happens here
		}, array);
		
		return this;
	},
	/**@
	* #.startTweenChain
	* @comp TweenChain
	* @sign public this .startTweenChain()
	* @return this
	* 
	* Start or resume the chained tween animation.
	*/
	startTweenChain: function() {
		this.tweenIterator.iterate();
		
		return this;
	},
	/**@
	* #.stopTweenChain
	* @comp TweenChain
	* @sign public this .stopTweenChain()
	* @return this
	* 
	* Pause the chained tween animation. Can later be resumed by calling startTweenChain.
	*/
	pauseTweenChain: function() {
		this.unbind("TweenEnd", this.tweenIterator.tweenEndCallback);
		
		return this;
	}
});
