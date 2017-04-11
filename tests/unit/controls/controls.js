(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Controls");
  
  test("Multiway and Fourway", function(_) {
    var e = Crafty.e("2D, Fourway")
                  .attr({ x: 0, y: 0});

    
    e.multiway(50, { W: -90 });
    keysDown(Crafty.keys.W);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, -50, "Speed is 50 in -y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Change the key's direction and speed while it's held down
    e.attr({x:0, y:0});
    e.multiway(100, { W: 90 });
    Crafty.timer.simulateFrames(1, 20);
    _.strictEqual(e._vy, 100, "Speed is 100 in +y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Change the speed with fourway, (W is negative for fourway)
    e.attr({x:0, y:0});
    e.fourway(50);
    Crafty.timer.simulateFrames(1, 20);
    _.strictEqual(e._vy, -50, "Speed is 50 in -y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Test two keys down at the same time
    keysDown(Crafty.keys.UP_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, -50, "Still speed 50 in -y direction after up arrow");

    keysUp('W');
    _.strictEqual(e._vy, -50, "Still speed 50 in -y direction after W is released");
    e.isDown = function(key) {
        return false;
    };
   keysUp(Crafty.keys.UP_ARROW);
   Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed is 0 once both keys are released");

    // Diagonal
    keysDown(Crafty.keys.DOWN_ARROW, Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 50, "Speed is 50 in +y direction when DOWN & LEFT are pressed");
    _.strictEqual(e._vx, -50, "Speed is 50 in -x direction when DOWN & LEFT are pressed");

    keysUp(Crafty.keys.DOWN_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed is 0 in y direction after DOWN is released");
    _.strictEqual(e._vx, -50, "Speed is still 50 in -x direction");

    e.removeComponent("Multiway");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed set to 0 when component removed");
    _.strictEqual(e._vx, 0, "Speed set to 0 when component removed");

    keysUp(Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "No change when key released after component removed");
    _.strictEqual(e._vx, 0, "No change when key released after component is removed");

    Crafty.resetKeyDown(); 

    e.destroy();
  });

  test("disableControl and enableControl and speed", function(_) {
    var e = Crafty.e("2D, Twoway")
      .attr({ x: 0 })
      .twoway();

    _.strictEqual(e._vx, 0, "vx starts equal to 0");

    e.enableControl();
    e.speed({ x: 50, y: 50 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "No change in speed after Twoway speed is set");

    e.disableControl();
    keysDown(Crafty.keys.D);    
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 when key D pressed while control is disabled");

    e.enableControl();
    Crafty.timer.simulateFrames(1);    
    _.strictEqual(e._vx, 50, "vx = 50 once control is enabled while D key is down");

    e.disableControl();
    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1); 
    _.strictEqual(e._vx, 50, "vx = 50 when key is released while control disabled");

    e._vx = 17;
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 17, "vx = 17 after being explicitly set while control disabled");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once control is enabled and no key is held");

    e.disableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 if control disabled a second time");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once control re-enabled");

    keysDown(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx = 50 once D key pressed again");

    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once key released");

    keysDown(Crafty.keys.D, Crafty.keys.RIGHT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx = 50 when both RIGHT and D pressed");

    e.disableControl();
    e.speed({ x: 100, y: 100 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx remains 50 when control disabled and speed set");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 100, "vx = 100 when control re-enabled while keys are still held down");

    e.speed({ x: 150, y: 150 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 150, "vx = 150 when speed updated");

    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 150, "vx = 150 when D is released but RIGHT is still down");

    keysUp(Crafty.keys.RIGHT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once both keys are released");

    e.destroy();
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