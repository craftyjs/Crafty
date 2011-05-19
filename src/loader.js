Crafty.extend({
	/**@
	* #Crafty.assets
	* @category Assets
	* An object containing every asset used in the current Crafty game. 
	* The key is the URL and the value is the `Audio` or `Image` object.
    *
	* If loading an asset, check that it is in this object first to avoid loading twice.
	* @example
	* ~~~
	* var isLoaded = !!Crafty.assets["images/sprite.png"];
	* ~~~
	*/
	assets: {},
	
	/**@
	* #Crafty.loader
	* @category Assets
	* @sign public void Crafty.load(Array assets, Function onLoad[, Function onProgress, Function onError])
	* @param assets - Array of assets to load (accepts sounds and images)
	* @param onLoad - Callback when the assets are loaded
	* @param onProgress - Callback when an asset is loaded. Contains information about assets loaded
	* @param onError - Callback when an asset fails to load
	* Preloader for all assets. Takes an array of URLs and 
	* adds them to the `Crafty.assets` object.
	* 
	* The `onProgress` function will be passed on object with information about 
	* the progress including how many assets loaded, total of all the assets to 
	* load and a percentage of the progress.
    *
	* `onError` will be passed with the asset that couldn't load.
	* 
	* @example
	* ~~~
	* Crafty.load(["images/sprite.png", "sounds/jump.mp3"], 
	*     function() {
	*         //when loaded
	*         Crafty.scene("main"); //go to main scene
	*     },
	*
	*     function(e) {
	*		  //progress
	*     },
	*
	*     function(e) {
	*	      //uh oh, error loading
	*     }
	* );
	* ~~~
	* @see Crafty.assets
	*/
	load: function(data, oncomplete, onprogress, onerror) {
		var i = 0, l = data.length, current, obj, total = l, j = 0, ext;
		for(;i<l;++i) {
			current = data[i];
			ext = current.substr(current.lastIndexOf('.')+1).toLowerCase();

			if(Crafty.support.audio && (ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4")) {
				obj = new Audio(current);
				//Chrome doesn't trigger onload on audio, see http://code.google.com/p/chromium/issues/detail?id=77794
				if (navigator.userAgent.indexOf('Chrome') != -1) j++;
			} else if(ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "png") {
				obj = new Image();
				obj.src = current;
			} else {
				total--;
				continue; //skip if not applicable
			}
			
			//add to global asset collection
			this.assets[current] = obj;
			
			obj.onload = function() {
				++j;
				
				//if progress callback, give information of assets loaded, total and percent
				if(onprogress) {
					onprogress.call(this, {loaded: j, total: total, percent: (j / total * 100)});
				}
				if(j === total) {
					if(oncomplete) oncomplete();
				}
			};
			
			//if there is an error, pass it in the callback (this will be the object that didn't load)
			obj.onerror = function() {
				if(onerror) {
					onerror.call(this, {loaded: j, total: total, percent: (j / total * 100)});
				} else {
					j++;
					if(j === total) {
						if(oncomplete) oncomplete();
					}
				}
			};
		}
	}
});