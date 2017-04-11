(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Core");

  test("getVersion", function(_) {
    _.ok(Crafty.getVersion(), "The actual library version");
  });

  test("selectors", function(_) {
    var first = Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test, test2");
    Crafty.e("test, test2");
    Crafty.e("test2");
    _.strictEqual(Crafty("test").length, 6, "Single component");
    _.strictEqual(Crafty("test test2").length, 2, "Two components ANDed");
    _.strictEqual(Crafty("test, test2").length, 7, "Two components ORed");

    _.strictEqual(Crafty("*").length, 7, "All components - universal selector");

    _.strictEqual(Crafty(first[0]), first, "Get by ID");

  });

  test("addComponent and removeComponent", function(_) {
    var first = Crafty.e("test");
    Crafty.c("comp", {
      added: true
    });
    first.addComponent("test3");
    _.strictEqual(first.has("test3"), true, "component added");

    first.addComponent("comp");
    _.strictEqual(first.added, true, "component with property exists");

    first.addComponent("multi1, multi2");
    _.strictEqual(first.has("multi1") && first.has("multi2"), true, "multiple components added");

    first.removeComponent("test3");
    _.strictEqual(first.has("test3"), false, "component removed");

    first.removeComponent("comp");
    _.strictEqual(first.added && !first.has("comp"), true, "soft-removed component (properties remain)");
    first.removeComponent("comp", false);
    _.strictEqual(!first.added && !first.has("comp"), true, "hard-removed component (properties are gone)");

  });

  test("remove", function(_) {
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
    _.strictEqual(removeRan, false, "Remove doesn't run on other component removal");

    removeRan = false;
    e.removeComponent("comp");
    _.strictEqual(removeRan, true, "Remove runs on correct component removal");
    _.strictEqual(destroyFlag, false, "Destroy flag false on regular removal");

    removeRan = false;
    e.addComponent("comp");
    e.destroy();
    _.strictEqual(removeRan, true, "Remove runs on component destrution");
    _.strictEqual(destroyFlag, true, "Destroy flag true on destruction");
  });

  // check the properties attribute of components, especially the pattern used by existing components
  test("properties", function(_) {
    
    Crafty.c("PropertyTest", {
      properties: {
        foo: {
          set: function(value){
            this._foo = value;
          },
          get: function(){
            return this._foo;
          },
          configurable: true,
          enumerable: true
        },
        _foo: {value: 0, writable: true, enumerable:false}
      }
    });
    var e = Crafty.e("PropertyTest");
 
    _.strictEqual(e._foo, 0, "Initial value works");

    e.foo = 5;
    _.strictEqual(e._foo, 5, "Setter works");
    
    e._foo = 10;
    _.strictEqual(e.foo, 10, "Getter works");
    
    var propList = [];
    for (var prop in e){
      propList.push(prop);
    }

    _.ok(propList.indexOf("foo") >=0, "Property foo is enumerable");
    _.ok(propList.indexOf("_foo") === -1, "Property _foo is not enumerable");
  });

  test("name", function(_) {
    var counter = 0;
    var player = Crafty.e().bind("NewEntityName", function() {
      counter++;
    });

    player.one("NewEntityName", function(name) {
      _.strictEqual(name, "Player");
    });
    player.setName("Player");
    _.strictEqual(player.getName(), "Player");

    player.one("NewEntityName", function(name) {
      _.strictEqual(name, "Player2");
    });
    player.setName("Player2");
    _.strictEqual(player.getName(), "Player2");


    var player3 = Crafty.e().one("NewEntityName", function(name) {
      counter++;
      _.strictEqual(name, "Player3");
    });
    player3.setName("Player3");
    _.strictEqual(player3.getName(), "Player3");


    _.strictEqual(player.getName(), "Player2", "other entity's name didn't change after changing another entity's name");
    _.strictEqual(counter, 3, "correct number of events fired");
  });

  test("attr", function(_) {
    var first = Crafty.e("test");
    first.attr("single", true);
    _.strictEqual(first.single, true, "single attribute assigned");

    first.attr({
      prop: "test",
      another: 56
    });
    _.strictEqual(first.prop, "test", "properties from object assigned");
    _.strictEqual(first.another, 56, "properties from object assigned");

  });

  test("defineField", function(_) {
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
    _.strictEqual(first._p0, 10, "single property setter");
    _.strictEqual(first.p0, undefined, "single property getter");


    first.defineField('p1', function() {
      return this._p1;
    }, function(v) {
      this._p1 = v * 2;
    });
    first.p1 = 2;
    _.strictEqual(first.p1, 4, "single property getter & setter");

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
    _.strictEqual(first.p2 + first.p3, 10, "two property getters & setters");

    if (Crafty.support.defineProperty) {
      delete first.p1;
      _.strictEqual(first.p1, 4, "property survived deletion");
    }
  });

  test("bind", function(_) {
    var first = Crafty.e("test"),
      triggered = false;
    first.bind("myevent", function() {
      triggered = true;
    });
    first.trigger("myevent");
    _.strictEqual(triggered, true, "custom event triggered");

  });

  test("bind groups of entities", function(_) {
    var e1 = Crafty.e("test"), e2 = Crafty.e("test");
    var test_callback = function(){
      this.test_flag = true;
    };
    Crafty("test").bind("TestEvent", test_callback);
    e1.trigger("TestEvent");
    _.strictEqual(e1.test_flag, true, "Entity event triggered on first entity");
    _.notEqual(e2.test_flag, false, "Not triggered on second ");

    e1.test_flag = false;

    Crafty.trigger("TestEvent");
    _.strictEqual(e1.test_flag, true, "Global event triggered on first entity");
    _.strictEqual(e2.test_flag, true, "Global event triggered on second entity");

  });

  test("trigger groups of entities", function(_){
    var e1 = Crafty.e("test"), e2 = Crafty.e("test");
    var test_callback = function(){
      this.test_flag = true;
    };
    e1.bind("TestEvent", test_callback);
    e2.bind("TestEvent", test_callback);
    Crafty("test").trigger("TestEvent");
    _.strictEqual(e1.test_flag, true, "Triggered on first entity");
    _.strictEqual(e2.test_flag, true, "Triggered on second entity");
  });

  test("bind to an event in response to that same event", function(_) {
    var first = Crafty.e("test"),
      triggered = 0;
    function increment(){ triggered++; }
    first.bind("myevent", function() {
      increment();
      first.bind("myevent", increment);
    });
    first.trigger("myevent");
    _.strictEqual(triggered, 1, "event added in response to an event should not be triggered by that same event");

  });

  test("unbind", function(_) {
    var first = Crafty.e("test");
    first.bind("myevent", function() {
      _.ok(false, "This should not be triggered (unbinding all)");
    });
    first.unbind("myevent");
    first.trigger("myevent");

    function callback() {
      _.ok(false, "This should also not be triggered (unbind by FN)");
    }

    function callback2() {
      _.ok(true, "This should be triggered");
    }

    first.bind("myevent", callback);
    first.bind("myevent", callback2);
    first.unbind("myevent", callback);
    first.trigger("myevent");

  });

  test("globalBindAndUnbind", function(_) {
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
    _.strictEqual(flag, 111, "global event binding worked");
    Crafty.unbind("theglobalevent", add_1);
    Crafty.trigger("theglobalevent");
    _.strictEqual(flag, 221, "global event single-function unbinding worked");
    Crafty.unbind("theglobalevent");
    Crafty.trigger("theglobalevent");
    _.strictEqual(flag, 221, "global event full unbinding worked");
  });

  test("each", function(_) {
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
    _.strictEqual(count, 6, "Iterated all elements with certain component");

    count = 0;
    Crafty("*").each(function() {
      count++;
    });
    _.strictEqual(count, 7, "Iterated all elements");

  });

  test("Crafty.get() to find an array", function(_) {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");

    var collection = Crafty("test");
    var result = collection.get();
    _.strictEqual(result.length, 3, "resultant array should be length 3");
    _.strictEqual(result[0].has("test"), true, "Result elements should have correct component");
    _.strictEqual(collection[0], result[0].getId(), "First id of result should match first id of Crafty array");

  });

  test("Crafty.get(index) to find the indicated entity", function(_) {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    var collection, result;

    collection = Crafty("test");
    result = collection.get(0);
    _.strictEqual(result.has("test"), true, "Result should have correct component");
    _.strictEqual(result.getId(), collection[0], "result should be first element of collection");

    result = collection.get(-1);
    _.strictEqual(result.has("test"), true, "Result should have correct component");
    _.strictEqual(result.getId(), collection[2], "result should be last element of collection");

  });

  test("Crafty.get(index) error checking", function(_) {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    var collection, result;

    collection = Crafty("test");

    result = collection.get(3);
    _.strictEqual(typeof result, "undefined", "result of get(3) should be undefined");

    result = collection.get(-4);
    _.strictEqual(typeof result, "undefined", "result of get(-4) should be undefined");

  });

  test("Crafty.get with only one object", function(_) {
    var e = Crafty.e("test");
    var collection = Crafty("test");
    var result = collection.get(0);
    _.strictEqual(result.getId(), e.getId(), "result of get(0) is correct entity");
    result = collection.get();
    _.strictEqual(result.length, 1, "result of get() is array of length 1");

  });

  test("requires", function(_) {
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

    _.strictEqual(first.already, "already", "Didn't overwrite property");
    _.strictEqual(first.notyet, true, "Assigned if didn't have");
    _.ok(first.has("already") && first.has("notyet"), "Both added");

  });

  test("required special parameter", function(_) {
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

    _.ok(hasComp, "Required component added before init was run");
  });

  test("destroy", function(_) {
    var first = Crafty.e("test"),
      id = first[0]; //id
    first.destroy();
    _.strictEqual(Crafty(id).length, 0, "Not listed");

  });

  test(".frame() function", function(_){
    var frameNumber;
    var frameFunction = function() {
      frameNumber = Crafty.frame();
    };
    Crafty.bind('EnterFrame', frameFunction);
    Crafty.timer.simulateFrames(1);

    _.ok(frameNumber, '.frame function should return a value.');

    Crafty.unbind(frameFunction);
  });

  // TODO: add test for Crafty.stop() once problematic side effects are fixed!

  module("Scenes");

  test("Scene calling", function(_) {
    var x = 0;
    var sceneInit = function() {
      x = 13;
    };
    Crafty.scene("test-call", sceneInit);
    Crafty.scene("test-call");
    _.strictEqual(x, 13, "Scene called succesfully.");

  });

  test("Scene parameters", function(_) {
    var x = 0;
    var paramTaker = function(y) {
      x = y;
    };
    Crafty.scene("test-param", paramTaker);
    Crafty.scene("test-param", 11);
    _.strictEqual(x, 11, "Scene called succesfully with parameter.");
  });

  test("Calling a scene destroys 2D entities", function(_) {
    Crafty.e("2D");
    var sceneInit = function() {};
    Crafty.scene("test-destroy", sceneInit);
    Crafty.scene("test-destroy");
    var l = Crafty("2D").length;
    _.strictEqual(l, 0, "2D entity destroyed on scene change.");

  });

  test("Calling a scene doesn't destroy 2D entities with Persist", function(_) {
    Crafty.e("2D, Persist");
    var sceneInit = function() {};
    Crafty.scene("test-persist", sceneInit);
    Crafty.scene("test-persist");
    var l = Crafty("2D").length;
    _.strictEqual(l, 1, "Persist entity remains on scene change.");

  });


  test("Scene uninit function called", function(_) {
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
    _.strictEqual(x, 20, "Uninit scene called successfully when chanced to another scene");

  });


  module("Easing");

  test("Crafty.easing duration", function(_) {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    _.strictEqual(e.duration, 80, "Default duration in ms");
  });

  test("Crafty.easing", function(_) {
    var e = new Crafty.easing(80); // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
    e.tick(20);
    _.strictEqual(e.value(), 1, "Remains 1 after completion");
  });

  test("Crafty.easing with custom function", function(_) {
    var e = new Crafty.easing(80, function(t){return t*t;}) ; // 4 frames == 80ms by default
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 0.25, ".25 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
  });

  test("Crafty.easing with built-in smoothStep function", function(_) {
    var e = new Crafty.easing(80, "smoothStep"); // 4 frames == 80ms by default
    e.tick(20);
    _.strictEqual(e.value(), 0.15625, "0.15625 after one step");
    e.tick(20);
    _.strictEqual(e.value(), 0.5, ".5 after two steps");
    e.tick(20);
    e.tick(20);
    _.strictEqual(e.value(), 1, "1 after completed");
  });

  test('Get', function(_) {
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

    _.strictEqual(fox.attr('contact.address.city'), 'Portland');
    _.strictEqual(fox.attr('contact.email'), 'test@example.com');
    _.strictEqual(fox.attr('name'), 'Fox');
  });

  test('Set', function(_) {
    var fox;
    Crafty.c('Animal', {
      name: 'Fox'
    });

    fox = Crafty.e('Animal, Model');

    fox.attr('name', 'Foxxy');
    _.strictEqual(fox.attr('name'), 'Foxxy');

    fox.attr('name', 'Slick', {});
    _.strictEqual(fox.attr('name'), 'Slick');

    fox.attr({name: 'Lucky'});
    _.strictEqual(fox.attr('name'), 'Lucky');

    fox.attr({name: 'Spot'}, {});
    _.strictEqual(fox.attr('name'), 'Spot');
  });

  test('Set with dot notation', function(_) {
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

    _.deepEqual(fox.attr('contact.address'), {city: 'Salem', state: 'Oregon'});
  });

  test('Set Silent', function(_) {
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
    _.strictEqual(called, false);

    fox.attr({name: 'Spot'}, false);
    _.strictEqual(called, true);
  });

  test('Set Recursive', function(_) {
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

    _.deepEqual(fox.attr('contact'), {email: 'foxxy@example.com', phone: '555-555-4545'});
  });

  module("Timer");

  test('Timer.simulateFrames', function(_) {
    var counter = 0;

    var enterFrameFunc = function() {
      counter++;
      _.ok(counter === 1 || counter === 3 || counter === 5, "different counter value expected");
    };
    var exitFrameFunc = function() {
      counter++;
      _.ok(counter === 2 || counter === 4 || counter === 6, "different counter value expected");
    };
    var preRenderFunc = function() {
      counter++;
      _.ok(counter === 7, "different counter value expected");
    };
    var renderSceneFunc = function() {
      counter++;
      _.ok(counter === 8, "different counter value expected");
    };
    var postRenderFunc = function() {
      counter++;
      _.ok(counter === 9, "different counter value expected");
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

  test('Crafty.timer.steptype', function(_) {
    var originalSteptype = Crafty.timer.steptype(),
        steptype,
        counter = 0;
    var increment = function() {
      counter++;
    };
    Crafty.bind("NewSteptype", increment);


    Crafty.one("NewSteptype", function(evt) {
      _.strictEqual(evt.mode, "fixed");
      _.strictEqual(evt.maxTimeStep, 100);
    });
    Crafty.timer.steptype("fixed", 100);
    steptype = Crafty.timer.steptype();
    _.strictEqual(steptype.mode, "fixed");
    _.strictEqual(steptype.maxTimeStep, 100);


    Crafty.one("NewSteptype", function(evt) {
      _.strictEqual(evt.mode, "variable");
      _.strictEqual(evt.maxTimeStep, 1000);
    });
    Crafty.timer.steptype("variable", 1000);
    steptype = Crafty.timer.steptype();
    _.strictEqual(steptype.mode, "variable");
    _.strictEqual(steptype.maxTimeStep, 1000);


    _.strictEqual(counter, 2);
    Crafty.unbind("NewSteptype", increment);
    Crafty.timer.steptype(originalSteptype.mode, originalSteptype.maxTimeStep);
  });

  test('Crafty.timer.FPS', function(_) {
    var counter = 0;
    var increment = function() {
      counter++;
    };
    Crafty.bind("FPSChange", increment);

    Crafty.one("FPSChange", function(fps) {
      _.strictEqual(fps, 25);
      _.strictEqual(Crafty.timer.FPS(), 25);
    });
    Crafty.one("EnterFrame", function(frameData) {
      _.strictEqual(frameData.dt, 1000/25);
    });
    Crafty.timer.FPS(25);
    Crafty.timer.simulateFrames(1);

    Crafty.one("FPSChange", function(fps) {
      _.strictEqual(fps, 50);
      _.strictEqual(Crafty.timer.FPS(), 50);
    });
    Crafty.one("EnterFrame", function(frameData) {
      _.strictEqual(frameData.dt, 1000/50);
    });
    Crafty.timer.FPS(50);
    Crafty.timer.simulateFrames(1);

    Crafty.unbind("FPSChange", increment);
    _.strictEqual(counter, 2);
  });

})();
