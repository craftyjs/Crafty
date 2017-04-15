QUnit.module(module);

QUnit.test("Crafty webdriver test template", function(assert) {
  return browser
    .testUrl()
    .waitBarrier("done")
    .assertResemble({ x: 10, y: 10, w: 100, h: 100 });
});
