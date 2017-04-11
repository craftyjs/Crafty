(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  var Matrix2D = Crafty.math.Matrix2D;
  var Vector2D = Crafty.math.Vector2D;

  // tests for general functions should go here (.abs(), .amountOf(), etc)

  module("Math - Vector2D");

  test("constructor", function(_) {
    var v0 = new Vector2D();
    var v00 = new Vector2D(0, 0);
    var v12 = new Vector2D(1, 2);
    var v12_2 = new Vector2D(v12);

    _.strictEqual(v0.equals(v00), true, "new Vector2D() equals new Vector2D(0, 0)");
    _.strictEqual(v12.equals(v12_2), true, "new Vector2D(1, 2) equals new Vector2D(new Vector2D(1,2))");
  });

  test("add()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v = new Vector2D(4, 6);

    _.strictEqual(v12.add(v34).equals(v), true, "<1,2> + <3,4> = <4,6>");
  });

  test("angleBetween()", function(_) {
    var v10 = new Vector2D(1, 0);
    var v_11 = new Vector2D(-1, 1);
    var v1_1 = new Vector2D(1, -1);

    _.strictEqual(v10.angleBetween(v_11), 3 * Math.PI / 4, "<1,0>.angleBetween(<0,1>) = 3*PI/4");
    _.strictEqual(v10.angleBetween(v1_1), -Math.PI / 4, "<1,0>.angleBetween(<1,-1>) = -PI/4");
  });

  test("angleTo()", function(_) {
    var v0 = new Vector2D();
    var v11 = new Vector2D(1, 1);
    var v10 = new Vector2D(1, 0);
    var v0_1 = new Vector2D(0, -1);

    _.strictEqual(v0.angleTo(v11), Math.PI / 4, "<0,0>.angleTo(<1,1>) = PI/4");
    _.strictEqual(v10.angleTo(v0_1), -3 * Math.PI / 4, "<1,0>.angleTo(<0,-1>) = -3*PI/4");
  });

  test("clone()", function(_) {
    var v0 = new Vector2D();
    var v3_7 = new Vector2D(3, -7);

    _.strictEqual(v0.equals(v0.clone()), true, "<0,0> = <0,0>.clone()");
    _.strictEqual(v3_7.clone().equals(v3_7), true, "<3,-7>.clone() = <3,-7>");
  });

  test("distance()", function(_) {
    var v0 = new Vector2D();
    var v10 = new Vector2D(1, 0);
    var v11 = new Vector2D(1, 1);

    _.strictEqual(v10.distance(v11), 1, "<1,0>.distance(<1,1>) = 1");
    _.strictEqual(v0.distance(v11), Math.sqrt(2), "<0,0>.distance(<1,1>) = sqrt(2)");
  });

  test("distanceSq()", function(_) {
    var v0 = new Vector2D();
    var v10 = new Vector2D(1, 0);
    var v11 = new Vector2D(1, 1);

    _.strictEqual(v10.distanceSq(v11), 1, "<1,0>.distanceSq(<1,1>) = 1");
    _.strictEqual(v0.distanceSq(v11), 2, "<0,0>.distanceSq(<1,1>) = 2");
  });

  test("divide()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v = new Vector2D(1 / 3, 2 / 4);

    _.strictEqual(v12.divide(v34).equals(v), true, "<1,2> / <3,4> = <1/3,1/2>");
  });

  test("dotProduct()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v46 = new Vector2D(4, 6);

    _.strictEqual(v12.dotProduct(v34), 11, "<1,2>.dotProduct(<3,4>) = 11");
    _.strictEqual(v34.dotProduct(v46), 36, "<3,4>.dotProduct(<4,6>) = 36");
    _.strictEqual(v46.dotProduct(v12), 16, "<4,6>.dotProduct(<1,2>) = 16");
  });

  test("crossProduct()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v46 = new Vector2D(4, 6);

    _.strictEqual(v12.crossProduct(v34), -2, "<1,2>.crossProduct(<3,4>) = -2");
    _.strictEqual(v34.crossProduct(v46), 2, "<3,4>.crossProduct(<4,6>) = 2");
    _.strictEqual(v46.crossProduct(v12), 2, "<4,6>.crossProduct(<1,2>) = 2");
  });

  test("equals()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v46 = new Vector2D(4, 6);

    _.strictEqual(v12.equals(new Vector2D(1, 2)), true, "<1,2>.equals(<1,2>) = true");
    _.strictEqual(v34.equals(new Vector2D(3, 4)), true, "<3,4>.equals(<3,4>) = true");
    _.strictEqual(v46.equals(new Vector2D(4, 6)), true, "<4,6>.equals(<4,6>) = true");
  });

  test("perpendicular()", function(_) {
    var v10 = new Vector2D(1, 0);

    _.strictEqual(v10.perpendicular().equals(new Vector2D(0, 1)), true, "<1,0>.perpendicular() = <0,1>");
  });

  test("getNormal()", function(_) {
    var v10 = new Vector2D(1, 0);
    var v32 = new Vector2D(3, 2);

    _.strictEqual(v10.getNormal(v32).equals((new Vector2D(1, -1)).normalize()), true, "<1,0>.getNormal(<3,2>) = <sqrt(2)/2,-sqrt(2)/2>");
  });

  test("isZero()", function(_) {
    var v0 = new Vector2D();
    var v10 = new Vector2D(1, 0);

    _.strictEqual(v0.isZero(), true, "<0,0>.isZero() = true");
    _.strictEqual(v10.isZero(), false, "<1,0>.isZero() = false");
  });

  test("magnitude()", function(_) {
    var v0 = new Vector2D();
    var v10 = new Vector2D(1, 0);
    var v_79 = new Vector2D(-7, 9);

    _.strictEqual(v0.magnitude(), 0, "<0,0>.magnitude() = 0");
    _.strictEqual(v10.magnitude(), 1, "<1,0>.magnitude() = 1");
    _.strictEqual(v_79.magnitude(), 11.40175425099138, "<-7,9>.magnitude() = 11.40175425099138");
  });

  test("magnitudeSq()", function(_) {
    var v0 = new Vector2D();
    var v10 = new Vector2D(1, 0);
    var v_79 = new Vector2D(-7, 9);

    _.strictEqual(v0.magnitudeSq(), 0, "<0,0>.magnitudeSq() = 0");
    _.strictEqual(v10.magnitudeSq(), 1, "<1,0>.magnitudeSq() = 1");
    _.strictEqual(v_79.magnitudeSq(), 130, "<-7,9>.magnitudeSq() = 130");
  });

  test("multiply()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v = new Vector2D(3, 8);

    _.strictEqual(v12.multiply(v34).equals(v), true, "<1,2> * <3,4> = <3,8>");
  });

  test("negate()", function(_) {
    var v_79 = new Vector2D(-7, 9);
    var v7_9 = new Vector2D(7, -9);

    _.strictEqual(v_79.negate().equals(v7_9), true, "<-7,9>.negate() = <7,-9>");
  });

  test("normalize()", function(_) {
    var v0 = new Vector2D();
    var v01 = new Vector2D(0, 1);
    var v_79 = new Vector2D(-7, 9);

    _.strictEqual(v0.normalize().equals(new Vector2D(1, 0)), true, "<0,0>.normalize() = <1,0>");
    _.strictEqual(v01.normalize().equals(new Vector2D(0, 1)), true, "<0,1>.normalize() = <0,1>");
    _.strictEqual(v_79.normalize().equals(new Vector2D(-0.6139406135149205, 0.7893522173763263)), true, "<-7,9>.normalize() = <-0.6139406135149205,0.7893522173763263>");
  });

  test("scale()", function(_) {
    var v11 = new Vector2D(1, 1);

    _.strictEqual(v11.scale(2).equals(new Vector2D(2, 2)), true, "<1,1>.scale(2) = <2,2>");
    _.strictEqual(v11.scale(2, -3).equals(new Vector2D(4, -6)), true, "<2,2>.scale(2, -3) = <4,-6>");
  });

  test("scaleToMagnitude()", function(_) {
    var v34 = new Vector2D(3, 4);

    _.strictEqual(v34.normalize().scaleToMagnitude(5).equals(new Vector2D(3, 4)), true, "<3,4>.normalize().scaleToMagnitude(5) = <3,4>");
  });

  test("setValues", function(_) {
    var v0 = new Vector2D();
    var v12 = new Vector2D(1, 2);
    var v44 = new Vector2D(4, 4);

    _.strictEqual(v0.setValues(1, 2).equals(v12), true, "<0,0>.setValues(<1,2>) = <1,2>");
    _.strictEqual(v0.setValues(v44).equals(v44), true, "<1,2>.setValues(<4,4>) = <4,4>");
  });

  test("subtract()", function(_) {
    var v12 = new Vector2D(1, 2);
    var v34 = new Vector2D(3, 4);
    var v = new Vector2D(-2, -2);

    _.strictEqual(v12.subtract(v34).equals(v), true, "<1,2> - <3,4> = <-2,-2>");
  });

  test("toString()", function(_) {
    var v12 = new Vector2D(1, 2);

    _.strictEqual(v12.toString(), "Vector2D(1, 2)", "<1,2> = \"Vector2D(1, 2)\"");
  });

  test("translate()", function(_) {
    var v11 = new Vector2D(1, 1);

    _.strictEqual(v11.translate(2).equals(new Vector2D(3, 3)), true, "<1,1>.translate(2) = <3,3>");
    _.strictEqual(v11.translate(2, -3).equals(new Vector2D(5, 0)), true, "<3,3>.translate(2, -3) = <5,0>");
  });

  test("tripleProduct()", function(_) {
    var va = new Vector2D(1, 2);
    var vb = new Vector2D(3, 4);
    var vc = new Vector2D(5, 6);
    var vtp = new Vector2D(12, -10);

    _.strictEqual(Vector2D.tripleProduct(va, vb, vc).equals(vtp), true, "tripleProduct(<1,2>, <3,4>, <5,6>) = <10,-12>");
  });

  module("Math - Matrix2D");

  test("apply()", function(_) {
    _.strictEqual((new Matrix2D()).rotate(Math.PI / 2).apply(new Vector2D(1, 2)).equals(new Vector2D(-2, 1.0000000000000002)),
      true, "(new Matrix2D()).rotate(Math.PI/2).apply(new Vector2D(1, 2)).equals(new Vector2D(-2, 1.0000000000000002))");
  });

  test("clone()", function(_) {
    _.strictEqual((new Matrix2D(1, 2, 3, 4, 5, 6)).clone().equals(new Matrix2D(1, 2, 3, 4, 5, 6)),
      true, "(new Matrix2D(1, 2, 3, 4, 5, 6)).clone().equals(new Matrix2D(1, 2, 3, 4, 5, 6))");
  });

  test("combine()", function(_) {
    _.strictEqual((new Matrix2D()).scale(2).combine((new Matrix2D()).rotate(0.75)).equals((new Matrix2D()).scale(2).rotate(0.75)),
      true, "(new Matrix2D()).scale(2).combine((new Matrix2D()).rotate(0.75)).equals((new Matrix2D()).scale(2).rotate(0.75))");
  });

  test("equals()", function(_) {
    _.strictEqual((new Matrix2D()).equals(new Matrix2D()),
      true, "(new Matrix2D()).equals(new Matrix2D())");
    _.strictEqual((new Matrix2D()).scale(2).equals(new Matrix2D()),
      false, "(new Matrix2D()).scale(2).equals(new Matrix2D())");
  });

  test("determinant()", function(_) {
    _.strictEqual((new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).determinant(),
      6, "(new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).determinant()");
  });

  test("invert()", function(_) {
    var m = new Matrix2D(4, 3, 3, 2, 0, 0);
    var m2 = new Matrix2D(-2, 3, 3, -4, 0, 0);
    _.ok( m.invert().equals(m2), "Matrix (4,3,3,2) inverts to (-2,3,3,-4)");
  });

  test("isIdentity()", function(_) {
    _.strictEqual((new Matrix2D()).isIdentity(),
      true, "(new Matrix2D()).isIdentity()");
    _.strictEqual((new Matrix2D()).scale(2).isIdentity(),
      false, "(new Matrix2D()).scale(2).isIdentity()");
  });

  test("isInvertible()", function(_) {
    _.strictEqual((new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).isInvertible(),
      true, "(new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).isInvertible()");
    _.strictEqual((new Matrix2D()).scale(0, 3).rotate(Math.PI / 2).isInvertible(),
      false, "(new Matrix2D()).scale(0, 3).rotate(Math.PI / 2).isInvertible()");
  });

  test("preRotate()", function(_) {
    _.strictEqual((new Matrix2D()).preRotate(0).equals(new Matrix2D()),
      true, "(new Matrix2D()).preRotate(0).equals(new Matrix2D())");
    _.strictEqual((new Matrix2D()).preRotate(Math.PI / 2).equals((new Matrix2D()).rotate(Math.PI / 2)),
      true, "(new Matrix2D()).preRotate(Math.PI / 2).equals((new Matrix2D()).rotate(Math.PI / 2))");
  });

  test("preScale()", function(_) {
    _.strictEqual((new Matrix2D()).preScale(2).equals(new Matrix2D(2, 0, 0, 2, 0, 0)),
      true, "(new Matrix2D()).preScale(2).equals(new Matrix2D(2, 0, 0, 2, 0, 0))");
    _.strictEqual((new Matrix2D()).preScale(2.5).equals((new Matrix2D()).scale(2.5)),
      true, "(new Matrix2D()).preScale(2.5).equals((new Matrix2D()).scale(2.5))");
  });

  test("preTranslate()", function(_) {
    _.strictEqual((new Matrix2D()).preTranslate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
      true, "(new Matrix2D()).preTranslate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)");
    _.strictEqual((new Matrix2D()).preTranslate(1, 2).equals((new Matrix2D()).translate(new Vector2D(1, 2))),
      true, "(new Matrix2D()).preTranslate(1, 2).equals((new Matrix2D()).translate(new Vector2D(1, 2)))");
    _.strictEqual((new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
      true, "(new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
    _.strictEqual((new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals((new Matrix2D()).translate(new Vector2D(1, 2))),
      true, "(new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals((new Matrix2D()).translate(new Vector2D(1, 2)))");
  });

  test("rotate()", function(_) {
    _.strictEqual((new Matrix2D()).rotate(0).equals(new Matrix2D()),
      true, "(new Matrix2D()).rotate(0).equals(new Matrix2D())");
  });

  test("scale()", function(_) {
    _.strictEqual((new Matrix2D()).scale(2, 3).equals(new Matrix2D(2, 0, 0, 3, 0, 0)),
      true, "(new Matrix2D()).scale(2, 3).equals(new Matrix2D(2, 0, 0, 3, 0, 0))");
  });

  test("setValues()", function(_) {
    _.strictEqual((new Matrix2D()).setValues(1, 2, 3, 4, 5, 6).equals(new Matrix2D(1, 2, 3, 4, 5, 6)),
      true, "(new Matrix2D()).setValues(1, 2, 3, 4, 5, 6).equals(new Matrix2D(1, 2, 3, 4, 5, 6))");
  });

  test("toString()", function(_) {
    _.strictEqual((new Matrix2D()).toString(),
      "Matrix2D([1, 0, 0] [0, 1, 0] [0, 0, 1])", "(new Matrix2D()).toString()");
  });

  test("translate()", function(_) {
    _.strictEqual((new Matrix2D()).translate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
      true, "(new Matrix2D()).translate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
    _.strictEqual((new Matrix2D()).translate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
      true, "(new Matrix2D()).translate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
  });
})();