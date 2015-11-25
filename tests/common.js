QUnit.testDone(function() {
  // Clean all entities at the end of each test
  Crafty("*").destroy();
});

QUnit.config.hidepassed = true;


// OpenSauce logging
var log = [];
QUnit.testStart(function(testDetails){
  QUnit.log(function(details){
    if (!details.result) {
      details.name = testDetails.name;
      log.push(details);
    }
  });
});
QUnit.done(function (test_results) {
  var tests = [];
  for(var i = 0, len = log.length; i < len; i++) {
    var details = log[i];
    tests.push({
      name: details.name,
      result: details.result,
      expected: details.expected,
      actual: details.actual,
      source: details.source
    });
  }
  test_results.tests = tests;
  if (typeof window !== "undefined")
    window.global_test_results = test_results;
});
