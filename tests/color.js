(function() {
  var module = QUnit.module;

  module("Crafty.assignColor");

  test("hex codes", function(){
    var c = {};
    Crafty.assignColor("#FF0000", c);
    equal(c._red, 255, "red is 255");
    equal(c._green, 0, "green is 0");
    equal(c._blue, 0, "blue is 0");
    equal(c._strength, 1, "strength is 1.0");
  });

  test("short hex codes", function(){
    var c = {};
    Crafty.assignColor("#123", c);
    equal(c._red, 1, "red is 1");
    equal(c._green, 2, "green is 2");
    equal(c._blue, 3, "blue is 3");
    equal(c._strength, 1, "strength is 1.0");
  });

  test("common color names", function(){
    var c = {};
    Crafty.assignColor("red", c);
    equal(c._red, 255, "red is 255");
    equal(c._green, 0, "green is 0");
    equal(c._blue, 0, "blue is 0");
    equal(c._strength, 1, "strength is 1.0");
  });

  test("less common color names", function(){
    var c = {};
    Crafty.assignColor("lightsalmon", c);
    equal(c._red, 255, "red is 255");
    equal(c._green, 160, "green is 160");
    equal(c._blue, 122, "blue is 122");
    equal(c._strength, 1, "strength is 1.0");
    
    Crafty.assignColor("cadetblue", c);
    equal(c._red, 95, "red is 255");
    equal(c._green, 158, "green is 160");
    equal(c._blue, 160, "blue is 122");
    equal(c._strength, 1, "strength is 1.0");
  });

  test("rgb strings", function(){
    var c = {};
    Crafty.assignColor("rgb(1, 2, 3)", c);
    equal(c._red, 1, "red is 1");
    equal(c._green, 2, "green is 2");
    equal(c._blue, 3, "blue is 3");
    equal(c._strength, 1, "strength is 1.0");
  });

  test("rgba strings", function(){
    var c = {};
    Crafty.assignColor("rgba(255, 0, 0, 0.5)", c);
    equal(c._red, 255, "red is 255");
    equal(c._green, 0, "green is 0");
    equal(c._blue, 0, "blue is 0");
    equal(c._strength, 0.5, "strength is 0.5");
  });

  module("Color");

  test("Color by single string", function(){
    var e = Crafty.e("2D, DOM, Color");
    e.color("red");
    equal(e._red, 255, "red is 255");
    equal(e._green, 0, "green is 0");
    equal(e._blue, 0, "blue is 0");
    equal(e._strength, 1, "strength is 1.0");
  });

  test("Color by rgb", function(){
    var e = Crafty.e("2D, DOM, Color");
    e.color(255, 0, 0);
    equal(e._red, 255, "red is 255");
    equal(e._green, 0, "green is 0");
    equal(e._blue, 0, "blue is 0");
    equal(e._strength, 1, "strength is 1.0");
  });

  test("Color by rgba", function(){
    var e = Crafty.e("2D, DOM, Color");
    e.color(255, 0, 0, 0.5);
    equal(e._red, 255, "red is 255");
    equal(e._green, 0, "green is 0");
    equal(e._blue, 0, "blue is 0");
    equal(e._strength, 0.5, "strength is 0.5");
  });

  test("Color by string + alpha", function(){
    var e = Crafty.e("2D, DOM, Color");
    e.color("red", 0.5);
    equal(e._red, 255, "red is 255");
    equal(e._green, 0, "green is 0");
    equal(e._blue, 0, "blue is 0");
    equal(e._strength, 0.5, "strength is 0.5");
  });

})();
