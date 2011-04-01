/**
* Loader to load assets
*/
Crafty.extend({
	assets: {},
	
	load: function(data, oncomplete, onprogress, onerror) {
		var i = 0, l = data.length, current, obj, total = l, j = 0;
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
					console.log('Failed to load ' + this.src);
					j++;
					if(j === total) {
						if(oncomplete) oncomplete();
					}
				}
			};
		}
	}
});