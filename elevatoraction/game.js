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
		reddoor: [0,0,1,2]
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
			
			Crafty.e("2D, DOM, color, bullet").attr({x: bx, y: this.y + 31, w: 5, h: 2, z:50}).color("rgb(250,0,0)").bullet(dir);
			var old = this.pos();
			this.trigger("change",old);
		}
		if(e.keyCode === Crafty.keys.D) this.facingRight = true;
		if(e.keyCode === Crafty.keys.A) this.facingRight = false;
	})
	.bind("change", function() {
		if(this.__move.right && !this.isPlaying("walk_right")) {
			this.sprite(1,2,1,2);
			this.stop();
			this.animate("walk_right", 500);
		}
		if(this.__move.left && !this.isPlaying("walk_left")) {
			this.sprite(1,0,1,2);
			this.stop();
			this.animate("walk_left", 500);
		}
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
	
	var floor = Crafty.e("2D, floor, DOM, image");
	floor.attr({y: 224, w: Crafty.window.width / 2, h: 50, z:50}).image("images/girder.png", "repeat-x");
	
	Crafty.c("shaker", {
		init: function() {
			var dirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
					
			this.bind("enterframe", function() {
				var dir = dirs[Crafty.randRange(0,7)],
					by = Crafty.randRange(1,5);
				Crafty("2D").each(function() {
					this.move(dir, by);
					this.delay(function() {
						this.move(dir, by * -1)
					}, 200);
				});
			});
		}
	});
	Crafty.e("shaker");
	
});