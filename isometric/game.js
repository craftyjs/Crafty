$(document).ready(function() {

	Crafty.init(50);
	Crafty.canvas($("#canvas")[0]);
	
	Crafty.sprite(128, "images/sprite.png", {
		grass: [0,0,1,1],
		stone: [1,0,1,1]
	});
	
	iso = Crafty.isometric(128);
	
	for(var i = 0; i < 50; i++) {
		var grass = Crafty.e("2D, canvas, grass, mouse").attr({x: 64 * i, y: 32 * i, z: 10}).areaMap([64,0],[128,32],[128,96],[64,128],[0,96],[0,32]).bind("click", function() {
			this.destroy();
		}).bind("mouseover", function() {
			console.log("mouseover");
			this.sprite(0,1,1,1);
		}).bind("mouseout", function() {
			this.sprite(0,0,1,1);
		});
		var stone = Crafty.e("2D, canvas, stone, mouse").attr({x: 64 * i + 128, y: 32 * i, z: 0}).bind("mouseover", function() {
			this.sprite(1,1,1,1);
		}).bind("mouseout", function() {
			this.sprite(1,0,1,1);
		});
	}
	
	mapme = Crafty.e("2D, canvas, grass");
	iso.place(0,4,0,mapme);
	
	mapme = Crafty.e("2D, canvas, grass");
	iso.place(0,5,0,mapme);
});