(function() {
  var module = QUnit.module;

  module("DOM");

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
      strictEqual(useCss3dTransforms._cssStyles.transform, "");
      strictEqual(useCss3dTransforms._cssStyles.top, 10);
      strictEqual(useCss3dTransforms._cssStyles.left, 10);
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
    var hasClassName = function(el, name) {
      return el._element.className.indexOf(name) >= 0;
    };
    element.addComponent("removeMe");
    strictEqual(element.has("removeMe"), true, "component added");
    strictEqual(hasClassName(element, "removeMe"), true, "classname added");

    element.removeComponent("removeMe");
    strictEqual(element.has("removeMe"), false, "component removed");
    strictEqual(hasClassName(element, "removeMe"), false, "classname removed");
  });

  test("DOM component correctly invalidates", function(){
    var element = Crafty.e("DOM");
    var node = element._element;
    strictEqual(element._changed, true, "element starts dirty");
    element._changed = false;
    element.trigger("Invalidate");
    strictEqual(element._changed, true, "element dirty after invalidate");
  });


  test("removing DOM component cleans up", function(){
    var element = Crafty.e("DOM");
    var node = element._element;
    strictEqual(node.parentNode, Crafty.domLayer._div, "child of the stage");
    element._changed = false;
    element.removeComponent("DOM");
    element.trigger("Invalidate");
    strictEqual(element._changed, false, "no longer gets dirty after removal of 'DOM'");
    strictEqual(node.parentNode, null, "no parent node after removal of 'DOM'");

  });


  test("Removing Color component resets DOM correctly", function(){
    var element = Crafty.e("DOM, Color");
    var node = element._element;
    element.color("red");

    // Style won't be updated until rendering occurs
    Crafty.timer.simulateFrames(1);
    notEqual(node.style.backgroundColor, "transparent", "Element is not initially transparent");

    element.removeComponent("Color");
    equal(node.style.backgroundColor, "transparent", "Transparent after removal of Color");
  });
})();