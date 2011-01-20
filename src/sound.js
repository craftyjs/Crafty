Crafty.extend({
	audio: {
		_elems: {},
		
		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},
		
		add: function(id, url) {
			if(!Crafty.support.audio) return;
			
			var elem, 
				key, 
				audio = new Audio(),
				canplay;
						
			//if an object is passed
			if(arguments.length === 1 && typeof id === "object") {
				for(key in id) {
					if(!id.hasOwnProperty(key)) continue;
					
					//if array passed, add fallback sources
					if(typeof id[key] !== "string") {	
						var sources = id[key], i = 0, l = sources.length,
							source;
						
						for(;i<l;++i) {
							source = sources[i];
							//get the file extension
							ext = source.substr(source.lastIndexOf('.')+1);
							canplay = audio.canPlayType(this.type[ext]);
							
							//if browser can play this type, use it
							if(canplay !== "" && canplay !== "no") {
								url = source;
								break;
							}
						}
					} else {
						url = id[key];
					}
					
					//check if loaded, else new
					this._elems[key] = Crafty.assets[url];
					if(!this._elems[key]) {
						//create a new Audio object and add it to assets
						this._elems[key] = new Audio(url);
						Crafty.assets[url] = this._elems[key];
					}
					
					this._elems[key].preload = "auto";
					this._elems[key].load();
				}
				
				return this;
			} 
			//standard method
			if(typeof url !== "string") { 
				var i = 0, l = url.length,
					source;
				
				for(;i<l;++i) {
					source = url[i];
					//get the file extension
					ext = source.substr(source.lastIndexOf('.')+1);
					canplay = audio.canPlayType(this.type[ext]);
					
					//if browser can play this type, use it
					if(canplay !== "" && canplay !== "no") {
						url = source;
						break;
					}
				}
			}
			
			this._elems[key] = Crafty.assets[url];
			if(!this._elems[key]) {
				//create a new Audio object and add it to assets
				this._elems[key] = new Audio(url);
				Crafty.assets[url] = this._elems[key];
			}
			this._elems[id].preload = "auto";
			this._elems[id].load();
			return this;		
		},
		
		play: function(id) {
			if(!Crafty.support.audio) return;
			
			var sound = this._elems[id];
			
			if(sound.ended || !sound.currentTime) {
				sound.play();
			} 
			return this;
		},
		
		settings: function(id, settings) {
			//apply to all
			if(!settings) {
				for(var key in this._elems) {
					this.settings(key, id);
				}
				return this;
			}
			
			var sound = this._elems[id];
			
			for(var setting in settings) {
				sound[setting] = settings[setting];
			}
			
			return this;
		}
	}
});