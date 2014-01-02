module("Storage");
test("saveAndLoadObject", function() {
  Crafty.storage.open("MyGame");
  Crafty.storage.save("LeaderBoard", "save", {
    name: "Matthew",
    score: 150
  });
  stop();
  Crafty.storage.load("LeaderBoard", "save", function(lb) {
    equal(lb["name"], "Matthew");
    start();
  });
});

test("saveAndLoadArray", function() {
  Crafty.storage.open("MyGame1");
  Crafty.storage.save("LeaderBoard", "save", [{
    name: "Matthew",
    score: 150
  }, {
    name: "Louis",
    score: 17
  }]);
  stop();
  Crafty.storage.load("LeaderBoard", "save", function(lb) {
    equal(lb[1]["name"], "Louis");
    equal(lb.length, 2);
    start();
  });
});

test("saveAndLoadEntity", function() {
  Crafty.storage.open("MyGame2");
  Crafty.storage.save("Hero", "save", Crafty.e("2D, DOM").attr({
    x: 20,
    y: 137
  }));
  stop();
  Crafty.storage.load("Hero", "save", function(hero) {
    console.log(hero);
    ok(hero.__c["2D"]);
    ok(hero.__c["DOM"])
    equal(hero.x, 0, "Entity state is not saved");
    start();
  });
});

test("individualNamespaces", function() {
  Crafty.storage.open("MyGame3");
  Crafty.storage.save("LeaderBoard", "save", {
    name: "Matthew",
    score: 150
  });


  Crafty.storage.open("MyGame4");
  Crafty.storage.save("LeaderBoard", "save", {
    name: "Louis",
    score: 150
  });

  stop();
  Crafty.storage.load("LeaderBoard", "save", function(lb) {
    equal(lb["name"], "Louis");
    start();
  });

  Crafty.storage.open("MyGame3");
  Crafty.storage.load("LeaderBoard", "save", function(lb) {
    equal(lb["name"], "Matthew");
    start();
  });
})