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

    var global_z_guess;
    if (player[0] < 10) {
      global_z_guess = parseInt('10000' + player[0], 10);
    } else {
      global_z_guess = parseInt('1000' + player[0], 10);
    }
    _.strictEqual(player._globalZ, global_z_guess, "Global Z, After");

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

    _.strictEqual(player.intersect({
      _x: 0,
      _y: 0,
      _w: 100,
      _h: 50
    }), true, "Intersected Again");

    _.strictEqual(player.intersect(100, 100, 100, 50), false, "Didn't intersect");

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


    _.strictEqual(player.within({
      _x: 0,
      _y: 0,
      _w: 50,
      _h: 50
    }), true, "Within Again");

    _.strictEqual(player.within(0, 0, 40, 50), false, "Wasn't within");

    player.rotation = 90; // Once rotated, the entity should no longer be within the rectangle

    _.strictEqual(player.within(0, 0, 50, 50), false, "Rotated, Not within");
    _.strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, within rotated area");

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

    _.strictEqual(player.contains({
      _x: 0,
      _y: 0,
      _w: 50,
      _h: 50
    }), true, "Contains");

    _.strictEqual(player.contains(1, 1, 51, 51), false, "Doesn't contain");

    player.rotation = 90;

    _.strictEqual(player.contains(0, 0, 50, 50), false, "Rotated, no longer contains");
    _.strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, contains rotated area");

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
    _.strictEqual(circle.containsPoint(8, 9), false, "Didn't contain the point");

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
    _.strictEqual(child0._x, 51, 'child0 shifted when parent did');
    _.strictEqual(child1._x, 52, 'child1 shifted when parent did');
    child0.x += 1;
    child1.x += 1;
    _.strictEqual(parent0._x, 50, 'child shifts do not move the parent');
    child1.destroy();
    _.deepEqual(parent0._children, [child0, child2, child3], 'child1 cleared itself from parent0._children when destroyed');
    parent0.destroy();
    _.strictEqual(Crafty(child0[0]).length, 0, 'destruction of parent killed child0');
    _.strictEqual(Crafty(child2[0]).length, 0, 'destruction of parent killed child2');
    _.strictEqual(Crafty(child3[0]).length, 0, 'destruction of parent killed child3');

  });

  test("child_rotate", function(_) {
    var parent = Crafty.e("2D")
      .attr({
        x: 0,
        y: 0,
        w: 50,
        h: 50,
        rotation: 10
      });
    var child = Crafty.e("2D")
      .attr({
        x: 10,
        y: 10,
        w: 50,
        h: 50,
        rotation: 15
      });
    parent.attach(child);

    parent.rotation += 20;
    _.strictEqual(parent.rotation, 30, 'parent rotates normally');
    _.strictEqual(child.rotation, 35, 'child follows parent rotation');

    child.rotation += 22;
    _.strictEqual(parent.rotation, 30, 'parent ignores child rotation');
    _.strictEqual(child.rotation, 57, 'child rotates normally');

    parent.rotation = 100; // Rotation by 90 degrees from initial position
    _.strictEqual(Round(child.x), -10, "Child moved around parent upon rotation (x).");
    _.strictEqual(Round(child.y), 10, "Child moved around parent upon rotation (y).");
  });

  test("child rotate 90deg", function (_) {
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
    _.strictEqual(parent._rotation, 90, "parent rotates 90deg");
    _.strictEqual(child._rotation, 90, "child also rotates 90deg");
  });


  module("Collision");

  test("Collision constructors", function(_) {
    var newHitboxEvents = 0;
    var e = Crafty.e("2D, Collision")
              .bind("NewHitbox", function(newHitbox) {
                newHitboxEvents++;
              });

    var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
    e.collision(poly);
    _.ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(e.map !== poly, "Hitbox is a clone of passed polygon");

    var arr = [50, 0, 100, 100, 0, 100];
    e.collision(arr);
    _.ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(e.map.points && e.map.points !== arr, "Array used in hitbox is a clone of passed array");

    e.collision(50, 0, 100, 100, 0, 100);
    _.ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");

    _.strictEqual(newHitboxEvents, 3, "NewHitBox event triggered 3 times");
  });

  test("hit", function(_) {
    var e = Crafty.e("2D, Collision, solid")
                  .attr({x: 0, y: 0, w: 25, h: 25});
    var f = Crafty.e("2D, Collision, solid")
                  .attr({x: 255, y: 255, w: 25, h: 25});
    var g = Crafty.e("2D, Collision, solid")
                  .attr({x: 255, y: 255, w: 25, h: 25});
    var h = Crafty.e("2D, Collision, plasma")
                  .attr({x: 255, y: 255, w: 25, h: 25});

    var results;

    // check entity itself is not reported
    results = e.hit('solid');
    _.strictEqual(results, null, "empty collision results");

    // check no reported hits given no intersections
    results = e.hit('obj');
    _.strictEqual(results, null, "empty collision results");

    // check for hits given any-entity intersections
    h.x = h.y = 0;
    results = e.hit('obj');
    _.strictEqual(results.length, 1, "exactly one collision result");
    _.strictEqual(results[0].obj, h, "expected collision with entity h");

    // check no reported hits with solid component
    results = e.hit('solid');
    _.strictEqual(results, null, "empty collision results");

    // check for hits with solid entity
    f.x = f.y = 0;
    results = e.hit('solid');
    _.strictEqual(results.length, 1, "exactly one collision result");
    _.strictEqual(results[0].obj, f, "expected collision with entity f");

    // check for hits with solid entities
    g.x = g.y = 0;
    results = e.hit('solid');
    _.strictEqual(results.length, 2, "exactly two collision results");
    var counter = 0;
    for (var i = 0; i < 2; ++i) {
      if (results[i].obj === f) counter++;
      else if (results[i].obj === g) counter++;
    }
    _.strictEqual(counter, 2, "expected collisions with entity f and g");

    // check no reported hits with solid component
    f.x = f.y = g.x = g.y = 255;
    results = e.hit('solid');
    _.strictEqual(results, null, "empty collision results");
  });

  test("hit - collision type", function(_) {
    var e = Crafty.e("2D, Collision, solid")
                  .attr({x: 0, y: 0, w: 25, h: 25});
    var f = Crafty.e("2D, solid")
                  .attr({x: 0, y: 0, w: 25, h: 25});

    var results;

    // check for MBR type collision with other entity
    results = e.hit('solid');
    _.strictEqual(results.length, 1, "exactly one collision result");
    _.strictEqual(results[0].obj, f, "expected collision with entity f");
    _.strictEqual(results[0].type, 'MBR', "expected collision type");

    // check for SAT type collision with other entity
    f.addComponent('Collision');
    results = e.hit('solid');
    _.strictEqual(results.length, 1, "exactly one collision result");
    _.strictEqual(results[0].obj, f, "expected collision with entity f");
    _.strictEqual(results[0].type, 'SAT', "expected collision type");
    _.ok('overlap' in results[0], "expected overlap value");
  });

  test("onHit", function(_) {
    var e = Crafty.e("2D, Collision")
                  .attr({x: 0, y: 0, w: 25, h: 25});
    var f = Crafty.e("2D, Collision")
                  .attr({x: 255, y: 255, w: 25, h: 25});
    var g = Crafty.e("2D, Collision, solid")
                  .attr({x: 255, y: 255, w: 25, h: 25});

    var expectedHitDatas = {},
        onCallbacks = 0,
        firstOnCallbacks = 0,
        offCallbacks = 0;

    e.onHit('solid', function(hitDatas, isFirstCallback) { // callbackOn
      onCallbacks++;
      if (isFirstCallback) firstOnCallbacks++;

      _.strictEqual(hitDatas.length, Object.keys(expectedHitDatas).length, "collision with exactly expected amount of entities");
      for (var i = 0; i < hitDatas.length; ++i)
        _.ok(hitDatas[i].obj[0] in expectedHitDatas, "collision with expected entity occurred");

    }, function() { // callbackOff
      offCallbacks++;
    });

    // check initial state
    // default state with no intersections, before update frame
    _.strictEqual(onCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(firstOnCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(offCallbacks, 0, "no collision callbacks yet before update frame");

    // check initial state
    // default state with no intersections, after update frame
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 0, "no collision callbacks if no intersection");
    _.strictEqual(firstOnCallbacks, 0, "no collision callbacks if no intersection");
    _.strictEqual(offCallbacks, 0, "no collision callbacks if no intersection");

    // check no callbacks
    // intersection with f, but without required component
    f.x = f.y = 0;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(firstOnCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(offCallbacks, 0, "no collision callbacks yet before update frame");

    // check no callbacks done before frame update
    // intersection with f, with required component, before update frame
    f.addComponent('solid');

    _.strictEqual(onCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(firstOnCallbacks, 0, "no collision callbacks yet before update frame");
    _.strictEqual(offCallbacks, 0, "no collision callbacks yet before update frame");

    // check callbacks done after frame update
    // intersection with f, with required component, after update frame
    expectedHitDatas = {};
    expectedHitDatas[f[0]] = true;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 1, "one collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 1, "first collision callbackOn occurred");
    _.strictEqual(offCallbacks, 0, "no collision callbackOff occurred yet");

    // check that first callbackOn no longer triggered
    // another frame while intersected with f
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 2, "another collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 1, "not another first collision callbackOn occurred");
    _.strictEqual(offCallbacks, 0, "no collision callbackOff occurred yet");

    // check no callbacks before frame update
    // no more intersection with f, before update frame
    f.x = f.y = 255;

    _.strictEqual(onCallbacks, 2, "no collision callbacks yet before update frame");
    _.strictEqual(firstOnCallbacks, 1, "no collision callbacks yet before update frame");
    _.strictEqual(offCallbacks, 0, "no collision callbacks yet before update frame");

    // check callbacks done after frame update
    // no more intersection with f, after update frame
    expectedHitDatas = {};
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 2, "no more on-collision callbacks occurred");
    _.strictEqual(firstOnCallbacks, 1, "no more on-collision callbacks occurred");
    _.strictEqual(offCallbacks, 1, "one off-collision callback occurred");

    // check that no callbacks while ide
    // no intersections, after another update frame
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 2, "no collision callbacks occurred while idle");
    _.strictEqual(firstOnCallbacks, 1, "no collision callbacks occurred while idle");
    _.strictEqual(offCallbacks, 1, "no collision callbacks occurred while idle");

    // check callbacks properly called with new collision event
    f.x = f.y = 0;
    expectedHitDatas = {};
    expectedHitDatas[f[0]] = true;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 3, "again collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 2, "again first collision callbackOn occurred");
    _.strictEqual(offCallbacks, 1, "no collision callbackOff occurred yet");

    // check that another intersecting entity does not change semantics of callbacks
    g.x = g.y = 0;
    expectedHitDatas[g[0]] = true;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 4, "again collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 2, "first collision callbackOn did not occur");
    _.strictEqual(offCallbacks, 1, "no collision callbackOff occurred yet");

    // check semantics of all intersecting entities leaving collision at same time
    f.x = f.y = g.x = g.y = 255;
    expectedHitDatas = {};
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 4, "no more on-collision callbacks occurred");
    _.strictEqual(firstOnCallbacks, 2, "no more on-collision callbacks occurred");
    _.strictEqual(offCallbacks, 2, "one off-collision callback occurred");

    // check semantics of all entities entering collision at same time
    f.x = f.y = g.x = g.y = 0;
    expectedHitDatas = {};
    expectedHitDatas[f[0]] = true;
    expectedHitDatas[g[0]] = true;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 5, "again collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 3, "again first collision callbackOn occurred");
    _.strictEqual(offCallbacks, 2, "no collision callbackOff occurred yet");

    // check that an intersecting entity leaving collision does not change semantics of callbacks
    g.x = g.y = 255;
    delete expectedHitDatas[g[0]];
    Crafty.timer.simulateFrames(1);

    _.strictEqual(onCallbacks, 6, "again collision callbackOn occurred");
    _.strictEqual(firstOnCallbacks, 3, "first collision callbackOn did not occur");
    _.strictEqual(offCallbacks, 2, "no collision callbackOff occurred yet");
  });

  // This test assumes that the "circles" are really octagons, as per Crafty.circle.
  test("SAT overlap with circles", function(_) {
    var e = Crafty.e("2D, Collision");
    var c1 = new Crafty.circle(100, 100, 10);
    var c2 = new Crafty.circle(100, 105, 10);
    _.strictEqual((e._SAT(c1, c2).overlap < -13.8 && e._SAT(c1, c2).overlap > -13.9), true, "Expected overlap to be about -13.86 ( or 15 cos[pi/8])");

  });

  // Testcase from issue #828 by VHonzik
  test("SAT overlap with rectangles", function(_) {
    var e = Crafty.e("2D, Collision");
    var c1 = new Crafty.polygon([0,1, 50, 1, 50, 51, 0, 51]);
    var c2 = new Crafty.polygon([-10, -10, -10, 10, 10, 10, 10, -10]);
    _.strictEqual(e._SAT(c1, c2) !== false, true, "Polygons should test as overlapping");

  });

  test("adjustable boundary", function(_) {
    var e = Crafty.e("2D").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 10
    });

    // Four argument version
    e.offsetBoundary(10, 1, 3, 0);
    _.strictEqual(e._bx1, 10, "X1 boundary set");
    _.strictEqual(e._bx2, 3, "X2 boundary set");
    _.strictEqual(e._by1, 1, "Y1 boundary set");
    _.strictEqual(e._by2, 0, "Y2 boundary set");

    e._calculateMBR(10, 10, 0);

    var mbr = e._mbr;

    _.strictEqual(mbr._h, 11, "MBR height uses boundaries (11)");
    _.strictEqual(mbr._w, 23, "MBR width uses boundaries (23)");

    // One argument version
    e.offsetBoundary(5);
    _.strictEqual(e._bx1, 5, "X1 boundary set");
    _.strictEqual(e._bx2, 5, "X2 boundary set");
    _.strictEqual(e._by1, 5, "Y1 boundary set");
    _.strictEqual(e._by2, 5, "Y2 boundary set");

  });


  test("Resizing 2D objects & hitboxes", function(_) {
    var e = Crafty.e("2D, Collision");
    e.attr({
      x: 0,
      y: 0,
      w: 40,
      h: 50
    });

    _.strictEqual(e.map.points[0], 0, "Before rotation: x_0 is 0");
    _.strictEqual(e.map.points[1], 0, "y_0 is 0");
    _.strictEqual(e.map.points[4], 40, "x_2 is 40");
    _.strictEqual(e.map.points[5], 50, "y_2 is 50");

    e.rotation = 90;

    _.strictEqual(Math.round(e.map.points[0]), 0, "After rotation by 90 deg: x_0 is 0");
    _.strictEqual(Math.round(e.map.points[1]), 0, "y_0 is 0");
    _.strictEqual(Math.round(e.map.points[4]), -50, "x_2 is -50");
    _.strictEqual(Math.round(e.map.points[5]), 40, "y_2 is 40");

    // After rotation the MBR will have changed
    _.strictEqual(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    _.strictEqual(Math.round(e._mbr._h), 40, "_mbr._h is  40");
    _.strictEqual(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    _.strictEqual(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.collision(); // Check that regenerating the hitbox while rotated works correctly

    _.strictEqual(Math.round(e.map.points[0]), 0, "After rotation and hitbox regeneration: x_0 is 0");
    _.strictEqual(Math.round(e.map.points[1]), 0, "y_0 is 0");
    _.strictEqual(Math.round(e.map.points[4]), -50, "x_2 is -50");
    _.strictEqual(Math.round(e.map.points[5]), 40, "y_2 is 40");


    // Check that changing the width when rotated resizes correctly for both hitbox and MBR
    // Rotated by 90 degrees, changing the width of the entity should change the height of the hitbox/mbr
    e.w = 100;

    _.strictEqual(Math.round(e.map.points[0]), 0, "After rotation and increase in width: x_0 is 0");
    _.strictEqual(Math.round(e.map.points[1]), 0, "y_0 is 0");
    _.strictEqual(Math.round(e.map.points[4]), -50, "x_2 is -50");
    _.strictEqual(Math.round(e.map.points[5]), 100, "y_2 is 100");

    // After rotation the MBR will have changed
    _.strictEqual(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    _.strictEqual(Math.round(e._mbr._h), 100, "_mbr._h is  100");
    _.strictEqual(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    _.strictEqual(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.destroy();
  });

  test("cbr", function(_) {
    var player = Crafty.e("2D, Collision").attr({
      x: 0,
      y: 50,
      w: 100,
      h: 150
    });

    var cbrObject = {};

    player.cbr(cbrObject);

    _.strictEqual(player.cbr()._x, 0, "X value");
    _.strictEqual(cbrObject._x, 0, "X value");

    _.strictEqual(player.cbr()._y, 50, "Y value");
    _.strictEqual(cbrObject._y, 50, "Y value");

    _.strictEqual(player.cbr()._w, 100, "W value");
    _.strictEqual(cbrObject._w, 100, "W value");

    _.strictEqual(player.cbr()._h, 150, "H value");
    _.strictEqual(cbrObject._h, 150, "H value");
  });

  test("Hitboxes outside of entities (CBR)", function(_) {
    var poly = new Crafty.polygon([
      -8, 6,
      0, -8,
      8, -14,
      16, -8,
      24, 6
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 16,
      h: 16
    }).collision(poly);

    _.ok(e._cbr !== null, "_cbr exists");
    var cbr = e._cbr;
    // Test whether cbr actually bounds hitbox+object
    _.ok(cbr._x <= 42, "cbr x position correct");
    _.ok(cbr._y <= 36, "cbr y position correct");
    _.ok(cbr._x + cbr._w >= 74, "cbr width correct");
    _.ok(cbr._y + cbr._h >= 66, "cbr height correct");

    var x0 = cbr._x,
      y0 = cbr._y;

    e.x += 10;
    e.y += 15;

    _.strictEqual(cbr._x, x0 + 10, "cbr x position moves correctly");
    _.strictEqual(cbr._y, y0 + 15, "cbr y position moves correctly");

  });

  test("CBRs on resize", function(_) {
    var poly = new Crafty.polygon([
      0, 0,
      0, 12,
      12, 12,
      12, 0
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 15,
      h: 15
    }).collision(poly);

    _.ok(e._cbr === null, "_cbr should not exist");

    e.w = 10;

    _.ok(e._cbr !== null, "_cbr should now exist after entity shrinks");

    e.w = 20;

    _.ok(e._cbr === null, "_cbr should not exist after entity grows again");

  });

  test("CBRs should be removed on removal of component", function(_) {
    var poly = new Crafty.polygon([
      0, 0,
      0, 12,
      12, 12,
      12, 0
    ]);

    var e = Crafty.e("2D, Collision").attr({
      x: 50,
      y: 50,
      w: 10,
      h: 10
    }).collision(poly);

    _.ok(e._cbr !== null, "_cbr should exist to begin with");

    e.removeComponent("Collision");

    _.ok(e._cbr === null, "_cbr should now be removed along with Collision");

  });

  var EAST = new Crafty.math.Vector2D(1, 0).normalize();
  var SOUTH_EAST = new Crafty.math.Vector2D(1, 1).normalize();
  var NORTH_EAST = new Crafty.math.Vector2D(1, -1).normalize();
  var NORTH_WEST = new Crafty.math.Vector2D(-1, -1).normalize();

  test("Polygon intersection", function(_) {
    var poly, distance,
        origin, direction;

    poly = new Crafty.polygon([0,0, 50,0, 50,50, 0,50]);

    // intersection with ray slightly outside entity edge
    origin = {_x: -1, _y: 25};
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 1, "ray intersects polygon on its left edge");

    // intersection with ray origin at entity edge
    origin = {_x: 0, _y: 0};
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon on its left edge");

    // intersection with ray origin inside entity
    origin = {_x: 25, _y: 25};
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 25, "ray intersects polygon on its right edge");

    // intersection with ray origin at entity edge
    origin = {_x: 50, _y: 25};
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon on its right edge");

    // no intersection with ray going away
    origin = {_x: 51, _y: 25};
    direction = EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");


    poly = new Crafty.polygon([-75,-75, -150,-150]);

    // intersection with ray at crossing
    origin = {_x: -150, _y: -75};
    direction = NORTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance.toFixed(4), (37.5 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at the crossing");

    // no intersection with parallel ray
    origin = {_x: -76, _y: -75};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");

    // intersection with colinear ray starting before polygon
    origin = {_x: -25, _y: -25};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance.toFixed(4), (50 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at polygon's start point");

    // intersection with colinear ray starting at polygon start
    origin = {_x: -75, _y: -75};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's start point");

    // intersection with colinear ray starting inside polygon
    origin = {_x: -100, _y: -100};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance.toFixed(4), (50 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at ray's origin");

    // intersection with colinear ray starting at polygon end
    origin = {_x: -150, _y: -150};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's end point");

    // no intersection with colinear ray starting outside polygon
    origin = {_x: -151, _y: -151};
    direction = NORTH_WEST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");

    // intersection with colinear ray starting at polygon end, going opposite direction
    origin = {_x: -150, _y: -150};
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's end point");

    // intersection with colinear ray starting inside polygon, going opposite direction
    origin = {_x: -100, _y: -100};
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance.toFixed(4), (25 * Math.sqrt(2)).toFixed(4),
      "ray intersects polygon at ray's origin");

    // intersection with colinear ray starting at polygon start, going opposite direction
    origin = {_x: -75, _y: -75};
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, 0, "ray intersects polygon at polygon's start point");

    // no intersection with colinear ray going opposite direction
    origin = {_x: -74, _y: -74};
    direction = SOUTH_EAST;
    distance = poly.intersectRay(origin, direction);
    _.strictEqual(distance, Infinity, "ray does not intersect polygon");
  });


  module("Motion");

  test("Motion", function(_) {
    var Vector2D = Crafty.math.Vector2D;
    var zero = new Vector2D();
    var ent = Crafty.e("2D, Motion, AngularMotion")
      .attr({x: 0, y:0});

    // Check the initial zeroing of values
    _.ok(ent.velocity().equals(zero), "linear velocity should be zero");
    _.strictEqual(ent.vrotation, 0, "angular velocity should be zero");
    _.ok(ent.acceleration().equals(zero), "linear acceleration should be zero");
    _.strictEqual(ent.arotation, 0, "angular acceleration should be zero");
    _.ok(ent.motionDelta().equals(zero), "linear delta should be zero");
    _.strictEqual(ent.drotation, 0, "angular delta should be zero");

    // Check that you can't overwrite the motionDeltas
    ent.motionDelta().x = 20;
    _.ok(ent.motionDelta().equals(zero), "linear delta should not have changed");
    ent.drotation = 10;
    _.strictEqual(ent.drotation, 0, "angular delta should not have changed");


    // Set the v0 / v0_r values
    var v0 = new Vector2D(2,5); var v0_r = 10;

    // Check setting velocity and vrotation
    ent.velocity().setValues(v0);
    ent.vrotation = v0_r;
    _.ok(ent.velocity().equals(v0), "linear velocity should be <2,5>");
    _.strictEqual(ent.vrotation, v0_r, "angular velocity should be 10");

    // Check setting accelerations
    var a = new Vector2D(4,2); var a_r = -15;
    ent.acceleration().setValues(a);
    ent.arotation = a_r;
    _.ok(ent.acceleration().equals(a), "linear acceleration should be <4,2>");
    _.strictEqual(ent.arotation, a_r, "angular acceleration should be -15");

    // Check op assignment on various fields
    ent.velocity().x += 1;
    ent.velocity().y *= 2;
    ent.velocity().y -= 1;
    _.ok(ent.velocity().equals(new Vector2D(v0.x+1, v0.y*2-1)), "linear velocity should be <3,9>");
    ent.arotation += 5;
    _.strictEqual(ent.arotation, a_r + 5, "angular acceleration should be -10");

    // Reset the motion values back to 0
    ent.resetMotion();
    ent.resetAngularMotion();
    _.ok(ent.velocity().equals(zero), "linear velocity should be zero");
    _.strictEqual(ent.vrotation, 0, "angular velocity should be zero");
    _.ok(ent.acceleration().equals(zero), "linear acceleration should be zero");
    _.strictEqual(ent.arotation, 0, "angular acceleration should be zero");
    _.ok(ent.motionDelta().equals(zero), "linear delta should be zero");
    _.strictEqual(ent.drotation, 0, "angular delta should be zero");


    // v = (2, 5)
    ent.velocity().setValues(v0);
    // v0_r = 10
    ent.vrotation = v0_r;
    Crafty.timer.simulateFrames(1);
    var dt = 0.020; // 20 ms in 1 frame is the default
    // Check what happens to velocity over time with 0 a
    _.ok(ent.velocity().equals(v0), "velocity should be <2,5>");
    _.strictEqual(ent.vrotation, v0_r, "angular velocity should be 10");
    // Delta in last frame should be 
    _.strictEqual(ent.motionDelta().x, v0.x * dt, "delta x should be .04");
    _.strictEqual(ent.motionDelta().y, v0.y * dt, "delta y should be .1");
    // _.ok(ent.motionDelta().equals(v0), "delta should be <2,5>");
    _.strictEqual(ent.drotation, v0_r * dt, "angular delta should be 10");
    _.strictEqual(ent.x, v0.x * dt, "entity x should be 2");
    _.strictEqual(ent.y, v0.y * dt, "entity y should be 5");
    _.strictEqual(ent.rotation, v0_r * dt, "entity rotation should be 10");


    // Goal of this test is to check that acceleration processes correctly, so reset everything first!
    ent.resetMotion();
    ent.resetAngularMotion();

    ent.attr({x:0, y:0, rotation:0});
    
    // Set a, v values
    a = new Vector2D(4,2);
    a_r = -15;
    v0 = new Vector2D(2,5);
    v0_r = 10;
    
    ent.acceleration().setValues(a);
    ent.arotation = a_r;
    ent.velocity().setValues(v0);
    ent.vrotation = v0_r;
    Crafty.timer.simulateFrames(1);
    
    // Calculate the new configuration of the object via kinematics
    dt = 0.020; // 20 ms in one frame
    var dPos = new Vector2D(a).scale(0.5*dt*dt).add(v0.clone().scale(dt)), dPos_r = v0_r * dt + 0.5*a_r * dt * dt;

    _.ok(ent.motionDelta().equals(dPos), "delta should be equal to the new position");
    _.strictEqual(ent.drotation, dPos_r, "Rotation should match");
    _.strictEqual(ent.x, dPos.x, "entity x should match calculated");
    _.strictEqual(ent.y, dPos.y, "entity y should match calculate");
    _.strictEqual(ent.rotation, dPos_r, "entity rotation should match calculated");
    var v1 = new Vector2D(a).scale(dt).add(v0), v1_r = a_r * dt + v0_r;
    _.strictEqual(ent.velocity().x, v1.x, "vx should match calculated");
    _.strictEqual(ent.velocity().y, v1.y, "vy should match calculated");
    // _.ok(ent.velocity().equals(v1), "linear velocity should match calculated");
    _.strictEqual(ent.vrotation, v1_r, "angular velocity should match calculated");

    ent.destroy();
  });

  test("Motion - CCDBR", function(_) {
    var ent = Crafty.e("2D, Motion")
      .attr({x: 0, y:0, w: 10, h: 10});
    var ccdbr, ccdbr2;

    ent._dx = 10; ent.x = 10;
    ent._dy = -5; ent.y = -5;
    ccdbr = ent.ccdbr();
    _.strictEqual(ccdbr._x, 0, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._w, 20, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._y, -5, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._h, 15, "tunneling rectangle property matches expected value");

    ent._dx = -25; ent.x = -15;
    ent._dy = 50; ent.y = 45;
    ccdbr2 = ent.ccdbr(ccdbr);
    _.strictEqual(ccdbr._x, -15, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._w, 35, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._y, -5, "tunneling rectangle property matches expected value");
    _.strictEqual(ccdbr._h, 60, "tunneling rectangle property matches expected value");

    _.strictEqual(ccdbr2._x, ccdbr._x, "object was reused");
    _.strictEqual(ccdbr2._y, ccdbr._y, "object was reused");
    _.strictEqual(ccdbr2._w, ccdbr._w, "object was reused");
    _.strictEqual(ccdbr2._h, ccdbr._h, "object was reused");

    ent.destroy();
  });

  test("Motion - changing vector", function(_) {
    var ent = Crafty.e("2D, Motion")
      .attr({x: 0, y:0});

    ent.vx = 5;

    _.strictEqual(ent.velocity().x, 5, "Velocity component changed");

  });

  test("Motion - NewDirection Event", function(_){
    var e = Crafty.e("2D, Motion")
      .attr({x: 10, y:10}); 
    e.vx = 0;
    e.vy = 0;
    e.ay = 0;
    e.ax = -0.3;
    var newDirectionFlag = false;
    e.bind("NewDirection", function(){
      newDirectionFlag = true;
    });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(newDirectionFlag, true, "NewDirection was triggered");
  });

  test("AngularMotion - NewRotationDirection Event", function(_){
    var e = Crafty.e("2D, AngularMotion")
      .attr({x: 10, y:10}); 
    e.vrotation = 0;
    e.arotation = -0.3;

    var newDirectionFlag = false;
    e.bind("NewRotationDirection", function(){
      newDirectionFlag = true;
    });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(newDirectionFlag, true, "NewDirection was triggered");
  });

  test("Motion - Events", function(_) {
    var e = Crafty.e("2D, Motion, AngularMotion")
      .attr({x: 0, y:0});

    var newDirectionEvents = 0,
        newRotationDirectionEvents = 0,
        movedEvents = 0,
        rotatedEvents = 0,
        motionEvents = 0;
    e.bind("NewDirection", function(evt) {
      newDirectionEvents++;
    });
    e.bind("NewRotationDirection", function(evt) {
      newRotationDirectionEvents++;
    });
    e.bind("Moved", function(evt) {
      movedEvents++;
    });
    e.bind("Rotated", function(evt) {
      rotatedEvents++;
    });
    e.bind("MotionChange", function(evt) {
      motionEvents++;
    });

    // group 1; setting vy and moving one frame
    e.one("NewDirection", function(evt) {
      _.strictEqual(evt.x, 0, "[1] - no motion along x axis");
      _.strictEqual(evt.y, 1, "[1] - moving along +y axis");
    });
    e.one("Moved", function(evt) { 
      _.strictEqual(evt.axis, "y", "[1] - moved along y axis"); 
      _.strictEqual(evt.oldValue, 0, "[1] - old y was 0"); 
    });
    e.one("MotionChange", function(evt) { 
      _.strictEqual(evt.key, "vy", "[1] - vy was set"); 
      _.strictEqual(evt.oldValue, 0, "[1] - old vy was 0");
    });
    e.vy = 1;
    Crafty.timer.simulateFrames(1);

    // group 2: set both vy and vx to be negative
    var old_y = e.y;
    e.one("NewDirection", function(evt) {
      _.strictEqual(evt.x, -1, "[2] - Now moving along -x axis" );
      _.strictEqual(evt.y, -1, "[2] - Now moving along -y axis");
    });
    e.one("Moved", function(evt) { 
      _.strictEqual(evt.axis, "x", "[2] - Moved along x axis"); 
      _.strictEqual(evt.oldValue, 0, "[2] - old x was 0"); 
      e.one("Moved", function(evt) { 
        _.strictEqual(evt.axis, "y", "[2] - Moved along y axis"); 
        _.strictEqual(evt.oldValue, old_y, "[2] - old y value matches cached"); 
      });
    });
    e.one("MotionChange", function(evt) { 
      _.strictEqual(evt.key, "vx", "[2] - vx was changed"); 
      _.strictEqual(evt.oldValue, 0, "[2] - old vx was 0");
    });
    e.vx = -1;
    e.one("MotionChange", function(evt) { 
      _.strictEqual(evt.key, "vy", "[2] - vy was changed");
      _.strictEqual(evt.oldValue, 1, "[2] - old vy value matches cached");
    });
    e.vy = 0;
    e.one("MotionChange", function(evt) { 
      _.strictEqual(evt.key, "vy", "[2] - vy was changed again");
      _.strictEqual(evt.oldValue, 0, "[2] - old vy value was 0");
    });
    e.vy = -1;
    e.vy = -1; // no MotionChange event was fired
    Crafty.timer.simulateFrames(1);

    // group 3 -- test newdireciton when we were previously moving
    e.vy = 1;
    e.vx = 0;
    e.one("NewDirection", function(evt) {
      _.strictEqual(evt.x, 0, "[3] - not moving along x axis");
      _.strictEqual(evt.y, 0, "[3] - not moving along y axis");
    });
    e.vy = 0;
    Crafty.timer.simulateFrames(1);


    
    // Group 4, rotation tests
    e.vrotation = 0; // no MotionChange event was fired
    e.one("MotionChange", function(evt) {
      _.strictEqual(evt.key, "vrotation", "[4] - change of angular speed");
      _.strictEqual(evt.oldValue, 0, "[4] - old vr value was 0"); 
    });
    e.vrotation = 1;
    e.one("MotionChange", function(evt) {
      _.strictEqual(evt.key, "vrotation", "[4] - change of angular speed");
      _.strictEqual(evt.oldValue, 1, "[4] - old value was 1");
    });
    e.vrotation = 0;

    // Group 5
    e.one("NewRotationDirection", function(evt) {
      _.strictEqual(evt, 1, "[5] - Rotating in the positive sense");
    });
    e.one("Rotated", function(oldValue) {
      _.strictEqual(oldValue, 0, "[5] - Rotated from 0 position");
    });
    e.vrotation = 1;
    Crafty.timer.simulateFrames(1);

    var old_rotation = e.rotation;
    e.one("NewRotationDirection", function(evt) {
      _.strictEqual(evt, -1, "[6] - Rotating in the negative sense");
    });
    e.one("Rotated", function(oldValue) {
      _.strictEqual(oldValue, old_rotation, "[6] - Old rotation matches cached value");
    });
    e.vrotation = -1;
    Crafty.timer.simulateFrames(1);

    old_rotation = e.rotation;
    e.one("NewRotationDirection", function(evt) {
      _.strictEqual(evt, 1, "[7] - Rotating in the positive sense");
    });
    e.one("Rotated", function(oldValue) {
      _.strictEqual(oldValue, old_rotation, "[7] - Old rotation matches cached value");
    });
    e.vrotation = 1;
    Crafty.timer.simulateFrames(1);

    e.one("NewRotationDirection", function(evt) {
      _.strictEqual(evt, 0, "[8] - No longer rotating");
    });
    e.vrotation = 0;
    Crafty.timer.simulateFrames(1);

    // TODO: break these up into separate checks
    _.strictEqual(newDirectionEvents, 3, "NewDirection fired 3 times.");
    _.strictEqual(newRotationDirectionEvents, 4, "NewRotationDirection fired 4 times.");
    _.strictEqual(motionEvents, 13, "MotionChange fired 13 times.");
    _.strictEqual(movedEvents, 3, "Moved fired 3 times.");
    _.strictEqual(rotatedEvents, 3, "Rotated fired 3 times.");
    e.destroy();
  });

  test("Supportable", function(_) {
    var ground = Crafty.e("2D, Ground")
      .attr({x: 0, y: 10, w:10, h:10}); // y: 10 to 20
    var ground2 = Crafty.e("2D, Ground")
      .attr({x: 0, y: 15, w:10, h:10}); // y: 15 to 25

    var landedCount = 0,
        liftedCount = 0,
        previousGround = null;
    var ent = Crafty.e("2D, Supportable")
      .attr({x: 0, y:0, w:5, h:5}) // y: y to y+5
      .bind("LandedOnGround", function(obj) {
        _.ok(ent.ground, "entity should be on ground");
        _.strictEqual(obj, ent.ground, "ground object should be equal");
        _.ok(!previousGround, "previous ground should not exist");
        previousGround = obj;
        landedCount++;
      })
      .bind("LiftedOffGround", function(obj) {
        _.ok(!ent.ground, "entitiy should not be on ground");
        _.strictEqual(obj, previousGround, "ground object should be equal");
        _.ok(previousGround, "previous ground should exist");
        previousGround = null;
        liftedCount++;
      })
      .startGroundDetection("Ground");

    // entity shouldn't land in initial position
    _.strictEqual(ent.ground, null, "entity should not be on ground");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(ent.ground, null, "entity should not be on ground");

    // entity should land when immediately above ground
    ent.y = 5;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    _.strictEqual(ent.y, 5, "ent y should not have changed");
    _.strictEqual(ent.ground, ground, "entity should be on ground");

    // entity should lift when no longer near ground
    ent.y = 0;
    Crafty.timer.simulateFrames(1); // 1 lifted event should have occured
    _.strictEqual(ent.y, 0, "ent y should not have changed");
    _.strictEqual(ent.ground, null, "entity should not be on ground");

    // entity should land when intersecting ground, and should snap to ground
    ent.y = 7;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    _.strictEqual(ent.y, ground.y - ent.h, "ent y should have been snapped to ground");
    _.strictEqual(ent.ground, ground, "entity should be on ground");

    // no snapping should happen if entity moves while still intersecting ground
    ent.y = 9;
    Crafty.timer.simulateFrames(1);
    _.strictEqual(ent.y, 9, "ent y should not have changed");
    _.strictEqual(ent.ground, ground, "entity should be on ground");

    // entity still interesects ground, nothing should change
    ent.y = 16;
    Crafty.timer.simulateFrames(1);
    _.strictEqual(ent.y, 16, "ent y should not have changed");
    _.strictEqual(ent.ground, ground, "entity should be on ground");

    // entity should change ground (lift from old & land on new) in a single frame
    ent.y = 21;
    Crafty.timer.simulateFrames(1); // 1 lifted event & 1 landed event should have occured
    _.strictEqual(ent.y, ground2.y - ent.h, "ent y should have been snapped to ground");
    _.strictEqual(ent.ground, ground2, "entity should be on ground2");

    // entity should lift from ground, if it looses the required component
    ground.removeComponent("Ground");
    ground2.removeComponent("Ground");
    Crafty.timer.simulateFrames(1); // 1 lifted event should have occured
    _.strictEqual(ent.y, ground2.y - ent.h, "ent y should not have changed");
    _.strictEqual(ent.ground, null, "entity should not be on ground");
    ground.addComponent("Ground");
    ground2.addComponent("Ground");

    // entity should not be able to land on ground if user forbids it
    // but should be able to land on other ground2 since it's not forbidden
    ent.bind("CheckLanding", function(candidate) {
      if (candidate === ground)
        this.canLand = false;
    });
    ent.y = 7;
    Crafty.timer.simulateFrames(1); // no event should have occured
    _.strictEqual(ent.y, 7, "ent y should not have changed");
    _.strictEqual(ent.ground, null, "entity should not be on ground");
    ent.y = 12;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    _.strictEqual(ent.y, ground2.y - ent.h, "ent y should have been snapped to ground");
    _.strictEqual(ent.ground, ground2, "entity should be on ground2");

    // entity should lift from ground, if it gets destroyed
    ground2.destroy();
    Crafty.timer.simulateFrames(1); // 1 lifted event should have occured
    _.strictEqual(ent.y, ground2.y - ent.h, "ent y should not have changed");
    _.strictEqual(ent.ground, null, "entity should not be on ground");


    _.strictEqual(landedCount, 4, "landed count mismatch");
    _.strictEqual(liftedCount, 4, "lifted count mismatch");

    ground.destroy();
    ground2.destroy();
    ent.destroy();
  });

  test("GroundAttacher", function(_) {
    var ground = Crafty.e("2D, Ground");
    var player = Crafty.e("2D, GroundAttacher");

    player.trigger("LandedOnGround", ground);
    ground.x = 10;
    _.strictEqual(player.x, 10, "player moved with ground");

    player.trigger("LiftedOffGround", ground);
    ground.x = 20;
    _.strictEqual(player.x, 10, "player did not move with ground");
  });

  test("Gravity", function(_) {
    var player = Crafty.e("2D, Gravity")
        .attr({ x: 0, y: 100, w: 32, h: 10 });

    _.strictEqual(player.velocity().y, 0, "velocity should be 0 before activating gravity");
    _.strictEqual(player.acceleration().y, 0, "acceleration should be 0 before activating gravity");
    _.strictEqual(player._gravityConst, 500, "gravityConst should match default value");
    _.strictEqual(player._gravityActive, false, "gravity should not be active");

    player.gravityConst(0.3*50*50);
    _.strictEqual(player.velocity().y, 0, "velocity should be 0 before activating gravity");
    _.strictEqual(player.acceleration().y, 0, "acceleration should be 0 before activating gravity");
    _.strictEqual(player._gravityConst, 0.3*50*50, "gravityConst should match new value");
    _.strictEqual(player._gravityActive, false, "gravity should not be active");

    _.strictEqual(player._groundComp, null, "no ground component set before activating gravity");
    player.gravity("platform2");
    _.strictEqual(player._gravityActive, true, "gravity should be active");
    _.strictEqual(player._groundComp, "platform2", "new ground component set after activating gravity");
    _.strictEqual(player.velocity().y, 0, "velocity should be 0 before stepping a frame");
    _.strictEqual(player.acceleration().y, player._gravityConst, "acceleration should match gravity constant after activating gravity");

    player.gravity("platform");
    _.strictEqual(player._gravityActive, true, "gravity should be active");
    _.strictEqual(player._groundComp, "platform", "ground component changed after reactivating gravity");
    _.strictEqual(player.velocity().y, 0, "velocity should be 0 before stepping a frame");
    _.strictEqual(player.acceleration().y, player._gravityConst, "acceleration should match gravity constant after activating gravity twice");

    player.gravityConst(100);
    _.strictEqual(player.velocity().y, 0, "velocity should be 0 before stepping a frame");
    _.strictEqual(player.acceleration().y, player._gravityConst, "acceleration should match gravity constant after changing gravity constant while gravity is active");
    _.strictEqual(player._gravityActive, true, "gravity should still be active");

    player.vy = 1000;
    player.gravityConst(0.2*50*50);
    _.strictEqual(player.velocity().y, 1000, "velocity should not have been reset after changing gravityConst");

    player.antigravity();
    _.strictEqual(player._gravityActive, false, "gravity should be inactive");
    _.strictEqual(player.acceleration().y, 0, "acceleration should be zero after deactivating gravity");
    _.strictEqual(player.velocity().y, 0, "velocity should be zero after deactivating gravity");

    player.gravity();
    _.strictEqual(player._gravityActive, true, "gravity should be active");
    _.strictEqual(player._groundComp, "platform", "ground component didn't change after reactivating");
    _.strictEqual(player.acceleration().y, player._gravityConst, "acceleration should match gravity constant after activating gravity");
    _.strictEqual(player.velocity().y, 0, "velocity should be still be zero immediately after deactivating gravity");
  });


  test("Supportable - Tunneling", function(_) {
    var landedCount = 0,
        liftedCount = 0,
        fps = Crafty.timer.FPS(),
        ground;

    var player = Crafty.e("2D, Supportable, Motion")
        .attr({ x: 10, y: 0, w: 10, h: 10 }) // x-extent [x, x+10] y-extent [y, y+10]
        .bind("LiftedOffGround", function() {
          liftedCount++;
        })
        .bind("LandedOnGround", function() {
          landedCount++;
        })
        .startGroundDetection("Floor")
        .preventGroundTunneling();


    /*****************************************
     * VERTICAL TUNNELING TESTS
     *****************************************/
    ground = Crafty.e("2D, Floor")
                  .attr({ x: 0, y: 100, w: 30, h: 1 }); // x-extent [0, 30] y-extent [100, 101]

    // slow fall velocity does not land player on far away ground
    player.y = 0;
    player.vy = 5 * fps;
    Crafty.timer.simulateFrames(1); // player did not land
    _.strictEqual(player.dy, 5, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, 5+10, "player should be at expected position");
    _.ok(player.y + player.h < ground.y, "player should not have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // player did not lift

    // fast fall velocity lands player on far away ground, does not tunnel player through ground
    player.y = 0;
    player.vy = 1e6 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dy, 1e6, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++


    // slow fall velocity lands player directly above ground
    player.y = 90;
    player.vy = 5 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dy, 5, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++

    // fast fall velocity lands player directly above ground, does not tunnel player through ground
    player.y = 90;
    player.vy = 1e6 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dy, 1e6, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++


    // slow fall velocity lands player while intersecting ground
    player.y = 91;
    player.vy = 5 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dy, 5, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++

    // fast fall velocity lands player while intersecting ground, does not tunnel player through ground
    player.y = 91;
    player.vy = 1e6 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dy, 1e6, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++


    // slow fall velocity lands player while intersecting ground
    player.y = 101;
    player.vy = 5 * fps;
    Crafty.timer.simulateFrames(1); // player did not land
    _.strictEqual(player.dy, 5, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, 101+5+10, "player should be at expected position");
    _.ok(player.y > ground.y + ground.h, "player should not have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // player did not lift

    // fast fall velocity lands player while intersecting ground, does not tunnel player through ground
    player.y = 101;
    player.vy = 1e6 * fps;
    Crafty.timer.simulateFrames(1); // player did not land
    _.strictEqual(player.dy, 1e6, "player should have moved for an expected amount");
    _.strictEqual(player.y + player.h, 101+1e6+10, "player should be at expected position");
    _.ok(player.y > ground.y + ground.h, "player should not have landed on ground");
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1);// player did not lift

    /*****************************************
     * HORIZONTAL TUNNELING TESTS
     *****************************************/
    ground = Crafty.e("2D, Floor")
                  .attr({ x: 100, y: 0, w: 1, h: 30 }); // x-extent [100, 101] y-extent [0, 30]

    // slow horizontal velocity does not land player on far away ground
    player.x = 0;
    player.vx = 5 * fps;
    Crafty.timer.simulateFrames(1); // player did not land
    _.strictEqual(player.dx, 5, "player should have moved for an expected amount");
    _.strictEqual(player.x + player.w, 5+10, "player should be at expected position");
    _.ok(player.x + player.w < ground.x, "player should not have landed on ground");
    player.x = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // player did not lift

    // fast horizontal velocity lands player on far away ground, does not tunnel player through ground
    player.x = 0;
    player.vx = 1e6 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dx, 1e6, "player should have moved for an expected amount");
    _.strictEqual(player.x, ground.x + ground.w - 1, "player should have landed on ground");
    player.x = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++

    /*****************************************
     * DIAGONAL TUNNELING TESTS
     *****************************************/
    ground = Crafty.e("2D, Floor")
                  .attr({ x: 99, y: 99, w: 2, h: 2 }); // x-extent [99, 101] y-extent [99, 101]

    // slow diagonal velocity does not land player on far away ground
    player.x = 150; player.vx = -5 * fps;
    player.y = 150; player.vy = -5 * fps;
    Crafty.timer.simulateFrames(1); // player did not land
    _.strictEqual(player.dx, -5, "player should have moved for an expected amount");
    _.strictEqual(player.dy, -5, "player should have moved for an expected amount");
    _.strictEqual(player.x, 150-5, "player should be at expected position");
    _.strictEqual(player.y, 150-5, "player should be at expected position");
    _.ok(ground.x + ground.w < player.x, "player should not have landed on ground");
    _.ok(ground.y + ground.h < player.y, "player should not have landed on ground");
    player.x = 0;
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // player did not lift

    // fast diagonal velocity lands player on far away ground, does not tunnel player through ground
    player.x = 150; player.vx = -100 * fps;
    player.y = 150; player.vy = -100 * fps;
    Crafty.timer.simulateFrames(1); // landedCount++
    _.strictEqual(player.dx, -100, "player should have moved for an expected amount");
    _.strictEqual(player.dy, -100, "player should have moved for an expected amount");
    _.strictEqual(player.x + player.w, ground.x + 1, "player should have landed on ground");
    _.strictEqual(player.y + player.h, ground.y, "player should have landed on ground");
    player.x = 0;
    player.y = 0;
    player.resetMotion();
    Crafty.timer.simulateFrames(1); // liftedCount++


    _.strictEqual(landedCount, 7, "player should have landed correct number of times");
    _.strictEqual(liftedCount, 7, "player should have lifted correct number of times");
  });


  test("Integrationtest - Gravity", function(_) {
    var done = false;

    var ground = Crafty.e("2D, platform")
          .attr({ x: 0, y: 280, w: 600, h: 20 });

    var player = Crafty.e("2D, Gravity")
          .attr({ x: 0, y: 100, w: 32, h: 16 })
          .gravityConst(0.3*50*50)
          .gravity("platform");


    var vel = -1;
    player.bind("EnterFrame", function() {
      if (!this.ground) {
        _.ok(this.velocity().y > vel, "velocity should increase");
        vel = this.velocity().y;
      } else {
        vel = -1;
      }
    });

    var landCount = 0, liftCount = 0;
    player.bind("LandedOnGround", function() {
      landCount++;
      _.strictEqual(this.acceleration().y, 0, "acceleration should be zero");
      _.strictEqual(this.velocity().y, 0, "velocity should be zero");

      if (landCount === 1) {
        this.bind("LiftedOffGround", function() {
          liftCount++;

          Crafty.timer.simulateFrames(3);
          vel = -1;
        });
        this.attr({y: 100});
      } else {
        _.strictEqual(landCount, 2, "two land on ground events should have been registered");
        _.strictEqual(liftCount, 1, "one lift off ground event should have been registered");

        ground.destroy();
        player.destroy();

        done = true;
      }
    });

    Crafty.timer.simulateFrames(75);
    _.ok(done, "Integrationtest completed");
  });

  // Use keysUp/Down helper functions defined in common.js

  test("Integrationtest - Twoway", function(_) {
    var done = false;
    Crafty.resetKeyDown();

    var ground = Crafty.e("2D, platform")
          .attr({ x: 0, y: 200, w: 10, h: 20 });

    var player = Crafty.e("2D, Gravity, Twoway")
          .attr({ x: 0, y: 150, w: 32, h: 10 })
          .gravity("platform")
          .gravityConst(0.3*50*50)
          .twoway(2, 4);

    var landCount = 0, liftCount = 0;
    player.bind("LandedOnGround", function() {
      landCount++;
      
      if (landCount === 1) {
        this.bind("LiftedOffGround", function() {
          liftCount++;
          this.bind("EnterFrame", function() {
            keysDown(Crafty.keys.UP_ARROW);
            if (this.velocity().y < -this._jumpSpeed)
              _.ok(false, "Twoway should not modify velocity");
          });
        });

        keysDown(Crafty.keys.UP_ARROW);
      } else {
        _.strictEqual(landCount, 2, "two land on ground events should have been registered");
        _.strictEqual(liftCount, 1, "one lift off ground event should have been registered");

        ground.destroy();
        player.destroy();

        keysUp(Crafty.keys.UP_ARROW);
        done = true;
      }
    });

    Crafty.timer.simulateFrames(75);
    _.ok(done, "Integration test completed");
  });

})();
