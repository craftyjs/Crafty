//-------------------------
// audio-plus
//-------------------------

Crafty.extend(
{
	audioPlus: {
		_elems: {},
		
		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},
		
		add: function(id, url, channelCount) {
			var elem, 
				key, 
				audio = document.createElement("audio"),
				canplay;
				
			//exit if audio not supported
			if(!audio.canPlayType) return;
						
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
					
					var sounds = [];
					for(var i = 0; i < 5; i++)
					{
						var sound = document.createElement("audio");
						sound.src = url;
						sound.preload = "auto";
						sounds.push(sound);
					}
					this._elems[key] = sounds;
					
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
			var sounds = [];
			for(var i = 0; i < channelCount; i++)
			{
				var sound = document.createElement("audio");
				sound.src = url;
				sound.preload = "auto";
				sounds.push(sound);
			}
			this._elems[id] = sounds;
			return this;		
		},
		
		play: function(id) {
			var sounds = this._elems[id];
			
			if(sounds)
			{
				var sound;
				var soundCount = sounds.length;
				for(var i = 0; i < soundCount; i++)
				{
					var testSound = sounds[i];
					if(testSound == null)
					{
						continue;
					}
					if(testSound.ended || !testSound.currentTime)
					{
						sound = testSound;
						break;
					}
				}
				if(sound != null)
				{
					try
					{
						sound.currentTime = 0;
					}
					catch(err){}
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
			
			var sound = this._elems[id];
			
			for(var setting in settings) {
				sound[setting] = settings[setting];
			}
			
			return this;
		}
	}
});

//-------------------------
// preload-support
//-------------------------

(function()
{
	var preloaderImages = [];
	Crafty.extend(
	{
		spriteWithPreload: function()
		{
			var url = arguments[1];
			if(typeof arguments[0] === "string")
			{
				url = arguments[0];
			}
			preloaderImages.push(url);
			Crafty.sprite.apply(null, arguments);
		},
		addToPreloader: function(url)
		{
			preloaderImages.push(url);
		},
		preload: function(onComplete, onProgress, onError)
		{
			var loadedCount = 0;
			var imageCount = preloaderImages.length;
			var loopCount = imageCount;
			for(var i = 0; i < loopCount; i++)
			{
				var url = preloaderImages[i];
				if(typeof url !== "string")
				{
					imageCount--;
					continue;
				}
				var image = new Image();
				image.onload = function()
				{
					loadedCount++;
					var percentage = loadedCount / imageCount;
					onProgress(percentage);
					if(loadedCount == imageCount)
					{
						onComplete();
					}
				}
				image.onerror = function()
				{
					onError();
				}
				image.src = url;
				preloaderImages[i] = image;
			}
			//special case: nothing to load
			if(imageCount == 0)
			{
				onComplete();
			}
		}
	});
})();

//-------------------------
// autoz
//-------------------------

(function()
{
	var entitiesByDepth = [];
	Crafty.extend(
	{
		getNextHighestDepth: function()
		{
			return entitiesByDepth.length;
		}
	});
	Crafty.c("autoz",
	{
		init: function()
		{
			if(!this.has("2D"))
			{
				this.addComponent("2D");
			}
			this.z = entitiesByDepth.length;
			entitiesByDepth.push(this);
			this.bind("remove", function()
			{
				//when this is removed, removed it from the depth list
				//and then update the z values for everything above.
				var index = entitiesByDepth.indexOf(this);
				entitiesByDepth.splice(index, 1);
				var entityCount = entitiesByDepth.length;
				for(var i = index; i < entityCount; i++)
				{
					var entity = entitiesByDepth[i];
					//no need to do a full setter call because we are assuming
					//that everything will stay in the same order. Just change
					//the variable.
					entity._z = i;
				}
			});
		},
		forceZ: function(value)
		{
			var entityCount = entitiesByDepth.length;
			if(value < 0 || value >= entityCount)
			{
				throw "Requested depth is out of range. Received " + value + ". Expected 0-" + (entityCount - 1) + ".";
			}
		
			var index = entitiesByDepth.indexOf(this);
			entitiesByDepth.splice(index, 1);
			entitiesByDepth.splice(value, 0, this);
			
			for(var i = index; i < entityCount; i++)
			{
				var entity = entitiesByDepth[i];
				if(entity == this)
				{
					continue;
				}
				//see explanation above for usage of _z here
				entity._z = i;
			}
			this.z = value;
		}
	});
})();

//-------------------------
// alpha
//-------------------------

Crafty.c("alpha",
{
	_alpha: 1.0,
	init: function()
	{
		function getAlpha() { return this._alpha; }
		function setAlpha(value)
		{ 
			this._alpha = value;
			this.trigger("change");
		}
		
		if("defineProperty" in Object)
		{
			Object.defineProperty(this, "alpha", { get: getAlpha, set: setAlpha });
		}
		else if("__defineSetter__" in this && "__defineGetter__" in this)
		{
			this.__defineSetter__("alpha", setAlpha);
			this.__defineGetter__("alpha", getAlpha);
		}
		else //no getters/setters
		{
			this.alpha = this._alpha;
			
			this.bind("enterframe", function()
			{
				if(this.alpha !== this._alpha)
				{
					this._alpha = this.alpha;
					this.trigger("change");
				}
			});
		}
		
		if(this.isCanvas)
		{
			var oldDraw = this.draw;
			this.draw = function()
			{
				var oldGlobalAlpha = Crafty.context.globalAlpha;
				Crafty.context.globalAlpha = this._alpha;
				oldDraw.apply(this, arguments);
				Crafty.context.globalAlpha = oldGlobalAlpha;
			}
		}
		else if(this.has("DOM"))
		{
			this.bind("draw", function()
			{
				this._element.style.opacity = this.alpha;
			});
		}
	}
});

//-------------------------
// Sprite Text
//-------------------------

Crafty.c("spritetext",
{
	init: function()
	{
		if(!this.has("2D"))
		{
			this.addComponent("2D");
		}
		
		this._alpha = 1;
		this._characters = [];
		
		function getAlpha() { return this._alpha; }
		function setAlpha(value)
		{
			if(this._alpha == value)
			{
				return;
			}
			this._alpha = value;
			var characterCount = this._characters.length;
			for(var i = 0; i < characterCount; i++)
			{
				var characterSprite = this._characters[i];
				characterSprite.alpha = this._alpha;
			}
		}
		if("defineProperty" in Object)
		{
			Object.defineProperty(this, "alpha", { get: getAlpha, set: setAlpha });
		}
		else if("__defineSetter__" in this && "__defineGetter__" in this)
		{
			this.__defineSetter__("alpha", setAlpha);
			this.__defineGetter__("alpha", getAlpha);
		}
	},
	text: function(value)
	{
		if(!this._skinName || !this._availableCharacters)
		{
			throw "Skin not applied to spritetext.";
		}
		
		if(arguments.length == 0)
		{
			return this._text;
		}
		
		this._text = value;
		
		var characterCount = this._characters.length;
		for(var i = 0; i < characterCount; i++)
		{
			var characterSprite = this._characters[i];
			this.detach(characterSprite);
			//we want it to redraw itself to clear the area
			characterSprite.alpha = 0;
			characterSprite.destroy();
		}
		this._characters.length = 0;
		
		var positionX = this.x;
		var textHeight = 0;
		characterCount = value.length;
		for(var i = 0; i < characterCount; i++)
		{
			var character = value.charAt(i);
			if(this._availableCharacters.indexOf(character) < 0)
			{
				throw "Character " + value + " is not available. Expected value in set " + this._availableCharacters + ".";
			}
			characterSprite = Crafty.e("2D, canvas, alpha, " + this._skinName + character);
			this._characters.push(characterSprite);
			characterSprite.attr(
			{
				x: positionX,
				y: this.y,
				alpha: this.alpha
			});
			positionX += characterSprite.w;
			textHeight = Math.max(textHeight, characterSprite.h);
		}
		
		this.w = positionX - this.x;
		this.h = textHeight;
		
		for(i = 0; i < characterCount; i++)
		{
			characterSprite = this._characters[i];
			this.attach(characterSprite);
		}
	},
	skin: function(name, availableCharacters)
	{
		this._skinName = name;
		this._availableCharacters = availableCharacters;
		
		if(this._skinName)
		{
			var oldText = this.text();
			if(oldText)
			{
				this.text(oldText);
			}
		}
	}
});