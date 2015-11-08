(function() {
  var module = QUnit.module;

  module("Isometric");

  test("place tile", function() {
    var iso = Crafty.isometric.size(64, 16);

    var tile1 = Crafty.e("2D").attr({
      x: 0,
      y: 0,
      w: 64,
      h: 16
    });
    var tile2 = Crafty.e("2D").attr({
      x: 100,
      y: 100,
      z: 3,
      w: 64,
      h: 16
    });

    iso.place(0, 0, 0, tile1);
    iso.place(1, 2, 5, tile2);

    equal(tile1.attr('x'), 0, "First tile should default to origin");
    equal(tile1.attr('y'), 0, "First tile should default to origin");
    equal(tile1.attr('z'), 0, "z-index should be transferred unchanged");

    equal(tile2.attr('x'), 64 + Crafty.viewport._x, "Each tile should be offset by the sum of the width of those before it");
    equal(tile2.attr('y'), -24 + Crafty.viewport._y, "The row should be offset by one and a half times the height");
    equal(tile2.attr('z'), 8, "z-index should be added to existing value");

    // Clean up
    Crafty("*").destroy();
  });

  test("pos2px", function() {
    var iso = Crafty.isometric.size(64, 16);

    var origin = iso.pos2px(0, 0);
    equal(origin.left, 0, "First tile should default to origin");
    equal(origin.top, 0, "First tile should default to origin");

    var oddNumberedRow = iso.pos2px(0, 1);
    equal(oddNumberedRow.left, 32, "Odd numbered rows should be be inset by half the width");
    equal(oddNumberedRow.top, 8, "Each row should move down by half the height");

    var evenNumberedRow = iso.pos2px(0, 2);
    equal(evenNumberedRow.left, 0, "Even numbered rows should not be be inset");
    equal(evenNumberedRow.top, 16, "Each row should move down by half the height");

    var numberedColumn = iso.pos2px(3, 0);
    equal(numberedColumn.left, 64 * 3, "Should be inset by the width times the x position");
  });

  test("px2pos", function() {
    var iso = Crafty.isometric.size(64, 16);

    var origin = iso.px2pos(0, 0);
    equal(origin.x, 0, "Origin should be the corner of the lowest numbered tile");
    equal(origin.y, 0, "Origin should be the corner of the lowest numbered tile");

    var oddNumberedRow = iso.px2pos(32, 8);
    equal(oddNumberedRow.x, 0, "Odd numbered rows should be be inset by half the width");
    equal(oddNumberedRow.y, 1, "Each row should move down by half the height");

    var evenNumberedRow = iso.px2pos(0, 16);
    equal(evenNumberedRow.x, 0, "Even numbered rows should not be be inset");
    equal(evenNumberedRow.y, 2, "Each row should move down by half the height");

    var numberedColumn = iso.px2pos(128, 0);
    equal(numberedColumn.x, 2, "Should be inset by the width times the x position");
  });

  test("round trip conversions", function() {
    var iso = Crafty.isometric.size(64, 16);

    var startX = 14;
    var startY = 21;

    var startingPoint = iso.pos2px(startX, startY);
    var end = iso.px2pos(startingPoint.left, startingPoint.top);

    equal(end.x, startX, "x position should match");
    equal(end.y, startY, "y position should match");
  });
})();