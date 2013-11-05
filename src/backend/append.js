var Crafty = require('../common/core.js');

Crafty.viewport = { 
	_x: 0, _y: 0, width: 0, height: 0, 
	init: function(){},
	reset: function(){},
	rect: function () {
		return { _x: 0, _y: 0, _w: 0, _h: 0 };
    }
};

Crafty.support = { 
	setter: true, 
	defineProperty: true 
};

Crafty.audio = { 
	remove: function() {}
};

Crafty.keydown = {};
