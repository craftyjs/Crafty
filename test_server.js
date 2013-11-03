require('./crafty.js');
var Crafty = Crafty || window.Crafty;

Crafty.init();
var ent = Crafty.e("2D").attr({x:10, y:10});
console.log(ent.x);