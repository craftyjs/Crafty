Crafty.c("text", {
	_text: "",
	
	init: function() {
		this.bind("draw", function(e) {
			if(e.type === "DOM") {
			
			} else {
			
			}
		});
	},
	
	text: function(text) {
		if(!text) return this._text;
		this._text = text;
		return this;
	}
});
