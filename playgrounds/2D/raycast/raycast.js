Crafty.init(640, 640);
Crafty.background('white');


var startPos = {};
Crafty.e('Background, 2D, DOM, MouseDrag, DebugPolygon')
      .setName('Background')
      .attr({w: 640, h: 640})
      .debugStroke('red')
      .bind('StartDrag', function(e) {
        this.debugPolygon(undefined);
        startPos = {x: e.realX, y: e.realY};
      })
      .bind('Dragging', function(e) {
        this.debugPolygon({points: [startPos.x, startPos.y, e.realX, e.realY]});
      })
      .bind('StopDrag', function(e) {
        raycast(startPos, {x: e.realX, y: e.realY});
      });

for (var i = 0; i < 10; ++i)
  for (var j = 0; j < 10; ++j)
    Crafty.e('Cell, 2D, DOM, Color')
          .setName('Cell['+i+']['+j+']')
          .attr({ x: i * 64, y: j * 64, w: 64, h: 64, z: -1})
          .color((i + j) % 2 ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 0, 255, 0.1)");

Crafty.c("MouseMovable", {
  required: "Mouse, Draggable",

  events: {
    "KeyDown": function(e) {
      if (e.key === Crafty.keys.SHIFT) {
        this.disableDrag();
        this.uniqueBind("Dragging", this._dragMouseDrag);
        this.uniqueBind("StopDrag", this._stopMouseDrag);
      }
    },
    "KeyUp": function(e) {
      if (e.key === Crafty.keys.SHIFT) {
        this.enableDrag();
        this.unbind("Dragging", this._dragMouseDrag);
        this.unbind("StopDrag", this._stopMouseDrag);
      }
    }
  },

  _stopMouseDrag: function() {
    delete this._lastMousePos;
  },
  _dragMouseDrag: function(e) {
    if (this._lastMousePos) {
      var d = new Crafty.math.Vector2D(
        e.realX - this._lastMousePos.x,
        e.realY - this._lastMousePos.y
      );

      this.rotation += d.dotProduct({x: 0, y: 1});
    }
    this._lastMousePos = {x: e.realX, y: e.realY};
  }
});

var trapezoid = Crafty.e('Trapezoid, 2D, DOM, Color, Collision, SolidHitBox, MouseMovable')
      .setName('Trapezoid')
      .attr({w: 200, h: 100})
      .origin('center')
      .collision(new Crafty.polygon([50, 0, 0, 100, 200, 100, 150, 0]))
      .color("rgba(0, 127, 127, 0.25)");

var yellow = Crafty.e('Yellow, 2D, DOM, Collision, SolidHitBox, MouseMovable')
      .setName('Yellow')
      .attr({w: 100, h: 100})
      .origin('center')
      .collision(new Crafty.polygon([0, 0, 0, 100, 100, 100, 100, 0]));

var parallelogram = Crafty.e('Parallelogram, 2D, DOM, Color, Collision, SolidHitBox, MouseMovable')
      .setName('Parallelogram')
      .attr({w: 100, h: 100})
      .origin('center')
      .collision(new Crafty.polygon([0, 0, 25, 100, 100, 100, 75, 0]))
      .color("rgba(0, 127, 127, 0.25)");

var triangle = Crafty.e('Triangle, 2D, DOM, Color, Collision, SolidHitBox, MouseMovable')
      .setName('Triangle')
      .attr({w: 300, h: 100})
      .origin('center')
      .collision(new Crafty.polygon([25, 75, 250, 25, 275, 50]))
      .color("rgba(0, 127, 127, 0.25)");

var cbr = Crafty.e('CBR, 2D, DOM, Color, Collision, SolidHitBox, MouseMovable')
      .setName('CBR')
      .attr({w: 100, h: 100})
      .origin('center')
      .collision(new Crafty.polygon([75, -25, 125, -25, 125, 25, 75, 25]))
      .color("rgba(0, 127, 127, 0.25)");

var green = Crafty.e('Green, 2D, DOM, Collision, Color, MouseMovable')
      .setName('Green')
      .attr({w: 100, h: 100})
      .origin('center')
      .color('rgb(47, 233, 87)');

var purple = Crafty.e('Purple, 2D, DOM, Collision, Color, MouseMovable')
      .setName('Purple')
      .attr({w: 100, h: 100})
      .origin('center')
      .color('rgb(147, 33, 187)');

trapezoid.attr({x: 400, y: 150});
yellow.attr({x: 50, y: 50});
parallelogram.attr({x: 350, y: 350});
green.attr({x: 100, y: 500});
purple.attr({x: 500, y: 500});
triangle.attr({x: 25, y: 222});
cbr.attr({x: 256, y: 64});


function raycast(start, end) {
  Crafty("FirstHit").destroy();
  Crafty("Hit").destroy();

  var origin = {_x: start.x, _y: start.y},
      direction = new Crafty.math.Vector2D(end.x - start.x, end.y - start.y),
      magnitude = direction.magnitude(),
      results;
  direction.normalize();

  if (magnitude < 5) return;
  Crafty.log('Raycast',
    'origin=[', origin._x.toFixed(2), origin._y.toFixed(2), ']',
    'direction=[', direction.x.toFixed(2), direction.y.toFixed(2), ']',
    'magnitude=', magnitude.toFixed(2));

  // find first ray hit
  results = Crafty.raycast(origin, direction, -Infinity);
  if (results.length > 0) {
    Crafty.log('FirstHit',
      'name=', results[0].obj.getName(),
      'distance=', results[0].distance.toFixed(2),
      '@[', results[0].x.toFixed(2), results[0].y.toFixed(2), ']');

    Crafty.e("FirstHit, 2D, DOM, DebugPolygon")
          .setName("FirstHit")
          .debugStroke('red')
          .debugPolygon(results[0].obj.map);
  }

  // find all ray hits up to line length
  results = Crafty.raycast(origin, direction, magnitude);
  for (var i=0; i < results.length; ++i) {
    Crafty.log('Hit'+i,
      'name=', results[i].obj.getName(),
      'distance=', results[i].distance.toFixed(2),
      '@[', results[i].x.toFixed(2), results[i].y.toFixed(2), ']');

    Crafty.e("Hit, 2D, DOM, VisibleMBR")
          .setName("Hit"+i)
          .attr({
            x: results[i].x - 2, w: 4,
            y: results[i].y - 2, h: 4
          });
  }
  Crafty.log('');
}
