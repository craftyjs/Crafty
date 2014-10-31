var resetStage = function() {
  Crafty.viewport.reset();
  Crafty.viewport.scroll('_x', 0);
  Crafty.viewport.scroll('_y', 0);
  Crafty.viewport.clampToEntities = true;
};

QUnit.testDone(function() {
  // Clean all entities at the end of each test
  Crafty("*").destroy();
});
