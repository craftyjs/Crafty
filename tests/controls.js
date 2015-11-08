(function() {
  var module = QUnit.module;

  module("Controls");

  test("Multiway and Fourway", function() {
    var e = Crafty.e("2D, Fourway")
                  .attr({ x: 0, y: 0});

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.W
    });
    e.isDown = function(key) {
        if (key === Crafty.keys.W)
            return true;
        return false;
    };
    e.multiway(50, { W: -90 });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -50, "Speed is 50 in -y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");
    equal(e._y, -1, "Moves 1 pixel down in 20 ms");

    // Change the key's direction and speed while it's held down
    e.attr({x:0, y:0});
    e.multiway(100, { W: 90 });
    Crafty.timer.simulateFrames(1, 20);
    equal(e._vy, 100, "Speed is 100 in +y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");
    equal(e._y, 2, "Moves 2 pixels up in 20 ms");

    // Change the speed with fourway, (W is negative for fourway)
    e.attr({x:0, y:0});
    e.fourway(50);
    Crafty.timer.simulateFrames(1, 20);
    equal(e._vy, -50, "Speed is 50 in -y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");
    equal(e._y, -1, "Moves down 1 pixel in 20 ms");

    Crafty.timer.simulateFrames(1);
    equal(e._y, -2, "Moves another 1 pixel down in 20 ms");

    // Test two keys down at the same time
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.UP_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -50, "Still speed 50 in -y direction after up arrow");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.W
    });
    equal(e._vy, -50, "Still speed 50 in -y direction after W is released");
    e.isDown = function(key) {
        return false;
    };
    Crafty.trigger('KeyUp', {
      key: Crafty.keys.UP_ARROW
    });
    equal(e._vy, 0, "Speed is 0 once both keys are released");

    // Diagonal
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.DOWN_ARROW
    });
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.LEFT_ARROW
    });
    equal(e._vy, 50, "Speed is 50 in +y direction when DOWN & LEFT are pressed");
    equal(e._vx, -50, "Speed is 50 in -x direction when DOWN & LEFT are pressed");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.DOWN_ARROW
    });
    equal(e._vy, 0, "Speed is 0 in y direction after DOWN is released");
    equal(e._vx, -50, "Speed is still 50 in -x direction");

    e.removeComponent("Multiway");
    equal(e._vy, 0, "Speed set to 0 when component removed");
    equal(e._vx, 0, "Speed set to 0 when component removed");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.LEFT_ARROW
    });
    equal(e._vy, 0, "No change when key released after component removed");
    equal(e._vx, 0, "No change when key released after component is removed");


    e.destroy();
  });

  test("disableControl and enableControl and speed", function() {
    var e = Crafty.e("2D, Twoway")
      .attr({ x: 0 })
      .twoway();

    equal(e._vx, 0, "vx starts equal to 0");
    equal(e._x, 0, "No change in _x when twoway is called");

    e.enableControl();
    e.speed({ x: 50, y: 50 });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0, "No change in speed after Twoway speed is set");
    equal(e._x, 0);

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 50, "vx = 50 when key D pressed");
    equal(e._vy, 0, "vy = 0 when key D pressed");

    e.disableControl();
    equal(e._vx, 0, "vx = 0 once control is disabled");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    equal(e._vx, 0, "vx = 0 when key is released while control is disabled");

    e.disableControl();
    equal(e._vx, 0, "vx = 0 if control disabled a second time");

    e.enableControl();
    equal(e._vx, 0, "vx = 0 once control re-enabled");

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    equal(e._vx, 50, "vx = 50 once D key pressed again");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    equal(e._vx, 0, "vx = 0 once key released");


    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.RIGHT_ARROW
    });
    equal(e._vx, 50, "vx = 50 when both RIGHT and D pressed");

    e.disableControl();
    e.speed({ x: 100, y: 100 });
    equal(e._vx, 0, "vx = 0 when control disabled and speed set");

    e.enableControl();
    equal(e._vx, 100, "vx = 100 when control re-enabled while keys are still held down");

    e.speed({ x: 150, y: 150 });
    equal(e._vx, 150, "vx = 150 when speed updated");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    equal(e._vx, 150, "vx = 150 when D is released but RIGHT is still down");

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.RIGHT_ARROW
    });
    equal(e._vx, 0, "vx = 0 once both keys are released");

    e.destroy();
  });

})();