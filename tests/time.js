(function() {
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
})();
