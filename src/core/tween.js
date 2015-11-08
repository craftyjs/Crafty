/**@
 * #Tween
 * @category Animation
 * @trigger TweenEnd - when a tween finishes - String - property
 *
 * Component to animate the change in 2D properties over time.
 */
module.exports = {

  init: function(){
    this.tweenGroup = {};
    this.tweenStart = {};
    this.tweens = [];
    this.uniqueBind("EnterFrame", this._tweenTick);

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

  /**@
  * #.pauseTweens
  * @comp Tween
  * @sign public this .pauseTweens()
  *
  * Pauses all tweens associated with the entity
  */
  pauseTweens: function(){
      this.tweens.map(function(e){e.easing.pause();});
  },

  /**@
  * #.resumeTWeens
  * @comp Tween
  * @sign public this .resumeTweens()
  *
  * Resumes all paused tweens associated with the entity
  */
  resumeTweens: function(){
      this.tweens.map(function(e){e.easing.resume();});
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
};
