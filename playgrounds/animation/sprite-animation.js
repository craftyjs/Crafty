Crafty.init(100, 100);

var spriteAnimation = null;

var map = {
    "numbers": [0, 0],
    "number0": [0, 0], 
    "number1": [1, 0], 
    "number2": [2, 0], 
    "number3": [3, 0], 
    "number4": [4, 0], 
    "number5": [5, 0], 
    "number6": [6, 0], 
    "number7": [7, 0], 
    "number8": [8, 0], 
    "number9": [9, 0]
};

// Initialize a sprite component
Crafty.sprite(64, '../../tests/animation/numbers.png', map);

// Add an animation to the stage
spriteAnimation = Crafty.e('2D, DOM, numbers, SpriteAnimation');

spriteAnimation.attr({ x: 10, y: 10 });
spriteAnimation.reel('count', 200, 0, 0, 10); // 10 frames duration
spriteAnimation.reel('countSlow', 1200, 0, 0, 10); //60 frames duration
spriteAnimation.reel('countEven', 100, [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0]]); // 5 frames
spriteAnimation.reel('countEven_names', 100, ["number0", "number2", "number4", "number6", "number8"]); // animation by sprite names
spriteAnimation.reel('short', 60, 0, 0, 3); // 3 frames

spriteAnimation.reel("count").resetAnimation().pauseAnimation();
spriteAnimation.reel("countEven").resetAnimation().pauseAnimation();
spriteAnimation.reel("countEven_names").resetAnimation().pauseAnimation();
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

/* exported playgroundFrame */
function playgroundFrame() {
  var name = $('#reelFrame').val();
  spriteAnimation.reelFrame(name);
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
