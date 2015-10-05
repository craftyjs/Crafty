(function() {
  var module = QUnit.module;

  module('Loader');

  test("Warning on old syntax", function(){
    var original_log = Crafty.log;
    var logged_message = "";
    Crafty.log = function(msg) { logged_message = msg; };
    Crafty.load(["falsey.png"], function(){ logged_message = "nope"; });
    ok(logged_message.indexOf("no longer works") >=0, "Correctly logged warning.");
    Crafty.log = original_log;
  });


  asyncTest('assets loading', function() {
    expect(1);

    var items = [],
        checkItems = function() {
            var checks = 0;
            for(var i = 0, l = items.length, src;i<l;i++) {
                src = items[i].src;
                if(src)
                    checks++;
            }
            return checks;
        },
        wereItemsRemoved = function() {
            return Crafty.assets[Crafty.paths().images + "100x100.png"] === undefined &&
              Crafty.assets[Crafty.paths().images + "100x100.jpeg"] === undefined &&
              Crafty.assets[Crafty.paths().images + "craftyLogo.png"] === undefined &&
              Crafty.components().no_free === undefined;
        };

    Crafty.paths({images: "assets/"});
    
    var assets_to_load = {
      "images": ["100x100.png", "100x100.jpeg"],
      "sprites": {
        "craftyLogo.png": {
          "tile" : 147,
          "tileh" : 90,
          "map": {
             "no_free" : [0, 0]
          }
        }
      }
    };

    Crafty.load(assets_to_load, function() {
        Crafty.removeAssets(assets_to_load);
        ok(checkItems() == 3 && wereItemsRemoved(), 'all assets have been successfully loaded, and then successfully removed');
        start();
      }, function(data) {
        items.push(data);
      }, function(error) {
        Crafty.log(error);
      }
    );
  });
})();