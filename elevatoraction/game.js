/**
* Elevator Action
* Crafty JS
*/
$(document).ready(function() {
	Crafty.init(10); //start the game
	$("#canvas").attr({width: $(window).width(), height: $(window).height()}); //set the canvas to fullscreen
	
	//Initialize the sprite
	Crafty.sprite(32, "images/sprite.png", {
		player: [1,2,1,2],
		door: [0,2,1,2],
		reddoor: [0,0,1,2]
	}).canvas(document.getElementById("canvas"));
	
	//Create the player
	var player = Crafty.e("2D, player, canvas, gravity, controls, twoway, collision, animate");
	Crafty(player).attr({"y":1, z: 30}).twoway(3,10).collision("floor", function(e) {
		this.stopFalling(e);
	}).bind("keydown", function(e) {
		if(e.keyCode === Crafty.keys.D || e.keyCode === Crafty.keys.RA) {
			
			if(!this.isPlaying("walk_right")) {
				this.sprite(1,2,1,2);
				this.stop();
				this.animate("walk_right", 500);
			}
		} else if(e.keyCode === Crafty.keys.A || e.keyCode === Crafty.keys.LA) {
			
			if(!this.isPlaying("walk_left")) {
				this.sprite(1,0,1,2);
				this.stop();
				this.animate("walk_left", 500);
			}
		}
	}).bind("keyup", function(e) {
		if(e.keyCode === Crafty.keys.D || e.keyCode === Crafty.keys.RA || e.keyCode === Crafty.keys.A || e.keyCode === Crafty.keys.LA) this.stop();
	}).animate("walk_left", 1, 0, 4).animate("walk_right", 1, 2, 4);
	
	//Generate some doors
	for(var i = 1; i <= 10; i++) {
		var door = Crafty.e("2D, door, canvas");
		Crafty(door).attr({x: 250, y: i*80, z: i});
		
		var red = Crafty.e("2D, reddoor, canvas");
		Crafty(red).attr({x: 450, y: i*80, z: i});
	}
	
	var floor = Crafty.e("2D, floor");
	Crafty(floor).attr({y: 224, w: Crafty.window.width, h: 50});
	
	var color = Crafty.e("2D, canvas, color");
	Crafty(color).color("rgb(200,0,0)").attr({x: 50, y: 100, w: 50, h: 50});
	
});