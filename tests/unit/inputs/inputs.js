(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Inputs");

  test("AreaMap", function(_) {
    var areaMapEvents = 0;
    var e = Crafty.e("2D, DOM, AreaMap").bind("NewAreaMap", function(
      newAreaMap
    ) {
      areaMapEvents++;
    });

    var poly = new Crafty.polygon([50, 0, 100, 100, 0, 100]);
    e.areaMap(poly);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(e.mapArea !== poly, "Hitbox is a clone of passed polygon");

    var arr = [50, 0, 100, 100, 0, 100];
    e.areaMap(arr);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");
    _.ok(
      e.mapArea.points && e.mapArea.points !== arr,
      "Array used in hitbox is a clone of passed array"
    );

    e.areaMap(50, 0, 100, 100, 0, 100);
    _.ok(e.mapArea instanceof Crafty.polygon, "Hitbox is a polygon");

    _.strictEqual(areaMapEvents, 3, "NewAreaMap event triggered 3 times");
  });

  test("AreaMap's layer correctly tracks pointer entities on destruction", function(_) {
    var e = Crafty.e("2D, Mouse, DOM, Color");
    var layer = Crafty.s("DefaultDOMLayer");
    _.strictEqual(layer._pointerEntities, 1, "Single entity when created");
    e.destroy();
    _.strictEqual(
      layer._pointerEntities,
      0,
      "Zero pointer entities when destroyed"
    );
  });

  test("AreaMap's layer correctly tracks pointer entities when removing components", function(_) {
    var e = Crafty.e("2D, Mouse, DOM, Color");
    var layer = Crafty.s("DefaultDOMLayer");
    _.strictEqual(layer._pointerEntities, 1, "Single entity when created");
    e.removeComponent("AreaMap");
    _.strictEqual(
      layer._pointerEntities,
      0,
      "Zero pointer entities once component is removed"
    );
    e.destroy();
    _.strictEqual(
      layer._pointerEntities,
      0,
      "Zero pointer entities when destroyed"
    );
  });

  test("Layer correctly tracks pointer entities on AreaMap component addition", function(_) {
    var e = Crafty.e("2D, DOM, Color");
    var layer = Crafty.s("DefaultDOMLayer");
    _.strictEqual(
      layer._pointerEntities,
      0,
      "No entities before component is added"
    );
    e.addComponent("AreaMap");
    _.strictEqual(
      layer._pointerEntities,
      1,
      "Single entity after component is added"
    );
  });

  test("AreaMap's layer correctly tracks pointer entities on layer addition", function(_) {
    var e = Crafty.e("2D, AreaMap, Color");
    var layer = Crafty.s("DefaultDOMLayer");
    _.strictEqual(
      layer._pointerEntities,
      0,
      "No entities before layer is added"
    );
    e.addComponent("DOM");
    _.strictEqual(
      layer._pointerEntities,
      1,
      "Single entity after layer is added"
    );
  });

  // mock-phantom-touch-events is a PhantomJS plugin, thus the test below is skipped if enviroment is not PhantomJS
  if (navigator.userAgent.indexOf("PhantomJS") !== -1)
    test("Multitouch simulation", function(_) {
      Crafty.multitouch(true);

      var touchStartsOverEntities = 0,
        touchEndsOverEntities = 0;
      Crafty.e("2D, Renderable, DOM, Touch")
        .setName("EntityA")
        .attr({ x: 100, y: 100, w: 200, h: 200, z: 1 })
        .bind("TouchOver", function() {
          touchStartsOverEntities++;
        })
        .bind("TouchOut", function() {
          touchEndsOverEntities++;
        });
      Crafty.e("2D, Renderable, DOM, Touch")
        .setName("EntityB")
        .attr({ x: 40, y: 150, w: 90, h: 300, z: 2 })
        .bind("TouchOver", function() {
          touchStartsOverEntities++;
        })
        .bind("TouchOut", function() {
          touchEndsOverEntities++;
        });
      var elem = Crafty.stage.elem,
        sx = Crafty.stage.x,
        sy = Crafty.stage.y,
        touchStart1 = createTouchEvent(elem, "touchstart", [
          [100 + sx, 80 + sy, 0],
          [150 + sx, 150 + sy, 1],
          [200 + sx, 50 + sy, 2],
          [65 + sx, 275 + sy, 3]
        ]),
        touchEnd1 = createTouchEvent(elem, "touchend", [
          [65 + sx, 275 + sy, 3]
        ]),
        touchEnd2 = createTouchEvent(elem, "touchend", [
          [200 + sx, 50 + sy, 2]
        ]),
        touchStart2 = createTouchEvent(elem, "touchstart", [
          [100 + sx, 80 + sy, 4]
        ]),
        touchEnd3 = createTouchEvent(elem, "touchend", [
          [150 + sx, 150 + sy, 1]
        ]),
        touchMove1 = createTouchEvent(elem, "touchmove", [
          [150 + sx, 150 + sy, 4]
        ]),
        touchEnd4 = createTouchEvent(elem, "touchend", [
          [100 + sx, 80 + sy, 0]
        ]),
        touchMove2 = createTouchEvent(elem, "touchmove", [
          [100 + sx, 80 + sy, 4]
        ]),
        touchEnd5 = createTouchEvent(elem, "touchend", [
          [100 + sx, 80 + sy, 4]
        ]);

      var touchPoint,
        touchPoints = Crafty.s("Touch").touchPoints;

      /** touchStart1 **/
      touchStart1();
      _.strictEqual(
        touchPoints.length,
        4,
        "Four fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 1
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 1);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");
      // id 2
      touchPoint = touchPoints[2];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 2);
      _.strictEqual(touchPoint.realX, 200);
      _.strictEqual(touchPoint.realY, 50);
      _.strictEqual(touchPoint.target, null);
      // id 3
      touchPoint = touchPoints[3];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 3);
      _.strictEqual(touchPoint.realX, 65);
      _.strictEqual(touchPoint.realY, 275);
      _.strictEqual(touchPoint.target.getName(), "EntityB");

      /** touchEnd1 **/
      touchEnd1();
      _.strictEqual(
        touchPoints.length,
        3,
        "Three fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 1
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 1);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");
      // id 2
      touchPoint = touchPoints[2];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 2);
      _.strictEqual(touchPoint.realX, 200);
      _.strictEqual(touchPoint.realY, 50);
      _.strictEqual(touchPoint.target, null);

      /** touchEnd2 **/
      touchEnd2();
      _.strictEqual(
        touchPoints.length,
        2,
        "Two fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 1
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 1);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");

      /** touchStart2 **/
      touchStart2();
      _.strictEqual(
        touchPoints.length,
        3,
        "Three fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 1
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 1);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");
      // id 4
      touchPoint = touchPoints[2];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 4);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);

      /** touchEnd3 **/
      touchEnd3();
      _.strictEqual(
        touchPoints.length,
        2,
        "Two fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 4
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 4);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);

      /** touchMove1 **/
      touchMove1();
      _.strictEqual(
        touchPoints.length,
        2,
        "Two fingers currently touching stage"
      );
      // id 0
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchStart");
      _.strictEqual(touchPoint.identifier, 0);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);
      // id 4
      touchPoint = touchPoints[1];
      _.strictEqual(touchPoint.eventName, "TouchMove");
      _.strictEqual(touchPoint.identifier, 4);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");

      /** touchEnd4 **/
      touchEnd4();
      _.strictEqual(
        touchPoints.length,
        1,
        "One finger currently touching stage"
      );
      // id 4
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchMove");
      _.strictEqual(touchPoint.identifier, 4);
      _.strictEqual(touchPoint.realX, 150);
      _.strictEqual(touchPoint.realY, 150);
      _.strictEqual(touchPoint.target.getName(), "EntityA");

      /** touchMove2 **/
      touchMove2();
      _.strictEqual(
        touchPoints.length,
        1,
        "One finger currently touching stage"
      );
      // id 4
      touchPoint = touchPoints[0];
      _.strictEqual(touchPoint.eventName, "TouchMove");
      _.strictEqual(touchPoint.identifier, 4);
      _.strictEqual(touchPoint.realX, 100);
      _.strictEqual(touchPoint.realY, 80);
      _.strictEqual(touchPoint.target, null);

      /** touchEnd5 **/
      touchEnd5();
      _.strictEqual(
        touchPoints.length,
        0,
        "No fingers currently touching stage"
      );

      _.strictEqual(
        touchStartsOverEntities,
        3,
        "Two entities received TouchStart, one received it twice"
      );
      _.strictEqual(
        touchEndsOverEntities,
        3,
        "Two entities received TouchEnd, one received it twice"
      );
    });

  test("stopKeyPropagation", function(_) {
    var stopPropCalled = false;
    var preventDefaultCalled = false;

    var mockEvent = {
      char: "",
      charCode: "",
      keyCode: "",
      type: "",
      shiftKey: "",
      ctrlKey: "",
      metaKey: "",
      timestamp: "",
      target: document,
      stopPropagation: function() {
        stopPropCalled = true;
      },
      preventDefault: function() {
        preventDefaultCalled = true;
      },
      cancelBubble: false,
      returnValue: false
    };

    var origSelected = Crafty.selected;
    Crafty.selected = true;
    Crafty.s("Keyboard").processEvent(mockEvent);
    Crafty.selected = origSelected;

    _.ok(stopPropCalled, "stopPropagation Not Called");
    _.ok(preventDefaultCalled, "preventDefault Not Called");
  });
})();
