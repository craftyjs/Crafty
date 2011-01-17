Crafty.c("group", {
	_children: [],
	
	group: function(children) {
		this._children = children;
		
		this.bind("move", function(e) {
			//when parent is changed, affect children
			var dx = e._x - this.x,
				dy = e._y - this.y,
				dw = e._w - this.w,
				dh = e._h - this.h,
				i = 0, l = this._children.length,
				current;
				
			for(;i<l;i++) {
				current = this._children[i];
				if(dx)  current.x -= dx;
				if(dy)  current.y -= dy;
				if(dw)  current.w -= dw;
				if(dh)  current.h -= dh;
			}
		});
		
		this.bind("remove", function() {
			var i = 0, l = this._children.length,
				current;
				
			for(;i<l;i++) {
				current.destroy();
			}
		});
		
		return this;
	}
});

Crafty.extend({
	group: function() {
		var parent = Crafty.e("2D, group"), //basic parent entity
			args = Array.prototype.slice.call(arguments), //turn args into array
			i = 0, l = args.length,
			minX, maxW, minY, maxH,
			current;
		
		for(;i<l;i++) {
			current = args[i];
			current.removeComponent("obj"); //no longer an obj
			
			//create MBR
			if(current.x < minX || !minX) minX = current.x;
			if(current.x + current.w > minX + maxW || !maxW) maxW = current.x + current.w - minX;
			if(current.y < minY || !minY) minY = current.y;
			if(current.y + current.h < minY + maxH || !maxH) maxH = current.y + current.h - minY;
		}
		
		//set parent to the minimum bounding rectangle
		parent.attr({x: minX, y: minY, w: maxW, h: maxH}).group(args);
		
		return parent;
	}
});