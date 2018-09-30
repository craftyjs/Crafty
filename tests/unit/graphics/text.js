(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Text");

  test("fontFamily", function(_) {
    var text = Crafty.e("DOM, Text")
      .textFont({
        family: "Times New Roman 400",
        size: "30px"
      })
      .text("Test");
    _.strictEqual(
      text.attr("_textFont").family,
      "'Times New Roman 400'",
      "Expect to have singlequotes arount the family property."
    );
  });

  test("text string", function(_) {
    var text = Crafty.e("DOM, Text");
    _.strictEqual(text.text(), "", "Expect text to be empty value");

    text.text("123");
    _.strictEqual(text._text, "123", "Expect text to be set");
    _.strictEqual(text.text(), "123", "Expect text to be get");
  });

  test("static textGenerator", function(_) {
    var text = Crafty.e("DOM, Text");
    var textValue1 = "123";
    var textValue2 = "456";

    text.testField = textValue1;
    text.text(function() {
      return this.testField;
    });
    _.strictEqual(
      text._text,
      textValue1,
      "Expect text to be set by generator function"
    );

    text.testField = textValue2;
    _.strictEqual(text._text, textValue1, "Expect text to not be changed");
  });

  test("dynamic textGenerator", function(_) {
    var text = Crafty.e("DOM, Text");
    var textValue1 = "123";
    var textValue2 = "456";
    text.testField = textValue1;

    // Test one-off function invocation
    text.text(function() {
      return this.testField;
    });
    _.strictEqual(
      text._text,
      textValue1,
      "Expect text to be set by generator function"
    );
    text.testField = textValue2;
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");

    // Test dynamic function invocation
    text.dynamicTextGeneration(true);
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(
      text._text,
      textValue2,
      "Expect text to be updated by generator function"
    );
  });

  test("dynamic textGenerator with custom event", function(_) {
    var text = Crafty.e("DOM, Text");
    var textValue1 = "123";
    var textValue2 = "456";
    text.testField = textValue1;

    // Test one-off function invocation
    text.text(function(data) {
      if (data) return data;
      return this.testField;
    });
    _.strictEqual(
      text._text,
      textValue1,
      "Expect text to be set by generator function"
    );
    text.testField = textValue2;
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");

    // Test dynamic function invocation
    text.dynamicTextGeneration(true, "MyEvent");
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(text._text, textValue1, "Expect text to be initial value");
    text.trigger("MyEvent");
    _.strictEqual(
      text._text,
      textValue2,
      "Expect text to be updated by generator function"
    );

    // Test parameter passing
    text.trigger("MyEvent", "789");
    _.strictEqual(
      text._text,
      "789",
      "Expect text to be updated by generator function"
    );
  });

  test("_getFontHeight", function(_) {
    var e = Crafty.e("Text");
    var h = e._getFontHeight("10px");
    _.strictEqual(h, 10, "Font height is 10 pixels");
    h = e._getFontHeight("10in");
    _.strictEqual(h, 960, "Font height is 960 pixels");
  });

  test("Width of canvas element", function(_) {
    var e = Crafty.e("2D, Canvas, Text");
    e.text("a");
    var w1 = e.w;
    e.text("abc");
    var w2 = e.w;
    _.ok(w2 > w1, "Entity increases in width when text is changed.");
  });

  test("Height of canvas element", function(_) {
    var e = Crafty.e("2D, Canvas, Text");
    e.text("a");
    e.textFont("size", "10");
    var h1 = e.h;
    _.ok(h1 > 10, "Font height set correctly.");
    e.textFont("size", "20");
    var h2 = e.h;
    _.ok(h2 > 20, "Font height set correctly.");
    _.ok(h2 > h1, "Entity increases in height when font size is increased.");
  });

  test("Color should be defined", function(_) {
    var e = Crafty.e("2D, DOM, Text");
    e.text("a");
    e.textColor("#00FF00");
    _.ok(e._textColor === "rgba(0, 255, 0, 1)");
    e.textColor("rgba(255,0,0,0.5)");
    _.ok(e._textColor === "rgba(255, 0, 0, 0.5)");
    e.destroy();
  });

  test("Alignment should be defined", function(_) {
    var e;
    var checkAlignment = function() {
      _.ok(e._textAlign === e.defaultTextAlign);
      e.text("a");
      e.textAlign("center");
      _.ok(e._textAlign === "center");
    };
    e = Crafty.e("2D, Canvas, Text");
    checkAlignment();
    e = Crafty.e("2D, DOM, Text");
    checkAlignment();
  });

  test("Listen to style events for DOM Text", function(_) {
    var e = Crafty.e("2D, DOM, Text");

    e.text("hey how are you")
      .textColor("#00FF00")
      .textFont("size", "50px")
      .textAlign("center");
    _.strictEqual(e._textColor, "rgba(0, 255, 0, 1)", "Color should be green.");
    _.strictEqual(e._textFont.size, "50px", "Size should be 50px.");
    _.strictEqual(e._textAlign, "center", "Alignment should be centered.");

    e.css({
      color: "red",
      fontSize: "30px",
      textAlign: "right"
    });

    _.strictEqual(e._textColor, "rgba(255, 0, 0, 1)", "Color should be red.");
    _.strictEqual(e._textFont.size, "30px", "Size should be 30px.");
    _.strictEqual(e._textAlign, "right", "Alignment should be right.");
  });

  test("MBR after alignment change", function(_) {
    var e = Crafty.e("2D, Canvas, Text");
    e.text("a");

    var left = e.mbr()._x;
    var width = e.mbr()._w;
    e.textAlign("center");
    _.ok(
      left > e.mbr()._x,
      "Left side of MBR after center aligning is not less than the old one"
    );
    /* width gets rounded, make sure it's close*/
    _.ok(
      e.mbr()._w - width <= 1,
      "Width of MBR is different after center aligning"
    );

    left = e.mbr()._x;
    e.textAlign("right");
    _.ok(
      left > e.mbr()._x,
      "Left side of MBR after right aligning is not less than the old one"
    );
    _.ok(
      e.mbr()._w - width <= 1,
      "Width of MBR is different after right aligning"
    );

    left = e.mbr()._x;
    e.textAlign("right");
    _.strictEqual(
      left,
      e.mbr()._x,
      "Left side of MBR after right aligning again is different"
    );
    _.ok(
      e.mbr()._w - width <= 1,
      "Width of MBR is different after right aligning again"
    );

    left = e.mbr()._x;
    e.textAlign("left");
    _.ok(
      left < e.mbr()._x,
      "Left side of MBR after left aligning is not greater than the old one"
    );
    _.ok(
      e.mbr()._w - width <= 1,
      "Width of MBR is different after left aligning"
    );
  });
})();
