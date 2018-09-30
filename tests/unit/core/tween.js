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
    var ret = e.tween(
      {
        x: 10,
        y: 16
      },
      200
    ); // 10 frames == 200 ms by efault
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
    e.tween(
      {
        x: 16
      },
      200,
      function(t) {
        return t * t;
      }
    ); // 10 frames == 200 ms by default
    Crafty.timer.simulateFrames(5);
    _.strictEqual(
      Round(e.x),
      4,
      "At halfway point, x is a quarter of original value"
    );
    Crafty.timer.simulateFrames(10);
    _.strictEqual(e.x, 16, "Fully tweened x");
  });

  test("correct tweening", function(_) {
    _.expect(1);
    var done = _.async();

    var e1 = Crafty.e("2D, Tween")
      .attr({
        x: 0,
        y: 0
      })
      .tween(
        {
          x: 100
        },
        50
      );
    e1.bind("TweenEnd", function() {
      _.ok(this.x === 100);
      done();
    });
  });

  test("correct tweening with multiple entities", function(_) {
    _.expect(1);
    var done = _.async();

    var e1 = Crafty.e("2D, Tween")
      .attr({
        x: 0,
        y: 0
      })
      .tween(
        {
          x: 100
        },
        50
      );
    Crafty.e("2D, Tween")
      .attr({
        x: 0,
        y: 0
      })
      .tween(
        {
          x: 100
        },
        50
      );
    e1.bind("TweenEnd", function() {
      _.ok(this.x === 100);
      done();
    });
  });

  test("pause and resume tween", function(_) {
    var actualTweens = [],
      fired = 0;

    var e = Crafty.e("2D, Tween")
      .tween({ x: 100 }, 100) // 5 frames == 100 ms by default
      .tween({ y: 50, z: 300 }, 200) // 10 frames = 200ms by default
      .bind("TweenEnd", function(props) {
        ++fired;
        actualTweens = actualTweens.concat(Object.keys(props).sort());
      });

    // no progress if paused
    e.pauseTweens();
    Crafty.timer.simulateFrames(10 + 2);
    _.strictEqual(fired, 0, "no events fired");
    _.deepEqual(actualTweens, [], "no tweens finished");
    _.strictEqual(e.x, 0, "start position");
    _.strictEqual(e.y, 0, "start position");
    _.strictEqual(e.z, 0, "start position");

    // x finished after resume
    e.resumeTweens();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(fired, 1, "1 event fired");
    _.deepEqual(actualTweens, ["x"], "x tween finished");
    _.strictEqual(e.x, 100, "end position");
    _.strictEqual(e.y, 25, "mid position");
    _.strictEqual(e.z, 150, "mid position");

    // no progress on pausing again
    e.pauseTweens();
    Crafty.timer.simulateFrames(10 + 2);
    _.strictEqual(fired, 1, "1 event fired");
    _.deepEqual(actualTweens, ["x"], "x tween finished");
    _.strictEqual(e.x, 100, "end position");
    _.strictEqual(e.y, 25, "mid position");
    _.strictEqual(e.z, 150, "mid position");

    // all finished after resume
    e.resumeTweens();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(fired, 2, "2 events fired");
    _.deepEqual(actualTweens, ["x", "y", "z"], "all tweens finished");
    _.strictEqual(e.x, 100, "end position");
    _.strictEqual(e.y, 50, "end position");
    _.strictEqual(e.z, 300, "end position");

    // no change after all finished
    Crafty.timer.simulateFrames(10 + 2);
    _.strictEqual(fired, 2, "2 events fired");
    _.deepEqual(actualTweens, ["x", "y", "z"], "all tweens finished");
    _.strictEqual(e.x, 100, "end position");
    _.strictEqual(e.y, 50, "end position");
    _.strictEqual(e.z, 300, "end position");
  });

  test(".tweenSpeed", function(_) {
    var actualTweens = [],
      fired = 0;

    var e = Crafty.e("2D, Tween")
      .tween({ y: 50, z: 300 }, 200) // 10 frames = 200ms by default
      .bind("TweenEnd", function(props) {
        ++fired;
        actualTweens = actualTweens.concat(Object.keys(props).sort());
      });

    // no progress if paused
    e.tweenSpeed = 0.5;
    Crafty.timer.simulateFrames(10);
    _.strictEqual(fired, 0, "no events fired");
    _.deepEqual(actualTweens, [], "no tweens finished");
    _.strictEqual(e.y, 25, "mid position");
    _.strictEqual(e.z, 150, "mid position");

    e.tweenSpeed = 1.0;
    Crafty.timer.simulateFrames(5 + 1);
    _.strictEqual(fired, 1, "1 event fired");
    _.deepEqual(actualTweens, ["y", "z"], "y and z tween finished");
    _.strictEqual(e.y, 50, "end position");
    _.strictEqual(e.z, 300, "end position");
  });

  test("cancel tween", function(_) {
    _.expect(12); // 3[x,y,z-start] + 2[x,z]*3[TweenEnd] + 3[x,y,z-end] assertions

    var fired = 0,
      expectedTweens = ["x", "z"];

    var e = Crafty.e("2D, Tween")
      .tween({ x: 100 }, 100) // 5 frames == 100 ms by default
      .tween({ y: 100, z: 100 }, 200) // 10 frames == 200 ms by default
      .bind("TweenEnd", function(props) {
        _.strictEqual(Object.keys(props).length, 1, "one tween prop ended");
        var prop = Object.keys(props)[0];

        _.strictEqual(
          prop,
          expectedTweens[fired++],
          "tween prop ended at expected time"
        );
        _.strictEqual(this[prop], 100, "tween prop ended at expected position");

        // cancel "y" tween prop after 100ms
        if (fired === 1) this.cancelTween("y");
      });

    // check tween start pos
    _.strictEqual(e.x, 0, "start position");
    _.strictEqual(e.y, 0, "start position");
    _.strictEqual(e.z, 0, "start position");

    Crafty.timer.simulateFrames(10);

    // check tween end position
    _.strictEqual(e.x, 100, "end position");
    _.strictEqual(e.y, 50, "end position");
    _.strictEqual(e.z, 100, "end position");
  });

  test("fully cancelled tween should not trigger TweenEnd event", function(_) {
    var fired = false;

    Crafty.e("2D, Tween")
      .tween({ x: 100, y: 100 }, 200) // 10 frames == 200 ms by default
      .cancelTween("x")
      .cancelTween("y")
      .bind("TweenEnd", function() {
        fired = true;
      });
    Crafty.timer.simulateFrames(10 + 2);
    _.notOk(fired, "TweenEnd shouldn't have fired.");

    fired = false;
    var tweenObj = { x: 100, y: 100 };
    Crafty.e("2D, Tween")
      .tween(tweenObj, 200) // 10 frames == 200 ms by default
      .cancelTween(tweenObj)
      .bind("TweenEnd", function() {
        fired = true;
      });
    Crafty.timer.simulateFrames(10 + 2);
    _.notOk(fired, "TweenEnd shouldn't have fired.");
  });
})();
