$(document).ready(function() {
	//init Crafty with FPS of 50 and create the canvas element
	Crafty.init();
	Crafty.canvas.init();
	
	//preload the needed assets
	Crafty.load(["images/sprite.png", "images/bg.png"], function() {
		//splice the spritemap
		Crafty.sprite(64, "images/sprite.png", {
			ship: [0,0],
			big: [1,0],
			medium: [2,0],
			small: [3,0]
		});

		Crafty.audio.add("Blaster", ["space-blaster.wav", "space-blaster.mp3"])
		
		//start the main scene when loaded
		Crafty.scene("main");
	});
	
	Crafty.scene("main", function() {
		Crafty.background("url('images/bg.png')");
		
		//score display
		var score = Crafty.e("2D, DOM, Text")
			.text("Score: 0")
			.attr({x: Crafty.viewport.width - 300, y: Crafty.viewport.height - 50, w: 200, h:50})
			.css({color: "#fff"});
			
		//player entity
		var player = Crafty.e("2D, Canvas, ship, Controls, Collision")
			.attr({move: {left: false, right: false, up: false, down: false}, xspeed: 0, yspeed: 0, decay: 0.9, 
				x: Crafty.viewport.width / 2, y: Crafty.viewport.height / 2, score: 0})
			.origin("center")
			.bind("KeyDown", function(e) {
				//on keydown, set the move booleans
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = true;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = true;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = true;
				} else if (e.keyCode === Crafty.keys.SPACE) {
					console.log("Blast");
					Crafty.audio.play("Blaster");
					//create a bullet entity
					Crafty.e("2D, DOM, Color, bullet")
						.attr({
							x: this._x, 
							y: this._y, 
							w: 2, 
							h: 5, 
							rotation: this._rotation, 
							xspeed: 20 * Math.sin(this._rotation / 57.3), 
							yspeed: 20 * Math.cos(this._rotation / 57.3)
						})
						.color("rgb(255, 0, 0)")
						.bind("EnterFrame", function() {
							this.x += this.xspeed;
							this.y -= this.yspeed;
							
							//destroy if it goes out of bounds
							if(this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
								this.destroy();
							}
						});
				}
			}).bind("KeyUp", function(e) {
				//on key up, set the move booleans to false
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = false;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = false;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = false;
				}
			}).bind("EnterFrame", function() {
				if(this.move.right) this.rotation += 5;
				if(this.move.left) this.rotation -= 5;
				
				//acceleration and movement vector
				var vx = Math.sin(this._rotation * Math.PI / 180) * 0.3,
					vy = Math.cos(this._rotation * Math.PI / 180) * 0.3;
				
				//if the move up is true, increment the y/xspeeds
				if(this.move.up) {
					this.yspeed -= vy;
					this.xspeed += vx;
				} else {
					//if released, slow down the ship
					this.xspeed *= this.decay;
					this.yspeed *= this.decay;
				}
				
				//move the ship by the x and y speeds or movement vector
				this.x += this.xspeed;
				this.y += this.yspeed;
				
				//if ship goes out of bounds, put him back
				if(this._x > Crafty.viewport.width) {
					this.x = -64;
				}
				if(this._x < -64) {
					this.x =  Crafty.viewport.width;
				}
				if(this._y > Crafty.viewport.height) {
					this.y = -64;
				}
				if(this._y < -64) {
					this.y = Crafty.viewport.height;
				}
				
				//if all asteroids are gone, start again with more
				if(asteroidCount <= 0) {
					initRocks(lastCount, lastCount * 2);
				}
			}).collision()
			.onHit("asteroid", function() {
				//if player gets hit, restart the game
				Crafty.scene("main");
			});
		
		//keep a count of asteroids
		var asteroidCount,
			lastCount;
		
		//Asteroid component
		Crafty.c("asteroid", {   
			init: function() {
				this.origin("center");
				this.attr({
					x: Crafty.math.randomInt(0, Crafty.viewport.width), //give it random positions, rotation and speed
					y: Crafty.math.randomInt(0, Crafty.viewport.height),
					xspeed: Crafty.math.randomInt(1, 5), 
					yspeed: Crafty.math.randomInt(1, 5), 
					rspeed: Crafty.math.randomInt(-5, 5)
				}).bind("EnterFrame", function() {
					this.x += this.xspeed;
					this.y += this.yspeed;
					this.rotation += this.rspeed;
					
					if(this._x > Crafty.viewport.width) {
						this.x = -64;
					}
					if(this._x < -64) {
						this.x =  Crafty.viewport.width;
					}
					if(this._y > Crafty.viewport.height) {
						this.y = -64;
					}
					if(this._y < -64) {
						this.y = Crafty.viewport.height;
					}
				}).collision()
				.onHit("bullet", function(e) {
					//if hit by a bullet increment the score
					player.score += 5;
					score.text("Score: "+player.score);
					e[0].obj.destroy(); //destroy the bullet
					
					var size;
					//decide what size to make the asteroid
					if(this.has("big")) {
						this.removeComponent("big").addComponent("medium");
						size = "medium";
					} else if(this.has("medium")) {
						this.removeComponent("medium").addComponent("small");
						size = "small";
					} else if(this.has("small")) { //if the lowest size, delete self
						asteroidCount--;
						this.destroy();
						return;
					}
					
					var oldxspeed = this.xspeed;
					this.xspeed = -this.yspeed;
					this.yspeed = oldxspeed;
					
					asteroidCount++;
					//split into two asteroids by creating another asteroid
					Crafty.e("2D, DOM, "+size+", Collision, asteroid").attr({x: this._x, y: this._y});
				});
				
			}
		});
		
		//function to fill the screen with asteroids by a random amount
		function initRocks(lower, upper) {
			var rocks = Crafty.math.randomInt(lower, upper);
			asteroidCount = rocks;
			lastCount = rocks;
			
			for(var i = 0; i < rocks; i++) {
				Crafty.e("2D, DOM, big, Collision, asteroid");
			}
		}
		//first level has between 1 and 10 asteroids
		initRocks(1, 10);
	});
	
});