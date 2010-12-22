Crafty.c("health", {
	_mana: 100,
	
	health: function(mana) {
		this._mana = mana;
		return this;
	},
	
	hurt: function(by) {
		this._mana -= by;
		
		this.trigger("hurt", {by: by, mana: this._mana});
		if(this._mana <= 0) {
			this.trigger("die");
		}
		return this;
	},
	
	heal: function(by) {
		this._mana += by;
		this.trigger("heal");
		return this;
	}
});