(function() {
  var module = QUnit.module;

  module("Text");

  test("fontFamily", function() {
    var text = Crafty.e('DOM, Text').textFont({
      family: 'Times New Roman 400',
      size: '30px'
    }).text('Test');
    equal(text.attr('_textFont').family, "'Times New Roman 400'", 'Expect to have singlequotes arount the family property.');

  });

  test("_getFontHeight", function() {
    var e = Crafty.e("Text");
    var h = e._getFontHeight("10px");
    equal(h, 10, "Font height is 10 pixels");
    h = e._getFontHeight("10in");
    equal(h, 960, "Font height is 960 pixels");
  });

  test("Width of canvas element", function() {
    var e = Crafty.e("2D, Canvas, Text");
    e.text("a");
    var w1 = e.w;
    e.text("abc");
    var w2 = e.w;
    ok(w2 > w1, "Entity increases in width when text is changed.");
  });

  test("Height of canvas element", function() {
    var e = Crafty.e("2D, Canvas, Text");
    e.text("a");
    e.textFont("size", "10");
    var h1 = e.h;
    ok(h1 > 10, "Font height set correctly.");
    e.textFont("size", "20");
    var h2 = e.h;
    ok(h2 > 20, "Font height set correctly.");
    ok(h2 > h1, "Entity increases in height when font size is increased.");

  });

  test("Color should be defined", function() {
    var e = Crafty.e("2D, DOM, Text");
    e.text("a");
    e.textColor('#00FF00');
    ok(e._textColor === "rgba(0, 255, 0, 1)");
    e.textColor('rgba(255,0,0,0.5)');
    ok(e._textColor === "rgba(255, 0, 0, 0.5)");
    e.destroy();
  });
})();