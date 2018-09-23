(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Crafty.log");

  test("Logging works when console.log is enabled", function(_) {
    // this makes sure we don't crash on IE9; handle with care as console not always available on IE9
    var logger =
      typeof window !== "undefined"
        ? (window.console = window.console || {})
        : console;

    var original_log = logger.log;
    var logged_message = "";
    logger.log = function(msg) {
      logged_message = msg;
    };
    var test_message = "test message";

    Crafty.log(test_message);
    _.strictEqual(
      logged_message,
      test_message,
      "Crafty.log correctly passes through to console.log"
    );

    Crafty.loggingEnabled = false;
    logged_message = "";
    Crafty.log(test_message);
    _.strictEqual(
      logged_message,
      "",
      "Crafty.log does nothing when logging is disabled."
    );
    Crafty.loggingEnabled = true;

    logger.log = undefined;
    Crafty.log(test_message);
    _.strictEqual(
      logged_message,
      "",
      "Crafty.log does not crash when console.log is undefined."
    );

    logger.log = original_log;
  });
})();
