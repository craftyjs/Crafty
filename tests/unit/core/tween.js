(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Tween", {
    beforeEach: function() {
      // enable timer before each test in this module
      Crafty.pause(false);
    },
    afterEach: function() {
      // disable timer after each test in this module
      Crafty.pause(true);
    }
  });

  test("Tween", function(_) {
    var e = Crafty.e("2D, Tween");
    e.x = 0;
    e.y = 10;
    var ret = e.tween({
      x: 10,
      y: 16
    }, 200); // 10 frames == 200 ms by efault
    _.strictEqual(ret, e, ".tween() returned self correctly");
    Crafty.timer.simulateFrames(5);
    _.strictEqual(Round(e.x), 5, "Halfway tweened x");
    _.strictEqual(Round(e.y), 13, "Halfway tweened y");
    Crafty.timer.simulateFrames(10);
    _.strictEqual(e.x, 10, "Fully tweened x");
    _.strictEqual(e.y, 16, "Fully tweened y");
  });

  test("Tween with quadratic easing function", function(_) {
    var e = Crafty.e("2D, Tween");
    e.x = 0;
    e.tween({
      x: 16
    }, 200, function(t){return (t*t);}); // 10 frames == 200 ms by efault
    Crafty.timer.simulateFrames(5);
    _.strictEqual(Round(e.x), 4, "At halfway point, x is a quarter of original value");
    Crafty.timer.simulateFrames(10);
    _.strictEqual(e.x, 16, "Fully tweened x");
  });

  test('correct tweening', function(_) {
    _.expect(1);
    var done = _.async();

    var e1 = Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    e1.bind('TweenEnd', function() {
      _.ok(this.x === 100);
      done();
    });
  });

  test('correct tweening with multiple entities', function(_) {
    _.expect(1);
    var done = _.async();

    var e1 = Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    Crafty.e('2D, Tween')
      .attr({
        x: 0,
        y: 0
      })
      .tween({
        x: 100
      }, 50);
    e1.bind('TweenEnd', function() {
      _.ok(this.x === 100);
      done();
    });
  });
})();