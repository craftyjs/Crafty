(function() {
  var module = QUnit.module;

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
    });
    var e = Crafty.e("comp, blank");
    e.removeComponent("blank");
    strictEqual(removeRan, false, "Remove doesn't run on other component removal");

    removeRan = false;
    e.removeComponent("comp");
    strictEqual(removeRan, true, "Remove runs on correct component removal");
    strictEqual(destroyFlag, false, "Destroy flag false on regular removal");

    removeRan = false;
    e.addComponent("comp");
    e.destroy();
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

  test("defineField", function() {
    if (!(Crafty.support.setter || Crafty.support.defineProperty)) {
      // IE8 has a setter() function but it behaves differently. No test is currently written for IE8.
      expect(0);
      return;
    }

    var first = Crafty.e("test");


    first.setter('p0', function(v) {
      this._p0 = v * 5;
    });
    first.p0 = 2;
    strictEqual(first._p0, 10, "single property setter");
    strictEqual(first.p0, undefined, "single property getter");


    first.defineField('p1', function() {
      return this._p1;
    }, function(v) {
      this._p1 = v * 2;
    });
    first.p1 = 2;
    strictEqual(first.p1, 4, "single property getter & setter");

    first.defineField('p2', function() {
      return this._p2;
    }, function(v) {
      this._p2 = v * 2;
    }).defineField('p3', function() {
      return this._p3;
    }, function(v) {
      this._p3 = v * 2;
    });
    first.p2 = 2;
    first.p3 = 3;
    strictEqual(first.p2 + first.p3, 10, "two property getters & setters");

    if (Crafty.support.defineProperty) {
      delete first.p1;
      strictEqual(first.p1, 4, "property survived deletion");
    }
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

  test("bind groups of entities", function() {
    var e1 = Crafty.e("test"), e2 = Crafty.e("test");
    var test_callback = function(){
      this.test_flag = true;
    };
    Crafty("test").bind("TestEvent", test_callback);
    e1.trigger("TestEvent");
    strictEqual(e1.test_flag, true, "Entity event triggered on first entity");
    notStrictEqual(e2.test_flag, false, "Not triggered on second ");

    e1.test_flag = false;

    Crafty.trigger("TestEvent");
    strictEqual(e1.test_flag, true, "Global event triggered on first entity");
    strictEqual(e2.test_flag, true, "Global event triggered on second entity");

  });

  test("trigger groups of entities", function(){
    var e1 = Crafty.e("test"), e2 = Crafty.e("test");
    var test_callback = function(){
      this.test_flag = true;
    };
    e1.bind("TestEvent", test_callback);
    e2.bind("TestEvent", test_callback);
    Crafty("test").trigger("TestEvent");
    strictEqual(e1.test_flag, true, "Triggered on first entity");
    strictEqual(e2.test_flag, true, "Triggered on second entity");
  });

  test("bind to an event in response to that same event", function() {
    var first = Crafty.e("test"),
      triggered = 0;
    function increment(){ triggered++; }
    first.bind("myevent", function() {
      increment();
      first.bind("myevent", increment);
    });
    first.trigger("myevent");
    strictEqual(triggered, 1, "event added in response to an event should not be triggered by that same event");

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

  });

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

  });

  test("Crafty.get(index) error checking", function() {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    var collection, result;

    collection = Crafty("test");

    result = collection.get(3);
    equal(typeof result, "undefined", "result of get(3) should be undefined");

    result = collection.get(-4);
    equal(typeof result, "undefined", "result of get(-4) should be undefined");

  });

  test("Crafty.get with only one object", function() {
    var e = Crafty.e("test");
    var collection = Crafty("test");
    var result = collection.get(0);
    equal(result.getId(), e.getId(), "result of get(0) is correct entity");
    result = collection.get();
    equal(result.length, 1, "result of get() is array of length 1");

  });

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

  test("required special parameter", function() {
    var hasComp = false;
    Crafty.c("Requisitioner", {
      init: function() { 
        if (this.has("RequiredComponent")){
          hasComp = true;
        }
      },
      required: "RequiredComponent"
    });
    Crafty.e("Requisitioner");

    ok(hasComp, "Required component added before init was run");
  });

  test("destroy", function() {
    var first = Crafty.e("test"),
      id = first[0]; //id
    first.destroy();
    strictEqual(Crafty(id).length, 0, "Not listed");

  });

  test(".frame() function", function(){
    var frameNumber;
    var frameFunction = function() {
      frameNumber = Crafty.frame();
    };
    Crafty.bind('EnterFrame', frameFunction);
    Crafty.timer.simulateFrames(1);

    ok(frameNumber, '.frame function should return a value.');

    Crafty.unbind(frameFunction);
  });

  // TODO: add test for Crafty.stop() once problematic side effects are fixed!

  module("Scenes");

  test("Scene calling", function() {
    var x = 0;
    var sceneInit = function() {
      x = 13;
    };
    Crafty.scene("test-call", sceneInit);
    Crafty.scene("test-call");
    equal(x, 13, "Scene called succesfully.");

  });

  test("Scene parameters", function() {
    var x = 0;
    var paramTaker = function(y) {
      x = y;
    };
    Crafty.scene("test-param", paramTaker);
    Crafty.scene("test-param", 11);
    equal(x, 11, "Scene called succesfully with parameter.");
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
    };
    var sceneUninit = function() {
      x = 20;
    };
    var sceneGame = function() {
      y = 5;
    };
    Crafty.defineScene("test-uninit", sceneInit, sceneUninit);
    Crafty.defineScene("game", sceneGame);
    Crafty.enterScene("test-uninit");
    Crafty.enterScene("game");
    equal(x, 20, "Uninit scene called successfully when chanced to another scene");

  });


  module("Easing");

  test("Crafty.easing duration", function() {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    equal(e.duration, 80, "Default duration in ms");
  });

  test("Crafty.easing", function() {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    equal(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    equal(e.value(), 1, "1 after completed");
    e.tick(20);
    equal(e.value(), 1, "Remains 1 after completion");
  });

  test("Crafty.easing with custom function", function() {
    var e = new Crafty.easing(80, function(t){return t*t;}) ; // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    equal(e.value(), 0.25, ".25 after two steps");
    e.tick(20);
    e.tick(20);
    equal(e.value(), 1, "1 after completed");
  });

  test("Crafty.easing with built-in smoothStep function", function() {
    var e = new Crafty.easing(80, "smoothStep"); // 4 frames == 80ms by default
    e.tick(20);
    equal(e.value(), 0.15625, "0.15625 after one step");
    e.tick(20);
    equal(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    equal(e.value(), 1, "1 after completed");
  });

  test('Get', function() {
    var fox;
    Crafty.c('Animal', {
      contact: {
        email: 'test@example.com',
        address: {
          city: 'Portland',
          state: 'Oregon'
        }
      },
      name: 'Fox'
    });
    fox = Crafty.e('Animal, Model');

    equal(fox.attr('contact.address.city'), 'Portland');
    equal(fox.attr('contact.email'), 'test@example.com');
    equal(fox.attr('name'), 'Fox');
  });

  test('Set', function() {
    var fox;
    Crafty.c('Animal', {
      name: 'Fox'
    });

    fox = Crafty.e('Animal, Model');

    fox.attr('name', 'Foxxy');
    equal(fox.attr('name'), 'Foxxy');

    fox.attr('name', 'Slick', {});
    equal(fox.attr('name'), 'Slick');

    fox.attr({name: 'Lucky'});
    equal(fox.attr('name'), 'Lucky');

    fox.attr({name: 'Spot'}, {});
    equal(fox.attr('name'), 'Spot');
  });

  test('Set with dot notation', function() {
    var fox;
    Crafty.c('Animal', {
      contact: {
        email: 'test@example.com',
        address: {
          city: 'Portland',
          state: 'Oregon'
        }
      },
      name: 'Fox'
    });
    fox = Crafty.e('Animal, Model');

    fox.attr('contact.address.city', 'Salem');

    deepEqual(fox.attr('contact.address'), {city: 'Salem', state: 'Oregon'});
  });

  test('Set Silent', function() {
    var fox, called;
    Crafty.c('Animal', {
      name: 'Fox'
    });

    fox = Crafty.e('Animal, Model');

    called = false;
    fox.bind('Change', function() {
      called = true;
    });

    fox.attr({name: 'Lucky'}, true);
    equal(called, false);

    fox.attr({name: 'Spot'}, false);
    equal(called, true);
  });

  test('Set Recursive', function() {
    var fox;
    Crafty.c('Animal', {
      name: 'Fox',
      contact: {
        email: 'fox@example.com',
        phone: '555-555-4545'
      }
    });

    fox = Crafty.e('Animal, Model');

    fox.attr({contact: {email: 'foxxy@example.com'}}, false, true);

    deepEqual(fox.attr('contact'), {email: 'foxxy@example.com', phone: '555-555-4545'});
  });

  module("Timer");

  test('Timer.simulateFrames', function() {
    var counter = 0;

    var enterFrameFunc = function() {
      counter++;
      ok(counter === 1 || counter === 3 || counter === 5, "different counter value expected");
    };
    var exitFrameFunc = function() {
      counter++;
      ok(counter === 2 || counter === 4 || counter === 6, "different counter value expected");
    };
    var preRenderFunc = function() {
      counter++;
      ok(counter === 7, "different counter value expected");
    };
    var renderSceneFunc = function() {
      counter++;
      ok(counter === 8, "different counter value expected");
    };
    var postRenderFunc = function() {
      counter++;
      ok(counter === 9, "different counter value expected");
    };

    Crafty.bind("EnterFrame", enterFrameFunc);
    Crafty.bind("ExitFrame", exitFrameFunc);
    Crafty.bind("PreRender", preRenderFunc);
    Crafty.bind("RenderScene", renderSceneFunc);
    Crafty.bind("PostRender", postRenderFunc);

    Crafty.timer.simulateFrames(3); // 3*2 frame events + 1*3 render events

    Crafty.unbind("EnterFrame", enterFrameFunc);
    Crafty.unbind("ExitFrame", exitFrameFunc);
    Crafty.unbind("PreRender", preRenderFunc);
    Crafty.unbind("RenderScene", renderSceneFunc);
    Crafty.unbind("PostRender", postRenderFunc);
  });

  test('Crafty.timer.FPS', function() {
    var counter = 0;
    var increment = function() {
      counter++;
    };
    Crafty.bind("FPSChange", increment);

    Crafty.one("FPSChange", function(fps) {
      strictEqual(fps, 25);
      strictEqual(Crafty.timer.FPS(), 25);
    });
    Crafty.one("EnterFrame", function(frameData) {
      strictEqual(frameData.dt, 1000/25);
    });
    Crafty.timer.FPS(25);
    Crafty.timer.simulateFrames(1);

    Crafty.one("FPSChange", function(fps) {
      strictEqual(fps, 50);
      strictEqual(Crafty.timer.FPS(), 50);
    });
    Crafty.one("EnterFrame", function(frameData) {
      strictEqual(frameData.dt, 1000/50);
    });
    Crafty.timer.FPS(50);
    Crafty.timer.simulateFrames(1);

    Crafty.unbind("FPSChange", increment);
    strictEqual(counter, 2);
  });

})();
