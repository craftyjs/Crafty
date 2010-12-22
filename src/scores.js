Crafty.c("score", {
	_score: 0,
	
	incrementScore: function(by) {
		this._score += by;
		
		return this;
	},
	
	decrementScore: function(by) {
		this._score -= by;
		
		return this;
	}
});