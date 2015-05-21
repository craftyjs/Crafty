var Crafty = require('../core/core.js');


/**@
 * #Crafty.log
 * @category Debug
 *
 * @sign Crafty.log( arguments )
 * @param arguments - arguments which are passed to `console.log`
 * 
 * This is a simple wrapper for `console.log`.  You can disable logging messages by setting `Crafty.loggingEnabled` to false.
 */

Crafty.extend({
	// Allow logging to be disabled
	loggingEnabled: true,
	// In some cases console.log doesn't exist, so provide a wrapper for it
	log: function() {
		if (Crafty.loggingEnabled && console && console.log) {
			console.log.apply(this, arguments);
		}
	}
});