(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  var Crafty2 = global.craftyFactory();

  module("Instances");

  test("Separate crafty instances do not share property", function(_) {
    Crafty2.__SOME_PROPERTY__ = '__SOME_PROPERTY__';

    _.strictEqual(Crafty2.__SOME_PROPERTY__, '__SOME_PROPERTY__', "Property set on one instance");
    _.notEqual(Crafty.__SOME_PROPERTY__, '__SOME_PROPERTY__', "Property not set on other instance");
  });

  test("Separate crafty instances consist of different subobjects", function(_) {
    _.notDeepEqual(Crafty2, Crafty, "Properties are different");
  });
})();