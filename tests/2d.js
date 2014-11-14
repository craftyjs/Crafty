(function() {
  module("2D");

  test("position", function() {
    var player = Crafty.e("2D, DOM, Color").attr({
      w: 50,
      h: 50
    }).color("red");
    player.x += 50;
    strictEqual(player._x, 50, "X moved");

    player.y += 50;
    strictEqual(player._y, 50, "Y moved");

    player.w += 50;
    strictEqual(player._w, 100, "Width increase");

    player.h += 50;
    strictEqual(player._h, 100, "Height increase");

    strictEqual(player._globalZ, player[0], "Global Z, Before");

    player.z = 1;
    strictEqual(player._z, 1, "Z index");

    var global_z_guess;
    if (player[0] < 10) {
      global_z_guess = parseInt('10000' + player[0], 10);
    } else {
      global_z_guess = parseInt('1000' + player[0], 10);
    }
    strictEqual(player._globalZ, global_z_guess, "Global Z, After");

  });

  test("intersect", function() {
    var player = Crafty.e("2D, DOM, Color").attr({
      w: 50,
      h: 50
    }).color("red");
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    strictEqual(player.intersect(0, 0, 100, 50), true, "Intersected");

    strictEqual(player.intersect({
      x: 0,
      y: 0,
      w: 100,
      h: 50
    }), true, "Intersected Again");

    strictEqual(player.intersect(100, 100, 100, 50), false, "Didn't intersect");

  });

  test("within", function() {
    var player = Crafty.e("2D, DOM, Color").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    strictEqual(player.within(0, 0, 50, 50), true, "Within");

    strictEqual(player.within(-1, -1, 51, 51), true, "Within");


    strictEqual(player.within({
      _x: 0,
      _y: 0,
      _w: 50,
      _h: 50
    }), true, "Within Again");

    strictEqual(player.within(0, 0, 40, 50), false, "Wasn't within");

    player.rotation = 90; // Once rotated, the entity should no longer be within the rectangle

    strictEqual(player.within(0, 0, 50, 50), false, "Rotated, Not within");
    strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, within rotated area");

  });

  test("contains", function() {
    var player = Crafty.e("2D, DOM, Color").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;


    strictEqual(player.contains(0, 0, 50, 50), true, "Contains");

    strictEqual(player.contains(1, 1, 49, 49), true, "Contains");

    strictEqual(player.contains({
      _x: 0,
      _y: 0,
      _w: 50,
      _h: 50
    }), true, "Contains");

    strictEqual(player.contains(1, 1, 51, 51), false, "Doesn't contain");

    player.rotation = 90;

    strictEqual(player.contains(0, 0, 50, 50), false, "Rotated, no longer contains");
    strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, contains rotated area");

  });



  test("circle", function() {
    var player = Crafty.e("2D, DOM, Color").attr({
      w: 50,
      h: 50
    }).color("red");
    var circle = new Crafty.circle(0, 0, 10);

    strictEqual(circle.containsPoint(1, 2), true, "Contained the point");
    strictEqual(circle.containsPoint(8, 9), false, "Didn't contain the point");

    circle.shift(1, 0);

    strictEqual(circle.x, 1, "Shifted of one pixel on the x axis");
    strictEqual(circle.y, 0, "circle.y didn't change");
    strictEqual(circle.radius, 10, "circle.radius didn't change");

  });

  test("child", function() {
    var parent0 = Crafty.e("2D, DOM, Color").attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50
    }).color("red");
    var child0 = Crafty.e("2D, DOM, Color").attr({
      x: 1,
      y: 1,
      w: 50,
      h: 50
    }).color("red");
    var child1 = Crafty.e("2D, DOM, Color").attr({
      x: 2,
      y: 2,
      w: 50,
      h: 50
    }).color("red");
    var child2 = Crafty.e("2D, DOM, Color").attr({
      x: 3,
      y: 3,
      w: 50,
      h: 50
    }).color("red");
    var child3 = Crafty.e("2D, DOM, Color").attr({
      x: 4,
      y: 4,
      w: 50,
      h: 50
    }).color("red");
    var child0_ID = child0[0];
    var child1_ID = child1[0];
    var child2_ID = child2[0];
    var child3_ID = child3[0];
    parent0.attach(child0);
    parent0.attach(child1);
    parent0.attach(child2);
    parent0.attach(child3);
    parent0.x += 50;
    strictEqual(child0._x, 51, 'child0 shifted when parent did');
    strictEqual(child1._x, 52, 'child1 shifted when parent did');
    child0.x += 1;
    child1.x += 1;
    strictEqual(parent0._x, 50, 'child shifts do not move the parent');
    child1.destroy();
    deepEqual(parent0._children, [child0, child2, child3], 'child1 cleared itself from parent0._children when destroyed');
    parent0.destroy();
    strictEqual(Crafty(child0_ID).length, 0, 'destruction of parent killed child0');
    strictEqual(Crafty(child2_ID).length, 0, 'destruction of parent killed child2');
    strictEqual(Crafty(child3_ID).length, 0, 'destruction of parent killed child3');

  });

  test("child_rotate", function() {
    var parent = Crafty.e("2D, DOM, Color")
      .attr({
        x: 0,
        y: 0,
        w: 50,
        h: 50,
        rotation: 10
      })
      .color("red");
    var child = Crafty.e("2D, DOM, Color")
      .attr({
        x: 10,
        y: 10,
        w: 50,
        h: 50,
        rotation: 15
      })
      .color("red");
    parent.attach(child);

    parent.rotation += 20;
    strictEqual(parent.rotation, 30, 'parent rotates normally');
    strictEqual(child.rotation, 35, 'child follows parent rotation');

    child.rotation += 22;
    strictEqual(parent.rotation, 30, 'parent ignores child rotation');
    strictEqual(child.rotation, 57, 'child rotates normally');

    parent.rotation = 100; // Rotation by 90 degrees from initial position
    strictEqual(Round(child.x), -10, "Child moved around parent upon rotation (x).");
    strictEqual(Round(child.y), 10, "Child moved around parent upon rotation (y).");
  });

  test("child rotate 90deg", function () {
    var parent = Crafty.e("2D")
      .attr({
        x: 0,
        y: 0,
        w: 50,
        h: 50
      });
    var child = Crafty.e("2D")
      .attr({
        x: 0,
        y: 0,
        w: 50,
        h: 50
      });

    parent.origin("center");
    child.origin("center");

    parent.attach(child);

    parent.rotation = 90;
    strictEqual(parent._rotation, 90, "parent rotates 90deg");
    strictEqual(child._rotation, 90, "child also rotates 90deg");
  });



  // This test assumes that the "circles" are really octagons, as per Crafty.circle.
  test("SAT overlap with circles", function() {
    var e = Crafty.e("2D, Collision");
    var c1 = new Crafty.circle(100, 100, 10);
    var c2 = new Crafty.circle(100, 105, 10);
    strictEqual((e._SAT(c1, c2).overlap < -13.8 && e._SAT(c1, c2).overlap > -13.9), true, "Expected overlap to be about -13.86 ( or 15 cos[pi/8])");

  });

  // Testcase from issue #828 by VHonzik
  test("SAT overlap with rectangles", function() {
    var e = Crafty.e("2D, Collision");
    var c1 = new Crafty.polygon([[0,1], [50, 1], [50, 51], [0, 51]]);
    var c2 = new Crafty.polygon([[-10, -10], [-10, 10], [10, 10], [10, -10]]);
    strictEqual(e._SAT(c1, c2) !== false, true, "Polygons should test as overlapping");

  });


  test("adjustable boundary", function() {
    e = Crafty.e("2D").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 10
    });

    // Four argument version
    e.offsetBoundary(10, 1, 3, 0);
    equal(e._bx1, 10, "X1 boundary set");
    equal(e._bx2, 3, "X2 boundary set");
    equal(e._by1, 1, "Y1 boundary set");
    equal(e._by2, 0, "Y2 boundary set");

    e._calculateMBR(10, 10, 0);

    var mbr = e._mbr;

    equal(mbr._h, 11, "MBR height uses boundaries (11)");
    equal(mbr._w, 23, "MBR width uses boundaries (23)");

    // One argument version
    e.offsetBoundary(5);
    equal(e._bx1, 5, "X1 boundary set");
    equal(e._bx2, 5, "X2 boundary set");
    equal(e._by1, 5, "Y1 boundary set");
    equal(e._by2, 5, "Y2 boundary set");

  });


  test("disableControl and enableControl", function() {
    var e = Crafty.e("2D, Twoway")
      .attr({
        x: 0
      })
      .twoway(1);

    equal(e._movement.x, 0);
    equal(e._x, 0);
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 1);
    equal(e._x, 1);

    e.disableControl();
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 1);
    equal(e._x, 1);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 0);
    equal(e._x, 1);

    e.enableControl();
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 0);
    equal(e._x, 1);

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 1);
    equal(e._x, 2);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    Crafty.trigger('EnterFrame');
    equal(e._movement.x, 0);
    equal(e._x, 2);

    e.destroy();
  });


  test("Resizing 2D objects & hitboxes", function() {
    var e = Crafty.e("2D, Collision");
    e.attr({
      x: 0,
      y: 0,
      w: 40,
      h: 50
    });

    equal(e.map.points[0][0], 0, "Before rotation: x_0 is 0");
    equal(e.map.points[0][1], 0, "y_0 is 0");
    equal(e.map.points[2][0], 40, "x_2 is 40");
    equal(e.map.points[2][1], 50, "y_2 is 50");

    e.rotation = 90;

    equal(Math.round(e.map.points[0][0]), 0, "After rotation by 90 deg: x_0 is 0");
    equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[2][1]), 40, "y_2 is 40");

    // After rotation the MBR will have changed
    equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    equal(Math.round(e._mbr._h), 40, "_mbr._h is  40");
    equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.collision(); // Check that regenerating the hitbox while rotated works correctly

    equal(Math.round(e.map.points[0][0]), 0, "After rotation and hitbox regeneration: x_0 is 0");
    equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[2][1]), 40, "y_2 is 40");


    // Check that changing the width when rotated resizes correctly for both hitbox and MBR
    // Rotated by 90 degrees, changing the width of the entity should change the height of the hitbox/mbr
    e.w = 100;

    equal(Math.round(e.map.points[0][0]), 0, "After rotation and increase in width: x_0 is 0");
    equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[2][1]), 100, "y_2 is 100");

    // After rotation the MBR will have changed
    equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    equal(Math.round(e._mbr._h), 100, "_mbr._h is  100");
    equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.destroy();
  });

  test("Hitboxes outside of entities (CBR)", function() {
    var poly = new Crafty.polygon([
      [-8, 6],
      [0, -8],
      [8, -14],
      [16, -8],
      [24, 6]
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 16,
      h: 16
    }).collision(poly);

    ok(e._cbr !== null, "_cbr exists");
    var cbr = e._cbr;
    // Test whether cbr actually bounds hitbox+object
    ok(cbr._x <= 42, "cbr x position correct");
    ok(cbr._y <= 36, "cbr y position correct");
    ok(cbr._x + cbr._w >= 74, "cbr width correct");
    ok(cbr._y + cbr._h >= 66, "cbr height correct");

    var x0 = cbr._x,
      y0 = cbr._y;

    e.x += 10;
    e.y += 15;

    equal(cbr._x, x0 + 10, "cbr x position moves correctly");
    equal(cbr._y, y0 + 15, "cbr y position moves correctly");

  });

  test("CBRs on resize", function() {
    var poly = new Crafty.polygon([
      [0, 0],
      [0, 12],
      [12, 12],
      [12, 0]
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 15,
      h: 15
    }).collision(poly);

    ok(e._cbr === null, "_cbr should not exist");

    e.w = 10;

    ok(e._cbr !== null, "_cbr should now exist after entity shrinks");

    e.w = 20;

    ok(e._cbr === null, "_cbr should not exist after entity grows again");

  });

  test("CBRs should be removed on removal of component", function() {
    var poly = new Crafty.polygon([
      [0, 0],
      [0, 12],
      [12, 12],
      [12, 0]
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 10,
      h: 10
    }).collision(poly);

    ok(e._cbr !== null, "_cbr should exist to begin with");

    e.removeComponent("Collision");

    ok(e._cbr === null, "_cbr should now be removed along with Collision");

  });
})();
