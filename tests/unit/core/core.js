(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Core");

  test("getVersion", function(_) {
    _.ok(Crafty.getVersion(), "The actual library version");
  });

  test("selectors", function(_) {
    var first = Crafty.e("test, test3");
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test, test2");
    var other = Crafty.e("test2, test, test3");
    Crafty.e("test2, test3");
    Crafty.e("test3, test");
    _.strictEqual(Crafty("test").length, 6, "Single component");
    _.strictEqual(Crafty("test test2").length, 2, "Two components ANDed");
    _.strictEqual(
      Crafty("test2 test test3").length,
      1,
      "Three components ANDed"
    );
    _.strictEqual(Crafty("test, test2").length, 7, "Two components ORed");

    _.strictEqual(Crafty("*").length, 7, "All components - universal selector");

    _.strictEqual(Crafty(first[0]), first, "Get by ID");

    first.removeComponent("test3");
    _.strictEqual(
      Crafty("test3").length,
      3,
      "Single component query after removing a component"
    );

    other.destroy();
    _.strictEqual(
      Crafty("test test2 test3").length,
      0,
      "Compount component query after destroying an entity"
    );
    _.strictEqual(
      Crafty("test").length,
      5,
      "Single component query after destroying an entity"
    );
    _.strictEqual(
      Crafty("test2").length,
      2,
      "Single component query after destroying an entity"
    );
    _.strictEqual(
      Crafty("test3").length,
      2,
      "Single component query after destroying an entity"
    );
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
    _.strictEqual(
      first.has("multi1") && first.has("multi2"),
      true,
      "multiple components added"
    );

    first.removeComponent("test3");
    _.strictEqual(first.has("test3"), false, "component removed");

    first.removeComponent("comp");
    _.strictEqual(
      first.added && !first.has("comp"),
      true,
      "soft-removed component (properties remain)"
    );
    first.removeComponent("comp", false);
    _.strictEqual(
      !first.added && !first.has("comp"),
      true,
      "hard-removed component (properties are gone)"
    );

    first.removeComponent("nonAddedComponent");
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
    _.strictEqual(
      removeRan,
      false,
      "Remove doesn't run on other component removal"
    );

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
          set: function(value) {
            this._foo = value;
          },
          get: function() {
            return this._foo;
          },
          configurable: true,
          enumerable: true
        },
        _foo: { value: 0, writable: true, enumerable: false }
      }
    });
    var e = Crafty.e("PropertyTest");

    _.strictEqual(e._foo, 0, "Initial value works");

    e.foo = 5;
    _.strictEqual(e._foo, 5, "Setter works");

    e._foo = 10;
    _.strictEqual(e.foo, 10, "Getter works");

    var propList = [];
    for (var prop in e) {
      propList.push(prop);
    }

    _.ok(propList.indexOf("foo") >= 0, "Property foo is enumerable");
    _.ok(propList.indexOf("_foo") === -1, "Property _foo is not enumerable");
  });

  test("component - order of handling special members", function(_) {
    _.expect(5 * 5 - 1);

    Crafty.c("MemberOrderTest", {
      // 1st: basic prop should be added to entity
      foo: 1,
      // 2nd: properties should be defined on entity
      properties: {
        bar: {
          get: function() {
            if (!this.getCalled) {
              _.strictEqual(this.foo, 1);
              // can't check this.bar here - infinite recursion
              _.strictEqual(this.baz, undefined);
              _.strictEqual(this.quux, undefined);
              _.strictEqual(this.quuz, undefined);
              this.getCalled = true;
            }
            return 2;
          }
        }
      },
      // 3rd: events should be bound on entity
      events: {
        CustomEvent: function() {
          _.strictEqual(this.foo, 1);
          _.strictEqual(this.bar, 2);
          _.strictEqual(this.baz, undefined);
          _.strictEqual(this.quux, undefined);
          _.strictEqual(this.quuz, undefined);
          this.baz = 3;
        }
      },
      // 4th: init method should be called on entity
      init: function() {
        this.trigger("CustomEvent");

        _.strictEqual(this.foo, 1);
        _.strictEqual(this.bar, 2);
        _.strictEqual(this.baz, 3);
        _.strictEqual(this.quux, undefined);
        _.strictEqual(this.quuz, undefined);
        this.quux = 4;
      },
      // 5th: remove method should be called on entity
      remove: function() {
        _.strictEqual(this.foo, 1);
        _.strictEqual(this.bar, 2);
        _.strictEqual(this.baz, 3);
        _.strictEqual(this.quux, 4);
        _.strictEqual(this.quuz, undefined);
        this.quuz = 5;
      }
    });
    var e = Crafty.e()
      .addComponent("MemberOrderTest")
      .removeComponent("MemberOrderTest");

    _.strictEqual(e.foo, 1);
    _.strictEqual(e.bar, 2);
    _.strictEqual(e.baz, 3);
    _.strictEqual(e.quux, 4);
    _.strictEqual(e.quuz, 5);
  });

  test("overwrite component definition", function(_) {
    Crafty.c("MyCompDef", { a: 0 });
    var e = Crafty.e("MyCompDef");
    _.strictEqual(e.a, 0);
    _.strictEqual(e.b, undefined);

    Crafty.c("MyCompDef", { a: 1, b: 1 });
    var f = Crafty.e("MyCompDef");
    _.strictEqual(e.a, 0);
    _.strictEqual(e.b, undefined);
    _.strictEqual(f.a, 1);
    _.strictEqual(f.b, 1);
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

    _.strictEqual(
      player.getName(),
      "Player2",
      "other entity's name didn't change after changing another entity's name"
    );
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

    first.setter("p0", function(v) {
      this._p0 = v * 5;
    });
    first.p0 = 2;
    _.strictEqual(first._p0, 10, "single property setter");
    _.strictEqual(first.p0, undefined, "single property getter");

    first.defineField(
      "p1",
      function() {
        return this._p1;
      },
      function(v) {
        this._p1 = v * 2;
      }
    );
    first.p1 = 2;
    _.strictEqual(first.p1, 4, "single property getter & setter");

    first
      .defineField(
        "p2",
        function() {
          return this._p2;
        },
        function(v) {
          this._p2 = v * 2;
        }
      )
      .defineField(
        "p3",
        function() {
          return this._p3;
        },
        function(v) {
          this._p3 = v * 2;
        }
      );
    first.p2 = 2;
    first.p3 = 3;
    _.strictEqual(first.p2 + first.p3, 10, "two property getters & setters");

    if (Crafty.support.defineProperty) {
      delete first.p1;
      _.strictEqual(first.p1, 4, "property survived deletion");
    }
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
    _.strictEqual(
      result[0].has("test"),
      true,
      "Result elements should have correct component"
    );
    _.strictEqual(
      collection[0],
      result[0].getId(),
      "First id of result should match first id of Crafty array"
    );
  });

  test("Crafty.get(index) to find the indicated entity", function(_) {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    var collection, result;

    collection = Crafty("test");
    result = collection.get(0);
    _.strictEqual(
      result.has("test"),
      true,
      "Result should have correct component"
    );
    _.strictEqual(
      result.getId(),
      collection[0],
      "result should be first element of collection"
    );

    result = collection.get(-1);
    _.strictEqual(
      result.has("test"),
      true,
      "Result should have correct component"
    );
    _.strictEqual(
      result.getId(),
      collection[2],
      "result should be last element of collection"
    );
  });

  test("Crafty.get(index) error checking", function(_) {
    Crafty.e("test");
    Crafty.e("test");
    Crafty.e("test");
    var collection, result;

    collection = Crafty("test");

    result = collection.get(3);
    _.strictEqual(
      typeof result,
      "undefined",
      "result of get(3) should be undefined"
    );

    result = collection.get(-4);
    _.strictEqual(
      typeof result,
      "undefined",
      "result of get(-4) should be undefined"
    );
  });

  test("Crafty.get with only one object", function(_) {
    var e = Crafty.e("test");
    var collection = Crafty("test");
    var result = collection.get(0);
    _.strictEqual(
      result.getId(),
      e.getId(),
      "result of get(0) is correct entity"
    );
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

  test("requires multiple args", function(_) {
    var first = Crafty.e("test");
    Crafty.c("one", {});
    Crafty.c("two", {});

    first.requires("one", "two");

    _.ok(first.has("one"), "Component one added");
    _.ok(first.has("two"), "Component two added");
  });

  test("required special parameter", function(_) {
    var hasComp = false;
    Crafty.c("Requisitioner", {
      init: function() {
        if (this.has("RequiredComponent")) {
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

  test(".frame() function", function(_) {
    var frameNumber;
    var frameFunction = function() {
      frameNumber = Crafty.frame();
    };
    Crafty.bind("UpdateFrame", frameFunction);
    Crafty.timer.simulateFrames(1);

    _.ok(frameNumber, ".frame function should return a value.");

    Crafty.unbind("UpdateFrame", frameFunction);
  });

  // TODO: add test for Crafty.stop() once problematic side effects are fixed!

  module("Timer");

  test("Timer.simulateFrames", function(_) {
    var counter = 0;

    var enterFrameFunc = function() {
      counter++;
      _.ok(
        counter === 1 || counter === 4 || counter === 7,
        "different counter value expected"
      );
    };
    var updateFrameFunc = function() {
      counter++;
      _.ok(
        counter === 2 || counter === 5 || counter === 8,
        "different counter value expected"
      );
    };
    var exitFrameFunc = function() {
      counter++;
      _.ok(
        counter === 3 || counter === 6 || counter === 9,
        "different counter value expected"
      );
    };
    var preRenderFunc = function() {
      counter++;
      _.ok(counter === 10, "different counter value expected");
    };
    var renderSceneFunc = function() {
      counter++;
      _.ok(counter === 11, "different counter value expected");
    };
    var postRenderFunc = function() {
      counter++;
      _.ok(counter === 12, "different counter value expected");
    };

    Crafty.bind("EnterFrame", enterFrameFunc);
    Crafty.bind("UpdateFrame", updateFrameFunc);
    Crafty.bind("ExitFrame", exitFrameFunc);
    Crafty.bind("PreRender", preRenderFunc);
    Crafty.bind("RenderScene", renderSceneFunc);
    Crafty.bind("PostRender", postRenderFunc);

    Crafty.timer.simulateFrames(3); // 3*3 frame events + 1*3 render events
    _.strictEqual(counter, 12, "12 events should have been fired");

    Crafty.unbind("EnterFrame", enterFrameFunc);
    Crafty.unbind("UpdateFrame", updateFrameFunc);
    Crafty.unbind("ExitFrame", exitFrameFunc);
    Crafty.unbind("PreRender", preRenderFunc);
    Crafty.unbind("RenderScene", renderSceneFunc);
    Crafty.unbind("PostRender", postRenderFunc);
  });

  test("Crafty.timer.steptype", function(_) {
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

  test("Crafty.timer.FPS", function(_) {
    var counter = 0;
    var increment = function() {
      counter++;
    };
    Crafty.bind("FPSChange", increment);

    Crafty.one("FPSChange", function(fps) {
      _.strictEqual(fps, 25);
      _.strictEqual(Crafty.timer.FPS(), 25);
    });
    Crafty.one("UpdateFrame", function(frameData) {
      _.strictEqual(frameData.dt, 1000 / 25);
    });
    Crafty.timer.FPS(25);
    Crafty.timer.simulateFrames(1);

    Crafty.one("FPSChange", function(fps) {
      _.strictEqual(fps, 50);
      _.strictEqual(Crafty.timer.FPS(), 50);
    });
    Crafty.one("UpdateFrame", function(frameData) {
      _.strictEqual(frameData.dt, 1000 / 50);
    });
    Crafty.timer.FPS(50);
    Crafty.timer.simulateFrames(1);

    Crafty.unbind("FPSChange", increment);
    _.strictEqual(counter, 2);
  });
})();
