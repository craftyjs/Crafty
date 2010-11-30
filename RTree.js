/**
* R Tree ADT
*
* Used in Crafty to keep track of every 2D entity for automatic redraw
* and generally quick access times with a given bounding box.
* @author Louis Stowasser
*/
//(function(parent) {

var MAX_SUB_DIVISIONS = 6,
	MAX_OBJECTS = 6,
	results = [], //results of searching
	OBJECT = "object",
	mc = Math.ceil;
	
function RTree() {
	this.root = new Box(0, 0, Crafty.window.width, Crafty.window.height, null, 0);
}

RTree.prototype = {
	
	find: function(x,y,w,h) {		
		//can pass rect
		if(typeof x === OBJECT) {
			y = x.y;
			w = x.w;
			h = x.h;
			x = x.x;
		}
		
		results = [];
		var root = this.root.find(x,y,w,h); //if stored in the root node
		return root || results;
	},
	
	put: function(x,y,w,h,obj) {
		var found;
		
		//if putting an object only
		if(typeof x === OBJECT) {
			obj = x;
			h = mc(x.h);
			w = mc(x.w);
			y = mc(x.y);
			x = mc(x.x);
		}
		//search for bounding box
		found = this.root.get(x,y,w,h);
		
		if(found) {
			//create bounding box pointing to passed obj
			var box = new Box(x,y,w,h,found,found.lvl+1);
			box.obj = obj;
			
			//add object to bounding box
			found.children.push(box); 
			found.update(x,y,w,h);
			
			//if the amount of children overflows, divide found box
			
			if(found.children.length >= MAX_OBJECTS && found.lvl < MAX_SUB_DIVISIONS) {
				found.divide();
			}
			
			return box;
		}
	}
};


function Box(x,y,w,h,parent,lvl) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.parent = parent;
	this.lvl = lvl;
	
	this.children = [];
	this.obj = null;
}

Box.prototype = {
	/**
	* Divide the bounding box children in half
	* and create two new boxes containing the split
	* items. The x,y will be the most top left child
	* and the w,h will be the distance to the most
	* right bottom child.
	*/
	divide: function() {
		
		var i = 0, l = this.children.length, 
			half = mc(l / 2),
			child, b,
			box1 = new Box(0,0,0,0,this,this.lvl+1), //create empty boxes for groups
			box2 = new Box(0,0,0,0,this,this.lvl+1),
			b1, b2,
			children = [[],[]],
			bounds = [{},{}];
			
		if(!l) return; //stop if nothing to divide
		
		//loop over this bounding box children
		for(;i<l;i++) {
			child = this.children[i];
			b = +(i >= half); //group index (convert bool to 0/1)
			children[b].push(child); //add to children array
			child.parent = b ? box2 : box1;
			
			//find minimum x
			if(child.x < bounds[b].x || !('x' in bounds[b])) 
				bounds[b].x = child.x;
				
			//find minimum y
			if(child.y < bounds[b].y || !('y' in bounds[b])) 
				bounds[b].y = child.y;
				
			//find maximum w
			if(child.x + child.w > bounds[b].x + bounds[b].w || !('w' in bounds[b])) 
				bounds[b].w = child.w + child.x ;
				
			//find maximum h
			if(child.y + child.h > bounds[b].y + bounds[b].h || !('h' in bounds[b])) 
				bounds[b].h = child.h + child.y ;
		}
		bounds[0].w -= bounds[0].x;
		bounds[1].w -= bounds[1].x;
		bounds[0].h -= bounds[0].y;
		bounds[1].h -= bounds[1].y;
		
		//cache the bound values
		b1 = bounds[0]; b2 = bounds[1];
		
		box1.x = b1.x; box1.y = b1.y; box1.w = b1.w; box1.h = b1.h;
		box2.x = b2.x; box2.y = b2.y; box2.w = b2.w; box2.h = b2.h;
		
		box1.children = children[0];
		box2.children = children[1];
		
		//set children to the two bounding boxes
		this.children = [box1, box2];
		
	},
	
	/**
	* Update boxes until the top to ensure
	* correct bounding
	*/
	update: function(x,y,w,h) {
		if(!this.children.length) { //if leaf node, change x,y,w,h
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
		} else { //if internal, update to fit
			if(this.x > x) this.x = x;
			if(this.y > y) this.y = y;
			if(this.x + this.w < x+w) this.w = x+w-this.x;
			if(this.y + this.h < y+h) this.h = y+h-this.y;
		}
		if(this.parent !== null) {
			this.parent.update(x,y,w,h);
		}
	},
	
	/**
	* Find the appropriate bounding box for
	* insertation
	*/
	get: function(x,y,w,h) {
		var i = 0, l = this.children.length, r;
		//if passed rect is within this quad
		if(this.x < x + w && this.x + this.w > x &&
		   this.y < y + h && this.h + this.y > y) {

			//if external node, try parent then this.
			if(!l) {
				return this.parent || this;
			}

			//loop over children boxes
			for(;i<l;i++) {
				r = this.children[i].get(x,y,w,h);
				if(r) return r;
			}
			return this;
		} else return false;
	},
	
	/**
	* Find all objects intersected by a rect
	*/
	find: function(x,y,w,h) {
		var i = 0, l = this.children.length, r;
		//if passed rect is within this quad
		if(this.x < x + w && this.x + this.w > x &&
		   this.y < y + h && this.h + this.y > y) {

			//if external node, select this
			if(!l) return this.obj;

			//loop over children boxes
			for(;i<l;i++) {
				r = this.children[i].find(x,y,w,h);
				if(r) results = results.concat(r);
			}
		   
		} else return false;
	}
	
};

//parent.RTree = RTree;
//})(Crafty);