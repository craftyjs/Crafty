window.addEventListener('load', function() {
    // signal to webdriver
    window.signalBarrier = function(label) {
        Crafty.one('PostRender', function() {
          var div = document.createElement('div');
          div.setAttribute('id', label);
          document.body.appendChild(div);
        });
    };

    // wait for webdriver signal
    var barrierCallbacks = window.barrierCallbacks = {};
    var barrierSignals = window.barrierSignals = {};
    window.waitBarrier = function(label, callback) {
      if (barrierSignals[label]) { // signal already received, trigger callback immediately
        callback.call(null);
      } else { // signal not yet received, register callback for later
        var callbacks = barrierCallbacks[label] || (barrierCallbacks[label] = []);
        callbacks.push(callback);
      }
    };
    window.triggerBarrierSignal = function(label) {
      // set signal as received
      barrierSignals[label] = true;
      // trigger registered callbacks for incoming signal
      var callbacks, callback;
      if ((callbacks = barrierCallbacks[label])) {
        while ((callback = callbacks.pop()))
          callback.call(null);
      }
    };

    // lowest common denominator of resolutions across all platforms -> QVGA (240x320) in landscape
    Crafty.init(320, 240);
    Crafty.background('rgb(127,127,127)');
});