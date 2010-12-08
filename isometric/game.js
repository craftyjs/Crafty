$(document).ready(function() {

	Crafty.init(50);
	Crafty.canvas("canvas");
	
	Crafty.sprite(128, "images/sprite.png", {
		grass: [0,0,1,1],
		stone: [1,0,1,1]
	});
	
	iso = Crafty.isometric(128);
	var z = 0;
	for(var i = 0; i < 10; i++) {
		for(var y = 0; y < 10; y++) {
			var tile = Crafty.e("2D, DOM, grass, mouse").attr('z',z++).areaMap([64,0],[128,32],[128,96],[64,128],[0,96],[0,32]).bind("click", function() {
				this.destroy();
			}).bind("mouseover", function() {
				console.log("mouseover");
				this.sprite(0,1,1,1);
			}).bind("mouseout", function() {
				this.sprite(0,0,1,1);
			});
			iso.place(i,y,0, tile);
		}
	}
	
	Crafty.addEvent(this, "mousedown", function(e) {
		var base = {x: e.pageX, y: e.pageY};
		
		function scroll(e) {
			var dx = base.x - e.pageX,
				dy = base.y - e.pageY;
				base = {x: e.pageX, y: e.pageY};
			Crafty("2D obj").each(function() {
				this.x -= dx;
				this.y -= dy;
			});
		};
		
		Crafty.addEvent(this, "mousemove", scroll);
		Crafty.addEvent(this, "mouseup", function() {
			Crafty.removeEvent(this, "mousemove", scroll);
		});
	});
	
	mapme = Crafty.e("2D, canvas, grass");
	iso.place(0,4,0,mapme);
	
	mapme = Crafty.e("2D, canvas, grass").attr("z", 1);
	iso.place(0,5,0,mapme);
});