(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Controls");

  test("KeyboardState", function(_) {
    var keyUpsE = 0, keyDownsE = 0,
        keyUpsF = 0, keyDownsF = 0;
    var e = Crafty.e("KeyboardState")
        .bind('KeyDown', function(evt) { keyDownsE++; })
        .bind('KeyUp', function(evt) { keyUpsE++; });
    var f = Crafty.e("KeyboardState")
        .bind('KeyDown', function(evt) { keyDownsF++; })
        .bind('KeyUp', function(evt) { keyUpsF++; });

    // initial
    _.strictEqual(e.isKeyDown('UP_ARROW'), false, "1st signature");
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false, "2nd signature");
    _.strictEqual(keyDownsE, 0);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), false, "2nd signature");
    _.strictEqual(f.isKeyDown('DOWN_ARROW'), false, "1st signature");
    _.strictEqual(keyDownsF, 0);
    _.strictEqual(keyUpsF, 0);

    // after e receives invalid KeyUp
    e.triggerKey("KeyUp", { eventName: "KeyUp", key: Crafty.keys.UP_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), false, "2nd signature");
    _.strictEqual(e.isKeyDown('DOWN_ARROW'), false, "1st signature");
    _.strictEqual(keyDownsE, 0);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown('UP_ARROW'), false, "1st signature");
    _.strictEqual(f.isKeyDown(Crafty.keys.DOWN_ARROW), false, "2nd signature");
    _.strictEqual(keyDownsF, 0);
    _.strictEqual(keyUpsF, 0);

    // after e receives valid KeyDown
    e.triggerKey("KeyDown", { eventName: "KeyDown", key: Crafty.keys.UP_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsE, 1);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), false);
    _.strictEqual(f.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 0);
    _.strictEqual(keyUpsF, 0);

    // after e receives invalid KeyDown
    e.triggerKey("KeyDown", { eventName: "KeyDown", key: Crafty.keys.UP_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsE, 1);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), false);
    _.strictEqual(f.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 0);
    _.strictEqual(keyUpsF, 0);

    // after f receives valid KeyDown, check if it messes with e
    f.triggerKey("KeyDown", { eventName: "KeyDown", key: Crafty.keys.UP_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsE, 1);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(f.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 1);
    _.strictEqual(keyUpsF, 0);

    // after e receives valid KeyDown for different key, check if it messes with both
    e.triggerKey("KeyDown", { eventName: "KeyDown", key: Crafty.keys.DOWN_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), true);
    _.strictEqual(keyDownsE, 2);
    _.strictEqual(keyUpsE, 0);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(f.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 1);
    _.strictEqual(keyUpsF, 0);

    // after e.resetKeyDown is invoked, both keys should be reset
    e.resetKeyDown();
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), false);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsE, 2);
    _.strictEqual(keyUpsE, 2);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), true);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 1);
    _.strictEqual(keyUpsF, 0);

    // after f receives valid KeyUp, check final status
    f.triggerKey("KeyUp", { eventName: "KeyUp", key: Crafty.keys.UP_ARROW });
    _.strictEqual(e.isKeyDown(Crafty.keys.UP_ARROW), false);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsE, 2);
    _.strictEqual(keyUpsE, 2);
    _.strictEqual(f.isKeyDown(Crafty.keys.UP_ARROW), false);
    _.strictEqual(e.isKeyDown(Crafty.keys.DOWN_ARROW), false);
    _.strictEqual(keyDownsF, 1);
    _.strictEqual(keyUpsF, 1);
  });

  test("MouseState", function(_) { // this is a copy of KeyboardState tests //
    var buttonUpsE = 0, buttonDownsE = 0,
        buttonUpsF = 0, buttonDownsF = 0;
    var e = Crafty.e("MouseState")
        .bind('MouseDown', function(evt) { buttonDownsE++; })
        .bind('MouseUp', function(evt) { buttonUpsE++; });
    var f = Crafty.e("MouseState")
        .bind('MouseDown', function(evt) { buttonDownsF++; })
        .bind('MouseUp', function(evt) { buttonUpsF++; });

    // initial
    _.strictEqual(e.isButtonDown('LEFT'), false, "1st signature");
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false, "2nd signature");
    _.strictEqual(buttonDownsE, 0);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), false, "2nd signature");
    _.strictEqual(f.isButtonDown('RIGHT'), false, "1st signature");
    _.strictEqual(buttonDownsF, 0);
    _.strictEqual(buttonUpsF, 0);

    // after e receives invalid MouseUp
    e.triggerMouse("MouseUp", { eventName: "MouseUp", mouseButton: Crafty.mouseButtons.LEFT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), false, "2nd signature");
    _.strictEqual(e.isButtonDown('RIGHT'), false, "1st signature");
    _.strictEqual(buttonDownsE, 0);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown('LEFT'), false, "1st signature");
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.RIGHT), false, "2nd signature");
    _.strictEqual(buttonDownsF, 0);
    _.strictEqual(buttonUpsF, 0);

    // after e receives valid MouseDown
    e.triggerMouse("MouseDown", { eventName: "MouseDown", mouseButton: Crafty.mouseButtons.LEFT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsE, 1);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), false);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 0);
    _.strictEqual(buttonUpsF, 0);

    // after e receives invalid MouseDown
    e.triggerMouse("MouseDown", { eventName: "MouseDown", mouseButton: Crafty.mouseButtons.LEFT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsE, 1);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), false);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 0);
    _.strictEqual(buttonUpsF, 0);

    // after f receives valid MouseDown, check if it messes with e
    f.triggerMouse("MouseDown", { eventName: "MouseDown", mouseButton: Crafty.mouseButtons.LEFT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsE, 1);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 1);
    _.strictEqual(buttonUpsF, 0);

    // after e receives valid MouseDown for different mouseButton, check if it messes with both
    e.triggerMouse("MouseDown", { eventName: "MouseDown", mouseButton: Crafty.mouseButtons.RIGHT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), true);
    _.strictEqual(buttonDownsE, 2);
    _.strictEqual(buttonUpsE, 0);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 1);
    _.strictEqual(buttonUpsF, 0);

    // after e.resetButtonDown is invoked, both buttons should be reset
    e.resetButtonDown();
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), false);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsE, 2);
    _.strictEqual(buttonUpsE, 2);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), true);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 1);
    _.strictEqual(buttonUpsF, 0);

    // after f receives valid MouseUp, check final status
    f.triggerMouse("MouseUp", { eventName: "MouseUp", mouseButton: Crafty.mouseButtons.LEFT });
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.LEFT), false);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsE, 2);
    _.strictEqual(buttonUpsE, 2);
    _.strictEqual(f.isButtonDown(Crafty.mouseButtons.LEFT), false);
    _.strictEqual(e.isButtonDown(Crafty.mouseButtons.RIGHT), false);
    _.strictEqual(buttonDownsF, 1);
    _.strictEqual(buttonUpsF, 1);
  });

  test("MouseState - lastMouseEvent", function(_) {
    var e = Crafty.e("MouseState"),
        lastMouseEventA, lastMouseEventB,
        originalEventA, originalEventB;

    // initial state
    lastMouseEventA = e.lastMouseEvent;
    originalEventA = lastMouseEventA.originalEvent;

   // after e receives valid MouseDown, lastMouseEvent persisted
    e.triggerMouse("MouseDown", {
      eventName: "MouseDown",
      mouseButton: Crafty.mouseButtons.LEFT,
      target: 'a',
      realX: 1, realY: 2,
      clientX: 3, clientY: 4, // DEPRECATED: remove in upcoming release
      originalEvent: { prop1: true }
    });
    lastMouseEventB = e.lastMouseEvent;
    originalEventB = lastMouseEventB.originalEvent;
    _.strictEqual(lastMouseEventB, lastMouseEventA, "lastEvent objects are reused");
    _.strictEqual(lastMouseEventB.originalEvent, lastMouseEventA.originalEvent, "originalEvent is not a clone, but merely a reference");
    _.notEqual(originalEventB, originalEventA, "originalEvent reference changed");
    _.strictEqual(lastMouseEventB.originalEvent.prop1, true);
    _.strictEqual(lastMouseEventB.eventName, "MouseDown");
    _.strictEqual(lastMouseEventB.mouseButton, Crafty.mouseButtons.LEFT);
    _.strictEqual(lastMouseEventB.target, 'a');
    _.strictEqual(lastMouseEventB.realX, 1);
    _.strictEqual(lastMouseEventB.realY, 2);
    _.strictEqual(lastMouseEventB.clientX, 3);
    _.strictEqual(lastMouseEventB.clientY, 4);
    lastMouseEventA = lastMouseEventB;
    originalEventA = lastMouseEventA.originalEvent;

    // after e receives invalid MouseDown, lastMouseEvent shouldn't change
    e.triggerMouse("MouseDown", {
      eventName: "MouseDown",
      mouseButton: Crafty.mouseButtons.LEFT,
      target: 'b',
      realX: 5, realY: 6,
      clientX: 7, clientY: 8, // DEPRECATED: remove in upcoming release
      originalEvent: { prop2: true }
    });
    lastMouseEventB = e.lastMouseEvent;
    originalEventB = lastMouseEventB.originalEvent;
    _.strictEqual(lastMouseEventB, lastMouseEventA, "lastEvent objects are reused");
    _.deepEqual(lastMouseEventB, lastMouseEventA, "lastEvent objects have same content");
    lastMouseEventA = lastMouseEventB;
    originalEventA = lastMouseEventA.originalEvent;

    // after e receives valid MouseUp, lastMouseEvent should change
    e.triggerMouse("MouseUp", {
      eventName: "MouseUp",
      mouseButton: Crafty.mouseButtons.LEFT,
      target: 'c',
      realX: 9, realY: 0,
      clientX: -1, clientY: -2, // DEPRECATED: remove in upcoming release
      originalEvent: { prop3: true }
    });
    lastMouseEventB = e.lastMouseEvent;
    originalEventB = lastMouseEventB.originalEvent;
    _.strictEqual(lastMouseEventB, lastMouseEventA, "lastEvent objects are reused");
    _.strictEqual(lastMouseEventB.originalEvent, lastMouseEventA.originalEvent, "originalEvent is not a clone, but merely a reference");
    _.notEqual(originalEventB, originalEventA, "originalEvent reference changed");
    _.strictEqual(lastMouseEventB.originalEvent.prop3, true);
    _.strictEqual(lastMouseEventB.eventName, "MouseUp");
    _.strictEqual(lastMouseEventB.mouseButton, Crafty.mouseButtons.LEFT);
    _.strictEqual(lastMouseEventB.target, 'c');
    _.strictEqual(lastMouseEventB.realX, 9);
    _.strictEqual(lastMouseEventB.realY, 0);
    _.strictEqual(lastMouseEventB.clientX, -1);
    _.strictEqual(lastMouseEventB.clientY, -2);
    lastMouseEventA = lastMouseEventB;
    originalEventA = lastMouseEventA.originalEvent;
  });

  test("TouchState", function(_) {
    var finger0Starts = 0, finger0Moves = 0, finger0Ends = 0, finger0Cancels = 0,
        finger1Starts = 0, finger1Moves = 0, finger1Ends = 0, finger1Cancels = 0;
    var e = Crafty.e("TouchState")
        .bind('TouchStart', function(evt) {
            if (evt.identifier === 0) finger0Starts++;
            else if (evt.identifier === 1) finger1Starts++;
            else _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchMove', function(evt) {
            if (evt.identifier === 0) finger0Moves++;
            else if (evt.identifier === 1) finger1Moves++;
            else _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchEnd', function(evt) {
            if (evt.identifier === 0) finger0Ends++;
            else if (evt.identifier === 1) finger1Ends++;
            else _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchCancel', function(evt) {
            if (evt.identifier === 0) finger0Cancels++;
            else if (evt.identifier === 1) finger1Cancels++;
            else _.ok(false, "Unexpected touch identifier event received.");
        });

    // check that TouchState doesn't cause conflicts between entities
    Crafty.e("TouchState")
        .bind('TouchStart', function(evt) {
            _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchMove', function(evt) {
            _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchEnd', function(evt) {
            _.ok(false, "Unexpected touch identifier event received.");
        })
        .bind('TouchCancel', function(evt) {
            _.ok(false, "Unexpected touch identifier event received.");
        });

    // initial
    _.strictEqual(e.touchPoints.length, 0, "no current touch points");
    _.strictEqual(e._touchPointsPool.length, 0, "no current reusable touch points");
    _.strictEqual(finger0Starts, 0);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 0);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives invalid TouchMove for finger 0
    e.triggerTouch("TouchMove", { eventName: "TouchMove", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 0, "no current touch points");
    _.strictEqual(e._touchPointsPool.length, 0, "no current reusable touch points");
    _.strictEqual(finger0Starts, 0);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 0);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchStart for finger 0
    e.triggerTouch("TouchStart", { eventName: "TouchStart", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 1);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 0);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives invalid TouchStart for finger 0
    e.triggerTouch("TouchStart", { eventName: "TouchStart", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 1);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 0);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchStart for finger 1
    e.triggerTouch("TouchStart", { eventName: "TouchStart", identifier: 1 });
    _.strictEqual(e.touchPoints.length, 2);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchStart");
    _.strictEqual(e.touchPoints[1].identifier, 1);
    _.strictEqual(e.touchPoints[1].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives invalid TouchEnd for unrelated finger
    e.triggerTouch("TouchEnd", { eventName: "TouchEnd", identifier: -1 });
    _.strictEqual(e.touchPoints.length, 2);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchStart");
    _.strictEqual(e.touchPoints[1].identifier, 1);
    _.strictEqual(e.touchPoints[1].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 0);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchMove for finger 0
    e.triggerTouch("TouchMove", { eventName: "TouchMove", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 2);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchMove");
    _.strictEqual(e.touchPoints[1].identifier, 1);
    _.strictEqual(e.touchPoints[1].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 0);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchMove for finger 1
    e.triggerTouch("TouchMove", { eventName: "TouchMove", identifier: 1 });
    _.strictEqual(e.touchPoints.length, 2);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchMove");
    _.strictEqual(e.touchPoints[1].identifier, 1);
    _.strictEqual(e.touchPoints[1].eventName, "TouchMove");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 1);
    _.strictEqual(finger1Ends, 0);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchEnd for finger 1
    e.triggerTouch("TouchEnd", { eventName: "TouchEnd", identifier: 1 });
    _.strictEqual(e.touchPoints.length, 1);
    _.strictEqual(e.touchPoints[0].identifier, 0);
    _.strictEqual(e.touchPoints[0].eventName, "TouchMove");
    _.strictEqual(e._touchPointsPool.length, 1);
    _.strictEqual(e._touchPointsPool[0].identifier, 1);
    _.strictEqual(e._touchPointsPool[0].eventName, "TouchEnd");
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 0);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 1);
    _.strictEqual(finger1Ends, 1);
    _.strictEqual(finger1Cancels, 0);

    // after e receives valid TouchCancel for finger 0
    e.triggerTouch("TouchCancel", { eventName: "TouchCancel", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 0);
    _.strictEqual(e._touchPointsPool.length, 2);
    _.strictEqual(e._touchPointsPool[0].identifier, 1);
    _.strictEqual(e._touchPointsPool[0].eventName, "TouchEnd");
    _.strictEqual(e._touchPointsPool[1].identifier, 0);
    _.strictEqual(e._touchPointsPool[1].eventName, "TouchCancel");
    _.strictEqual(finger0Starts, 1);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 1);
    _.strictEqual(finger1Starts, 1);
    _.strictEqual(finger1Moves, 1);
    _.strictEqual(finger1Ends, 1);
    _.strictEqual(finger1Cancels, 0);

    // check that e reuses touchPool
    e.triggerTouch("TouchStart", { eventName: "TouchStart", identifier: 1 });
    e.triggerTouch("TouchStart", { eventName: "TouchStart", identifier: 0 });
    _.strictEqual(e.touchPoints.length, 2);
    _.strictEqual(e.touchPoints[0].identifier, 1);
    _.strictEqual(e.touchPoints[0].eventName, "TouchStart");
    _.strictEqual(e.touchPoints[1].identifier, 0);
    _.strictEqual(e.touchPoints[1].eventName, "TouchStart");
    _.strictEqual(e._touchPointsPool.length, 0);
    _.strictEqual(finger0Starts, 2);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 1);
    _.strictEqual(finger1Starts, 2);
    _.strictEqual(finger1Moves, 1);
    _.strictEqual(finger1Ends, 1);
    _.strictEqual(finger1Cancels, 0);

    // check that resetTouchPoints fires TouchCancel events in reverse chronological order
    e.resetTouchPoints();
    _.strictEqual(e.touchPoints.length, 0);
    _.strictEqual(e._touchPointsPool.length, 2);
    _.strictEqual(e._touchPointsPool[0].identifier, 0);
    _.strictEqual(e._touchPointsPool[0].eventName, "TouchCancel");
    _.strictEqual(e._touchPointsPool[1].identifier, 1);
    _.strictEqual(e._touchPointsPool[1].eventName, "TouchCancel");
    _.strictEqual(finger0Starts, 2);
    _.strictEqual(finger0Moves, 1);
    _.strictEqual(finger0Ends, 0);
    _.strictEqual(finger0Cancels, 2);
    _.strictEqual(finger1Starts, 2);
    _.strictEqual(finger1Moves, 1);
    _.strictEqual(finger1Ends, 1);
    _.strictEqual(finger1Cancels, 1);
  });

  test("TouchState - touchPoints", function(_) {
    var e = Crafty.e("TouchState"),
        touchPointA, touchPointB,
        originalEventA, originalEventB;

    // initial state
    touchPointA = e.touchPoints[0];
    originalEventA = touchPointA && touchPointA.originalEvent;
    _.strictEqual(touchPointA, undefined, "no initial touchPoint");
    _.strictEqual(originalEventA, undefined, "no initial originalEvent");

   // after e receives valid TouchStart, touchPoint persisted
    e.triggerTouch("TouchStart", {
      eventName: "TouchStart",
      identifier: -3,
      target: 'a',
      entity: 'a', // DEPRECATED: remove in upcoming release
      realX: 1, realY: 2,
      originalEvent: { prop1: true }
    });
    touchPointB = e.touchPoints[0];
    originalEventB = touchPointB.originalEvent;
    _.strictEqual(e.touchPoints.length, 1, "One touchPoint exists");
    _.ok(touchPointB, "new touchPoint created");
    _.ok(originalEventB, "new originalEvent created");
    _.strictEqual(touchPointB.originalEvent.prop1, true);
    _.strictEqual(touchPointB.eventName, "TouchStart");
    _.strictEqual(touchPointB.identifier, -3);
    _.strictEqual(touchPointB.target, 'a');
    _.strictEqual(touchPointB.entity, 'a');
    _.strictEqual(touchPointB.realX, 1);
    _.strictEqual(touchPointB.realY, 2);
    touchPointA = touchPointB;
    originalEventA = touchPointA.originalEvent;

    // after e receives invalid TouchStart, touchPoint shouldn't change
    e.triggerTouch("TouchStart", {
      eventName: "TouchStart",
      identifier: -3,
      target: 'b',
      entity: 'b', // DEPRECATED: remove in upcoming release
      realX: 3, realY: 4,
      originalEvent: { prop2: true }
    });
    touchPointB = e.touchPoints[0];
    originalEventB = touchPointB.originalEvent;
    _.strictEqual(e.touchPoints.length, 1, "One touchPoint exists");
    _.strictEqual(touchPointB, touchPointA, "touchPoint objects are reused");
    _.deepEqual(touchPointB, touchPointA, "touchPoint objects have same content");
    touchPointA = touchPointB;
    originalEventA = touchPointA.originalEvent;

    // after e receives valid TouchMove, touchPoint should change
    e.triggerTouch("TouchMove", {
      eventName: "TouchMove",
      identifier: -3,
      target: 'c',
      entity: 'c', // DEPRECATED: remove in upcoming release
      realX: 5, realY: 6,
      originalEvent: { prop3: true }
    });
    touchPointB = e.touchPoints[0];
    originalEventB = touchPointB.originalEvent;
    _.strictEqual(e.touchPoints.length, 1, "One touchPoint exists");
    _.strictEqual(touchPointB, touchPointA, "touchPoint objects are reused");
    _.strictEqual(touchPointB.originalEvent, touchPointA.originalEvent, "originalEvent is not a clone, but merely a reference");
    _.notEqual(originalEventB, originalEventA, "originalEvent reference changed");
    _.strictEqual(touchPointB.originalEvent.prop3, true);
    _.strictEqual(touchPointB.eventName, "TouchMove");
    _.strictEqual(touchPointB.identifier, -3);
    _.strictEqual(touchPointB.target, 'c');
    _.strictEqual(touchPointB.entity, 'c');
    _.strictEqual(touchPointB.realX, 5);
    _.strictEqual(touchPointB.realY, 6);
    touchPointA = touchPointB;
    originalEventA = touchPointA.originalEvent;

    // after e receives valid TouchStart for another finger, first touchPoint should not change
    e.triggerTouch("TouchStart", {
      eventName: "TouchStart",
      identifier: 11,
      target: 'd',
      entity: 'd', // DEPRECATED: remove in upcoming release
      realX: 7, realY: 8,
      originalEvent: { prop4: true }
    });
    touchPointB = e.touchPoints[0];
    originalEventB = touchPointB.originalEvent;

    _.strictEqual(e.touchPoints.length, 2, "Two touchPoints exist");
    _.strictEqual(touchPointB, touchPointA, "touchPoint objects for first finger are reused");
    _.deepEqual(touchPointB, touchPointA, "touchPoint objects for first finger have same content");

    var otherTouchPoint = e.touchPoints[1];
    _.ok(otherTouchPoint, "new touchPoint created for second finger");
    _.notEqual(otherTouchPoint, touchPointB,  "different touchPoint objects for different fingers");
    _.ok(otherTouchPoint.originalEvent, "new originalEvent created for second finger");
    _.notEqual(otherTouchPoint.originalEvent, touchPointB.originalEvent, "originalEvent of second finger has nothing to do with originalEvent of first finger");
    _.strictEqual(otherTouchPoint.originalEvent.prop4, true);
    _.strictEqual(otherTouchPoint.eventName, "TouchStart");
    _.strictEqual(otherTouchPoint.identifier, 11);
    _.strictEqual(otherTouchPoint.target, 'd');
    _.strictEqual(otherTouchPoint.entity, 'd');
    _.strictEqual(otherTouchPoint.realX, 7);
    _.strictEqual(otherTouchPoint.realY, 8);

    touchPointA = touchPointB;
    originalEventA = touchPointA.originalEvent;

    // after e receives valid TouchEnd, touchPoint for first finger should be removed
    e.triggerTouch("TouchEnd", {
      eventName: "TouchEnd",
      identifier: -3,
      target: 'e',
      entity: 'e', // DEPRECATED: remove in upcoming release
      realX: 9, realY: 0,
      originalEvent: { prop5: true }
    });
    _.strictEqual(e.touchPoints.length, 1, "One touchPoints exists");
    _.strictEqual(e.touchPoints[0], otherTouchPoint, "touchPoint objects for second finger are reused");
    _.deepEqual(e.touchPoints[0], otherTouchPoint, "touchPoint objects for second finger have same content");
  });

  test("Multiway and Fourway", function(_) {
    var e = Crafty.e("2D, Fourway")
                  .attr({ x: 0, y: 0});

    
    e.multiway(50, { W: -90 });
    keysDown(Crafty.keys.W);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, -50, "Speed is 50 in -y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Change the key's direction and speed while it's held down
    e.attr({x:0, y:0});
    e.multiway(100, { W: 90 });
    Crafty.timer.simulateFrames(1, 20);
    _.strictEqual(e._vy, 100, "Speed is 100 in +y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Change the speed with fourway, (W is negative for fourway)
    e.attr({x:0, y:0});
    e.fourway(50);
    Crafty.timer.simulateFrames(1, 20);
    _.strictEqual(e._vy, -50, "Speed is 50 in -y direction");
    _.strictEqual(e._vx, 0, "Speed is 0 in x direction");

    // Test two keys down at the same time
    keysDown(Crafty.keys.UP_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, -50, "Still speed 50 in -y direction after up arrow");

    keysUp('W');
    _.strictEqual(e._vy, -50, "Still speed 50 in -y direction after W is released");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, -50, "Still speed 50 in -y direction after W is released");

   keysUp(Crafty.keys.UP_ARROW);
   Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed is 0 once both keys are released");

    // Diagonal
    keysDown(Crafty.keys.DOWN_ARROW, Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 50, "Speed is 50 in +y direction when DOWN & LEFT are pressed");
    _.strictEqual(e._vx, -50, "Speed is 50 in -x direction when DOWN & LEFT are pressed");

    keysUp(Crafty.keys.DOWN_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed is 0 in y direction after DOWN is released");
    _.strictEqual(e._vx, -50, "Speed is still 50 in -x direction");

    e.removeComponent("Multiway");
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "Speed set to 0 when component removed");
    _.strictEqual(e._vx, 0, "Speed set to 0 when component removed");

    keysUp(Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vy, 0, "No change when key released after component removed");
    _.strictEqual(e._vx, 0, "No change when key released after component is removed");

    Crafty.s('Keyboard').resetKeyDown();

    e.destroy();
  });

  test("disableControl and enableControl and speed", function(_) {
    var e = Crafty.e("2D, Twoway")
      .attr({ x: 0 })
      .twoway();

    _.strictEqual(e._vx, 0, "vx starts equal to 0");

    e.enableControl();
    e.speed({ x: 50, y: 50 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "No change in speed after Twoway speed is set");

    e.disableControl();
    keysDown(Crafty.keys.D);    
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 when key D pressed while control is disabled");

    e.enableControl();
    Crafty.timer.simulateFrames(1);    
    _.strictEqual(e._vx, 50, "vx = 50 once control is enabled while D key is down");

    e.disableControl();
    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1); 
    _.strictEqual(e._vx, 50, "vx = 50 when key is released while control disabled");

    e._vx = 17;
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 17, "vx = 17 after being explicitly set while control disabled");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once control is enabled and no key is held");

    e.disableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 if control disabled a second time");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once control re-enabled");

    keysDown(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx = 50 once D key pressed again");

    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once key released");

    keysDown(Crafty.keys.D, Crafty.keys.RIGHT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx = 50 when both RIGHT and D pressed");

    e.disableControl();
    e.speed({ x: 100, y: 100 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 50, "vx remains 50 when control disabled and speed set");

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 100, "vx = 100 when control re-enabled while keys are still held down");

    e.speed({ x: 150, y: 150 });
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 150, "vx = 150 when speed updated");

    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 150, "vx = 150 when D is released but RIGHT is still down");

    keysUp(Crafty.keys.RIGHT_ARROW);
    Crafty.timer.simulateFrames(1);
    _.strictEqual(e._vx, 0, "vx = 0 once both keys are released");

    e.destroy();
  });

  // Use keysUp/Down helper functions defined in common.js
  test("Integrationtest - Twoway", function(_) {
    var done = false;
    Crafty.s('Keyboard').resetKeyDown();

    var ground = Crafty.e("2D, platform")
          .attr({ x: 0, y: 200, w: 10, h: 20 });

    var player = Crafty.e("2D, Gravity, Twoway")
          .attr({ x: 0, y: 150, w: 32, h: 10 })
          .gravity("platform")
          .gravityConst(0.3*50*50)
          .twoway(2, 4);

    var landCount = 0, liftCount = 0;
    player.bind("LandedOnGround", function() {
      landCount++;
      
      if (landCount === 1) {
        this.bind("LiftedOffGround", function() {
          liftCount++;
          this.bind("UpdateFrame", function() {
            keysDown(Crafty.keys.UP_ARROW);
            if (this.velocity().y < -this._jumpSpeed)
              _.ok(false, "Twoway should not modify velocity");
          });
        });

        keysDown(Crafty.keys.UP_ARROW);
      } else {
        _.strictEqual(landCount, 2, "two land on ground events should have been registered");
        _.strictEqual(liftCount, 1, "one lift off ground event should have been registered");

        ground.destroy();
        player.destroy();

        keysUp(Crafty.keys.UP_ARROW);
        done = true;
      }
    });

    Crafty.timer.simulateFrames(75);
    _.ok(done, "Integration test completed");
  });

})();