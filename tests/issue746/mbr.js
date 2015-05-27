(function() {
  var module = QUnit.module;

  module("2D");
  test("mbr Pass In Object", function() {
    var player = Crafty.e("2D").attr({
      x: 0,
      y: 50,
      w: 100,
      h: 150
    });
    
    var mbrObject = {};

    player.mbr(mbrObject);

    strictEqual(player.mbr()._x, 0, "X value");
    strictEqual(mbrObject._x, 0, "X value");

    strictEqual(player.mbr()._y, 50, "Y value");
    strictEqual(mbrObject._y, 50, "Y value");

    strictEqual(player.mbr()._w, 100, "W value");
    strictEqual(mbrObject._w, 100, "W value");

    strictEqual(player.mbr()._h, 150, "H value");
    strictEqual(mbrObject._h, 150, "H value");
  });

})();
