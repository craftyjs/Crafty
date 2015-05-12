(function() {
  var module = QUnit.module;

  module("DOM", {
    setup: function() {
      var div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top = '10000px';
      div.textContent = 'test';
      div.id = 'test';
      document.body.appendChild(div);

      Crafty.stage.x = 10;
      Crafty.stage.y = 10;
      Crafty.viewport.scale();
      Crafty.viewport.x = 0;
      Crafty.viewport.y = 0;

      (document.documentElement || document.body).scrollTop = 100;
    }
  });

  test("translate coordinates", function() {
    strictEqual(Crafty.DOM.translate(10, 10).x, 0, "translates x from 10 to 0");
    strictEqual(Crafty.DOM.translate(10, 10).y, 100, "translates y from 10 to 100");
  });
})();