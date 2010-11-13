/**
* Quad Tree ADT
* @author Louis Stowasser
*/
(function(parent) {

var MAX_SUB_DIVISIONS = 5,
	MAX_OBJECTS = 4,
	results = [], //results of multiple quads
	OBJECT = "object",
	NULL = null,
	mc = Math.ceil;
	
function QTree() {
	this.root = new QNode(0, 0, Crafty.window.width, Crafty.window.height, 0);
}

QTree.prototype = {
	
	get: function(x,y,w,h) {		
		//can pass rect
		if(typeof x === OBJECT) {
			y = x.y;
			w = x.w;
			h = x.h;
			x = x.x;
		}
		
		results = [];
		var root = this.root.get(x,y,w,h); //if stored in the root node
		return root || results;
	},
	
	put: function(x,y,obj) {
		var found;
		//if not an object, wrap it
		if(typeof obj !== OBJECT) {
			obj = {x: x, y: y, w: 1, h: 1, obj: obj};
		}
		//if putting an object only
		if(typeof x === OBJECT) {
			obj = x;
			y = x.y;
			x = x.x;
		}
		
		found = this.root.f(x,y,1,1);
		
		if(found) {
			found.obj.push(obj);
			
			if(found.obj.length > MAX_OBJECTS && found.lvl < MAX_SUB_DIVISIONS) found.divide();
		}
	},
	
	destroy: function() {
		this.root.destroy();
	}
};

function QNode(x,y,w,h,lvl) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.lvl = lvl;
	this.obj = [];
	
	this.nw = NULL;
	this.ne = NULL;
	this.sw = NULL;
	this.se = NULL;
}

QNode.prototype = {
	divide: function() {
		//if node already divided, stop
		if(this.nw && this.ne && this.sw && this.se) return;
		
		//divide the dimensions into quarters
		var hw = mc(this.w / 2),
			hh = mc(this.h / 2),
			i = 0, l = this.obj.length,
			temp, node;
			
		this.nw = new QNode(0,0,hw,hh,this.lvl+1);
		this.ne = new QNode(hw,0,hw+hw,hh,this.lvl+1);
		this.sw = new QNode(0,hh,hw,hh+hh,this.lvl+1);
		this.se = new QNode(hw,hh,hw+hw,hh+hh,this.lvl+1);
		
		//loop over the children and reassign
		for(;i<l;i++) {
			temp = this.obj[i];
			
			node = this.f(temp.x, temp.y, 1, 1); //find quad node
			node.obj.push(temp); //add to obj array
			
			if(node.obj.length > MAX_OBJECTS && this.lvl < MAX_SUB_DIVISIONS) node.divide(); //if overflow, divide that node
		}
		this.obj.length = 0;
		this.obj = NULL; //clear array
	},
	
	get: function(x,y,w,h) {
		//if passed rect is within this quad
		if(this.x < x + w && this.x + this.w > x &&
		   this.y < y + h && this.h + this.y > y) {
		   
			if(this.nw && this.ne && this.sw && this.se) { //if internal node, go deeper
				//for every child check not false
				
				var nw = this.nw.get(x,y,w,h), 
					ne = this.ne.get(x,y,w,h),
					sw = this.sw.get(x,y,w,h),
					se = this.se.get(x,y,w,h);
				
				//too hungover to find a clever solution
				//concat all found values into global results
				if(nw) results = results.concat(nw);
				if(ne) results = results.concat(ne);
				if(sw) results = results.concat(sw);
				if(se) results = results.concat(se);
			} else return this.obj;
		} else return false;
	},
	
	f: function(x,y,w,h) {
		//if passed rect is within this quad
		if(this.x < x + w && this.x + this.w > x &&
		   this.y < y + h && this.h + this.y > y) {
		   
			if(this.nw && this.ne && this.sw && this.se) { //if internal node, go deeper
				//for every child check not false
				return this.nw.f(x,y,w,h) || this.ne.f(x,y,w,h) || this.sw.f(x,y,w,h) || this.se.f(x,y,w,h);
			} else return this;
		} else return false;
	},
	
	destroy: function() {
		if(this.nw && this.ne && this.sw && this.se) {
			this.nw.destroy();
			this.ne.destroy();
			this.sw.destroy();
			this.se.destroy();
		}
		if(this.obj) this.obj.length = 0;
		this.nw = NULL;
		this.ne = NULL;
		this.sw = NULL;
		this.se = NULL;
	}
};

parent.QTree = QTree;
})(Crafty);