Crafty.extend({
/**@
	* #Crafty.audio
	* @category Audio
	* Add sound files and play them. Chooses best format for browser support.
	* Due to the nature of HTML5 audio, three types of audio files will be
	* required for cross-browser capabilities. These formats are MP3, Ogg and WAV.
	* When sound was not muted on before pause, sound will be unmuted after unpause.
	* When sound is muted Crafty.pause() does not have any effect on sound.
	*/
	audio: {
		_elems: {},
		_muted: false,

		/**@
		* #Crafty.audio.MAX_CHANNELS
		* @comp Crafty.audio
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
		* @comp Crafty.audio
		* @sign public this Crafty.audio.add(String id, String url)
		* @param id - A string to reffer to sounds
		* @param url - A string pointing to the sound file
		* @sign public this Crafty.audio.add(String id, Array urls)
		* @param urls - Array of urls pointing to different format of the same sound, selecting the first that is playable
		* @sign public this Crafty.audio.add(Object map)
		* @param map - key-value pairs where the key is the `id` and the value is either a `url` or `urls`
		*
		* Loads a sound to be played. Due to the nature of HTML5 audio,
		* three types of audio files will be required for cross-browser capabilities.
		* These formats are MP3, Ogg and WAV.
		*
		* Passing an array of URLs will determine which format the browser can play and select it over any other.
		*
		* Accepts an object where the key is the audio name and
		* either a URL or an Array of URLs (to determine which type to use).
		*
		* The ID you use will be how you refer to that sound when using `Crafty.audio.play`.
		*
		* @example
		* ~~~
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
		add: function (id, url) {
			if (!Crafty.support.audio) return this;

			var elem,
				key,
				audio = new Audio(),
				canplay,
				i = 0,
				sounds = [];

			//if an object is passed
			if (arguments.length === 1 && typeof id === "object") {
				for (key in id) {
					if (!id.hasOwnProperty(key)) continue;

					//if array passed, add fallback sources
					if (typeof id[key] !== "string") {
						var sources = id[key], i = 0, l = sources.length,
							source;

						for (; i < l; ++i) {
							source = sources[i];
							//get the file extension
							ext = source.substr(source.lastIndexOf('.') + 1).toLowerCase();
							canplay = audio.canPlayType(this.type[ext]);

							//if browser can play this type, use it
							if (canplay !== "" && canplay !== "no") {
								url = source;
								break;
							}
						}
					} else {
						url = id[key];
					}

					for (; i < this.MAX_CHANNELS; i++) {
						audio = new Audio(url);
						audio.preload = "auto";
						audio.load();
						sounds.push(audio);
					}
					this._elems[key] = sounds;
					if (!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
				}

				return this;
			}
			//standard method
			if (typeof url !== "string") {
				var i = 0, l = url.length,
					source;

				for (; i < l; ++i) {
					source = url[i];
					//get the file extension
					ext = source.substr(source.lastIndexOf('.') + 1);
					canplay = audio.canPlayType(this.type[ext]);

					//if browser can play this type, use it
					if (canplay !== "" && canplay !== "no") {
						url = source;
						break;
					}
				}
			}

			//create a new Audio object and add it to assets
			for (; i < this.MAX_CHANNELS; i++) {
				audio = new Audio(url);
				audio.preload = "auto";
				audio.load();
				sounds.push(audio);
			}
			this._elems[id] = sounds;
			if (!Crafty.assets[url]) Crafty.assets[url] = this._elems[id][0];

			return this;
		},
		/**@
		* #Crafty.audio.play
		* @comp Crafty.audio
		* @sign public this Crafty.audio.play(String id)
		* @sign public this Crafty.audio.play(String id, Number repeatCount)
		* @param id - A string to reffer to sounds
		* @param repeatCount - Repeat count for the file, where -1 stands for repeat forever.
		*
		* Will play a sound previously added by using the ID that was used in `Crafty.audio.add`.
		* Has a default maximum of 5 channels so that the same sound can play simultaneously unless all of the channels are playing.

		* *Note that the implementation of HTML5 Audio is buggy at best.*
		*
		* @example
		* ~~~
		* Crafty.audio.play("walk");
		*
		* //play and repeat forever
		* Crafty.audio.play("backgroundMusic", -1);
		* ~~~
		*/
		play: function (id, repeat) {
			if (!Crafty.support.audio) return;

			var sounds = this._elems[id],
				sound,
				i = 0, l = sounds.length;

			for (; i < l; i++) {
				sound = sounds[i];
				//go through the channels and play a sound that is stopped
				if (sound.ended || !sound.currentTime) {
					sound.play();
					break;
				} else if (i === l - 1) { //if all sounds playing, try stop the last one
					sound.currentTime = 0;
					sound.play();
				}
			}
			if (typeof repeat == "number") {
				var j = 0;
				//i is still set to the sound we played
				sounds[i].addEventListener('ended', function () {
					if (repeat == -1 || j <= repeat) {
						this.currentTime = 0;
            this.play();
						j++;
					}
				}, false);
			}
			return this;
		},

		/**@
		* #Crafty.audio.settings
		* @comp Crafty.audio
		* @sign public this Crafty.audio.settings(String id, Object settings)
		* @param id - The audio instance added by `Crafty.audio.add`
		* @param settings - An object where the key is the setting and the value is what to modify the setting with
		* Used to modify settings of the HTML5 `Audio` object. For a list of all the settings available,
		* see the [Mozilla Documentation](https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIDOMHTMLMediaElement).
		*/
		settings: function (id, settings) {
			//apply to all
			if (!settings) {
				for (var key in this._elems) {
					this.settings(key, id);
				}
				return this;
			}

			var sounds = this._elems[id],
				sound,
				setting,
				i = 0, l = sounds.length;

			for (var setting in settings) {
				for (; i < l; i++) {
					sound = sounds[i];
					sound[setting] = settings[setting];
				}
			}

			return this;
		},

		/**@
		* #Crafty.audio.mute
		* @sign public this Crafty.audio.mute([Boolean mute])
		* Mute or unmute every Audio instance that is playing. Toggles between
		* pausing or playing depending on the state.
		* @example
		* ~~~
		* //toggle mute and unmute depending on current state
		* Crafty.audio.mute();
		*
		* //mute or unmute no matter what the current state is
		* Crafty.audio.mute(true);
		* Crafty.audio.mute(false);
		* ~~~
		*/
		mute: function (mute) {
			var sounds, sound, i, l, elem;

			if (arguments.length == 1 && typeof(mute) == "boolean")
				this._muted = mute;
      else
			  this._muted = !this._muted;

			//loop over every sound
			for (sounds in this._elems) {
				elem = this._elems[sounds];

				//loop over every channel for a sound
				for (i = 0, l = elem.length; i < l; ++i) {
					sound = elem[i];

					//if playing, stop
					if (!sound.ended && sound.currentTime) {
						if (this._muted)
							sound.pause();
						else
							sound.play();
					}
				}
			}
			return this;
		}
	}
});

//When there is sound stop sound on Pause Event.
//When there was sound on Pause, enable sound on Unpause Event.
(function() {
		var prev_mute_state;
		Crafty.bind("Pause", function () {
				prev_mute_state=Crafty.audio._muted;
				Crafty.audio.mute(true);
			});
		Crafty.bind("Unpause", function () {
				if(!prev_mute_state) {
					Crafty.audio.mute(false);
				}
			});
})();
