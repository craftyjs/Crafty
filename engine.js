/*************************************
* Crafty JS
*
* Game engine in JavaScript
**************************************/

/**
Init creates a canvas that takes up the entire screen. Also
does the window.onload caching for selecting elements.

Can pass in specific width and height:
	Crafty.init(400,500); Creates canvas 400px wide and 500px high
	
One argument indicates tile size:
	Crafty.init(32); Creates fullsize canvas with a tile size of 32px
	Crafty.init(400,500,32); //Creates canvas 400px wide and 500px high with 32px tile
*/
Crafty.init(); 

/**
* Creates a layer to add tiles to and returns instance
* of new layer.
*/
var layer = Crafty.addLayer();

/**
* Get a layer at given indicies.
*
* Layers start from 0 being the very back and incremently towards
* the front
*/
var background = Crafty.getLayer(0);

/**
* Create objects from a sprite map
*
* First argument for the sprite image, second is
* an object with an identifier and it's position based on
* the tile size. 
* [x, y[, w, h]]
*
* e.g. [x position / tile size, y position / tile size, 1, 2]
*/
Crafty.sprite("images/sprites.png", {
	tree: [0,0],
	ground: [1,0],
	player: [2,0,1,2], //player is 2 tiles high
	enemy: [3,0,2,1] //enemy is 2 tiles wide
});

/**
* Create an entity
*
* Can pass an argument with an identifier to a sprite
*/
var tree = Crafty.e("tree");
var player = Crafty.e("player");
var entity = Crafty.e();

/**
* Crafty selector engine
*
* An integery will select the entity
* A string with # will select entities with the string as the label
* A string with . will select entities that have a component attached
*/
Crafty(player);
Crafty("#tree").hit(e);
Crafty(".solid").hit(player, function(e) {
	
});

//Enterframe event
Crafty.enterframe(function(e) {

});

Crafty(player).add("position, gravity");
if(!Crafty(player).has("controls")) {
	//Add the controls component if not already
	Crafty(player).add("controls");
}
Crafty(player).sprite("images/sprite.png", [2,0,1,2]);

//Add the entity to a layer
Crafty(player).append(layer);

/**
* Create a component
*/
Crafty.c("controls", {
	_speed: 4,

	init: function() {
		document.onkeydown = move;
		this.add("position"); //ensure position component exists
	},
	
	move: function(e) {
		switch(e.keyCode) {
			case 34:
				this._x += this._speed;
				break;
		}
	}
});

Crafty.c("position", {
	_x: 0,
	_y: 0,
	_w: 0,
	_h: 0
});

Crafty.c("animated", {
	_reel: {},
	
	animate: function(id, positionFrom, positionTo, speed) {
		reel[id] = ;
	},
	
	stop: function() {
	
	}
});

Crafty(player).animate("death", function() {

});

var loader = Crafty.preload(
	"",
	"",
	"",
	"",
	""
]);
loader.getLoaded(); //int (bytes)
loader.getTotal(); //int (bytes)
