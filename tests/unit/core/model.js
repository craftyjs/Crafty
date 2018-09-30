(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Model");

  test("Get", function(_) {
    var fox;
    Crafty.c("Animal", {
      contact: {
        email: "test@example.com",
        address: {
          city: "Portland",
          state: "Oregon"
        }
      },
      name: "Fox"
    });
    fox = Crafty.e("Animal, Model");

    _.strictEqual(fox.attr("contact.address.city"), "Portland");
    _.strictEqual(fox.attr("contact.email"), "test@example.com");
    _.strictEqual(fox.attr("name"), "Fox");
  });

  test("Set", function(_) {
    var fox;
    Crafty.c("Animal", {
      name: "Fox"
    });

    fox = Crafty.e("Animal, Model");

    fox.attr("name", "Foxxy");
    _.strictEqual(fox.attr("name"), "Foxxy");

    fox.attr("name", "Slick", {});
    _.strictEqual(fox.attr("name"), "Slick");

    fox.attr({ name: "Lucky" });
    _.strictEqual(fox.attr("name"), "Lucky");

    fox.attr({ name: "Spot" }, {});
    _.strictEqual(fox.attr("name"), "Spot");
  });

  test("Set with dot notation", function(_) {
    var fox;
    Crafty.c("Animal", {
      contact: {
        email: "test@example.com",
        address: {
          city: "Portland",
          state: "Oregon"
        }
      },
      name: "Fox"
    });
    fox = Crafty.e("Animal, Model");

    fox.attr("contact.address.city", "Salem");

    _.deepEqual(fox.attr("contact.address"), {
      city: "Salem",
      state: "Oregon"
    });
  });

  test("Set Silent", function(_) {
    var fox, called;
    Crafty.c("Animal", {
      name: "Fox"
    });

    fox = Crafty.e("Animal, Model");

    called = false;
    fox.bind("Change", function() {
      called = true;
    });

    fox.attr({ name: "Lucky" }, true);
    _.strictEqual(called, false);

    fox.attr({ name: "Spot" }, false);
    _.strictEqual(called, true);
  });

  test("Set Recursive", function(_) {
    var fox;
    Crafty.c("Animal", {
      name: "Fox",
      contact: {
        email: "fox@example.com",
        phone: "555-555-4545"
      }
    });

    fox = Crafty.e("Animal, Model");

    fox.attr({ contact: { email: "foxxy@example.com" } }, false, true);

    _.deepEqual(fox.attr("contact"), {
      email: "foxxy@example.com",
      phone: "555-555-4545"
    });
  });

  test("Set triggers change events", function(_) {
    var fox,
      results = [];
    Crafty.c("Animal", {
      name: "Fox",
      contact: {
        email: "fox@example.com",
        phone: "555-555-4545"
      }
    });

    fox = Crafty.e("Animal, Model");

    fox.bind("Change", function() {
      results.push("Change");
    });
    fox.bind("Change[name]", function() {
      results.push("Change[name]");
    });
    fox.bind("Change[contact.email]", function() {
      results.push("Change[contact.email]");
    });

    fox.attr({ name: "Lucky" });
    fox.attr({ contact: { email: "foxxy@example.com" } }, false, true);

    _.deepEqual(results, [
      "Change[name]",
      "Change",
      "Change[contact.email]",
      "Change"
    ]);
  });

  test("Dirty", function(_) {
    var fox;
    Crafty.c("Animal", {
      name: "Fox",
      dob: "March 21",
      age: 24
    });

    fox = Crafty.e("Animal, Model");

    _.strictEqual(fox.is_dirty(), false);
    _.strictEqual(fox.is_dirty("name"), false);
    _.strictEqual(fox.is_dirty("age"), false);

    fox.attr("name", "Lucky");
    fox.attr("dob", "March 22");

    _.strictEqual(fox.is_dirty(), true);
    _.strictEqual(fox.is_dirty("name"), true);
    _.strictEqual(fox.is_dirty("age"), false);

    _.deepEqual(fox.changed, ["name", "dob"]);
  });
})();
