(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Crafty.assignColor");

  test("hex codes", function(_) {
    var c = {};
    Crafty.assignColor("#FF0000", c);
    _.strictEqual(c._red, 255, "red is 255");
    _.strictEqual(c._green, 0, "green is 0");
    _.strictEqual(c._blue, 0, "blue is 0");
    _.strictEqual(c._strength, 1, "strength is 1.0");
  });

  test("short hex codes", function(_) {
    var c = {};
    Crafty.assignColor("#123", c);
    _.strictEqual(c._red, 17, "red is #11");
    _.strictEqual(c._green, 34, "green is #22");
    _.strictEqual(c._blue, 51, "blue is #33");
    _.strictEqual(c._strength, 1, "strength is 1.0");
  });

  test("common color names", function(_) {
    var c = {};
    Crafty.assignColor("red", c);
    _.strictEqual(c._red, 255, "red is 255");
    _.strictEqual(c._green, 0, "green is 0");
    _.strictEqual(c._blue, 0, "blue is 0");
    _.strictEqual(c._strength, 1, "strength is 1.0");
  });

  test("less common color names", function(_) {
    var c = {};
    Crafty.assignColor("lightsalmon", c);
    _.strictEqual(c._red, 255, "red is 255");
    _.strictEqual(c._green, 160, "green is 160");
    _.strictEqual(c._blue, 122, "blue is 122");
    _.strictEqual(c._strength, 1, "strength is 1.0");

    Crafty.assignColor("cadetblue", c);
    _.strictEqual(c._red, 95, "red is 255");
    _.strictEqual(c._green, 158, "green is 160");
    _.strictEqual(c._blue, 160, "blue is 122");
    _.strictEqual(c._strength, 1, "strength is 1.0");
  });

  test("rgb strings", function(_) {
    var c = {};
    Crafty.assignColor("rgb(1, 2, 3)", c);
    _.strictEqual(c._red, 1, "red is 1");
    _.strictEqual(c._green, 2, "green is 2");
    _.strictEqual(c._blue, 3, "blue is 3");
    _.strictEqual(c._strength, 1, "strength is 1.0");
  });

  test("rgba strings", function(_) {
    var c = {};
    Crafty.assignColor("rgba(255, 0, 0, 0.5)", c);
    _.strictEqual(c._red, 255, "red is 255");
    _.strictEqual(c._green, 0, "green is 0");
    _.strictEqual(c._blue, 0, "blue is 0");
    _.strictEqual(c._strength, 0.5, "strength is 0.5");
  });

  module("Color");

  test("Color by single string", function(_) {
    var e = Crafty.e("2D, DOM, Color");
    e.color("red");
    _.strictEqual(e._red, 255, "red is 255");
    _.strictEqual(e._green, 0, "green is 0");
    _.strictEqual(e._blue, 0, "blue is 0");
    _.strictEqual(e._strength, 1, "strength is 1.0");
  });

  test("Color by rgb", function(_) {
    var e = Crafty.e("2D, DOM, Color");
    e.color(255, 0, 0);
    _.strictEqual(e._red, 255, "red is 255");
    _.strictEqual(e._green, 0, "green is 0");
    _.strictEqual(e._blue, 0, "blue is 0");
    _.strictEqual(e._strength, 1, "strength is 1.0");
  });

  test("Color by rgba", function(_) {
    var e = Crafty.e("2D, DOM, Color");
    e.color(255, 0, 0, 0.5);
    _.strictEqual(e._red, 255, "red is 255");
    _.strictEqual(e._green, 0, "green is 0");
    _.strictEqual(e._blue, 0, "blue is 0");
    _.strictEqual(e._strength, 0.5, "strength is 0.5");
  });

  test("Color by string + alpha", function(_) {
    var e = Crafty.e("2D, DOM, Color");
    e.color("red", 0.5);
    _.strictEqual(e._red, 255, "red is 255");
    _.strictEqual(e._green, 0, "green is 0");
    _.strictEqual(e._blue, 0, "blue is 0");
    _.strictEqual(e._strength, 0.5, "strength is 0.5");
  });
})();
