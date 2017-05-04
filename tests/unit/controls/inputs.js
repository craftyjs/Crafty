(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module('Inputs');

  test("AreaMap", function(_) {
    var areaMapEvents = 0;
    var e = Crafty.e("2D, DOM, AreaMap")
              .bind("NewAreaMap", function(newAreaMap) {
                areaMapEvents++;
              });

    var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
    e.areaMap(poly);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(e.mapArea !== poly, "Hitbox is a clone of passed polygon");

    var arr = [50, 0, 100, 100, 0, 100];
    e.areaMap(arr);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(e.mapArea.points && e.mapArea.points !== arr, "Array used in hitbox is a clone of passed array");

    e.areaMap(50, 0, 100, 100, 0, 100);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");

    _.strictEqual(areaMapEvents, 3, "NewAreaMap event triggered 3 times");
  });

  // mock-phantom-touch-events is a PhantomJS plugin, thus the test below is skipped if enviroment is not PhantomJS
  if (navigator.userAgent.indexOf("PhantomJS") !== -1)
    test('Multitouch simulation', function(_) {
      Crafty.multitouch(true);
      
      var touchStartsOverEntities = 0,
          touchEndsOverEntities = 0;
      Crafty.e('2D, Renderable, DOM, Touch')
              .attr({ x: 100, y: 100, w:200, h:200, z:1 })
              .bind('TouchStart',function(){ 
                  touchStartsOverEntities++;
              })
              .bind('TouchEnd',function(){ 
                  touchEndsOverEntities++;
              });
      Crafty.e('2D, Renderable, DOM, Touch')
              .attr({ x: 40, y: 150, w:90, h:300, z:2 })
              .bind('TouchStart',function(){ 
                  touchStartsOverEntities++;
              })
              .bind('TouchEnd',function(){ 
                  touchEndsOverEntities++;
              });
      var elem = Crafty.stage.elem,
         sx = Crafty.stage.x,
         sy = Crafty.stage.y,
         touchStart1 = createTouchEvent(elem, "touchstart", [[100 + sx, 80 + sy, 0], [150 + sx, 150 + sy, 1], [200 + sx, 50 + sy, 2], [65 + sx, 275 + sy, 3]]),
         touchEnd1 = createTouchEvent(elem, "touchend", [[65 + sx, 275 + sy, 3]]),
         touchEnd2 = createTouchEvent(elem, "touchend", [[200 + sx, 50 + sy, 2]]),
         touchStart2 = createTouchEvent(elem, "touchstart", [[100 + sx, 80 + sy, 4]]),
         touchEnd3 = createTouchEvent(elem, "touchend", [[150 + sx, 150 + sy, 1]]),
         touchEnd4 = createTouchEvent(elem, "touchend", [[100 + sx, 80 + sy, 0]]),
         touchEnd5 = createTouchEvent(elem, "touchend", [[100 + sx, 80 + sy, 4]]);

      touchStart1();
    
      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 4, "Four fingers currently touching stage");
    
      touchEnd1();

      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 3, "Three fingers currently touching stage");
    
      touchEnd2();
      touchStart2();
      
      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 3, "Three fingers currently touching stage");
    
      touchEnd3();
    
      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 2, "Two fingers currently touching stage");

      touchEnd4();
      
      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 1, "One finger currently touching stage");

      touchEnd5();
    
      _.equal(Crafty._touchDispatcher._touchHandler.fingers.length, 0, "No fingers currently touching stage");
      
      _.equal(touchStartsOverEntities, 2, "Two entities recieved TouchStart");
      _.equal(touchEndsOverEntities, 2, "Two entities recieved TouchEnd");
    });
    
    test("stopKeyPropagation", function(_) {
      var stopPropCalled = false;
      var preventDefaultCalled = false;

      var mockEvent = {
        char:"", charCode:"", keyCode:"", type:"", 
        shiftKey:"", ctrlKey:"", metaKey:"", timestamp:"",
        target: document,
        stopPropagation: function(){
          stopPropCalled = true;
        },
        preventDefault: function(){
          preventDefaultCalled = true;
        },
        cancelBubble: false,
        returnValue: false,
      };

      Crafty.selected = true;
      Crafty._keyboardDispatcher.processEvent(mockEvent);
      Crafty.selected = false;
      
      _.ok(stopPropCalled, "stopPropagation Not Called");
      _.ok(preventDefaultCalled, "preventDefault Not Called");
    });
})();