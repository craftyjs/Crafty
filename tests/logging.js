(function() {
  var module = QUnit.module;

  module("Crafty.log");

  test("Logging works when console.log is enabled", function(){
    var original_log = console.log;
    var logged_message = "";
    console.log = function(msg) { logged_message = msg; };
    var test_message = "test message";
    
    Crafty.log(test_message);
    equal(logged_message, test_message, "Crafty.log correctly passes through to console.log");
    
    Crafty.loggingEnabled = false;
    logged_message = "";
    Crafty.log(test_message);
    equal(logged_message, "", "Crafty.log does nothing when logging is disabled.");
    Crafty.loggingEnabled = true;

    console.log = undefined;
    Crafty.log(test_message);
    equal(logged_message, "", "Crafty.log does not crash when console.log is undefined.");


    console.log = original_log;
  });

})();
