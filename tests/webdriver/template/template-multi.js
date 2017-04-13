QUnit.module(module);

QUnit.test("Multi test template part 1: Player lands on ground floor automatically after navigating to test page", function(assert) {
  return browser
    .testUrl()
    .waitBarrier("landed1")
    .assertResemble("-firstLand", 0.20);
});

QUnit.test("Multi test template part 2: Player lands on platform after jump key pressed", function(assert) {
  return browser
    .keyDown('W').keyUp('W')
    .waitBarrier("landed2", 2000)
    .assertResemble("-secondLand", 0.20);
});

QUnit.test("Multi test template part 3: Player lands on floor after being drag & dropped", function(assert) {
  return browser
    .pointerMove(280, 107)
    .pointerDown()
    .pointerMove(25, 135)
    .pointerUp()
    .waitBarrier("landed3", 2000)
    .assertResemble("-thirdLand", 0.20);
});
