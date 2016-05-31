(function() {
  var module = QUnit.module;


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
        Math.cos(41 * Math.PI / 180),
        -Math.sin(41 * Math.PI / 180) // y-axis is inverted in Crafty
      ).normalize();
  var ANGLE_NEG_22_5 = new Crafty.math.Vector2D(
        Math.cos(-22.5 * Math.PI / 180),
        -Math.sin(-22.5 * Math.PI / 180) // y-axis is inverted in Crafty
      ).normalize();
  var ANGLE_NEG_1 = new Crafty.math.Vector2D(
        Math.cos(-1 * Math.PI / 180),
        -Math.sin(-1 * Math.PI / 180) // y-axis is inverted in Crafty
      ).normalize();


  //////////////////////
  // UTILITY FUNCTIONS
  //////////////////////

  function createEntity (cellX, cellY, cellWidth, cellHeight) {
    cellX = cellX || 0;
    cellY = cellY || 0;
    cellWidth = cellWidth || 1;
    cellHeight = cellHeight || 1;

    var e = Crafty.e("2D, Collision").attr({
      x: cellX * cellsize + 1,
      y: cellY * cellsize + 1,
      w: cellWidth * cellsize - 2,
      h: cellHeight * cellsize - 2,
    });

    return e;
  }

  function diagonalDistance (diffX, diffY) {
    var dX = diffX * cellsize + 1,
    dY = diffY * cellsize + 1;

    return Math.sqrt(dX * dX + dY * dY);
  }

  function checkResults (origin, direction, raycastResults, expectedResults) {
    strictEqual(raycastResults.length, Object.keys(expectedResults).length, "expected ids count must match");

    var actualId, actualDistance, expectedDistance,
        actualIntersectionX, expectedIntersectionX,
        actualIntersectionY, expectedIntersectionY;
    for (var i = 0, l = raycastResults.length; i < l; ++i) {
      actualId = raycastResults[i].obj[0];
      actualDistance = raycastResults[i].distance;
      actualIntersectionX = raycastResults[i].x;
      actualIntersectionY = raycastResults[i].y;
      expectedDistance = expectedResults[actualId];
      expectedIntersectionX = origin._x + expectedDistance * direction.x;
      expectedIntersectionY = origin._y + expectedDistance * direction.y;

      ok(typeof expectedResults[actualId] !== 'undefined', "actual id is among expected ids");
      strictEqual(actualDistance.toFixed(2), expectedDistance.toFixed(2),  "actual distance matches expected distance");
      strictEqual(actualIntersectionX.toFixed(2), expectedIntersectionX.toFixed(2), "actual intersection point x matches expected intersection point x");
      strictEqual(actualIntersectionY.toFixed(2), expectedIntersectionY.toFixed(2), "actual intersection point y matches expected intersection point y");
    }
  }

  //////////////////////
  // TESTS
  //////////////////////

  module("Raycast");

  var mapSize = 64 * 5;

  var LEFT = {_x: 0, _y: mapSize / 2};
  var RIGHT = {_x: mapSize, _y: mapSize / 2};
  var TOP = {_x: mapSize/2, _y: 0};
  var BOTTOM = {_x: mapSize / 2, _y: mapSize};
  var TOP_LEFT = {_x: 0, _y: 0};
  var TOP_RIGHT = {_x: mapSize, _y: 0};
  var BOTTOM_LEFT = {_x: 0, _y: mapSize};
  var BOTTOM_RIGHT = {_x: mapSize, _y: mapSize};

  test("Check multiple hits", function() {
    var origin, direction,
        expectedResults = {},
        e, f,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║E║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║F║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    expectedResults = {};
    e = createEntity(0, 0); expectedResults[e[0]] = diagonalDistance(0, 0);
    f = createEntity(4, 4); expectedResults[f[0]] = diagonalDistance(4, 4);

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║E║X║X║X║X║
        ╠═╬═╬═╬═╬═╣
        ║X║ ║X║X║X║
        ╠═╬═╬═╬═╬═╣
        ║X║X║ ║X║X║
        ╠═╬═╬═╬═╬═╣
        ║X║X║X║ ║X║
        ╠═╬═╬═╬═╬═╣
        ║X║X║X║X║F║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    expectedResults = {};
    e = createEntity(0, 0); expectedResults[e[0]] = diagonalDistance(0, 0);
    f = createEntity(4, 4); expectedResults[f[0]] = diagonalDistance(4, 4);
    var temps = [];
    for (var i = 0; i < 5; ++i)
      for (var j = 0; j < 5; ++j)
        if (i !== j)
          temps.push(createEntity(i, j));

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
    for (i = 0; i < temps.length; ++i) {
      temps[i].destroy();
    }


    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║:║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    expectedResults = {};
    e = createEntity(1,1); expectedResults[e[0]] = diagonalDistance(1, 1);
    f = createEntity(1,1); expectedResults[f[0]] = diagonalDistance(1, 1);

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
  });


  test("Check big entity hits", function() {
    var origin, direction,
        expectedResults = {},
        e, f,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║E║E║E║E║E║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    expectedResults = {};
    e = createEntity(0, 4, 5, 1); expectedResults[e[0]] = diagonalDistance(4,4);

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║F║F║F║F║F║
        ╠═╬═╬═╬═╬═╣
        ║F║F║F║F║F║
        ╠═╬═╬═╬═╬═╣
        ║F║F║F║F║F║
        ╠═╬═╬═╬═╬═╣
        ║F║F║F║F║F║
        ╠═╬═╬═╬═╬═╣
        ║E║E║E║E║E║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    expectedResults = {};
    e = createEntity(0, 4, 5, 1); expectedResults[e[0]] = diagonalDistance(4,4);
    f = createEntity(0, 0, 4, 5); expectedResults[f[0]] = diagonalDistance(0,0);

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
  });


  test("Check diagonal hits", function() {
    var origin, direction,
        expectedResults = {},
        e,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║E║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)
    */
    expectedResults = {};
    e = createEntity(2, 2); expectedResults[e[0]] = diagonalDistance(2, 2);

    /*
     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (320,0)
    Direction = (-1,1)
    */
    origin = TOP_RIGHT;
    direction = SOUTH_WEST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (0,320)
    Direction = (1,-1)
    */
    origin = BOTTOM_LEFT;
    direction = NORTH_EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (320,320)
    Direction = (-1,-1)
    */
    origin = BOTTOM_RIGHT;
    direction = NORTH_WEST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);


    e.destroy();
  });


  test("Check vert/horiz hits", function() {
    var origin, direction,
        expectedResults = {},
        e,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║E║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)
    */
    expectedResults = {};
    e = createEntity(2, 2); expectedResults[e[0]] = diagonalDistance(2, 0);

    /*
     -----
    | Ray |
     -----
    Origin = (0,160)
    Direction = (1,0)
    */
    origin = LEFT;
    direction = EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (320,160)
    Direction = (-1,0)
    */
    origin = RIGHT;
    direction = WEST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (160,0)
    Direction = (0,1)
    */
    origin = TOP;
    direction = SOUTH;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (160,320)
    Direction = (0,-1)
    */
    origin = BOTTOM;
    direction = NORTH;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);


    e.destroy();
  });


  test("Check no hits", function() {
    var origin, direction,
        expectedResults = {},
        e,
        results;


    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║E║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)
    */
    expectedResults = {};
    e = createEntity(2, 2);

    /*
     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (-1,-1)
    */
    origin = TOP_LEFT;
    direction = NORTH_WEST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (320,0)
    Direction = (1,1)
    */
    origin = TOP_RIGHT;
    direction = SOUTH_EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (0,320)
    Direction = (1,1)
    */
    origin = BOTTOM_LEFT;
    direction = SOUTH_EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (0,160)
    Direction = (-1,0)
    */
    origin = LEFT;
    direction = WEST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (160,320)
    Direction = (0,1)
    */
    origin = BOTTOM;
    direction = SOUTH;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     -----
    | Ray |
     -----
    Origin = (-1000,-1000)
    Direction = (0.75,-0.66)
    */
    origin = {_x: -1000, _y: -1000};
    direction = ANGLE_POS_41;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)
    */
    e.destroy();
    expectedResults = {};

    /*
     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,1)
    */
    origin = TOP_LEFT;
    direction = SOUTH_EAST;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);
  });


  test("Check colinear hits", function() {
    var origin, direction,
        expectedResults = {},
        e,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║E║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,0)
    */
    origin = {_x: 0, _y: 1};
    direction = {x: 1, y: 0};

    expectedResults = {};
    e = createEntity(2, 0); expectedResults[e[0]] = diagonalDistance(2, 0);

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();

    /*
     ------
    | Grid |
     ------
    (-320,-320)  (0,-320)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║E║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║^║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (-320,0)     (0,0)

     -----
    | Ray |
     -----
    Origin = (-192+1, -96-1)
    Direction = (0,1)
    */
    origin = {_x: -3 * cellsize + 1, _y: -1.5 * cellsize - 1};
    direction = {x: 0, y: -1};

    expectedResults = {};
    e = createEntity(-3, -4); expectedResults[e[0]] = 1.5 * cellsize;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
  });


  test("Check first hit", function() {
    var origin, direction,
        expectedResults = {},
        e, f, g, h,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║h║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║g║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║f║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║E║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,320)
    Direction = (1,-1)
    */
    origin = BOTTOM_LEFT;
    direction = NORTH_EAST;

    expectedResults = {};
    e = createEntity(1, 3, 1, 1); expectedResults[e[0]] = diagonalDistance(1, 1);
    f = createEntity(2, 2, 1, 1);
    g = createEntity(3, 1, 1, 1);
    h = createEntity(4, 0, 1, 1);

    results = Crafty.raycast(origin, direction, -Infinity);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
    g.destroy();
    h.destroy();
  });


  test("Check maxDistance hits", function() {
    var origin, direction,
        expectedResults = {},
        e, f, g, h,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║h║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║g║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║F║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║E║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,320)
    Direction = (1,-1)
    */
    origin = BOTTOM_LEFT;
    direction = NORTH_EAST;

    expectedResults = {};
    e = createEntity(1, 3, 1, 1); expectedResults[e[0]] = diagonalDistance(1, 1);
    f = createEntity(2, 2, 1, 1);
    g = createEntity(3, 1, 1, 1);
    h = createEntity(4, 0, 1, 1);

    results = Crafty.raycast(origin, direction, diagonalDistance(2,2)-1);
    checkResults(origin, direction, results, expectedResults);

    expectedResults[f[0]] = diagonalDistance(2, 2);
    results = Crafty.raycast(origin, direction, diagonalDistance(2,2));
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
    g.destroy();
    h.destroy();
  });


  test("Check component filter", function() {
    var origin, direction,
        expectedResults = {},
        e, f, g, h,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║h║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║G║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║f║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║E║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,320)
    Direction = (1,-1)
    */
    origin = BOTTOM_LEFT;
    direction = NORTH_EAST;

    expectedResults = {};
    e = createEntity(1, 3, 1, 1); e.addComponent("RAY"); expectedResults[e[0]] = diagonalDistance(1, 1);
    f = createEntity(2, 2, 1, 1);
    g = createEntity(3, 1, 1, 1); g.addComponent("RAY"); expectedResults[g[0]] = diagonalDistance(3, 3);
    h = createEntity(4, 0, 1, 1);

    results = Crafty.raycast(origin, direction, "RAY");
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
    g.destroy();
    h.destroy();
  });


  test("Check origin within entity", function() {
    var origin, direction,
        expectedResults = {},
        e, f,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║e║F║e║e║E║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (32,32)
    Direction = (1,0)
    */
    origin = {_x: cellsize / 2, _y: cellsize / 2};
    direction = EAST;

    expectedResults = {};
    e = createEntity(0, 0, 5, 5);
    f = createEntity(1, 0, 1, 1);

    expectedResults[f[0]] = 0.5 * cellsize + 1;
    results = Crafty.raycast(origin, direction, -Infinity);
    checkResults(origin, direction, results, expectedResults);

    expectedResults[e[0]] = 4.5 * cellsize - 1;
    results = Crafty.raycast(origin, direction, Infinity);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
  });


  test("Check intersection at 0 distance", function() {
    var origin, direction,
        expectedResults = {},
        e, f,
        results;

    /*
     ------
    | Grid |
     ------
    (0,-320)   (320,-320)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║F║F║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║F║:║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║\║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,0)      (320,0)

     -----
    | Ray |
     -----
    Origin = (192-1,-128-1)
    Direction = (-1,-1)
    */
    origin = {_x: 3*cellsize - 1, _y: -2*cellsize - 1};
    direction = NORTH_WEST;

    expectedResults = {};
    e = createEntity(2, -3, 1, 1); expectedResults[e[0]] = 0;

    results = Crafty.raycast(origin, direction, -Infinity);
    checkResults(origin, direction, results, expectedResults);

    f = createEntity(1, -4, 2, 2); expectedResults[f[0]] = 0;
    results = Crafty.raycast(origin, direction, Infinity);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
  });


  test("Check result sorting", function() {
    var origin, direction,
        expectedResults = {},
        e, f, g, h,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║-║F║G║H║E║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (32,32)
    Direction = (0.99, 0.01)
    */
    origin = {_x: cellsize / 2, _y: cellsize / 2};
    direction = ANGLE_NEG_1;

    expectedResults = {};
    e = createEntity(0, 0, 5, 1);
    f = createEntity(0, 0, 2, 1);
    g = createEntity(0, 0, 3, 1);
    h = createEntity(3, 0, 1, 1);

    // with sorting explicitly disabled
    results = Crafty.raycast(origin, direction, false);
    strictEqual(results.length, 4, "all entities found");

    strictEqual(results[0].obj[0], e[0], "entity e reported first");
    strictEqual(results[1].obj[0], f[0], "entity f reported second");
    strictEqual(results[2].obj[0], g[0], "entity g reported third");
    strictEqual(results[3].obj[0], h[0], "entity h reported fourth");

    // with sorting enabled - this should be default case
    results = Crafty.raycast(origin, direction);
    strictEqual(results.length, 4, "all entities found");

    strictEqual(results[0].obj[0], f[0], "entity f first hit with ray");
    ok(results[0].distance > 0.5*cellsize, "entity f first hit with ray");
    strictEqual(results[0].x, f.x + f.w, "entity f first hit with ray");
    ok(results[0].y > cellsize/32, "entity f first hit with ray");

    strictEqual(results[1].obj[0], g[0], "entity g second hit with ray");
    ok(results[1].distance > results[0].distance, "entity g second hit with ray");
    ok(results[1].distance > 1.5*cellsize, "entity g second hit with ray");
    strictEqual(results[1].x, g.x + g.w, "entity g second hit with ray");
    ok(results[1].y > results[0].y, "entity g second hit with ray");

    strictEqual(results[2].obj[0], h[0], "entity h third hit with ray");
    ok(results[2].distance > results[1].distance, "entity h third hit with ray");
    ok(results[2].distance > 2.5*cellsize, "entity h third hit with ray");
    strictEqual(results[2].x, h.x, "entity h third hit with ray");
    ok(results[2].y > results[1].y, "entity h third hit with ray");

    strictEqual(results[3].obj[0], e[0], "entity e fourth hit with ray");
    ok(results[3].distance > results[2].distance, "entity e fourth hit with ray");
    ok(results[3].distance > 3.5*cellsize, "entity e fourth hit with ray");
    strictEqual(results[3].x, e.x + e.w, "entity e fourth hit with ray");
    ok(results[3].y > results[2].y, "entity e fourth hit with ray");

    e.destroy();
    f.destroy();
    g.destroy();
    h.destroy();
  });


  test("Check intersection with hitbox outside entity (CBR)", function() {
    var origin, direction,
        expectedResults = {},
        e, f, g,
        results;

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║e║E║F║G║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║f║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,0)
    Direction = (1,0)
    */
    origin = LEFT;
    direction = EAST;

    expectedResults = {};
    e = createEntity(0, 2, 2, 1).collision([
          cellsize, 0,
          2*cellsize-2, 0,
          2*cellsize-2, cellsize-2,
          cellsize, cellsize-2
        ]);
    expectedResults[e[0]] = 1*cellsize + 1;

    f = createEntity(2, 3, 1, 1).collision([
      0, -cellsize,
      cellsize-2, -cellsize,
      cellsize-2, -2,
      0, -2
    ]);
    //TODO remove this once new hitbox updates entry in map
    f.x++;
    f.x--;
    expectedResults[f[0]] = 2*cellsize + 1;

    g = createEntity(3, 2, 1, 1);
    expectedResults[g[0]] = 3*cellsize + 1;

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();
    g.destroy();
  });


  test("Check more complex scenarios", function() {
    var origin, direction,
        expectedResults = {},
        e, f,
        dX, dY,
        results;


    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║E║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║f║f║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║/║f║f║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (256,0)
    Direction = (1,-1)
    */
    origin = {_x: 0, _y: 256};
    direction = NORTH_EAST;

    expectedResults = {};
    e = createEntity(3, 0, 1, 1); expectedResults[e[0]] = diagonalDistance(3, 3);
    f = Crafty.e("2D, Collision").attr({ x: 112, y: 176, w: 32, h: 32 });

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║ ║ ║ ║ ║E║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║f║f║ ║
        ╠═╬═╬═╬═╬═╣
        ║/║ ║f║f║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╠═╬═╬═╬═╬═╣
        ║ ║ ║ ║ ║ ║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (0,192)
    Direction = (2,-1)
    */
    origin = {_x: 0, _y: 192};
    direction = new Crafty.math.Vector2D(2, -1).normalize();

    expectedResults = {};
    e = createEntity(4, 0, 1, 1);
    // intersection with e at (258, 63)
    dX = 258 - 0;
    dY = 63 - 192;
    expectedResults[e[0]] = Math.sqrt(dX * dX + dY * dY);
    f = Crafty.e("2D, Collision").attr({ x: 176, y: 112, w: 32, h: 32 });

    results = Crafty.raycast(origin, direction);
    checkResults(origin, direction, results, expectedResults);

    e.destroy();
    f.destroy();

    /*
     ------
    | Grid |
     ------
    (0,0)        (320,0)
        ╔═╦═╦═╦═╦═╗
        ║\║F║e║e║e║
        ╠═╬═╬═╬═╬═╣
        ║e║e║e║e║e║
        ╠═╬═╬═╬═╬═╣
        ║e║e║e║e║e║
        ╠═╬═╬═╬═╬═╣
        ║e║e║e║e║e║
        ╠═╬═╬═╬═╬═╣
        ║e║e║e║e║e║
        ╚═╩═╩═╩═╩═╝
    (0,320)      (320,320)

     -----
    | Ray |
     -----
    Origin = (32,32)
    Direction = (0.924, 0.3827)
    */
    origin = {_x: cellsize / 2, _y: cellsize / 2};
    direction = ANGLE_NEG_22_5;

    expectedResults = {};
    e = createEntity(0, 0, 5, 5);
    f = createEntity(1, 0, 1, 1);

    results = Crafty.raycast(origin, direction, -Infinity);

    strictEqual(results.length, 1, "only first entity found");
    strictEqual(results[0].obj[0], f[0], "entity f hit with ray");
    ok(results[0].distance > cellsize/2 + 1, "distance greater than x-difference");
    ok(results[0].distance < diagonalDistance(0.5, 0.5), "distance less than diagonal distance");
    strictEqual(results[0].x, f.x, "x intersection point same as f's left side");
    ok(results[0].y > f.y + 0.5 *f.h, "y intersection point lower than f's center");
    ok(results[0].y < f.y + 0.75*f.h, "y intersection point higher than 3/4 of f's height");

    e.destroy();
    f.destroy();
  });


  test("Check a complex scenario constructed in playground", function() {
    var origin, direction, magnitude,
        expectedResults = {},
        results;


    Crafty.e('2D, Collision')
          .setName('Trapezoid')
          .attr({w: 200, h: 100})
          .origin('center')
          .collision(new Crafty.polygon([50, 0, 0, 100, 200, 100, 150, 0]))
          .attr({x: 53, y: -177, rotation: -175});

    Crafty.e('2D, Collision')
          .setName('Parallelogram')
          .attr({w: 100, h: 100})
          .origin('center')
          .collision(new Crafty.polygon([0, 0, 25, 100, 100, 100, 75, 0]))
          .attr({x: -44, y: -206, rotation: 0});

    Crafty.e('2D, Collision')
          .setName('Triangle')
          .attr({w: 300, h: 100})
          .origin('center')
          .collision(new Crafty.polygon([25, 75, 250, 25, 275, 50]))
          .attr({x: -96, y: -130, rotation: -107});

    Crafty.e('2D, Collision')
          .setName('CBR')
          .attr({w: 100, h: 100})
          .origin('center')
          .collision(new Crafty.polygon([75, -25, 125, -25, 125, 25, 75, 25]))
          .attr({x: -23, y: -204, rotation: 14});

    origin = {_x: 161, _y: 60.98333740234375};
    direction = new Crafty.math.Vector2D(22 - origin._x, -241.01666259765625 - origin._y);
    magnitude = direction.magnitude();
    direction.normalize();

    expectedResults = {};
    results = Crafty.raycast(origin, direction, magnitude);
    checkResults(origin, direction, results, expectedResults);
  });

})();