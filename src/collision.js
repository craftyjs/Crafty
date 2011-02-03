ITERATOR = 0;
Crafty.c("collision", {
	
	collision: function(poly) {
		this.map = poly;
		this.attach(this.map);
	},
	
	hit: function(comp) {
		var area = this._mbr || this,
			results = Crafty.map.search(area, false),
			i = 0, l = results.length,
			dupes = {},
			id, obj, oarea, key,
			hasMap = ('map' in this && 'containsPoint' in this.map),
			finalresult = [];
		
		if(!l) {
			return false;
		}
		
		for(;i<l;++i) {
			obj = results[i];
			oarea = obj._mbr || obj; //use the mbr
			
			if(!obj) continue;
			id = obj[0];
			
			//check if not added to hash and that actually intersects
			if(!dupes[id] && this[0] !== id && obj.__c[comp] && 
							 oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
							 oarea._y < area._y + area._h && oarea._h + oarea._y > area._y) 
			   dupes[id] = obj;
		}
		
		for(key in dupes) {
			obj = dupes[key];

			if(hasMap && 'map' in obj) {
				var SAT = this.SAT(this.map, obj.map);
				if(SAT) finalresult.push(SAT);
			} else {
				finalresult.push(obj);
			}
		}
		
		if(!finalresult.length) {
			return false;
		}
		
		return finalresult;
	},
	
	onhit: function(comp, fn) {
		this.bind("enterframe", function() {
			var hitdata = this.hit(comp);
			//console.log(hitdata);
			if(hitdata) {
				fn.call(this, hitdata);
			}
		});
		return this;
	},
	
	SAT: function(poly1, poly2) {
		var points1 = poly1.points,
			points2 = poly2.points,
			i = 0, l = points1.length,
			j, k = points2.length,
			normal = {x: 0, y: 0},
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = null,
			dot,
			nextPoint,
			currentPoint;
		
		//loop through the edges of Polygon 1
		for(;i<l;i++) {
			nextPoint = points1[(i==l-1 ? 0 : i+1)];
			currentPoint = points1[i];
			
			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);
			
			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;
			
			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;
			
			//project all vertices from poly1 onto axis
			for(j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if(dot > max1 || max1 === -1) max1 = dot;
				if(dot < min1 || min1 === -1) min1 = dot;
			}
			
			//project all vertices from poly2 onto axis
			for(j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if(dot > max2 || max2 === -1) max2 = dot;
				if(dot < min2 || min2 === -1) min2 = dot;
			}
			
			//calculate the minimum translation vector should be negative
			interval = (min1 < min2) ? min2 - max1 : min1 - max2;
			
			//exit early if positive
			if(interval > 0) {
				return false;
			}
			if(interval > MTV || MTV === null) MTV = interval;
		}
		
		//loop through the edges of Polygon 1
		for(i=0;i<k;i++) {
			nextPoint = points2[(i==k-1 ? 0 : i+1)];
			currentPoint = points2[i];
			
			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);
			
			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;
			
			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;
			
			//project all vertices from poly1 onto axis
			for(j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if(dot > max1 || max1 === -1) max1 = dot;
				if(dot < min1 || min1 === -1) min1 = dot;
			}
			
			//project all vertices from poly2 onto axis
			for(j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if(dot > max2 || max2 === -1) max2 = dot;
				if(dot < min2 || min2 === -1) min2 = dot;
			}
			
			//calculate the minimum translation vector should be negative
			interval = (min1 < min2) ? min2 - max1 : min1 - max2;
			
			//exit early if positive
			if(interval > 0) {
				return false;
			}
			if(interval > MTV || MTV === null) MTV = interval;
		}
		
		return {overlap: MTV};
	}
});