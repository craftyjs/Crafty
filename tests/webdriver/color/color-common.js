function generateScript(renderMethod) {
  var testScript = function() {
    var box = Crafty.e("2D, $renderMethod").attr({
      x: 0,
      y: 0,
      w: 320,
      h: 240
    });

    function initial() {
      box.addComponent("Color");
      signalBarrier("initial");
    }

    function opaque() {
      box.color("rgb(0, 255, 0)");
      signalBarrier("opaque");
    }

    function transparent() {
      box.color("rgba(0, 0, 255, 0.5)");
      signalBarrier("transparent");
    }

    waitBarrier("initial", initial);
    waitBarrier("opaque", opaque);
    waitBarrier("transparent", transparent);
  };

  return testScript.toString().replace("$renderMethod", renderMethod);
}

module.exports = function(QUnit, browser, renderMethod) {
  QUnit.test("Color - " + renderMethod, function(assert) {
    return browser
      .testUrl(generateScript(renderMethod))
      .signalBarrier("initial")
      .waitBarrier("initial")
      .assertResemble("color-initial")
      .signalBarrier("opaque")
      .waitBarrier("opaque")
      .assertResemble("color-opaque")
      .signalBarrier("transparent")
      .waitBarrier("transparent")
      .assertResemble("color-transparent");
  });
};
