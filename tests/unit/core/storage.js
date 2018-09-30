(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Storage");

  test("get a value", function(_) {
    Crafty.storage("name", "test");
    var name = Crafty.storage("name");

    _.strictEqual(name, "test", "the values should be equal");

    Crafty.storage.remove("name");
  });

  test("get null when a value does not exist", function(_) {
    var name = Crafty.storage("notexisting");
    _.strictEqual(name, null, "should be null");
  });

  test("remove an value", function(_) {
    Crafty.storage("person", "test");
    _.strictEqual(Crafty.storage("person"), "test", "person should be defined");

    Crafty.storage.remove("person");

    var savedperson = Crafty.storage("person");
    _.strictEqual(
      savedperson,
      null,
      "should be null because we just removed the value"
    );
  });
})();
