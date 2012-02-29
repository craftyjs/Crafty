//pro tip: see also this work in progress by Hex http://jsfiddle.net/hexaust/HV4TX/
window.onload = function() {
  var width = 15,
      height = 20;

  Crafty.init();

  Crafty.sprite(128, "./images/sprite.png?wat", {
    grass: [0,0,1,1],
    stone: [1,0,1,1],
    bedrock:[2,0,1,1]
  });

  for(var i = 0; i < width; i++) {
    for(var y = 0; y < height; y++) {
      var stackHeight = (Math.random() * 3) >> 0;

      for(var z = 0; z <= stackHeight; z++){
        var tileSprite = ["bedrock", "stone", "grass"],
            tile = Crafty.e("2D, DOM, DiamondIsometric, Mouse, " + tileSprite[z])
                  .size(128)
                  .areaMap([64,0],[128,32],[128,96],[64,128],[0,96],[0,32])
                  .bind("Click", function(e) {
                    //destroy on right click
                    //right click seems not work in Mac OS
                    //delete it
                    console.log(e.button);
                    /*if(e.button === 2)*/ this.destroy();
                  }).bind("MouseOver", function() {
                    if(this.has("grass")) {
                      this.sprite(0,1,1,1);
                    } else if(this.has("stone")) {
                      this.sprite(1,1,1,1);
                    } else{
                      this.sprite(2,1,1,1);
                    }
                  }).bind("MouseOut", function() {
                    if(this.has("grass")) {
                      this.sprite(0,0,1,1);
                    } else if(this.has("stone")) {
                      this.sprite(1,0,1,1);
                    } else{
                      this.sprite(2,0,1,1);
                    }
                  })
                  .place(i, y, z, width);
      }
    }
  }

  Crafty.addEvent(this, Crafty.stage.elem, "mousedown", function(e) {
    if(e.button > 1) return;
    var base = {x: e.clientX, y: e.clientY};

    function scroll(e) {
      var dx = base.x - e.clientX,
        dy = base.y - e.clientY;
        base = {x: e.clientX, y: e.clientY};
      Crafty.viewport.x -= dx;
      Crafty.viewport.y -= dy;
    };

    Crafty.addEvent(this, Crafty.stage.elem, "mousemove", scroll);

    Crafty.addEvent(this, Crafty.stage.elem, "mouseup", function() {
      Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", scroll);
    });
  });
};
