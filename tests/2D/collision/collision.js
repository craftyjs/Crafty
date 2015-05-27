(function() {
  var module = QUnit.module;

  // Define variables to host test shapes
  var trapezoid = null;
  var yellow = null;
  var parallelogram = null;
  var green = null;
  var purple = null;

  var resetPositions = function() {
    trapezoid.attr({x: 300, y: 150});
    yellow.attr({x: 50, y: 50});
    parallelogram.attr({x: 350, y: 350});
    green.attr({x: 100, y: 500});
    purple.attr({x: 500, y: 500});
  };

  var overlapEverything = function() {
    trapezoid.x = green.x;
    trapezoid.y = green.y;
    purple.x = green.x;
    purple.y = green.y;
    yellow.x = green.x;
    yellow.y = green.y;
    parallelogram.x = green.x;
    parallelogram.y = green.y;
  };

  var setHitChecks = function() {
    // Start by canceling hit checks
    green.ignoreHits();

    // Now set them again
    green.checkHits('Trapezoid, Yellow, Parallelogram, Purple');
  };

  var collisions = [];
  var decollisions = [];

  var getHitInfoNames = function(hitInfo) {
    var result = [];

    hitInfo.forEach(function(e) {
      result.push(e.obj._entityName);
    });

    return result;
  };

  var getSingleHitInfoName = function(hitInfo) {
    return getHitInfoNames(hitInfo)[0];
  };

  var getCollisionParticipants = function(collision) {
    return [collision[0], getSingleHitInfoName(collision[1])];
  };

  module("Collision", {
    setup: function() {
      trapezoid = Crafty.e('Trapezoid, 2D, Collision').setName('Trapezoid').
        attr({w: 200, h: 100}).collision(new Crafty.polygon([50, 0, 0, 100, 200, 100, 150, 0]));
      yellow = Crafty.e('Yellow, 2D, Collision').setName('Yellow').
        attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0, 0, 100, 100, 100, 100, 0]));
      parallelogram = Crafty.e('Parallelogram, 2D, Collision').setName('Parallelogram').
        attr({w: 100, h: 100}).collision(new Crafty.polygon([0, 0, 25, 100, 100, 100, 75, 0]));
      green = Crafty.e('Green, 2D, Collision').setName('Green').
        attr({w: 100, h: 100}).origin('center');
      purple = Crafty.e('Purple, 2D, Collision').setName('Purple').
        attr({w: 100, h: 100}).origin('center');

      // Set up hit events
      [trapezoid, yellow, parallelogram, green, purple].forEach(function(e) {
        e.bind("HitOn", function(hitInfo) {
          collisions.push([e._entityName, hitInfo]);
        });

        e.bind("HitOff", function(otherComponent) {
          decollisions.push([e._entityName, otherComponent]);
        });
      });

      // We don't want anything to actually run in an uncontrolled manner during tests
      Crafty.pause();

      collisions = [];
      decollisions = [];
      resetPositions();
      setHitChecks();
    }
  });


  test("HitOn fires when a tracked entity collides", function() {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);


    equal(collisions.length, 1, "There should have been exactly 1 collision");

    collision = collisions[0];
    if (!collision) return;

    deepEqual(getCollisionParticipants(collision), ['Green', 'Purple'], "The purple and green blocks should have collided");
  });

  test("HitOn fires for each component type supplied as part of a list", function() {
    overlapEverything();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("HitOn fires for each component type supplied as an individual argument", function() {
    green.ignoreHits();
    green.checkHits("Trapezoid", "Yellow", "Parallelogram", "Purple");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("HitOn contains info for multiple collisions", function() {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    yellow.x = green.x;
    yellow.y = green.y;
    Crafty.timer.simulateFrames(1);


    equal(collisions.length, 2, "There should have been exactly 2 collisions");

    // Theoretically the code here should not care about the order of collisions
    // in the array, but that is a hassle
    collision = collisions[0];
    if (collisions[0]) return;
    deepEqual(getCollisionParticipants(collision), ['Green', 'Yellow'], "The yellow and green blocks should have collided");

    collision = collisions[1];
    if (!collision) return;
    deepEqual(getCollisionParticipants(collision), ['Green', 'Purple'], "The purple and green blocks should have collided");

  });

  test("HitOn collision info contains collision data", function() {
    var collision = null;

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    collision = collisions[0];
    if (!collision) return;
    equal(collision[1][0].type, 'SAT', "The collision type should have been SAT");
    equal(Math.abs(collision[1][0].overlap), 100, "The collision overlap should have been 100%");
  });

  test("IgnoreHits causes hits not to be detected", function() {
    green.ignoreHits();

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 0, "There should have been no collisions");
  });

  test("IgnoreHits ignores specific components supplied as a list", function() {
    green.ignoreHits("Trapezoid, Parallelogram");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 2, "There should have been exactly 2 collisions");
  });

  test("IgnoreHits ignores specific components supplied as arguments", function() {
    green.ignoreHits("Trapezoid", "Parallelogram");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 2, "There should have been exactly 2 collisions");
  });

  test("IgnoreHits has no effect when irrelevant components are supplied", function() {
    green.ignoreHits("All, Your, Base");

    overlapEverything();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 4, "There should have been exactly 4 collisions");
  });

  test("Once a hit event is fired, it will not fire again while the collision persists", function() {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(10);


    equal(collisions.length, 1, "There should have been exactly 1 collision");
  });

  test("HitOff fires when a tracked entity stops colliding", function() {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);


    equal(decollisions.length, 1, "Exactly 1 collision should have stopped");

    var decollision = decollisions[0];
    if (!decollision) return;

    deepEqual([decollision[0], decollision[1]], ['Green', 'Purple'], "The purple and green blocks should have stopped colliding");
  });

  test("HitOff events fires only once per terminated collision", function() {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(10);


    equal(decollisions.length, 1, "Exactly 1 collision should have stopped");
  });

  test("Setting up a hit check multiple times has no effect", function() {
    // None of the checks below should register as test initialization already registered this check
    green.checkHits("Purple");
    green.checkHits("Purple");
    green.checkHits("Purple");

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 1, "There should have been exactly 1 collision");
    equal(decollisions.length, 1, "Exactly 1 collision should have stopped");
  });

  test("HitOn events fire for a collision after the original one", function() {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    resetPositions();
    Crafty.timer.simulateFrames(1);

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 2, "Exactly 2 collisions should have occurred");
  });

  test("HitOn events fire for a collision underway if resetHitChecks is called", function() {
    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(1);

    green.resetHitChecks();

    // Fire an additional frame to make sure resetting hit checks has no devious
    // side effects.
    Crafty.timer.simulateFrames(2);

    equal(collisions.length, 2, "Exactly 2 collisions should have occurred");
    if (collisions.length != 2) return;

    deepEqual(getCollisionParticipants(collisions[0]), ['Green', 'Purple'], "The first collision should have been between the purple and green blocks");
    deepEqual(getCollisionParticipants(collisions[1]), ['Green', 'Purple'], "The second collision should have been between the purple and green blocks");
  });

  test("resetHitChecks without arguments resets all checks", function() {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks();
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 8, "Exactly 8 collisions should have occurred");
  });

  test("resetHitChecks affects specific components specified as a list", function() {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Yellow, Purple");
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 6, "Exactly 6 collisions should have occurred");
  });

  test("resetHitChecks affects specific components specified as arguments", function() {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Yellow", "Purple");
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 6, "Exactly 6 collisions should have occurred");
  });

  test("resetHitChecks has no effect for components without hit checks", function() {
    overlapEverything();
    Crafty.timer.simulateFrames(1);
    green.resetHitChecks("Banana", "Phone");
    Crafty.timer.simulateFrames(1);

    equal(collisions.length, 4, "Exactly 4 collisions should have occurred");
  });

  test("resetHitChecks works from within a hit handler", function() {
    var hitResetCallback = function() {
      green.resetHitChecks();
    };

    green.bind("HitOn", hitResetCallback);

    green.x = purple.x;
    green.y = purple.y;
    Crafty.timer.simulateFrames(2);

    equal(collisions.length, 2, "Exactly 2 collisions should have occurred");

    green.unbind("HitOn", hitResetCallback);
  });
})();
