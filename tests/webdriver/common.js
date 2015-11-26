window.addEventListener('load', function() {
    window.signalBarrier = function(label) {
        Crafty.one('PostRender', function() {
          var div = document.createElement('div');
          div.setAttribute('id', label);
          document.body.appendChild(div);
        });
    };

    // lowest common denominator of resolutions across all platforms -> QVGA (240x320) in landscape
    Crafty.init(320, 240);
    Crafty.background('rgb(127,127,127)');
});