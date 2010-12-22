Crafty.c("text", {
	_text: "",
	_font: "",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
				var el = this._element, style = el.style;
				el.innerHTML = this._text;
				style.font = this._font;
			} else {
			
			}
		});
	},
	
	text: function(text) {
		if(!text) return this._text;
		this._text = text;
		this.trigger("change");
		return this;
	},
	
	font: function(font) {
		this._font = font;
		this.trigger("change");
	}
});
