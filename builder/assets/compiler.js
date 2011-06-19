/**
* TODO
*
* //wysiwyg
* Add all entities on the stage as DOM elements
* Drag and drop updates its props
* Context menu to copy/cut/paste/delete and properties
* Snap to grid
* 
* //Saving
* Save all objects into JSON
* Load all JSON into object
*/

Crafty.c("_GUI", {
	_GUI: function() {
		this.requires("DOM");
		
		var self = this;
		function drag(e) {
			self.x = (e.clientX - Crafty.stage.x) - self._startX;
			self.y = (e.clientY - Crafty.stage.y) - self._startY;
			self.draw();
		}
				
		$(this._element).mousedown(function(e) {
			self._startX = (e.clientX - Crafty.stage.x) - self._x;
			self._startY = (e.clientY - Crafty.stage.y) - self._y;
			$workarea.mousemove(drag);
		});
		
		$workarea.mouseup(function() {
			$workarea.unbind("mousemove", drag);
		});
	},
	
	_startX: 0,
	_startY: 0,
	
	comps: function(complist) {
		var comps = complist.split(/\s*,\s*/),
			i = 0, l = comps.length;
		
		for(;i<l;++i) {
			if(comps[i] === "Canvas") continue;
			this.addComponent(comps[i]);
		}
		
		this._GUI();
		return this;
	}
});

