//////////////////////
// Helper functions //
//////////////////////

resetStage = function() { // jshint ignore:line
  Crafty.viewport.reset();
  Crafty.viewport.scroll('_x', 0);
  Crafty.viewport.scroll('_y', 0);
  Crafty.viewport.clampToEntities = true;
};

Round = function(x){ // jshint ignore:line
  return Math.round(x*100)/100;
};

keysUp = function() { // jshint ignore:line
  var keysToRelease = Array.prototype.slice.call(arguments);
    for (var k in keysToRelease) {
      var key = Crafty.keys[keysToRelease[k]] || keysToRelease[k];
      Crafty.keydown[key] = false;
      Crafty.trigger("KeyUp", {key: key});
    } 
};
keysDown = function() { // jshint ignore:line
    var keysToPress = Array.prototype.slice.call(arguments);
    for (var k in keysToPress) {
      var key = Crafty.keys[keysToPress[k]] || keysToPress[k];
      Crafty.keydown[key] = true;
      Crafty.trigger("KeyDown", {key: key});
    }
};

//////////////////
// QUnit config //
//////////////////

QUnit.testDone(function() {
  // Clean all entities at the end of each test
  Crafty("*").destroy();
});

QUnit.config.hidepassed = true;
QUnit.config.reorder = false;

///////////////////////
// OpenSauce logging //
///////////////////////

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
  else if (typeof global !== "undefined")
    global.global_test_results = test_results;
});
