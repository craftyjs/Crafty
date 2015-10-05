var Crafty = require('../core/core.js');


/**@
 * #Crafty.log
 * @category Debug
 *
 * @sign Crafty.log( arguments )
 * @param arguments - arguments which are passed to `console.log`
 *
 * This is a simple wrapper for `console.log`.  You can disable logging messages by setting `Crafty.loggingEnabled` to false.
 * It is recommended to use `Crafty.log`, as `console.log` can crash on IE9.
 */
/**@
 * #Crafty.error
 * @category Debug
 *
 * @sign Crafty.error( arguments )
 * @param arguments - arguments which are passed to `console.error`
 *
 * This is a simple wrapper for `console.error`.  You can disable logging messages by setting `Crafty.loggingEnabled` to false.
 * It is recommended to use `Crafty.error`, as `console.error` can crash on IE9.
 */
Crafty.extend({
	// Allow logging to be disabled
	loggingEnabled: true,
	// In some cases console.log doesn't exist, so provide a wrapper for it
	log: function() {
		if (Crafty.loggingEnabled && console && console.log) {
			console.log.apply(console, arguments);
		}
	},
	error: function() {
		if (Crafty.loggingEnabled && console && console.error) {
			console.error.apply(console, arguments);
		}
	}
});