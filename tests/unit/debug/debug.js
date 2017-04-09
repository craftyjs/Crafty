(function() {
  var module = QUnit.module;

  module("DebugLayer");

  test("DebugCanvas", function() {
    if (!(Crafty.support.canvas)) {
      expect(0);
      return;
    }
    var e = Crafty.e("2D, DebugCanvas");
    var ctx = Crafty.DebugCanvas.context;

    e.debugFill("purple");
    equal(e._debug.fillStyle, "purple", "fill style set correctly on entity");

    e.debugStroke("green");
    equal(e._debug.strokeStyle, "green", "stroke style set correctly on entity");

    e.debugDraw(ctx);
    equal(ctx.fillStyle, "#800080", "context.fillStyle set correctly on draw"); // fillStyle will report the hex code
    equal(ctx.strokeStyle, "#008000", "context.strokeStyle set correctly on draw");

    e.debugFill();
    equal(e._debug.fillStyle, "red", "default fill style set correctly");

    e.debugStroke();
    equal(e._debug.strokeStyle, "red", "default stroke style set correctly");


    e.destroy();

  });

  test("VisibleMBR and DebugRect", function() {
    var e = Crafty.e("2D, VisibleMBR").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    });
    e._assignRect();
    equal(e.debugRect._x, 10, "debugRect has correct x coord");
    equal(e.debugRect._h, 20, "debugRect has correct height");

    e.rotation = 90;
    e._assignRect();
    equal(e.debugRect._h, 10, "debugRect has correct height of MBR after rotation");

    e.destroy();

  });

  test("Hitbox debugging", function() {
    var e = Crafty.e("2D, Collision, WiredHitBox").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).collision();
    equal(e.polygon.points[0], 10, "WiredHitBox -- correct x coord for upper right corner");
    equal(e.polygon.points[5], 30, "correct y coord for lower right corner");
    notEqual(typeof e._debug.strokeStyle, "undefined", "stroke style is assigned");
    equal(typeof e._debug.fillStyle, "undefined", "fill style is undefined");

    e.destroy();

    var e2 = Crafty.e("2D, Collision, SolidHitBox").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).collision();
    equal(e2.polygon.points[0], 10, "SolidHitBox -- correct x coord for upper right corner");
    equal(e2.polygon.points[5], 30, "correct y coord for lower right corner");
    equal(typeof e2._debug.strokeStyle, "undefined", "stroke style is undefined");
    notEqual(typeof e2._debug.fillStyle, "undefined", "fill style is assigned");

    e2.collision(new Crafty.polygon([0, 0, 15, 0, 0, 15]));
    equal(e2.polygon.points[5], 25, "After change -- correct y coord for third point");

    e2.destroy();

  });

  test("AreaMap debugging", function() {
    var e = Crafty.e("2D, AreaMap, WiredAreaMap").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).areaMap(50, 0, 100, 100, 0, 100);
    equal(e.polygon.points[0], 60, "WiredAreaMap -- correct x coord for upper right corner");
    equal(e.polygon.points[5], 110, "correct y coord for lower right corner");
    notEqual(typeof e._debug.strokeStyle, "undefined", "stroke style is assigned");
    equal(typeof e._debug.fillStyle, "undefined", "fill style is undefined");

    e.destroy();

    var e2 = Crafty.e("2D, AreaMap, SolidAreaMap").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).areaMap(50, 0, 100, 100, 0, 100);
    equal(e2.polygon.points[0], 60, "SolidAreaMap -- correct x coord for upper right corner");
    equal(e2.polygon.points[5], 110, "correct y coord for lower right corner");
    equal(typeof e2._debug.strokeStyle, "undefined", "stroke style is undefined");
    notEqual(typeof e2._debug.fillStyle, "undefined", "fill style is assigned");

    e2.areaMap(new Crafty.polygon([0, 0, 15, 0, 0, 15]));
    equal(e2.polygon.points[5], 25, "After change -- correct y coord for third point");

    e2.destroy();

  });
})();
