(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("DebugLayer");

  test("DebugCanvas", function(_) {
    if (!(Crafty.support.canvas)) {
      expect(0);
      return;
    }
    var e = Crafty.e("2D, DebugCanvas");
    var ctx = Crafty.DebugCanvas.context;

    e.debugFill("purple");
    _.strictEqual(e._debug.fillStyle, "purple", "fill style set correctly on entity");

    e.debugStroke("green");
    _.strictEqual(e._debug.strokeStyle, "green", "stroke style set correctly on entity");

    e.debugDraw(ctx);
    _.strictEqual(ctx.fillStyle, "#800080", "context.fillStyle set correctly on draw"); // fillStyle will report the hex code
    _.strictEqual(ctx.strokeStyle, "#008000", "context.strokeStyle set correctly on draw");

    e.debugFill();
    _.strictEqual(e._debug.fillStyle, "red", "default fill style set correctly");

    e.debugStroke();
    _.strictEqual(e._debug.strokeStyle, "red", "default stroke style set correctly");


    e.destroy();

  });

  test("VisibleMBR and DebugRect", function(_) {
    var e = Crafty.e("2D, VisibleMBR").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    });
    e._assignRect();
    _.strictEqual(e.debugRect._x, 10, "debugRect has correct x coord");
    _.strictEqual(e.debugRect._h, 20, "debugRect has correct height");

    e.rotation = 90;
    e._assignRect();
    _.strictEqual(e.debugRect._h, 10, "debugRect has correct height of MBR after rotation");

    e.destroy();

  });

  test("Hitbox debugging", function(_) {
    var e = Crafty.e("2D, Collision, WiredHitBox").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).collision();
    _.strictEqual(e.polygon.points[0], 10, "WiredHitBox -- correct x coord for upper right corner");
    _.strictEqual(e.polygon.points[5], 30, "correct y coord for lower right corner");
    _.notEqual(typeof e._debug.strokeStyle, "undefined", "stroke style is assigned");
    _.strictEqual(typeof e._debug.fillStyle, "undefined", "fill style is undefined");

    e.destroy();

    var e2 = Crafty.e("2D, Collision, SolidHitBox").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).collision();
    _.strictEqual(e2.polygon.points[0], 10, "SolidHitBox -- correct x coord for upper right corner");
    _.strictEqual(e2.polygon.points[5], 30, "correct y coord for lower right corner");
    _.strictEqual(typeof e2._debug.strokeStyle, "undefined", "stroke style is undefined");
    _.notEqual(typeof e2._debug.fillStyle, "undefined", "fill style is assigned");

    e2.collision(new Crafty.polygon([0, 0, 15, 0, 0, 15]));
    _.strictEqual(e2.polygon.points[5], 25, "After change -- correct y coord for third point");

    e2.destroy();

  });

  test("AreaMap debugging", function(_) {
    var e = Crafty.e("2D, AreaMap, WiredAreaMap").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).areaMap(50, 0, 100, 100, 0, 100);
    _.strictEqual(e.polygon.points[0], 60, "WiredAreaMap -- correct x coord for upper right corner");
    _.strictEqual(e.polygon.points[5], 110, "correct y coord for lower right corner");
    _.notEqual(typeof e._debug.strokeStyle, "undefined", "stroke style is assigned");
    _.strictEqual(typeof e._debug.fillStyle, "undefined", "fill style is undefined");

    e.destroy();

    var e2 = Crafty.e("2D, AreaMap, SolidAreaMap").attr({
      x: 10,
      y: 10,
      w: 10,
      h: 20
    }).areaMap(50, 0, 100, 100, 0, 100);
    _.strictEqual(e2.polygon.points[0], 60, "SolidAreaMap -- correct x coord for upper right corner");
    _.strictEqual(e2.polygon.points[5], 110, "correct y coord for lower right corner");
    _.strictEqual(typeof e2._debug.strokeStyle, "undefined", "stroke style is undefined");
    _.notEqual(typeof e2._debug.fillStyle, "undefined", "fill style is assigned");

    e2.areaMap(new Crafty.polygon([0, 0, 15, 0, 0, 15]));
    _.strictEqual(e2.polygon.points[5], 25, "After change -- correct y coord for third point");

    e2.destroy();

  });
})();
