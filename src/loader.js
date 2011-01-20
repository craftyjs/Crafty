/**
* Loader to load assets
*/
Crafty.extend({
	assets: {},
	
	load: function(data, callback) {
		var i = 0, l = data.length, current, obj, total = l, j = 0;
		for(;i<l;++i) {
			current = data[i];
			ext = current.substr(current.lastIndexOf('.')+1).toLowerCase();

			if((ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4") && Crafty.support.audio) {
				obj = new Audio(current);
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
				
				if(j === total) {
					if(callback) callback();
				}
			};
		}
	}
});