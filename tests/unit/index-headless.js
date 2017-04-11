/** CRAFTY-JS **/
global.Crafty = require('../../src/crafty-headless.js')();
Crafty.init();

/** COMMON TEST CODE THAT RUNS IN BROWSER AND NODE **/
require('./index-common.js');
