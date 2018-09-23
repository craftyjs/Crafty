(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Systems");

  test("Create a system using Crafty.ss", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    _.ok(s, "System is returned");
    _.ok(s.n === 0, "System has property copied");
    _.ok(typeof s.add === "function", "System has method copied");
    _.ok(typeof s.bind === "function", "System has bind method");
    _.ok(typeof s.unbind === "function", "System has unbind method");
    _.ok(typeof s.trigger === "function", "System has trigger method");
    _.ok(typeof s.one === "function", "System has one method");
    _.ok(typeof s.uniqueBind === "function", "System has uniqueBind method");

    s.destroy();
  });

  test("Create a system, then access it using Crafty.s", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty._systems.Adder;
    var s2 = Crafty.s("Adder");
    _.ok(s === s2, "Crafty.s returns correct object;");

    s.destroy();
  });

  test("Create a system, then destroy it", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.destroy();
    var s2 = Crafty.s("Adder");
    _.strictEqual(
      typeof s2,
      "undefined",
      "Crafty.s returns undefined after system is destroyed;"
    );
  });

  test("Create a non-lazy system with an init method", function(_) {
    var loaded = false;
    var sys = {
      init: function() {
        loaded = true;
      }
    };
    Crafty.s("Loader", sys, false);
    _.strictEqual(loaded, true, "System loaded on creation");

    var s = Crafty.s("Loader");
    s.destroy();
  });

  test("Create a lazy system with an init method", function(_) {
    var loaded = false;
    var sys = {
      init: function() {
        loaded = true;
      }
    };
    Crafty.s("Loader", sys, true);
    _.strictEqual(loaded, false, "System not loaded on creation");
    var s = Crafty.s("Loader");
    _.strictEqual(loaded, true, "System loaded on first reference");
    s.destroy();
  });

  test("Create a system with a remove method", function(_) {
    var destroyed = false;
    var sys = {
      remove: function() {
        destroyed = true;
      }
    };
    Crafty.s("Loader", sys);
    var s = Crafty.s("Loader");
    _.strictEqual(destroyed, false, "remove not called on creation");
    s.destroy();
    _.strictEqual(destroyed, true, "remove called on destruction");
  });

  test("Bind an event to a system, trigger directly", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    s.trigger("Add", 1);
    _.strictEqual(s.n, 1, "Direct trigger works");

    s.destroy();
  });

  test("Bind an event to a system, then unbind", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    s.trigger("Add", 1);
    _.strictEqual(s.n, 1, "Direct trigger works");

    s.unbind("Add", sys.add);
    s.trigger("Add", 1);
    _.strictEqual(s.n, 1, "No trigger after unbind");

    s.destroy();
  });

  test("Bind an event to a system, trigger globally", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    Crafty.trigger("Add", 1);
    _.strictEqual(s.n, 1, "Global trigger works");

    s.destroy();
  });

  test("Bind an event to a system, then destroy it and trigger globally", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    Crafty.trigger("Add", 1);
    _.strictEqual(s.n, 1, "Direct trigger works");

    s.destroy();
    Crafty.trigger("Add", 1);
    _.strictEqual(s.n, 1, "No trigger after unbind");
  });

  test("system.uniqueBind()", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", s.add);
    s.uniqueBind("Add", s.add);
    s.trigger("Add", 1);
    _.strictEqual(s.n, 1, "Only one event handler called");
  });

  test("system.one()", function(_) {
    var sys = {
      n: 0,
      add: function(m) {
        this.n += m;
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.one("Add", s.add);
    s.trigger("Add", 1);
    s.trigger("Add", 1);
    s.destroy();
    _.strictEqual(s.n, 1, "Only one event handler called");
  });

  test("Special property `events`", function(_) {
    var sys = {
      n: 0,
      events: {
        Add: function(m) {
          this.n += m;
        }
      }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.trigger("Add", 1);
    _.strictEqual(
      s.n,
      1,
      "Method listed in .events property triggers correctly."
    );
    s.destroy();
  });

  test("Special property `properties`", function(_) {
    var sys = {
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
    };
    Crafty.s("PropertySystem", sys);

    var s = Crafty.s("PropertySystem");

    _.strictEqual(s._foo, 0, "Initial value works");

    s.foo = 5;
    _.strictEqual(s._foo, 5, "Setter works");

    s._foo = 10;
    _.strictEqual(s.foo, 10, "Getter works");

    var propList = [];
    for (var prop in s) {
      propList.push(prop);
    }

    _.ok(propList.indexOf("foo") >= 0, "Property foo is enumerable");
    _.ok(propList.indexOf("_foo") === -1, "Property _foo is not enumerable");
  });

  test("Special property `options` default values", function(_) {
    var sys = {
      n: 0,
      options: {
        testFlag: true
      }
    };
    Crafty.s("Test", sys, { secondFlag: false });
    var s = Crafty.s("Test");
    _.strictEqual(
      s.options.testFlag,
      true,
      "Default values for options not changed when not set"
    );
    s.destroy();
  });

  test("Special property `options` override values", function(_) {
    var sys = {
      n: 0,
      options: {
        testFlag: true
      }
    };
    Crafty.s("Test", sys, { testFlag: false });
    var s = Crafty.s("Test");
    _.strictEqual(
      s.options.testFlag,
      false,
      "Default values for options can be overridden"
    );
    s.destroy();
  });

  test("Overwrite system definition", function(_) {
    Crafty.s("MySystemDef", { a: 0 }, {}, false);
    _.strictEqual(Crafty.s("MySystemDef").a, 0);
    _.strictEqual(Crafty.s("MySystemDef").b, undefined);

    Crafty.s("MySystemDef", { a: 1, b: 1 }, {}, false);
    _.strictEqual(Crafty.s("MySystemDef").a, 1);
    _.strictEqual(Crafty.s("MySystemDef").b, 1);
  });

  test("order of handling special members", function(_) {
    _.expect(5 * 5 - 1);

    Crafty.s("MemberOrderTest", {
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
    var s = Crafty.s("MemberOrderTest");
    s.destroy();

    _.strictEqual(s.foo, 1);
    _.strictEqual(s.bar, 2);
    _.strictEqual(s.baz, 3);
    _.strictEqual(s.quux, 4);
    _.strictEqual(s.quuz, 5);
  });
})();
