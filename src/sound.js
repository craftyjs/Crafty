var Crafty = require('./core.js'),
    document = window.document;

Crafty.extend({
    /**@
     * #Crafty.audio
     * @category Audio
     *
     * Add sound files and play them. Chooses best format for browser support.
     * Due to the nature of HTML5 audio, three types of audio files will be
     * required for cross-browser capabilities. These formats are MP3, Ogg and WAV.
     * When sound was not muted on before pause, sound will be unmuted after unpause.
     * When sound is muted Crafty.pause() does not have any effect on sound
     *
     * The maximum number of sounds that can be played simultaneously is defined by Crafty.audio.maxChannels.  The default value is 7.
     */
    audio: {

        sounds: {},
        supported: null,
        codecs: { // Chart from jPlayer
            ogg: 'audio/ogg; codecs="vorbis"', //OGG
            wav: 'audio/wav; codecs="1"', // PCM
            webma: 'audio/webm; codecs="vorbis"', // WEBM
            mp3: 'audio/mpeg; codecs="mp3"', //MP3
            m4a: 'audio/mp4; codecs="mp4a.40.2"' // AAC / MP4
        },
        volume: 1, //Global Volume
        muted: false,
        paused: false,
        playCheck: null,
        /**
         * Function to setup supported formats
         **/
        _canPlay: function () {
            this.supported = {};
            // Without support, no formats are supported
            if (!Crafty.support.audio)
                return;
            var audio = this.audioElement(),
                canplay;
            for (var i in this.codecs) {
                canplay = audio.canPlayType(this.codecs[i]);
                if (canplay !== "" && canplay !== "no") {
                    this.supported[i] = true;
                } else {
                    this.supported[i] = false;
                }
            }

        },

        /**@
         * #Crafty.audio.supports
         * @comp Crafty.audio
         * @sign public this Crafty.audio.supports(String extension)
         * @param extension - A file extension to check audio support for
         *
         * Return true if the browser thinks it can play the given file type, otherwise false
         */
        supports: function (extension) {
            // Build cache of supported formats, if necessary
            if (this.supported === null)
                this._canPlay();

            if (this.supported[extension])
                return true;
            else
                return false;
        },

        /**
         * Function to get an Audio Element
         **/
        audioElement: function () {
            //IE does not support Audio Object
            return typeof Audio !== 'undefined' ? new Audio("") : document.createElement('audio');
        },

        /**@
         * #Crafty.audio.create
         * @comp Crafty.audio
         * @sign public this Crafty.audio.create(String id, String url)
         * @param id - A string to refer to sounds
         * @param url - A string pointing to the sound file
         *
         * Creates an audio asset with the given id and resource.  `Crafty.audio.add` is a more flexible interface that allows cross-browser compatibility.
         *
         * If the sound file extension is not supported, returns false; otherwise, returns the audio asset.
         */
        create: function (id, path) {
            //check extension, return if not supported
            var ext = path.substr(path.lastIndexOf('.') + 1).toLowerCase();
            if (!this.supports(ext))
                return false;

            //initiate the audio element
            var audio = this.audioElement();
            audio.id = id;
            audio.preload = "auto";
            audio.volume = Crafty.audio.volume;
            audio.src = path;

            //create an asset and metadata for the audio element
            Crafty.asset(path, audio);
            this.sounds[id] = {
                obj: audio,
                volume: Crafty.audio.volume
            };
            return this.sounds[id];

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
         *   shoot: ["sounds/shoot.wav",
         *           "sounds/shoot.mp3",
         *           "sounds/shoot.ogg"]
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
        add: function (id, url) {
            if (!Crafty.support.audio)
                return;

            var src,
                a;

            if (arguments.length === 1 && typeof id === "object") {
                for (var i in id) {
                    for (src in id[i]) {
                        a = Crafty.audio.create(i, id[i][src]);
                        if (a){
                            break;
                        }
                    }
                }
            }
            if (typeof id === "string") {
                if (typeof url === "string") {
                    a = Crafty.audio.create(id, url);
                }

                if (typeof url === "object") {
                    for (src in url) {
                        a = Crafty.audio.create(id, url[src]);
                        if (a)
                            break;
                    }
                }

            }
            return a;
        },

        /**@
         * #Crafty.audio.play
         * @comp Crafty.audio
         * @sign public this Crafty.audio.play(String id[, Number repeatCount [, Number volume [, Number repeatAt]]])
         * @param id - A string to refer to sounds
         * @param repeatCount - Repeat count for the file, where -1 stands for repeat forever. Defaults to 1.
         * @param volume - Volume can be a number between 0.0 and 1.0.
         * @param repeatAt - Reproduction time in seconds at which the sound should be repeated.
         * @returns The audio element used to play the sound.  Null if the call failed due to a lack of open channels.
         *
         * Will play a sound previously added by using the ID that was used in 
         * `Crafty.audio.add`. Has a default maximum of 5 channels so that the 
         * same sound can play simultaneously unless all of the channels are 
         * playing.
         * 
         * When using repeat, and if it's important for you to have a gapless 
         * loop, try passing the 'repeatAt' argument, which makes the sound 
         * to be restarted at given reproduction time (in seconds), with 
         * aproximate accuracy - there might be a discrepancy of some 
         * milisenconds (perhaps 100-200 ms ahead), but the sound will still 
         * play seemlessly.
         *
         * *Note that the implementation of HTML5 Audio is buggy at best.*
         *
         * @example
         * ~~~
         * Crafty.audio.play("walk");
         *
         * // Play sound once with volume of 50%
         * Crafty.audio.play("explosion", 1, 0.5);
         *
         * // Repeat (forever) when sound reach second 23.2. 
         * // Should actually repeat somewhere between second 23.2 and 23.4.
         * Crafty.audio.play("backgroundMusic", -1, 1, 23.2); 
         *  
         * ~~~
         */
        play: function (id, repeat, volume, repeatAt) {
            if (repeat === 0 || !Crafty.support.audio || !this.sounds[id])
                return;
            var s = this.sounds[id];
            var c = this.getOpenChannel();
            if (!c)
                return null;
            c.id = id;
            c.repeat = typeof repeat === 'number'? repeat : 1;
            c.repeatAt = typeof repeatAt === 'number'? repeatAt : 0;
            c.volume = s.volume = s.obj.volume = volume || Crafty.audio.volume;

            var a = c.obj;
            a.volume = s.volume;
            a.src = s.obj.src;

            if (this.muted)
                a.volume = 0;
            a.play();
            c.played++;
            c.onEnd = function () {
                if (c.played < c.repeat || c.repeat == -1) {
                    if (this.currentTime)
                        this.currentTime = 0;
                    this.play();
                    c.played++;
                } else {
                    Crafty.audio._removeAudioEventListeners(c);
                    Crafty.audio._stop(c);
                    Crafty.trigger("SoundComplete", {
                        id: c.id
                    });
                }
            };
            a.addEventListener("ended", c.onEnd, true);
            if (c.repeatAt) {
                c.atTime = function() {
                    if (this.currentTime && this.currentTime > c.repeatAt) {
                        this.currentTime = 0;
                        c.played++;
                    }
                    if (c.repeat != -1 && c.played > c.repeat) {
                        Crafty.audio._removeAudioEventListeners(c);
                        Crafty.audio._stop(c);
                        Crafty.trigger("SoundComplete", {
                            id: c.id
                        });
                    }
                };
                a.addEventListener("timeupdate", c.atTime, true);
            }
            return a;
        },

        /**@
         * #Crafty.audio.setChannels
         * @comp Crafty.audio
         * @sign public this Crafty.audio.setChannels(Number n)
         * @param n - The maximum number of channels
         */
        maxChannels: 7,
        setChannels: function (n) {
            this.maxChannels = n;
            if (n < this.channels.length)
                this.channels.length = n;
        },

        channels: [],
        // Finds an unused audio element, marks it as in use, and return it.
        getOpenChannel: function () {
            for (var i = 0; i < this.channels.length; i++) {
                var chan = this.channels[i];
                  /*
                   * Second test looks for stuff that's out of use,
                   * but fallen foul of Chromium bug 280417
                   */
                if (chan.active === false ||
                      chan.obj.ended && chan.repeat <= chan.played) {
                    chan.active = true;
                    return chan;
                }
            }
            // If necessary, create a new element, unless we've already reached the max limit
            if (i < this.maxChannels) {
                var c = {
                    obj: this.audioElement(),
                    active: true,
                    // Checks that the channel is being used to play sound id
                    _is: function (id) {
                        return this.id === id && this.active;
                    },
                    repeat:0,
                    repeatAt:0,
                    played:0
                };
                this.channels.push(c);
                return c;
            }
            // In that case, return null
            return null;
        },

        /**@
         * #Crafty.audio.remove
         * @comp Crafty.audio
         * @sign public this Crafty.audio.remove([String id])
         * @param id - A string to refer to sounds
         *
         * Will stop the sound and remove all references to the audio object allowing the browser to free the memory.
         * If no id is given, all sounds will be removed.
         * 
         * This function uses audio path set in Crafty.path in order to remove sound from the assets object.
         *
         * @example
         * ~~~
         * Crafty.audio.remove("walk");
         * ~~~
         */
        remove: function (id) {
            if (!Crafty.support.audio)
                return;

            var s, filename, audioFolder = Crafty.paths().audio;

            if (!id) {
                for (var i in this.sounds) {
                    s = this.sounds[i];
                    filename = s.obj.src.split('/').pop();
                    Crafty.audio.stop(id);
                    delete Crafty.assets[audioFolder + filename];
                    delete Crafty.assets[s.obj.src];
                    delete Crafty.audio.sounds[id];
                }
                return;
            }
            if (!this.sounds[id])
                return;

            s = this.sounds[id];
            filename = s.obj.src.split('/').pop();
            Crafty.audio.stop(id);
            delete Crafty.assets[audioFolder + filename];
            delete Crafty.assets[s.obj.src];
            delete Crafty.audio.sounds[id];
        },
        /**@
         * #Crafty.audio.stop
         * @comp Crafty.audio
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
        stop: function (id) {
            if (!Crafty.support.audio)
                return;
            var c;
            for (var i in this.channels) {
                c = this.channels[i];
                if ( (!id && c.active) || c._is(id) ) {
                    this._removeAudioEventListeners(c);
                    this._stop(c);
                }
            }
            return;
        },
        _removeAudioEventListeners: function(c) {
            c.obj.removeEventListener("ended", c.onEnd, true);
            c.obj.removeEventListener("timeupdate", c.atTime, true);
        },
        _stop: function(c) {
            var a = c.obj;
            a.pause();
            a.currentTime = 0,
            a.ended = true,
            c.active = false,
            c.repeatAt = 0,
            c.repeat = 0,
            c.played = 0;
            delete c.onEnd;
            delete c.atTime;
        },

        /**
         * #Crafty.audio._mute
         * @comp Crafty.audio
         * @sign public this Crafty.audio._mute([Boolean mute])
         *
         * Mute or unmute every Audio instance that is playing.
         */
        _mute: function (mute) {
            if (!Crafty.support.audio)
                return;
            var c;
            for (var i in this.channels) {
                c = this.channels[i];
                c.obj.volume = mute ? 0 : c.volume;
            }
            this.muted = mute;
        },
        /**@
         * #Crafty.audio.toggleMute
         * @comp Crafty.audio
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
        toggleMute: function () {
            if (!this.muted) {
                this._mute(true);
            } else {
                this._mute(false);
            }

        },
        /**@
         * #Crafty.audio.mute
         * @comp Crafty.audio
         * @sign public this Crafty.audio.mute()
         *
         * Mute every Audio instance that is playing.
         *
         * @example
         * ~~~
         * Crafty.audio.mute();
         * ~~~
         */
        mute: function () {
            this._mute(true);
        },
        /**@
         * #Crafty.audio.unmute
         * @comp Crafty.audio
         * @sign public this Crafty.audio.unmute()
         *
         * Unmute every Audio instance that is playing.
         *
         * @example
         * ~~~
         * Crafty.audio.unmute();
         * ~~~
         */
        unmute: function () {
            this._mute(false);
        },

        /**@
         * #Crafty.audio.pause
         * @comp Crafty.audio
         * @sign public this Crafty.audio.pause(string ID)
         * @param {string} id - The id of the audio object to pause
         *
         * Pause the Audio instance specified by id param.
         *
         * @example
         * ~~~
         * Crafty.audio.pause('music');
         * ~~~
         *
         */
        pause: function (id) {
            if (!Crafty.support.audio || !id || !this.sounds[id])
                return;
            var c;
            for (var i in this.channels) {
                c = this.channels[i];
                if (c._is(id) && !c.obj.paused)
                    c.obj.pause();
            }

        },

        /**@
         * #Crafty.audio.unpause
         * @comp Crafty.audio
         * @sign public this Crafty.audio.unpause(string ID)
         * @param {string} id - The id of the audio object to unpause
         *
         * Resume playing the Audio instance specified by id param.
         *
         * @example
         * ~~~
         * Crafty.audio.unpause('music');
         * ~~~
         *
         */
        unpause: function (id) {
            if (!Crafty.support.audio || !id || !this.sounds[id])
                return;
            var c;
            for (var i in this.channels) {
                c = this.channels[i];
                if (c._is(id) && c.obj.paused)
                    c.obj.play();
            }
        },

        /**@
         * #Crafty.audio.togglePause
         * @comp Crafty.audio
         * @sign public this Crafty.audio.togglePause(string ID)
         * @param {string} id - The id of the audio object to pause/
         *
         * Toggle the pause status of the Audio instance specified by id param.
         *
         * @example
         * ~~~
         * Crafty.audio.togglePause('music');
         * ~~~
         *
         */
        togglePause: function (id) {
            if (!Crafty.support.audio || !id || !this.sounds[id])
                return;
            var c;
            for (var i in this.channels) {
                c = this.channels[i];
                if (c._is(id)) {
                    if (c.obj.paused) {
                        c.obj.play();
                    } else {
                        c.obj.pause();
                    }
                }
            }
        },

        /**@
         * #Crafty.audio.isPlaying
         * @comp Crafty.audio
         * @sign public Boolean Crafty.audio.isPlaying(string ID)
         * @param {string} id - The id of the audio object
         * @return a Boolean indicating whether the audio is playing or not
         *
         * Check if audio with the given ID is playing or not (on at least one channel).
         *
         * @example
         * ~~~
         * var isPlaying = Crafty.audio.isPlaying('music');
         * ~~~
         *
         */
        isPlaying: function(id) {
            if (!Crafty.support.audio)
                return false;

            for (var i in this.channels) {
                if (this.channels[i]._is(id))
                    return true;
            }

            return false;
        }
    }
});
