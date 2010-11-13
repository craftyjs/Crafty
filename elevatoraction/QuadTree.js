/**
* Quad Tree ADT
* @author Louis Stowasser
*/

function QTree() {
	this.root = new QNode(0, 0, Crafty.window.width, Crafty.window.height);
}

QTree.prototype = {
	subs: 4, //How many objects before divide
	
	find: function(x,y,w,h) {		
		//can pass rect
		if(typeof x === "object") {
			y = x.y;
			w = x.w;
			h = x.h;
			x = x.x;
		}
		
		var found = this.root.find(x,y,w,h);
		if(found) return found.obj;
		
		console.log(found);
		return false;
	},
	
	put: function(x,y,obj) {
		var found;
		found = this.root.find(x,y,1,1);
		
		if(found) {
			found.obj.push(obj);
			if(found.obj.length > 4) found.divide();
		} else console.log("NONE FOUND");
	}
};

function QNode(x,y,w,h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

QNode.prototype = {
	nw: null,
	ne: null,
	sw: null,
	se: null,

	obj: [],
	
	divide: function() {
		//if node already divided, stop
		if(this.nw && this.ne && this.sw && this.se) return;
		
		//divide the dimensions into quarters
		var hw = Math.ceil(this.w / 2),
			hh = Math.ceil(this.h / 2),
			i = 0, l = this.obj.length,
			temp, node;
			
		this.nw = new QNode(0,0,hw,hh);
		this.ne = new QNode(hw,0,hw,hh);
		this.sw = new QNode(0,hh,hw,hh);
		this.se = new QNode(hw,hh,hw,hh);
		
		//loop over the children and reassign
		for(;i<l;i++) {
			temp = this.obj[i];
			node = this.find(temp.x, temp.y, 1, 1); //find quad node
			if(!node) console.log("NO NODE FOUND", node); //if none found uh oh
			node.obj.push(temp); //add to obj array
			if(node.obj.length > 4) node.divide(); //if overflow, divide that node
		}
		this.obj = undefined; //clear array
	},
	
	find: function(x,y,w,h) {
		var r;
		
		//if passed rect is within this quad
		if(this.x < x + w && this.x + this.w > x &&
		   this.y < y + h && this.h + this.y > y) {
		   
			if(this.nw && this.ne && this.sw && this.se) { //if internal node, go deeper
				//for every child check not false
				r = this.nw.find(x,y,w,h) || this.ne.find(x,y,w,h) || this.sw.find(x,y,w,h) || this.se.find(x,y,w,h);
				if(r) return r;
			} else return this;
		} else return false;
	}
};

