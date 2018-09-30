(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Scenes");

  test("Scene calling", function(_) {
    var x = 0;
    var sceneInit = function() {
      x = 13;
    };
    Crafty.scene("test-call", sceneInit);
    Crafty.scene("test-call");
    _.strictEqual(x, 13, "Scene called succesfully.");
  });

  test("Scene parameters", function(_) {
    var x = 0;
    var paramTaker = function(y) {
      x = y;
    };
    Crafty.scene("test-param", paramTaker);
    Crafty.scene("test-param", 11);
    _.strictEqual(x, 11, "Scene called succesfully with parameter.");
  });

  test("Calling a scene destroys 2D entities", function(_) {
    Crafty.e("2D");
    var sceneInit = function() {};
    Crafty.scene("test-destroy", sceneInit);
    Crafty.scene("test-destroy");
    var l = Crafty("2D").length;
    _.strictEqual(l, 0, "2D entity destroyed on scene change.");
  });

  test("Calling a scene doesn't destroy 2D entities with Persist", function(_) {
    Crafty.e("2D, Persist");
    var sceneInit = function() {};
    Crafty.scene("test-persist", sceneInit);
    Crafty.scene("test-persist");
    var l = Crafty("2D").length;
    _.strictEqual(l, 1, "Persist entity remains on scene change.");
  });

  test("Scene uninit function called", function(_) {
    var x = 0;
    var y = 0;
    var sceneInit = function() {
      x = 13;
    };
    var sceneUninit = function() {
      x = 20;
    };
    var sceneGame = function() {
      y = 5;
    };
    Crafty.defineScene("test-uninit", sceneInit, sceneUninit);
    Crafty.defineScene("game", sceneGame);
    Crafty.enterScene("test-uninit");
    Crafty.enterScene("game");
    _.strictEqual(
      x,
      20,
      "Uninit scene called successfully when chanced to another scene"
    );
  });
})();
