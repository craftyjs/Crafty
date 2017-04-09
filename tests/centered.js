(function() {
  var module = QUnit.module;

    module("Centered");
    test("centered properties", function() {
        var player = Crafty.e("2D, Centered").attr({
            x: 0,
            y: 0,
            w: 50,
            h: 50
        });
        player.origin(10, 10);
        
        
        player.cx = 20;
        strictEqual(player.x, 10, "X set such that origin is at cx");
        strictEqual(player.cx, 20, "CX set to 20");
        
        
        player.cy = 30;
        strictEqual(player.y, 20, "X set such that origin is at cy");
        strictEqual(player.cy, 30, "CY set to 20");
    });

    test("centerOrigin", function() {
        var player = Crafty.e("2D, Centered").attr({
            x: 10,
            y: 10,
            w: 12,
            h: 12
        });
        player.origin(10, 10);
        
        strictEqual(player.cx, 20, "initial cx at 10");
        strictEqual(player.cy, 20, "initial cy at 10");
        
        player.centerOrigin();
        strictEqual(player.cx, 16, "centered origin x at 6");
        strictEqual(player.cy, 16, "centered origin y at 6");
    });

    test("centerOrigin with rounding", function() {
        var player = Crafty.e("2D, Centered").attr({
            x: 0,
            y: 0,
            w: 10.5,
            h: 10.5
        });
        player.origin(10, 10);
        
        strictEqual(player.cx, 10, "initial cx at 10");
        strictEqual(player.cy, 10, "initial cy at 10");
        
        player.centerOrigin(false);
        strictEqual(player.cx, 5.25, "centered origin x at 5.25");
        strictEqual(player.cy, 5.25, "centered origin y at 5.25");

        player.centerOrigin(true);
        strictEqual(player.cx, 5, "with rounding, centered origin x at 5");
        strictEqual(player.cy, 5, "with rounding, centered origin y at 5");
    });

    test("shiftAroundOrigin", function() {
        var player = Crafty.e("2D, Centered").attr({
            x: 5,
            y: 5,
            w: 10,
            h: 10
        });
        player.origin(10, 10);
        
        strictEqual(player.cx, 15, "cx starts at 15");
        strictEqual(player.cy, 15, "cy starts at 15");

        // Move the player +10, +10 while keeping the origin point fixed relative to the stage
        player.shiftAroundOrigin(10, -10);

        strictEqual(player.x, 15, "player moves +10 along the x direction");
        strictEqual(player.y, -5, "player moves -10 along the y direction");

        strictEqual(player.cx, 15, "cx remains fixed");
        strictEqual(player.cy, 15, "cy remains fixed");
    });

    // Might be good practice to add non-trivial examples to our tests
    test("centerOrigin test example code", function() {
        var e = Crafty.e("2D, Centered");
        e.attr({x: 10, y:10, w: 50, h:50});
        e.centerOrigin();
        // Whenever the entity resizes, keep it's origin and center fixed on the stage
        e.bind("Resize", function(){
            var oldX = this.cx;
            var oldY = this.cy;
            this.centerOrigin();
            this.cx = oldX;
            this.cy = oldY;
        });
        strictEqual(e.cx, 35, "cx starts at 35");
        strictEqual(e.cy, 35, "cy starts at 35");
        
        e.w = 10;
        strictEqual(e.cx, 35, "cx remains fixed");
        strictEqual(e.x, 30, "entity moved to maintain center");

        e.h = 10;
        strictEqual(e.cy, 35, "cy remains fixed");
        strictEqual(e.y, 30, "entity moved to maintain center");

    });

})();
