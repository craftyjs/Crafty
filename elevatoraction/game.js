/**
* Elevator Action
* Crafty JS
*/
$(document).ready(function() {
	Crafty.init(); //start the game
	$("#canvas").attr({width: $(window).width(), height: $(window).height()}); //set the canvas to fullscreen
	
	//Initialize the sprite
	Crafty.sprite(32, "images/sprite.png", {
		player: [0,0,1,2],
		door: [1,0,1,2],
		reddoor: [2,0,1,2]
	}).canvas(document.getElementById("canvas"));
	
	var player = Crafty.e("2D, player, canvas, controls, fourway");
	Crafty(player).attr({"y":1, z: 1}).fourway(3);
	
	var door = Crafty.e("2D, door, canvas");
	Crafty(door).attr({x: 250, y: 50, z: 0});
	
	var red = Crafty.e("2D, reddoor, canvas");
	Crafty(red).attr({x: 450, y: 50, z: 0});

});