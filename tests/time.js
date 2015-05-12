(function() {
  var module = QUnit.module;

  module("Time");

  test("Delay", function() {
    var counter = 0,
        incr = function() { counter++; };
    var ent = Crafty.e("Delay");

    // test one execution
    counter = 0;
    ent.delay(incr, 49);
    // Tests will assume 20ms per frame (as is the default)
    Crafty.timer.simulateFrames(5);
    strictEqual(counter, 1, "delayed function should have executed once");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test two executions
    counter = 0;
     ent.delay(incr, 49, 1);
    Crafty.timer.simulateFrames(5);
    strictEqual(counter, 2, "delayed function should have executed twice");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test infinite executions
    counter = 0;
    
    ent.delay(incr, 49, -1);
    Crafty.timer.simulateFrames(8);

    strictEqual(counter, 3, "delayed function should have executed three times");
    strictEqual(ent._delays.length, 1, "one more scheduled delay");

    // test cancel
    counter = 0;
    ent.cancelDelay(incr);
    Crafty.timer.simulateFrames(10);
    strictEqual(counter, 0, "delayed function should not have executed");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test dt > duration
    counter = 0;
    ent.delay(incr, 5, 1);
    Crafty.timer.simulateFrames(1);
    strictEqual(counter, 2, "function should be executed exactly twice, in a single frame");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");


    // test callbackOff
    counter = 0;
    ent.delay(incr, 49, 0, function() { counter-=5; });
    Crafty.timer.simulateFrames(10);
    strictEqual(counter, -4, "two functions should have executed once");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test multiple delays
    counter = 0;
    ent.delay(incr, 49); // x1
    ent.delay(incr, 49, 1); // x2
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 65); // x1
    ent.delay(incr, 65); // x1
    Crafty.timer.simulateFrames(8);
    strictEqual(counter, 11, "delayed function should have executed eleven times");
    strictEqual(ent._delays.length, 2, "two more scheduled delays");

    // test multiple cancels
    counter = 0;
    ent.cancelDelay(incr);
    Crafty.timer.simulateFrames(10);
    strictEqual(counter, 0, "delayed function should not have executed");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");


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
