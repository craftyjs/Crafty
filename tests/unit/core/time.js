(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Time");

  test("Delay", function(_) {
    var counter = 0,
        incr = function() { counter++; };
    var ent = Crafty.e("Delay");

    // test one execution
    counter = 0;
    ent.delay(incr, 49);
    // Tests will assume 20ms per frame (as is the default)
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 1, "delayed function should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test two executions
    counter = 0;
    ent.delay(incr, 49, 1);
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 2, "delayed function should have executed twice");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test infinite executions
    counter = 0;
    
    ent.delay(incr, 49, -1);
    Crafty.timer.simulateFrames(8);

    _.strictEqual(counter, 3, "delayed function should have executed three times");
    _.strictEqual(ent._delays.length, 1, "one more scheduled delay");

    // test cancel
    counter = 0;
    ent.cancelDelay(incr);
    Crafty.timer.simulateFrames(10);
    _.strictEqual(counter, 0, "delayed function should not have executed");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test dt > duration
    counter = 0;
    ent.delay(incr, 5, 1);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(counter, 2, "function should be executed exactly twice, in a single frame");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");


    // test callbackOff
    counter = 0;
    ent.delay(incr, 49, 0, function() { counter-=5; });
    Crafty.timer.simulateFrames(10);
    _.strictEqual(counter, -4, "two functions should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test multiple delays
    counter = 0;
    ent.delay(incr, 49); // x1
    ent.delay(incr, 49, 1); // x2
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 65); // x1
    ent.delay(incr, 65); // x1
    Crafty.timer.simulateFrames(8);
    _.strictEqual(counter, 11, "delayed function should have executed eleven times");
    _.strictEqual(ent._delays.length, 2, "two more scheduled delays");

    // test multiple cancels
    counter = 0;
    ent.cancelDelay(incr);
    Crafty.timer.simulateFrames(10);
    _.strictEqual(counter, 0, "delayed function should not have executed");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");


    //test resume delays without pausing before
    counter = 0;
    ent.resumeDelays();
    ent.delay(incr, 49);
    ent.resumeDelays();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 1, "delayed function should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    //test resume delay after pausing before frame event
    counter = 0;
    ent.pauseDelays();
    ent.delay(incr, 49);
    ent.resumeDelays();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 1, "delayed function should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    //test pausing delays before specifying delays
    counter = 0;
    ent.pauseDelays();
    ent.delay(incr, 49);
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 0, "delayed function should not have executed");
    _.strictEqual(ent._delays.length, 1, "one pending delay");
    //test resuming delay after pausing
    counter = 0;
    ent.resumeDelays();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 1, "delayed function should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");

    //test (double) pausing delays after specifying delays
    counter = 0;
    ent.delay(incr, 49);
    ent.pauseDelays();
    ent.pauseDelays();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 0, "delayed function should not have executed");
    _.strictEqual(ent._delays.length, 1, "one pending delay");
    //test (double) resuming delay after pausing
    counter = 0;
    ent.resumeDelays();
    ent.resumeDelays();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(counter, 1, "delayed function should have executed once");
    _.strictEqual(ent._delays.length, 0, "no more scheduled delays");
  });

  module("Crafty.timer", {
    beforeEach: function() {
      // enable timer before each test in this module
      Crafty.pause(false);
    },
    afterEach: function() {
      // disable timer after each test in this module
      Crafty.pause(true);
    }
  });

  test("simulateFrames", function(_) {
    var framesPlayed = 0;
    Crafty.bind("EnterFrame", function() {
      framesPlayed++;
    });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(framesPlayed, 1, "A frame should have been simulated");

    Crafty.timer.simulateFrames(100);
    _.strictEqual(framesPlayed, 101, "101 frames should have been simulated");
  });

  test("curTime", function(_) {
    _.expect(1);
    var done = _.async(); // pause the QUnit so the timeout has time to complete.
    var startTime, lastKnownTime;

    var framesTriggered = 0;

    Crafty.e("").bind("EnterFrame", function(params) {
      framesTriggered++;
      if (!startTime) {
        startTime = params.gameTime;
      } else {
        lastKnownTime = params.gameTime;
      }
    });

    setTimeout(function() {
      var endTime = lastKnownTime;

      _.ok(endTime > startTime, "After " + framesTriggered + " frames triggered, EndTime " + endTime + " must be larger than StartTime " + startTime);
      done();
    }, 200);
  });

})();
