/*!***************************************************************************** 
	rtree.js - General-Purpose Non-Recursive Javascript R-Tree Library
	Version 0.6.2, December 5st 2009

  Copyright (c) 2009 Jon-Carlos Rivera

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

	Jon-Carlos Rivera - imbcmdth@hotmail.com
******************************************************************************/

(function(window) {
// cache Math references
var M = Math;
var Mathabs = M.abs;
var Mathmax = M.max;
var Mathmin = M.min;
var Mathfloor = M.floor;


/**
 * RTree - A simple r-tree structure for great results.
 * @constructor
 */
var RTree = function(width) {
	// Variables to control tree-dimensions
	var _Min_Width = 3;  // Minimum width of any node before a merge
	var _Max_Width = 6;  // Maximum width of any node before a split
	if(!isNaN(width)) {
		_Min_Width = Mathfloor(width/2.0);
		_Max_Width = width;
	}
	// Start with an empty root-tree
	var _T = {x:0, y:0, w:0, h:0, id:"root", n:[] };
	
	// simple isArray
	Array.prototype._isArray = true;
	var isArray = function(o) {
		return o._isArray;
	};


	/* @function
	 * @description Function to generate unique strings for element IDs
	 * @param {String} idPrefix	The prefix to use for the IDs generated.
	 * @return {String}	A guarenteed unique ID.
	 */
	var _name_to_id = (function() {
		
		// hide our idCache inside this closure
		var idCache = {};
		
		// return the api: our function that returns a unique string with incrementing number appended to given idPrefix
		return function(idPrefix) {
			var idVal = 0;
			if(idPrefix in idCache) {
				idVal = idCache[idPrefix]++;
			} else {
				idCache[idPrefix] = 0; 
			}
			return idPrefix + "_" + idVal;
		}
	})();

	/* This is my special addition to the world of r-trees
	 * every other (simple) method I found produced crap trees
	 * this skews insertions to prefering squarer and emptier nodes
	 * lperi = Average size of a side of the new rectangle
	 * lgeo = Area of new rectangle
	 * returns the ratio of the perimeter to the area - the closer to 1 we are,
	 * the more "square" a rectangle is. conversly, when approaching zero the more elongated a rectangle is
	 */
	RTree.R.sr = function(l, w, fill) {
		var lperi = (l + w) / 2.0;
		var larea = l * w;
		var lgeo = larea / (lperi*lperi);
		return(larea * fill / lgeo); 
	};
	
	var _make_MBR = function(nodes, rect) { // nodes must contain at least one rectangle
		var nl = nodes.length, i = nl -1;
		if(nl < 1) {
			return({x:0, y:0, w:0, h:0});
			//throw "make_MBR: nodes must contain at least one rectangle!";
		}
		if(!rect) {
			rect = {x:nodes[0].x, y:nodes[0].y, w:nodes[0].w, h:nodes[0].h};
		} else {
			rect.x = nodes[0].x;
			rect.y = nodes[0].y;
			rect.w = nodes[0].w;
			rect.h = nodes[0].h;
		}	
		for(; i>0; i--) {
			RTree.R.er(rect, nodes[i]);
		}
			
		return(rect);
	};
	
	/* find the best specific node(s) for object to be deleted from
	 * [ leaf node parent ] = _remove_subtree(rectangle, object, root)
	 * @private
	 */
	var _remove_subtree = function(rect, obj, root) {
		var hit_stack = []; // Contains the elements that overlap
		var count_stack = []; // Contains the elements that overlap
		var ret_array = [];
		var current_depth = 1;
		var anydeleted = false; // True if anything was deleted
		
		if(!rect || !RTree.R.or(rect, root)) {
			return ret_array;
		}

		var ret_obj = {x:rect.x, y:rect.y, w:rect.w, h:rect.h, t:obj};
		
		count_stack.push(root.n.length);
		hit_stack.push(root);

		do {
			var tree = hit_stack.pop();
			var i = count_stack.pop()-1;
			
			if("t" in ret_obj) { // We are searching for a target
				
				while(i >= 0)	{
					
					var ltree = tree.n[i];
					
					if(RTree.R.or(ret_obj, ltree)) {
						
						if( (ret_obj.t && "l" in ltree && ltree.l === ret_obj.t) || (!ret_obj.t && ("l" in ltree || RTree.R.cr(ltree, ret_obj)))) { // A Match !!
							
							// Yup we found a match...
							// we can cancel search and start walking up the list
							if("n" in ltree) {// If we are deleting a node not a leaf...
								ret_array = _search_subtree(ltree, true, [], ltree);
								tree.n.splice(i, 1); 
							} else {
								ret_array = tree.n.splice(i, 1); 
							}
							
							// Resize MBR down...
							_make_MBR(tree.n, tree);
							delete ret_obj.t;
							if(tree.n.length < _Min_Width) { // Underflow
								ret_obj.n = _search_subtree(tree, true, [], tree);
							}
							break;
							
					  	} else if("n" in ltree) { // Not a Leaf
							current_depth += 1;
							count_stack.push(i);
							hit_stack.push(tree);
							tree = ltree;
							i = ltree.n.length;
						}
					}
					
					i -= 1;
				}
				
			} else if("n" in ret_obj) { // We are unsplitting
				
				tree.n.splice(i+1, 1); // Remove unsplit node
				// ret_obj.n contains a list of elements removed from the tree so far
				if(tree.n.length > 0)
					_make_MBR(tree.n, tree);
				for(var t = 0;t<ret_obj.n.length;t++)
					_insert_subtree(ret_obj.n[t], tree);
				ret_obj.n.length = 0;
				if(hit_stack.length == 0 && tree.n.length <= 1) { // Underflow..on root!
					ret_obj.n = _search_subtree(tree, true, ret_obj.n, tree);
					tree.n.length = 0;
					hit_stack.push(tree);
					count_stack.push(1);
				} else if(hit_stack.length > 0 && tree.n.length < _Min_Width) { // Underflow..AGAIN!
					ret_obj.n = _search_subtree(tree, true, ret_obj.n, tree);
					tree.n.length = 0;						
				}else {
					delete ret_obj.n; // Just start resizing
				}
				
			} else { // we are just resizing
				_make_MBR(tree.n, tree);
			}
			
			current_depth -= 1;
			
			
		} while(hit_stack.length > 0);
		
		return(ret_array);
	};
	
	

	/* choose the best damn node for rectangle to be inserted into
	 * [ leaf node parent ] = _choose_leaf_subtree(rectangle, root to start search at)
	 * @private
	 */
	var _choose_leaf_subtree = function(rect, root) {
		var best_choice_index = -1;
		var best_choice_stack = [];
		var best_choice_area;
		var best_choice_node_count = _Max_Width;
		
		var load_callback = function(local_tree, local_node){
			return(function(data) { 
				local_tree._attach_data(local_node, data);
			});
		};
	
		best_choice_stack.push(root);
		var nodes = root.n;	
		
		// cache the squarified function lookup
		var sr = RTree.R.sr;
		
		do {	
			if(best_choice_index != -1)	{
				best_choice_stack.push(nodes[best_choice_index]);
				var nodes = nodes[best_choice_index].n;
				best_choice_index = -1;
			}
				
			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
				var ltreenodes = ltree.n;
				if("l" in ltree) {  
					// Bail out of everything and start inserting
					best_choice_index = -1;
					break;
				}
				// Area of new enlarged rectangle
				var old_lratio = sr(ltree.w, ltree.h, ltreenodes.length+1);
				
				// Enlarge rectangle to fit new rectangle
				var nw = Mathmax(ltree.x+ltree.w, rect.x+rect.w) - Mathmin(ltree.x, rect.x);
				var nh = Mathmax(ltree.y+ltree.h, rect.y+rect.h) - Mathmin(ltree.y, rect.y);
				
				// Area of new enlarged rectangle
				var lratio = sr(nw, nh, ltreenodes.length+2);
				
				if(best_choice_index < 0 || Mathabs(lratio - old_lratio) < best_choice_area) {
					best_choice_area = Mathabs(lratio - old_lratio);
					best_choice_index = i;
				}
			}
		} while(best_choice_index != -1);

		return(best_choice_stack);
	};

	/* split a set of nodes into two roughly equally-filled nodes
	 * [ an array of two new arrays of nodes ] = linear_split(array of nodes)
	 * @private
	 */
	var _linear_split = function(nodes) {
		var ln = _pick_linear(nodes);
		while(nodes.length > 0)	{
			_pick_next(nodes, ln[0], ln[1]);
		}
		return(ln);
	};
	
	/* insert the best source rectangle into the best fitting parent node: a or b
	 * [] = pick_next(array of source nodes, target node array a, target node array b)
	 * @private
	 */
	var _pick_next = function(nodes, a, b) {
	  // Area of new enlarged rectangle
	  	var sr = RTree.R.sr;
		var area_a = sr(a.w, a.h, a.n.length+1);
		var area_b = sr(b.w, b.h, b.n.length+1);
		var high_area_delta;
		var high_area_node;
		var lowest_growth_group;
		
		for(var i = nodes.length-1; i>=0;i--) {
			var l = nodes[i];
			var new_area_a = {};
			new_area_a.x = Mathmin(a.x, l.x); 
			new_area_a.y = Mathmin(a.y, l.y);
			new_area_a.w = Mathmax(a.x+a.w, l.x+l.w) - new_area_a.x;
			new_area_a.h = Mathmax(a.y+a.h, l.y+l.h) - new_area_a.y;
			var change_new_area_a = Mathabs(sr(new_area_a.w, new_area_a.h, a.n.length+2) - area_a);
	
			var new_area_b = {};
			new_area_b.x = Mathmin(b.x, l.x);
			new_area_b.y = Mathmin(b.y, l.y);
			new_area_b.w = Mathmax(b.x+b.w, l.x+l.w) - new_area_b.x;
			new_area_b.h = Mathmax(b.y+b.h, l.y+l.h) - new_area_b.y;
			var change_new_area_b = Mathabs(sr(new_area_b.w, new_area_b.h, b.n.length+2) - area_b);

			if( !high_area_node || !high_area_delta || Mathabs( change_new_area_b - change_new_area_a ) < high_area_delta ) {
				high_area_node = i;
				high_area_delta = Mathabs(change_new_area_b-change_new_area_a);
				lowest_growth_group = change_new_area_b < change_new_area_a ? b : a;
			}
		}
		var temp_node = nodes.splice(high_area_node, 1)[0];
		if(a.n.length + nodes.length + 1 <= _Min_Width)	{
			a.n.push(temp_node);
			RTree.R.er(a, temp_node);
		} else if(b.n.length + nodes.length + 1 <= _Min_Width) {
			b.n.push(temp_node);
			RTree.R.er(b, temp_node);
		} else {
			lowest_growth_group.n.push(temp_node);
			RTree.R.er(lowest_growth_group, temp_node);
		}
	};

	/* pick the "best" two starter nodes to use as seeds using the "linear" criteria
	 * [ an array of two new arrays of nodes ] = pick_linear(array of source nodes)
	 * @private
	 */
	var _pick_linear = function(nodes) {
		var lowest_high_x = nodes.length-1,
			highest_low_x = 0,
			lowest_high_y = nodes.length-1,
			highest_low_y = 0;
		
		for(var i = nodes.length-2; i>=0;i--)	{
			var l = nodes[i];
			if(l.x > nodes[highest_low_x].x ) {
				highest_low_x = i;
			} else if(l.x+l.w < nodes[lowest_high_x].x+nodes[lowest_high_x].w) {
				lowest_high_x = i;
			}
			if(l.y > nodes[highest_low_y].y ) {
				highest_low_y = i;
			} else if(l.y+l.h < nodes[lowest_high_y].y+nodes[lowest_high_y].h) {
				lowest_high_y = i;
			}
		}
		var dx = Mathabs((nodes[lowest_high_x].x+nodes[lowest_high_x].w) - nodes[highest_low_x].x);
		var dy = Mathabs((nodes[lowest_high_y].y+nodes[lowest_high_y].h) - nodes[highest_low_y].y);
		if( dx > dy )	{ 
			if(lowest_high_x > highest_low_x)	{
				var t1 = nodes.splice(lowest_high_x, 1)[0];
				var t2 = nodes.splice(highest_low_x, 1)[0];
			} else {
				var t2 = nodes.splice(highest_low_x, 1)[0];
				var t1 = nodes.splice(lowest_high_x, 1)[0];
			}
		} else {
			if(lowest_high_y > highest_low_y)	{
				var t1 = nodes.splice(lowest_high_y, 1)[0];
				var t2 = nodes.splice(highest_low_y, 1)[0];
			} else {
				var t2 = nodes.splice(highest_low_y, 1)[0];
				var t1 = nodes.splice(lowest_high_y, 1)[0];
			}
		}
		
		return([ {x:t1.x, y:t1.y, w:t1.w, h:t1.h, n:[t1]}, {x:t2.x, y:t2.y, w:t2.w, h:t2.h, n:[t2]} ]);
	};
	
	var _attach_data = function(node, more_tree) {
		node.n = more_tree.n;
		node.x = more_tree.x;
		node.y = more_tree.y;
		node.w = more_tree.w;
		node.h = more_tree.h;
		return(node);
	};

	/* non-recursive internal search function 
	 * [ nodes | objects ] = _search_subtree(rectangle, [return node data], [array to fill], root to begin search at)
	 * @private
	 */
	var _search_subtree = function(rect, return_node, return_array, root) {
		var hit_stack = []; // Contains the elements that overlap
		
		if(!RTree.R.or(rect, root)) {
			return(return_array);
		}
		
		var load_callback = function(local_tree, local_node){
			return(function(data) { 
				local_tree._attach_data(local_node, data);
			});
		};
		
		hit_stack.push(root.n);
		
		do {
			var nodes = hit_stack.pop();
			
			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
				if(RTree.R.or(rect, ltree)) {
					if("n" in ltree) { // Not a Leaf
						hit_stack.push(ltree.n);
					} else if("l" in ltree) { // A Leaf !!
						if(!return_node) {
							return_array.push(ltree.l);
						} else {
							return_array.push(ltree);
						}
					}
				}
			}
		} while(hit_stack.length > 0);
		
		return(return_array);
	};
	
	/* non-recursive internal insert function
	 * [] = _insert_subtree(rectangle, object to insert, root to begin insertion at)
	 * @private
	 */
	var _insert_subtree = function(node, root) {
		var bc; // Best Current node
		// Initial insertion is special because we resize the Tree and we don't
		// care about any overflow (seriously, how can the first object overflow?)
		if(root.n.length == 0) {
			root.x = node.x;
			root.y = node.y;
			root.w = node.w;
			root.h = node.h;
			root.n.push(node);
			return;
		}
		
		// Find the best fitting leaf node
		// choose_leaf returns an array of all tree levels (including root)
		// that were traversed while trying to find the leaf
		var tree_stack = _choose_leaf_subtree(node, root);
		var ret_obj = node;//{x:rect.x,y:rect.y,w:rect.w,h:rect.h, l:obj};
	
		// Walk back up the tree resizing and inserting as needed
		do {
			//handle the case of an empty node (from a split)
			if(bc && "n" in bc && bc.n.length == 0) {
				var pbc = bc; // Past bc
				bc = tree_stack.pop();
				for(var t=0;t<bc.n.length;t++) {
					if(bc.n[t] === pbc || bc.n[t].n.length == 0) {
						bc.n.splice(t, 1);
						break;
					}
				}
			} else {
				bc = tree_stack.pop();
			}
			
			// If there is data attached to this ret_obj
			if("l" in ret_obj || "n" in ret_obj || isArray(ret_obj)) { 
				// Do Insert
				if(isArray(ret_obj)) {
					for(var ai = 0; ai < ret_obj.length; ai++) {
						RTree.R.er(bc, ret_obj[ai]);
					}
					bc.n = bc.n.concat(ret_obj); 
				} else {
					RTree.R.er(bc, ret_obj);
					bc.n.push(ret_obj); // Do Insert
				}
				
				if(bc.n.length <= _Max_Width) { // Start Resizeing Up the Tree
					ret_obj = {x:bc.x,y:bc.y,w:bc.w,h:bc.h};
				} else { // Otherwise Split this Node
					// linear_split() returns an array containing two new nodes
					// formed from the split of the previous node's overflow
					var a = _linear_split(bc.n);
					ret_obj = a;//[1];
					
					if(tree_stack.length < 1)	{ // If are splitting the root..
						bc.n.push(a[0]);
						tree_stack.push(bc);     // Reconsider the root element
						ret_obj = a[1];
					} /*else {
						delete bc;
					}*/
				}
			} else { // Otherwise Do Resize
				//Just keep applying the new bounding rectangle to the parents..
				RTree.R.er(bc, ret_obj);
				ret_obj = {x:bc.x,y:bc.y,w:bc.w,h:bc.h};
			}
		} while(tree_stack.length > 0);
	};
	
	/* non-recursive search function 
	 * [ nodes | objects ] = RTree.search(rectangle, [return node data], [array to fill])
	 * @public
	 */
	this.search = function(rect, return_node, return_array) {
		var args = arguments;
		if(args.length < 1) return;
		
		// note: fallthrough is key here!! this sets defaults for missing args as it falls through
		switch(args.length) {
			case 1:
				args[1] = false;// Add an "return node" flag - may be removed in future
			case 2:
				args[2] = []; // Add an empty array to contain results
			case 3:
				args[3] = _T; // Add root node to end of argument list
			default:
				args.length = 4;
		}

		return(_search_subtree.apply(this, args));
	};
	
	/* non-recursive function that deletes a specific
	 * [ number ] = RTree.remove(rectangle, obj)
	 */
	this.remove = function(rect, obj) {
		var args = arguments;
		if(args.length < 1) return;

		// note: fallthrough is key here!! this sets defaults for missing args as it falls through
		switch(args.length) {
			case 1:
				args[1] = false; // obj == false for conditionals
			case 2:
				args[2] = _T; // Add root node to end of argument list
			default:
				args.length = 3;
		}
		
		if(args[1] === false) { // Do area-wide delete
			var numberdeleted = 0;
			var ret_array = [];
			do { 
				numberdeleted=ret_array.length; 
				ret_array = ret_array.concat(_remove_subtree.apply(this, args));
			} while( numberdeleted !=  ret_array.length);
			return ret_array;
		} else { // Delete a specific item
			return(_remove_subtree.apply(this, args));
		}
	};
		
	/* non-recursive function counts number of nodes hit
	 * [ number ] = RTree.count(rectangle)
	 */
	this.count = function(rect) {
		if(arguments.length < 1) return;
		return(this.search.apply(this, arguments).length);
	};
	
	/* non-recursive insert function
	 * [] = RTree.insert(rectangle, object to insert)
	 */
	this.insert = function(rect, obj) {
		if(arguments.length < 2 || (!rect.l && arguments.length < 1)) return;
		
		if(!rect.l) rect.l = obj;
		
		return(_insert_subtree(rect, _T));
	};
	
	/* non-recursive update function
	 * RTree.update(object to update)
	 */
	 this.update = function(obj) {
		this.remove(obj,obj);
		this.insert(obj,obj);
	 };

//End of RTree
};

RTree.R = {};
/* returns true if rectangle 1 overlaps rectangle 2
 * [ boolean ] = overlap_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.R.or = function(a, b) {
	return(a.x < (b.x+b.w) && (a.x+a.w) > b.x && a.y < (b.y+b.h) && (a.y+a.h) > b.y);
};

/* returns true if rectangle a is contained in rectangle b
 * [ boolean ] = contains_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.R.cr = function(a, b) {
	return((a.x+a.w) <= (b.x+b.w) && a.x >= b.x && (a.y+a.h) <= (b.y+b.h) && a.y >= b.y);
};

/* expands rectangle A to include rectangle B, rectangle B is untouched
 * [ rectangle a ] = expand_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.R.er = function(a, b)	{
	var nx = Mathmin(a.x, b.x);
	var ny = Mathmin(a.y, b.y);
	a.w = Mathmax(a.x+a.w, b.x+b.w) - nx;
	a.h = Mathmax(a.y+a.h, b.y+b.h) - ny;
	a.x = nx; a.y = ny;
	return(a);
};


window.RTree = RTree;
})(Crafty);