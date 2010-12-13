$(document).ready(function() {

	Crafty.init(50, 500, 400);
	Crafty.canvas();
	
	Crafty.sprite(128, "images/sprite.png", {
		grass: [0,0,1,1],
		stone: [1,0,1,1]
	});
	
	iso = Crafty.isometric.init(128);
	var z = 0;
	for(var i = 2; i >= 0; i--) {
		for(var y = 0; y < 2; y++) {
			var tile = Crafty.e("2D, DOM, grass, mouse").attr('z',i+1 * y+1).areaMap([64,0],[128,32],[128,96],[64,128],[0,96],[0,32]).bind("click", function() {
				this.destroy();
			}).bind("mouseover", function() {
				console.log("mouseover", this._z);
				this.sprite(0,1,1,1);
			}).bind("mouseout", function() {
				this.sprite(0,0,1,1);
			});
			iso.place(i,y,0, tile);
		}
	}
	
	Crafty.addEvent(this, Crafty.stage.elem, "mousedown", function(e) {
		var base = {x: e.x, y: e.y};
		
		function scroll(e) {
			var dx = base.x - e.x,
				dy = base.y - e.y;
				base = {x: e.x, y: e.y};
			
			Crafty.viewport.x -= dx;
			Crafty.viewport.y -= dy;
		};
		
		Crafty.addEvent(this, Crafty.stage.elem, "mousemove", scroll);
		Crafty.addEvent(this, Crafty.stage.elem, "mouseup", function() {
			console.log("mouseup");
			Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", scroll);
		});
	});
});