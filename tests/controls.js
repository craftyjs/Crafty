(function() {
    module("Controls");
    
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