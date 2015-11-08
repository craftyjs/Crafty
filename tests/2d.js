(function() {
  var module = QUnit.module;

  module("2D");

  test("position", function() {
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
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
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    player.x = 0;
    player.y = 0;
    player.w = 50;
    player.h = 50;

    strictEqual(player.intersect(0, 0, 100, 50), true, "Intersected");

    strictEqual(player.intersect({
      _x: 0,
      _y: 0,
      _w: 100,
      _h: 50
    }), true, "Intersected Again");

    strictEqual(player.intersect(100, 100, 100, 50), false, "Didn't intersect");

  });

  test("within", function() {
    var player = Crafty.e("2D").attr({
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
    var player = Crafty.e("2D").attr({
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
    var player = Crafty.e("2D").attr({
      w: 50,
      h: 50
    });
    var circle = new Crafty.circle(0, 0, 10);

    strictEqual(circle.containsPoint(1, 2), true, "Contained the point");
    strictEqual(circle.containsPoint(8, 9), false, "Didn't contain the point");

    circle.shift(1, 0);

    strictEqual(circle.x, 1, "Shifted of one pixel on the x axis");
    strictEqual(circle.y, 0, "circle.y didn't change");
    strictEqual(circle.radius, 10, "circle.radius didn't change");

  });

  test("child", function() {
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


  module("Collision");

  test("Collision constructors", function() {
    var newHitboxEvents = 0;
    var e = Crafty.e("2D, Collision")
              .bind("NewHitbox", function(newHitbox) {
                newHitboxEvents++;
              });

    var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
    e.collision(poly);
    ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");
    ok(e.map !== poly, "Hitbox is a clone of passed polygon");

    var arr = [50, 0, 100, 100, 0, 100];
    e.collision(arr);
    ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");
    ok(e.map.points && e.map.points !== arr, "Array used in hitbox is a clone of passed array");

    e.collision(50, 0, 100, 100, 0, 100);
    ok(e.map instanceof Crafty.polygon, "Hitbox is a polygon");

    strictEqual(newHitboxEvents, 3, "NewHitBox event triggered 3 times");
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
    var c1 = new Crafty.polygon([0,1, 50, 1, 50, 51, 0, 51]);
    var c2 = new Crafty.polygon([-10, -10, -10, 10, 10, 10, 10, -10]);
    strictEqual(e._SAT(c1, c2) !== false, true, "Polygons should test as overlapping");

  });

  test("adjustable boundary", function() {
    var e = Crafty.e("2D").attr({
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


  test("Resizing 2D objects & hitboxes", function() {
    var e = Crafty.e("2D, Collision");
    e.attr({
      x: 0,
      y: 0,
      w: 40,
      h: 50
    });

    equal(e.map.points[0], 0, "Before rotation: x_0 is 0");
    equal(e.map.points[1], 0, "y_0 is 0");
    equal(e.map.points[4], 40, "x_2 is 40");
    equal(e.map.points[5], 50, "y_2 is 50");

    e.rotation = 90;

    equal(Math.round(e.map.points[0]), 0, "After rotation by 90 deg: x_0 is 0");
    equal(Math.round(e.map.points[1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[4]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[5]), 40, "y_2 is 40");

    // After rotation the MBR will have changed
    equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    equal(Math.round(e._mbr._h), 40, "_mbr._h is  40");
    equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.collision(); // Check that regenerating the hitbox while rotated works correctly

    equal(Math.round(e.map.points[0]), 0, "After rotation and hitbox regeneration: x_0 is 0");
    equal(Math.round(e.map.points[1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[4]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[5]), 40, "y_2 is 40");


    // Check that changing the width when rotated resizes correctly for both hitbox and MBR
    // Rotated by 90 degrees, changing the width of the entity should change the height of the hitbox/mbr
    e.w = 100;

    equal(Math.round(e.map.points[0]), 0, "After rotation and increase in width: x_0 is 0");
    equal(Math.round(e.map.points[1]), 0, "y_0 is 0");
    equal(Math.round(e.map.points[4]), -50, "x_2 is -50");
    equal(Math.round(e.map.points[5]), 100, "y_2 is 100");

    // After rotation the MBR will have changed
    equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
    equal(Math.round(e._mbr._h), 100, "_mbr._h is  100");
    equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
    equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

    e.destroy();
  });

  test("Hitboxes outside of entities (CBR)", function() {
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

    ok(e._cbr === null, "_cbr should not exist");

    e.w = 10;

    ok(e._cbr !== null, "_cbr should now exist after entity shrinks");

    e.w = 20;

    ok(e._cbr === null, "_cbr should not exist after entity grows again");

  });

  test("CBRs should be removed on removal of component", function() {
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

    ok(e._cbr !== null, "_cbr should exist to begin with");

    e.removeComponent("Collision");

    ok(e._cbr === null, "_cbr should now be removed along with Collision");

  });


  module("Motion");

  test("Motion", function() {
    var Vector2D = Crafty.math.Vector2D;
    var zero = new Vector2D();
    var ent = Crafty.e("2D, Motion, AngularMotion")
      .attr({x: 0, y:0});

    // Check the initial zeroing of values
    ok(ent.velocity().equals(zero), "linear velocity should be zero");
    strictEqual(ent.vrotation, 0, "angular velocity should be zero");
    ok(ent.acceleration().equals(zero), "linear acceleration should be zero");
    strictEqual(ent.arotation, 0, "angular acceleration should be zero");
    ok(ent.motionDelta().equals(zero), "linear delta should be zero");
    strictEqual(ent.drotation, 0, "angular delta should be zero");

    // Check that you can't overwrite the motionDeltas
    ent.motionDelta().x = 20;
    ok(ent.motionDelta().equals(zero), "linear delta should not have changed");
    ent.drotation = 10;
    strictEqual(ent.drotation, 0, "angular delta should not have changed");


    // Set the v0 / v0_r values
    var v0 = new Vector2D(2,5); var v0_r = 10;

    // Check setting velocity and vrotation
    ent.velocity().setValues(v0);
    ent.vrotation = v0_r;
    ok(ent.velocity().equals(v0), "linear velocity should be <2,5>");
    strictEqual(ent.vrotation, v0_r, "angular velocity should be 10");

    // Check setting accelerations
    var a = new Vector2D(4,2); var a_r = -15;
    ent.acceleration().setValues(a);
    ent.arotation = a_r;
    ok(ent.acceleration().equals(a), "linear acceleration should be <4,2>");
    strictEqual(ent.arotation, a_r, "angular acceleration should be -15");

    // Check op assignment on various fields
    ent.velocity().x += 1;
    ent.velocity().y *= 2;
    ent.velocity().y -= 1;
    ok(ent.velocity().equals(new Vector2D(v0.x+1, v0.y*2-1)), "linear velocity should be <3,9>");
    ent.arotation += 5;
    strictEqual(ent.arotation, a_r + 5, "angular acceleration should be -10");

    // Reset the motion values back to 0
    ent.resetMotion();
    ent.resetAngularMotion();
    ok(ent.velocity().equals(zero), "linear velocity should be zero");
    strictEqual(ent.vrotation, 0, "angular velocity should be zero");
    ok(ent.acceleration().equals(zero), "linear acceleration should be zero");
    strictEqual(ent.arotation, 0, "angular acceleration should be zero");
    ok(ent.motionDelta().equals(zero), "linear delta should be zero");
    strictEqual(ent.drotation, 0, "angular delta should be zero");


    // v = (2, 5)
    ent.velocity().setValues(v0);
    // v0_r = 10
    ent.vrotation = v0_r;
    Crafty.timer.simulateFrames(1);
    var dt = 0.020; // 20 ms in 1 frame is the default
    // Check what happens to velocity over time with 0 a
    ok(ent.velocity().equals(v0), "velocity should be <2,5>");
    strictEqual(ent.vrotation, v0_r, "angular velocity should be 10");
    // Delta in last frame should be 
    equal(ent.motionDelta().x, v0.x * dt, "delta x should be .04");
    equal(ent.motionDelta().y, v0.y * dt, "delta y should be .1");
    // ok(ent.motionDelta().equals(v0), "delta should be <2,5>");
    strictEqual(ent.drotation, v0_r * dt, "angular delta should be 10");
    equal(ent.x, v0.x * dt, "entity x should be 2");
    equal(ent.y, v0.y * dt, "entity y should be 5");
    equal(ent.rotation, v0_r * dt, "entity rotation should be 10");


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

    ok(ent.motionDelta().equals(dPos), "delta should be equal to the new position");
    strictEqual(ent.drotation, dPos_r, "Rotation should match");
    equal(ent.x, dPos.x, "entity x should match calculated");
    equal(ent.y, dPos.y, "entity y should match calculate");
    equal(ent.rotation, dPos_r, "entity rotation should match calculated");
    var v1 = new Vector2D(a).scale(dt).add(v0), v1_r = a_r * dt + v0_r;
    equal(ent.velocity().x, v1.x, "vx should match calculated");
    equal(ent.velocity().y, v1.y, "vy should match calculated");
    // ok(ent.velocity().equals(v1), "linear velocity should match calculated");
    strictEqual(ent.vrotation, v1_r, "angular velocity should match calculated");

    ent.destroy();
  });

  test("Motion - changing vector", function() {
    var Vector2D = Crafty.math.Vector2D;
    var zero = new Vector2D();
    var ent = Crafty.e("2D, Motion")
      .attr({x: 0, y:0});
    var vec1 = ent.velocity();

    ent.vx = 5;

    equal(ent.velocity().x, 5, "Velocity component changed");

  });

  test("Motion - NewDirection Event", function(){
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
    equal(newDirectionFlag, true, "NewDirection was triggered");
  });

  test("AngularMotion - NewRotationDirection Event", function(){
    var e = Crafty.e("2D, AngularMotion")
      .attr({x: 10, y:10}); 
    e.vrotation = 0;
    e.arotation = -0.3;

    var newDirectionFlag = false;
    e.bind("NewRotationDirection", function(){
      newDirectionFlag = true;
    });
    Crafty.timer.simulateFrames(1);
    equal(newDirectionFlag, true, "NewDirection was triggered");
  });

  test("Motion - Events", function() {
    var Vector2D = Crafty.math.Vector2D;
    var zero = new Vector2D();
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
      equal(evt.x, 0, "[1] - no motion along x axis");
      equal(evt.y, 1, "[1] - moving along +y axis");
    });
    e.one("Moved", function(evt) { 
      strictEqual(evt.axis, "y", "[1] - moved along y axis"); 
      strictEqual(evt.oldValue, 0, "[1] - old y was 0"); 
    });
    e.one("MotionChange", function(evt) { 
      strictEqual(evt.key, "vy", "[1] - vy was set"); 
      strictEqual(evt.oldValue, 0, "[1] - old vy was 0");
    });
    e.vy = 1;
    Crafty.timer.simulateFrames(1);

    // group 2: set both vy and vx to be negative
    var old_y = e.y;
    e.one("NewDirection", function(evt) {
      equal(evt.x, -1, "[2] - Now moving along -x axis" );
      equal(evt.y, -1, "[2] - Now moving along -y axis");
    });
    e.one("Moved", function(evt) { 
      strictEqual(evt.axis, "x", "[2] - Moved along x axis"); 
      strictEqual(evt.oldValue, 0, "[2] - old x was 0"); 
      e.one("Moved", function(evt) { 
        strictEqual(evt.axis, "y", "[2] - Moved along y axis"); 
        strictEqual(evt.oldValue, old_y, "[2] - old y value matches cached"); 
      });
    });
    e.one("MotionChange", function(evt) { 
      strictEqual(evt.key, "vx", "[2] - vx was changed"); 
      strictEqual(evt.oldValue, 0, "[2] - old vx was 0");
    });
    e.vx = -1;
    e.one("MotionChange", function(evt) { 
      strictEqual(evt.key, "vy", "[2] - vy was changed");
      strictEqual(evt.oldValue, 1, "[2] - old vy value matches cached");
    });
    e.vy = 0;
    e.one("MotionChange", function(evt) { 
      strictEqual(evt.key, "vy", "[2] - vy was changed again");
      strictEqual(evt.oldValue, 0, "[2] - old vy value was 0");
    });
    e.vy = -1;
    e.vy = -1; // no MotionChange event was fired
    Crafty.timer.simulateFrames(1);

    // group 3 -- test newdireciton when we were previously moving
    e.vy = 1;
    e.vx = 0;
    e.one("NewDirection", function(evt) {
      equal(evt.x, 0, "[3] - not moving along x axis");
      equal(evt.y, 0, "[3] - not moving along y axis");
    });
    e.vy = 0;
    Crafty.timer.simulateFrames(1);


    
    // Group 4, rotation tests
    e.vrotation = 0; // no MotionChange event was fired
    e.one("MotionChange", function(evt) {
      strictEqual(evt.key, "vrotation", "[4] - change of angular speed");
      strictEqual(evt.oldValue, 0, "[4] - old vr value was 0"); 
    });
    e.vrotation = 1;
    e.one("MotionChange", function(evt) {
      strictEqual(evt.key, "vrotation", "[4] - change of angular speed");
      strictEqual(evt.oldValue, 1, "[4] - old value was 1");
    });
    e.vrotation = 0;

    // Group 5
    e.one("NewRotationDirection", function(evt) {
      equal(evt, 1, "[5] - Rotating in the positive sense");
    });
    e.one("Rotated", function(oldValue) {
      strictEqual(oldValue, 0, "[5] - Rotated from 0 position");
    });
    e.vrotation = 1;
    Crafty.timer.simulateFrames(1);

    var old_rotation = e.rotation;
    e.one("NewRotationDirection", function(evt) {
      equal(evt, -1, "[6] - Rotating in the negative sense");
    });
    e.one("Rotated", function(oldValue) {
      strictEqual(oldValue, old_rotation, "[6] - Old rotation matches cached value");
    });
    e.vrotation = -1;
    Crafty.timer.simulateFrames(1);

    old_rotation = e.rotation;
    e.one("NewRotationDirection", function(evt) {
      equal(evt, 1, "[7] - Rotating in the positive sense");
    });
    e.one("Rotated", function(oldValue) {
      strictEqual(oldValue, old_rotation, "[7] - Old rotation matches cached value");
    });
    e.vrotation = 1;
    Crafty.timer.simulateFrames(1);

    e.one("NewRotationDirection", function(evt) {
      equal(evt, 0, "[8] - No longer rotating");
    });
    e.vrotation = 0;
    Crafty.timer.simulateFrames(1);

    // TODO: break these up into separate checks
    equal(newDirectionEvents, 3, "NewDirection fired 3 times.");
    equal(newRotationDirectionEvents, 4, "NewRotationDirection fired 4 times.");
    equal(motionEvents, 13, "MotionChange fired 13 times.");
    equal(movedEvents, 3, "Moved fired 3 times.");
    equal(rotatedEvents, 3, "Rotated fired 3 times.");
    e.destroy();
  });

  test("Supportable", function() {
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
        ok(ent.ground, "entity should be on ground");
        strictEqual(obj, ent.ground, "ground object should be equal");
        ok(!previousGround, "previous ground should not exist");
        previousGround = obj;
        landedCount++;
      })
      .bind("LiftedOffGround", function(obj) {
        ok(!ent.ground, "entitiy should not be on ground");
        strictEqual(obj, previousGround, "ground object should be equal");
        ok(previousGround, "previous ground should exist");
        previousGround = null;
        liftedCount++;
      })
      .startGroundDetection("Ground");


    strictEqual(ent.ground, null, "entity should not be on ground");
    Crafty.timer.simulateFrames(1);
    strictEqual(ent.ground, null, "entity should not be on ground");

    ent.y = 5;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    equal(ent.y, 5, "ent y should not have changed");
    strictEqual(ent.ground, ground, "entity should be on ground");

    ent.y = 0;
    Crafty.timer.simulateFrames(1); // 1 lifted event should have occured
    equal(ent.y, 0, "ent y should not have changed");
    strictEqual(ent.ground, null, "entity should not be on ground");

    ent.y = 7;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    equal(ent.y, ground.y - ent.h, "ent y should have been snapped to ground");
    strictEqual(ent.ground, ground, "entity should be on ground");

    ent.y = 9;
    Crafty.timer.simulateFrames(1);
    equal(ent.y, 9, "ent y should not have changed");
    strictEqual(ent.ground, ground, "entity should be on ground");

    ent.y = 16;
    Crafty.timer.simulateFrames(1);
    equal(ent.y, 16, "ent y should not have changed");
    strictEqual(ent.ground, ground, "entity should be on ground");

    ent.y = 21;
    Crafty.timer.simulateFrames(1); // 1 lifted event & 1 landed event should have occured
    equal(ent.y, ground2.y - ent.h, "ent y should have been snapped to ground");
    strictEqual(ent.ground, ground2, "entity should be on ground2");

    ground.removeComponent("Ground");
    ground2.removeComponent("Ground");
    Crafty.timer.simulateFrames(1); // 1 lifted event should have occured
    equal(ent.y, ground2.y - ent.h, "ent y should not have changed");
    strictEqual(ent.ground, null, "entity should not be on ground");

    ground.addComponent("Ground");
    ground2.addComponent("Ground");
    ent.bind("CheckLanding", function(candidate) {
      if (candidate === ground)
        this.canLand = false;
    });
    ent.y = 7;
    Crafty.timer.simulateFrames(1); // no event should have occured
    equal(ent.y, 7, "ent y should not have changed");
    strictEqual(ent.ground, null, "entity should not be on ground");
    ent.y = 12;
    Crafty.timer.simulateFrames(1); // 1 landed event should have occured
    equal(ent.y, ground2.y - ent.h, "ent y should have been snapped to ground");
    strictEqual(ent.ground, ground2, "entity should be on ground2");

    equal(landedCount, 4, "landed count mismatch");
    equal(liftedCount, 3, "lifted count mismatch");

    ground.destroy();
    ground2.destroy();
    ent.destroy();
  });

  test("GroundAttacher", function() {
    var ground = Crafty.e("2D, Ground");
    var player = Crafty.e("2D, GroundAttacher");

    player.trigger("LandedOnGround", ground);
    ground.x = 10;
    strictEqual(player.x, 10, "player moved with ground");

    player.trigger("LiftedOffGround", ground);
    ground.x = 20;
    strictEqual(player.x, 10, "player did not move with ground");
  });


  test("Integrationtest - Gravity", function() {
    var done = false;

    var ground = Crafty.e("2D, platform")
          .attr({ x: 0, y: 280, w: 600, h: 20 });

    var player = Crafty.e("2D, Gravity")
          .attr({ x: 0, y: 100, w: 32, h: 16 })
          .gravityConst(0.3*50*50)
          .gravity("platform");
   
    strictEqual(player.acceleration().y, player._gravityConst, "acceleration should match gravity constant");

    var vel = -1;
    player.bind("EnterFrame", function() {
      if (!this.ground) {
        ok(this.velocity().y > vel, "velocity should increase");
        vel = this.velocity().y;
      } else {
        vel = -1;
      }
    });

    var landCount = 0, liftCount = 0;
    player.bind("LandedOnGround", function() {
      landCount++;
      strictEqual(this.acceleration().y, 0, "acceleration should be zero");
      strictEqual(this.velocity().y, 0, "velocity should be zero");

      if (landCount === 1) {
        this.bind("LiftedOffGround", function() {
          liftCount++;

          Crafty.timer.simulateFrames(3);
          vel = -1;

          var oldVel = this.velocity().y;
          this.gravityConst(0.2*50*50);
          strictEqual(this._gravityConst, 0.2*50*50, "gravity constant should have changed");
          strictEqual(this.acceleration().y, this._gravityConst, "acceleration should match gravity constant");
          strictEqual(this.velocity().y, oldVel, "velocity should not have been reset");
        });
        this.attr({y: 100});
      } else {
        strictEqual(landCount, 2, "two land on ground events should have been registered");
        strictEqual(liftCount, 1, "one lift off ground event should have been registered");

        ground.destroy();
        player.destroy();

        done = true;
      }
    });

    Crafty.timer.simulateFrames(75);
    ok(done, "Test completed");
  });


  test("Integrationtest - Twoway", function() {
    var done = false;

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
            this.trigger("KeyDown", {key: Crafty.keys.UP_ARROW});
            if (this.velocity().y < -this._jumpSpeed)
              ok(false, "Twoway should not modify velocity");
          });
        });

        this.trigger("KeyDown", {key: Crafty.keys.UP_ARROW});
      } else {
        strictEqual(landCount, 2, "two land on ground events should have been registered");
        strictEqual(liftCount, 1, "one lift off ground event should have been registered");

        ground.destroy();
        player.destroy();

        this.trigger("KeyUp", {key: Crafty.keys.UP_ARROW});
        this.trigger("KeyUp", {key: Crafty.keys.UP_ARROW});
        done = true;
      }
    });

    Crafty.timer.simulateFrames(75);
    ok(done, "Test completed");
  });

})();
