var reset = function() {
  Crafty("*").destroy();
  Crafty.viewport.reset();
  Crafty.viewport.scroll('_x', 0);
  Crafty.viewport.scroll('_y', 0);
  Crafty.viewport.clampToEntities = true;

}

test("simulateFrames", function() {
  var framesPlayed = 0;
  Crafty.bind("EnterFrame", function() {
    framesPlayed++;
  });
  Crafty.timer.simulateFrames(1);
  equal(framesPlayed, 1, "A frame should have been simulated");

  Crafty.timer.simulateFrames(100);
  equal(framesPlayed, 101, "101 frames should have been simulated");
})



module("Viewport", {
  setup: function() {
    reset();
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

test("scroll using _x, _y", function() {
  var e = Crafty.e("2D, DOM").attr({
    x: 50,
    y: 50
  });
  var before = Crafty.DOM.translate(e.x, e.y);

  Crafty.viewport.scroll('_x', 100);
  equal(before.x - Crafty.DOM.translate(e.x, e.y).x, 100, "Scroll in x direction");

  Crafty.viewport.scroll('_y', 70);
  equal(before.y - Crafty.DOM.translate(e.x, e.y).y, 70, "Scroll in y direction");

  Crafty.viewport.scroll('_x', 0);
  Crafty.viewport.scroll('_y', 0);
  equal(before.x - Crafty.DOM.translate(e.x, e.y).x, 0, "Scroll to 0");
  equal(before.y - Crafty.DOM.translate(e.x, e.y).y, 0, "Scroll to 0");
});

test("scroll using x, y", function() {
  var e = Crafty.e("2D, DOM").attr({
    x: 50,
    y: 50
  });
  var before = Crafty.DOM.translate(e.x, e.y);

  Crafty.viewport.scroll('x', 100);
  equal(before.x - Crafty.DOM.translate(e.x, e.y).x, 100, "Scroll in x direction");

  Crafty.viewport.scroll('y', 70);
  equal(before.y - Crafty.DOM.translate(e.x, e.y).y, 70, "Scroll in y direction");

  Crafty.viewport.scroll('x', 0);
  Crafty.viewport.scroll('y', 0);
  equal(before.x - Crafty.DOM.translate(e.x, e.y).x, 0, "Scroll to 0");
  equal(before.y - Crafty.DOM.translate(e.x, e.y).y, 0, "Scroll to 0");
});

test("follow", function() {
  Crafty.viewport.clampToEntities = false;
  var e = Crafty.e("2D, DOM").attr({
    x: Crafty.viewport.width + 100,
    y: Crafty.viewport.height + 70
  });
  Crafty.viewport.follow(e, 0, 0);
  equal(Crafty.viewport._x, (-(Crafty.viewport.width / 2 + 100)), "Center viewport on entity.x");
  equal(Crafty.viewport._y, (-(Crafty.viewport.height / 2 + 70)), "Center viewport on entity.y");

});

test("pan", function() {
  Crafty.viewport.clampToEntities = false;
  Crafty.e("2D, DOM").attr({
    x: 0,
    y: 0,
    w: Crafty.viewport.width * 2,
    h: Crafty.viewport.height * 2
  });

  var done = 0;
  var panDone = function() {
    done++
  };
  Crafty.one("CameraAnimationDone", panDone);

  Crafty.viewport.pan(100, 0, 10 * 20);
  Crafty.timer.simulateFrames(5);
  equal(Crafty.viewport._x, -50, "Pan half the way on half the time");
  equal(done, 0, "CameraAnimationDone hasn't fired yet");
  Crafty.timer.simulateFrames(5);
  equal(Crafty.viewport._x, -100, "Pan all the way when all the time is spent");
  equal(done, 1, "CameraAnimationDone has fired once");

  done = 0;
  Crafty.one("CameraAnimationDone", panDone);
  Crafty.viewport.pan(0, 100, 10);
  Crafty.timer.simulateFrames(20);
  equal(Crafty.viewport._y, -100, "Pan all the way and stay there");
  equal(done, 1, "CameraAnimationDone has fired once");

  Crafty.viewport.scroll('x', 0);
  Crafty.viewport.scroll('y', 0);
});

test("zoom", function() {

  Crafty.viewport.clampToEntities = false;

  var done = 0;
  var panDone = function() {
    done++
  };
  Crafty.one("CameraAnimationDone", panDone);

  Crafty.e("2D, DOM").attr({
    x: 0,
    y: 0,
    w: Crafty.viewport.width * 2,
    h: Crafty.viewport.height * 2
  });
  Crafty.viewport.scroll('x', 0);
  Crafty.viewport.scroll('y', 0);
  Crafty.viewport.scale(1);

  Crafty.viewport.zoom(2, 0, 0, 10 * 20);
  Crafty.timer.simulateFrames(5);

  equal(Crafty.viewport._scale, Math.sqrt(2), "Zooms sqrt(2) in half the time");
  equal(done, 0, "CameraAnimationDone hasn't fired yet");

  Crafty.timer.simulateFrames(5);
  equal(Crafty.viewport._x, Crafty.viewport.width / 4, "move all the way when all the time is spent");
  equal(Crafty.viewport._y, Crafty.viewport.height / 4, "move all the way when all the time is spent");
  equal(Crafty.viewport._scale, 2, "Zooms all the way in full time.");
  equal(done, 1, "CameraAnimationDone has fired once");

});

test("centerOn", function() {
  var e = Crafty.e("2D, DOM").attr({
    x: 0,
    y: 0,
    w: Crafty.viewport.width * 2,
    h: Crafty.viewport.height * 2
  });
  Crafty.viewport.clampToEntities = false;

  var done = 0;
  var panDone = function() {
    done++
  };
  Crafty.one("CameraAnimationDone", panDone);


  Crafty.viewport.centerOn(e, 10);
  Crafty.timer.simulateFrames(10);

  equal(Crafty.viewport._x, -e.w / 2 + Crafty.viewport.width / 2, "Entity centered after exact duration");
  equal(done, 1, "CameraAnimationDone has fired once");
  done = 0;
  Crafty.one("CameraAnimationDone", panDone);
  Crafty.timer.simulateFrames(10);
  equal(Crafty.viewport._x, -e.w / 2 + Crafty.viewport.width / 2, "Entity still centered 10 frames later");
  equal(done, 0, "CameraAnimationDone doesn't fire after completion");

  var e2 = Crafty.e("2D, DOM").attr({
    x: 450,
    y: 450,
    w: 20,
    h: 20
  });
  Crafty.viewport.scroll('x', 1500);
  Crafty.viewport.scroll('y', 300);
  Crafty.viewport.centerOn(e2, 1);
  Crafty.timer.simulateFrames(1);
  equal(Crafty.viewport._x, (-(e2.x + e2.w / 2 - Crafty.viewport.width / 2)), "Entity centered from non-zero origin");
  equal(Crafty.viewport._y, (-(e2.y + e2.h / 2 - Crafty.viewport.height / 2)), "Entity centered from non-zero origin");

  Crafty.viewport.clampToEntities = true;
  Crafty.viewport.scroll('x', 0);
  Crafty.viewport.scroll('y', 0);
});

module("Crafty.timer", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});
test("curTime", 1, function() {
  var startTime, lastKnownTime;
  Crafty.e("").bind("EnterFrame", function(params) {
    if (!startTime) {
      startTime = params.gameTime;
    } else {
      lastKnownTime = params.gameTime;
    }
  });

  setTimeout(function() {
    var endTime = lastKnownTime;
    ok(endTime > startTime, "EndTime " + endTime + " must be larger than StartTime " + startTime);
    start();
  }, 100);
  stop(); // pause the QUnit so the timeout has time to complete.
});