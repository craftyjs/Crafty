/**
* Elevator Action
* Crafty JS
*/
$(document).ready(function() {
	Crafty.init(); //start the game
	$("#canvas").css({width: $(window).width(), height: $(window).height()}); //set the canvas to fullscreen
	
	//Initialize the sprite
	Crafty.sprite(32, "images/sprite.png", {
		player: [0,0,1,2],
		door: [1,0],
		reddoor: [2,0]
	}).canvas(document.getElementById("canvas"));
	
	var player = Crafty.e("2D, player, canvas");
	console.log(Crafty("player"));
});