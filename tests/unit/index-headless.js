/** CRAFTY-JS **/
global.craftyFactory = require('../../src/crafty-headless.js');
global.Crafty = global.craftyFactory();

/** TEST CODE THAT RUNS IN NODE **/
require('./core/instances.js');

/** COMMON TEST CODE THAT RUNS IN BROWSER AND NODE **/
require('./index-common.js');
