Crafty.c("DOM", {
	_element: null,
	
	DOM: function(elem) {
		if(!this.has("2D")) this.addComponent("2D");
		this._element = elem;
		this._element.style.position = 'absolute';
		return this;
	},
	
	draw: function() {
		this._element.style.top = Math.ceil(this.y) + "px";
		this._element.style.left = Math.ceil(this.x) + "px";
	}
});