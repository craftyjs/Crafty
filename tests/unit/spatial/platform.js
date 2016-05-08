(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Platform");

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
    player.bind("UpdateFrame", function() {
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

})();
