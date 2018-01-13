var Crafty = require('../core/core.js');

/**@
 * #Supportable
 * @category 2D
 * @kind Component
 * 
 * @trigger LandedOnGround - When entity has landed. This event is triggered with the object the entity landed on.
 * @trigger LiftedOffGround - When entity has lifted off. This event is triggered with the object the entity stood on before lift-off.
 * @trigger CheckLanding - When entity is about to land. This event is triggered with the object the entity is about to land on. Third parties can respond to this event and prevent the entity from being able to land.
 *
 * Component that detects if the entity collides with the ground. This component is automatically added and managed by the Gravity component.
 * The appropriate events are fired when the entity state changes (lands on ground / lifts off ground). The current ground entity can also be accessed with `.ground`.
 */
Crafty.c("Supportable", {
    /**@
     * #.ground
     * @comp Supportable
     * @kind Property
     *
     * Access the ground entity (which may be the actual ground entity if it exists, or `null` if it doesn't exist) and thus whether this entity is currently on the ground or not. 
     * The ground entity is also available through the events, when the ground entity changes.
     */
    _ground: null,
    _groundComp: null,
    _preventGroundTunneling: false,

    /**@
     * #.canLand
     * @comp Supportable
     * @kind Property
     *
     * The canLand boolean determines if the entity is allowed to land or not (e.g. perhaps the entity should not land if it's not falling).
     * The Supportable component will trigger a "CheckLanding" event. 
     * Interested parties can listen to this event and prevent the entity from landing by setting `canLand` to false.
     *
     * @example
     * ~~~
     * var player = Crafty.e("2D, Gravity");
     * player.bind("CheckLanding", function(ground) {
     *     if (player.y + player.h > ground.y + player.dy) { // forbid landing, if player's feet are not above ground
     *         player.canLand = false;
     *     }
     * });
     * ~~~
     */
    canLand: true,

    init: function () {
        this.requires("2D");
        this.__area = {_x: 0, _y: 0, _w: 0, _h: 0};
        this.defineField("ground", function() { return this._ground; }, function(newValue) {});
    },
    remove: function(destroyed) {
        this.unbind("UpdateFrame", this._detectGroundTick);
    },

    /*@
     * #.startGroundDetection
     * @comp Supportable
     * @kind Method
     * 
     * @sign private this .startGroundDetection([comp])
     * @param comp - The name of a component that will be treated as ground
     *
     * This method is automatically called by the Gravity component and should not be called by the user.
     *
     * Enable ground detection for this entity no matter whether comp parameter is specified or not.
     * If comp parameter is specified all entities with that component will stop this entity from falling.
     * For a player entity in a platform game this would be a component that is added to all entities
     * that the player should be able to walk on.
     * 
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravity("platform");
     * ~~~
     *
     * @see Gravity
     */
    startGroundDetection: function(ground) {
        if (ground) this._groundComp = ground;
        this.uniqueBind("UpdateFrame", this._detectGroundTick);

        return this;
    },
    /*@
     * #.stopGroundDetection
     * @comp Supportable
     * @kind Method
     * 
     * @sign private this .stopGroundDetection()
     *
     * This method is automatically called by the Gravity component and should not be called by the user.
     *
     * Disable ground detection for this component. It can be reenabled by calling .startGroundDetection()
     */
    stopGroundDetection: function() {
        this.unbind("UpdateFrame", this._detectGroundTick);

        return this;
    },

    /**@
     * #.preventGroundTunneling
     * @comp Supportable
     * @kind Method
     * 
     * @sign this .preventGroundTunneling([Boolean enable])
     * @param enable - Boolean indicating whether to enable continous collision detection or not; if omitted defaults to true
     *
     * Prevent entity from falling through thin ground entities at high speeds. This setting is disabled by default.
     * This is performed by approximating continous collision detection, which may impact performance negatively.
     * For further details, refer to [FAQ#Tunneling](https://github.com/craftyjs/Crafty/wiki/Crafty-FAQ-%28draft%29#why-are-my-bullets-passing-through-other-entities-without-registering-hits).
     *
     * @see Motion#.ccdbr
     */
    preventGroundTunneling: function(enable) {
        if (typeof enable === 'undefined')
            enable = true;
        if (enable)
            this.requires("Motion");
        this._preventGroundTunneling = enable;

        return this;
    },

    _detectGroundTick: function() {
        var groundComp = this._groundComp,
            ground = this._ground,
            overlap = Crafty.rectManager.overlap,
            area;

        if (!this._preventGroundTunneling) {
            var pos = this._cbr || this._mbr || this;
            area = this.__area;
            area._x = pos._x;
            area._y = pos._y;
            area._w = pos._w;
            area._h = pos._h;
        } else {
            area = this.ccdbr(this.__area);
        }
        area._h++; // Increase by 1 to make sure map.search() finds the floor
        // Decrease width by 1px from left and 1px from right, to fall more gracefully
        // area._x++; area._w--;


        // check if we lift-off
        if (ground) {
            var garea = ground._cbr || ground._mbr || ground;
            if (!(ground.__c[groundComp] && Crafty(ground[0]) === ground && overlap(garea, area))) {
                this._ground = null;
                this.trigger("LiftedOffGround", ground); // no collision with ground was detected for first time
                ground = null;
            }
        }

        // check if we land (also possible to land on other ground object in same frame after lift-off from current ground object)
        if (!ground) {
            var obj, oarea,
                results = Crafty.map.unfilteredSearch(area),
                i = 0,
                l = results.length;

            for (; i < l; ++i) {
                obj = results[i];
                oarea = obj._cbr || obj._mbr || obj;
                // check for an intersection with the player
                if (obj !== this && obj.__c[groundComp] && overlap(oarea, area)) {
                    this.canLand = true;
                    this.trigger("CheckLanding", obj); // is entity allowed to land?
                    if (this.canLand) {
                        this._ground = ground = obj;

                        // snap entity to ground object
                        this.y = ground._y - this._h;
                        if (this._x > ground._x + ground._w)
                            this.x = ground._x + ground._w - 1;
                        else if (this._x + this._w < ground._x)
                            this.x = ground._x - this._w + 1;

                        this.trigger("LandedOnGround", ground); // collision with ground was detected for first time
                        break;
                    }
                }
            }
        }
    }
});

/**@
 * #GroundAttacher
 * @category 2D
 * @kind Component
 *
 * Attach the entity to the ground when it lands. Useful for platformers with moving platforms.
 * Remove the component to disable the functionality.
 *
 * Additionally, this component provides the entity with `Supportable` methods & events.
 *
 * @example
 * ~~~
 * Crafty.e("2D, Gravity, GroundAttacher")
 *     .gravity("Platform"); // entity will land on and move with entites that have the "Platform" component
 * ~~~
 *
 * @see Supportable, Gravity
 */
Crafty.c("GroundAttacher", {
    _groundAttach: function(ground) {
        ground.attach(this);
    },
    _groundDetach: function(ground) {
        ground.detach(this);
    },

    init: function () {
        this.requires("Supportable");

        this.bind("LandedOnGround", this._groundAttach);
        this.bind("LiftedOffGround", this._groundDetach);
    },
    remove: function(destroyed) {
        this.unbind("LandedOnGround", this._groundAttach);
        this.unbind("LiftedOffGround", this._groundDetach);
    }
});


/**@
 * #Gravity
 * @category 2D
 * @kind Component
 * 
 * Adds gravitational pull to the entity.
 *
 * Additionally, this component provides the entity with `Supportable` and `Motion` methods & events.
 *
 * Simulates jumping and falling when used with the `Twoway` component and is thus well suited for side-scrolling platformer type games.
 * This component should not be used alongside `Fourway` or `Multiway`.
 *
 * @see Supportable, Motion
 */
Crafty.c("Gravity", {
    _gravityConst: 500,
    _gravityActive: false,

    init: function () {
        this.requires("2D, Supportable, Motion");

        this.bind("LiftedOffGround", this._startGravity); // start gravity if we are off ground
        this.bind("LandedOnGround", this._stopGravity); // stop gravity once landed
    },
    remove: function(destroyed) {
        this.unbind("LiftedOffGround", this._startGravity);
        this.unbind("LandedOnGround", this._stopGravity);
    },

    _gravityCheckLanding: function(ground) {
        if (this._dy < 0) 
            this.canLand = false;
    },

    /**@
     * #.gravity
     * @comp Gravity
     * @kind Method
     * 
     * @sign public this .gravity([comp])
     * @param comp - The name of a component that will stop this entity from falling
     *
     * Enable gravity for this entity no matter whether comp parameter is specified or not.
     * If comp parameter is specified all entities with that component will stop this entity from falling.
     * For a player entity in a platform game this would be a component that is added to all entities
     * that the player should be able to walk on.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravity("platform");
     * ~~~
     */
    gravity: function (comp) {
        this.uniqueBind("CheckLanding", this._gravityCheckLanding);
        this.startGroundDetection(comp);
        this._startGravity();

        return this;
    },
    /**@
     * #.antigravity
     * @comp Gravity
     * @kind Method
     * 
     * @sign public this .antigravity()
     * Disable gravity for this component. It can be reenabled by calling .gravity()
     */
    antigravity: function () {
        this._stopGravity();
        this.stopGroundDetection();
        this.unbind("CheckLanding", this._gravityCheckLanding);

        return this;
    },

    /**@
     * #.gravityConst
     * @comp Gravity
     * @kind Method
     * 
     * @sign public this .gravityConst(g)
     * @param g - gravitational constant in pixels per second squared
     *
     * Set the gravitational constant to g for this entity. The default is 500. The greater g, the stronger the downwards acceleration.
     *
     * @example
     * ~~~
     * Crafty.e("2D, DOM, Color, Gravity")
     *   .color("red")
     *   .attr({ w: 100, h: 100 })
     *   .gravityConst(750)
     *   .gravity("platform");
     * ~~~
     */
    gravityConst: function (g) {
        if (this._gravityActive) { // gravity active, change acceleration
            this.ay -= this._gravityConst;
            this.ay += g;
        }
        this._gravityConst = g;

        return this;
    },

    _startGravity: function() {
        if (this._gravityActive) return;
        this._gravityActive = true;
        this.ay += this._gravityConst;
    },
    _stopGravity: function() {
        if (!this._gravityActive) return;
        this._gravityActive = false;
        this.ay = 0;
        this.vy = 0;
    }
});

