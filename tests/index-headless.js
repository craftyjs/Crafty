/** CRAFTY-JS **/
Crafty = require('../src/crafty-headless.js')();
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