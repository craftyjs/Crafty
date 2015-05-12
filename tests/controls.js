(function() {
  var module = QUnit.module;

  module("Controls");

  test("Multiway", function() {
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
    e.multiway(1, { W: -90 });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -1);
    equal(e._y, -1);

    e.multiway(2, { W: 90 });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 2);
    equal(e._y, 1);

    e.fourway(1);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -1);
    equal(e._y, 0);

    Crafty.timer.simulateFrames(1);
    equal(e._vy, -1);
    equal(e._y, -1);

    
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.UP_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -1);
    equal(e._y, -2);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.W
    });
    e.isDown = function(key) {
        return false;
    };
    Crafty.trigger('KeyUp', {
      key: Crafty.keys.UP_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0);
    equal(e._y, -2);


    Crafty.trigger('KeyDown', {
      key: Crafty.keys.DOWN_ARROW
    });
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.LEFT_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 1);
    equal(e._y, -1);
    equal(e._vx, -1);
    equal(e._x, -1);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.DOWN_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0);
    equal(e._y, -1);
    equal(e._vx, -1);
    equal(e._x, -2);

    e.removeComponent("Multiway");
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0);
    equal(e._y, -1);
    equal(e._vx, 0);
    equal(e._x, -2);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.LEFT_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0);
    equal(e._y, -1);
    equal(e._vx, 0);
    equal(e._x, -2);


    e.destroy();
  });

  test("disableControl and enableControl and speed", function() {
    var e = Crafty.e("2D, Twoway")
      .attr({ x: 0 })
      .twoway();

    equal(e._vx, 0);
    equal(e._x, 0);

    e.enableControl();
    e.speed({ x: 1, y: 1 });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 0);

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 1);
    equal(e._x, 1);

    e.disableControl();
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 1);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 1);

    e.disableControl();
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 1);


    e.enableControl();
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 1);

    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 1);
    equal(e._x, 2);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 2);


    Crafty.trigger('KeyDown', {
      key: Crafty.keys.D
    });
    Crafty.trigger('KeyDown', {
      key: Crafty.keys.RIGHT_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 1);
    equal(e._x, 3);

    e.disableControl();
    e.speed({ x: 2, y: 2 });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 3);

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 2);
    equal(e._x, 5);

    e.speed({ x: 3, y: 3 });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 3);
    equal(e._x, 8);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.D
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 3);
    equal(e._x, 11);

    Crafty.trigger('KeyUp', {
      key: Crafty.keys.RIGHT_ARROW
    });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0);
    equal(e._x, 11);


    e.destroy();
  });

})();