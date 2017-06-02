var Crafty = require('../core/core.js');


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Particles are based on Parcycle by Mr. Speaker, licensed under the MIT, Ported by Leo Koppelkamm //
//////////////////////////////////////////////////////////////////////////////////////////////////////

/**@
 * #Particles
 * @category Graphics
 * @kind Component
 *
 * @trigger ParticleStart - when the particle animation has started
 * @trigger ParticleEnd - when the particle animation has finished
 *
 * Create particle effects.
 *
 * Particles won't be drawn outside the entity's bounds. Make sure to adjust the entity's dimensions accordingly.
 *
 * @note Particles effects currently work exclusively with the Canvas render backend.
 * Particles won't be drawn if the browser doesn't support this!
 *
 * @see .particles
 */
Crafty.c("Particles", {
    required: "Renderable",
    ready: true,

    _particlesPaused: false,

    init: function () {
        // We need to clone particle handler object to avoid shared object trap
        this._Particles = Crafty.clone(this._Particles);
        // Add default options
        this._Particles.init();

        this._Particles.parentEntity = this;
    },

    events: {
        "UpdateFrame": function () {
            // don't update if paused or no particle fx active
            if (this._particlesPaused || !this._Particles.active) return;

            // This updates all particle colors & positions
            this._Particles.update();
            // Request redraw from render backend, as appearance has changed
            this.trigger("Invalidate");
        },

        "Draw": function (e) {
            // don't render if no particle fx active, but do redraw paused particles
            if (!this._Particles.active) return;

            if (e.type === "canvas") {
                // This renders the updated particles
                this._Particles.render(e);
            }
        }
    },

    /**@
     * #.particles
     * @comp Particles
     * @kind Method
     * 
     * @sign public this .particles([Object options])
     * @param options - Map of options that specify the behavior and look of the particles.
     *
     * Create a new particle animation.
     *
     * If the `options` object is missing a property, the default will be used.
     * Default options are listed in the example below.
     *
     * Invoking this method without an `options` object will restart the particle animation
     * with the previously used options, or the default options otherwise.
     *
     * @example
     * ~~~
     * var options = {
     *   maxParticles: 150,
     *   size: 18,
     *   sizeRandom: 4,
     *   speed: 1,
     *   speedRandom: 1.2,
     *   // Lifespan in frames
     *   lifeSpan: 29,
     *   lifeSpanRandom: 7,
     *   // Angle is calculated clockwise: 12pm is 0deg, 3pm is 90deg etc.
     *   angle: 65,
     *   angleRandom: 34,
     *   startColour: [255, 131, 0, 1],
     *   startColourRandom: [48, 50, 45, 0],
     *   endColour: [245, 35, 0, 0],
     *   endColourRandom: [60, 60, 60, 0],
     *   // Only applies when fastMode is off, specifies how sharp the gradients are drawn
     *   sharpness: 20,
     *   sharpnessRandom: 10,
     *   // Random spread from origin
     *   spread: 10,
     *   // How many frames should this last
     *   duration: -1,
     *   // Will draw squares instead of circle gradients
     *   fastMode: false,
     *   gravity: { x: 0, y: 0.1 },
     *   // sensible values are 0-3
     *   jitter: 0,
     *   // Offset for the origin of the particles
     *   originOffset: {x: 0, y: 0}
     * };
     *
     * Crafty.e("2D, Canvas, Particles")
     *     .attr({ w: 200, h: 200 })
     *     // debug entity's bounds while developing
     *     // make sure particles fit into entity's bounds
     *     .addComponent('WiredMBR')
     *     // init particle animation
     *     .particles(options);
     * ~~~
     */
    particles: function (options) {
        // Overwrite default options
        this._Particles.config(options);
        // Start animation
        this._Particles.start();

        return this;
    },

    _Particles: {
        presets: {
            maxParticles: 150,
            size: 18,
            sizeRandom: 4,
            speed: 1,
            speedRandom: 1.2,
            // Lifespan in frames
            lifeSpan: 29,
            lifeSpanRandom: 7,
            // Angle is calculated clockwise: 12pm is 0deg, 3pm is 90deg etc.
            angle: 65,
            angleRandom: 34,
            startColour: [255, 131, 0, 1],
            startColourRandom: [48, 50, 45, 0],
            endColour: [245, 35, 0, 0],
            endColourRandom: [60, 60, 60, 0],
            // Only applies when fastMode is off, specifies how sharp the gradients are drawn
            sharpness: 20,
            sharpnessRandom: 10,
            // Random spread from origin
            spread: 10,
            // How many frames should this last
            duration: -1,
            // Will draw squares instead of circle gradients
            fastMode: false,
            gravity: {
                x: 0,
                y: 0.1
            },
            // sensible values are 0-3
            jitter: 0,
            // offset of particles from origin
            originOffset: {x: 0, y: 0}
        },
        emissionRate: 0,

        elapsedFrames: 0,
        emitCounter: 0,
        active: true,
        particles: [],

        init: function () {
           // Create initial config by adding presets.
            for (var key in this.presets) {
                this[key] = this.presets[key];
            }
        },

        config: function (options) {
            options = options || {};

            // Create current config by merging in given options.
            for (var key in options) {
                this[key] = options[key];
            }
            this.emissionRate = this.maxParticles / this.lifeSpan;

            // Create a new pool of particles, if it doesn't match existing one
            if (this.particles.length !== this.maxParticles) {
                this.particles.length = 0;
                for (var i = 0, l = this.maxParticles; i < l; ++i) {
                    this.particles.push(new this.Particle());
                }
            }
        },

        start: function () {
            // (re)set active state
            this.active = true;
            this.elapsedFrames = 0;
            this.emitCounter = 0;

            // reset particle pool state between multiple animations, make sure timeToLive === 0
            var particles = this.particles;
            for (var i = 0, l = particles.length; i < l; ++i) {
                particles[i].timeToLive = 0;
            }

            this.parentEntity.trigger("ParticleStart");
        },

        stop: function () {
            // set disabled state
            this.active = false;

            this.parentEntity.trigger("ParticleEnd");
        },

        initParticle: function (particle) {
            var angle, speed, size, timeToLive, sharpness, c,
                startR, startG, startB, startA,
                endR, endG, endB, endA;

            particle.timeToLive = timeToLive = this.lifeSpan + this.lifeSpanRandom * this.RANDM1TO1();

            // TODO default to entity origin instead, deprecate originOffset
            // TODO subtract size/2 from position
            particle.positionX = this.originOffset.x + this.spread * this.RANDM1TO1();
            particle.positionY = this.originOffset.y + this.spread * this.RANDM1TO1();

            angle = (this.angle + this.angleRandom * this.RANDM1TO1()) * (Math.PI / 180); // convert to radians
            speed = this.speed + this.speedRandom * this.RANDM1TO1();
            // Could move to lookup for speed
            particle.directionX = Math.sin(angle) * speed;
            particle.directionY = -Math.cos(angle) * speed;

            size = this.size + this.sizeRandom * this.RANDM1TO1();
            particle.size = size = size < 0 ? 0 : ~~size;

            sharpness = this.sharpness + this.sharpnessRandom * this.RANDM1TO1();
            particle.sharpness = sharpness = sharpness > 100 ? 100 : sharpness < 0 ? 0 : sharpness;

            // internal circle gradient size - affects the sharpness of the radial gradient
            particle.sizeSmall = ~~ ((size / 200) * sharpness); //(size/2/100)

            c = startR = this.startColour[0] + this.startColourRandom[0] * this.RANDM1TO1();
            particle.colourR = c > 255 ? 255 : c < 0 ? 0 : ~~c;
            c = startG = this.startColour[1] + this.startColourRandom[1] * this.RANDM1TO1();
            particle.colourG = c > 255 ? 255 : c < 0 ? 0 : ~~c;
            c = startB = this.startColour[2] + this.startColourRandom[2] * this.RANDM1TO1();
            particle.colourB = c > 255 ? 255 : c < 0 ? 0 : ~~c;
            c = startA = this.startColour[3] + this.startColourRandom[3] * this.RANDM1TO1();
            particle.colourA = c > 1 ? 1 : c < 0 ? 0 : (~~(c * 100)) / 100;

            endR = this.endColour[0] + this.endColourRandom[0] * this.RANDM1TO1();
            endG = this.endColour[1] + this.endColourRandom[1] * this.RANDM1TO1();
            endB = this.endColour[2] + this.endColourRandom[2] * this.RANDM1TO1();
            endA = this.endColour[3] + this.endColourRandom[3] * this.RANDM1TO1();

            particle.deltaColourR = (endR - startR) / timeToLive;
            particle.deltaColourG = (endG - startG) / timeToLive;
            particle.deltaColourB = (endB - startB) / timeToLive;
            particle.deltaColourA = (endA - startA) / timeToLive;
        },

        update: function () {
            var RANDM1TO1 = this.RANDM1TO1;
            var gravityX = this.gravity.x,
                gravityY = this.gravity.y;
            var jitter = this.jitter;

            // stop if duration elapsed
            this.elapsedFrames++;
            if (this.duration >= 0 && this.duration < this.elapsedFrames) {
                this.stop();
            }

            // update emission logic
            var rate = this.emissionRate > 0 ? 1 / this.emissionRate : Infinity;
            this.emitCounter++;

            // update all particles
            var c, particle, particles = this.particles;
            for (var i = 0, l = particles.length; i < l; ++i) {
                particle = particles[i];

                // If the current particle is alive then update it
                if (particle.timeToLive > 0) {

                    // Calculate the new position based on gravity
                    particle.directionX += gravityX;
                    particle.directionY += gravityY;
                    particle.positionX += particle.directionX;
                    particle.positionY += particle.directionY;
                    if (jitter) {
                        particle.positionX += jitter * RANDM1TO1();
                        particle.positionY += jitter * RANDM1TO1();
                    }

                    // Update colours
                    c = particle.colourR + particle.deltaColourR;
                    particle.colourR = c > 255 ? 255 : c < 0 ? 0 : ~~c;
                    c = particle.colourG + particle.deltaColourG;
                    particle.colourG = c > 255 ? 255 : c < 0 ? 0 : ~~c;
                    c = particle.colourB + particle.deltaColourB;
                    particle.colourB = c > 255 ? 255 : c < 0 ? 0 : ~~c;
                    c = particle.colourA + particle.deltaColourA;
                    particle.colourA = c > 1 ? 1 : c < 0 ? 0 : (~~(c * 100)) / 100;

                    // Decrease particle's lifespan
                    particle.timeToLive--;

                // Else reinitialize particle if within emission rate
                } else if (this.emitCounter > rate) {
                    this.initParticle(particle);
                    this.emitCounter -= rate;
                }
            }
        },

        render: function (e) {
            var context = e.ctx;
            var delim = ",";

            var particle, particles = this.particles;
            for (var i = 0, l = particles.length; i < l; i++) {
                particle = particles[i];

                var size = particle.size;
                var halfSize = size >> 1;

                if (particle.positionX < 0 || particle.positionX + size > e.pos._w ||
                    particle.positionY < 0 || particle.positionY + size > e.pos._h) {
                    //Particle is outside
                    continue;
                }
                var x = ~~(e.pos._x + particle.positionX);
                var y = ~~(e.pos._y + particle.positionY);

                var r = particle.colourR,
                    g = particle.colourG,
                    b = particle.colourB,
                    a = particle.colourA;

                // Calculate the rgba string to draw.
                var drawColour = "rgba(" + r + delim + g + delim + b + delim + a + ")";
                if (this.fastMode) {
                    context.fillStyle = drawColour;
                } else {
                    var drawColourEnd = "rgba(" + r + delim + g + delim + b + delim + "0)";

                    var radgrad = context.createRadialGradient(x + halfSize, y + halfSize, particle.sizeSmall, x + halfSize, y + halfSize, halfSize);
                    radgrad.addColorStop(0, drawColour);
                    //0.9 to avoid visible boxing
                    radgrad.addColorStop(0.9, drawColourEnd);
                    context.fillStyle = radgrad;
                }
                context.fillRect(x, y, size, size);
            }
        },

        Particle: function () {
            this.positionX = 0;
            this.positionY = 0;

            this.directionX = 0;
            this.directionY = 0;

            this.size = 0;
            this.sizeSmall = 0;

            this.timeToLive = 0;

            this.colourR = 0;
            this.colourG = 0;
            this.colourB = 0;
            this.colourA = 0;

            this.deltaColourR = 0;
            this.deltaColourG = 0;
            this.deltaColourB = 0;
            this.deltaColourA = 0;

            this.sharpness = 0;
        },

        RANDM1TO1: function () {
            return Math.random() * 2 - 1;
        }
    },

    /**@
     * #.pauseParticles
     * @comp Particles
     * @kind Method
     * 
     * @sign public this.pauseParticles()
     *
     * The pauseParticles will freeze these particles in execution.
     *
     * @example
     * ~~~
     * // start particle animation
     * var ent = Crafty.e("Particles").particles(someParticleConfig);
     *
     * // and some time later, the gameplay is paused (or only
     * // a part of it is frozen)
     * ent.pauseParticles();
     * ~~~
     */
    pauseParticles: function() {
        this._particlesPaused = true;
    },

    /**@
     * #.resumeParticles
     * @comp Particles
     * @kind Method
     * 
     * @sign public this.resumeParticles()
     *
     * The resumeParticles will resume earlier paused particles
     *
     * @example
     * ~~~
     * // start particle animation
     * var ent = Crafty.e("Particles").particles(someParticleConfig);
     *
     * // and some time later, the gameplay is paused (or only
     * // a part of it is frozen)
     * ent.pauseParticles();
     *
     * // and we resume the particles again
     * ent.resumeParticles();
     * ~~~
     */
    resumeParticles: function() {
        this._particlesPaused = false;
    }
});
