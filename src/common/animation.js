var Crafty = require('./core.js'),
    document = window.document;


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
            if (this._step === null) {
                this._step = {};
                this.bind('EnterFrame', tweenEnterFrame);
                this.bind('RemoveComponent', function (c) {
                    if (c == 'Tween') {
                        this.unbind('EnterFrame', tweenEnterFrame);
                    }
                });
            }

            for (var prop in props) {
                this._step[prop] = {
                    prop: props[prop],
                    val: (props[prop] - this[prop]) / duration,
                    rem: duration
                };
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
        if (--prop.rem === 0) {
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
        } else if ((!over || over[0] != this[0]) && this.isAt(mouse.x, mouse.y)) {
            Crafty.over = this;
            this.trigger('MouseOver', Crafty.lastEvent);
        }
    }
}
