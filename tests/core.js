module("Core");

test("getVersion", function() {

  ok(Crafty.getVersion(), "The actual library version");
});

test("selectors", function() {
  var first = Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test, test2");
  Crafty.e("test, test2");
  Crafty.e("test2");
  strictEqual(Crafty("test").length, 6, "Single component");
  strictEqual(Crafty("test test2").length, 2, "Two components ANDed");
  strictEqual(Crafty("test, test2").length, 7, "Two components ORed");

  strictEqual(Crafty("*").length, 7, "All components - universal selector");

  strictEqual(Crafty(first[0]), first, "Get by ID");
  // Clean up
  Crafty("*").destroy();
});

test("addComponent and removeComponent", function() {
  var first = Crafty.e("test");
  Crafty.c("comp", {
    added: true
  });
  first.addComponent("test3");
  strictEqual(first.has("test3"), true, "component added");

  first.addComponent("comp");
  strictEqual(first.added, true, "component with property exists");

  first.addComponent("multi1, multi2");
  strictEqual(first.has("multi1") && first.has("multi2"), true, "multiple components added");

  first.removeComponent("test3");
  strictEqual(first.has("test3"), false, "component removed");

  first.removeComponent("comp");
  strictEqual(first.added && !first.has("comp"), true, "soft-removed component (properties remain)");
  first.removeComponent("comp", false);
  strictEqual(!first.added && !first.has("comp"), true, "hard-removed component (properties are gone)");

  // Clean up
  Crafty("*").destroy();
});

test("remove", function() {
  var removeRan = false,
    destroyFlag = false;

  Crafty.c("comp", {
    remove: function(destroyed) {
      removeRan = true;
      destroyFlag = destroyed;
    }
  })
  var e = Crafty.e("comp, blank");
  e.removeComponent("blank");
  strictEqual(removeRan, false, "Remove doesn't run on other component removal");

  removeRan = false;
  e.removeComponent("comp");
  strictEqual(removeRan, true, "Remove runs on correct component removal");
  strictEqual(destroyFlag, false, "Destroy flag false on regular removal");

  removeRan = false;
  e.addComponent("comp");
  e.destroy()
  strictEqual(removeRan, true, "Remove runs on component destrution");
  strictEqual(destroyFlag, true, "Destroy flag true on destruction");
});

test("attr", function() {
  var first = Crafty.e("test");
  first.attr("single", true);
  strictEqual(first.single, true, "single attribute assigned");

  first.attr({
    prop: "test",
    another: 56
  });
  strictEqual(first.prop, "test", "properties from object assigned");
  strictEqual(first.another, 56, "properties from object assigned");
  // Clean up
  Crafty("*").destroy();
});

test("setter", function() {
  if (!(Crafty.support.setter || Crafty.support.defineProperty)) {
    // IE8 has a setter() function but it behaves differently. No test is currently written for IE8.
    expect(0);
    return;
  }
  var first = Crafty.e("test");
  first.setter('p1', function(v) {
    this._p1 = v * 2
  });
  first.p1 = 2;
  strictEqual(first._p1, 4, "single property setter");

  first.setter('p2', function(v) {
    this._p2 = v * 2
  }).setter('p3', function(v) {
    this._p3 = v * 2
  });
  first.p2 = 2;
  first.p3 = 3;
  strictEqual(first._p2 + first._p3, 10, "two property setters");
  // Clean up
  Crafty("*").destroy();
});

test("bind", function() {
  var first = Crafty.e("test"),
    triggered = false;
  first.bind("myevent", function() {
    triggered = true;
  });
  first.trigger("myevent");
  strictEqual(triggered, true, "custom event triggered");
  // Clean up
  Crafty("*").destroy();
});

test("unbind", function() {
  var first = Crafty.e("test");
  first.bind("myevent", function() {
    ok(false, "This should not be triggered (unbinding all)");
  });
  first.unbind("myevent");
  first.trigger("myevent");

  function callback() {
    ok(false, "This should also not be triggered (unbind by FN)");
  }

  function callback2() {
    ok(true, "This should be triggered");
  }

  first.bind("myevent", callback);
  first.bind("myevent", callback2);
  first.unbind("myevent", callback);
  first.trigger("myevent");
  // Clean up
  Crafty("*").destroy();
});

test("globalBindAndUnbind", function() {
  var flag = 0;
  var add_1 = function() {
    flag += 1;
  };
  var add_10 = function() {
    flag += 10;
  };
  var add_100 = function() {
    flag += 100;
  };
  Crafty.bind("theglobalevent", add_1);
  Crafty.bind("theglobalevent", add_10);
  Crafty.bind("theglobalevent", add_100);
  Crafty.trigger("theglobalevent");
  strictEqual(flag, 111, "global event binding worked");
  Crafty.unbind("theglobalevent", add_1);
  Crafty.trigger("theglobalevent");
  strictEqual(flag, 221, "global event single-function unbinding worked");
  Crafty.unbind("theglobalevent");
  Crafty.trigger("theglobalevent");
  strictEqual(flag, 221, "global event full unbinding worked");
});

test("each", function() {
  var count = 0;
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test, test2");
  Crafty.e("test, test2");
  Crafty.e("test2");

  Crafty("test").each(function() {
    count++;
  });
  strictEqual(count, 6, "Iterated all elements with certain component");

  count = 0;
  Crafty("*").each(function() {
    count++;
  });
  strictEqual(count, 7, "Iterated all elements");
  // Clean up
  Crafty("*").destroy();
});

test("Crafty.get() to find an array", function() {
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");

  var collection = Crafty("test");
  var result = collection.get();
  equal(result.length, 3, "resultant array should be length 3");
  equal(result[0].has("test"), true, "Result elements should have correct component");
  equal(collection[0], result[0].getId(), "First id of result should match first id of Crafty array");

  Crafty("*").destroy();
})

test("Crafty.get(index) to find the indicated entity", function() {
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  var collection, result;

  collection = Crafty("test");
  result = collection.get(0);
  equal(result.has("test"), true, "Result should have correct component");
  equal(result.getId(), collection[0], "result should be first element of collection");

  result = collection.get(-1);
  equal(result.has("test"), true, "Result should have correct component");
  equal(result.getId(), collection[2], "result should be last element of collection");

  Crafty("*").destroy();
})

test("Crafty.get(index) error checking", function() {
  Crafty.e("test");
  Crafty.e("test");
  Crafty.e("test");
  var collection, result;

  collection = Crafty("test");

  result = collection.get(3);
  equal(typeof result, "undefined", "result of get(3) should be undefined")

  result = collection.get(-4);
  equal(typeof result, "undefined", "result of get(-4) should be undefined")



  Crafty("*").destroy();
})

test("Crafty.get with only one object", function() {
  var e = Crafty.e("test");
  var collection = Crafty("test");
  result = collection.get(0);
  equal(result.getId(), e.getId(), "result of get(0) is correct entity")
  result = collection.get();
  equal(result.length, 1, "result of get() is array of length 1");
  Crafty("*").destroy();
})

test("requires", function() {
  var first = Crafty.e("test");
  Crafty.c("already", {
    already: true
  });
  Crafty.c("notyet", {
    notyet: true
  });

  first.addComponent("already");
  first.already = "already";

  first.requires("already, notyet");

  strictEqual(first.already, "already", "Didn't overwrite property");
  strictEqual(first.notyet, true, "Assigned if didn't have");
  ok(first.has("already") && first.has("notyet"), "Both added");
  // Clean up
  Crafty("*").destroy();
});

test("destroy", function() {
  var first = Crafty.e("test"),
    id = first[0]; //id
  first.destroy();
  strictEqual(Crafty(id).length, 0, "Not listed");
  // Clean up
  Crafty("*").destroy();
});

module("Scenes");

test("Scene calling", function() {
  var x = 0;
  var sceneInit = function() {
    x = 13;
  }
  Crafty.scene("test-call", sceneInit);
  Crafty.scene("test-call");
  equal(x, 13, "Scene called succesfully.")
});

test("Scene parameters", function() {
  var x = 0;
  var paramTaker = function(y) {
    x = y;
  }
  Crafty.scene("test-param", paramTaker);
  Crafty.scene("test-param", 11);
  equal(x, 11, "Scene called succesfully with parameter.")
});

test("Calling a scene destroys 2D entities", function() {
  var e = Crafty.e("2D");
  var sceneInit = function() {};
  Crafty.scene("test-destroy", sceneInit);
  Crafty.scene("test-destroy");
  var l = Crafty("2D").length;
  equal(l, 0, "2D entity destroyed on scene change.");

  Crafty("*").destroy();
});

test("Calling a scene doesn't destroy 2D entities with Persist", function() {
  var e = Crafty.e("2D, Persist");
  var sceneInit = function() {};
  Crafty.scene("test-persist", sceneInit);
  Crafty.scene("test-persist");
  var l = Crafty("2D").length;
  equal(l, 1, "Persist entity remains on scene change.");

  Crafty("*").destroy();
});


test("Scene uninit function called", function() {
  var x = 0;
  var y = 0;
  var sceneInit = function() {
    x = 13;
  }
  var sceneUninit = function() {
    x = 20;
  }
  var sceneGame = function() {
    y = 5;
  }
  Crafty.defineScene("test-uninit", sceneInit, sceneUninit);
  Crafty.defineScene("game", sceneGame);
  Crafty.enterScene("test-uninit");
  Crafty.enterScene("game");
  equal(x, 20, "Uninit scene called successfully when chanced to another scene");
});

module("2D");

test("position", function() {
  var player = Crafty.e("2D, DOM, Color").attr({
    w: 50,
    h: 50
  }).color("red");
  player.x += 50;
  strictEqual(player._x, 50, "X moved");

  player.y += 50;
  strictEqual(player._y, 50, "Y moved");

  player.w += 50;
  strictEqual(player._w, 100, "Width increase");

  player.h += 50;
  strictEqual(player._h, 100, "Height increase");

  strictEqual(player._globalZ, player[0], "Global Z, Before");

  player.z = 1;
  strictEqual(player._z, 1, "Z index");

  var global_z_guess;
  if (player[0] < 10) {
    global_z_guess = parseInt('10000' + player[0], 10);
  } else {
    global_z_guess = parseInt('1000' + player[0], 10);
  }
  strictEqual(player._globalZ, global_z_guess, "Global Z, After");
  // Clean up
  Crafty("*").destroy();
});

test("intersect", function() {
  var player = Crafty.e("2D, DOM, Color").attr({
    w: 50,
    h: 50
  }).color("red");
  player.x = 0;
  player.y = 0;
  player.w = 50;
  player.h = 50;

  strictEqual(player.intersect(0, 0, 100, 50), true, "Intersected");

  strictEqual(player.intersect({
    x: 0,
    y: 0,
    w: 100,
    h: 50
  }), true, "Intersected Again");

  strictEqual(player.intersect(100, 100, 100, 50), false, "Didn't intersect");
  // Clean up
  Crafty("*").destroy();
});

test("within", function() {
  var player = Crafty.e("2D, DOM, Color").attr({
    w: 50,
    h: 50
  });
  player.x = 0;
  player.y = 0;
  player.w = 50;
  player.h = 50;

  strictEqual(player.within(0, 0, 50, 50), true, "Within");

  strictEqual(player.within(-1, -1, 51, 51), true, "Within");


  strictEqual(player.within({
    _x: 0,
    _y: 0,
    _w: 50,
    _h: 50
  }), true, "Within Again");

  strictEqual(player.within(0, 0, 40, 50), false, "Wasn't within");

  player.rotation = 90; // Once rotated, the entity should no longer be within the rectangle

  strictEqual(player.within(0, 0, 50, 50), false, "Rotated, Not within");
  strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, within rotated area");



  // Clean up
  Crafty("*").destroy();
});

test("contains", function() {
  var player = Crafty.e("2D, DOM, Color").attr({
    w: 50,
    h: 50
  });
  player.x = 0;
  player.y = 0;
  player.w = 50;
  player.h = 50;


  strictEqual(player.contains(0, 0, 50, 50), true, "Contains");

  strictEqual(player.contains(1, 1, 49, 49), true, "Contains");

  strictEqual(player.contains({
    _x: 0,
    _y: 0,
    _w: 50,
    _h: 50
  }), true, "Contains");

  strictEqual(player.contains(1, 1, 51, 51), false, "Doesn't contain");

  player.rotation = 90;

  strictEqual(player.contains(0, 0, 50, 50), false, "Rotated, no longer contains");
  strictEqual(player.within(-50, 0, 50, 50), true, "Rotated, contains rotated area");

  // Clean up
  Crafty("*").destroy();
});



test("circle", function() {
  var player = Crafty.e("2D, DOM, Color").attr({
    w: 50,
    h: 50
  }).color("red");
  var circle = new Crafty.circle(0, 0, 10);

  strictEqual(circle.containsPoint(1, 2), true, "Contained the point");
  strictEqual(circle.containsPoint(8, 9), false, "Didn't contain the point");

  circle.shift(1, 0);

  strictEqual(circle.x, 1, "Shifted of one pixel on the x axis");
  strictEqual(circle.y, 0, "circle.y didn't change");
  strictEqual(circle.radius, 10, "circle.radius didn't change");
  // Clean up
  Crafty("*").destroy();
});

test("child", function() {
  var parent0 = Crafty.e("2D, DOM, Color").attr({
    x: 0,
    y: 0,
    w: 50,
    h: 50
  }).color("red");
  var child0 = Crafty.e("2D, DOM, Color").attr({
    x: 1,
    y: 1,
    w: 50,
    h: 50
  }).color("red");
  var child1 = Crafty.e("2D, DOM, Color").attr({
    x: 2,
    y: 2,
    w: 50,
    h: 50
  }).color("red");
  var child2 = Crafty.e("2D, DOM, Color").attr({
    x: 3,
    y: 3,
    w: 50,
    h: 50
  }).color("red");
  var child3 = Crafty.e("2D, DOM, Color").attr({
    x: 4,
    y: 4,
    w: 50,
    h: 50
  }).color("red");
  var child0_ID = child0[0];
  var child1_ID = child1[0];
  var child2_ID = child2[0];
  var child3_ID = child3[0];
  parent0.attach(child0);
  parent0.attach(child1);
  parent0.attach(child2);
  parent0.attach(child3);
  parent0.x += 50;
  strictEqual(child0._x, 51, 'child0 shifted when parent did');
  strictEqual(child1._x, 52, 'child1 shifted when parent did');
  child0.x += 1;
  child1.x += 1;
  strictEqual(parent0._x, 50, 'child shifts do not move the parent');
  child1.destroy();
  deepEqual(parent0._children, [child0, child2, child3], 'child1 cleared itself from parent0._children when destroyed');
  parent0.destroy();
  strictEqual(Crafty(child0_ID).length, 0, 'destruction of parent killed child0');
  strictEqual(Crafty(child2_ID).length, 0, 'destruction of parent killed child2');
  strictEqual(Crafty(child3_ID).length, 0, 'destruction of parent killed child3');
  // Clean up
  Crafty("*").destroy();
});

test("child_rotate", function() {
  var Round = function(x) {
    return Math.round(x * 100) / 100
  };
  var parent = Crafty.e("2D, DOM, Color")
    .attr({
      x: 0,
      y: 0,
      w: 50,
      h: 50,
      rotation: 10
    })
    .color("red");
  var child = Crafty.e("2D, DOM, Color")
    .attr({
      x: 10,
      y: 10,
      w: 50,
      h: 50,
      rotation: 15
    })
    .color("red");
  parent.attach(child);

  parent.rotation += 20;
  strictEqual(parent.rotation, 30, 'parent rotates normally');
  strictEqual(child.rotation, 35, 'child follows parent rotation');

  child.rotation += 22;
  strictEqual(parent.rotation, 30, 'parent ignores child rotation');
  strictEqual(child.rotation, 57, 'child rotates normally');

  parent.rotation = 100; // Rotation by 90 degrees from initial position
  strictEqual(Round(child.x), -10, "Child moved around parent upon rotation (x).")
  strictEqual(Round(child.y), 10, "Child moved around parent upon rotation (y).")

  // Clean up
  Crafty("*").destroy();
});



// This test assumes that the "circles" are really octagons, as per Crafty.circle.
test("SAT", function() {
  var e = Crafty.e("2D, Collision");
  var c1 = new Crafty.circle(100, 100, 10);
  var c2 = new Crafty.circle(100, 105, 10);
  strictEqual((e._SAT(c1, c2).overlap < -13.8 && e._SAT(c1, c2).overlap > -13.9), true, "Expected overlap to be about -13.86 ( or 15 cos[pi/8])")
  // Clean up
  Crafty("*").destroy();
});


test("adjustable boundary", function() {
  e = Crafty.e("2D").attr({
    x: 10,
    y: 10,
    w: 10,
    h: 10
  })

  // Four argument version
  e.offsetBoundary(10, 1, 3, 0);
  equal(e._bx1, 10, "X1 boundary set");
  equal(e._bx2, 3, "X2 boundary set");
  equal(e._by1, 1, "Y1 boundary set");
  equal(e._by2, 0, "Y2 boundary set");

  e._calculateMBR(10, 10, 0)

  var mbr = e._mbr;

  equal(mbr._h, 11, "MBR height uses boundaries (11)");
  equal(mbr._w, 23, "MBR width uses boundaries (23)");

  // One argument version
  e.offsetBoundary(5);
  equal(e._bx1, 5, "X1 boundary set");
  equal(e._bx2, 5, "X2 boundary set");
  equal(e._by1, 5, "Y1 boundary set");
  equal(e._by2, 5, "Y2 boundary set");



  Crafty("*").destroy();


})


test("disableControl and enableControl", function() {
  var e = Crafty.e("2D, Twoway")
    .attr({
      x: 0
    })
    .twoway(1);

  equal(e._movement.x, 0);
  equal(e._x, 0);
  Crafty.trigger('KeyDown', {
    key: Crafty.keys.D
  });
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 1);
  equal(e._x, 1);

  e.disableControl();
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 1);
  equal(e._x, 1);

  Crafty.trigger('KeyUp', {
    key: Crafty.keys.D
  });
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 0);
  equal(e._x, 1);

  e.enableControl();
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 0);
  equal(e._x, 1);

  Crafty.trigger('KeyDown', {
    key: Crafty.keys.D
  });
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 1);
  equal(e._x, 2);

  Crafty.trigger('KeyUp', {
    key: Crafty.keys.D
  });
  Crafty.trigger('EnterFrame');
  equal(e._movement.x, 0);
  equal(e._x, 2);

  e.destroy();
});


test("Resizing 2D objects & hitboxes", function() {
  var e = Crafty.e("2D, Collision");
  e.attr({
    x: 0,
    y: 0,
    w: 40,
    h: 50
  })

  equal(e.map.points[0][0], 0, "Before rotation: x_0 is 0")
  equal(e.map.points[0][1], 0, "y_0 is 0")
  equal(e.map.points[2][0], 40, "x_2 is 40")
  equal(e.map.points[2][1], 50, "y_2 is 50")

  e.rotation = 90;

  equal(Math.round(e.map.points[0][0]), 0, "After rotation by 90 deg: x_0 is 0")
  equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0")
  equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50")
  equal(Math.round(e.map.points[2][1]), 40, "y_2 is 40")

  // After rotation the MBR will have changed
  equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
  equal(Math.round(e._mbr._h), 40, "_mbr._h is  40");
  equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
  equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

  e.collision(); // Check that regenerating the hitbox while rotated works correctly

  equal(Math.round(e.map.points[0][0]), 0, "After rotation and hitbox regeneration: x_0 is 0")
  equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0")
  equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50")
  equal(Math.round(e.map.points[2][1]), 40, "y_2 is 40")


  // Check that changing the width when rotated resizes correctly for both hitbox and MBR
  // Rotated by 90 degrees, changing the width of the entity should change the height of the hitbox/mbr
  e.w = 100;

  equal(Math.round(e.map.points[0][0]), 0, "After rotation and increase in width: x_0 is 0")
  equal(Math.round(e.map.points[0][1]), 0, "y_0 is 0")
  equal(Math.round(e.map.points[2][0]), -50, "x_2 is -50")
  equal(Math.round(e.map.points[2][1]), 100, "y_2 is 100")

  // After rotation the MBR will have changed
  equal(Math.round(e._mbr._w), 50, "_mbr._w is  50");
  equal(Math.round(e._mbr._h), 100, "_mbr._h is  100");
  equal(Math.round(e._mbr._x), -50, "_mbr._x is -50");
  equal(Math.round(e._mbr._y), 0, "_mbr._y is 0");

  e.destroy();
});

test("Hitboxes outside of entities (CBR)", function() {
  var poly = new Crafty.polygon([
    [-8, 6],
    [0, -8],
    [8, -14],
    [16, -8],
    [24, 6]
  ]);

  var e = Crafty.e("2D, Collision").attr({
    x: 50,
    y: 50,
    w: 16,
    h: 16
  }).collision(poly);

  ok(e._cbr !== null, "_cbr exists");
  var cbr = e._cbr;
  // Test whether cbr actually bounds hitbox+object
  ok(cbr._x <= 42, "cbr x position correct");
  ok(cbr._y <= 36, "cbr y position correct");
  ok(cbr._x + cbr._w >= 74, "cbr width correct");
  ok(cbr._y + cbr._h >= 66, "cbr height correct");

  var x0 = cbr._x,
    y0 = cbr._y;

  e.x += 10;
  e.y += 15;

  equal(cbr._x, x0 + 10, "cbr x position moves correctly");
  equal(cbr._y, y0 + 15, "cbr y position moves correctly");
  Crafty("*").destroy();
})

test("CBRs on resize", function() {
  var poly = new Crafty.polygon([
    [0, 0],
    [0, 12],
    [12, 12],
    [12, 0]
  ]);

  var e = Crafty.e("2D, Collision").attr({
    x: 50,
    y: 50,
    w: 15,
    h: 15
  }).collision(poly);

  ok(e._cbr === null, "_cbr should not exist");

  e.w = 10;

  ok(e._cbr !== null, "_cbr should now exist after entity shrinks");

  e.w = 20;

  ok(e._cbr === null, "_cbr should not exist after entity grows again");

  Crafty("*").destroy();
})

test("CBRs should be removed on removal of component", function() {
  var poly = new Crafty.polygon([
    [0, 0],
    [0, 12],
    [12, 12],
    [12, 0]
  ]);

  var e = Crafty.e("2D, Collision").attr({
    x: 50,
    y: 50,
    w: 10,
    h: 10
  }).collision(poly);

  ok(e._cbr !== null, "_cbr should exist to begin with");

  e.removeComponent("Collision");

  ok(e._cbr === null, "_cbr should now be removed along with Collision");


})

module("DebugLayer");
test("DebugCanvas", function() {
  if (!(Crafty.support.canvas)) {
    expect(0);
    return;
  }
  var e = Crafty.e("2D, DebugCanvas");
  var ctx = Crafty.DebugCanvas.context;

  e.debugFill("purple");
  equal(e._debug.fillStyle, "purple", "fill style set correctly on entity");

  e.debugStroke("green")
  equal(e._debug.strokeStyle, "green", "stroke style set correctly on entity");

  e.debugDraw(ctx);
  equal(ctx.fillStyle, "#800080", "context.fillStyle set correctly on draw"); // fillStyle will report the hex code
  equal(ctx.strokeStyle, "#008000", "context.strokeStyle set correctly on draw");

  e.debugFill();
  equal(e._debug.fillStyle, "red", "default fill style set correctly");

  e.debugStroke();
  equal(e._debug.strokeStyle, "red", "default stroke style set correctly");


  e.destroy();

});

test("VisibleMBR and DebugRect", function() {
  var e = Crafty.e("2D, VisibleMBR").attr({
    x: 10,
    y: 10,
    w: 10,
    h: 20
  });
  e._assignRect();
  equal(e.debugRect._x, 10, "debugRect has correct x coord");
  equal(e.debugRect._h, 20, "debugRect has correct height");

  e.rotation = 90;
  e._assignRect();
  equal(e.debugRect._h, 10, "debugRect has correct height of MBR after rotation");

  e.destroy();

});

test("Hitbox debugging", function() {
  var e = Crafty.e("2D, Collision, WiredHitBox").attr({
    x: 10,
    y: 10,
    w: 10,
    h: 20
  }).collision();
  e.matchHitBox(); // only necessary until collision works properly!
  equal(e.polygon.points[0][0], 10, "WiredHitBox -- correct x coord for upper right corner");
  equal(e.polygon.points[2][1], 30, "correct y coord for lower right corner");
  notEqual(typeof e._debug.strokeStyle, "undefined", "stroke style is assigned");
  equal(typeof e._debug.fillStyle, "undefined", "fill style is undefined");

  e.destroy();

  var e = Crafty.e("2D, Collision, SolidHitBox").attr({
    x: 10,
    y: 10,
    w: 10,
    h: 20
  }).collision();
  e.matchHitBox(); // only necessary until collision works properly!
  equal(e.polygon.points[0][0], 10, "SolidHitBox -- correct x coord for upper right corner");
  equal(e.polygon.points[2][1], 30, "correct y coord for lower right corner");
  equal(typeof e._debug.strokeStyle, "undefined", "stroke style is undefined");
  notEqual(typeof e._debug.fillStyle, "undefined", "fill style is assigned");

  e.collision(new Crafty.polygon([0, 0], [15, 0], [0, 15]));
  e.matchHitBox();
  equal(e.polygon.points[2][1], 25, "After change -- correct y coord for third point");

  e.destroy();

});

module("Easing");
test("Crafty.easing duration", function() {
  var e = new Crafty.easing(80); // 4 frames == 80ms by default
  equal(e.duration, 80, "Default duration in ms");
})
test("Crafty.easing", function() {
  var e = new Crafty.easing(80); // 4 frames == 80ms by default
  e.tick(20);
  e.tick(20);
  equal(e.value(), 0.5, ".5 after two steps");
  e.tick(20);
  e.tick(20);
  equal(e.value(), 1, "1 after completed")
  e.tick(20);
  equal(e.value(), 1, "Remains 1 after completion")
})