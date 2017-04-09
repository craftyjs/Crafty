/** CRAFTY-JS **/
global.Crafty = require('../../src/crafty-headless.js')();
Crafty.init();

/** COMMON TEST CODE **/
require('./common.js');

/** ALL THE TESTS **/
require('./core/core.js');
require('./spatial/2d.js');
require('./debug/logging.js');
require('./controls/controls.js');
require('./core/events.js');
require('./spatial/math.js');
require('./core/model.js');
require('./core/storage.js');
require('./core/systems.js');
require('./core/time.js');
require('./core/tween.js');
require('./spatial/collision.js');
require('./spatial/sat.js');
require('./spatial/spatial-grid.js');
require('./spatial/raycast.js');
