/**
* Spatial HashMap for broad phase collision
*
* @author Louis Stowasser
*/
(function(parent) {

var cellsize,
	HashMap = function(cell) {
		cellsize = cell || 64;
		this.map = {};
	},
	SPACE = " ";

HashMap.prototype = {
	insert: function(obj) {
		var keys = HashMap.key(obj),
			entry = new Entry(keys,obj,this),
			i = 0,
			j,
			hash;
			
		//insert into all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash =  i + SPACE + j;
				if(!this.map[hash]) this.map[hash] = [];
				this.map[hash].push(obj);
			}
		}
		
		return entry;
	},
	
	search: function(rect,filter) {
		var keys = HashMap.key(rect),
			i,j,
			hash,
			results = [];
			
			if(filter === undefined) filter = true; //default filter to true
		
		//search in all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash =  i + SPACE + j;
				
				if(this.map[hash]) {
					results = results.concat(this.map[hash]);
				}
			}
		}
		
		if(filter) {
			var obj, id, finalresult = [], found = {};
			//add unique elements to lookup table with the entity ID as unique key
			for(i=0,l=results.length;i<l;i++) {
				obj = results[i];
				if(!obj) continue; //skip if deleted
				id = obj[0]; //unique ID
				
				//check if not added to hash and that actually intersects
				if(!found[id] && obj.x < rect._x + rect._w && obj._x + obj._w > rect._x &&
								 obj.y < rect._y + rect._h && obj._h + obj._y > rect._y) 
				   found[id] = results[i];
			}
			
			//loop over lookup table and copy to final array
			for(obj in found) finalresult.push(found[obj]);
			
			return finalresult;
		} else {
			return results;
		}
	},
	
	remove: function(keys,obj) {
		var i = 0, j, hash;
			
		if(arguments.length == 1) {
			obj = keys;
			keys = HashMap.key(obj);
		}	
		
		//search in all x buckets
		for(i=keys.x1;i<=keys.x2;i++) {
			//insert into all y buckets
			for(j=keys.y1;j<=keys.y2;j++) {
				hash = i + SPACE + j;
				
				if(this.map[hash]) {
					var cell = this.map[hash], m = 0, n = cell.length;
					//loop over objs in cell and delete
					for(;m<n;m++) if(cell[m] && cell[m][0] === obj[0]) 
						cell.splice(m,1);
				}
			}
		}
	},
	
	boundaries: function() {
		var k, ent,
			hash = {
				max: {x: -Infinity, y: -Infinity},
				min: {x: Infinity, y: Infinity}
			},
			coords = {
				max: {x: -Infinity, y: -Infinity},
				min: {x: Infinity, y: Infinity}
			};
			
		for (var h in this.map) {
			if (!this.map[h].length) continue;
			
			var coord = h.split(SPACE);
			if (coord[0] >= hash.max.x) { 
				hash.max.x = coord[0];
				for (k in this.map[h]) {
					ent = this.map[h][k];
					//make sure that this is a Crafty entity
					if (typeof ent == 'object' && 'requires' in ent) {
						coords.max.x = Math.max(coords.max.x, ent.x + ent.w);
					}
				}
			}
			if (coord[0] <= hash.min.x) {
				hash.min.x = coord[0];
				for (k in this.map[h]) {
					ent = this.map[h][k];
					if (typeof ent == 'object' && 'requires' in ent) {
						coords.min.x = Math.min(coords.min.x, ent.x);
					}
				}
			}
			if (coord[1] >= hash.max.y) {
				hash.max.y = coord[1];
				for (k in this.map[h]) {
					ent = this.map[h][k];
					if (typeof ent == 'object' && 'requires' in ent) {
						coords.max.y = Math.max(coords.max.y, ent.y + ent.h);
					}
				}
			}
			if (coord[1] <= hash.min.y) {
				hash.min.y = coord[1];
				for (k in this.map[h]) {
					ent = this.map[h][k];
					if (typeof ent == 'object' && 'requires' in ent) {
						coords.min.y = Math.min(coords.min.y, ent.y);
					}
				}
			}
		}
		
		return coords;
	}
};

HashMap.key = function(obj) {
	if (obj.hasOwnProperty('mbr')) {
		obj = obj.mbr();
	}
	var x1 = Math.floor(obj._x / cellsize),
		y1 = Math.floor(obj._y / cellsize),
		x2 = Math.floor((obj._w + obj._x) / cellsize),
		y2 = Math.floor((obj._h + obj._y) / cellsize);
	return {x1: x1, y1: y1, x2: x2, y2: y2};
};

HashMap.hash = function(keys) {
	return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
};

function Entry(keys,obj,map) {
	this.keys = keys;
	this.map = map;
	this.obj = obj;
}

Entry.prototype = {
	update: function(rect) {
		//check if buckets change
		if(HashMap.hash(HashMap.key(rect)) != HashMap.hash(this.keys)) {
			this.map.remove(this.keys, this.obj);
			var e = this.map.insert(this.obj);
			this.keys = e.keys;
		}
	}
};

parent.HashMap = HashMap;
})(Crafty);