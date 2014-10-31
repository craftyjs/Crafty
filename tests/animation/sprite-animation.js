(function() {
  var spriteAnimation = null;

  var eventFrames = [];

  var finishedAnimations = [];

  // Initialize a sprite component
  Crafty.sprite(64, 'animation/numbers.png', { 'numbers': [0, 0] });

  module("Sprite animation", {
    setup: function() {
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
      eventFrames = [];
      finishedAnimations = [];

      // We don't want anything to actually run in an uncontrolled manner during tests
      Crafty.pause(true);

      spriteAnimation.bind("FrameChange", function(changeData) {
        eventFrames.push(changeData.currentFrame);
      });

      spriteAnimation.bind("AnimationEnd", function(endData) {
        finishedAnimations.push(endData.id);
      });
    },

    teardown: function() {
      Crafty.pause(false);
    }
  });

  test("Test .getReel() with no active reel", function() {
    var newAnimation = Crafty.e("SpriteAnimation");
    var ret = newAnimation.getReel();
    equal(ret, null, "The active reel should be null");
  });

  test("Test .reel() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.reel();
    strictEqual(ret, null, "reel() returns null");

    newAnimation.destroy();
  });

  test("Test .animate() with no active reel", function() {
    var newAnimation = Crafty.e("SpriteAnimation");

    throws(function() {newAnimation.animate();}, /No reel is specified, and there is no currently active reel./, "Throws when calling .animate().");
    throws(function() {newAnimation.animate(3);}, /No reel is specified, and there is no currently active reel./, "Throws when calling .animate() with loop count.");

    newAnimation.destroy();
  });

  test("Test .loops() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.loops();
    equal(ret, 0, "No loops when reel is undefined.");
    ret = newAnimation.loops(2);
    equal(ret, newAnimation, "No error when setting loops.");

    newAnimation.destroy();
  });

  test("Test .reelPosition() with no active reel", function() {
    var newAnimation = Crafty.e("SpriteAnimation");

    throws(function() {newAnimation.reelPosition();}, /No active reel/, "Throws when calling .reelPosition().");
    throws(function() {newAnimation.reelPosition(0.5);}, /No active reel/, "Throws when calling .reelPosition(0.5).");
    throws(function() {newAnimation.reelPosition(2);}, /No active reel/, "Throws when calling .reelPosition(2).");
    throws(function() {newAnimation.reelPosition('end');}, /No active reel/, "Throws when calling .reelPosition('end').");

    newAnimation.destroy();
  });

  test("Test .resumeAnimation() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.resumeAnimation();
    notEqual(this._isPlaying, true, "Resume animation is a no-op when no reel is defined.");
    equal(ret, newAnimation, "Resume animation returns self.");


    newAnimation.destroy();
  });


  test("Test .pauseAnimation() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.pauseAnimation();
    equal(ret, newAnimation, "Pause animation returns self.");


    newAnimation.destroy();
  });

  test("Test .resetAnimation() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    throws(function() {newAnimation.resetAnimation();}, /No active reel/, "Throws when calling .resetAnimation().");


    newAnimation.destroy();
  });

  test("Test .isPlaying() with no active reel", function() {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.isPlaying();
    strictEqual(ret, false, "isPlaying() returns false.");

    ret = newAnimation.isPlaying("short");
    strictEqual(ret, false, "isPlaying('short') returns false.");


    newAnimation.destroy();
  });

  test("Test reel switching functionality", function() {
    var ret = spriteAnimation.reel("short");
    equal(ret, spriteAnimation, "Correctly returned self");
    equal(spriteAnimation._currentReelId, "short", "Correct _currentReelId after switching");
    equal(spriteAnimation._currentReel.id, "short", "Correct _currentReel.id after switching");
    var e = "";

    throws( function() {spriteAnimation.reel("wrong");}, /The specified reel wrong is undefined/,  "Function should throw on bad reel");

    equal(spriteAnimation._currentReelId, "short", "Correct _currentReelId after attempting to switch to bad reel");
  });

  test("Test using reel() with no arguments", function() {
    spriteAnimation.reel("count");
    var ret = spriteAnimation.reel();
    equal(ret, "count", ".reel() returns the current id");

    // Test setting reel id manually, since that's what reel() should return
    // Don't ever do this in actual code!
    spriteAnimation._currentReelId = null;
    ret = spriteAnimation.reel();
    strictEqual(ret, null, ".reel() returns the current id after it's set manually");
    // Reset currentReelId, since we messed it up!
    spriteAnimation.reel("count");
  });

  test("Test using .getReel() with no arguments", function() {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.getReel();
    equal(ret.id, spriteAnimation._currentReelId, "getReel returns reel with the correct id");
  });

  /* jshint -W069 */
  test("Test using .getReel() to get specific reels", function() {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.getReel("count");
    equal(ret, spriteAnimation._reels['count'], "getReel('count') returns correctly when active reel is 'short'");

    ret = spriteAnimation.getReel("nonsense");
    equal(typeof ret, "undefined", "getReel returns undefined when nonexistant reel requested");
  });
  /* jshint +W069 */


  test("Test using .reel to set an animation using start and end values", function() {
    var ret = spriteAnimation.reel('short-test', 3, 0, 0, 3);
    equal(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('short-test');
    var reel = spriteAnimation.getReel('short-test');
    equal(reel.id, "short-test", "Id of reel is set correctly.");

    equal(reel.duration, 3, "Reel has correct duration.");
    equal(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    equal(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    equal(frames.length, 3, "Reel has correct number of frames.");
    deepEqual(frames[0], [0, 0], "First frame is correct.");
    deepEqual(frames[1], [1, 0], "Second frame is correct.");
    deepEqual(frames[2], [2, 0], "Third frame is correct.");
  });

  test("Test using .reel to set an animation using an array of frames", function() {
    // This should produce the same results as the previous test!
    var ret = spriteAnimation.reel('short-test-2', 3, [[0, 0], [1, 0], [2, 0]] );
    equal(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('short-test-2');
    var reel = spriteAnimation.getReel('short-test-2');
    equal(reel.id, "short-test-2", "Id of reel is set correctly.");

    equal(reel.duration, 3, "Reel has correct duration.");
    equal(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    equal(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    equal(frames.length, 3, "Reel has correct number of frames.");
    // This relies on the sprite being defined with a size of 64
    deepEqual(frames[0], [0, 0], "First frame is correct.");
    deepEqual(frames[1], [1, 0], "Second frame is correct.");
    deepEqual(frames[2], [2, 0], "Third frame is correct.");
  });

  test("Set position of current reel by frame.", function() {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition(1);
    equal(ret, spriteAnimation, "Correctly returned self.");
    equal(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1.");
    spriteAnimation.reelPosition(0);
    equal(spriteAnimation._currentReel.currentFrame, 0, "Set back to first frame.");
    spriteAnimation.reelPosition(10);
    equal(spriteAnimation._currentReel.currentFrame, 2, "Set to frame beyond last index.");
    spriteAnimation.reelPosition(-1);
    equal(spriteAnimation._currentReel.currentFrame, 1, "Set to negative frame; 1 before last frame.");
    spriteAnimation.reelPosition(-10);
    equal(spriteAnimation._currentReel.currentFrame, 0, "Set to negative frame with magnitude greater than length.");
  });

  test("Set position of current reel by progress.", function() {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition(0.33);
    equal(ret, spriteAnimation, "Correctly returned self.");
    equal(spriteAnimation._currentReel.currentFrame, 0, "Set to frame of index 0 at 33%");
    spriteAnimation.reelPosition(0.34);
    equal(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1 at 34%");
    spriteAnimation.reelPosition(0.66);
    equal(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1 at 66%");
    spriteAnimation.reelPosition(0.67);
    equal(spriteAnimation._currentReel.currentFrame, 2, "Set to frame of index 2 at 67%");

    throws( function() {spriteAnimation.reelPosition(1.2);}, /Position .+ invalid/, "Throws an exception when set to 120% completion");
  });

  test("Set position of reel to end", function() {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition("end");
    equal(ret, spriteAnimation, "Correctly returned self.");
    equal(spriteAnimation._currentReel.currentFrame, 2, "Set to last frame");
  });

  test("Get current position of reel", function() {
    spriteAnimation.reel("short");
    spriteAnimation.reelPosition("end");
    var pos = spriteAnimation.reelPosition();
    equal(pos, 2, "Correctly returned current position at end.");
    spriteAnimation.reelPosition(0);
    pos = spriteAnimation.reelPosition();
    equal(pos, 0, "Correctly returned current position at beginning.");
  });

  test("Get number of loops left; .loops(void)", function() {
    spriteAnimation.reel("count");
    var loopCount = spriteAnimation.loops();
    equal(loopCount, spriteAnimation._currentReel.easing.loops, "Number of loops matches");
  });

  test("Set number of loops left; .loops(n)", function() {
    spriteAnimation.reel("count");
    var ret = spriteAnimation.loops(10);
    equal(10, spriteAnimation._currentReel.easing.loops, "Number of loops set to 10");
    equal(ret, spriteAnimation, "Returned self.");
    ret = spriteAnimation.loops(-1);
    equal(Infinity, spriteAnimation._currentReel.easing.loops, "Set to loop forever");
    equal(ret, spriteAnimation, "Returned self.");
  });

  test("Play an animation", function() {
    // Play for 10 frames, each sprite will show up for one frame
    var ret = spriteAnimation.animate('count');
    equal(ret, spriteAnimation, "Returned self correctly.");
    equal(ret._currentReel.easing.loops, 1, "Set to one loop correctly.");

    for (var i = 0; i < 10; i++) {
      var activeReel = spriteAnimation.getReel();
      equal(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(1);
    }
  });

  test("Play an animation defined using an array", function() {
    // Play for 5 frames, each sprite will show up for one frame
    spriteAnimation.animate('countEven');
    for (var i = 0; i < 5; i++) {
      var activeReel = spriteAnimation.getReel();
      equal(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(1);
    }
  });


  test("Play an animation where sprites are displayed for more than one frame", function() {
    // Play for 60 frames, each sprite will show up for six frames
    spriteAnimation.animate('countSlow');
    for (var i = 0; i < 10; i++) {
      var activeReel = spriteAnimation.getReel();
      equal(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(6);
    }
  });

  test("Play an animation at twice the rate", function() {
    spriteAnimation.animationSpeed = 2;
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(3);
    var activeReel = spriteAnimation.getReel();
    equal(activeReel.currentFrame, 6, "Frame 6 should be displayed after 3 ticks at double speed");
    spriteAnimation.animationSpeed = 1;
  });

  test("Play an animation at half the rate", function() {
    spriteAnimation.animationSpeed = 0.5;
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(6);
    var activeReel = spriteAnimation.getReel();
    equal(activeReel.currentFrame, 3, "Frame 3 should be displayed after 6 ticks at half speed");
    spriteAnimation.animationSpeed = 1;
  });

  test("Show the last frame after an animation ends", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);
    var activeReel = spriteAnimation.getReel();
    equal(activeReel.currentFrame, 9, "Frame 9 should be displayed after the animation ends");
  });

  test("Get events for each frame change", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);

    deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 0 through 9");
  });

  test("Get an event when an animation ends", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);

    deepEqual(finishedAnimations, ['count'], "Should have received an event for the 'count' animation's end");
  });


  test("Play an animation and then switch to another reel", function() {
    var countReel = spriteAnimation.getReel("count");
    var shortReel = spriteAnimation.getReel("short");
    spriteAnimation.animate('count');
    equal(spriteAnimation._isPlaying, true, "playing after call to animate.");
    equal(countReel.easing.paused, false, "easing not paused after call to animate.");
    spriteAnimation.reel('short');
    equal(spriteAnimation._isPlaying, false, "not playing after switching reel.");
    equal(countReel.easing.paused, true, "easing paused after switching reel.");
  });

  test("Play an animation with a repeat count", function() {
    var ret = spriteAnimation.animate('short', 3);
    equal(ret._currentReel.easing.loops, 3, "Set to 3 loops correctly.");
    Crafty.timer.simulateFrames(10);
    equal(ret._currentReel.easing.loops, 0, "0 loops after running.");

    // No "FrameChange" event for starting frame!
    deepEqual(eventFrames, [1, 2, 0, 1, 2, 0, 1, 2], "Expected events matching the repeat count");
    deepEqual(finishedAnimations, ['short'], "Expected a single animation end event");
  });

  test("Play an animation with an infinite repeat count", function() {
    equal(spriteAnimation.getReel('short').currentFrame, 0);
    spriteAnimation.animate('short', -1);
    Crafty.timer.simulateFrames(32);

    var expected = [];
    for (var i = 0; i < 11; i++) {
      if (i>0) {
        expected.push(0);
      }

      expected.push(1);
      expected.push(2);
    }

    deepEqual(eventFrames, expected, "Expected events matching the amount of frames that pass");
    deepEqual(finishedAnimations, [], "Expected no animation to end");
  });

  test("Play an animation from a specific frame", function() {
    spriteAnimation.reel('count').pauseAnimation().reelPosition(5).loops(1);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(5);

    deepEqual(eventFrames, [5, 6, 7, 8, 9], "Expected events for frames 5 through 9");
    deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
  });

  test("Play an animation from a specific frame, with a repeat count", function() {
    spriteAnimation.reel('count').loops(2).reelPosition(6);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(7);

    deepEqual(eventFrames, [6, 7, 8, 9, 0, 1, 2, 3], "Expected events for frames 6 through 9 and then 0 through 3");
  });

  test("Pause an animation", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    var ret = spriteAnimation.pauseAnimation();
    Crafty.timer.simulateFrames(5);

    deepEqual(eventFrames, [1, 2, 3, 4, 5], "Expected events for frames 1 through 5");
    equal(ret, spriteAnimation, ".pauseAnimation() returned correct value");
  });

  test("Play an animation while another is already playing", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(10);

    deepEqual(eventFrames, [1, 2, 3, 4, 5, 1, 2], "Expected events for frames from both animations.");
    deepEqual(finishedAnimations, ['short'], "Expected end event for the second animation");
  });

  test("Pause an animation, then resume it", function() {
    equal(spriteAnimation.getReel('count').currentFrame, 0);
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    equal(spriteAnimation._currentReel.currentFrame, 5, "Advanced to frame index 5 after 5 frames of animation");
    spriteAnimation.pauseAnimation();
    Crafty.timer.simulateFrames(5);
    equal(spriteAnimation._currentReel.currentFrame, 5, "Didn't advance while paused");
    var ret = spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(5);
    equal(spriteAnimation._currentReel.currentFrame, 9, "Advanced to last frame when resumed");
    equal(ret, spriteAnimation, ".resumeAnimation() returned correct value");

    deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected one event for each frame 0 through 9");
    deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
  });

  test("Reset a paused animation", function() {
    spriteAnimation.reel("count").reelPosition(5).pauseAnimation();
    var ret = spriteAnimation.resetAnimation();
    equal(spriteAnimation.isPlaying(), false, "Does not resume paused animation.");
    equal(spriteAnimation._currentReel.currentFrame, 0, "Resets to initial frame.");
    equal(ret, spriteAnimation, "Correctly returns self.");
  });

  test("Reset a playing animation", function() {
    spriteAnimation.reel("count").reelPosition(5).resumeAnimation();
    var ret = spriteAnimation.resetAnimation();
    equal(spriteAnimation.isPlaying(), true, "Does not stop playing animation.");
    equal(spriteAnimation._currentReel.currentFrame, 0, "Resets to initial frame.");
    equal(ret, spriteAnimation, "Correctly returns self.");
  });

  test("Try to play an animation after it ends", function() {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(10);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(1);
    deepEqual(finishedAnimations, ['count', 'count'], "Expected the animation to end twice");
  });

  test("Play an animation twice", function() {
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);

    deepEqual(eventFrames, [1, 2, 0, 1, 2], "Expected events for frames 0 through 2, twice");
    deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
  });

  test("Set an animation to a specific frame", function() {
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);
    var ret = spriteAnimation.reelPosition(1);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(2);

    deepEqual(eventFrames, [1, 2, 1, 2], "Expected events for frames 0 through 2 and then 1 through 2");
    deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
    equal(ret, spriteAnimation, ".reelPosition(1) returned correct value");
  });

  test("See if any animation is playing", function() {
    equal(spriteAnimation.isPlaying(), false, "No animation should be playing");
    spriteAnimation.animate('short');
    equal(spriteAnimation.isPlaying(), true, "An animation should be playing");
  });

  test("See if a specific animation is playing", function() {
    spriteAnimation.animate('count');
    equal(spriteAnimation.isPlaying('short'), false, "The 'short' animation shouldn't be playing");
    spriteAnimation.animate('short');
    equal(spriteAnimation.isPlaying('short'), true, "The 'short' animation should be playing");
  });

  test("Check that it's possible to chain animations", function(){
    var chain = function(){this.animate('count');};
    spriteAnimation.one("AnimationEnd", chain);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(4);
    ok(spriteAnimation.isPlaying('count'), "Successfully plays count after short ends");
  });
})();
