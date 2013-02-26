// Initialize crafty and a sprite component
Crafty.init(650, 74);
Crafty.sprite(64, 'numbers.png', { 'numbers': [0, 0] });

// Add an animation to the stage
spriteAnimation = Crafty.e('2D, DOM, numbers, SpriteAnimation');
spriteAnimation.attr({ x: 10, y: 10 });
spriteAnimation.animate('count', 0, 0, 9);
spriteAnimation.animate('countEven', [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8]]);

// We don't want anything to actually run in an uncontrolled manner during tests
Crafty.pause();
//Crafty.bind("EnterFrame", function() { console.log("In da frame!") });

var eventFrames = [];
spriteAnimation.bind("FrameChange", function(changeData) {
	eventFrames.push(changeData.frameNumber);
});

module("Sprite Animation", {
	setup: function() {
		eventFrames = [];
	}
});

test("Play an animation", function() {
	// Play for 10 frames, each sprite will show up for one frame
	spriteAnimation.play('count', 10);
	for (var i = 0; i < 10; i++) {
		activeReel = spriteAnimation.getActiveReel();
		equal(activeReel.frame, i, "Frame " + i + " should be displayed");
		Crafty.timer.simulateFrames(1);
	}

	deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 1 through 9");
});

test("Show the last frame after an animation ends", function() {
	// Play for 10 frames, each sprite will show up for one frame
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(20);
	activeReel = spriteAnimation.getActiveReel();
	equal(activeReel.frame, 9, "Frame 9 should be displayed after the animation ends");

	deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 1 through 9");
});

Crafty.pause();
