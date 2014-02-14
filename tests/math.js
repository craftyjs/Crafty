var Matrix2D = Crafty.math.Matrix2D;
var Vector2D = Crafty.math.Vector2D;
var Vector3D = Crafty.math.Vector3D;

// tests for general functions should go here (.abs(), .amountOf(), etc)

module("Math - Vector2D", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

test("constructor", function() {
  var v0 = new Vector2D();
  var v00 = new Vector2D(0, 0);
  var v12 = new Vector2D(1, 2);
  var v12_2 = new Vector2D(v12);

  equal(v0.equals(v00), true, "new Vector2D() equals new Vector2D(0, 0)");
  equal(v12.equals(v12_2), true, "new Vector2D(1, 2) equals new Vector2D(new Vector2D(1,2))");
});

test("add()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v = new Vector2D(4, 6);

  equal(v12.add(v34).equals(v), true, "<1,2> + <3,4> = <4,6>");
});

test("angleBetween()", function() {
  var v10 = new Vector2D(1, 0);
  var v_11 = new Vector2D(-1, 1);
  var v1_1 = new Vector2D(1, -1);

  equal(v10.angleBetween(v_11), 3 * Math.PI / 4, "<1,0>.angleBetween(<0,1>) = 3*PI/4");
  equal(v10.angleBetween(v1_1), -Math.PI / 4, "<1,0>.angleBetween(<1,-1>) = -PI/4");
});

test("angleTo()", function() {
  var v0 = new Vector2D();
  var v11 = new Vector2D(1, 1);
  var v10 = new Vector2D(1, 0);
  var v0_1 = new Vector2D(0, -1);

  equal(v0.angleTo(v11), Math.PI / 4, "<0,0>.angleTo(<1,1>) = PI/4");
  equal(v10.angleTo(v0_1), -3 * Math.PI / 4, "<1,0>.angleTo(<0,-1>) = -3*PI/4");
});

test("clone()", function() {
  var v0 = new Vector2D();
  var v3_7 = new Vector2D(3, -7);

  equal(v0.equals(v0.clone()), true, "<0,0> = <0,0>.clone()");
  equal(v3_7.clone().equals(v3_7), true, "<3,-7>.clone() = <3,-7>");
});

test("distance()", function() {
  var v0 = new Vector2D();
  var v10 = new Vector2D(1, 0);
  var v11 = new Vector2D(1, 1);

  equal(v10.distance(v11), 1, "<1,0>.distance(<1,1>) = 1");
  equal(v0.distance(v11), Math.sqrt(2), "<0,0>.distance(<1,1>) = sqrt(2)");
});

test("distanceSq()", function() {
  var v0 = new Vector2D();
  var v10 = new Vector2D(1, 0);
  var v11 = new Vector2D(1, 1);

  equal(v10.distanceSq(v11), 1, "<1,0>.distanceSq(<1,1>) = 1");
  equal(v0.distanceSq(v11), 2, "<0,0>.distanceSq(<1,1>) = 2");
});

test("divide()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v = new Vector2D(1 / 3, 2 / 4);

  equal(v12.divide(v34).equals(v), true, "<1,2> / <3,4> = <1/3,1/2>");
});

test("dotProduct()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v46 = new Vector2D(4, 6);

  equal(v12.dotProduct(v34), 11, "<1,2>.dotProduct(<3,4>) = 11");
  equal(v34.dotProduct(v46), 36, "<3,4>.dotProduct(<4,6>) = 36");
  equal(v46.dotProduct(v12), 16, "<4,6>.dotProduct(<1,2>) = 16");
});

test("equals()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v46 = new Vector2D(4, 6);

  equal(v12.equals(new Vector2D(1, 2)), true, "<1,2>.equals(<1,2>) = true");
  equal(v34.equals(new Vector2D(3, 4)), true, "<3,4>.equals(<3,4>) = true");
  equal(v46.equals(new Vector2D(4, 6)), true, "<4,6>.equals(<4,6>) = true");
});

test("getNormal()", function() {
  var v10 = new Vector2D(1, 0);
  var v32 = new Vector2D(3, 2);

  equal(v10.getNormal().equals(new Vector2D(0, 1)), true, "<1,0>.getNormal() = <0,1>");
  equal(v10.getNormal(v32).equals((new Vector2D(1, -1)).normalize()), true, "<1,0>.getNormal(<3,2>) = <sqrt(2)/2,-sqrt(2)/2>");
});

test("isZero()", function() {
  var v0 = new Vector2D();
  var v10 = new Vector2D(1, 0);

  equal(v0.isZero(), true, "<0,0>.isZero() = true");
  equal(v10.isZero(), false, "<1,0>.isZero() = false");
});

test("magnitude()", function() {
  var v0 = new Vector2D();
  var v10 = new Vector2D(1, 0);
  var v_79 = new Vector2D(-7, 9);

  equal(v0.magnitude(), 0, "<0,0>.magnitude() = 0");
  equal(v10.magnitude(), 1, "<1,0>.magnitude() = 1");
  equal(v_79.magnitude(), 11.40175425099138, "<-7,9>.magnitude() = 11.40175425099138");
});

test("magnitudeSq()", function() {
  var v0 = new Vector2D();
  var v10 = new Vector2D(1, 0);
  var v_79 = new Vector2D(-7, 9);

  equal(v0.magnitudeSq(), 0, "<0,0>.magnitudeSq() = 0");
  equal(v10.magnitudeSq(), 1, "<1,0>.magnitudeSq() = 1");
  equal(v_79.magnitudeSq(), 130, "<-7,9>.magnitudeSq() = 130");
});

test("multiply()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v = new Vector2D(3, 8);

  equal(v12.multiply(v34).equals(v), true, "<1,2> * <3,4> = <3,8>");
});

test("negate()", function() {
  var v_79 = new Vector2D(-7, 9);
  var v7_9 = new Vector2D(7, -9);

  equal(v_79.negate().equals(v7_9), true, "<-7,9>.negate() = <7,-9>");
});

test("normalize()", function() {
  var v0 = new Vector2D();
  var v01 = new Vector2D(0, 1);
  var v_79 = new Vector2D(-7, 9);

  equal(v0.normalize().equals(new Vector2D(1, 0)), true, "<0,0>.normalize() = <1,0>");
  equal(v01.normalize().equals(new Vector2D(0, 1)), true, "<1,0>.normalize() = <0,1>");
  equal(v_79.normalize().equals(new Vector2D(-0.6139406135149205, 0.7893522173763263)), true, "<-7,9>.normalize() = <-0.6139406135149205,0.7893522173763263>");
});

test("scale()", function() {
  var v11 = new Vector2D(1, 1);

  equal(v11.scale(2).equals(new Vector2D(2, 2)), true, "<1,1>.scale(2) = <2,2>");
  equal(v11.scale(2, -3).equals(new Vector2D(4, -6)), true, "<2,2>.scale(2, -3) = <4,-6>");
});

test("magnitudeSq()", function() {
  var v34 = new Vector2D(3, 4);

  equal(v34.normalize().scaleToMagnitude(5).equals(new Vector2D(3, 4)), true, "<3,4>.normalize().scaleToMagnitude(5) = <3,4>");
});

test("setValues", function() {
  var v0 = new Vector2D();
  var v12 = new Vector2D(1, 2);
  var v44 = new Vector2D(4, 4);

  equal(v0.setValues(1, 2).equals(v12), true, "<0,0>.setValues(<1,2>) = <1,2>");
  equal(v0.setValues(v44).equals(v44), true, "<1,2>.setValues(<4,4>) = <4,4>");
});

test("subtract()", function() {
  var v12 = new Vector2D(1, 2);
  var v34 = new Vector2D(3, 4);
  var v = new Vector2D(-2, -2);

  equal(v12.subtract(v34).equals(v), true, "<1,2> - <3,4> = <-2,-2>");
});

test("toString()", function() {
  var v12 = new Vector2D(1, 2);

  equal(v12.toString(), "Vector2D(1, 2)", "<1,2> = \"Vector2D(1, 2)\"");
});

test("translate()", function() {
  var v11 = new Vector2D(1, 1);

  equal(v11.translate(2).equals(new Vector2D(3, 3)), true, "<1,1>.translate(2) = <3,3>");
  equal(v11.translate(2, -3).equals(new Vector2D(5, 0)), true, "<2,2>.translate(2, -3) = <5,0>");
});

test("tripleProduct()", function() {
  var va = new Vector2D(1, 2);
  var vb = new Vector2D(3, 4);
  var vc = new Vector2D(5, 6);
  var vtp = new Vector2D(12, -10);

  equal(Vector2D.tripleProduct(va, vb, vc).equals(vtp), true, "tripleProduct(<1,2>, <3,4>, <5,6>) = <10,-12>");
});

module("Math - Vector3D", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

test("constructor", function() {
  var v0 = new Vector3D();
  var v000 = new Vector3D(0, 0, 0);
  var v123 = new Vector3D(1, 2, 3);
  var v123_2 = new Vector3D(v123);

  equal(v0.equals(v000), true, "new Vector3D() equals new Vector3D(0, 0, 0)");
  equal(v123.equals(v123_2), true, "new Vector3D(1, 2, 3) equals new Vector3D(new Vector3D(1,2,3))");
});

test("add()", function() {
  var v12 = new Vector3D(1, 2, 5);
  var v34 = new Vector3D(3, 4, 7);
  var v = new Vector3D(4, 6, 12);

  equal(v12.add(v34).equals(v), true, "<1,2,5> + <3,4,7> = <4,6,12>");
});

test("angleBetween()", function() {
  var v100 = new Vector3D(1, 0, 0);
  var v_101 = new Vector3D(-1, 0, 1);
  var v0_11 = new Vector3D(0, -1, 1);

  equal(v100.angleBetween(v_101), 3 * Math.PI / 4, "<1,0,0>.angleBetween(<-1,0,1>) = 3*PI/4");
  equal(v100.angleBetween(v0_11), Math.PI / 2, "<1,0,0>.angleBetween(<0,-1,1>) = PI/2");
});

test("angleTo()", function() {
  var v123 = new Vector3D(3, 2, 1);
  var v321 = new Vector3D(1, 2, 3);
  var result = new Vector3D(v321).subtract(v123).angleBetween(new Vector3D(1,0,0));
  var result2 = v123.angleTo(v321);

  equal(result, result2, "<1,2,3>.angleTo(<3,2,1>) = (<3,2,1>-<1,2,3>).angleBetween(<1,0,0>)");
});

test("clone()", function() {
  var v0 = new Vector3D();
  var v3_72 = new Vector3D(3, -7, 2);

  equal(v0.equals(v0.clone()), true, "<0,0,0> = <0,0,0>.clone()");
  equal(v3_72.clone().equals(v3_72), true, "<3,-7,2>.clone() = <3,-7,2>");
});

test("distance()", function() {
  var v0 = new Vector3D();
  var v100 = new Vector3D(1, 0, 0);
  var v110 = new Vector3D(1, 1, 0);

  equal(v100.distance(v110), 1, "<1,0,0>.distance(<1,1,0>) = 1");
  equal(v0.distance(v110), Math.sqrt(2), "<0,0,0>.distance(<1,1,0>) = sqrt(2)");
});

test("distanceSq()", function() {
  var v0 = new Vector3D();
  var v100 = new Vector3D(1, 0, 0);
  var v110 = new Vector3D(1, 1, 0);

  equal(v100.distanceSq(v110), 1, "<1,0,0>.distanceSq(<1,1,0>) = 1");
  equal(v0.distanceSq(v110), 2, "<0,0,0>.distanceSq(<1,1,0>) = 2");
});

test("divide()", function() {
  var v125 = new Vector3D(1, 2, 5);
  var v3410 = new Vector3D(3, 4, 10);
  var v = new Vector3D(1 / 3, 2 / 4, 5 / 10);

  equal(v125.divide(v3410).equals(v), true, "<1,2,5> / <3,4,6> = <1/3,1/2,1/2>");
});

test("dotProduct()", function() {
  var v127 = new Vector3D(1, 2, 7);
  var v348 = new Vector3D(3, 4, 8);
  var v469 = new Vector3D(4, 6, 9);

  equal(v127.dotProduct(v348), 67, "<1,2,7>.dotProduct(<3,4,8>) = 67");
  equal(v348.dotProduct(v469), 108, "<3,4,8>.dotProduct(<4,6,9>) = 108");
  equal(v469.dotProduct(v127), 79, "<4,6,9>.dotProduct(<1,2,7>) = 79");
});

test("crossProduct()", function() {
  var v127 = new Vector3D(1, 2, 7);
  var v348 = new Vector3D(3, 4, 8);
  var v469 = new Vector3D(4, 6, 9);

  equal(v127.crossProduct(v348).equals(new Vector3D(-12,13,-2)), true, "<1,2,7>.crossProduct(<3,4,8>) = <-12,13,-2>");
  equal(v348.crossProduct(v469).equals(new Vector3D(-12,5,2)), true, "<3,4,8>.crossProduct(<4,6,9>) = <-12,5,2>");
  equal(v469.crossProduct(v127).equals(new Vector3D(24,-19,2)), true, "<4,6,9>.crossProduct(<1,2,7>) = <24,-19,2>");
});

test("equals()", function() {
  var v127 = new Vector3D(1, 2, 7);
  var v348 = new Vector3D(3, 4, 8);
  var v469 = new Vector3D(4, 6, 9);

  equal(v127.equals(new Vector3D(1, 2, 7)), true, "<1,2,7>.equals(<1,2,7>) = true");
  equal(v348.equals(new Vector3D(3, 4, 8)), true, "<3,4,8>.equals(<3,4,8>) = true");
  equal(v469.equals(new Vector3D(4, 6, 9)), true, "<4,6,9>.equals(<4,6,9>) = true");
});

test("getNormal()", function() {
  var v100 = new Vector3D(1, 0, 0);
  var v321 = new Vector3D(3, 2, 1);

  equal(v100.getNormal(v321).equals((new Vector3D(0, -1, 2)).normalize()), true, "<1,0,0>.getNormal(<3,2,1>) = <0, -1/sqrt(5), 2/sqrt(5)>");
});

test("isZero()", function() {
  var v0 = new Vector3D();
  var v102 = new Vector3D(1, 0, 2);

  equal(v0.isZero(), true, "<0,0,0>.isZero() = true");
  equal(v102.isZero(), false, "<1,0,2>.isZero() = false");
});

test("magnitude()", function() {
  var v0 = new Vector3D();
  var v100 = new Vector3D(1, 0, 0);
  var v_792 = new Vector3D(-7, 9, 2);

  equal(v0.magnitude(), 0, "<0,0,0>.magnitude() = 0");
  equal(v100.magnitude(), 1, "<1,0,0>.magnitude() = 1");
  equal(v_792.magnitude(), Math.sqrt(134), "<-7,9,2>.magnitude() = Math.sqrt(134)");
});

test("magnitudeSq()", function() {
  var v0 = new Vector3D();
  var v100 = new Vector3D(1, 0, 0);
  var v_792 = new Vector3D(-7, 9, 2);

  equal(v0.magnitudeSq(), 0, "<0,0,0>.magnitudeSq() = 0");
  equal(v100.magnitudeSq(), 1, "<1,0,0>.magnitudeSq() = 1");
  equal(v_792.magnitudeSq(), 134, "<-7,9,2>.magnitudeSq() = 134");
});

test("multiply()", function() {
  var v125 = new Vector3D(1, 2, 5);
  var v346 = new Vector3D(3, 4, 6);
  var v = new Vector3D(3, 8, 30);

  equal(v125.multiply(v346).equals(v), true, "<1,2,5> * <3,4,6> = <3,8,30>");
});

test("negate()", function() {
  var v_79_2 = new Vector3D(-7, 9, -2);
  var v7_92 = new Vector3D(7, -9, 2);

  equal(v_79_2.negate().equals(v7_92), true, "<-7,9,-2>.negate() = <7,-9,2>");
});

test("normalize()", function() {
  var v0 = new Vector3D();
  var v010 = new Vector3D(0, 1, 0);
  var v_48_2 = new Vector3D(-4, 8, -2);

  equal(v0.normalize().equals(new Vector3D(1, 0, 0)), true, "<0,0,0>.normalize() = <1,0,0>");
  equal(v010.normalize().equals(new Vector3D(0, 1, 0)), true, "<0,1,0>.normalize() = <0,1,0>");
  equal(v_48_2.normalize().equals(new Vector3D(-2/Math.sqrt(21), 4/Math.sqrt(21), -1/Math.sqrt(21))), true,
    "<-4,8,-2>.normalize() = <-2/Math.sqrt(21), 4/Math.sqrt(21), -1/Math.sqrt(21)>");
});

test("scale()", function() {
  var v112 = new Vector3D(1, 1, 2);

  equal(v112.scale(2).equals(new Vector3D(2, 2, 4)), true, "<1,1,2>.scale(2) = <2,2,4>");
  equal(v112.scale(2, -3, -1).equals(new Vector3D(4, -6, -4)), true, "<2,2,4>.scale(2, -3, -1) = <4,-6, -4>");
});

test("magnitudeSq()", function() {
  var v345 = new Vector3D(3, 4, 12);

  equal(v345.normalize().scaleToMagnitude(13).equals(new Vector3D(3, 4, 12)), true, "<3,4,12>.normalize().scaleToMagnitude(13) = <3,4,12>");
});

test("setValues", function() {
  var v0 = new Vector3D();
  var v126 = new Vector3D(1, 2, 6);
  var v448 = new Vector3D(4, 4, 8);

  equal(v0.setValues(1, 2, 6).equals(v126), true, "<0,0,0>.setValues(<1,2,6>) = <1,2,6>");
  equal(v0.setValues(v448).equals(v448), true, "<1,2,6>.setValues(<4,4,8>) = <4,4,8>");
});

test("subtract()", function() {
  var v121 = new Vector3D(1, 2, 1);
  var v341 = new Vector3D(3, 4, 1);
  var v = new Vector3D(-2, -2, 0);

  equal(v121.subtract(v341).equals(v), true, "<1,2,1> - <3,4,1> = <-2,-2,0>");
});

test("toString()", function() {
  var v123 = new Vector3D(1, 2, 3);

  equal(v123.toString(), "Vector3D(1, 2, 3)", "<1,2,3> = \"Vector3D(1, 2, 3)\"");
});

test("translate()", function() {
  var v111 = new Vector3D(1, 1, 1);

  equal(v111.translate(2).equals(new Vector3D(3, 3, 3)), true, "<1,1,1>.translate(2) = <3,3,3>");
  equal(v111.translate(2, -3, 1).equals(new Vector3D(5, 0, 4)), true, "<3,3,3>.translate(2, -3, 1) = <5,0,4>");
});

test("tripleProduct()", function() {
  var va = new Vector3D(1, 2, 7);
  var vb = new Vector3D(3, 4, 8);
  var vc = new Vector3D(5, 6, 9);
  var vtp = new Vector3D(129, 98, -137);

  equal(Vector3D.tripleProduct(va, vb, vc).equals(vtp), true, "tripleProduct(<1,2,7>, <3,4,8>, <5,6,9>) = <129,98,-137>");
});

module("Matrix2D");

test("apply()", function() {
  equal((new Matrix2D()).rotate(Math.PI / 2).apply(new Vector2D(1, 2)).equals(new Vector2D(-2, 1.0000000000000002)),
    true, "(new Matrix2D()).rotate(Math.PI/2).apply(new Vector2D(1, 2)).equals(new Vector2D(-2, 1.0000000000000002))");
});

test("clone()", function() {
  equal((new Matrix2D(1, 2, 3, 4, 5, 6)).clone().equals(new Matrix2D(1, 2, 3, 4, 5, 6)),
    true, "(new Matrix2D(1, 2, 3, 4, 5, 6)).clone().equals(new Matrix2D(1, 2, 3, 4, 5, 6))");
});

test("combine()", function() {
  equal((new Matrix2D()).scale(2).combine((new Matrix2D()).rotate(0.75)).equals((new Matrix2D()).scale(2).rotate(0.75)),
    true, "(new Matrix2D()).scale(2).combine((new Matrix2D()).rotate(0.75)).equals((new Matrix2D()).scale(2).rotate(0.75))");
});

test("equals()", function() {
  equal((new Matrix2D()).equals(new Matrix2D()),
    true, "(new Matrix2D()).equals(new Matrix2D())");
  equal((new Matrix2D()).scale(2).equals(new Matrix2D()),
    false, "(new Matrix2D()).scale(2).equals(new Matrix2D())");
});

test("determinant()", function() {
  equal((new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).determinant(),
    6, "(new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).determinant()");
});

test("invert()", function() {
  var m = new Matrix2D(4, 3, 3, 2, 0, 0);
  var m2 = new Matrix2D(-2, 3, 3, -4, 0, 0);
  ok( m.invert().equals(m2), "Matrix (4,3,3,2) inverts to (-2,3,3,-4)");
});

test("isIdentity()", function() {
  equal((new Matrix2D()).isIdentity(),
    true, "(new Matrix2D()).isIdentity()");
  equal((new Matrix2D()).scale(2).isIdentity(),
    false, "(new Matrix2D()).scale(2).isIdentity()");
});

test("isInvertible()", function() {
  equal((new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).isInvertible(),
    true, "(new Matrix2D()).scale(2, 3).rotate(Math.PI / 2).isInvertible()");
  equal((new Matrix2D()).scale(0, 3).rotate(Math.PI / 2).isInvertible(),
    false, "(new Matrix2D()).scale(0, 3).rotate(Math.PI / 2).isInvertible()");
});

test("preRotate()", function() {
  equal((new Matrix2D()).preRotate(0).equals(new Matrix2D()),
    true, "(new Matrix2D()).preRotate(0).equals(new Matrix2D())");
  equal((new Matrix2D()).preRotate(Math.PI / 2).equals((new Matrix2D()).rotate(Math.PI / 2)),
    true, "(new Matrix2D()).preRotate(Math.PI / 2).equals((new Matrix2D()).rotate(Math.PI / 2))");
});

test("preScale()", function() {
  equal((new Matrix2D()).preScale(2).equals(new Matrix2D(2, 0, 0, 2, 0, 0)),
    true, "(new Matrix2D()).preScale(2).equals(new Matrix2D(2, 0, 0, 2, 0, 0))");
  equal((new Matrix2D()).preScale(2.5).equals((new Matrix2D()).scale(2.5)),
    true, "(new Matrix2D()).preScale(2.5).equals((new Matrix2D()).scale(2.5))");
});

test("preTranslate()", function() {
  equal((new Matrix2D()).preTranslate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
    true, "(new Matrix2D()).preTranslate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)");
  equal((new Matrix2D()).preTranslate(1, 2).equals((new Matrix2D()).translate(new Vector2D(1, 2))),
    true, "(new Matrix2D()).preTranslate(1, 2).equals((new Matrix2D()).translate(new Vector2D(1, 2)))");
  equal((new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
    true, "(new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
  equal((new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals((new Matrix2D()).translate(new Vector2D(1, 2))),
    true, "(new Matrix2D()).preTranslate(new Vector2D(1, 2)).equals((new Matrix2D()).translate(new Vector2D(1, 2)))");
});

test("rotate()", function() {
  equal((new Matrix2D()).rotate(0).equals(new Matrix2D()),
    true, "(new Matrix2D()).rotate(0).equals(new Matrix2D())");
});

test("scale()", function() {
  equal((new Matrix2D()).scale(2, 3).equals(new Matrix2D(2, 0, 0, 3, 0, 0)),
    true, "(new Matrix2D()).scale(2, 3).equals(new Matrix2D(2, 0, 0, 3, 0, 0))");
});

test("setValues()", function() {
  equal((new Matrix2D()).setValues(1, 2, 3, 4, 5, 6).equals(new Matrix2D(1, 2, 3, 4, 5, 6)),
    true, "(new Matrix2D()).setValues(1, 2, 3, 4, 5, 6).equals(new Matrix2D(1, 2, 3, 4, 5, 6))");
});

test("toString()", function() {
  equal((new Matrix2D()).toString(),
    "Matrix2D([1, 0, 0] [0, 1, 0] [0, 0, 1])", "(new Matrix2D()).toString()");
});

test("translate()", function() {
  equal((new Matrix2D()).translate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
    true, "(new Matrix2D()).translate(1, 2).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
  equal((new Matrix2D()).translate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2)),
    true, "(new Matrix2D()).translate(new Vector2D(1, 2)).equals(new Matrix2D(1, 0, 0, 1, 1, 2))");
});