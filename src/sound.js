Crafty.extend({
	/**@
	 * #Crafty.audio
	 * @category Audio
	 *
	 * Add sound files and play them. Chooses best format for browser support.
	 * Due to the nature of HTML5 audio, three types of audio files will be
	 * required for cross-browser capabilities. These formats are MP3, Ogg and WAV.
	 * When sound was not muted on before pause, sound will be unmuted after unpause.
	 * When sound is muted Crafty.pause() does not have any effect on sound.
	 */
	audio : {
		sounds : {},
		supported : {},
		codecs : {// Chart from jPlayer
			ogg : 'audio/ogg; codecs="vorbis"', //OGG
			wav : 'audio/wav; codecs="1"', // PCM
			webma : 'audio/webm; codecs="vorbis"', // WEBM
			mp3 : 'audio/mpeg; codecs="mp3"', //MP3
			m4a : 'audio/mp4; codecs="mp4a.40.2"'// AAC / MP4
		},
		volume : 1, //Global Volume
		muted : false,
		paused : false,
		/**
		 * Function to setup supported formats
		 **/
		canPlay : function() {
			var audio = this.audioElement(), canplay;
			for (var i in this.codecs) {
				canplay = audio.canPlayType(this.codecs[i]);
				if (canplay !== "" && canplay !== "no") {
					this.supported[i] = true;
				} else {
					this.supported[i] = false;
				}
			}

		},
		/**
		 * Function to get an Audio Element
		 **/
		audioElement : function() {
			//IE does not support Audio Object
			return typeof Audio !== 'undefined' ? new Audio("") : document.createElement('audio');
		},
		/**@
		 * #Crafty.audio.add
		 * @comp Crafty.audio
		 * @sign public this Crafty.audio.add(String id, String url)
		 * @param id - A string to refer to sounds
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
		 * shoot: ["sounds/shoot.wav",
		 * "sounds/shoot.mp3",
		 * "sounds/shoot.ogg"],
		 *
		 * coin: "sounds/coin.mp3"
		 * });
		 *
		 * //adding a single sound
		 * Crafty.audio.add("walk", [
		 * "sounds/walk.mp3",
		 * "sounds/walk.ogg",
		 * "sounds/walk.wav"
		 * ]);
		 *
		 * //only one format
		 * Crafty.audio.add("jump", "sounds/jump.mp3");
		 * ~~~
		 */
		add : function(id, url) {
			Crafty.support.audio = !!this.audioElement().canPlayType;
			//Setup audio support
			if (!Crafty.support.audio)
				return;

			this.canPlay();
			//Setup supported Extensions

			var audio, ext, path;
			if (arguments.length === 1 && typeof id === "object") {
				for (var i in id) {
					for (var src in id[i]) {
						audio = this.audioElement();
						audio.id = i;
						audio.preload = "auto";
						audio.volume = Crafty.audio.volume;
						path = id[i][src];
						ext = path.substr(path.lastIndexOf('.') + 1).toLowerCase();
						if (this.supported[ext]) {
							audio.src = path;
							Crafty.asset(path, audio);
							this.sounds[i] = {
								obj : audio,
								played : 0,
								volume : Crafty.audio.volume
							}
						}

					}
				}
			}
			if ( typeof id === "string") {
				audio = this.audioElement();
				audio.id = id;
				audio.preload = "auto";
				audio.volume = Crafty.audio.volume;

				if ( typeof url === "string") {
					ext = url.substr(url.lastIndexOf('.') + 1).toLowerCase();
					if (this.supported[ext]) {
						audio.src = url;
						Crafty.asset(url, audio);
						this.sounds[id] = {
							obj : audio,
							played : 0,
							volume : Crafty.audio.volume
						}

					}

				}

				if ( typeof url === "object") {
					for (src in url) {
						audio = this.audioElement();
						audio.id = id;
						audio.preload = "auto";
						audio.volume = Crafty.audio.volume;
						path = url[src];
						ext = path.substr(path.lastIndexOf('.') + 1).toLowerCase();
						if (this.supported[ext]) {
							audio.src = path;
							Crafty.asset(path, audio);
							this.sounds[id] = {
								obj : audio,
								played : 0,
								volume : Crafty.audio.volume
							}
						}

					}
				}

			}

		},
		/**@
		 * #Crafty.audio.play
		 * @comp Crafty.audio
		 * @sign public this Crafty.audio.play(String id)
		 * @sign public this Crafty.audio.play(String id, Number repeatCount)
		 * @sign public this Crafty.audio.play(String id, Number repeatCount,Number volume)
		 * @param id - A string to refer to sounds
		 * @param repeatCount - Repeat count for the file, where -1 stands for repeat forever.
		 * @param volume - volume can be a number between 0.0 and 1.0
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
		 * Crafty.audio.play("explosion",1,0.5); //play sound once with volume of 50%
		 * ~~~
		 */
		play : function(id, repeat, volume) {
			if (repeat == 0 || !Crafty.support.audio || !this.sounds[id])
				return;
			var s = this.sounds[id];
			s.volume = s.obj.volume = volume || Crafty.audio.volume;
			if (s.obj.currentTime)
				s.obj.currentTime = 0;
			if (this.muted)
				s.obj.volume = 0;
			s.obj.play();
			s.played++;
			s.obj.addEventListener("ended", function() {
				if (s.played < repeat || repeat == -1) {
					if (this.currentTime)
						this.currentTime = 0;
					this.play();
					s.played++;
				}
			}, true);
		},
		/**@
		 * #Crafty.audio.stop
		 * @sign public this Crafty.audio.stop([Number ID])
		 *
		 * Stops any playing sound. if id is not set, stop all sounds which are playing
		 *
		 * @example
		 * ~~~
		 * //all sounds stopped playing now
		 * Crafty.audio.stop();
		 *
		 * ~~~
		 */
		stop : function(id) {
			if (!Crafty.support.audio)
				return;
			var s;
			if (!id) {
				for (var i in this.sounds) {
					s = this.sounds[i];
					if (!s.obj.paused)
						s.obj.pause();
				}
			}
			if (!this.sounds[id])
				return;
			s = this.sounds[id];
			if (!s.obj.paused)
				s.obj.pause();
		},
		/**
		 * #Crafty.audio._mute
		 * @sign public this Crafty.audio._mute([Boolean mute])
		 *
		 * Mute or unmute every Audio instance that is playing.
		 */
		_mute : function(mute) {
			if (!Crafty.support.audio)
				return;
			var s;
			for (var i in this.sounds) {
				s = this.sounds[i];
				s.obj.volume = mute ? 0 : s.volume;
			}
			this.muted = mute;
		},
		/**@
		 * #Crafty.audio.toggleMute
		 * @sign public this Crafty.audio.toggleMute()
		 *
		 * Mute or unmute every Audio instance that is playing. Toggles between
		 * pausing or playing depending on the state.
		 *
		 * @example
		 * ~~~
		 * //toggle mute and unmute depending on current state
		 * Crafty.audio.toggleMute();
		 * ~~~
		 */
		toggleMute : function() {
			if (!this.muted) {
				this._mute(true);
			} else {
				this._mute(false);
			}

		},
		/**@
		 * #Crafty.audio.mute
		 * @sign public this Crafty.audio.mute()
		 *
		 * Mute every Audio instance that is playing.
		 *
		 * @example
		 * ~~~
		 * Crafty.audio.mute();
		 * ~~~
		 */
		mute : function() {
			this._mute(true);
		},
		/**@
		 * #Crafty.audio.unmute
		 * @sign public this Crafty.audio.unmute()
		 *
		 * Unmute every Audio instance that is playing.
		 *
		 * @example
		 * ~~~
		 * Crafty.audio.unmute();
		 * ~~~
		 */
		unmute : function() {
			this._mute(false);
		},

		/**@
		 * #Crafty.audio.pause
		 * @sign public this Crafty.audio.pause(string ID)
		 *
		 * Pause the Audio instance specified by id param.
		 *
		 * @example
		 * ~~~
		 * Crafty.audio.pause('music');
		 * ~~~
		 *
		 * @param {string} id The id of the audio object to pause
		 */
		pause : function(id) {
			if (!Crafty.support.audio || !id || !this.sounds[id])
				return;
			var s = this.sounds[id];
			if (!s.obj.paused)
				s.obj.pause();
		},

		/**@
		 * #Crafty.audio.unpause
		 * @sign public this Crafty.audio.unpause(string ID)
		 *
		 * Resume playing the Audio instance specified by id param.
		 *
		 * @example
		 * ~~~
		 * Crafty.audio.unpause('music');
		 * ~~~
		 *
		 * @param {string} id The id of the audio object to unpause
		 */
		unpause : function(id) {
			if (!Crafty.support.audio || !id || !this.sounds[id])
				return;
			var s = this.sounds[id];
			if (s.obj.paused)
				s.obj.play();
		},

		/**@
		 * #Crafty.audio.togglePause
		 * @sign public this Crafty.audio.togglePause(string ID)
		 *
		 * Toggle the pause status of the Audio instance specified by id param.
		 *
		 * @example
		 * ~~~
		 * Crafty.audio.togglePause('music');
		 * ~~~
		 *
		 * @param {string} id The id of the audio object to pause/unpause
		 */
		togglePause : function(id) {
			if (!Crafty.support.audio || !id || !this.sounds[id])
				return;
			var s = this.sounds[id];
			if (s.obj.paused) {
				s.obj.play();
			} else {
				s.obj.pause();
			}
		}
	}
});
