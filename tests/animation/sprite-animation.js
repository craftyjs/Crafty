// Initialize crafty and a sprite component
Crafty.init(650, 74);
Crafty.sprite(64, 'numbers.png', { 'numbers': [0, 0] });

// Add an animation to the stage
spriteAnimation = Crafty.e('2D, DOM, numbers, SpriteAnimation');
spriteAnimation.attr({ x: 10, y: 10 });
spriteAnimation.animate('count', 0, 0, 10);
spriteAnimation.animate('countEven', [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8]]);

Crafty.pause();
Crafty.bind("EnterFrame", function () { console.log("Entered da frame!") });

module("Sprite Animation");

test("Play an animation", function() {
	// Play for 10 frames, each sprite will show up for one frame
	spriteAnimation.play('count', 10);
	for (var i = 0; i < 10; i++) {
		activeReel = spriteAnimation.getActiveReel();
		console.log("checking for " + i);
		equal(activeReel.frame, i, "Frame " + i + " should be displayed");
		Crafty.timer.simulateFrames(1);
	}
});
