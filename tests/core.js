module("Core", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

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

});

test("bind", function() {
  var first = Crafty.e("test"),
    triggered = false;
  first.bind("myevent", function() {
    triggered = true;
  });
  first.trigger("myevent");
  strictEqual(triggered, true, "custom event triggered");

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

})

test("Crafty.get with only one object", function() {
  var e = Crafty.e("test");
  var collection = Crafty("test");
  result = collection.get(0);
  equal(result.getId(), e.getId(), "result of get(0) is correct entity")
  result = collection.get();
  equal(result.length, 1, "result of get() is array of length 1");

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

});

test("destroy", function() {
  var first = Crafty.e("test"),
    id = first[0]; //id
  first.destroy();
  strictEqual(Crafty(id).length, 0, "Not listed");

});

module("Scenes", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

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

});

test("Calling a scene doesn't destroy 2D entities with Persist", function() {
  var e = Crafty.e("2D, Persist");
  var sceneInit = function() {};
  Crafty.scene("test-persist", sceneInit);
  Crafty.scene("test-persist");
  var l = Crafty("2D").length;
  equal(l, 1, "Persist entity remains on scene change.");

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


module("DebugLayer", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

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

module("Easing", {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

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