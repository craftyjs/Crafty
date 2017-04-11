(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Events");

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

})();

