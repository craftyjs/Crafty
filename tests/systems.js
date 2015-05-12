(function() {
  var module = QUnit.module;

  module("Systems");

  test("Create a system using Crafty.ss", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    ok(s, "System is returned");
    ok(s.n===0, "System has property copied");
    ok(typeof s.add === "function", "System has method copied");
    ok(typeof s.bind === "function", "System has bind method");
    ok(typeof s.unbind === "function", "System has unbind method");
    ok(typeof s.trigger === "function", "System has trigger method");
    ok(typeof s.one === "function", "System has one method");
    ok(typeof s.uniqueBind === "function", "System has uniqueBind method");

    s.destroy();

  });

  test("Create a system, then access it using Crafty.s", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty._systems.Adder;
    var s2 = Crafty.s("Adder");
    ok(s===s2, "Crafty.s returns correct object;");

    s.destroy();

  });

  test("Create a system, then destroy it", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.destroy();
    var s2 = Crafty.s("Adder");
    equal(typeof s2, "undefined", "Crafty.s returns undefined after system is destroyed;");
  });

  test("Create a non-lazy system with an init method", function(){
    var loaded = false;
    var sys =  {
        init: function() { loaded = true; }
    };
    Crafty.s("Loader", sys, false);
    equal(loaded, true, "System loaded on creation");

    var s = Crafty.s("Loader");
    s.destroy();
  });

  test("Create a lazy system with an init method", function(){
    var loaded = false;
    var sys =  {
        init: function() { loaded = true; }
    };
    Crafty.s("Loader", sys, true);
    equal(loaded, false, "System not loaded on creation");
    var s = Crafty.s("Loader");
    equal(loaded, true, "System loaded on first reference");
    s.destroy();
  });

  test("Create a system with a remove method", function(){
    var destroyed = false;
    var sys =  {
        remove: function() { destroyed = true; }
    };
    Crafty.s("Loader", sys);
    var s = Crafty.s("Loader");
    equal(destroyed, false, "remove not called on creation");
    s.destroy();
    equal(destroyed, true, "remove called on destruction");
  });

  test("Bind an event to a system, trigger directly", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    s.trigger("Add", 1);
    equal(s.n, 1, "Direct trigger works");

    s.destroy();
  });

  test("Bind an event to a system, then unbind", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    s.trigger("Add", 1);
    equal(s.n, 1, "Direct trigger works");

    s.unbind("Add", sys.add);
    s.trigger("Add", 1);
    equal(s.n, 1, "No trigger after unbind");

    s.destroy();
  });


  test("Bind an event to a system, trigger globally", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    Crafty.trigger("Add", 1);
    equal(s.n, 1, "Global trigger works");

    s.destroy();
  });

  test("Bind an event to a system, then destroy it and trigger globally", function() {
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", sys.add);
    Crafty.trigger("Add", 1);
    equal(s.n, 1, "Direct trigger works");

    s.destroy();
    Crafty.trigger("Add", 1);
    equal(s.n, 1, "No trigger after unbind");

  });

  test("system.uniqueBind()", function(){
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.bind("Add", s.add);
    s.uniqueBind("Add", s.add);
    s.trigger("Add", 1);
    equal(s.n, 1, "Only one event handler called");

  });

  test("system.one()", function(){
    var sys =  {
        n: 0,
        add: function(m) { this.n+=m; }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.one("Add", s.add);
    s.trigger("Add", 1);
    s.trigger("Add", 1);
    s.destroy();
    equal(s.n, 1, "Only one event handler called");

  });

  test("Special property `events`", function() {
    var sys =  {
        n: 0,
        events:{
            "Add": function(m) { this.n+=m; }
        }
    };
    Crafty.s("Adder", sys);
    var s = Crafty.s("Adder");
    s.trigger("Add", 1);
    equal(s.n, 1, "Method listed in .events property triggers correctly.");
    s.destroy();
  });



})();

