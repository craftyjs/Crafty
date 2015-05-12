(function() {
  var module = QUnit.module;

  module("Tween");

  test("Tween", function() {
    var e = Crafty.e("2D, Tween");
    e.x = 0;
    e.y = 10;
    var ret = e.tween({
      x: 10,
      y: 16
    }, 200); // 10 frames == 200 ms by efault
    equal(ret, e, ".tween() returned self correctly");
    Crafty.timer.simulateFrames(5);
    equal(Round(e.x), 5, "Halfway tweened x");
    equal(Round(e.y), 13, "Halfway tweened y");
    Crafty.timer.simulateFrames(10);
    equal(e.x, 10, "Fully tweened x");
    equal(e.y, 16, "Fully tweened y");
  });

  test("Tween with quadratic easing function", function() {
    var e = Crafty.e("2D, Tween");
    e.x = 0;
    var ret = e.tween({
      x: 16
    }, 200, function(t){return (t*t);}); // 10 frames == 200 ms by efault
    Crafty.timer.simulateFrames(5);
    equal(Round(e.x), 4, "At halfway point, x is a quarter of original value");
    Crafty.timer.simulateFrames(10);
    equal(e.x, 16, "Fully tweened x");
  });

  asyncTest('correct tweening', function() {
    expect(1);

    var e1 = Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    e1.bind('TweenEnd', function() {
      ok(this.x === 100);
      start();
    });
  });

  asyncTest('correct tweening with multiple entities', function() {
    expect(1);

    var e1 = Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    var e2 = Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    e1.bind('TweenEnd', function() {
      ok(this.x === 100);
      start();
    });
  });
})();