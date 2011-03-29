Crafty.extend({
	audio: {
		_elems: {},
		MAX_CHANNELS: 5,
		
		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},
		
		add: function(id, url) {
			if(!Crafty.support.audio) return this;
			
			var elem, 
				key, 
				audio = new Audio(),
				canplay,
				i = 0,
				sounds = [];
						
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
							ext = source.substr(source.lastIndexOf('.')+1).toLowerCase();
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
					
					for(;i<this.MAX_CHANNELS;i++) {
						audio = new Audio(url);
						audio.preload = "auto";
						audio.load();
						sounds.push(audio);
					}
					this._elems[key] = sounds;
					if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
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
			
			//create a new Audio object and add it to assets
			for(;i<this.MAX_CHANNELS;i++) {
				audio = new Audio(url);
				audio.preload = "auto";
				audio.load();
				sounds.push(audio);
			}
			this._elems[id] = sounds;
			if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[id][0];
			
			return this;		
		},
		
		play: function(id) {
			if(!Crafty.support.audio) return;
			
			var sounds = this._elems[id],
				sound,
				i = 0, l = sounds.length;
			
			for(;i<l;i++) {
				sound = sounds[i];
				//go through the channels and play a sound that is stopped
				if(sound.ended || !sound.currentTime) {
					sound.play();
					break;
				} else if(i === l-1) { //if all sounds playing, try stop the last one
					sound.currentTime = 0;
					sound.play();
				}
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
			
			var sounds = this._elems[id],
				sound,
				setting,
				i = 0, l = sounds.length;
			
			for(var setting in settings) {
				for(;i<l;i++) {
					sound = sounds[i];
					sound[setting] = settings[setting];
				}
			}
			
			return this;
		}
	}
});