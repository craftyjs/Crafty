(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("Model");

  test('Set triggers change events', function(_) {
    var fox, results = [];
    Crafty.c('Animal', {
      name: 'Fox',
      contact: {
        email: 'fox@example.com',
        phone: '555-555-4545'
      }
    });

    fox = Crafty.e('Animal, Model');

    fox.bind('Change', function() {
      results.push('Change');
    });
    fox.bind('Change[name]', function() {
      results.push('Change[name]');
    });
    fox.bind('Change[contact.email]', function() {
      results.push('Change[contact.email]');
    });

    fox.attr({name: 'Lucky'});
    fox.attr({contact: {email: 'foxxy@example.com'}}, false, true);

    _.deepEqual(results, [
      'Change[name]',
      'Change',
      'Change[contact.email]',
      'Change'
    ]);

  });

  test('Dirty', function(_) {
    var fox;
    Crafty.c('Animal', {
      name: 'Fox',
      dob: 'March 21',
      age: 24
    });

    fox = Crafty.e('Animal, Model');

    _.strictEqual(fox.is_dirty(), false);
    _.strictEqual(fox.is_dirty('name'), false);
    _.strictEqual(fox.is_dirty('age'), false);

    fox.attr('name', 'Lucky');
    fox.attr('dob', 'March 22');

    _.strictEqual(fox.is_dirty(), true);
    _.strictEqual(fox.is_dirty('name'), true);
    _.strictEqual(fox.is_dirty('age'), false);

    _.deepEqual(fox.changed, ['name', 'dob']);
  });
})();
