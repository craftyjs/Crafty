Crafty.extend({
	audio: {
		_elems: {},
		
		add: function(id, url) {
			var elem, key;
			//if an object is passed
			if(arguments.length === 1 && typeof id === "object") {
				for(key in id) {
					if(!id.hasOwnProperty(key)) continue;
					
					elem = document.createElement("audio");
					elem.src = id[key];
					this._elems[key] = elem;
				}
				return this;
			} 
			//standard
			elem = document.createElement("audio");
			elem.src = url;
			this._elems[id] = elem;
			
			return this;		
		},
		
		play: function(id, url) {
			var sound = this._elems[id];
			
			if(sound.readyState === 4) {
				console.log(sound.error);
				this._elems[id].play();
			} else {
				console.log("not ready?", sound.readyState);
			}
			return this;
		},
		
		settings: function(id, settings) {
			for(var key in settings) {
				if(!settings.hasOwnProperty(key)) continue;
				if(key in this._elems[id]) 
					this._elems[id][key] = settings[key];
			}
			return this;
		}
	}
});