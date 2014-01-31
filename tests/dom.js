module("DOM", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

test("avoidCss3dTransforms", function() {
  var useCss3dTransforms = Crafty.e("2D, DOM")
    .attr({
      x: 10,
      y: 10
    })
    .draw();

  strictEqual(useCss3dTransforms.avoidCss3dTransforms, false);
  if (Crafty.support.css3dtransform) {
    strictEqual(useCss3dTransforms._cssStyles.transform, "translate3d(10px,10px,0)");
    strictEqual(useCss3dTransforms._cssStyles.top, "");
    strictEqual(useCss3dTransforms._cssStyles.left, "");
  } else {
    strictEqual(avoidCss3dTransforms._cssStyles.transform, "");
    strictEqual(avoidCss3dTransforms._cssStyles.top, 10);
    strictEqual(avoidCss3dTransforms._cssStyles.left, 10);
  }

  var avoidCss3dTransforms = Crafty.e("2D, DOM")
    .attr({
      x: 10,
      y: 10,
      avoidCss3dTransforms: true
    })
    .draw();

  strictEqual(avoidCss3dTransforms.avoidCss3dTransforms, true);
  strictEqual(avoidCss3dTransforms._cssStyles.transform, "");
  strictEqual(avoidCss3dTransforms._cssStyles.top, 10);
  strictEqual(avoidCss3dTransforms._cssStyles.left, 10);
  // Clean up
  Crafty("*").destroy();
});

test("removeComponent removes element class", function() {
  var element = Crafty.e("DOM");
  hasClassName = function(el, name) {
    return el._element.className.indexOf(name) >= 0;
  };
  element.addComponent("removeMe");
  strictEqual(element.has("removeMe"), true, "component added");
  strictEqual(hasClassName(element, "removeMe"), true, "classname added");

  element.removeComponent("removeMe");
  strictEqual(element.has("removeMe"), false, "component removed");
  strictEqual(hasClassName(element, "removeMe"), false, "classname removed");
});