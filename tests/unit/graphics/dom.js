(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("DOM");

  test("avoidCss3dTransforms", function(_) {
    var useCss3dTransforms = Crafty.e("2D, DOM")
      .attr({
        x: 10,
        y: 10
      })
      .draw();

    _.strictEqual(useCss3dTransforms.avoidCss3dTransforms, false);
    if (Crafty.support.css3dtransform) {
      _.strictEqual(useCss3dTransforms._cssStyles.transform, "translate3d(10px,10px,0)");
      _.strictEqual(useCss3dTransforms._cssStyles.top, "");
      _.strictEqual(useCss3dTransforms._cssStyles.left, "");
    } else {
      _.strictEqual(useCss3dTransforms._cssStyles.transform, "");
      _.strictEqual(useCss3dTransforms._cssStyles.top, 10);
      _.strictEqual(useCss3dTransforms._cssStyles.left, 10);
    }

    var avoidCss3dTransforms = Crafty.e("2D, DOM")
      .attr({
        x: 10,
        y: 10,
        avoidCss3dTransforms: true
      })
      .draw();

    _.strictEqual(avoidCss3dTransforms.avoidCss3dTransforms, true);
    _.strictEqual(avoidCss3dTransforms._cssStyles.transform, "");
    _.strictEqual(avoidCss3dTransforms._cssStyles.top, 10);
    _.strictEqual(avoidCss3dTransforms._cssStyles.left, 10);
    // Clean up
    Crafty("*").destroy();
  });

  test("removeComponent removes element class", function(_) {
    var element = Crafty.e("DOM");
    var hasClassName = function(el, name) {
      return el._element.className.indexOf(name) >= 0;
    };
    element.addComponent("removeMe");
    _.strictEqual(element.has("removeMe"), true, "component added");
    _.strictEqual(hasClassName(element, "removeMe"), true, "classname added");

    element.removeComponent("removeMe");
    _.strictEqual(element.has("removeMe"), false, "component removed");
    _.strictEqual(hasClassName(element, "removeMe"), false, "classname removed");
  });

  test("DOM component correctly invalidates", function(_){
    var element = Crafty.e("DOM");
    _.strictEqual(element._changed, true, "element starts dirty");
    element._changed = false;
    element.trigger("Invalidate");
    _.strictEqual(element._changed, true, "element dirty after invalidate");
  });


  test("removing DOM component cleans up", function(_){
    var element = Crafty.e("DOM");
    var node = element._element;
    _.strictEqual(node.parentNode, Crafty.s("DefaultDOMLayer")._div, "child of the stage");
    element._changed = false;
    element.removeComponent("DOM");
    element.trigger("Invalidate");
    _.strictEqual(element._changed, false, "no longer gets dirty after removal of 'DOM'");
    _.strictEqual(node.parentNode, null, "no parent node after removal of 'DOM'");

  });


  test("Removing Color component resets DOM correctly", function(_){
    var element = Crafty.e("DOM, Color");
    var node = element._element;
    element.color("red");

    // Style won't be updated until rendering occurs
    Crafty.timer.simulateFrames(1);
    _.notEqual(node.style.backgroundColor, "transparent", "Element is not initially transparent");

    element.removeComponent("Color");
    _.strictEqual(node.style.backgroundColor, "transparent", "Transparent after removal of Color");
  });
})();