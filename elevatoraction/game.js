/**
* Elevator Action
* Crafty JS
*/
$(document).ready(function() {
	Crafty.init(50); //start the game
	$("#canvas").attr({width: $(window).width(), height: $(window).height()}); //set the canvas to fullscreen
	
	//Initialize the sprite
	Crafty.sprite(32, "images/sprite.png", {
		player: [1,2,1,2],
		door: [0,2,1,2],
		reddoor: [0,0,1,2],
		light: [6,0,1,1]
	}).canvas(document.getElementById("canvas"));
	
	
	//create the bullet component
	Crafty.c("bullet", {
		bullet: function(dir) {
			this.bind("enterframe", function() {
				this.move(dir, 15);
				if(this.x > Crafty.window.width || this.x < 0) 
					this.destroy();
			});
			return this;
		}
	});
	
	Crafty.scene("title", function() {
		Crafty.background("#111");
		
		Crafty.sprite("images/title.png", {
			title: [0,0, 430, 396]
		})
		Crafty.e("2D, canvas, title").attr({x: Crafty.window.width / 2 - 215});
		Crafty.e("2D, canvas, mouse").attr({x: Crafty.window.width / 2 - 75, y: 290, w: 142, h: 74}).bind("click", function(e) {
			Crafty.scene("main");
		});
	});
	
	
	
	Crafty.scene("main", function() {
		Crafty.background("#b1c7b5");
		//Create the player
		var player = Crafty.e("2D, player, canvas, gravity, controls, twoway, collision, animate");
		player.attr({"y":1, z: 30, facingRight: true}).gravity("floor").twoway(3)
		.bind("keydown", function(e) {
			if(e.keyCode === Crafty.keys.SP) {
				this.stop();
				
				var bx, dir;
				if(this.facingRight) {
					this.sprite(5,2,1,2);
					bx = this.x + 32;
					dir = 'e';
				} else {
					this.sprite(5,0,1,2);
					bx = this.x - 5;
					dir = 'w';
				}
				
				Crafty.e("2D, canvas, color, bullet").attr({x: bx, y: this.y + 31, w: 5, h: 2, z:50}).color("rgb(250,0,0)").bullet(dir);
				var old = this.pos();
				this.trigger("change",old);
			}
			if(e.keyCode === Crafty.keys.D || e.keyCode === Crafty.keys.RA) this.facingRight = true;
			if(e.keyCode === Crafty.keys.A || e.keyCode === Crafty.keys.LA) this.facingRight = false;
		})
		.bind("change", function() {
			if(this.__move.right && !this.isPlaying("walk_right")) {
				this.sprite(1,2,1,2);
				this.stop();
				this.animate("walk_right", 20);
			}
			if(this.__move.left && !this.isPlaying("walk_left")) {
				this.sprite(1,0,1,2);
				this.stop();
				this.animate("walk_left", 20);
			}
			/*
			var gy = this._gy;
			if(this.y > Crafty.window.height - Crafty.window.height / 4) {
				console.log("SCROLL DOWN");
				
				Crafty("2D").each(function() {
					this.y -= gy;
				});
			} else if(this.y < 100) {
				console.log("SCROLL UP");
				Crafty("2D").each(function() {
					this.y += 1;
				});
			}*/
		})
		.bind("keyup", function(e) {
			if(e.keyCode === Crafty.keys.D || e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.A || e.keyCode === Crafty.keys.LA) this.stop();
		}).animate("walk_left", 1, 0, 4).animate("walk_right", 1, 2, 4);
		
		//Generate some doors
		for(var i = 1; i <= 10; i++) {
			var door = Crafty.e("2D, door, canvas");
			door.attr({x: 250, y: i*80, z: i});
			
			var red = Crafty.e("2D, reddoor, canvas");
			red.attr({x: 450, y: i*80, z: i});
		}
		
		
		
		Crafty.c("barrier", {
			west: null,
			east: null,
			north: null,
			south: null,
			obj: null,
			
			barrier: function(x,y,w,h, obj) {
				if(!this.has("2D")) this.addComponent("2D");
				this.attr({x: x, y: y, w: w, h: h});
				this.obj = obj;
				var self = this;
				
				this.west = Crafty.e("2D, hit, collision").attr({x: x, y: y, w: 1, h:h}).collision(obj, function() {
					self.collide('w');
				});
				
				this.east = Crafty.e("2D, hit, collision").attr({x: x + w - 1, y: y, w: 1, h:h}).collision(obj, function() {
					self.collide('e');
				});
				
				this.north = Crafty.e("2D, hit").attr({x: x, y: y, w: w, h:1});
				this.south = Crafty.e("2D, hit, collision").attr({x: x, y: y + h - 1, w: w, h: 1}).collision(obj, function() {
					self.collide('s');
				});
				
				/*
				this.bind("change", function() {
					this.north.attr({x: this.x, y: this.y, w: this.w, h:1});
					this.south.attr({x: this.x, y: this.y + this.h - 1, w: this.w, h: 1});
					this.east.attr({x: this.x + this.w - 1, y: this.y, w: 1, h: this.h});
					this.west.attr({x: this.x, y: this.y, w: 1, h: this.h});
				});*/
				
				return this;
			},
			
			collide: function(dir) {
				this.obj.move(dir, this.obj._speed);
			}
		});
		
		var barrier = Crafty.e("barrier, DOM, image").barrier(0,544,Crafty.window.width / 2,20, player).image("images/girder.png", "repeat-x");
		barrier.north.addComponent("floor");
		
		var floor1 = Crafty.e("barrier, DOM, image").barrier(0, 224, Crafty.window.width / 2, 20, player).image("images/girder.png", "repeat-x");
		floor1.north.addComponent("floor");
		
		var floor3 = Crafty.e("barrier, DOM, image").barrier(Crafty.window.width / 2 + 50, 224, Crafty.window.width / 2, 20, player).image("images/girder.png", "repeat-x");
		floor3.north.addComponent("floor");
		
		var floor4 = Crafty.e("barrier, DOM, image").barrier(Crafty.window.width / 2 + 50, 544, Crafty.window.width / 2, 20, player).image("images/girder.png", "repeat-x");
		floor4.north.addComponent("floor");
		
		Crafty.c("shaker", {
			shaker: function(duration) {
				var dirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'],
					current = Crafty.frame();
						
				this.bind("enterframe", function(e) {
					if(e.frame - current >= duration) {
						this.unbind("enterframe");
						return;
					}
					var dir = dirs[Crafty.randRange(0,7)],
						by = Crafty.randRange(1,5);
					Crafty("2D obj").each(function() {
						this.move(dir, by);
						this.delay(function() {
							this.move(dir, by * -1)
						}, 100);
					});
				});
			}
		});
		Crafty.e("shaker");
		
		Crafty.c("elevator", {
			dir: 's',
			speed: 1,
			
			init: function() {
				this.bind("enterframe", function() {
					if(this.y <= 0)
						this.dir = 's';
					if(this.y >= Crafty.window.height - this.h)
						this.dir = 'n';
					 
					this.move(this.dir, this.speed);
					top.move(this.dir, this.speed);
					bottom.move(this.dir, this.speed);
					rope.move(this.dir, this.speed);
					rope2.move(this.dir, this.speed);
					
					if(this.inside(player)) {
						player.move(this.dir, this.speed);
					}
				});
			},
			
			inside: function(rect) {
				return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
					   rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
			}
		});
		var elevator = Crafty.e("2D, canvas, color, elevator").color("rgb(200,200,200)").attr({x: Crafty.window.width / 2, y:0, w: 50, h: 80});
		var top = Crafty.e("2D, barrier, canvas, color").barrier(elevator.x, elevator.y, elevator.w, 5, player).color("rgb(100,100,100)").attr("z",1);
		top.north.addComponent("floor");
		
		var bottom = Crafty.e("2D, canvas, floor, color, bottom").color("rgb(100,100,100)").attr({x: elevator.x, y: elevator.y + elevator.h - 5, w: elevator.w, h: 5, z:1});
		var rope = Crafty.e("2D, canvas, color").color("rgb(30,30,30)").attr({x: elevator.x + 23, y: Crafty.window.height * -1, h: Crafty.window.height, w: 2});
		var rope2 = Crafty.e("2D, canvas, color").color("rgb(60,60,60)").attr({x: elevator.x + 28, y: Crafty.window.height * -1, h: Crafty.window.height, w: 1});
		
		group = Crafty.group(elevator, top, bottom, rope, rope2);
		var shaker = Crafty.e("shaker");
		
		for(var k=1; k <= 10; k++) {
			var light = Crafty.e("2D, canvas, light, collision").attr({x: 100 * k, y: 244}).collision("bullet", function(e) {
				this.addComponent("gravity").gravity("floor").bind("hit", function() {
					Crafty.background("#222");
					shaker.shaker(50);
					this.delay(function() {
						Crafty.background("#b1c7b5");
					},5000);
					this.destroy();
				});
				e.destroy();
			});
		}
	});
	
	Crafty.scene("main"); //play title screen
});