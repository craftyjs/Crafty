(function() {
  module('Loader');

  asyncTest('assets loading', function() {
    expect(1);

    var onload;

    Crafty.load(['assets/100x100.png'], function() {
      ok(typeof onload !== 'undefined' && onload.src.match('assets/100x100.png'), '100x100.png has been loaded');
      start();
    }, function(data) {
      onload = data;
    });
  });
})();