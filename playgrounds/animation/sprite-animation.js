Crafty.init(100, 100);

var spriteAnimation = null;

// Initialize a sprite component
Crafty.sprite(64, '../../tests/animation/numbers.png', { 'numbers': [0, 0] });

// Add an animation to the stage
spriteAnimation = Crafty.e('2D, DOM, numbers, SpriteAnimation');
spriteAnimation.attr({ x: 10, y: 10 });
spriteAnimation.reel('count', 200, 0, 0, 10); // 10 frames duration
spriteAnimation.reel('countSlow', 1200, 0, 0, 10); //60 frames duration
spriteAnimation.reel('countEven', 100, [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0]]); // 5 frames
spriteAnimation.reel('short', 60, 0, 0, 3); // 3 frames

spriteAnimation.reel("count").resetAnimation().pauseAnimation();
spriteAnimation.reel("countEven").resetAnimation().pauseAnimation();
spriteAnimation.reel("countSlow").resetAnimation().pauseAnimation();
spriteAnimation.reel("short").resetAnimation().pauseAnimation();

// Some extra functions for the animation playground
/* exported playgroundPlay */
function playgroundPlay() {
  var reelId = $('#playReelId').val();

  var loopCount = parseInt($('#playRepeatCount').val());
  if (isNaN(loopCount)) loopCount = 1;

  spriteAnimation.animate(reelId, loopCount);
}

/* exported playgroundPosition */
function playgroundPosition() {
  var pos  = parseInt($('#reelPosition').val());
  if (isNaN(pos)) pos = 0;
  spriteAnimation.reelPosition(pos);
}

/* exported playgroundPause */
function playgroundPause() {
  spriteAnimation.pauseAnimation();
}

/* exported playgroundResume */
function playgroundResume() {
  spriteAnimation.resumeAnimation();
}

/* exported playgroundReset */
function playgroundReset() {
  spriteAnimation.resetAnimation();
}
