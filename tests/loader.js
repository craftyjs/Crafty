module('Loader', {
  setup: function() {
    // prepare something for all following tests
  },
  teardown: function() {
    // clean up after each test
    Crafty("*").destroy();
  }
});

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