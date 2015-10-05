resetStage = function() {
  Crafty.viewport.reset();
  Crafty.viewport.scroll('_x', 0);
  Crafty.viewport.scroll('_y', 0);
  Crafty.viewport.clampToEntities = true;
};

Round = function(x){
  return Math.round(x*100)/100;
};