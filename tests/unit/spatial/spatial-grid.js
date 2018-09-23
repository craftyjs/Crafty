(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  var cellsize = 64;

  var EAST = new Crafty.math.Vector2D(1, 0).normalize();
  var WEST = new Crafty.math.Vector2D(-1, 0).normalize();
  var SOUTH = new Crafty.math.Vector2D(0, 1).normalize();
  var NORTH = new Crafty.math.Vector2D(0, -1).normalize();
  var SOUTH_EAST = new Crafty.math.Vector2D(1, 1).normalize();
  var NORTH_EAST = new Crafty.math.Vector2D(1, -1).normalize();
  var SOUTH_WEST = new Crafty.math.Vector2D(-1, 1).normalize();
  var NORTH_WEST = new Crafty.math.Vector2D(-1, -1).normalize();

  var ANGLE_POS_41 = new Crafty.math.Vector2D(
    Math.cos((41 * Math.PI) / 180),
    -Math.sin((41 * Math.PI) / 180) // y-axis is inverted in Crafty
  ).normalize();
  var ANGLE_NEG_22_5 = new Crafty.math.Vector2D(
    Math.cos((-22.5 * Math.PI) / 180),
    -Math.sin((-22.5 * Math.PI) / 180) // y-axis is inverted in Crafty
  ).normalize();
  var ANGLE_POS_112_5 = new Crafty.math.Vector2D(
    Math.cos((112.5 * Math.PI) / 180),
    -Math.sin((112.5 * Math.PI) / 180) // y-axis is inverted in Crafty
  ).normalize();

  //////////////////////
  // UTILITY FUNCTIONS
  //////////////////////

  function createObj(cellX, cellY, cellWidth, cellHeight) {
    cellX = cellX || 0;
    cellY = cellY || 0;
    cellWidth = cellWidth || 1;
    cellHeight = cellHeight || 1;

    return {
      _x: cellX * cellsize + 1,
      _y: cellY * cellsize + 1,
      _w: cellWidth * cellsize - 2,
      _h: cellHeight * cellsize - 2
    };
  }

  function insertEntry(cellX, cellY, cellWidth, cellHeight) {
    return Crafty.map.insert(createObj(cellX, cellY, cellWidth, cellHeight));
  }

  function refreshEntry(entry, cellX, cellY, cellWidth, cellHeight) {
    cellX = cellX || 0;
    cellY = cellY || 0;
    cellWidth = cellWidth || 1;
    cellHeight = cellHeight || 1;

    entry.obj._x = cellX * cellsize + 1;
    entry.obj._y = cellY * cellsize + 1;
    entry.obj._w = cellWidth * cellsize - 2;
    entry.obj._h = cellHeight * cellsize - 2;

    Crafty.map.refresh(entry);
  }

  function removeEntry(entry) {
    Crafty.map.remove(entry);
  }

  function checkHashKeys(entry, cellX, cellY, cellWidth, cellHeight) {
    var keys = entry.keys;
    cellX = cellX || 0;
    cellY = cellY || 0;
    cellWidth = cellWidth || 1;
    cellHeight = cellHeight || 1;

    QUnit.assert.strictEqual(
      keys.x1 + cellWidth - 1,
      keys.x2,
      "entity should occupy cellWidth cells in x-axis"
    );
    QUnit.assert.strictEqual(
      keys.y1 + cellHeight - 1,
      keys.y2,
      "entity should occupy cellHeight cells in y-axis"
    );
    QUnit.assert.strictEqual(
      keys.x1,
      cellX,
      "cell col start index should match"
    );
    QUnit.assert.strictEqual(
      keys.y1,
      cellY,
      "cell row start index should match"
    );
    QUnit.assert.strictEqual(
      keys.x2,
      cellX + cellWidth - 1,
      "cell col end index should match"
    );
    QUnit.assert.strictEqual(
      keys.y2,
      cellY + cellHeight - 1,
      "cell row end index should match"
    );
  }

  function createEntity(cellX, cellY, cellWidth, cellHeight) {
    cellX = cellX || 0;
    cellY = cellY || 0;
    cellWidth = cellWidth || 1;
    cellHeight = cellHeight || 1;

    var e = Crafty.e("2D, Collision").attr({
      x: cellX * cellsize + 1,
      y: cellY * cellsize + 1,
      w: cellWidth * cellsize - 2,
      h: cellHeight * cellsize - 2
    });

    return e;
  }

  //////////////////////
  // TESTS
  //////////////////////

  module("Spatial map");

  test("HashMap - constructor", function(_) {
    // TODO test constructor with different cellsize
    var newMap = new Crafty.HashMap();
    _.notDeepEqual(newMap, Crafty.map, "Properties are different");

    newMap.__SOME_PROPERTY__ = "__SOME_PROPERTY__";
    _.strictEqual(
      newMap.__SOME_PROPERTY__,
      "__SOME_PROPERTY__",
      "Property set on one instance"
    );
    _.notEqual(
      Crafty.map.__SOME_PROPERTY__,
      "__SOME_PROPERTY__",
      "Property not set on other instance"
    );
  });

  test("HashMap - cell size", function(_) {
    var keys,
      csize = Crafty.HashMap.cellsize();

    _.strictEqual(csize, cellsize, "Check if we work with correct assumptions");

    // returns correct hash keys of obj spanning entire single cell
    keys = Crafty.HashMap.key({
      _x: 0 * csize,
      _w: csize - 1,
      _y: 0 * csize,
      _h: csize - 1
    });
    _.strictEqual(keys.x1, 0, "cell key should start at correct cell col");
    _.strictEqual(keys.y1, 0, "cell key should start at correct cell row");
    _.strictEqual(keys.x2, keys.x1, "cell keys should match 1 cell width");
    _.strictEqual(keys.y2, keys.y1, "cell keys should match 1 cell height");

    // returns correct hash keys of obj spanning multiple cells and overlaps a bit into adjacent cells
    keys = Crafty.HashMap.key({
      _x: -1 * csize,
      _w: 2 * csize, // spans 3 cell cols
      _y: +3 * csize,
      _h: 4 * csize // spans 4 cell rows
    });
    _.strictEqual(keys.x1, -1, "cell key should start at correct cell col");
    _.strictEqual(keys.y1, +3, "cell key should start at correct cell row");
    _.strictEqual(
      keys.x2,
      -1 + 2,
      "cell keys should match barely 3 cell widths"
    );
    _.strictEqual(
      keys.y2,
      +3 + 4,
      "cell keys should match barely 4 cell heights"
    );
  });

  test("HashMap - key", function(_) {
    var keys = {};

    // returns correct hash keys of obj
    var obj = createObj(0, 0, 1, 1);
    keys = Crafty.HashMap.key(obj);
    checkHashKeys({ keys: keys }, 0, 0, 1, 1);

    // returns correct hash keys for prioritized obj._mbr
    obj._mbr = createObj(1, 1, 2, 2);
    keys = Crafty.HashMap.key(obj);
    checkHashKeys({ keys: keys }, 1, 1, 2, 2);

    // returns correct hash keys for prioritized obj._cbr
    obj._cbr = createObj(2, 2, 3, 3);
    keys = Crafty.HashMap.key(obj);
    checkHashKeys({ keys: keys }, 2, 2, 3, 3);

    // reuses keys parameter
    var keys2 = Crafty.HashMap.key(createObj(-10, 3, 5, 7), keys);
    checkHashKeys({ keys: keys2 }, -10, 3, 5, 7);
    _.strictEqual(keys2, keys, "same object");
    _.deepEqual(keys2, keys, "same properties");
  });

  test("Spatial map - entry properly added, removed & shifted", function(_) {
    var found;
    var objToId = function(obj) {
      return obj[0];
    };

    // no entity found in empty map
    found = Crafty.map.search({
      _x: -25 * cellsize,
      _w: 50 * cellsize,
      _y: -25 * cellsize,
      _h: 50 * cellsize
    });

    _.strictEqual(found.length, 0, "no entities should have been found");

    // entity found in map where created
    var e = createEntity(-11, -7, 3, 1);
    found = Crafty.map
      .search({
        _x: -10.5 * cellsize,
        _w: 1,
        _y: -6.5 * cellsize,
        _h: 1
      })
      .map(objToId);

    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // entity found in map after moving
    e.x = 11 * cellsize;
    e.y = 7 * cellsize;
    found = Crafty.map
      .search({
        _x: 11.5 * cellsize,
        _w: 1,
        _y: 7.5 * cellsize,
        _h: 1
      })
      .map(objToId);

    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // both entities found in map
    var f = createEntity(3, -5, 1, 1);
    found = Crafty.map
      .search({
        _x: -25 * cellsize,
        _w: 50 * cellsize,
        _y: -25 * cellsize,
        _h: 50 * cellsize
      })
      .map(objToId);

    _.strictEqual(found.length, 2, "2 entities should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");
    _.ok(found.indexOf(f[0]) >= 0, "entity f found");

    // no entities found in map after destroyed
    e.destroy();
    f.destroy();
    found = Crafty.map.search({
      _x: -25 * cellsize,
      _w: 50 * cellsize,
      _y: -25 * cellsize,
      _h: 50 * cellsize
    });

    _.strictEqual(found.length, 0, "no entities should have been found");
  });

  test("Spatial map integration test - search bounding rectangles", function(_) {
    var found, tx, ty;

    // is rectB within rectA?
    var contains = function(rectA, rectB) {
      return (
        rectB._x >= rectA._x &&
        rectB._x + rectB._w <= rectA._x + rectA._w &&
        rectB._y >= rectA._y &&
        rectB._y + rectB._h <= rectA._y + rectA._h
      );
    };
    var objToId = function(obj) {
      return obj[0];
    };

    // default entity - rectangle
    var e = createEntity(0, 0, 1, 1);
    _.strictEqual(e._mbr, null, "mbr doesn't exist");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point inside hitbox & inside bounds
    tx = 0.5 * cellsize;
    ty = 0.5 * cellsize;
    _.strictEqual(e.isAt(tx, ty), true, "test point inside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), true, "test point inside bounds");

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & outside bounds
    tx = -0.5 * cellsize;
    ty = -0.5 * cellsize;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), false, "test point outside bounds");

    // search at test point does not find entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 0, "no entity should have been found");

    // entity rotated - MBR
    e.origin("center");
    e.rotation = 45;
    _.ok(!!e._mbr, "mbr exists");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point outside hitbox & inside bounds (top-left corner of MBR)
    tx = e._x + e._w / 2 - (e._w / 2) * Math.sqrt(2);
    ty = e._y + e._h / 2 - (e._h / 2) * Math.sqrt(2);
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), true, "test point inside bounds");

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & outside bounds (a bit beyond top-left corner of MBR)
    tx -= 2;
    ty -= 2;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), false, "test point outside bounds");

    // search at test point does not find entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 0, "no entity should have been found");

    // entity with hitbox inside its bounds - MBR
    e.rotation = 90;
    e.collision([
      // collision hitbox relative to 90° clockwise rotated entity
      0,
      0,
      cellsize / 2,
      0,
      cellsize / 2,
      cellsize / 2,
      0,
      cellsize / 2
    ]);
    _.ok(!!e._mbr, "mbr exists");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point inside hitbox & inside bounds
    tx = (3 * cellsize) / 4;
    ty = cellsize / 4;
    _.strictEqual(e.isAt(tx, ty), true, "test point inside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), true, "test point inside bounds");

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & inside bounds
    tx = cellsize / 4;
    ty = cellsize / 4;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), true, "test point inside bounds");

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & outside bounds
    tx = e.x + e.w + 1;
    ty = e.y + e.h + 1;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), false, "test point outside bounds");

    // search at test point does not find entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 0, "no entity should have been found");

    // entity with hitbox outside its bounds - CBR
    e.collision([
      // collision hitbox relative to 90° clockwise rotated entity
      -10.5 * cellsize,
      10.5 * cellsize,
      -10.5 * cellsize,
      5.5 * cellsize,
      -5.5 * cellsize,
      5.5 * cellsize,
      -5.5 * cellsize,
      10.5 * cellsize
    ]);
    _.ok(!!e._mbr, "mbr exists");
    _.ok(!!e._cbr, "cbr exists");
    // TODO remove this after cbr update fixed
    e.x++;
    e.x--;

    // test point inside hitbox & inside bounds
    tx = -7.5 * cellsize;
    ty = -7.5 * cellsize;
    _.strictEqual(e.isAt(tx, ty), true, "test point inside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), false, "test point outside MBR");
    _.strictEqual(
      contains(e._cbr, { _x: tx, _y: ty, _w: 0, _h: 0 }),
      true,
      "test point inside CBR"
    );

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & inside bounds
    tx = cellsize / 2;
    ty = cellsize / 2;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), true, "test point inside MBR");
    _.strictEqual(
      contains(e._cbr, { _x: tx, _y: ty, _w: 0, _h: 0 }),
      true,
      "test point inside CBR"
    );

    // search at test point finds entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 1, "1 entity should have been found");
    _.ok(found.indexOf(e[0]) >= 0, "entity e found");

    // test point outside hitbox & outside bounds
    tx = e.x + e.w + 1;
    ty = e.y + e.h + 1;
    _.strictEqual(e.isAt(tx, ty), false, "test point outside hitbox");
    _.strictEqual(e.contains(tx, ty, 0, 0), false, "test point outside MBR");
    _.strictEqual(
      contains(e._cbr, { _x: tx, _y: ty, _w: 0, _h: 0 }),
      false,
      "test point outside CBR"
    );

    // search at test point does not find entity
    found = Crafty.map
      .search({
        _x: tx,
        _w: 1,
        _y: ty,
        _h: 1
      })
      .map(objToId);
    _.strictEqual(found.length, 0, "no entity should have been found");

    e.destroy();
  });

  test("Spatial map integration test - iterate bounding rectangles", function(_) {
    var found, keysT, keysB, keysH, tx, ty;

    // are keysB within keysA?
    var containsKeys = function(keysA, keysB) {
      return (
        keysB.x1 >= keysA.x1 &&
        keysB.x2 <= keysA.x2 &&
        keysB.y1 >= keysA.y1 &&
        keysB.y2 <= keysA.y2
      );
    };
    var hashKeys = function(x, y, w, h) {
      if (x instanceof Crafty.polygon) {
        // assuming points start at top-left corner
        // [0, 0, this._w, 0, this._w, this._h, 0, this._h]
        h = x.points[5] - x.points[1];
        w = x.points[4] - x.points[0];
        y = x.points[1];
        x = x.points[0];
      } else if (typeof x === "object") {
        h = x._h;
        w = x._w;
        y = x._y;
        x = x._x;
      }

      var keys = {};
      keys.x1 = Math.floor(x / cellsize);
      keys.y1 = Math.floor(y / cellsize);
      keys.x2 = Math.floor((w + x) / cellsize);
      keys.y2 = Math.floor((h + y) / cellsize);

      return keys;
    };

    var addObj = function(obj) {
      found[obj[0]] = true;
    };

    // default entity - rectangle
    var e = createEntity(0, 0, 10, 10);
    _.strictEqual(e._mbr, null, "mbr doesn't exist");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point cell inside hitbox cell & inside bounds cell
    tx = 0.5 * cellsize;
    ty = 0.5 * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      true,
      "test point cell inside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, NORTH_EAST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & outside bounds cell
    tx = -0.5 * cellsize;
    ty = -0.5 * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      false,
      "test point cell outside bounds cell"
    );

    // iteration at test point does not find entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, NORTH_EAST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      0,
      "no entity should have been found"
    );

    // entity rotated - MBR
    e.origin("center");
    e.rotation = 45;
    _.ok(!!e._mbr, "mbr exists");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point cell outside hitbox cell & inside bounds cell (top-left corner of MBR)
    tx = e._x + e._w / 2 - (e._w / 2) * Math.sqrt(2);
    ty = e._y + e._h / 2 - (e._h / 2) * Math.sqrt(2);
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, SOUTH_WEST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & outside bounds cell (a bit beyond top-left corner of MBR)
    tx = (Math.floor(tx / cellsize) - 0.5) * cellsize;
    ty = (Math.floor(ty / cellsize) - 0.5) * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      false,
      "test point cell inside bounds cell"
    );

    // iteration at test point does not find entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, NORTH_WEST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      0,
      "no entity should have been found"
    );

    // entity with hitbox inside its bounds - MBR
    e.rotation = 0;
    e.collision([
      0,
      0,
      cellsize / 2,
      0,
      cellsize / 2,
      cellsize / 2,
      0,
      cellsize / 2
    ]);
    _.ok(!!e._mbr, "mbr exists");
    _.strictEqual(e._cbr, null, "cbr doesn't exist");

    // test point cell inside hitbox cell & inside bounds cell
    tx = (3 * cellsize) / 4;
    ty = cellsize / 4;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      true,
      "test point cell inside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, SOUTH_EAST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & inside bounds cell
    tx = 9.5 * cellsize;
    ty = 9.5 * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, WEST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & outside bounds cell
    tx = (Math.floor((e.x + e.w) / cellsize) + 1.5) * cellsize;
    ty = (Math.floor((e.y + e.h) / cellsize) + 1.5) * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      false,
      "test point cell inside bounds cell"
    );

    // iteration at test point does not find entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, NORTH_EAST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      0,
      "no entity should have been found"
    );

    // entity with hitbox outside its bounds - CBR
    e.collision([
      -10.5 * cellsize,
      -10.5 * cellsize,
      -5.5 * cellsize,
      -10.5 * cellsize,
      -5.5 * cellsize,
      -5.5 * cellsize,
      -10.5 * cellsize,
      -5.5 * cellsize
    ]);
    _.ok(!!e._mbr, "mbr exists");
    _.ok(!!e._cbr, "cbr exists");
    // TODO remove this after cbr update fixed
    e.x++;
    e.x--;

    // test point cell inside hitbox cell & inside bounds cell
    tx = -7.5 * cellsize;
    ty = -7.5 * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      true,
      "test point cell inside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, EAST, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & inside bounds cell
    tx = cellsize / 2;
    ty = cellsize / 2;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      true,
      "test point cell inside bounds cell"
    );

    // iteration at test point finds entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, NORTH, addObj);
    _.strictEqual(
      Object.keys(found).length,
      1,
      "1 entity should have been found"
    );
    _.strictEqual(found[e[0]], true, "entity e found");

    // test point cell outside hitbox cell & outside bounds cell
    tx = (Math.floor((e.x + e.w) / cellsize) + 1.5) * cellsize;
    ty = (Math.floor((e.y + e.h) / cellsize) + 1.5) * cellsize;
    keysT = hashKeys(tx, ty, 0, 0);
    keysH = hashKeys(e.map);
    keysB = hashKeys(e._cbr || e._mbr || e);
    _.strictEqual(
      containsKeys(keysH, keysT),
      false,
      "test point cell outside hitbox cell"
    );
    _.strictEqual(
      containsKeys(keysB, keysT),
      false,
      "test point cell inside bounds cell"
    );

    // iteration at test point does not find entity
    found = {};
    Crafty.map.traverseRay({ _x: tx, _y: ty }, SOUTH, addObj);
    _.strictEqual(
      Object.keys(found).length,
      0,
      "no entity should have been found"
    );

    e.destroy();
  });

  test("Spatial map - boundaries", function(_) {
    var bounds;

    // infinite bounds w/o entities
    bounds = Crafty.map.boundaries();
    _.strictEqual(bounds.min.x, Infinity, "infinite min bound");
    _.strictEqual(bounds.min.y, Infinity, "infinite min bound");
    _.strictEqual(bounds.max.x, -Infinity, "-infinite max bound");
    _.strictEqual(bounds.max.y, -Infinity, "-infinite max bound");

    // bounds = bottom left entity
    var e = createEntity(-5, 3, 1, 1);
    bounds = Crafty.map.boundaries();
    _.strictEqual(
      bounds.min.x,
      e._x,
      "min bound matches entity's top left corner"
    );
    _.strictEqual(
      bounds.min.y,
      e._y,
      "min bound matches entity's top left corner"
    );
    _.strictEqual(
      bounds.max.x,
      e._x + e._w,
      "min bound matches entity's bottom right corner"
    );
    _.strictEqual(
      bounds.max.y,
      e._y + e._h,
      "min bound matches entity's bottom right corner"
    );

    // bounds = bottom left entity + top right entity
    var f = createEntity(3, -5, 1, 1);
    bounds = Crafty.map.boundaries();
    _.strictEqual(bounds.min.x, e._x, "min x matches e's left side");
    _.strictEqual(bounds.min.y, f._y, "min y matches f's top side");
    _.strictEqual(bounds.max.x, f._x + f._w, "max x matches f's right side");
    _.strictEqual(bounds.max.y, e._y + e._h, "max y matches e's bottom side");

    // bounds = bottom left entity + middle entity + top right entity
    var g = createEntity(0, 0, 1, 1);
    bounds = Crafty.map.boundaries();
    _.strictEqual(bounds.min.x, e._x, "min x matches e's left side");
    _.strictEqual(bounds.min.y, f._y, "min y matches f's top side");
    _.strictEqual(bounds.max.x, f._x + f._w, "max x matches f's right side");
    _.strictEqual(bounds.max.y, e._y + e._h, "max y matches e's bottom side");

    // bounds = middle entity
    e.destroy();
    f.destroy();
    bounds = Crafty.map.boundaries();
    _.strictEqual(
      bounds.min.x,
      g._x,
      "min bound matches entity's top left corner"
    );
    _.strictEqual(
      bounds.min.y,
      g._y,
      "min bound matches entity's top left corner"
    );
    _.strictEqual(
      bounds.max.x,
      g._x + g._w,
      "min bound matches entity's bottom right corner"
    );
    _.strictEqual(
      bounds.max.y,
      g._y + g._h,
      "min bound matches entity's bottom right corner"
    );

    // infinite bounds w/o entities
    g.destroy();
    bounds = Crafty.map.boundaries();
    _.strictEqual(bounds.min.x, Infinity, "infinite min bound");
    _.strictEqual(bounds.min.y, Infinity, "infinite min bound");
    _.strictEqual(bounds.max.x, -Infinity, "-infinite max bound");
    _.strictEqual(bounds.max.y, -Infinity, "-infinite max bound");
  });

  test("Spatial map - entry to cell hash", function(_) {
    var e = insertEntry(0, 0, 1, 1);
    checkHashKeys(e, 0, 0, 1, 1);

    // modifying dimension
    refreshEntry(e, 0, 0, 2, 1);
    checkHashKeys(e, 0, 0, 2, 1);

    // moving
    refreshEntry(e, 0, 1, 2, 1);
    checkHashKeys(e, 0, 1, 2, 1);

    var f = insertEntry(-13, 7, 11, 17);
    checkHashKeys(f, -13, 7, 11, 17);

    // moving & modifying dimension
    refreshEntry(f, 3, 1, 23, 9);
    checkHashKeys(f, 3, 1, 23, 9);

    removeEntry(e);
    removeEntry(f);
  });

  test("Spatial map - iteration - finds all entities in order", function(_) {
    /*  (0,0)     (3,0)
           ╔═╦═╦═╦═╗
      e -> ║ ║ ║ ║3║
           ╠═╬═╬═╬═╣
           ║ ║ ║3║2║
           ╠═╬═╬═╬═╣
           ║ ║2║3║ ║
      g ^> ╠═╬═╬═╬═╣
           ║1║1║ ║ ║
           ╚═╩═╩═╩═╝
        h ^>    ^ (3,3)
                f
    */
    var e = createEntity(1, 0, 3, 1);
    var f = createEntity(2, 1, 1, 2);
    var g = createEntity(1, 0, 3, 3);
    var h = createEntity(0, 0, 4, 4);
    var cellEntities = [
      [h[0]], // (0,3)
      [h[0]], // (1,3)
      [h[0], g[0]], // (1,2)
      [h[0], g[0], f[0]], // (2,2)
      [h[0], g[0], f[0]], // (2,1)
      [h[0], g[0]], // (3,1)
      [h[0], g[0], e[0]] // (3,0)
    ];

    var oldCellDistance = -Infinity,
      cellNo = 0;

    Crafty.map.traverseRay(
      { _x: 0 + 1, _y: 4 * cellsize - 1 },
      ANGLE_POS_41,
      function(obj, previousCellDistance) {
        if (previousCellDistance !== oldCellDistance) {
          cellNo++;
          oldCellDistance = previousCellDistance;
        }

        var idx = cellEntities[cellNo].indexOf(obj[0]);
        _.ok(idx >= 0, "expected entity inside cell found");
        cellEntities[cellNo].splice(idx, 1);
      }
    );

    for (var i = 0; i < cellEntities.length; ++i) {
      _.strictEqual(
        cellEntities[i].length,
        0,
        "all entities inside cell have been found"
      );
    }

    e.destroy();
    f.destroy();
    g.destroy();
    h.destroy();
  });

  test("Spatial map - iteration - can be cancelled", function(_) {
    var e = createEntity(-4, -2, 10, 5); // entity that spans multiple cells
    var origin = { _x: -4.25 * cellsize, _y: -2.25 * cellsize - 10 };
    var direction = ANGLE_NEG_22_5;

    var objFound = false,
      objCount = 0,
      cellCount = 0;

    var oldCellDistance = -Infinity;
    Crafty.map.traverseRay(origin, direction, function(
      obj,
      previousCellDistance
    ) {
      if (previousCellDistance !== oldCellDistance) {
        cellCount++;
        oldCellDistance = previousCellDistance;
      }
      objCount++;

      if (cellCount === 1 && objCount === 1) {
        objFound = true;
        return true; // cancel iteration
      }
    });

    _.strictEqual(objFound, true, "object has been iterated over");
    _.strictEqual(cellCount, 1, "iteration ended in next-from-origin cell");
    _.strictEqual(objCount, 1, "iteration ended after 1st object");

    e.destroy();
  });

  test("Spatial map - iteration - previousDistance is monotonically non-decreasing per cell", function(_) {
    var e = insertEntry(-10, -10, 20, 20);
    var oldCellDistance, iteratedOnce;

    oldCellDistance = -Infinity;
    iteratedOnce = false;
    Crafty.map.traverseRay(
      { _x: 10 * cellsize, _y: 10 * cellsize },
      NORTH_WEST,
      function(obj, previousCellDistance) {
        _.ok(
          previousCellDistance >= oldCellDistance,
          "distance is monotonically non-decreasing while advancing cells diagonally"
        );
        iteratedOnce = true;
        oldCellDistance = previousCellDistance;
      }
    );
    _.strictEqual(
      iteratedOnce,
      true,
      "iteration iterated over at least one object"
    );

    oldCellDistance = -Infinity;
    iteratedOnce = false;
    Crafty.map.traverseRay(
      { _x: -3.5 * cellsize, _y: -1.1 * cellsize },
      ANGLE_POS_112_5,
      function(obj, previousCellDistance) {
        if (previousCellDistance !== -Infinity) {
          _.ok(
            previousCellDistance > oldCellDistance,
            "distance is strictly monotonically increasing while advancing cells non-diagonally"
          );
          iteratedOnce = true;
        }
        oldCellDistance = previousCellDistance;
      }
    );
    _.strictEqual(
      iteratedOnce,
      true,
      "iteration iterated over at least one object"
    );

    removeEntry(e);
  });
})();
