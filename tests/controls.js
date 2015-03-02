(function() {
  module('Controls');
  
  // mock-phantom-touch-events is a PhantomJS plugin, thus the test below is skipped if enviroment is not PhantomJS
  if (navigator.userAgent.indexOf("PhantomJS") !== -1)
    test('Multitouch simulation', function() {
      Crafty.multitouch(true);
      
      var touchStartsOverEntities = 0,
          touchEndsOverEntities = 0,
          entity1 = Crafty.e('2D, Touch')
              .attr({ x: 100, y: 100, w:200, h:200, z:1 })
              .bind('TouchStart',function(){ 
                  touchStartsOverEntities++;
              })
              .bind('TouchEnd',function(){ 
                  touchEndsOverEntities++;
              }),
          entity2 = Crafty.e('2D, Touch')
              .attr({ x: 40, y: 150, w:90, h:300, z:2 })
              .bind('TouchStart',function(){ 
                  touchStartsOverEntities++;
              })
              .bind('TouchEnd',function(){ 
                  touchEndsOverEntities++;
              }),
         elem = Crafty.stage.elem,
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
    
      equal(Crafty._touchHandler.fingers.length, 4, "Four fingers currently touching stage");
    
      touchEnd1();

      equal(Crafty._touchHandler.fingers.length, 3, "Three fingers currently touching stage");
    
      touchEnd2();
      touchStart2();
      
      equal(Crafty._touchHandler.fingers.length, 3, "Three fingers currently touching stage");
    
      touchEnd3();
    
      equal(Crafty._touchHandler.fingers.length, 2, "Two fingers currently touching stage");

      touchEnd4();
      
      equal(Crafty._touchHandler.fingers.length, 1, "One finger currently touching stage");

      touchEnd5();
    
      equal(Crafty._touchHandler.fingers.length, 0, "No fingers currently touching stage");
      
      equal(touchStartsOverEntities, 2, "Two entities recieved TouchStart");
      equal(touchEndsOverEntities, 2, "Two entities recieved TouchEnd");
    });
    
    test("stopKeyPropagation", function() {
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
      Crafty.keyboardDispatch(mockEvent);
      Crafty.selected = false;
      
      ok(stopPropCalled, "stopPropagation Not Called");
      ok(preventDefaultCalled, "preventDefault Not Called");
    });
})();