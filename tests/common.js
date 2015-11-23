var log = [];

QUnit.testStart(function(testDetails){
  // Open Sauce logging
  QUnit.log(function(details){
    if (!details.result) {
      details.name = testDetails.name;
      log.push(details);
    }
  });
});

QUnit.testDone(function() {
  // Clean all entities at the end of each test
  Crafty("*").destroy();
});

QUnit.config.hidepassed = true;

QUnit.done(function (test_results) {
  // special characters give colors in node environment
  // see http://stackoverflow.com/a/27111061/3041008 and http://stackoverflow.com/a/20344886/3041008
  if (typeof console !== "undefined" && typeof console.log !== "undefined" && typeof console.error !== "undefined") {
      if (test_results.failed > 0)
        console.error('\n', '\x1b[31m', 'Some tests failed!' ,'\x1b[0m', '\n');
      else
        console.log('\n', '\x1b[32m', 'All tests passed!' ,'\x1b[0m', '\n');
  }

  // Open Sauce logging
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
