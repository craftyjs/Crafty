(function() {
  var module = QUnit.module;

  module("2D");
  test("pos Pass In Object", function() {
    var player = Crafty.e("2D").attr({
      x: 0,
      y: 50,
      w: 100,
      h: 150
    });
    
    var posObject = {};

    player.pos(posObject);

    strictEqual(player.pos()._x, 0, "X value");
    strictEqual(posObject._x, 0, "X value");

    strictEqual(player.pos()._y, 50, "Y value");
    strictEqual(posObject._y, 50, "Y value");

    strictEqual(player.pos()._w, 100, "W value");
    strictEqual(posObject._w, 100, "W value");

    strictEqual(player.pos()._h, 150, "H value");
    strictEqual(posObject._h, 150, "H value");
  });

})();