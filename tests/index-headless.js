/** CRAFTY-JS **/
global.Crafty = require('../src/crafty-headless.js')();
Crafty.init();

/** COMMON TEST CODE **/
require('./common.js');

/** ALL THE TESTS **/
require('./core.js');
require('./2d.js');
require('./logging.js');
require('./controls.js');
require('./events.js');
require('./math.js');
require('./model.js');
require('./storage.js');
require('./systems.js');
require('./time.js');
require('./tween.js');
require('./2D/collision/collision.js');
require('./2D/collision/sat.js');
require('./2D/spatial-grid.js');
require('./2D/raycast.js');
