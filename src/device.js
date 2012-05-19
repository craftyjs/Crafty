Crafty.extend({
	/**@
	* #Crafty.device
	* @category Utilities
	*/
	device : {
		_deviceOrientationCallback : false,

		/**
		 * The HTML5 DeviceOrientation event returns three pieces of data:
		 *  * alpha the direction the device is facing according to the compass
		 *  * beta the angle in degrees the device is tilted front-to-back
		 *  * gamma the angle in degrees the device is tilted left-to-right.
		 *  * The angles values increase as you tilt the device to the right or towards you.
		 * 
		 * Since Firefox uses the MozOrientationEvent which returns similar data but 
		 * using different parameters and a different measurement system, we want to 
		 * normalize that before we pass it to our _deviceOrientationCallback function.
		 * 
		 * @param eventData HTML5 DeviceOrientation event
		 */
		_normalizeDeviceOrientation : function(ctx, eventData) {
			var data;
			if (window.DeviceOrientationEvent) {
				data = {
					// gamma is the left-to-right tilt in degrees, where right is positive
					'tiltLR'	:	eventData.gamma,
					// beta is the front-to-back tilt in degrees, where front is positive
					'tiltFB'	: 	eventData.beta,
					// alpha is the compass direction the device is facing in degrees
					'dir' 		: 	eventData.alpha,
					// deviceorientation does not provide this data
					'motUD' 	: 	null
				}
			} else if (window.OrientationEvent) {
				data = {
					// x is the left-to-right tilt from -1 to +1, so we need to convert to degrees
					'tiltLR'	:	eventData.x * 90,
                    // y is the front-to-back tilt from -1 to +1, so we need to convert to degrees
                    // We also need to invert the value so tilting the device towards us (forward) 
                    // results in a positive value. 
					'tiltFB'	: 	eventData.y * -90,
					// MozOrientation does not provide this data
					'dir' 		: 	null,
					// z is the vertical acceleration of the device
					'motUD' 	: 	eventData.z
				}
			}

			ctx._deviceOrientationCallback(data);
		},

        /**@
        * #Crafty.device.deviceOrientation
        * @comp Crafty.device
        * @sign public Crafty.device.deviceOrientation(Function callback)
        * @param callback - Callback method executed once as soon as device orientation is change
        * 
        * Do something with normalized device orientation data:
        * ~~~
        * {
        *   'tiltLR'    :   'gamma the angle in degrees the device is tilted left-to-right.',
        *   'tiltFB'    :   'beta the angle in degrees the device is tilted front-to-back',
        *   'dir'       :   'alpha the direction the device is facing according to the compass',
        *   'motUD'     :   'The angles values increase as you tilt the device to the right or towards you.'
        * }
        * ~~~
        * 
        * @example
        * ~~~
        * // Get DeviceOrientation event normalized data.
        * Crafty.device.deviceOrientation(function(data){
        *     console.log('data.tiltLR : '+Math.round(data.tiltLR)+', data.tiltFB : '+Math.round(data.tiltFB)+', data.dir : '+Math.round(data.dir)+', data.motUD : '+data.motUD+'');
        * });
        * ~~~
        * 
        * See browser support at http://caniuse.com/#search=device orientation.
        */
		deviceOrientation : function(func) {
			this._deviceOrientationCallback = func;
			if (Crafty.support.deviceorientation) {
				if (window.DeviceOrientationEvent) {
				  // Listen for the deviceorientation event and handle DeviceOrientationEvent object
				  Crafty.addEvent(this, window, 'deviceorientation', this._normalizeDeviceOrientation);
				} else if (window.OrientationEvent) {
				  // Listen for the MozOrientation event and handle OrientationData object
				  Crafty.addEvent(this, window, 'MozOrientation', this._normalizeDeviceOrientation)
				}
			}
		}
	}
});
