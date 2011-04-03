Crafty.extend({
	audio: {
		_elems: {},
		/**@
		* #Crafty.audio.MAX_CHANNELS
		* Amount of Audio objects for a sound so overlapping of the 
		* same sound can occur. More channels means more of the same sound
		* playing at the same time.
		*/
		MAX_CHANNELS: 5,
		
		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},
		
		/**@
		* #Crafty.audio.add
		* 
		* `public this Crafty.audio.add(String id, String url)`
		* 
		* `public this Crafty.audio.add(String id, Array urls)`
		* 
		* `public this Crafty.audio.add(Object map)`
		* 
		* **Parameters:**
		* 
		*> `id` - A string to reffer to sounds
		*> 
		*> `url` - A string pointing to the sound file
		*> 
		*> `urls` - Array of urls pointing to different format of the same sound, selecting the first that is playable
		*> 
		*> `map` - key-value pairs where the key is the `id` and the value is either a `url` or `urls`
		* 
		* Loads a sound to be played. Due to the nature of HTML5 audio, 
		* three types of audio files will be required for cross-browser capabilities. 
		* These formats are MP3, Ogg and WAV.
		*
		* Passing an array of URLs will determine which format the browser can play and select it over any other.
		*
		* Accepts an object where the key is the audio name (needed to play) and 
		* either a URL or an Array of URLs to determine which type to use.
		*
		* ##Use
		*~~~
		* //adding audio from an object
		* Crafty.audio.add({
		* 	shoot: ["sounds/shoot.wav",  
		* 			"sounds/shoot.mp3", 
		* 			"sounds/shoot.ogg"],
		* 
		* 	coin: "sounds/coin.mp3"
		* });
		* 
		* //adding a single sound
		* Crafty.audio.add("walk", [
		* 	"sounds/walk.mp3",
		* 	"sounds/walk.ogg",
		* 	"sounds/walk.wav"
		* ]);
		* 
		* //only one format
		* Crafty.audio.add("jump", "sounds/jump.mp3");
		* ~~~
		*/
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
			this._elems[key] = sounds;
			if(!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
			
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