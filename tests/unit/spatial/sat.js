(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("_SAT");

  test("simple overlap along x axis", function(_) {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,0, 2,3, 5,3, 5,0]);

    // order 1
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, -1, "nx is -1");
    _.strictEqual(o.ny, 0, "ny is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, 1, "nx is 1");
    _.strictEqual(o.ny, 0, "ny is 0");

  });

  test("simple overlap along y axis", function(_) {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([0,2, 0,5, 3,5, 3,2]);
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.ny, -1, "ny is -1");
    _.strictEqual(o.nx, 0, "nx is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.ny, 1, "ny is 1");
    _.strictEqual(o.nx, 0, "nx is 0");

  });



  test("overlap smaller along x axis", function(_) {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,1, 2,4, 5,4, 5,1]);
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, -1, "nx is -1");
    _.strictEqual(o.ny, 0, "ny is 0");
    
    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, 1, "nx is 1");
    _.strictEqual(o.ny, 0, "ny is 0");

  });

  test("overlap smaller along y axis", function(_) {
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([1,2, 1,5, 4,5, 4,2]);
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.ny, -1, "ny is -1");
    _.strictEqual(o.nx, 0, "nx is 0");

    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.ny, 1, "ny is 1");
    _.strictEqual(o.nx, 0, "nx is 0");
  });

  test("overlap with non parallel faces, but axis-aligned normal", function(_){
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([2,2, 4,4, 6,2, 4,0]);
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, -1, "nx is -1");
    _.strictEqual(o.ny, 0, "nx is 0");

    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.strictEqual(o.overlap, -1, "Overlap by 1 unit");
    _.strictEqual(o.nx, 1, "nx is 1");
    _.strictEqual(o.ny, 0, "nx is 0");
  });

  test("overlap with non parallel faces, non-axis-aligned normal", function(_){
    var e = Crafty.e("2D, Collision");
    var poly1 = new Crafty.polygon([0,0, 0,3, 3,3, 3,0]);
    var poly2 = new Crafty.polygon([1,4, 4,4, 4,1]);
    function is_inverse_sqrt2(x){
      return (x > 0.707) && (x < 0.708);
    }
    
    var o = e._SAT(poly1, poly2);
    _.notEqual(o, false, "Overlap exists");
    _.ok(is_inverse_sqrt2(-o.overlap), "Overlap by 1/sqrt(2)");
    _.ok( is_inverse_sqrt2(-o.nx), "nx is -1/sqrt(2)");
    _.ok( is_inverse_sqrt2(-o.ny), "ny is -1/sqrt(2)");


    // order 2
    o = e._SAT(poly2, poly1);
    _.notEqual(o, false, "Overlap exists");
    _.ok(is_inverse_sqrt2(-o.overlap), "Overlap by 1/sqrt(2)");
    _.ok( is_inverse_sqrt2(o.nx), "nx is +1/sqrt(2)");
    _.ok( is_inverse_sqrt2(o.ny), "ny is +1/sqrt(2)");
  });
})();
