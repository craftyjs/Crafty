(function() {
  var module = QUnit.module;

  module("_SAT");

  test("simple overlap along x axis", function() {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,0, 2,3, 5,3, 5,0]);

    // order 1
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, -1, "normal.x is -1");
    equal(o.normal.y, 0, "normal.y is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, 1, "normal.x is 1");
    equal(o.normal.y, 0, "normal.y is 0");

  });

  test("simple overlap along y axis", function() {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([0,2, 0,5, 3,5, 3,2]);
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.y, -1, "normal.y is -1");
    equal(o.normal.x, 0, "normal.x is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.y, 1, "normal.y is 1");
    equal(o.normal.x, 0, "normal.x is 0");

  });



  test("overlap smaller along x axis", function() {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,1, 2,4, 5,4, 5,1]);
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, -1, "normal.x is -1");
    equal(o.normal.y, 0, "normal.y is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, 1, "normal.x is 1");
    equal(o.normal.y, 0, "normal.y is 0");

  });

  test("overlap smaller along y axis", function() {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([1,2, 1,5, 4,5, 4,2]);
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.y, -1, "normal.y is -1");
    equal(o.normal.x, 0, "normal.x is 0");

    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.y, 1, "normal.y is 1");
    equal(o.normal.x, 0, "normal.x is 0");
  });

  test("overlap with non parallel faces, but axis-aligned normal", function(){
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,2, 4,4, 6,2, 4,0]);
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, -1, "normal.x is -1");
    equal(o.normal.y, 0, "normal.x is 0");

    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    equal(o.overlap, -1, "Overlap by 1 unit");
    equal(o.normal.x, 1, "normal.x is 1");
    equal(o.normal.y, 0, "normal.x is 0");
  });

  test("overlap with non parallel faces, non-axis-aligned normal", function(){
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([1,4, 4,4, 4,1]);
    function is_inverse_sqrt2(x){
      return (x > 0.707) && (x < 0.708);
    }
    
    var o = e._SAT(poly1, poly2);
    notStrictEqual(o, false, "Overlap exists");
    ok(is_inverse_sqrt2(-o.overlap), "Overlap by 1/sqrt(2)");
    ok( is_inverse_sqrt2(-o.normal.x), "normal.x is -1/sqrt(2)");
    ok( is_inverse_sqrt2(-o.normal.y), "normal.y is -1/sqrt(2)");


    // order 2
    o = e._SAT(poly2, poly1);
    notStrictEqual(o, false, "Overlap exists");
    ok(is_inverse_sqrt2(-o.overlap), "Overlap by 1/sqrt(2)");
    ok( is_inverse_sqrt2(o.normal.x), "normal.x is +1/sqrt(2)");
    ok( is_inverse_sqrt2(o.normal.y), "normal.y is +1/sqrt(2)");
  });
})();
