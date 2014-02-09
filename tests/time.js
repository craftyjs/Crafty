(function() {
  module("Time");

  test("Delay", function() {
    /* jshint -W020 */
    var oldDate = Date,
        initDate = Date.now();
    var counter = 0,
        incr = function() { counter++; };
    var ent = Crafty.e("Delay");

    // test one execution
    counter = 0;
    Date = function (arg) { return new oldDate(initDate); }; ent.delay(incr, 49);
    Date = function (arg) { return new oldDate(initDate + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 1, "delayed function should have executed once");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test two executions
    counter = 0;
    Date = function (arg) { return new oldDate(initDate); }; ent.delay(incr, 49, 1);
    Date = function (arg) { return new oldDate(initDate + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 2, "delayed function should have executed twice");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test infinite executions
    counter = 0;
    Date = function (arg) { return new oldDate(initDate); }; ent.delay(incr, 49, -1);
    Date = function (arg) { return new oldDate(initDate + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 3, "delayed function should have executed three times");
    strictEqual(ent._delays.length, 1, "one more scheduled delay");

    // test cancel
    counter = 0;
    ent.cancelDelay(incr);
    Date = function (arg) { return new oldDate(initDate + 50 + 50 + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 0, "delayed function should not have executed");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test callbackOff
    counter = 0;
    Date = function (arg) { return new oldDate(initDate); }; ent.delay(incr, 49, 0, function() { counter--; });
    Date = function (arg) { return new oldDate(initDate + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 0, "two functions should have executed once");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");

    // test multiple delays
    counter = 0;
    Date = function (arg) { return new oldDate(initDate); };
    ent.delay(incr, 49); // x1
    ent.delay(incr, 49, 1); // x2
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 49, -1); // x3
    ent.delay(incr, 51); // x1
    ent.delay(incr, 51); // x1
    Date = function (arg) { return new oldDate(initDate + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50); }; Crafty.trigger("EnterFrame");
    Date = function (arg) { return new oldDate(initDate + 50 + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 11, "delayed function should have executed eleven times");
    strictEqual(ent._delays.length, 2, "two more scheduled delays");

    // test multiple cancels
    counter = 0;
    ent.cancelDelay(incr);
    Date = function (arg) { return new oldDate(initDate + 50 + 50 + 50 + 50); }; Crafty.trigger("EnterFrame");
    strictEqual(counter, 0, "delayed function should not have executed");
    strictEqual(ent._delays.length, 0, "no more scheduled delays");


    ent.destroy();
    Date = oldDate;
    /* jshint +W020 */
  });
})();
