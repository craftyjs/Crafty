Crafty.c("health", {
	_mana: 100,
	
	health: function(mana) {
		this._mana = mana;
		return this;
	},
	
	hurt: function(by) {
		var diff = this._mana;
		this._mana -= by;
		diff -= this._mana;
		
		this.trigger("hurt", {by: by, diff: diff, mana: this._mana});
		if(this._mana <= 0) {
			this.trigger("die");
		}
		return this;
	},
	
	heal: function(by) {
		this._mana += by;
		return this;
	}
});