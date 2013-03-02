// Initialize crafty and a sprite component
Crafty.init(650, 74);
Crafty.sprite(64, 'numbers.png', { 'numbers': [0, 0] });

// Add an animation to the stage
spriteAnimation = Crafty.e('2D, DOM, numbers, SpriteAnimation');
spriteAnimation.attr({ x: 10, y: 10 });
spriteAnimation.animate('count', 0, 0, 9);
spriteAnimation.animate('countEven', [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0]]);
spriteAnimation.animate('short', 0, 0, 2);

// We don't want anything to actually run in an uncontrolled manner during tests
Crafty.pause();
//Crafty.bind("EnterFrame", function() { console.log("In da frame!") });

var eventFrames = [];
spriteAnimation.bind("FrameChange", function(changeData) {
	eventFrames.push(changeData.frameNumber);
});

var finishedAnimations = []
spriteAnimation.bind("AnimationEnd", function(endData) {
	finishedAnimations.push(endData.reelId);
});

module("Sprite Animation", {
	setup: function() {
		eventFrames = [];
		finishedAnimations = [];
		spriteAnimation.reset('count');
		spriteAnimation.reset('countEven');
		spriteAnimation.reset('short');
	}
});

test("Get the active reel when there is none", function() {
	activeReel = spriteAnimation.getActiveReel();
	equal(activeReel.id, null, "The active reel's ID should be null");
});

test("Play an animation", function() {
	// Play for 10 frames, each sprite will show up for one frame
	spriteAnimation.play('count', 10);
	for (var i = 0; i < 10; i++) {
		activeReel = spriteAnimation.getActiveReel();
		equal(activeReel.frame, i, "Frame " + i + " should be displayed");
		Crafty.timer.simulateFrames(1);
	}
});

test("Play an animation defined using an array", function() {
	// Play for 5 frames, each sprite will show up for one frame
	spriteAnimation.play('countEven', 5);
	for (var i = 0; i < 5; i++) {
		activeReel = spriteAnimation.getActiveReel();
		equal(activeReel.frame, i, "Frame " + i + " should be displayed");
		Crafty.timer.simulateFrames(1);
	}
});

test("Play an animation where sprites are displayed for more than one frame", function() {
	// Play for 60 frames, each sprite will show up for six frames
	spriteAnimation.play('count', 60);
	for (var i = 0; i < 10; i++) {
		activeReel = spriteAnimation.getActiveReel();
		equal(activeReel.frame, i, "Frame " + i + " should be displayed");
		Crafty.timer.simulateFrames(6);
	}
});

test("Show the last frame after an animation ends", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(20);
	activeReel = spriteAnimation.getActiveReel();
	equal(activeReel.frame, 9, "Frame 9 should be displayed after the animation ends");
});

test("Get events for each frame change", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(20);

	deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 1 through 9");
});

test("Get an event when an animation ends", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(20);

	deepEqual(finishedAnimations, ['count'], "Should have received an event for the 'count' animation's end");
});

test("Play an animation with a repeat count", function() {
	spriteAnimation.play('short', 3, 2);
	Crafty.timer.simulateFrames(10);

	deepEqual(eventFrames, [1, 2, 0, 1, 2, 0, 1, 2], "Expected events matching the repeat count");
	deepEqual(finishedAnimations, ['short'], "Expected a single animation end event");
});

test("Play an animation with an infinite repeat count", function() {
	spriteAnimation.play('short', 3, -1);
	Crafty.timer.simulateFrames(32);

	expected = [1, 2];
	for (var i = 0; i < 10; i++) {
		expected.push(0);
		expected.push(1);
		expected.push(2);
	}

	deepEqual(eventFrames, expected, "Expected events matching the amount of frames that pass");
	deepEqual(finishedAnimations, [], "Expected no animation to end");
});

test("Play an animation from a specific frame", function() {
	spriteAnimation.play('count', 10, 0, 5);
	Crafty.timer.simulateFrames(5);

	deepEqual(eventFrames, [6, 7, 8, 9], "Expected events for frames 6 through 9");
	deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
});

test("Play an animation from a specific frame, with a repeat count", function() {
	spriteAnimation.play('count', 10, 1, 6);
	Crafty.timer.simulateFrames(7);

	deepEqual(eventFrames, [7, 8, 9, 0, 1, 2, 3], "Expected events for frames 6 through 9");
});

test("Pause an animation", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(5);
	spriteAnimation.pause();
	Crafty.timer.simulateFrames(5);

	deepEqual(eventFrames, [1, 2, 3, 4, 5], "Expected events for frames 1 through 5");
});

test("Play an animation while another is already playing", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(5);
	spriteAnimation.play('short', 4);
	Crafty.timer.simulateFrames(10);

	deepEqual(eventFrames, [1, 2, 3, 4, 5, 1, 2], "Expected events for frames from both animations");
	deepEqual(finishedAnimations, ['short'], "Expected end event for the second animation");
});

test("Pause an animation, then resume it", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(5);
	spriteAnimation.pause();
	Crafty.timer.simulateFrames(5);
	spriteAnimation.resume();
	Crafty.timer.simulateFrames(5);

	deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 1 through 9");
	deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
});

test("Try to play an animation after it ends", function() {
	spriteAnimation.play('count', 10);
	Crafty.timer.simulateFrames(10);
	spriteAnimation.play('count', null);
	Crafty.timer.simulateFrames(1);

	deepEqual(finishedAnimations, ['count', 'count'], "Expected the animation to end twice");
});

test("Reset an animation", function() {
	spriteAnimation.play('short', 3);
	Crafty.timer.simulateFrames(3);
	spriteAnimation.reset();
	spriteAnimation.play('short', 3);
	Crafty.timer.simulateFrames(3);

	deepEqual(eventFrames, [1, 2, 1, 2], "Expected events for frames 1 through 2, twice");
	deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
});

test("Reset an animation to a specific frame", function() {
	spriteAnimation.play('short', 3);
	Crafty.timer.simulateFrames(3);
	spriteAnimation.reset(null, 1);
	spriteAnimation.play('short', 2);
	Crafty.timer.simulateFrames(2);

	deepEqual(eventFrames, [1, 2, 2], "Expected events for frames 1 through 2 and then 2");
	deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
});

test("See if any animation is playing", function() {
	equal(spriteAnimation.isPlaying(), false, "No animation should be playing");
	spriteAnimation.play('short', 3);
	equal(spriteAnimation.isPlaying(), true, "An animation should be playing");
});

test("See if a specific animation is playing", function() {
	spriteAnimation.play('count', 3);
	equal(spriteAnimation.isPlaying('short'), false, "The 'short' animation shouldn't be playing");
	spriteAnimation.play('short', 3);
	equal(spriteAnimation.isPlaying('short'), true, "The 'short' animation should be playing");
});

Crafty.pause();
