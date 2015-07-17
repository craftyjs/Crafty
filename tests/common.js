QUnit.testDone(function() {
  // Clean all entities at the end of each test
  Crafty("*").destroy();
});

QUnit.done(function(details) {
  // special characters give colors in node environment
  // see http://stackoverflow.com/a/27111061/3041008 and http://stackoverflow.com/a/20344886/3041008
  if (typeof console !== "undefined" && typeof console.log !== "undefined" && typeof console.error !== "undefined") {
      if (details.failed > 0)
        console.error('\n', '\x1b[31m', 'Some tests failed!' ,'\x1b[0m', '\n');
      else
        console.log('\n', '\x1b[32m', 'All tests passed!' ,'\x1b[0m', '\n');
  }
});
