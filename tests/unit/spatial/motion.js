(function() {
  var module = QUnit.module;
  var test = QUnit.test;

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
        rotatedEvents = 0,
        motionEvents = 0;
    e.bind("NewDirection", function(evt) {
      newDirectionEvents++;
    });
    e.bind("NewRotationDirection", function(evt) {
      newRotationDirectionEvents++;
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
    e.one("MotionChange", function(evt) { 
      _.strictEqual(evt.key, "vy", "[1] - vy was set"); 
      _.strictEqual(evt.oldValue, 0, "[1] - old vy was 0");
    });
    e.vy = 1;
    Crafty.timer.simulateFrames(1);

    // group 2: set both vy and vx to be negative
    e.one("NewDirection", function(evt) {
      _.strictEqual(evt.x, -1, "[2] - Now moving along -x axis" );
      _.strictEqual(evt.y, -1, "[2] - Now moving along -y axis");
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
    _.strictEqual(rotatedEvents, 3, "Rotated fired 3 times.");
    e.destroy();
  });

})();
