(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Events");

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

  test("Global binding events", function(_) {
    var x = 0;

    function add() {
      x++;
    }

    Crafty.bind("Increment", add);
    Crafty.trigger("Increment");
    _.strictEqual(x, 1, "Crafty.bind fired once");


    x = 0;
    Crafty.unbind("Increment", add);
    Crafty.trigger("Increment");
    _.strictEqual(x, 0, "Crafty.bind does not fire once unbound");

    x = 0;
    var ref = Crafty.bind("Increment", add);
    Crafty.unbind("Increment", ref);
    Crafty.trigger("Increment");
    _.strictEqual(x, 0, "Crafty.bind does not fire once unbound via reference");

    x = 0;
    Crafty.one("Increment", add);
    Crafty.trigger("Increment");
    Crafty.trigger("Increment");
    _.strictEqual(x, 1, "Event bound by Crafty.one fires exactly once");

    x = 0;
    Crafty.uniqueBind("Increment", add);
    Crafty.uniqueBind("Increment", add);
    Crafty.trigger("Increment");
    _.strictEqual(x, 1, "Event bound twice by Crafty.uniqueBound fires only once");

    x = 0;
    Crafty.unbind("Increment", add);
    Crafty.trigger("Increment");
    _.strictEqual(x, 0, "uniqueBound does not fire once unbound");

  });

  test("Entity binding events", function(_) {

    var x = 0;

    function add() {
      x++;
    }
    var e = Crafty.e("Triggerable");

    e.bind("Increment", add);
    e.trigger("Increment");
    _.strictEqual(x, 1, ".bind fired once");


    x = 0;
    e.unbind("Increment", add);
    e.trigger("Increment");
    _.strictEqual(x, 0, ".bind does not fire once unbound");

    x = 0;
    e.one("Increment", add);
    e.trigger("Increment");
    e.trigger("Increment");
    _.strictEqual(x, 1, "Event bound by .one fires exactly once");

    x = 0;
    e.uniqueBind("Increment", add);
    e.uniqueBind("Increment", add);
    e.trigger("Increment");
    _.strictEqual(x, 1, "Event bound twice by .uniqueBound fires only once");

    x = 0;
    e.unbind("Increment", add);
    e.trigger("Increment");
    _.strictEqual(x, 0, "uniqueBound does not fire once unbound");

    e.destroy();
  });

  test("Multiple bound events", function(_) {

    //Test with entity trigger
    var temp = Crafty.e('Triggerable');
    temp.xyz = 0;
    temp.abc = 0;
    temp.def = 0;
    temp.one('Event A', function() {
      this.xyz++;
    });
    temp.bind('Event A', function() {
      this.abc++;
    });
    temp.one('Event A', function() {
      this.def++;
    });
    temp.trigger('Event A');
    temp.trigger('Event A');
    _.strictEqual(temp.xyz, 1, "ENTITY -- first one() should trigger once");
    _.strictEqual(temp.abc, 2, "regular event should trigger twice");
    _.strictEqual(temp.def, 1, "second one() should trigger once");
    temp.destroy();

    //Test with global trigger on entity
    temp = Crafty.e('Triggerable');
    temp.xyz = 0;
    temp.abc = 0;
    temp.def = 0;
    temp.one('Event A', function() {
      this.xyz++;
    });
    temp.bind('Event A', function() {
      this.abc++;
    });
    temp.one('Event A', function() {
      this.def++;
    });
    Crafty.trigger('Event A');
    Crafty.trigger('Event A');
    _.strictEqual(temp.xyz, 1, "GLOBAL TRIGGER -- first one() should trigger once");
    _.strictEqual(temp.abc, 2, "regular event should trigger twice");
    _.strictEqual(temp.def, 1, "second one() should trigger once");
    temp.destroy();

    //Test with global trigger, events bound on global
    temp = Crafty;
    temp.xyz = 0;
    temp.abc = 0;
    temp.def = 0;
    temp.one('Event A', function() {
      this.xyz++;
    });
    temp.bind('Event A', function() {
      this.abc++;
    });
    temp.one('Event A', function() {
      this.def++;
    });
    Crafty.trigger('Event A');
    Crafty.trigger('Event A');
    _.strictEqual(temp.xyz, 1, "GLOBAL BIND -- first one() should trigger once");
    _.strictEqual(temp.abc, 2, "regular event should trigger twice");
    _.strictEqual(temp.def, 1, "second one() should trigger once");

    Crafty.unbind("Event A");

  });

  // Catch bugs in unbinding logic when something is unbound at depth > 1
  test("Unbinding mid-iteration", function(_) {
    var e = Crafty.e("Triggerable");
    var counter = 0;
    // Each of these functions can be run at most once, because they unbind on triggering
    var a = function() {
        counter++;
        this.unbind("Test", a);
        this.trigger("Test");
    };
    var b = function() {
        counter++;
        this.unbind("Test", b);
        this.trigger("Test");
    };
    e.bind("Test", a);
    e.bind("Test", b);
    e.trigger("Test");
    _.strictEqual(counter, 2, "Total number of triggers should be 2 (regardless of bind/unbind order).");
  });

  test("Data passing", function(_) {
    var x = 0,
      e;

    function add(data) {
      x += data.amount;
    }

    x = 0;
    e = Crafty.e("Triggerable");
    e.bind("Increment", add);
    e.trigger("Increment", {
      amount: 2
    });
    _.strictEqual(x, 2, "data passed correctly with .bind");
    e.destroy();

    x = 0;
    e = Crafty.e("Triggerable");
    e.one("Increment", add);
    e.trigger("Increment", {
      amount: 2
    });
    _.strictEqual(x, 2, "data passed correctly with .one");
    e.destroy();

    x = 0;
    Crafty.bind("Increment", add);
    Crafty.trigger("Increment", {
      amount: 2
    });
    _.strictEqual(x, 2, "data passed correctly with Crafty.bind");
    Crafty.unbind("Increment");

    x = 0;
    Crafty.one("Increment", add);
    Crafty.trigger("Increment", {
      amount: 3
    });
    _.strictEqual(x, 3, "data passed correctly with Crafty.one");
    Crafty.unbind("Increment");
  });

  test("Events and autobind with function names", function(_){
    Crafty.c("AutoComp", {
      counter:0,
      events: {"Test":"_onTest"},
      _onTest: function(){
        this.counter++;
      }
    });
    var e = Crafty.e("AutoComp");
    e.trigger("Test");
    _.strictEqual(e.counter, 1, "Function was triggered");

    e.removeComponent("AutoComp");
    e.counter = 0;
    e.trigger("Test");
    _.strictEqual(e.counter, 0, "Function was not triggered after removal of component");


  });

  test("Events and autobind with function declared inside object", function(_){
    Crafty.c("AutoComp2", {
      counter:0,
      events: {
        Test:function(){
          this.counter++;
        }
      }
    });
    var e = Crafty.e("AutoComp2");
    e.trigger("Test");
    _.strictEqual(e.counter, 1, "Function was triggered");

    e.removeComponent("AutoComp2");
    e.counter = 0;
    e.trigger("Test");
    _.strictEqual(e.counter, 0, "Function was not triggered after removal of component");

  });


  test("Freezing and unfreezing events", function(_) {
    var x = 0, triggered = 0;

    function add() {
      x++;
    }
    function trigger(amount) {
      triggered += amount;
    }
    var e = Crafty.e("Triggerable");
    e.bind("Increment", add);
    e.bind("Freeze", trigger.bind(null, 1));
    e.bind("Unfreeze", trigger.bind(null, -1));

    triggered = 0;
    e.freeze();
    _.strictEqual(triggered, 1, "Freeze event was triggered");

    triggered = 0;
    e.freeze();
    _.strictEqual(triggered, 0, "Freeze event wasn't triggered, because it was already frozen");

    x = 0;
    e.trigger("Increment");
    _.strictEqual(x, 0, "Callback does not run while frozen");

    x = 0;
    Crafty.trigger("Increment");
    _.strictEqual(x, 0, "Callback does not run while frozen");

    triggered = 0;
    e.unfreeze();
    _.strictEqual(triggered, -1, "Unfreeze event was triggered");

    triggered = 0;
    e.unfreeze();
    _.strictEqual(triggered, 0, "Unfreeze event wasn't triggered, because it was already unfrozen");

    x = 0;
    e.trigger("Increment");
    _.strictEqual(x, 1, "Event can be triggered once unfrozen");

    x = 0;
    Crafty.trigger("Increment");
    _.strictEqual(x, 1, "Event can be globally triggered once unfrozen");

    e.destroy();
  });

  test("Freezing should prevent cascade", function(_) {
    var parent = Crafty.e("2D");
    var child = Crafty.e("2D");
    parent.attr({x: 10, y:10});
    child.attr({x:20, y:20});
    parent.attach(child);

    child.freeze();
    parent.x += 10;
    _.strictEqual(child._x, 20, "Child does not move while frozen");

    child.unfreeze();
    parent.x += 10;
    _.strictEqual(child._x, 30, "Child moves with parent when frozen");
  });

  test("Freezing and unfreezing events on groups", function(_) {
    var x = 0, triggered = 0;

    function add() {
      x++;
    }
    function trigger(amount) {
      triggered += amount;
    }
    //Create 2 triggerable entities
    Crafty.e("Triggerable");
    Crafty.e("Triggerable");

    var group = Crafty("Triggerable");
    group.bind("Increment", add);
    group.bind("Freeze", trigger.bind(null, 1));
    group.bind("Unfreeze", trigger.bind(null, -1));

    triggered = 0;
    group.freeze();
    _.strictEqual(triggered, 2, "Freeze events were triggered");

    triggered = 0;
    group.freeze();
    _.strictEqual(triggered, 0, "Freeze events weren't triggered, because they were already frozen");

    x = 0;
    group.trigger("Increment");
    _.strictEqual(x, 0, "Callback does not run while frozen");

    x = 0;
    Crafty.trigger("Increment");
    _.strictEqual(x, 0, "Callback does not run while frozen when triggered globally");

    triggered = 0;
    group.unfreeze();
    _.strictEqual(triggered, -2, "Unfreeze events were triggered");

    triggered = 0;
    group.unfreeze();
    _.strictEqual(triggered, 0, "Unfreeze event weren't triggered, because they were already unfrozen");

    x = 0;
    group.trigger("Increment");
    _.strictEqual(x, 2, "Event can be triggered once unfrozen");

    x = 0;
    Crafty.trigger("Increment");
    _.strictEqual(x, 2, "Event can be globally triggered once unfrozen");

    group.destroy();
  });
})();

