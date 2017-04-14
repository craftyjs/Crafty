(function() {
  var module = QUnit.module;
  var test = QUnit.test;

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





  // Define variables to host test shapes
  var trapezoid = null;
  var yellow = null;
  var parallelogram = null;
  var green = null;
  var purple = null;

  var resetPositions = function() {
    trapezoid.attr({x: 300, y: 150});
    yellow.attr({x: 50, y: 50});
    parallelogram.attr({x: 350, y: 350});
    green.attr({x: 100, y: 500});
    purple.attr({x: 500, y: 500});
  };

  var overlapEverything = function() {
    trapezoid.x = green.x;
    trapezoid.y = green.y;
    purple.x = green.x;
    purple.y = green.y;
    yellow.x = green.x;
    yellow.y = green.y;
    parallelogram.x = green.x;
    parallelogram.y = green.y;
  };

  var setHitChecks = function() {
    // Start by canceling hit checks
    green.ignoreHits();

    // Now set them again
    green.checkHits('Trapezoid, Yellow, Parallelogram, Purple');
  };

  var collisions = [];
  var decollisions = [];

  var getHitInfoNames = function(hitInfo) {
    var result = [];

    hitInfo.forEach(function(e) {
      result.push(e.obj._entityName);
    });

    return result;
  };

  var getSingleHitInfoName = function(hitInfo) {
    return getHitInfoNames(hitInfo)[0];
  };

  var getCollisionParticipants = function(collision) {
    return [collision[0], getSingleHitInfoName(collision[1])];
  };

  module("Collision - complex setting", {
    beforeEach: function() {
      trapezoid = Crafty.e('Trapezoid, 2D, Collision').setName('Trapezoid').
        attr({w: 200, h: 100}).collision(new Crafty.polygon([50, 0, 0, 100, 200, 100, 150, 0]));
      yellow = Crafty.e('Yellow, 2D, Collision').setName('Yellow').
        attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0, 0, 100, 100, 100, 100, 0]));
      parallelogram = Crafty.e('Parallelogram, 2D, Collision').setName('Parallelogram').
        attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0, 25, 100, 100, 100, 75, 0]));
      green = Crafty.e('Green, 2D, Collision').setName('Green').
        attr({w: 100, h: 100}).origin('center');
      purple = Crafty.e('Purple, 2D, Collision').setName('Purple').
        attr({w: 100, h: 100}).origin('center');

      // Set up hit events
      [trapezoid, yellow, parallelogram, green, purple].forEach(function(e) {
        e.bind("HitOn", function(hitInfo) {
          collisions.push([e._entityName, hitInfo]);
        });

        e.bind("HitOff", function(otherComponent) {
          decollisions.push([e._entityName, otherComponent]);
        });
      });

      collisions = [];
      decollisions = [];
      resetPositions();
      setHitChecks();
    }
  });


  test("HitOn fires when a tracked entity collides", function(_) {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);


    _.strictEqual(collisions.length, 1, "There should have been exactly 1 collision");

    collision = collisions[0];
    if (!collision) return;

    _.deepEqual(getCollisionParticipants(collision), ['Green', 'Purple'], "The purple and green blocks should have collided");
  });

  test("HitOn fires for each component type supplied as part of a list", function(_) {
    overlapEverything();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("HitOn fires for each component type supplied as an individual argument", function(_) {
    green.ignoreHits();
    green.checkHits("Trapezoid", "Yellow", "Parallelogram", "Purple");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("HitOn contains info for multiple collisions", function(_) {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    yellow.x = green.x;
    yellow.y = green.y;
    Crafty.timer.simulateFrames(1);


    _.strictEqual(collisions.length, 2, "There should have been exactly 2 collisions");

    // Theoretically the code here should not care about the order of collisions
    // in the array, but that is a hassle
    collision = collisions[0];
    if (collisions[0]) return;
    _.deepEqual(getCollisionParticipants(collision), ['Green', 'Yellow'], "The yellow and green blocks should have collided");

    collision = collisions[1];
    if (!collision) return;
    _.deepEqual(getCollisionParticipants(collision), ['Green', 'Purple'], "The purple and green blocks should have collided");

  });

  test("HitOn collision info contains collision data", function(_) {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    collision = collisions[0];
    if (!collision) return;
    _.strictEqual(collision[1][0].type, 'SAT', "The collision type should have been SAT");
    _.strictEqual(Math.abs(collision[1][0].overlap), 100, "The collision overlap should have been 100%");
  });

  test("IgnoreHits causes hits not to be detected", function(_) {
    green.ignoreHits();

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 0, "There should have been no collisions");
  });

  test("IgnoreHits ignores specific components supplied as a list", function(_) {
    green.ignoreHits("Trapezoid, Parallelogram");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 2, "There should have been exactly 2 collisions");
  });

  test("IgnoreHits ignores specific components supplied as arguments", function(_) {
    green.ignoreHits("Trapezoid", "Parallelogram");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 2, "There should have been exactly 2 collisions");
  });

  test("IgnoreHits has no effect when irrelevant components are supplied", function(_) {
    green.ignoreHits("All, Your, Base");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("Once a hit event is fired, it will not fire again while the collision persists", function(_) {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(10);


    _.strictEqual(collisions.length, 1, "There should have been exactly 1 collision");
  });

  test("HitOff fires when a tracked entity stops colliding", function(_) {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);


    _.strictEqual(decollisions.length, 1, "Exactly 1 collision should have stopped");

    var decollision = decollisions[0];
    if (!decollision) return;

    _.deepEqual([decollision[0], decollision[1]], ['Green', 'Purple'], "The purple and green blocks should have stopped colliding");
  });

  test("HitOff events fires only once per terminated collision", function(_) {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(10);


    _.strictEqual(decollisions.length, 1, "Exactly 1 collision should have stopped");
  });

  test("Setting up a hit check multiple times has no effect", function(_) {
    // None of the checks below should register as test initialization already registered this check
    green.checkHits("Purple");
    green.checkHits("Purple");
    green.checkHits("Purple");

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 1, "There should have been exactly 1 collision");
    _.strictEqual(decollisions.length, 1, "Exactly 1 collision should have stopped");
  });

  test("HitOn events fire for a collision after the original one", function(_) {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 2, "Exactly 2 collisions should have occurred");
  });

  test("HitOn events fire for a collision underway if resetHitChecks is called", function(_) {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    green.resetHitChecks();

    // Fire an additional frame to make sure resetting hit checks has no devious
    // side effects.
    Crafty.timer.simulateFrames(2);

    _.strictEqual(collisions.length, 2, "Exactly 2 collisions should have occurred");

    _.deepEqual(getCollisionParticipants(collisions[0]), ['Green', 'Purple'], "The first collision should have been between the purple and green blocks");
    _.deepEqual(getCollisionParticipants(collisions[1]), ['Green', 'Purple'], "The second collision should have been between the purple and green blocks");
  });

  test("resetHitChecks without arguments resets all checks", function(_) {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks();
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 8, "Exactly 8 collisions should have occurred");
  });

  test("resetHitChecks affects specific components specified as a list", function(_) {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Yellow, Purple");
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 6, "Exactly 6 collisions should have occurred");
  });

  test("resetHitChecks affects specific components specified as arguments", function(_) {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Yellow", "Purple");
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 6, "Exactly 6 collisions should have occurred");
  });

  test("resetHitChecks has no effect for components without hit checks", function(_) {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Banana", "Phone");
    Crafty.timer.simulateFrames(1);

    _.strictEqual(collisions.length, 4, "Exactly 4 collisions should have occurred");
  });

  test("resetHitChecks works from within a hit handler", function(_) {
    var hitResetCallback = function() {
      green.resetHitChecks();
    };

    green.bind("HitOn", hitResetCallback);

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(2);

    _.strictEqual(collisions.length, 2, "Exactly 2 collisions should have occurred");

    green.unbind("HitOn", hitResetCallback);
  });
})();
