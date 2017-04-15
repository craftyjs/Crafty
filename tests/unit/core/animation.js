(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Easing");

  test("Crafty.easing duration", function(_) {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    _.strictEqual(e.duration, 80, "Default duration in ms");
  });

  test("Crafty.easing", function(_) {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
    e.tick(20);
    _.strictEqual(e.value(), 1, "Remains 1 after completion");
  });

  test("Crafty.easing with custom function", function(_) {
    var e = new Crafty.easing(80, function(t){return t*t;}) ; // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 0.25, ".25 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
  });

  test("Crafty.easing with built-in smoothStep function", function(_) {
    var e = new Crafty.easing(80, "smoothStep"); // 4 frames == 80ms by default
    e.tick(20);
    _.strictEqual(e.value(), 0.15625, "0.15625 after one step");
    e.tick(20);
    _.strictEqual(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
  });

})();
