(function() {
  module("Viewport", {
    setup: function() {
      resetStage();
    },

    teardown: function() {
      resetStage();
    }
  });

  test("scroll using _x, _y", function() {
    var e = Crafty.e("2D, DOM").attr({
      x: 50,
      y: 50
    });
    var before = Crafty.domHelper.translate(e.x, e.y);

    Crafty.viewport.scroll('_x', 100);
    equal(before.x - Crafty.domHelper.translate(e.x, e.y).x, 100, "Scroll in x direction");

    Crafty.viewport.scroll('_y', 70);
    equal(before.y - Crafty.domHelper.translate(e.x, e.y).y, 70, "Scroll in y direction");

    Crafty.viewport.scroll('_x', 0);
    Crafty.viewport.scroll('_y', 0);
    equal(before.x - Crafty.domHelper.translate(e.x, e.y).x, 0, "Scroll to 0");
    equal(before.y - Crafty.domHelper.translate(e.x, e.y).y, 0, "Scroll to 0");
  });

  test("scroll using x, y", function() {
    var e = Crafty.e("2D, DOM").attr({
      x: 50,
      y: 50
    });
    var before = Crafty.domHelper.translate(e.x, e.y);

    Crafty.viewport.scroll('x', 100);
    equal(before.x - Crafty.domHelper.translate(e.x, e.y).x, 100, "Scroll in x direction");

    Crafty.viewport.scroll('y', 70);
    equal(before.y - Crafty.domHelper.translate(e.x, e.y).y, 70, "Scroll in y direction");

    Crafty.viewport.scroll('x', 0);
    Crafty.viewport.scroll('y', 0);
    equal(before.x - Crafty.domHelper.translate(e.x, e.y).x, 0, "Scroll to 0");
    equal(before.y - Crafty.domHelper.translate(e.x, e.y).y, 0, "Scroll to 0");
  });

  test("Viewport resizing", function(){
    var flag = 0;
    var e = Crafty("2D, Canvas");
    
    var layer = Crafty.canvasLayer;
    layer.init();
    
    var w = Crafty.viewport.width;

    equal( layer._canvas.width, Crafty.viewport.width, "Initial canvas size matches viewport");
    equal(Crafty.stage.elem.style.width, Crafty.viewport.width + "px", "Initial stage size matches viewport");
    Crafty.bind("ViewportResize", function(){flag++;});

    Crafty.viewport.width += 10;

    equal(flag, 1, "ViewportResize triggered");
    equal(Crafty.viewport.width, w+10, "Viewport increased in width");
    equal( layer._canvas.width, Crafty.viewport.width , "Canvas size matches viewport after change");
    equal(Crafty.stage.elem.style.width, Crafty.viewport.width +"px", "Stage size matches viewport after change");

    var h = Crafty.viewport.height;

    Crafty.viewport.height += 10;

    equal(flag, 2, "ViewportResize triggered");
    equal(Crafty.viewport.height, h+10, "Viewport increased in width");
    equal( layer._canvas.height, Crafty.viewport.height , "Canvas size matches viewport after change");
    equal(Crafty.stage.elem.style.height, Crafty.viewport.height +"px", "Stage size matches viewport after change");

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

    var done = 0;
    var panDone = function() {
      done++;
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

  });

  test("pan with easing", function() {
    Crafty.viewport.clampToEntities = false;

    Crafty.viewport.pan(100, 0, 10 * 20, "easeInQuad");
    Crafty.timer.simulateFrames(5);
    equal(Crafty.viewport._x, -25, "Pan quarter of the way on half the time");
    Crafty.timer.simulateFrames(5);
    equal(Crafty.viewport._x, -100, "Pan all the way when all the time is spent");
  });

  test("zoom", function() {

    Crafty.viewport.clampToEntities = false;

    var done = 0;
    var panDone = function() {
      done++;
    };
    Crafty.one("CameraAnimationDone", panDone);

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
      done++;
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
  });

  test("viewport.reset() gives correct values", function() {
    Crafty.viewport.clampToEntities = false;
    Crafty.viewport.scroll('_x', 50);
    Crafty.viewport.scroll('_y', 50);
    Crafty.viewport.scale(2);
    equal(Crafty.viewport._x, 50, "Viewport starts scrolled");
    equal(Crafty.viewport._y, 50, "Viewport starts scrolled");
    equal(Crafty.viewport._scale, 2, "Viewport starts scaled");
    Crafty.viewport.reset();
    equal(Crafty.viewport._x, 0, "Viewport _x is reset");
    equal(Crafty.viewport._y, 0, "Viewport _y is reset");
    equal(Crafty.viewport._scale, 1, "Viewport _scale is reset");
    Crafty.viewport.clampToEntities = true;
  });

  test("viewport.reset() triggers StopCamera", function() {
    Crafty.viewport.clampToEntities = false;
    var stopped = false;
    Crafty.one("StopCamera", function(){
      stopped = true;
    });
    Crafty.viewport.reset();
    equal(stopped, true, "Viewport.reset triggers StopCamera");
  });

  test("pan and StopCamera", function() {
    Crafty.viewport.clampToEntities = false;

    var done = 0;
    Crafty.one("CameraAnimationDone", function() { done++; });

    Crafty.viewport.pan(100, 0, 10 * 20);
    Crafty.timer.simulateFrames(5);
    // Stop at half-way point
    Crafty.trigger("StopCamera");
    Crafty.timer.simulateFrames(5);
    equal(Crafty.viewport._x, -50, "Pan still half way after camera has been stopped");
    equal(done, 0, "CameraAnimationDone hasn't fired");
  });

  test("zoom and StopCamera", function() {
    Crafty.viewport.clampToEntities = false;

    var done = 0;
    Crafty.one("CameraAnimationDone", function() { done++; });

    Crafty.viewport.zoom(4, 0, 0, 10 * 20);    
    Crafty.timer.simulateFrames(5);
    // Stop at half-way point
    Crafty.trigger("StopCamera");
    Crafty.timer.simulateFrames(5);
    equal(Crafty.viewport._scale, 2, "Zoom at half way after camera has been stopped");
    equal(done, 0, "CameraAnimationDone hasn't fired");
  });

  test("DOMtranslate", function() {
    var clientX, clientY, craftyxy;

    Crafty.viewport.scale(1.7);
    Crafty.viewport.x = 38;
    Crafty.viewport.y = 94;

    // pretend to click in the top-left corner. This is supposed to be
    // (x,y) = (-Crafty.viewport._x, -Crafty.viewport._y)
    clientX = Crafty.stage.x - document.body.scrollLeft - document.documentElement.scrollLeft;
    clientY = Crafty.stage.y - document.body.scrollTop - document.documentElement.scrollTop;
    craftyxy = Crafty.domHelper.translate(clientX, clientY);
    strictEqual(craftyxy.x, -Crafty.viewport._x);
    strictEqual(craftyxy.y, -Crafty.viewport._y);

    // pretend to click in the bottom-right corner. This is supposed to be
    // x = -Crafty.viewport._x + Crafty.viewport._width / Crafty.viewport._scale
    // y = -Crafty.viewport._y + Crafty.viewport._height / Crafty.viewport._scale
    clientX = Crafty.stage.x + Crafty.stage.elem.clientWidth - document.body.scrollLeft - document.documentElement.scrollLeft;
    clientY = Crafty.stage.y + Crafty.stage.elem.clientHeight - document.body.scrollTop - document.documentElement.scrollTop;
    craftyxy = Crafty.domHelper.translate(clientX, clientY);
    strictEqual(craftyxy.x, -Crafty.viewport._x + (Crafty.viewport._width / Crafty.viewport._scale));
    strictEqual(craftyxy.y, -Crafty.viewport._y + (Crafty.viewport._height / Crafty.viewport._scale));
  });


  module("Crafty.timer");

  test("simulateFrames", function() {
    var framesPlayed = 0;
    Crafty.bind("EnterFrame", function() {
      framesPlayed++;
    });
    Crafty.timer.simulateFrames(1);
    equal(framesPlayed, 1, "A frame should have been simulated");

    Crafty.timer.simulateFrames(100);
    equal(framesPlayed, 101, "101 frames should have been simulated");
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
})();