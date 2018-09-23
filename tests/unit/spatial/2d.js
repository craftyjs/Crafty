(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("2D");

  test("position", function(_) {
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    player.x += 50;
    _.strictEqual(player._x, 50, "X moved");

    player.y += 50;
    _.strictEqual(player._y, 50, "Y moved");

    player.w += 50;
    _.strictEqual(player._w, 100, "Width increase");

    player.h += 50;
    _.strictEqual(player._h, 100, "Height increase");

    _.strictEqual(player._globalZ, player[0], "Global Z, Before");

    player.z = 1;
    _.strictEqual(player._z, 1, "Z index");

    _.strictEqual(
      player._globalZ,
      player._z * 1e5 + player[0],
      "Global Z, After"
    );

    // test global order of entities depending on which was created last
    var player2 = Crafty.e("2D");
    var player3 = Crafty.e("2D");
    _.ok(
      player3._globalZ > player2._globalZ,
      "player3 should be in front of player2"
    );

    // test global order of entities on same z level, depending on which was created last
    player2.z = 1;
    _.ok(
      player2._globalZ > player._globalZ,
      "player2 should be in front of player1"
    );

    // test global order of entities on different z level
    player3.z = -1;
    _.ok(
      player2._globalZ > player3._globalZ,
      "player2 should be in front of player3"
    );
  });

  test("intersect", function(_) {
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    _.strictEqual(player.intersect(0, 0, 100, 50), true, "Intersected");

    _.strictEqual(
      player.intersect({
        _x: 0,
        _y: 0,
        _w: 100,
        _h: 50
      }),
      true,
      "Intersected Again"
    );

    _.strictEqual(
      player.intersect(100, 100, 100, 50),
      false,
      "Didn't intersect"
    );
  });

  test("within", function(_) {
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    _.strictEqual(player.within(0, 0, 50, 50), true, "Within");

    _.strictEqual(player.within(-1, -1, 51, 51), true, "Within");

    _.strictEqual(
      player.within({
        _x: 0,
        _y: 0,
        _w: 50,
        _h: 50
      }),
      true,
      "Within Again"
    );

    _.strictEqual(player.within(0, 0, 40, 50), false, "Wasn't within");

    player.rotation = 90; // Once rotated, the entity should no longer be within the rectangle

    _.strictEqual(player.within(0, 0, 50, 50), false, "Rotated, Not within");
    _.strictEqual(
      player.within(-50, 0, 50, 50),
      true,
      "Rotated, within rotated area"
    );
  });

  test("contains", function(_) {
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    _.strictEqual(player.contains(0, 0, 50, 50), true, "Contains");

    _.strictEqual(player.contains(1, 1, 49, 49), true, "Contains");

    _.strictEqual(
      player.contains({
        _x: 0,
        _y: 0,
        _w: 50,
        _h: 50
      }),
      true,
      "Contains"
    );

    _.strictEqual(player.contains(1, 1, 51, 51), false, "Doesn't contain");

    player.rotation = 90;

    _.strictEqual(
      player.contains(0, 0, 50, 50),
      false,
      "Rotated, no longer contains"
    );
    _.strictEqual(
      player.within(-50, 0, 50, 50),
      true,
      "Rotated, contains rotated area"
    );
  });

  test("pos", function(_) {
    var player = Crafty.e("2D").attr({
      x: 0,
      y: 50,
      w: 100,
      h: 150
    });

    var posObject = {};

    player.pos(posObject);

    _.strictEqual(player.pos()._x, 0, "X value");
    _.strictEqual(posObject._x, 0, "X value");

    _.strictEqual(player.pos()._y, 50, "Y value");
    _.strictEqual(posObject._y, 50, "Y value");

    _.strictEqual(player.pos()._w, 100, "W value");
    _.strictEqual(posObject._w, 100, "W value");

    _.strictEqual(player.pos()._h, 150, "H value");
    _.strictEqual(posObject._h, 150, "H value");
  });

  test("mbr", function(_) {
    var player = Crafty.e("2D").attr({
      x: 0,
      y: 50,
      w: 100,
      h: 150
    });

    var mbrObject = {};

    player.mbr(mbrObject);

    _.strictEqual(player.mbr()._x, 0, "X value");
    _.strictEqual(mbrObject._x, 0, "X value");

    _.strictEqual(player.mbr()._y, 50, "Y value");
    _.strictEqual(mbrObject._y, 50, "Y value");

    _.strictEqual(player.mbr()._w, 100, "W value");
    _.strictEqual(mbrObject._w, 100, "W value");

    _.strictEqual(player.mbr()._h, 150, "H value");
    _.strictEqual(mbrObject._h, 150, "H value");
  });

  test("circle", function(_) {
    Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    var circle = new Crafty.circle(0, 0, 10);

    _.strictEqual(circle.containsPoint(1, 2), true, "Contained the point");
    _.strictEqual(
      circle.containsPoint(8, 9),
      false,
      "Didn't contain the point"
    );

    circle.shift(1, 0);

    _.strictEqual(circle.x, 1, "Shifted of one pixel on the x axis");
    _.strictEqual(circle.y, 0, "circle.y didn't change");
    _.strictEqual(circle.radius, 10, "circle.radius didn't change");
  });

  test("child", function(_) {
    var parent0 = Crafty.e("2D").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50
    });
    var child0 = Crafty.e("2D").attr({
      x: 1,
      y: 1,
      w: 50,
      h: 50
    });
    var child1 = Crafty.e("2D").attr({
      x: 2,
      y: 2,
      w: 50,
      h: 50
    });
    var child2 = Crafty.e("2D").attr({
      x: 3,
      y: 3,
      w: 50,
      h: 50
    });
    var child3 = Crafty.e("2D").attr({
      x: 4,
      y: 4,
      w: 50,
      h: 50
    });
    parent0.attach(child0);
    parent0.attach(child1);
    parent0.attach(child2);
    parent0.attach(child3);
    parent0.x += 50;
    _.strictEqual(child0._x, 51, "child0 shifted when parent did");
    _.strictEqual(child1._x, 52, "child1 shifted when parent did");
    child0.x += 1;
    child1.x += 1;
    _.strictEqual(parent0._x, 50, "child shifts do not move the parent");
    child1.destroy();
    _.deepEqual(
      parent0._children,
      [child0, child2, child3],
      "child1 cleared itself from parent0._children when destroyed"
    );
    parent0.destroy();
    _.strictEqual(
      Crafty(child0[0]).length,
      0,
      "destruction of parent killed child0"
    );
    _.strictEqual(
      Crafty(child2[0]).length,
      0,
      "destruction of parent killed child2"
    );
    _.strictEqual(
      Crafty(child3[0]).length,
      0,
      "destruction of parent killed child3"
    );
  });

  test("child_rotate", function(_) {
    var parent = Crafty.e("2D").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50,
      rotation: 10
    });
    var child = Crafty.e("2D").attr({
      x: 10,
      y: 10,
      w: 50,
      h: 50,
      rotation: 15
    });
    parent.attach(child);

    parent.rotation += 20;
    _.strictEqual(parent.rotation, 30, "parent rotates normally");
    _.strictEqual(child.rotation, 35, "child follows parent rotation");

    child.rotation += 22;
    _.strictEqual(parent.rotation, 30, "parent ignores child rotation");
    _.strictEqual(child.rotation, 57, "child rotates normally");

    parent.rotation = 100; // Rotation by 90 degrees from initial position
    _.strictEqual(
      Round(child.x),
      -10,
      "Child moved around parent upon rotation (x)."
    );
    _.strictEqual(
      Round(child.y),
      10,
      "Child moved around parent upon rotation (y)."
    );
  });

  test("child rotate 90deg", function(_) {
    var parent = Crafty.e("2D").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50
    });
    var child = Crafty.e("2D").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50
    });

    parent.origin("center");
    child.origin("center");

    parent.attach(child);

    parent.rotation = 90;
    _.strictEqual(parent._rotation, 90, "parent rotates 90deg");
    _.strictEqual(child._rotation, 90, "child also rotates 90deg");
  });

  test("origin properties", function(_) {
    var player = Crafty.e("2D, Centered").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50
    });
    player.origin(10, 10);

    player.ox = 20;
    _.strictEqual(player.x, 10, "X set such that origin is at ox");
    _.strictEqual(player.ox, 20, "OX set to 20");

    player.oy = 30;
    _.strictEqual(player.y, 20, "Y set such that origin is at oy");
    _.strictEqual(player.oy, 30, "OY set to 20");
  });

  module("Geometric");

  var EAST = new Crafty.math.Vector2D(1, 0).normalize();
  var SOUTH_EAST = new Crafty.math.Vector2D(1, 1).normalize();
  var NORTH_EAST = new Crafty.math.Vector2D(1, -1).normalize();
  var NORTH_WEST = new Crafty.math.Vector2D(-1, -1).normalize();

  test("Polygon intersection", function(_) {
    var poly, distance, origin, direction;

    poly = new Crafty.polygon([0, 0, 50, 0, 50, 50, 0, 50]);

    // intersection with ray slightly outside entity edge
    origin = { _x: -1, _y: 25 };
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 1, "ray intersects polygon on its left edge");

    // intersection with ray origin at entity edge
    origin = { _x: 0, _y: 0 };
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon on its left edge");

    // intersection with ray origin inside entity
    origin = { _x: 25, _y: 25 };
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 25, "ray intersects polygon on its right edge");

    // intersection with ray origin at entity edge
    origin = { _x: 50, _y: 25 };
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon on its right edge");

    // no intersection with ray going away
    origin = { _x: 51, _y: 25 };
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");

    poly = new Crafty.polygon([-75, -75, -150, -150]);

    // intersection with ray at crossing
    origin = { _x: -150, _y: -75 };
    direction = NORTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance.toFixed(4),
      (37.5 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at the crossing"
    );

    // no intersection with parallel ray
    origin = { _x: -76, _y: -75 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");

    // intersection with colinear ray starting before polygon
    origin = { _x: -25, _y: -25 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance.toFixed(4),
      (50 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at polygon's start point"
    );

    // intersection with colinear ray starting at polygon start
    origin = { _x: -75, _y: -75 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance,
      0,
      "ray intersects polygon at polygon's start point"
    );

    // intersection with colinear ray starting inside polygon
    origin = { _x: -100, _y: -100 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance.toFixed(4),
      (50 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at ray's origin"
    );

    // intersection with colinear ray starting at polygon end
    origin = { _x: -150, _y: -150 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's end point");

    // no intersection with colinear ray starting outside polygon
    origin = { _x: -151, _y: -151 };
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");

    // intersection with colinear ray starting at polygon end, going opposite direction
    origin = { _x: -150, _y: -150 };
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's end point");

    // intersection with colinear ray starting inside polygon, going opposite direction
    origin = { _x: -100, _y: -100 };
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance.toFixed(4),
      (25 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at ray's origin"
    );

    // intersection with colinear ray starting at polygon start, going opposite direction
    origin = { _x: -75, _y: -75 };
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(
      distance,
      0,
      "ray intersects polygon at polygon's start point"
    );

    // no intersection with colinear ray going opposite direction
    origin = { _x: -74, _y: -74 };
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");
  });
})();
