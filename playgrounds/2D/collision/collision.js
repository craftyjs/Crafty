Crafty.init(600, 600);

var trapezoid = Crafty.e('Trapezoid, 2D, DOM, Collision, SolidHitBox, Mouse, Draggable').setName('Trapezoid').
  attr({w: 200, h: 100}).collision(new Crafty.polygon([50, 0], [0, 100], [200, 100], [150, 0]));
var yellow = Crafty.e('Yellow, 2D, DOM, Collision, SolidHitBox, Mouse, Draggable').setName('Yellow').
  attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0], [0, 100], [100, 100], [100, 0]));
var parallelogram = Crafty.e('Parallelogram, 2D, DOM, Collision, SolidHitBox, Mouse, Draggable').setName('Parallelogram').
  attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0], [25, 100], [100, 100], [75, 0]));
var green = Crafty.e('Green, 2D, DOM, Collision, Color, Mouse, Draggable').setName('Green').
  attr({w: 100, h: 100}).color('rgb(47, 233, 87)').origin('center');
var purple = Crafty.e('Purple, 2D, DOM, Collision, Color, Mouse, Draggable').setName('Purple').
  attr({w: 100, h: 100}).color('rgb(147, 33, 187)').origin('center');

trapezoid.attr({x: 300, y: 150});
yellow.attr({x: 50, y: 50});
parallelogram.attr({x: 350, y: 350});
green.attr({x: 100, y: 500});
purple.attr({x: 500, y: 500});

[trapezoid, yellow, parallelogram, green, purple].forEach(function(e) {
  e.bind("HitOn", function(hitInfo) {
    console.log("HitOn for " + e._entityName + " - " + hitInfoToText(hitInfo));
  });

  e.bind("HitOff", function(otherComponent) {
    console.log("HitOff for " + e._entityName + " - stopped colliding with " + otherComponent);
  });
});

var hitInfoToText = function(hitInfo) {
  // Assume a single member in hitInfo
  var result = "collided with " + hitInfo[0].obj._entityName + " (" + hitInfo[0].type;
  if (hitInfo[0].type === "SAT") {
    result += ", " + hitInfo[0].overlap;
  }

  result += ")";

  return result;
};

var setHitEvents = function(on, entity, hitComponent) {
  if (on === true) {
    entity.checkHits(hitComponent);
  }
  else {
    entity.ignoreHits(hitComponent);
  }
};
