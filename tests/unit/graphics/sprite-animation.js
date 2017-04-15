(function() {
  var module = QUnit.module;
  var test = QUnit.test;


  var spriteAnimation = null;

  var eventFrames = [];

  var finishedAnimations = [];

  // Initialize a sprite component
  Crafty.sprite(64, "../assets/numbers.png", {
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
  });


  module("Sprite");

  test("Change sprite coordinates", function(_) {
      var ent = Crafty.e('2D, Canvas')
            .attr({ w: 64, h: 64 });

      // adding the base Sprite component should provide no sprite coordinates
      ent.addComponent('Sprite');
      _.strictEqual(ent.__coord, undefined, "sprite coodinates unknown");

      // adding a sprite component should affect sprite coordinates
      ent.addComponent('numbers');
      _.strictEqual(ent.__coord[0], 0, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[1], 0, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[2], 64, "sprite dimension inside sprite map matches");
      _.strictEqual(ent.__coord[3], 64, "sprite dimension inside sprite map matches");

      // changing sprite via cell location should affect sprite coordinates
      ent.sprite(1, 0, 2, 1);
      _.strictEqual(ent.__coord[0], 1 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[1], 0 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[2], 2 * 64, "sprite dimension inside sprite map matches");
      _.strictEqual(ent.__coord[3], 1 * 64, "sprite dimension inside sprite map matches");

      // changing sprite via tile name should affect sprite coordinates
      ent.sprite('number9');
      _.strictEqual(ent.__coord[0], 9 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[1], 0 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[2], 1 * 64, "sprite dimension inside sprite map matches");
      _.strictEqual(ent.__coord[3], 1 * 64, "sprite dimension inside sprite map matches");

      // changing sprite via invalid tile name should have no effect on sprite coordinates
      ent.sprite('InvalidIdentifierXYZ');
      _.strictEqual(ent.__coord[0], 9 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[1], 0 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[2], 1 * 64, "sprite dimension inside sprite map matches");
      _.strictEqual(ent.__coord[3], 1 * 64, "sprite dimension inside sprite map matches");

      // switching sprite components should affect sprite coordinates
      ent.removeComponent('numbers');
      ent.addComponent('number3');
      _.strictEqual(ent.__coord[0], 3 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[1], 0 * 64, "sprite position inside sprite map matches");
      _.strictEqual(ent.__coord[2], 1 * 64, "sprite dimension inside sprite map matches");
      _.strictEqual(ent.__coord[3], 1 * 64, "sprite dimension inside sprite map matches");

      ent.destroy();
  });


  module("Sprite animation", {
    beforeEach: function() {
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
      spriteAnimation.reel("countSlow").resetAnimation().pauseAnimation();
      spriteAnimation.reel("short").resetAnimation().pauseAnimation();
      eventFrames = [];
      finishedAnimations = [];

      spriteAnimation.bind("FrameChange", function(changeData) {
        eventFrames.push(changeData.currentFrame);
      });

      spriteAnimation.bind("AnimationEnd", function(endData) {
        finishedAnimations.push(endData.id);
      });
    }
  });

  test("Test .getReel() with no active reel", function(_) {
    var newAnimation = Crafty.e("SpriteAnimation");
    var ret = newAnimation.getReel();
    _.strictEqual(ret, null, "The active reel should be null");
  });

  test("Test .reel() with no active reel", function(_) {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.reel();
    _.strictEqual(ret, null, "reel() returns null");

    newAnimation.destroy();
  });

  test("Test .animate() with no active reel", function(_) {
    var newAnimation = Crafty.e("SpriteAnimation");

    _.throws(function() {newAnimation.animate();}, /No reel is specified, and there is no currently active reel./, "Throws when calling .animate().");
    _.throws(function() {newAnimation.animate(3);}, /No reel is specified, and there is no currently active reel./, "Throws when calling .animate() with loop count.");

    newAnimation.destroy();
  });

  test("Test .loops() with no active reel", function(_) {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.loops();
    _.strictEqual(ret, 0, "No loops when reel is undefined.");
    ret = newAnimation.loops(2);
    _.strictEqual(ret, newAnimation, "No error when setting loops.");

    newAnimation.destroy();
  });

  test("Test .reelPosition() with no active reel", function(_) {
    var newAnimation = Crafty.e("SpriteAnimation");

    _.throws(function() {newAnimation.reelPosition();}, /No active reel/, "Throws when calling .reelPosition().");
    _.throws(function() {newAnimation.reelPosition(0.5);}, /No active reel/, "Throws when calling .reelPosition(0.5).");
    _.throws(function() {newAnimation.reelPosition(2);}, /No active reel/, "Throws when calling .reelPosition(2).");
    _.throws(function() {newAnimation.reelPosition('end');}, /No active reel/, "Throws when calling .reelPosition('end').");

    newAnimation.destroy();
  });

  test("Test .resumeAnimation() with no active reel", function(_) {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.resumeAnimation();
    _.notEqual(this._isPlaying, true, "Resume animation is a no-op when no reel is defined.");
    _.strictEqual(ret, newAnimation, "Resume animation returns self.");


    newAnimation.destroy();
  });


  test("Test .pauseAnimation() with no active reel", function(_) {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.pauseAnimation();
    _.strictEqual(ret, newAnimation, "Pause animation returns self.");


    newAnimation.destroy();
  });

  test("Test .resetAnimation() with no active reel", function(_) {
    var newAnimation = Crafty.e("SpriteAnimation");

    _.throws(function() {newAnimation.resetAnimation();}, /No active reel/, "Throws when calling .resetAnimation().");


    newAnimation.destroy();
  });

  test("Test .isPlaying() with no active reel", function(_) {
    var ret;
    var newAnimation = Crafty.e("SpriteAnimation");

    ret = newAnimation.isPlaying();
    _.strictEqual(ret, false, "isPlaying() returns false.");

    ret = newAnimation.isPlaying("short");
    _.strictEqual(ret, false, "isPlaying('short') returns false.");


    newAnimation.destroy();
  });

  test("Test reel switching functionality", function(_) {
    var ret = spriteAnimation.reel("short");
    _.strictEqual(ret, spriteAnimation, "Correctly returned self");
    _.strictEqual(spriteAnimation._currentReelId, "short", "Correct _currentReelId after switching");
    _.strictEqual(spriteAnimation._currentReel.id, "short", "Correct _currentReel.id after switching");

    _.throws( function() {spriteAnimation.reel("wrong");}, /The specified reel wrong is undefined/,  "Function should throw on bad reel");

    _.strictEqual(spriteAnimation._currentReelId, "short", "Correct _currentReelId after attempting to switch to bad reel");
  });

  test("Test using reel() with no arguments", function(_) {
    spriteAnimation.reel("count");
    var ret = spriteAnimation.reel();
    _.strictEqual(ret, "count", ".reel() returns the current id");

    // Test setting reel id manually, since that's what reel() should return
    // Don't ever do this in actual code!
    spriteAnimation._currentReelId = null;
    ret = spriteAnimation.reel();
    _.strictEqual(ret, null, ".reel() returns the current id after it's set manually");
    // Reset currentReelId, since we messed it up!
    spriteAnimation.reel("count");
  });

  test("Test using .getReel() with no arguments", function(_) {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.getReel();
    _.strictEqual(ret.id, spriteAnimation._currentReelId, "getReel returns reel with the correct id");
  });

  /* jshint -W069 */
  test("Test using .getReel() to get specific reels", function(_) {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.getReel("count");
    _.strictEqual(ret, spriteAnimation._reels['count'], "getReel('count') returns correctly when active reel is 'short'");

    ret = spriteAnimation.getReel("nonsense");
    _.strictEqual(typeof ret, "undefined", "getReel returns undefined when nonexistant reel requested");
  });
  /* jshint +W069 */


  test("Test using .reel to set an animation using start and end values", function(_) {
    var ret = spriteAnimation.reel('short-test', 3, 0, 0, 3);
    _.strictEqual(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('short-test');
    var reel = spriteAnimation.getReel('short-test');
    _.strictEqual(reel.id, "short-test", "Id of reel is set correctly.");

    _.strictEqual(reel.duration, 3, "Reel has correct duration.");
    _.strictEqual(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    _.strictEqual(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    _.strictEqual(frames.length, 3, "Reel has correct number of frames.");
    _.deepEqual(frames[0], [0, 0], "First frame is correct.");
    _.deepEqual(frames[1], [1, 0], "Second frame is correct.");
    _.deepEqual(frames[2], [2, 0], "Third frame is correct.");
  });

  test("Test using .reel to set a forward animation using start and end values with row wrapping", function(_) {
    var ret = spriteAnimation.reel('long-test-forward', 70, 0, 0, 7, 4);
    _.strictEqual(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('long-test-forward');
    var reel = spriteAnimation.getReel('long-test-forward');
    _.strictEqual(reel.id, "long-test-forward", "Id of reel is set correctly.");

    _.strictEqual(reel.duration, 70, "Reel has correct duration.");
    _.strictEqual(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    _.strictEqual(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    _.strictEqual(frames.length, 7, "Reel has correct number of frames.");
    _.deepEqual(frames[0], [0, 0], "First frame is correct.");
    _.deepEqual(frames[1], [1, 0], "Second frame is correct.");
    _.deepEqual(frames[2], [2, 0], "Third frame is correct.");
    _.deepEqual(frames[3], [3, 0], "Fourth frame is correct.");
    _.deepEqual(frames[4], [0, 1], "Fifth frame is correct.");
    _.deepEqual(frames[5], [1, 1], "Sixth frame is correct.");
    _.deepEqual(frames[6], [2, 1], "Seventh frame is correct.");
  });

  test("Test using .reel to set a backward animation using start and end values with row wrapping", function(_) {
    var ret = spriteAnimation.reel('long-test-backward', 70, 2, 1, -7, 4);
    _.strictEqual(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('long-test-backward');
    var reel = spriteAnimation.getReel('long-test-backward');
    _.strictEqual(reel.id, "long-test-backward", "Id of reel is set correctly.");

    _.strictEqual(reel.duration, 70, "Reel has correct duration.");
    _.strictEqual(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    _.strictEqual(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    _.strictEqual(frames.length, 7, "Reel has correct number of frames.");
    _.deepEqual(frames[0], [2, 1], "First frame is correct.");
    _.deepEqual(frames[1], [1, 1], "Second frame is correct.");
    _.deepEqual(frames[2], [0, 1], "Third frame is correct.");
    _.deepEqual(frames[3], [3, 0], "Fourth frame is correct.");
    _.deepEqual(frames[4], [2, 0], "Fifth frame is correct.");
    _.deepEqual(frames[5], [1, 0], "Sixth frame is correct.");
    _.deepEqual(frames[6], [0, 0], "Seventh frame is correct.");
  });

  test("Test using .reel to set an animation using an array of frames", function(_) {
    // This should produce the same results as the previous test!
    var ret = spriteAnimation.reel('short-test-2', 3, [[0, 0], [1, 0], [2, 0]] );
    _.strictEqual(ret, spriteAnimation, ".reel returned self correctly");
    spriteAnimation.reel('short-test-2');
    var reel = spriteAnimation.getReel('short-test-2');
    _.strictEqual(reel.id, "short-test-2", "Id of reel is set correctly.");

    _.strictEqual(reel.duration, 3, "Reel has correct duration.");
    _.strictEqual(reel.currentFrame, 0, "Reel starts with correct currentFrame of 0.");
    _.strictEqual(reel.defaultLoops, 1, "Reel starts with correct default number of loops.");

    var frames = reel.frames;
    _.strictEqual(frames.length, 3, "Reel has correct number of frames.");
    // This relies on the sprite being defined with a size of 64
    _.deepEqual(frames[0], [0, 0], "First frame is correct.");
    _.deepEqual(frames[1], [1, 0], "Second frame is correct.");
    _.deepEqual(frames[2], [2, 0], "Third frame is correct.");
  });

  test("Set position of current reel by frame number.", function(_) {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition(1);
    _.strictEqual(ret, spriteAnimation, "Correctly returned self.");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1.");
    spriteAnimation.reelPosition(0);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Set back to first frame.");
    spriteAnimation.reelPosition(10);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 2, "Set to frame beyond last index.");
    spriteAnimation.reelPosition(-1);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 1, "Set to negative frame; 1 before last frame.");
    spriteAnimation.reelPosition(-10);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Set to negative frame with magnitude greater than length.");
  });

  test("Set position of current reel by progress.", function(_) {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition(0.33);
    _.strictEqual(ret, spriteAnimation, "Correctly returned self.");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Set to frame of index 0 at 33%");
    spriteAnimation.reelPosition(0.34);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1 at 34%");
    spriteAnimation.reelPosition(0.66);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1 at 66%");
    spriteAnimation.reelPosition(0.67);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 2, "Set to frame of index 2 at 67%");

    _.throws( function() {spriteAnimation.reelPosition(1.2);}, /Position .+ invalid/, "Throws an exception when set to 120% completion");
  });

  test("Set position of reel to end", function(_) {
    spriteAnimation.reel("short");
    var ret = spriteAnimation.reelPosition("end");
    _.strictEqual(ret, spriteAnimation, "Correctly returned self.");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 2, "Set to last frame");
  });

  test("Get current position of reel", function(_) {
    spriteAnimation.reel("short");
    spriteAnimation.reelPosition("end");
    var pos = spriteAnimation.reelPosition();
    _.strictEqual(pos, 2, "Correctly returned current position at end.");
    spriteAnimation.reelPosition(0);
    pos = spriteAnimation.reelPosition();
    _.strictEqual(pos, 0, "Correctly returned current position at beginning.");
  });
  
  test("Set position of current reel by sprite name.", function(_) {
    spriteAnimation.reel("countEven_names");
    
    spriteAnimation.reelFrame("number2");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 1, "Set to frame of index 1.");
    
    spriteAnimation.reelFrame("number0");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Set back to first frame.");
    
    _.throws(function() {spriteAnimation.reelFrame("numbers");}, /Frame .+ is invalid/, "Throws when calling .reelFrame().");
  });

  test("Get number of loops left; .loops(void)", function(_) {
    spriteAnimation.reel("count");
    var loopCount = spriteAnimation.loops();
    _.strictEqual(loopCount, spriteAnimation._currentReel.easing.loops, "Number of loops matches");
  });

  test("Set number of loops left; .loops(n)", function(_) {
    spriteAnimation.reel("count");
    var ret = spriteAnimation.loops(10);
    _.strictEqual(10, spriteAnimation._currentReel.easing.loops, "Number of loops set to 10");
    _.strictEqual(ret, spriteAnimation, "Returned self.");
    ret = spriteAnimation.loops(-1);
    _.strictEqual(Infinity, spriteAnimation._currentReel.easing.loops, "Set to loop forever");
    _.strictEqual(ret, spriteAnimation, "Returned self.");
  });

  test("Play an animation", function(_) {
    // Play for 10 frames, each sprite will show up for one frame
    var ret = spriteAnimation.animate('count');
    _.strictEqual(ret, spriteAnimation, "Returned self correctly.");
    _.strictEqual(ret._currentReel.easing.loops, 1, "Set to one loop correctly.");

    for (var i = 0; i < 10; i++) {
      var activeReel = spriteAnimation.getReel();
      _.strictEqual(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(1);
    }
  });

  test("Play an animation defined using an array", function(_) {
    // Play for 5 frames, each sprite will show up for one frame
    spriteAnimation.animate('countEven');
    for (var i = 0; i < 5; i++) {
      var activeReel = spriteAnimation.getReel();
      _.strictEqual(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(1);
    }
  });
  
  test("Play an animation defined using sprite names", function(_) {
    // Play for 5 frames, each sprite will show up for one frame
    spriteAnimation.animate('countEven_names');
    for (var i = 0; i < 5; i++) {
      var activeReel = spriteAnimation.getReel();
      _.strictEqual(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(1);
    }
  });


  test("Play an animation where sprites are displayed for more than one frame", function(_) {
    // Play for 60 frames, each sprite will show up for six frames
    spriteAnimation.animate('countSlow');
    for (var i = 0; i < 10; i++) {
      var activeReel = spriteAnimation.getReel();
      _.strictEqual(activeReel.currentFrame, i, "Frame " + i + " should be displayed");
      Crafty.timer.simulateFrames(6);
    }
  });

  test("Play an animation at twice the rate", function(_) {
    spriteAnimation.animationSpeed = 2;
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(3);
    var activeReel = spriteAnimation.getReel();
    _.strictEqual(activeReel.currentFrame, 6, "Frame 6 should be displayed after 3 ticks at double speed");
    spriteAnimation.animationSpeed = 1;
  });

  test("Play an animation at half the rate", function(_) {
    spriteAnimation.animationSpeed = 0.5;
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(6);
    var activeReel = spriteAnimation.getReel();
    _.strictEqual(activeReel.currentFrame, 3, "Frame 3 should be displayed after 6 ticks at half speed");
    spriteAnimation.animationSpeed = 1;
  });

  test("Show the last frame after an animation ends", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);
    var activeReel = spriteAnimation.getReel();
    _.strictEqual(activeReel.currentFrame, 9, "Frame 9 should be displayed after the animation ends");
  });

  test("Get events for each frame change", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);

    _.deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected events for frames 0 through 9");
  });

  test("Get an event when an animation ends", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(20);

    _.deepEqual(finishedAnimations, ['count'], "Should have received an event for the 'count' animation's end");
  });


  test("Play an animation and then switch to another reel", function(_) {
    var countReel = spriteAnimation.getReel("count");
    spriteAnimation.animate('count');
    _.strictEqual(spriteAnimation._isPlaying, true, "playing after call to animate.");
    _.strictEqual(countReel.easing.paused, false, "easing not paused after call to animate.");
    spriteAnimation.reel('short');
    _.strictEqual(spriteAnimation._isPlaying, false, "not playing after switching reel.");
    _.strictEqual(countReel.easing.paused, true, "easing paused after switching reel.");
  });

  test("Play an animation with a repeat count", function(_) {
    var ret = spriteAnimation.animate('short', 3);
    _.strictEqual(ret._currentReel.easing.loops, 3, "Set to 3 loops correctly.");
    Crafty.timer.simulateFrames(10);
    _.strictEqual(ret._currentReel.easing.loops, 0, "0 loops after running.");

    // No "FrameChange" event for starting frame!
    _.deepEqual(eventFrames, [1, 2, 0, 1, 2, 0, 1, 2], "Expected events matching the repeat count");
    _.deepEqual(finishedAnimations, ['short'], "Expected a single animation end event");
  });

  test("Play an animation with an infinite repeat count", function(_) {
    _.strictEqual(spriteAnimation.getReel('short').currentFrame, 0);
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

    _.deepEqual(eventFrames, expected, "Expected events matching the amount of frames that pass");
    _.deepEqual(finishedAnimations, [], "Expected no animation to end");
  });

  test("Play an animation from a specific frame", function(_) {
    spriteAnimation.reel('count').pauseAnimation().reelPosition(5).loops(1);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(5);

    _.deepEqual(eventFrames, [5, 6, 7, 8, 9], "Expected events for frames 5 through 9");
    _.deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
  });

  test("Play an animation from a specific frame, with a repeat count", function(_) {
    spriteAnimation.reel('count').loops(2).reelPosition(6);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(7);

    _.deepEqual(eventFrames, [6, 7, 8, 9, 0, 1, 2, 3], "Expected events for frames 6 through 9 and then 0 through 3");
  });

  test("Pause an animation", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    var ret = spriteAnimation.pauseAnimation();
    Crafty.timer.simulateFrames(5);

    _.deepEqual(eventFrames, [1, 2, 3, 4, 5], "Expected events for frames 1 through 5");
    _.strictEqual(ret, spriteAnimation, ".pauseAnimation() returned correct value");
  });

  test("Play an animation while another is already playing", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(10);

    _.deepEqual(eventFrames, [1, 2, 3, 4, 5, 1, 2], "Expected events for frames from both animations.");
    _.deepEqual(finishedAnimations, ['short'], "Expected end event for the second animation");
  });

  test("Pause an animation, then resume it", function(_) {
    _.strictEqual(spriteAnimation.getReel('count').currentFrame, 0);
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(5);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 5, "Advanced to frame index 5 after 5 frames of animation");
    spriteAnimation.pauseAnimation();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 5, "Didn't advance while paused");
    var ret = spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(5);
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 9, "Advanced to last frame when resumed");
    _.strictEqual(ret, spriteAnimation, ".resumeAnimation() returned correct value");

    _.deepEqual(eventFrames, [1, 2, 3, 4, 5, 6, 7, 8, 9], "Expected one event for each frame 0 through 9");
    _.deepEqual(finishedAnimations, ['count'], "Expected a single animation end event");
  });

  test("Reset a paused animation", function(_) {
    spriteAnimation.reel("count").reelPosition(5).pauseAnimation();
    var ret = spriteAnimation.resetAnimation();
    _.strictEqual(spriteAnimation.isPlaying(), false, "Does not resume paused animation.");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Resets to initial frame.");
    _.strictEqual(ret, spriteAnimation, "Correctly returns self.");
  });

  test("Reset a playing animation", function(_) {
    spriteAnimation.reel("count").reelPosition(5).resumeAnimation();
    var ret = spriteAnimation.resetAnimation();
    _.strictEqual(spriteAnimation.isPlaying(), true, "Does not stop playing animation.");
    _.strictEqual(spriteAnimation._currentReel.currentFrame, 0, "Resets to initial frame.");
    _.strictEqual(ret, spriteAnimation, "Correctly returns self.");
  });

  test("Try to play an animation after it ends", function(_) {
    spriteAnimation.animate('count');
    Crafty.timer.simulateFrames(10);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(1);
    _.deepEqual(finishedAnimations, ['count', 'count'], "Expected the animation to end twice");
  });

  test("Play an animation twice", function(_) {
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);

    _.deepEqual(eventFrames, [1, 2, 0, 1, 2], "Expected events for frames 0 through 2, twice");
    _.deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
  });

  test("Set an animation to a specific frame number", function(_) {
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(3);
    var ret = spriteAnimation.reelPosition(1);
    spriteAnimation.resumeAnimation();
    Crafty.timer.simulateFrames(2);

    _.deepEqual(eventFrames, [1, 2, 1, 2], "Expected events for frames 0 through 2 and then 1 through 2");
    _.deepEqual(finishedAnimations, ['short', 'short'], "Expected the animation to end twice");
    _.strictEqual(ret, spriteAnimation, ".reelPosition(1) returned correct value");
  });

  test("See if any animation is playing", function(_) {
    _.strictEqual(spriteAnimation.isPlaying(), false, "No animation should be playing");
    spriteAnimation.animate('short');
    _.strictEqual(spriteAnimation.isPlaying(), true, "An animation should be playing");
  });

  test("See if a specific animation is playing", function(_) {
    spriteAnimation.animate('count');
    _.strictEqual(spriteAnimation.isPlaying('short'), false, "The 'short' animation shouldn't be playing");
    spriteAnimation.animate('short');
    _.strictEqual(spriteAnimation.isPlaying('short'), true, "The 'short' animation should be playing");
  });

  test("Check that it's possible to chain animations", function(_){
    var chain = function(){this.animate('count');};
    spriteAnimation.one("AnimationEnd", chain);
    spriteAnimation.animate('short');
    Crafty.timer.simulateFrames(4);
    _.ok(spriteAnimation.isPlaying('count'), "Successfully plays count after short ends");
  });
})();
